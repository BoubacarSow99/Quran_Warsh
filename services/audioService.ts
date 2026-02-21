import { PRIMARY_AUDIO_BASE } from '../constants/reciters';

/**
 * Build the EveryAyah audio URL for a given ayah
 * URL pattern: baseUrl/SSSAAA.mp3  (e.g. 001001.mp3 = Al-Fatiha ayah 1)
 */
export function getAyahAudioUrl(
    surahNumber: number,
    ayahNumber: number,
    baseUrl: string = PRIMARY_AUDIO_BASE
): string {
    const surah = String(surahNumber).padStart(3, '0');
    const ayah = String(ayahNumber).padStart(3, '0');
    return `${baseUrl}/${surah}${ayah}.mp3`;
}

/**
 * Build audio URL for a full surah (not individual ayah)
 * Some sources offer full surah files
 */
export function getSurahAudioUrl(surahNumber: number): string {
    // Using AlQuran.cloud for full surah audio (Warsh – Hussary)
    const surah = String(surahNumber).padStart(3, '0');
    return `https://download.quranicaudio.com/quran/warsh_from_nafi_by_al-hussary/${surah}.mp3`;
}

/**
 * Get all ayah audio URLs for a full surah (for pre-fetching)
 */
export function getSurahAyahUrls(
    surahNumber: number,
    numberOfAyahs: number,
    baseUrl: string = PRIMARY_AUDIO_BASE
): string[] {
    return Array.from({ length: numberOfAyahs }, (_, i) =>
        getAyahAudioUrl(surahNumber, i + 1, baseUrl)
    );
}
