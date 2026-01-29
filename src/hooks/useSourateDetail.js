import { useState, useEffect } from 'react';
import QuranAPIService from '../services/quranAPI';

export const useSourateDetail = (sourateNumber, edition = 'ar.alafasy') => {
  const [sourate, setSourate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sourateNumber) {
      fetchSourate();
    }
  }, [sourateNumber, edition]);

  const fetchSourate = async () => {
    try {
      setLoading(true);
      const result = await QuranAPIService.getSourate(sourateNumber, edition);
      
      if (result.success) {
        setSourate(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    sourate,
    loading,
    error,
    refetch: fetchSourate
  };
};
