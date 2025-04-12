import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Mic, X, ChevronRight, Send } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'typing' | 'complete';
  action?: {
    type: string;
    payload?: Record<string, any>;
  };
}

interface VoiceAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

const suggestions = [
  "Navigate to nearest petrol station",
  "Call passenger",
  "Avoid tolls",
  "Change route to avoid traffic",
  "Report road incident",
  "Find nearest rest stop",
  "Thank you"
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SILENCE_THRESHOLD = -50;
const SILENCE_DURATION = 1500;

const WELCOME_MESSAGE = "Hello! I'm your voice assistant. How can I help you today?";
const FAREWELL_MESSAGE = "You're welcome! Have a great trip!";

export default function VoiceAssistant({ isVisible, onClose, onSendMessage }: VoiceAssistantProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [pressedSuggestion, setPressedSuggestion] = useState<string | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const micScale = useSharedValue(1);
  const micOpacity = useSharedValue(1);
  const overlayTranslateY = useSharedValue(SCREEN_HEIGHT);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
    opacity: micOpacity.value,
  }));

  useEffect(() => {
    if (isListening) {
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.ease }),
          withTiming(1, { duration: 1000, easing: Easing.ease })
        ),
        -1
      );
      micOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.ease }),
          withTiming(1, { duration: 1000, easing: Easing.ease })
        ),
        -1
      );
    } else {
      micScale.value = withTiming(1);
      micOpacity.value = withTiming(1);
    }
  }, [isListening]);

  useEffect(() => {
    if (isVisible) {
      setMessages([
        {
          id: '1',
          text: WELCOME_MESSAGE,
          isUser: false,
          timestamp: new Date(),
          status: 'complete',
        },
      ]);

      Speech.speak(WELCOME_MESSAGE, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        volume: 1.0,
        ...Platform.select({
          ios: {
            voice: 'com.apple.ttsbundle.Samantha-compact',
            quality: Speech.VoiceQuality.Enhanced,
          }
        })
      });
    }
  }, [isVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      Speech.stop();
    };
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Audio.requestPermissionsAsync();
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      }
      setIsListening(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Listening...",
        isUser: true,
        timestamp: new Date(),
        status: 'typing'
      }]);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopListening = async () => {
    try {
      if (Platform.OS !== 'web' && recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setIsListening(false);
      setIsProcessing(true);
      
      const transcribedText = "Navigate to nearest petrol station";
      handleMessage(transcribedText);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleMessage = async (text: string) => {
    if (text.toLowerCase() === 'thank you') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: FAREWELL_MESSAGE,
        isUser: false,
        timestamp: new Date(),
        status: 'complete'
      }]);
      
      await Speech.speak(FAREWELL_MESSAGE, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        volume: 1.0,
        ...Platform.select({
          ios: {
            voice: 'com.apple.ttsbundle.Samantha-compact',
            quality: Speech.VoiceQuality.Enhanced,
          }
        })
      });
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
      return;
    }

    setMessages(prev => prev.map(msg => 
      msg.status === 'typing' ? {
        ...msg,
        text,
        status: 'complete'
      } : msg
    ));

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: "Thinking...",
      isUser: false,
      timestamp: new Date(),
      status: 'typing'
    }]);

    let response = '';
    let action = null;

    if (text.toLowerCase().includes('nearest petrol station')) {
      response = "I'll help you find the nearest petrol station. Would you like me to navigate there?";
      action = {
        type: 'SHOW_NAVIGATION_OVERLAY',
        payload: {
          location: 'Petronas Jalan Tun Razak',
          distance: '1.2 km away'
        }
      };
    } else if (text.toLowerCase().includes('nearest rest stop')) {
      response = "I found a rest stop nearby. Would you like me to navigate there?";
      action = {
        type: 'SHOW_NAVIGATION_OVERLAY',
        payload: {
          location: 'R&R Ayer Keroh',
          distance: '2.3 km away'
        }
      };
    } else {
      response = "I'll help you with that request.";
    }

    setTimeout(async () => {
      setMessages(prev => prev.map(msg => 
        msg.status === 'typing' ? {
          ...msg,
          text: response,
          status: 'complete',
          action
        } : msg
      ));

      setIsProcessing(false);
      
      await Speech.speak(response, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        volume: 1.0,
        ...Platform.select({
          ios: {
            voice: 'com.apple.ttsbundle.Samantha-compact',
            quality: Speech.VoiceQuality.Enhanced,
          }
        })
      });

      if (action) {
        onSendMessage(text);
      }
    }, 2000);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setPressedSuggestion(suggestion);
    setSelectedSuggestion(suggestion);
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: suggestion,
      isUser: true,
      timestamp: new Date(),
      status: 'complete'
    }]);
    
    // Add a small delay to show the pressed state
    setTimeout(() => {
      setPressedSuggestion(null);
      handleMessage(suggestion);
    }, 150);
  };

  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 50 : 100}
      style={[styles.container, !isVisible && styles.hidden]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={[styles.content, isDark && styles.darkContent]}>
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.darkText]}>Voice Assistant</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>

          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={[styles.suggestionsTitle, isDark && styles.darkText]}>
                Try saying:
              </Text>
              <ChevronRight 
                size={20} 
                color={isDark ? '#ffffff' : '#000000'} 
                style={styles.scrollIndicator}
              />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
              decelerationRate="fast"
              snapToInterval={200}
              style={styles.suggestionsScrollView}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    isDark && styles.darkSuggestionChip,
                    selectedSuggestion === suggestion && styles.selectedSuggestion,
                    pressedSuggestion === suggestion && styles.pressedSuggestion,
                    pressed && styles.pressedSuggestion
                  ]}>
                  <Text style={[
                    styles.suggestionText,
                    isDark && styles.darkText,
                    (selectedSuggestion === suggestion || pressedSuggestion === suggestion) && styles.selectedSuggestionText
                  ]}>
                    "{suggestion}"
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.assistantMessage,
                  isDark && (message.isUser ? styles.darkUserMessage : styles.darkAssistantMessage),
                ]}>
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.assistantMessageText,
                  isDark && styles.darkText
                ]}>
                  {message.text}
                </Text>
                {message.status === 'typing' && (
                  <View style={styles.typingIndicator}>
                    <Text style={[styles.typingDot, isDark && styles.darkTypingDot]}>•</Text>
                    <Text style={[styles.typingDot, isDark && styles.darkTypingDot]}>•</Text>
                    <Text style={[styles.typingDot, isDark && styles.darkTypingDot]}>•</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <Animated.View style={[styles.micButtonContainer, micAnimatedStyle]}>
              <TouchableOpacity
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
                style={[
                  styles.micButton,
                  isListening && styles.micButtonActive,
                  isProcessing && styles.micButtonDisabled,
                ]}>
                <Mic
                  size={32}
                  color={isListening ? '#ffffff' : isDark ? '#ffffff' : '#000000'}
                />
              </TouchableOpacity>
            </Animated.View>
            <Text style={[styles.micStatus, isDark && styles.darkText]}>
              {isListening ? 'Tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: 'transparent',
  },
  hidden: {
    display: 'none',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  darkContent: {
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  scrollIndicator: {
    marginLeft: 8,
    opacity: 0.5,
  },
  suggestionsScrollView: {
    paddingLeft: 16,
  },
  suggestionsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(98, 165, 110, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(98, 165, 110, 0.2)',
    transform: [{ scale: 1 }],
  },
  darkSuggestionChip: {
    backgroundColor: 'rgba(98, 165, 110, 0.2)',
    borderColor: 'rgba(98, 165, 110, 0.3)',
  },
  selectedSuggestion: {
    backgroundColor: '#62A56E',
    borderColor: '#62A56E',
  },
  pressedSuggestion: {
    backgroundColor: '#4E8457',
    borderColor: '#4E8457',
    transform: [{ scale: 0.95 }],
  },
  suggestionText: {
    color: '#62A56E',
    fontSize: 15,
    fontStyle: 'italic',
  },
  selectedSuggestionText: {
    color: '#ffffff',
    fontStyle: 'normal',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#62A56E',
    borderBottomRightRadius: 4,
  },
  darkUserMessage: {
    backgroundColor: '#62A56E',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  darkAssistantMessage: {
    backgroundColor: '#333333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#ffffff',
  },
  assistantMessageText: {
    color: '#000000',
  },
  typingIndicator: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typingDot: {
    fontSize: 24,
    color: '#62A56E',
    marginRight: 2,
    opacity: 0.7,
  },
  darkTypingDot: {
    color: '#ffffff',
  },
  inputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  micButtonContainer: {
    marginBottom: 12,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#62A56E',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micStatus: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
});