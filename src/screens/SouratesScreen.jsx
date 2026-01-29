import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import SourateCard from '../components/SourateCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SouratesScreen({ navigation }) {
  const { colors } = useTheme();
  const { sourates, favorites, toggleFavorite, loading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSourates = sourates.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString().includes(searchQuery)
  );

  if (loading) {
    return <LoadingSpinner text="Chargement des sourates..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Rechercher une sourate..."
        />
      </View>

      <FlatList
        data={filteredSourates}
        keyExtractor={(item) => item.number.toString()}
        renderItem={({ item }) => (
          <SourateCard
            sourate={item}
            onPress={() => navigation.navigate('SourateDetail', { sourate: item })}
            onFavoritePress={() => toggleFavorite(item.number)}
            isFavorite={favorites.includes(item.number)}
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

