import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Book, Heart, Search, Volume2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { RECITATEURS } from '../utils/constants';

export default function AccueilScreen({ navigation }) {
  const { colors } = useTheme();
  const { lastRead, favorites, sourates } = useApp();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={styles.icon}>📖</Text>
        <Text style={[styles.title, { color: colors.text }]}>القرآن الكريم</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          رواية ورش عن نافع
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        <Text style={[styles.appName, { color: colors.textSecondary }]}>
          Quran Warsh
        </Text>
      </View>

      {/* Dernière lecture */}
      {lastRead && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Continuer la lecture
          </Text>
          <View style={styles.lastReadContent}>
            <View>
              <Text style={[styles.sourateName, { color: colors.text }]}>
                {sourates.find(s => s.number === lastRead.sourate)?.name || 'Sourate'}
              </Text>
              <Text style={[styles.verseInfo, { color: colors.textSecondary }]}>
                Verset {lastRead.verse}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('SourateDetail', { 
                sourate: sourates.find(s => s.number === lastRead.sourate) 
              })}
            >
              <Text style={styles.buttonText}>Reprendre</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Accès rapide */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Accès rapide
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.primary + '20' }]}
            onPress={() => navigation.navigate('Sourates')}
          >
            <Book size={40} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Sourates</Text>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {sourates.length} sourates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#ef4444' + '20' }]}
            onPress={() => navigation.navigate('Favoris')}
          >
            <Heart size={40} color="#ef4444" />
            <Text style={[styles.actionText, { color: colors.text }]}>Favoris</Text>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {favorites.length} favoris
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Récitateurs */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Récitateurs disponibles
        </Text>
        {RECITATEURS.map(rec => (
          <View key={rec.id} style={[styles.recitatorItem, { backgroundColor: colors.background }]}>
            <Volume2 size={20} color={colors.primary} />
            <View style={styles.recitatorInfo}>
              <Text style={[styles.recitatorName, { color: colors.text }]}>
                {rec.name}
              </Text>
              <Text style={[styles.recitatorNameAr, { color: colors.textSecondary }]}>
                {rec.nameAr}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  divider: {
    width: 80,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lastReadContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  verseInfo: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  actionCount: {
    fontSize: 14,
    marginTop: 4,
  },
  recitatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recitatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recitatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  recitatorNameAr: {
    fontSize: 14,
  },
});
