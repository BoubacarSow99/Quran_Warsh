import { useState, useEffect } from 'react';
import QuranAPIService from '../services/quranAPI';

export const useSourates = () => {
  const [sourates, setSourates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSourates();
  }, []);

  const fetchSourates = async () => {
    try {
      setLoading(true);
      const result = await QuranAPIService.getAllSourates();
      
      if (result.success) {
        setSourates(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSourateByNumber = (number) => {
    return sourates.find(s => s.number === number);
  };

  const searchSourates = (query) => {
    return sourates.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.englishName.toLowerCase().includes(query.toLowerCase()) ||
      s.number.toString().includes(query)
    );
  };

  return {
    sourates,
    loading,
    error,
    getSourateByNumber,
    searchSourates,
    refetch: fetchSourates
  };
};