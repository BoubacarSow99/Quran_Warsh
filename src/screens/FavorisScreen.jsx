import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import SourateCard from '../components/SourateCard';
import EmptyState from '../components/EmptyState';

export default function FavorisScreen({ navigation }) {
  const { colors } = useTheme();
  const { sourates, favorites, toggleFavorite } = useApp();

  const favoriteSourates = sourates.filter(s => favorites.includes(s.number));

  if (favoriteSourates.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={Heart}
          title="Aucun favori"
          message="Ajoutez vos sourates préférées en appuyant sur le cœur"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favoriteSourates}
        keyExtractor={(item) => item.number.toString()}
        renderItem={({ item }) => (
          <SourateCard
            sourate={item}
            onPress={() => navigation.navigate('SourateDetail', { sourate: item })}
            onFavoritePress={() => toggleFavorite(item.number)}
            isFavorite={true}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});