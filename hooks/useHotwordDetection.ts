import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const HOTWORD = 'hey nava';
const CONFIDENCE_THRESHOLD = 0.8;

export function useHotwordDetection(onHotwordDetected: () => void) {
  const [isListening, setIsListening] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<AnalyserNode | null>(null);
  
  // Web platform implementation
  if (Platform.OS === 'web') {
    const { transcript, resetTranscript, listening } = useSpeechRecognition({
      commands: [
        {
          command: HOTWORD,
          callback: () => {
            onHotwordDetected();
            resetTranscript();
          },
          isFuzzyMatch: true,
          fuzzyMatchingThreshold: CONFIDENCE_THRESHOLD,
        },
      ],
    });

    useEffect(() => {
      const startListening = async () => {
        try {
          await SpeechRecognition.startListening({ continuous: true });
          setIsListening(true);
          
          // Initialize Web Audio API for visualization
          if (!audioContext.current && window.AudioContext) {
            audioContext.current = new AudioContext();
            analyzer.current = audioContext.current.createAnalyser();
            analyzer.current.fftSize = 2048;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.current.createMediaStreamSource(stream);
            source.connect(analyzer.current);
          }
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
        }
      };

      if (!isListening && SpeechRecognition.browserSupportsSpeechRecognition()) {
        startListening();
      }

      return () => {
        if (isListening) {
          SpeechRecognition.stopListening();
          setIsListening(false);
          
          // Cleanup audio context
          if (audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
            analyzer.current = null;
          }
        }
      };
    }, [isListening]);

    return {
      isListening: listening,
      transcript,
    };
  }

  // Native platforms implementation
  useEffect(() => {
    let isMounted = true;

    const startNativeListening = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const newRecording = new Audio.Recording();
        recording.current = newRecording;

        await newRecording.prepareToRecordAsync({
          android: {
            extension: '.wav',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        });

        await newRecording.startAsync();
        setIsListening(true);

        // Monitor audio levels
        newRecording.setOnRecordingStatusUpdate(status => {
          if (status.isRecording && status.metering !== undefined) {
            const level = Math.pow(10, status.metering / 20);
            
            // Detect voice activity
            if (level > 0.1) {
              if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
              }
            } else {
              // Start silence timer
              if (!silenceTimer.current) {
                silenceTimer.current = setTimeout(async () => {
                  // Process the recorded audio
                  if (recording.current) {
                    const uri = recording.current.getURI();
                    if (uri) {
                      try {
                        // Here we would typically send the audio to a speech recognition service
                        // For demo purposes, we'll simulate hotword detection with a delay
                        setTimeout(() => {
                          if (Math.random() > 0.7) { // Simulate detection with 30% chance
                            onHotwordDetected();
                          }
                        }, 500);
                      } catch (error) {
                        console.error('Error processing audio:', error);
                      }
                    }
                    
                    // Start a new recording
                    await stopAndRestartRecording();
                  }
                }, 1000);
              }
            }
          }
        });
      } catch (error) {
        console.error('Failed to start native recording:', error);
      }
    };

    const stopAndRestartRecording = async () => {
      if (recording.current) {
        try {
          await recording.current.stopAndUnloadAsync();
          recording.current = null;
          if (isMounted) {
            startNativeListening();
          }
        } catch (error) {
          console.error('Error stopping recording:', error);
        }
      }
    };

    if (!isListening && Platform.OS !== 'web') {
      startNativeListening();
    }

    return () => {
      isMounted = false;
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
    };
  }, [isListening, onHotwordDetected]);

  return {
    isListening,
    transcript: '', // Native platforms don't use transcript
  };
}