import React, { createContext, useContext, useState, useEffect } from 'react';
import AudioService from '../services/audioService';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSourate, setCurrentSourate] = useState(null);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AudioService.initialize();
    
    return () => {
      AudioService.cleanup();
    };
  }, []);

  // Charger et jouer un verset
  const playVerse = async (sourateNumber, verseNumber, recitateur) => {
    try {
      setLoading(true);
      
      const loadResult = await AudioService.loadAudio(
        sourateNumber,
        verseNumber,
        recitateur
      );

      if (loadResult.success) {
        const playResult = await AudioService.play();
        
        if (playResult.success) {
          setIsPlaying(true);
          setCurrentSourate(sourateNumber);
          setCurrentVerse(verseNumber);
        }
      }
    } catch (error) {
      console.error('playVerse error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mettre en pause
  const pause = async () => {
    const result = await AudioService.pause();
    if (result.success) {
      setIsPlaying(false);
    }
  };

  // Reprendre la lecture
  const resume = async () => {
    const result = await AudioService.play();
    if (result.success) {
      setIsPlaying(true);
    }
  };

  // Arrêter
  const stop = async () => {
    const result = await AudioService.stop();
    if (result.success) {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  // Verset suivant
  const nextVerse = async (totalVerses, recitateur) => {
    if (currentVerse < totalVerses) {
      await playVerse(currentSourate, currentVerse + 1, recitateur);
    }
  };

  // Verset précédent
  const previousVerse = async (recitateur) => {
    if (currentVerse > 1) {
      await playVerse(currentSourate, currentVerse - 1, recitateur);
    }
  };

  const value = {
    isPlaying,
    currentSourate,
    currentVerse,
    duration,
    position,
    loading,
    playVerse,
    pause,
    resume,
    stop,
    nextVerse,
    previousVerse
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};
