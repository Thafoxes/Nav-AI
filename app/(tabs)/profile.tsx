import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { Settings, Bell, Shield } from 'lucide-react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop' }}
          style={styles.profileImage}
        />
        <Text style={[styles.name, isDark && styles.darkText]}>John Driver</Text>
        <Text style={styles.rating}>⭐ 4.9 Rating</Text>
      </View>

      <View style={[styles.statsContainer, isDark && styles.darkStatsContainer]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.darkText]}>2,145</Text>
          <Text style={[styles.statLabel, isDark && styles.darkText]}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.darkText]}>98%</Text>
          <Text style={[styles.statLabel, isDark && styles.darkText]}>
            Completion
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.darkText]}>
            4.9/5
          </Text>
          <Text style={[styles.statLabel, isDark && styles.darkText]}>
            Rating
          </Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuItem, isDark && styles.darkMenuItem]}>
          <Settings size={24} color={isDark ? '#ffffff' : '#000000'} />
          <Text style={[styles.menuText, isDark && styles.darkText]}>
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, isDark && styles.darkMenuItem]}>
          <Bell size={24} color={isDark ? '#ffffff' : '#000000'} />
          <Text style={[styles.menuText, isDark && styles.darkText]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, isDark && styles.darkMenuItem]}>
          <Shield size={24} color={isDark ? '#ffffff' : '#000000'} />
          <Text style={[styles.menuText, isDark && styles.darkText]}>
            Privacy & Security
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  darkText: {
    color: '#ffffff',
  },
  rating: {
    fontSize: 16,
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  darkStatsContainer: {
    backgroundColor: '#333333',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  darkMenuItem: {
    backgroundColor: '#333333',
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#000000',
  },
});