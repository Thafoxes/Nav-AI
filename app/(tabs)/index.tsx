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
import Map from '@/components/Map';
import SearchBar from '@/components/SearchBar';
import VoiceAssistant from '@/components/VoiceAssistant';
import { useHotwordDetection } from '@/hooks/useHotwordDetection';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isVoiceAssistantVisible, setIsVoiceAssistantVisible] = useState(false);
  const [destination, setDestination] = useState('Pavilion Kuala Lumpur');
  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestionOverlay, setShowSuggestionOverlay] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<{
    title: string;
    location: string;
    distance: string;
  } | null>(null);

  const overlayTranslateY = useSharedValue(SCREEN_HEIGHT);

  // Initialize hotword detection
  useHotwordDetection(() => {
    setIsVoiceAssistantVisible(true);
    Speech.speak("How can I help you?", {
      language: 'en',
      pitch: 1,
      rate: 0.9,
    });
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: overlayTranslateY.value }],
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMoving(Math.random() > 0.5);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showOverlay = (suggestion: string) => {
    let location = '';
    let distance = '';

    if (suggestion.toLowerCase().includes('petrol')) {
      location = 'Petronas Jalan Tun Razak';
      distance = '1.2 km away';
    } else if (suggestion.toLowerCase().includes('rest stop')) {
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

  const handleVoiceCommand = (command: string) => {
    showOverlay(command);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, isDark && styles.darkContainer]}>
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
            <CornerUpRight 
              size={36} 
              color="#62A56E" 
              strokeWidth={2.5}
              style={styles.turnIcon} 
            />
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

        <TouchableOpacity
          style={[styles.voiceButton, isDark && styles.darkVoiceButton]}
          onPress={() => setIsVoiceAssistantVisible(true)}
          activeOpacity={0.8}>
          <View style={styles.voiceButtonContent}>
            <Mic
              size={40}
              color={isVoiceAssistantVisible ? "#FF3B30" : "#ffffff"}
              strokeWidth={2}
            />
            <View style={styles.voiceButtonTextContainer}>
              <Text style={styles.voiceButtonText}>
                Press or Say
              </Text>
              <Text style={styles.highlightedText}>
                Hey Nava!
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <VoiceAssistant
          isVisible={isVoiceAssistantVisible}
          onClose={() => setIsVoiceAssistantVisible(false)}
          onSendMessage={handleVoiceCommand}
        />

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
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnIcon: {
    marginRight: 12,
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