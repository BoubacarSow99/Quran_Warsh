import { File, Directory, Paths } from 'expo-file-system';
import { getAyahAudioUrl } from './audioService';
import { getSurahList } from './quranApi';
import type { Ayah } from './quranApi';

// Uses documentDirectory so downloaded MP3s persist permanently and are never
// purged by iOS cache eviction (unlike cacheDirectory which is volatile).
const AUDIO_DIR = new Directory(Paths.document, 'quran_audio');

/**
 * Initializes the audio cache directory.
 */
export async function initAudioCache() {
    try {
        if (!AUDIO_DIR.exists) {
            AUDIO_DIR.create({ intermediates: true });
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
        if (AUDIO_DIR.exists) {
            AUDIO_DIR.delete();
        }
        initAudioCache();
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
        const items = AUDIO_DIR.list();
        let totalSizeBytes = 0;

        for (const item of items) {
            if (item instanceof File) {
                totalSizeBytes += item.size ?? 0;
            }
        }

        return {
            fileCount: items.filter(i => i instanceof File).length,
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
export function getLocalFileName(surahNumber: number, ayahNumber: number, baseUrl: string): string {
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
    const file = new File(AUDIO_DIR, fileName);

    if (file.exists) {
        return file.uri;
    }

    return getAyahAudioUrl(surahNumber, ayahNumber, baseUrl);
}

/**
 * Rapidly checks if an entire surah is cached by counting matching filenames in the directory.
 * This avoids hundreds of sequential stat checks.
 */
export async function isSurahFullyCached(surahNumber: number, expectedCount: number, baseUrl: string): Promise<boolean> {
    try {
        await initAudioCache();
        const items = AUDIO_DIR.list();
        const reciterId = baseUrl.split('/').pop() || 'default';
        const prefix = `${reciterId}_${String(surahNumber).padStart(3, '0')}_`;

        const count = items.filter(
            i => i instanceof File && i.name.startsWith(prefix)
        ).length;
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

    const itemsToDownload: { url: string; file: File }[] = [];

    // Add Bismillah for relevant surahs
    if (surahNumber > 1 && surahNumber !== 9) {
        const bUrl = getAyahAudioUrl(1, 1, baseUrl);
        itemsToDownload.push({ url: bUrl, file: new File(AUDIO_DIR, getLocalFileName(1, 1, baseUrl)) });
    }

    for (const ayah of ayahs) {
        const url = getAyahAudioUrl(surahNumber, ayah.numberInSurah, baseUrl);
        itemsToDownload.push({ url, file: new File(AUDIO_DIR, getLocalFileName(surahNumber, ayah.numberInSurah, baseUrl)) });
    }

    const totalFiles = itemsToDownload.length;
    let finishedCount = 0;
    let surahBytes = 0;

    // Filter out already existing files
    const missing: { url: string; file: File }[] = [];
    for (const item of itemsToDownload) {
        if (isCancelled && isCancelled()) return;
        if (item.file.exists) {
            finishedCount++;
            surahBytes += item.file.size ?? 0;
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
                if (!item.file.exists) {
                    await File.downloadFileAsync(item.url, item.file);
                }
                surahBytes += item.file.size ?? 0;
                finishedCount++;
                onProgress(finishedCount / totalFiles, surahBytes);
            } catch (err: any) {
                // Race condition fallback: if the file was created by another parallel process 
                // (like AudioPlayer prefetching) while we were downloading, treat it as success.
                if (item.file.exists) {
                    surahBytes += item.file.size ?? 0;
                    finishedCount++;
                    onProgress(finishedCount / totalFiles, surahBytes);
                } else {
                    console.error(`Download failed: ${item.url}`, err);
                }
            }
        }));
    }
}
