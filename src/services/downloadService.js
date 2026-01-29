
// ============================================
// src/services/downloadService.js
// ============================================

import * as FileSystem from 'expo-file-system';
import StorageService from './storageService';
import { AUDIO_BASE_URL } from '../utils/constants';

/**
 * Service pour gérer les téléchargements hors ligne
 */
class DownloadService {
  
  /**
   * Télécharger une sourate complète (audio)
   */
  async downloadSourate(sourateNumber, numberOfVerses, recitateur = 'ar.alafasy') {
    try {
      const downloadDir = `${FileSystem.documentDirectory}sourates/${sourateNumber}/`;
      
      // Créer le dossier si nécessaire
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      const downloadedVerses = [];

      // Télécharger chaque verset
      for (let i = 1; i <= numberOfVerses; i++) {
        const audioUrl = `${AUDIO_BASE_URL}/${recitateur}/${sourateNumber}/${i}.mp3`;
        const fileUri = `${downloadDir}${i}.mp3`;

        const downloadResult = await FileSystem.downloadAsync(audioUrl, fileUri);
        
        if (downloadResult.status === 200) {
          downloadedVerses.push({
            verse: i,
            uri: fileUri
          });
        }
      }

      // Sauvegarder dans le stockage
      await StorageService.saveDownloadedSourate(sourateNumber, {
        verses: downloadedVerses,
        recitateur,
        totalVerses: numberOfVerses
      });

      return {
        success: true,
        downloaded: downloadedVerses.length,
        total: numberOfVerses
      };
    } catch (error) {
      console.error('downloadSourate error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer une sourate téléchargée
   */
  async deleteSourate(sourateNumber) {
    try {
      const downloadDir = `${FileSystem.documentDirectory}sourates/${sourateNumber}/`;
      
      // Supprimer le dossier
      await FileSystem.deleteAsync(downloadDir, { idempotent: true });
      
      // Supprimer du stockage
      await StorageService.deleteDownloadedSourate(sourateNumber);

      return { success: true };
    } catch (error) {
      console.error('deleteSourate error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si une sourate est téléchargée
   */
  async isSourateDownloaded(sourateNumber) {
    try {
      const downloads = await StorageService.getDownloadedSourates();
      return {
        success: true,
        downloaded: downloads.data.hasOwnProperty(sourateNumber)
      };
    } catch (error) {
      console.error('isSourateDownloaded error:', error);
      return { success: false, downloaded: false };
    }
  }

  /**
   * Obtenir l'espace utilisé
   */
  async getStorageInfo() {
    try {
      const downloads = await StorageService.getDownloadedSourates();
      const souratesCount = Object.keys(downloads.data).length;

      return {
        success: true,
        souratesCount,
        // Calcul approximatif (à améliorer avec la taille réelle des fichiers)
        estimatedSize: `${(souratesCount * 5).toFixed(1)} MB`
      };
    } catch (error) {
      console.error('getStorageInfo error:', error);
      return {
        success: false,
        souratesCount: 0,
        estimatedSize: '0 MB'
      };
    }
  }
}

export default new DownloadService();