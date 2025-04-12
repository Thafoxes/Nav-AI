import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  useColorScheme,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { TriangleAlert as AlertTriangle, Moon, Volume2, Mic as Mic2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNoiseReduction, setIsNoiseReduction] = useState(false);
  const [isVoiceEnhancer, setIsVoiceEnhancer] = useState(false);

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    beta?: boolean
  ) => (
    <View style={[styles.settingItem, isDark && styles.darkSettingItem]}>
      <View style={styles.settingContent}>
        <View style={styles.settingHeader}>
          {icon}
          <View style={styles.settingTitleContainer}>
            <Text style={[styles.settingTitle, isDark && styles.darkText]}>
              {title}
            </Text>
            {beta && (
              <View style={styles.betaBadge}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.settingDescription, isDark && styles.darkDescription]}>
          {description}
        </Text>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: '#62A56E' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, isDark && styles.darkText]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
          Display
        </Text>
        {renderSettingItem(
          <Moon
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
            style={styles.settingIcon}
          />,
          'Dark Mode',
          'Reduce screen glare for safer nighttime driving.',
          isDarkMode,
          setIsDarkMode
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
          Voice Assistant
        </Text>
        {renderSettingItem(
          <Volume2
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
            style={styles.settingIcon}
          />,
          'Noise Reduction',
          'Automatically reduce engine, wind, and background noise while speaking.',
          isNoiseReduction,
          setIsNoiseReduction,
          true
        )}
        {renderSettingItem(
          <Mic2
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
            style={styles.settingIcon}
          />,
          'Voice Clarity Enhancer',
          'Boosts voice clarity in noisy environments.',
          isVoiceEnhancer,
          setIsVoiceEnhancer,
          true
        )}
      </View>

      <View style={[styles.disclaimerContainer, isDark && styles.darkDisclaimerContainer]}>
        <View style={styles.disclaimerHeader}>
          <AlertTriangle
            size={20}
            color="#FF3B30"
            style={styles.disclaimerIcon}
          />
          <Text style={[styles.disclaimerTitle, isDark && styles.darkText]}>
            Important Notice
          </Text>
        </View>
        <Text style={[styles.disclaimerText, isDark && styles.darkDescription]}>
          These AI-powered features are still in testing mode. Performance may vary
          depending on noise level and environment. Please use with caution, and do
          not rely on AI suggestions in critical driving situations.
        </Text>
      </View>
    </ScrollView>
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
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  darkSettingItem: {
    backgroundColor: '#1c1c1e',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  betaBadge: {
    backgroundColor: '#62A56E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betaText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  darkDescription: {
    color: '#8e8e93',
  },
  disclaimerContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  darkDisclaimerContainer: {
    backgroundColor: '#3A1C1C',
    borderColor: '#4D2727',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerIcon: {
    marginRight: 8,
  },
  disclaimerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});