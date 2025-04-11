import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Star, Send, X, CornerUpRight, Mic, Radio, Check } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Map from '@/components/Map';
import SearchBar from '@/components/SearchBar';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isListening, setIsListening] = useState(false);
  const [destination, setDestination] = useState('Pavilion Kuala Lumpur');
  const [isMoving, setIsMoving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSuggestionOverlay, setShowSuggestionOverlay] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<{
    title: string;
    location: string;
    distance: string;
  } | null>(null);
  
  const micScale = useSharedValue(1);
  const micOpacity = useSharedValue(1);
  const overlayTranslateY = useSharedValue(SCREEN_HEIGHT);

  const suggestions = [
    "Navigate to nearest petrol station",
    "Call passenger",
    "Avoid tolls",
    "Change route to avoid traffic",
    "Show estimated arrival time",
    "Report road incident",
    "Find nearest rest stop",
    "Switch to fastest route",
    "Clear message"
  ];

  const bottomSheetHeight = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(bottomSheetHeight.value) }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: overlayTranslateY.value }],
    };
  });

  const micAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: micScale.value }],
      opacity: micOpacity.value,
    };
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1
      );
      micOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1
      );
    } else {
      micScale.value = withTiming(1);
      micOpacity.value = withTiming(1);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isListening) {
      setMessages([]);
      setUserInput('');
    }
  }, [isListening]);

  const showOverlay = (suggestion: string) => {
    let location = '';
    let distance = '';

    if (suggestion.includes('petrol')) {
      location = 'Petronas Jalan Tun Razak';
      distance = '1.2 km away';
    } else if (suggestion.includes('rest stop')) {
      location = 'R&R Ayer Keroh';
      distance = '2.3 km away';
    }

    if (location) {
      setCurrentSuggestion({
        title: suggestion,
        location,
        distance,
      });
      setShowSuggestionOverlay(true);
      overlayTranslateY.value = withSpring(0);
    }
  };

  const hideOverlay = () => {
    overlayTranslateY.value = withSpring(SCREEN_HEIGHT);
    setTimeout(() => {
      setShowSuggestionOverlay(false);
      setCurrentSuggestion(null);
    }, 300);
  };

  const handleOverlayAction = (accepted: boolean) => {
    if (accepted && currentSuggestion) {
      setDestination(currentSuggestion.location);
    }
    hideOverlay();
  };

  const speakMessage = async (text: string) => {
    try {
      if (isSpeaking) {
        await Speech.stop();
      }

      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const closeVoiceAssistant = () => {
    Keyboard.dismiss();
    setIsListening(false);
    bottomSheetHeight.value = 0;
    setIsRecording(false);
  };

  const toggleVoiceAssistant = () => {
    const newIsListening = !isListening;
    setIsListening(newIsListening);
    if (newIsListening) {
      bottomSheetHeight.value = -400;
      setTimeout(() => {
        Speech.speak('How can I help you?');
      }, 500);
    } else {
      Keyboard.dismiss();
      bottomSheetHeight.value = 0;
      setIsRecording(false);
    }
  };

  const clearMessages = async () => {
    setMessages([]);
    const response = "Messages cleared.";
    setTimeout(async () => {
      await speakMessage(response);
    }, 500);
  };

  const sendMessage = async (text: string = userInput) => {
    if (text.trim()) {
      if (text.toLowerCase() === 'clear message') {
        await clearMessages();
        setUserInput('');
        Keyboard.dismiss();
        return;
      }

      setMessages([...messages, { text, isUser: true }]);
      
      let response = "I'll help you with that request.";
      if (text.toLowerCase().includes('petrol')) {
        response = "I found the nearest petrol station. Would you like to go?";
        showOverlay(text);
      } else if (text.toLowerCase().includes('rest stop')) {
        response = "I found the nearest rest stop. Would you like to go?";
        showOverlay(text);
      } else if (text.toLowerCase().includes('call')) {
        response = "Initiating call with your passenger.";
      } else if (text.toLowerCase().includes('toll')) {
        response = "Route updated to avoid toll roads. This may increase your journey time by 5 minutes.";
      }

      setTimeout(async () => {
        setMessages(prev => [...prev, { text: response, isUser: false }]);
        await speakMessage(response);
      }, 1000);

      setUserInput('');
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMoving(Math.random() > 0.5);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        {isListening && (
          <Pressable
            style={styles.backdrop}
            onPress={closeVoiceAssistant}
          />
        )}

        <View style={styles.mapContainer}>
          <Map
            center={{ lat: 3.1478, lng: 101.6953 }}
            zoom={14}
          />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <View style={[styles.tripInfo, isDark && styles.darkTripInfo]}>
          <View style={styles.destinationContainer}>
            <CornerUpRight size={20} color="#62A56E" style={styles.turnIcon} />
            <View>
              <Text style={[styles.tripText, isDark && styles.darkText]}>
                {destination}
              </Text>
              <Text style={styles.distanceText}>2.5 km • 12 min</Text>
            </View>
          </View>
          {isMoving && (
            <Text style={styles.movingText}>Vehicle in motion - Voice only</Text>
          )}
        </View>

        <View style={[styles.micIconContainer, isDark && styles.darkMicIconContainer]}>
          <Mic size={24} color="#62A56E" />
        </View>

        <TouchableOpacity
          style={[styles.voiceButton, isDark && styles.darkVoiceButton]}
          onPress={toggleVoiceAssistant}
          activeOpacity={0.8}>
          <Animated.View style={[styles.voiceButtonInner, micAnimatedStyle]}>
            <View style={styles.voiceButtonContent}>
              <Mic
                size={40}
                color={isListening ? "#FF3B30" : "#ffffff"}
                strokeWidth={2}
              />
              <View style={styles.voiceButtonTextContainer}>
                <Text style={styles.voiceButtonText}>
                  Press or Say
                </Text>
                <Text style={styles.highlightedText}>
                  Hey Nav!
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bottomSheet,
            isDark && styles.darkBottomSheet,
            animatedStyles,
          ]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 100}
            style={styles.blurContainer}>
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={[styles.assistantTitle, isDark && styles.darkText]}>
                  Voice Assistant
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeVoiceAssistant}>
                  <X size={24} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionChip, isDark && styles.darkSuggestionChip]}
                      onPress={() => handleSuggestionPress(suggestion)}>
                      <Text style={[styles.suggestionText, isDark && styles.darkText]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageContainer,
                      message.isUser ? styles.userMessage : styles.aiMessage,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.aiMessageText,
                      ]}>
                      {message.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, isDark && styles.darkTextInput]}
                  value={userInput}
                  onChangeText={setUserInput}
                  placeholder="Type your message..."
                  placeholderTextColor={isDark ? '#666666' : '#999999'}
                  onSubmitEditing={() => sendMessage()}
                />
                <TouchableOpacity
                  style={[styles.micButton, isRecording && styles.micButtonActive]}
                  onPress={isRecording ? () => setIsRecording(false) : () => setIsRecording(true)}>
                  <Mic
                    size={24}
                    color={isRecording ? '#ffffff' : isDark ? '#ffffff' : '#000000'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, !userInput && styles.sendButtonDisabled]}
                  onPress={() => sendMessage()}
                  disabled={!userInput}>
                  <Send
                    size={20}
                    color={userInput ? '#62A56E' : isDark ? '#666666' : '#999999'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {showSuggestionOverlay && currentSuggestion && (
          <Animated.View
            style={[
              styles.suggestionOverlay,
              isDark && styles.darkSuggestionOverlay,
              overlayAnimatedStyle,
            ]}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 50 : 100}
              style={styles.overlayBlur}>
              <View style={styles.overlayContent}>
                <Text style={[styles.overlayTitle, isDark && styles.darkText]}>
                  {currentSuggestion.location}
                </Text>
                <Text style={[styles.overlayDistance, isDark && styles.darkText]}>
                  {currentSuggestion.distance}
                </Text>
                <View style={styles.overlayButtons}>
                  <TouchableOpacity
                    style={[styles.overlayButton, styles.acceptButton]}
                    onPress={() => handleOverlayAction(true)}>
                    <Check size={24} color="#ffffff" />
                    <Text style={styles.overlayButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.overlayButton, styles.declineButton]}
                    onPress={() => handleOverlayAction(false)}>
                    <X size={24} color="#ffffff" />
                    <Text style={styles.overlayButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnIcon: {
    marginRight: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#62A56E',
    marginTop: 2,
  },
  darkText: {
    color: '#ffffff',
  },
  tripInfo: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkTripInfo: {
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
  },
  tripText: {
    fontSize: 16,
    color: '#000000',
  },
  movingText: {
    color: '#FA4162',
    fontSize: 14,
    marginTop: 5,
  },
  voiceButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    width: 200,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#62A56E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  darkVoiceButton: {
    backgroundColor: '#62A56E',
  },
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  voiceButtonTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
  },
  highlightedText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 22,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: -400,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: 'transparent',
  },
  darkBottomSheet: {
    backgroundColor: 'rgba(40, 40, 40, 0.98)',
  },
  blurContainer: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  assistantTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  suggestionsContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(98, 165, 110, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#62A56E',
  },
  darkSuggestionChip: {
    backgroundColor: 'rgba(98, 165, 110, 0.2)',
  },
  suggestionText: {
    color: '#62A56E',
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  chatContentContainer: {
    paddingVertical: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#62A56E',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 25,
    padding: 5,
    marginTop: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    color: '#000000',
  },
  darkTextInput: {
    color: '#ffffff',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  micButtonActive: {
    backgroundColor: '#62A56E',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  micIconContainer: {
    position: 'absolute',
    top: 250,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkMicIconContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
  },
  suggestionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkSuggestionOverlay: {
    backgroundColor: 'rgba(40, 40, 40, 0.98)',
  },
  overlayBlur: {
    padding: 20,
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000000',
  },
  overlayDistance: {
    fontSize: 18,
    marginBottom: 24,
    color: '#666666',
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#62A56E',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  overlayButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});