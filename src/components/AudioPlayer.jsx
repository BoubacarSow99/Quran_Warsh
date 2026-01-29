import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

export default function AudioPlayer({ 
  sourate, 
  currentVerse, 
  onVerseChange,
  recitateur 
}) {
  const { colors } = useTheme();
  const { isPlaying, playVerse, pause, resume, nextVerse, previousVerse } = useAudio();
  const [progress, setProgress] = useState(0);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      if (currentVerse) {
        resume();
      } else {
        playVerse(sourate.number, 1, recitateur.identifier);
      }
    }
  };

  const handleNext = () => {
    if (currentVerse < sourate.numberOfAyahs) {
      nextVerse(sourate.numberOfAyahs, recitateur.identifier);
      onVerseChange && onVerseChange(currentVerse + 1);
    }
  };

  const handlePrevious = () => {
    if (currentVerse > 1) {
      previousVerse(recitateur.identifier);
      onVerseChange && onVerseChange(currentVerse - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Récitateur Info */}
      <View style={styles.header}>
        <View style={styles.recitatorInfo}>
          <Volume2 size={24} color={colors.primary} />
          <View style={styles.recitatorText}>
            <Text style={[styles.recitatorName, { color: colors.text }]}>
              {recitateur.name}
            </Text>
            <Text style={[styles.recitatorNameAr, { color: colors.textSecondary }]}>
              {recitateur.nameAr}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: colors.primary + '20' }]}
          onPress={handlePrevious}
          disabled={currentVerse <= 1}
        >
          <SkipBack size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: colors.primary }]}
          onPress={handlePlayPause}
        >
          {isPlaying ? (
            <Pause size={32} color="#fff" />
          ) : (
            <Play size={32} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: colors.primary + '20' }]}
          onPress={handleNext}
          disabled={currentVerse >= sourate.numberOfAyahs}
        >
          <SkipForward size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <View 
          style={[styles.progressBar, { 
            backgroundColor: colors.primary,
            width: `${progress}%` 
          }]} 
        />
      </View>

      {/* Verse Counter */}
      <Text style={[styles.verseCounter, { color: colors.text }]}>
        Verset {currentVerse} / {sourate.numberOfAyahs}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recitatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recitatorText: {
    marginLeft: 12,
    flex: 1,
  },
  recitatorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  recitatorNameAr: {
    fontSize: 14,
    marginTop: 2,
  },
  downloadButton: {
    padding: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  verseCounter: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
