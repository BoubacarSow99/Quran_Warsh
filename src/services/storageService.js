import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Service pour gérer le stockage local
 */
class StorageService {
  
  /**
   * Sauvegarder les favoris
   */
  async saveFavorites(favorites) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITES, 
        JSON.stringify(favorites)
      );
      return { success: true };
    } catch (error) {
      console.error('saveFavorites error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les favoris
   */
  async getFavorites() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return {
        success: true,
        data: data ? JSON.parse(data) : []
      };
    } catch (error) {
      console.error('getFavorites error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Sauvegarder la dernière lecture
   */
  async saveLastRead(sourateNumber, verseNumber) {
    try {
      const lastRead = {
        sourate: sourateNumber,
        verse: verseNumber,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_READ,
        JSON.stringify(lastRead)
      );
      
      return { success: true };
    } catch (error) {
      console.error('saveLastRead error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer la dernière lecture
   */
  async getLastRead() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ);
      return {
        success: true,
        data: data ? JSON.parse(data) : null
      };
    } catch (error) {
      console.error('getLastRead error:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Sauvegarder les paramètres
   */
  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      );
      return { success: true };
    } catch (error) {
      console.error('saveSettings error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les paramètres
   */
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return {
        success: true,
        data: data ? JSON.parse(data) : {
          darkMode: false,
          fontSize: 24,
          selectedRecitateur: 'warsh_hussary',
          autoDownload: false
        }
      };
    } catch (error) {
      console.error('getSettings error:', error);
      return {
        success: false,
        data: {
          darkMode: false,
          fontSize: 24,
          selectedRecitateur: 'warsh_hussary',
          autoDownload: false
        }
      };
    }
  }

  /**
   * Sauvegarder les sourates téléchargées
   */
  async saveDownloadedSourate(sourateNumber, data) {
    try {
      const downloads = await this.getDownloadedSourates();
      const updated = {
        ...downloads.data,
        [sourateNumber]: {
          data,
          downloadedAt: new Date().toISOString()
        }
      };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOWNLOADED_SOURATES,
        JSON.stringify(updated)
      );
      
      return { success: true };
    } catch (error) {
      console.error('saveDownloadedSourate error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer les sourates téléchargées
   */
  async getDownloadedSourates() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SOURATES);
      return {
        success: true,
        data: data ? JSON.parse(data) : {}
      };
    } catch (error) {
      console.error('getDownloadedSourates error:', error);
      return { success: false, data: {} };
    }
  }

  /**
   * Supprimer une sourate téléchargée
   */
  async deleteDownloadedSourate(sourateNumber) {
    try {
      const downloads = await this.getDownloadedSourates();
      const updated = { ...downloads.data };
      delete updated[sourateNumber];
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOWNLOADED_SOURATES,
        JSON.stringify(updated)
      );
      
      return { success: true };
    } catch (error) {
      console.error('deleteDownloadedSourate error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Effacer toutes les données
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('clearAll error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new StorageService();