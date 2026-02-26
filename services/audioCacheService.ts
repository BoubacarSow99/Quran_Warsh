import * as FileSystem from 'expo-file-system/legacy';
import { getAyahAudioUrl } from './audioService';
import type { Ayah } from './quranApi';

const AUDIO_DIR = FileSystem.cacheDirectory + 'quran_audio/';

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
 * Generates a local file name based on surah, ayah and reciter base URL.
 * Example: `alafasy_001_001.mp3`
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
    } catch (e) {
        // Fallback to remote if FileSystem fails
    }

    return getAyahAudioUrl(surahNumber, ayahNumber, baseUrl);
}

/**
 * Downloads all ayahs for a specific surah, and reports progress.
 * Downloads are done in batches to avoid network congestion.
 */
export async function downloadSurahAudio(
    surahNumber: number,
    ayahs: Ayah[],
    baseUrl: string,
    onProgress: (progress: number) => void
): Promise<void> {
    await initAudioCache();

    // Determine the list of files to download
    const itemsToDownload: { url: string; localUri: string }[] = [];

    // Optional: Add Bismillah if applicable (Surah > 1 and not Surah 9)
    if (surahNumber > 1 && surahNumber !== 9) {
        const bismillahUrl = getAyahAudioUrl(1, 1, baseUrl);
        const bismillahLocalUri = AUDIO_DIR + getLocalFileName(1, 1, baseUrl);
        itemsToDownload.push({ url: bismillahUrl, localUri: bismillahLocalUri });
    }

    // Add all ayahs in the surah
    for (const ayah of ayahs) {
        const url = getAyahAudioUrl(surahNumber, ayah.numberInSurah, baseUrl);
        const localUri = AUDIO_DIR + getLocalFileName(surahNumber, ayah.numberInSurah, baseUrl);
        itemsToDownload.push({ url, localUri });
    }

    const totalFiles = itemsToDownload.length;
    let downloadedFiles = 0;

    // First pass: check what already exists to skip downloading
    const missingItems = [];
    for (const item of itemsToDownload) {
        try {
            const info = await FileSystem.getInfoAsync(item.localUri);
            if (info.exists) {
                downloadedFiles++;
                onProgress(downloadedFiles / totalFiles);
            } else {
                missingItems.push(item);
            }
        } catch {
            missingItems.push(item);
        }
    }

    // Batch download missing items (e.g. 10 at a time)
    const BATCH_SIZE = 10;
    for (let i = 0; i < missingItems.length; i += BATCH_SIZE) {
        const batch = missingItems.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (item) => {
            try {
                const { uri } = await FileSystem.downloadAsync(item.url, item.localUri);
                // Verify the downloaded file actually exists
                const info = await FileSystem.getInfoAsync(uri);
                if (info.exists) {
                    downloadedFiles++;
                    onProgress(downloadedFiles / totalFiles);
                }
            } catch (error) {
                console.error(`Error downloading ${item.url}:`, error);
                // Even on error, we advance the progress to not get stuck
                downloadedFiles++;
                onProgress(downloadedFiles / totalFiles);
            }
        }));
    }
}
