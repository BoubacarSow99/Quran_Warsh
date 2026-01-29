import { useState, useEffect } from 'react';
import StorageService from '../services/storageService';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const result = await StorageService.getFavorites();
      
      if (result.success) {
        setFavorites(result.data);
      }
    } catch (error) {
      console.error('Load favorites error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (sourateNumber) => {
    const newFavorites = favorites.includes(sourateNumber)
      ? favorites.filter(f => f !== sourateNumber)
      : [...favorites, sourateNumber];
    
    setFavorites(newFavorites);
    await StorageService.saveFavorites(newFavorites);
  };

  const isFavorite = (sourateNumber) => {
    return favorites.includes(sourateNumber);
  };

  const clearFavorites = async () => {
    setFavorites([]);
    await StorageService.saveFavorites([]);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    refetch: loadFavorites
  };
};