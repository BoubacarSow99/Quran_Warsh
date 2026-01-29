import { Audio } from 'expo-av';
import { AUDIO_BASE_URL } from '../utils/constants';

/**
 * Service pour gérer la lecture audio
 */
class AudioService {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.currentSourate = null;
    this.currentVerse = null;
  }

  /**
   * Initialiser le mode audio
   */
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      return { success: true };
    } catch (error) {
      console.error('Audio initialize error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Charger un audio
   */
  async loadAudio(sourateNumber, verseNumber, recitateur = 'ar.alafasy') {
    try {
      // Décharger l'audio précédent
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Construire l'URL de l'audio
      const audioUrl = `${AUDIO_BASE_URL}/${recitateur}/${sourateNumber}/${verseNumber}.mp3`;
      
      // Charger le nouveau son
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      this.sound = sound;
      this.currentSourate = sourateNumber;
      this.currentVerse = verseNumber;

      return { success: true };
    } catch (error) {
      console.error('loadAudio error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Jouer l'audio
   */
  async play() {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.isPlaying = true;
        return { success: true };
      }
      throw new Error('Aucun audio chargé');
    } catch (error) {
      console.error('play error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre en pause
   */
  async pause() {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        return { success: true };
      }
      throw new Error('Aucun audio chargé');
    } catch (error) {
      console.error('pause error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Arrêter la lecture
   */
  async stop() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        this.isPlaying = false;
        return { success: true };
      }
      return { success: true };
    } catch (error) {
      console.error('stop error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le statut de lecture
   */
  async getStatus() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        return { success: true, data: status };
      }
      return { success: false, data: null };
    } catch (error) {
      console.error('getStatus error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Nettoyer les ressources
   */
  async cleanup() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
      }
      return { success: true };
    } catch (error) {
      console.error('cleanup error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AudioService();

