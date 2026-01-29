import { QURAN_API_BASE } from '../utils/constants';

/**
 * Service pour interagir avec l'API Quran
 */
class QuranAPIService {
  
  /**
   * Récupérer la liste complète des sourates
   */
  async getAllSourates() {
    try {
      const response = await fetch(`${QURAN_API_BASE}/surah`);
      const data = await response.json();
      
      if (data.code === 200) {
        return {
          success: true,
          data: data.data
        };
      }
      
      throw new Error('Erreur lors du chargement des sourates');
    } catch (error) {
      console.error('getAllSourates error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer une sourate spécifique par son numéro
   * @param {number} number - Numéro de la sourate (1-114)
   * @param {string} edition - Edition de récitation (default: ar.alafasy)
   */
  async getSourate(number, edition = 'ar.alafasy') {
    try {
      const response = await fetch(`${QURAN_API_BASE}/surah/${number}/${edition}`);
      const data = await response.json();
      
      if (data.code === 200) {
        return {
          success: true,
          data: data.data
        };
      }
      
      throw new Error('Erreur lors du chargement de la sourate');
    } catch (error) {
      console.error('getSourate error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer un verset spécifique
   * @param {number} sourateNumber - Numéro de la sourate
   * @param {number} verseNumber - Numéro du verset
   */
  async getVerse(sourateNumber, verseNumber) {
    try {
      const response = await fetch(
        `${QURAN_API_BASE}/ayah/${sourateNumber}:${verseNumber}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        return {
          success: true,
          data: data.data
        };
      }
      
      throw new Error('Erreur lors du chargement du verset');
    } catch (error) {
      console.error('getVerse error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rechercher des sourates
   * @param {string} query - Terme de recherche
   */
  async searchSourates(query) {
    try {
      const allSourates = await this.getAllSourates();
      
      if (!allSourates.success) {
        throw new Error('Erreur lors de la recherche');
      }

      const filtered = allSourates.data.filter(sourate => 
        sourate.name.toLowerCase().includes(query.toLowerCase()) ||
        sourate.englishName.toLowerCase().includes(query.toLowerCase()) ||
        sourate.number.toString().includes(query)
      );

      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      console.error('searchSourates error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer les éditions disponibles
   */
  async getEditions() {
    try {
      const response = await fetch(`${QURAN_API_BASE}/edition`);
      const data = await response.json();
      
      if (data.code === 200) {
        // Filtrer uniquement les éditions audio Warsh
        const warshEditions = data.data.filter(
          edition => edition.format === 'audio' && 
          edition.language === 'ar' &&
          edition.name.toLowerCase().includes('warsh')
        );
        
        return {
          success: true,
          data: warshEditions
        };
      }
      
      throw new Error('Erreur lors du chargement des éditions');
    } catch (error) {
      console.error('getEditions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new QuranAPIService();