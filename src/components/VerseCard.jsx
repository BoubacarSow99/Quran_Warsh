import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function VerseCard({ 
  verse, 
  verseNumber, 
  isActive, 
  onPress,
  fontSize = 24 
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: isActive ? colors.primary + '10' : 'transparent' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.verseText, 
          { 
            color: colors.text,
            fontSize: fontSize,
          }
        ]}
      >
        {verse}
        <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.numberText}>{verseNumber}</Text>
        </View>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  verseText: {
    lineHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
