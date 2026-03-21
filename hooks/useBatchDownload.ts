import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { downloadAllSurahs, getCacheStats } from '../services/audioCacheService';
import { PRIMARY_AUDIO_BASE } from '../constants/reciters';

export interface DownloadStats {
    isDownloading: boolean;
    completed: number;
    total: number;
    currentSurah: string;
    currentSurahMB: string;
    sizeMB: string;
    fileCount: number;
    isSupported: boolean;
}

export function useBatchDownload(baseUrl: string = PRIMARY_AUDIO_BASE) {
    const isWeb = Platform.OS === 'web';
    const [stats, setStats] = useState<DownloadStats>({
        isDownloading: false,
        completed: 0,
        total: 114,
        currentSurah: '',
        currentSurahMB: '0.0',
        sizeMB: '0.0',
        fileCount: 0,
        isSupported: !isWeb
    });

    const isMounted = useRef(true);
    const cancelRef = useRef(false);
    const taskIdRef = useRef(0);

    const refreshStats = useCallback(async () => {
        const cache = await getCacheStats();
        if (isMounted.current) {
            setStats(prev => ({
                ...prev,
                sizeMB: cache.sizeMB,
                fileCount: cache.fileCount
            }));
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        if (!isWeb) {
            refreshStats();
        }
        return () => { isMounted.current = false; cancelRef.current = true; };
    }, [refreshStats, isWeb]);

    const stopDownload = useCallback(() => {
        cancelRef.current = true;
        taskIdRef.current++;
        setStats(prev => ({ ...prev, isDownloading: false }));
        setTimeout(refreshStats, 300);
    }, [refreshStats]);

    const startDownload = useCallback(async () => {
        if (stats.isDownloading || isWeb) return;

        cancelRef.current = false;
        const taskId = ++taskIdRef.current;
        setStats(prev => ({ ...prev, isDownloading: true, completed: 0 }));

        try {
            await downloadAllSurahs(baseUrl, (p) => {
                if (isMounted.current && taskId === taskIdRef.current) {
                    setStats(prev => ({
                        ...prev,
                        completed: p.completed,
                        total: p.total,
                        currentSurah: p.currentSurah,
                        currentSurahMB: p.currentSurahMB
                    }));
                }
            }, () => cancelRef.current);
        } catch (error) {
            console.error('Batch download error:', error);
        } finally {
            if (isMounted.current && taskId === taskIdRef.current) {
                setStats(prev => ({ ...prev, isDownloading: false }));
                refreshStats();
            }
        }
    }, [baseUrl, stats.isDownloading, refreshStats, isWeb]);

    return {
        stats,
        startDownload,
        stopDownload,
        refreshStats
    };
}
