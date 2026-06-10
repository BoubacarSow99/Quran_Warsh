import { File, Directory, Paths } from 'expo-file-system';
import { getLocalFileName } from './audioCacheService';

export const MERGED_DIR = new Directory(Paths.document, 'quran_merged');

export async function initMergedCache() {
    try {
        if (!MERGED_DIR.exists) {
            MERGED_DIR.create({ intermediates: true });
        }
    } catch (e) {
        console.error('Failed to init merged cache dir', e);
    }
}

export async function clearMergedCache() {
    try {
        if (MERGED_DIR.exists) {
            MERGED_DIR.delete();
        }
        await initMergedCache();
    } catch (e) {
        console.error('Failed to clear merged cache', e);
    }
}

export interface MergedSurah {
    uri: string;
    ayahOffsets: { numberInSurah: number; startMs: number; endMs: number }[];
}

export async function buildSurahTrack(
    surahNumber: number,
    ayahs: { numberInSurah: number }[],
    baseUrl: string
): Promise<MergedSurah> {
    await initMergedCache();

    const reciterId = baseUrl.split('/').pop() || 'default';
    const bitrateMatch = baseUrl.match(/_(\d+)kbps/);
    const bitrate = bitrateMatch ? parseInt(bitrateMatch[1], 10) : 128; // Default 128kbps
    const bytesPerSecond = (bitrate * 1000) / 8;

    const mergedFileName = `${reciterId}_${surahNumber}.mp3`;
    const metadataFileName = `${reciterId}_${surahNumber}.json`;
    
    const mergedFile = new File(MERGED_DIR, mergedFileName);
    const metadataFile = new File(MERGED_DIR, metadataFileName);

    if (mergedFile.exists && metadataFile.exists) {
        try {
            const metaStr = await metadataFile.text();
            return {
                uri: mergedFile.uri,
                ayahOffsets: JSON.parse(metaStr),
            };
        } catch (e) {
            // Failed to parse metadata, will rebuild
        }
    }

    const AUDIO_DIR = new Directory(Paths.document, 'quran_audio');
    const offsets: { numberInSurah: number; startMs: number; endMs: number }[] = [];
    let currentOffsetMs = 0;

    if (!mergedFile.exists) mergedFile.create();
    
    // FileHandle allows writing bytes directly
    const handle = mergedFile.open();

    try {
        let filesToMerge: { numberInSurah: number; file: File }[] = [];
        
        if (surahNumber > 1 && surahNumber !== 9) {
            filesToMerge.push({ 
                numberInSurah: 0, 
                file: new File(AUDIO_DIR, getLocalFileName(1, 1, baseUrl)) 
            });
        }

        for (const ayah of ayahs) {
            filesToMerge.push({ 
                numberInSurah: ayah.numberInSurah, 
                file: new File(AUDIO_DIR, getLocalFileName(surahNumber, ayah.numberInSurah, baseUrl)) 
            });
        }

        for (const item of filesToMerge) {
            if (!item.file.exists) {
                throw new Error(`Missing audio file for surah ${surahNumber} ayah ${item.numberInSurah}`);
            }

            const bytes = await item.file.bytes();
            handle.writeBytes(bytes);

            // Estimate duration of this MP3 chunk using its size and CBR bitrate
            const durationMs = Math.round((bytes.length / bytesPerSecond) * 1000);
            
            if (item.numberInSurah > 0) {
                offsets.push({
                    numberInSurah: item.numberInSurah,
                    startMs: currentOffsetMs,
                    endMs: currentOffsetMs + durationMs
                });
            }
            
            currentOffsetMs += durationMs;
        }

        handle.close();
        
        if (!metadataFile.exists) metadataFile.create();
        metadataFile.write(JSON.stringify(offsets));

        return {
            uri: mergedFile.uri,
            ayahOffsets: offsets,
        };
    } catch (e) {
        handle.close();
        if (mergedFile.exists) mergedFile.delete();
        if (metadataFile.exists) metadataFile.delete();
        throw e;
    }
}
