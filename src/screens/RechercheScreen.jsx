import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import SourateCard from '../components/SourateCard';
import EmptyState from '../components/EmptyState';
import { Search } from 'lucide-react-native';

export default function RechercheScreen({ navigation }) {
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useApp();
  const { query, setQuery, results, clearSearch } = useSearch();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearSearch}
          placeholder="Rechercher par nom ou numéro..."
        />
      </View>

      {query === '' ? (
        <EmptyState
          icon={Search}
          title="Rechercher une sourate"
          message="Tapez le nom ou le numéro d'une sourate"
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          message="Aucune sourate ne correspond à votre recherche"
        />
      ) : (
        <FlatList
          data={results}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});