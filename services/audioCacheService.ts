import * as FileSystem from 'expo-file-system/legacy';
import { getAyahAudioUrl } from './audioService';
import { getSurahList } from './quranApi';
import type { Ayah } from './quranApi';

// @ts-ignore - Some environments have issues with the FS type definitions
const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
const AUDIO_DIR = cacheDir + 'quran_audio/';

/**
 * Initializes the audio cache directory.
 */
export async function initAudioCache() {
    try {
        const info = await FileSystem.getInfoAsync(AUDIO_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
        }
    } catch (error) {
        console.error('Failed to init audio cache dir', error);
    }
}

/**
 * Clears the audio cache by deleting the directory and recreating it.
 */
export async function clearAudioCache() {
    try {
        const info = await FileSystem.getInfoAsync(AUDIO_DIR);
        if (info.exists) {
            await FileSystem.deleteAsync(AUDIO_DIR, { idempotent: true });
        }
        await initAudioCache();
    } catch (error) {
        console.error('Failed to clear audio cache', error);
    }
}

/**
 * Returns cache statistics: total size in MB and number of files.
 */
export async function getCacheStats() {
    try {
        await initAudioCache();
        const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
        let totalSizeBytes = 0;
        
        // We process in small chunks to avoid blocking the thread if many files exist
        for (const file of files) {
            const info = await FileSystem.getInfoAsync(AUDIO_DIR + file);
            if (info.exists) {
                totalSizeBytes += info.size;
            }
        }

        return {
            fileCount: files.length,
            sizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(1),
            totalSizeBytes
        };
    } catch (e) {
        return { fileCount: 0, sizeMB: '0.0', totalSizeBytes: 0 };
    }
}

/**
 * Generates a local file name based on surah, ayah and reciter base URL.
 */
function getLocalFileName(surahNumber: number, ayahNumber: number, baseUrl: string): string {
    const reciterId = baseUrl.split('/').pop() || 'default';
    const s = String(surahNumber).padStart(3, '0');
    const a = String(ayahNumber).padStart(3, '0');
    return `${reciterId}_${s}_${a}.mp3`;
}

/**
 * Returns the local URI if the file exists, otherwise returns the remote URL.
 */
export async function getCachedUri(surahNumber: number, ayahNumber: number, baseUrl: string): Promise<string> {
    const fileName = getLocalFileName(surahNumber, ayahNumber, baseUrl);
    const fileUri = AUDIO_DIR + fileName;

    try {
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
            return fileUri;
        }
    } catch (e) { }

    return getAyahAudioUrl(surahNumber, ayahNumber, baseUrl);
}

/**
 * Rapidly checks if an entire surah is cached by counting matching filenames in the directory.
 * This avoids hundreds of sequential `getInfoAsync` checks.
 */
export async function isSurahFullyCached(surahNumber: number, expectedCount: number, baseUrl: string): Promise<boolean> {
    try {
        const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
        const reciterId = baseUrl.split('/').pop() || 'default';
        const prefix = `${reciterId}_${String(surahNumber).padStart(3, '0')}_`;
        
        const count = files.filter(f => f.startsWith(prefix)).length;
        return count >= expectedCount;
    } catch {
        return false;
    }
}

/**
 * Downloads a list of surahs in the requested order: 1, 114, 113... 2.
 */
export async function downloadAllSurahs(
    baseUrl: string,
    onProgress: (stats: { completed: number; total: number; currentSurah: string; currentSurahMB: string }) => void,
    isCancelled?: () => boolean
) {
    const surahList = await getSurahList();
    const order = [1, ...Array.from({ length: 113 }, (_, i) => 114 - i)]; // 1, 114, 113... 2
    
    let completed = 0;
    for (const surahNum of order) {
        const meta = surahList.find(s => s.number === surahNum);
        if (!meta) continue;

        if (isCancelled && isCancelled()) break;

        onProgress({ completed, total: 114, currentSurah: meta.englishName, currentSurahMB: '0.0' });

        // Generate mock ayahs array to avoid fetching full texts for every surah
        const ayahs = Array.from({ length: meta.numberOfAyahs }, (_, i) => ({
            numberInSurah: i + 1
        })) as Ayah[];

        await downloadSurahAudio(surahNum, ayahs, baseUrl, (prog, bytes) => {
            onProgress({
                completed,
                total: 114,
                currentSurah: meta.englishName,
                currentSurahMB: (bytes / (1024 * 1024)).toFixed(1)
            });
        }, isCancelled);
        if (isCancelled && isCancelled()) break;
        completed++;
    }
    
    if (!isCancelled || !isCancelled()) {
        onProgress({ completed: 114, total: 114, currentSurah: 'Done', currentSurahMB: '0.0' });
    }
}

/**
 * Downloads all ayahs for a specific surah, and reports progress.
 */
export async function downloadSurahAudio(
    surahNumber: number,
    ayahs: Ayah[],
    baseUrl: string,
    onProgress: (progress: number, bytesDownloaded: number) => void,
    isCancelled?: () => boolean
): Promise<void> {
    await initAudioCache();

    const itemsToDownload: { url: string; localUri: string }[] = [];

    // Add Bismillah for relevant surahs
    if (surahNumber > 1 && surahNumber !== 9) {
        const bUrl = getAyahAudioUrl(1, 1, baseUrl);
        const bUri = AUDIO_DIR + getLocalFileName(1, 1, baseUrl);
        itemsToDownload.push({ url: bUrl, localUri: bUri });
    }

    for (const ayah of ayahs) {
        const url = getAyahAudioUrl(surahNumber, ayah.numberInSurah, baseUrl);
        const localUri = AUDIO_DIR + getLocalFileName(surahNumber, ayah.numberInSurah, baseUrl);
        itemsToDownload.push({ url, localUri });
    }

    const totalFiles = itemsToDownload.length;
    let finishedCount = 0;
    let surahBytes = 0;

    // Filter out already exists
    const missing = [];
    for (const item of itemsToDownload) {
        if (isCancelled && isCancelled()) return;
        const info = await FileSystem.getInfoAsync(item.localUri);
        if (info.exists) {
            finishedCount++;
            surahBytes += info.size || 0;
        } else {
            missing.push(item);
        }
    }
    
    if (totalFiles > 0) onProgress(finishedCount / totalFiles, surahBytes);

    // Batch download (5 at a time for stability)
    const BATCH = 5;
    for (let i = 0; i < missing.length; i += BATCH) {
        if (isCancelled && isCancelled()) break;
        const chunk = missing.slice(i, i + BATCH);
        await Promise.all(chunk.map(async (item) => {
            if (isCancelled && isCancelled()) return;
            try {
                await FileSystem.downloadAsync(item.url, item.localUri);
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (info.exists) surahBytes += info.size || 0;
                finishedCount++;
                onProgress(finishedCount / totalFiles, surahBytes);
            } catch (err) {
                console.error(`Download failed: ${item.url}`, err);
            }
        }));
    }
}

