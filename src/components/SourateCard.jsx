import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function SourateCard({ 
  sourate, 
  onPress, 
  onFavoritePress, 
  isFavorite 
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.numberText}>{sourate.number}</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.nameAr, { color: colors.text }]}>
              {sourate.name}
            </Text>
            <Text style={[styles.nameEn, { color: colors.textSecondary }]}>
              {sourate.englishName}
            </Text>
            <Text style={[styles.info, { color: colors.textSecondary }]}>
              {sourate.numberOfAyahs} versets • {sourate.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={onFavoritePress}
          style={styles.favoriteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart 
            size={24}
            color={isFavorite ? '#ef4444' : colors.textSecondary}
            fill={isFavorite ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  nameAr: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nameEn: {
    fontSize: 14,
    marginBottom: 4,
  },
  info: {
    fontSize: 12,
  },
  favoriteButton: {
    padding: 8,
  },
});
