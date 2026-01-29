import { useState, useEffect } from 'react';
import DownloadService from '../services/downloadService';
import StorageService from '../services/storageService';

export const useDownload = () => {
  const [downloads, setDownloads] = useState({});
  const [downloading, setDownloading] = useState({});
  const [storageInfo, setStorageInfo] = useState({
    souratesCount: 0,
    estimatedSize: '0 MB'
  });

  useEffect(() => {
    loadDownloads();
    loadStorageInfo();
  }, []);

  const loadDownloads = async () => {
    const result = await StorageService.getDownloadedSourates();
    if (result.success) {
      setDownloads(result.data);
    }
  };

  const loadStorageInfo = async () => {
    const info = await DownloadService.getStorageInfo();
    if (info.success) {
      setStorageInfo({
        souratesCount: info.souratesCount,
        estimatedSize: info.estimatedSize
      });
    }
  };

  const downloadSourate = async (sourateNumber, numberOfVerses, recitateur) => {
    try {
      setDownloading(prev => ({ ...prev, [sourateNumber]: true }));
      
      const result = await DownloadService.downloadSourate(
        sourateNumber,
        numberOfVerses,
        recitateur
      );

      if (result.success) {
        await loadDownloads();
        await loadStorageInfo();
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setDownloading(prev => ({ ...prev, [sourateNumber]: false }));
    }
  };

  const deleteSourate = async (sourateNumber) => {
    const result = await DownloadService.deleteSourate(sourateNumber);
    
    if (result.success) {
      await loadDownloads();
      await loadStorageInfo();
    }

    return result;
  };

  const isDownloaded = (sourateNumber) => {
    return downloads.hasOwnProperty(sourateNumber);
  };

  const isDownloading = (sourateNumber) => {
    return downloading[sourateNumber] || false;
  };

  return {
    downloads,
    downloading,
    storageInfo,
    downloadSourate,
    deleteSourate,
    isDownloaded,
    isDownloading,
    refetch: loadDownloads
  };
};
