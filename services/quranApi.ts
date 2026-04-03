// Quran API Service – Local Bundled Edition (quran-tajweed)

export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
}

export interface Ayah {
    number: number;
    numberInSurah: number;
    text: string;
    surah: {
        number: number;
        name: string;
    };
    juz: number;
    hizbQuarter: number;
    page: number;
}

export interface SurahDetail {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    ayahs: Ayah[];
}

// @ts-ignore
const quranData = require('../assets/data/quran.json');

/**
 * Get the list of all 114 surahs with metadata
 */
export async function getSurahList(): Promise<Surah[]> {
    return quranData.surahs;
}

/**
 * Get a complete surah with all its ayahs
 */
export async function getSurah(surahNumber: number): Promise<SurahDetail> {
    return quranData.surahDetails[surahNumber.toString()];
}

/**
 * Get a specific ayah
 */
export async function getAyah(surahNumber: number, ayahNumber: number): Promise<Ayah> {
    const detail = quranData.surahDetails[surahNumber.toString()] as SurahDetail;
    const ayah = detail.ayahs.find(a => a.numberInSurah === ayahNumber);
    if (!ayah) throw new Error('Ayah not found');
    return ayah;
}

/**
 * Search surahs by name (arabic or latin)
 */
export function searchSurahs(surahs: Surah[], query: string): Surah[] {
    const q = query.toLowerCase().trim();
    if (!q) return surahs;
    return surahs.filter(s =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.number.toString() === q
    );
}

// Stubs to prevent breaking existing components during transition
export async function checkTextCacheStatus() {
    return { completed: 114, total: 114, isComplete: true };
}

export async function downloadAllTextData() {
    return;
}
