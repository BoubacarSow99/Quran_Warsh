
// ============================================
// src/screens/SourateDetailScreen.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSourateDetail } from '../hooks/useSourateDetail';
import AudioPlayer from '../components/AudioPlayer';
import VerseCard from '../components/VerseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { RECITATEURS } from '../utils/constants';

export default function SourateDetailScreen({ route, navigation }) {
  const { sourate } = route.params;
  const { colors } = useTheme();
  const { settings, updateLastRead } = useApp();
  const { sourate: sourateData, loading } = useSourateDetail(sourate.number);
  const [currentVerse, setCurrentVerse] = useState(1);

  const selectedRecitateur = RECITATEURS.find(
    r => r.id === settings.selectedRecitateur
  ) || RECITATEURS[0];

  useEffect(() => {
    if (currentVerse) {
      updateLastRead(sourate.number, currentVerse);
    }
  }, [currentVerse]);

  if (loading) {
    return <LoadingSpinner text="Chargement de la sourate..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.sourateName, { color: colors.text }]}>
            {sourate.name}
          </Text>
          <Text style={[styles.sourateInfo, { color: colors.textSecondary }]}>
            {sourate.englishName} • {sourate.numberOfAyahs} versets
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sourate Header Card */}
        <View style={[styles.sourateHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.numberText}>{sourate.number}</Text>
          </View>
          <Text style={[styles.sourateNameAr, { color: colors.text }]}>
            {sourate.name}
          </Text>
          <Text style={[styles.sourateNameEn, { color: colors.textSecondary }]}>
            {sourate.englishName}
          </Text>
        </View>

        {/* Audio Player */}
        <View style={styles.audioContainer}>
          <AudioPlayer
            sourate={sourate}
            currentVerse={currentVerse}
            onVerseChange={setCurrentVerse}
            recitateur={selectedRecitateur}
          />
        </View>

        {/* Basmalah */}
        {sourate.number !== 1 && sourate.number !== 9 && (
          <View style={[styles.basmalah, { backgroundColor: colors.card }]}>
            <Text style={[styles.basmalahText, { color: colors.text }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </Text>
          </View>
        )}

        {/* Versets */}
        {sourateData?.ayahs.map((ayah) => (
          <VerseCard
            key={ayah.number}
            verse={ayah.text}
            verseNumber={ayah.numberInSurah}
            isActive={currentVerse === ayah.numberInSurah}
            onPress={() => setCurrentVerse(ayah.numberInSurah)}
            fontSize={settings.fontSize}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  sourateName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sourateInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  sourateHeader: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numberBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  numberText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sourateNameAr: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sourateNameEn: {
    fontSize: 18,
  },
  audioContainer: {
    marginBottom: 16,
  },
  basmalah: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  basmalahText: {
    fontSize: 28,
    textAlign: 'center',
  },
});