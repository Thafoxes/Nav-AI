import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search location...',
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Search
        size={20}
        color={isDark ? '#ffffff' : '#000000'}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, isDark && styles.darkInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#888888' : '#666666'}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <X size={20} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  darkContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    height: '100%',
  },
  darkInput: {
    color: '#ffffff',
  },
  clearButton: {
    padding: 5,
  },
});