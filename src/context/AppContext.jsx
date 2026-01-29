import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storageService';
import QuranAPIService from '../services/quranAPI';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sourates, setSourates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [settings, setSettings] = useState({
    darkMode: false,
    fontSize: 24,
    selectedRecitateur: 'warsh_hussary',
    autoDownload: false
  });
  const [loading, setLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Charger les sourates
      const souratesResult = await QuranAPIService.getAllSourates();
      if (souratesResult.success) {
        setSourates(souratesResult.data);
      }

      // Charger les favoris
      const favResult = await StorageService.getFavorites();
      if (favResult.success) {
        setFavorites(favResult.data);
      }

      // Charger la dernière lecture
      const lastReadResult = await StorageService.getLastRead();
      if (lastReadResult.success) {
        setLastRead(lastReadResult.data);
      }

      // Charger les paramètres
      const settingsResult = await StorageService.getSettings();
      if (settingsResult.success) {
        setSettings(settingsResult.data);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter/retirer des favoris
  const toggleFavorite = async (sourateNumber) => {
    const newFavorites = favorites.includes(sourateNumber)
      ? favorites.filter(f => f !== sourateNumber)
      : [...favorites, sourateNumber];
    
    setFavorites(newFavorites);
    await StorageService.saveFavorites(newFavorites);
  };

  // Mettre à jour la dernière lecture
  const updateLastRead = async (sourateNumber, verseNumber) => {
    const newLastRead = {
      sourate: sourateNumber,
      verse: verseNumber,
      timestamp: new Date().toISOString()
    };
    
    setLastRead(newLastRead);
    await StorageService.saveLastRead(sourateNumber, verseNumber);
  };

  // Mettre à jour les paramètres
  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  const value = {
    sourates,
    favorites,
    lastRead,
    settings,
    loading,
    toggleFavorite,
    updateLastRead,
    updateSettings
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
