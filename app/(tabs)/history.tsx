import { View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';

const trips = [
  {
    id: '1',
    date: '2024-02-20',
    destination: 'KLCC',
    earnings: '25.50',
    time: '10:30 AM',
  },
  {
    id: '2',
    date: '2024-02-20',
    destination: 'Pavilion',
    earnings: '18.75',
    time: '2:15 PM',
  },
  {
    id: '3',
    date: '2024-02-19',
    destination: 'Mid Valley',
    earnings: '32.00',
    time: '5:45 PM',
  },
];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const renderItem = ({ item }) => (
    <View style={[styles.tripItem, isDark && styles.darkTripItem]}>
      <View style={styles.tripHeader}>
        <Text style={[styles.tripTime, isDark && styles.darkText]}>
          {item.time}
        </Text>
        <Text style={[styles.tripEarnings, isDark && styles.darkText]}>
          ${item.earnings}
        </Text>
      </View>
      <Text style={[styles.tripDestination, isDark && styles.darkText]}>
        {item.destination}
      </Text>
      <Text style={[styles.tripDate, isDark && styles.darkText]}>
        {item.date}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>Trip History</Text>
      <FlatList
        data={trips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 20,
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 20,
  },
  tripItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  darkTripItem: {
    backgroundColor: '#333333',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripTime: {
    fontSize: 16,
    color: '#666666',
  },
  tripEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tripDestination: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  tripDate: {
    fontSize: 14,
    color: '#666666',
  },
});