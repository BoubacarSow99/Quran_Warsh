// Quran API Service – using AlQuran.cloud API with Hafs edition
// Docs: https://alquran.cloud/api

export interface Surah {
    number: number;
    name: string;           // arabic
    englishName: string;
    englishNameTranslation: string;
    revelationType: string; // Meccan | Medinan
    numberOfAyahs: number;
}

export interface Ayah {
    number: number;         // absolute ayah number (1-6236)
    numberInSurah: number;  // ayah number within the surah
    text: string;           // arabic text (Hafs)
    surah: {
        number: number;
        name: string;
    };
    juz: number;
    hizb: number;
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

const BASE_URL = 'https://api.alquran.cloud/v1';
// Standard Hafs Uthmani edition identifier on AlQuran.cloud
const HAFS_EDITION = 'quran-uthmani';
// Fallback to standard arabic text if Uthmani edition has issues
const ARABIC_EDITION = 'quran-simple-clean';

async function apiFetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    if (json.code !== 200) {
        throw new Error(`API response error: ${json.status}`);
    }
    return json.data as T;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get the list of all 114 surahs with metadata
 */

export async function getSurahList(): Promise<Surah[]> {
    return apiFetch<Surah[]>('/surah');
}

/**
 * Get a complete surah with all its ayahs in Arabic (Hafs)
 */
export async function getSurah(surahNumber: number): Promise<SurahDetail> {
    const cacheKey = `@surah_${surahNumber}_${HAFS_EDITION}`;
    
    try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch { /* ignore read error */ }

    try {
        const data = await apiFetch<SurahDetail>(`/surah/${surahNumber}/${HAFS_EDITION}`);
        try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        } catch { /* ignore write error */ }
        return data;
    } catch {
        // Fallback to standard Arabic if Uthmani edition unavailable
        return apiFetch<SurahDetail>(`/surah/${surahNumber}/${ARABIC_EDITION}`);
    }
}


/**
 * Get a specific ayah
 */
export async function getAyah(surahNumber: number, ayahNumber: number): Promise<Ayah> {
    const data = await apiFetch<Ayah>(`/ayah/${surahNumber}:${ayahNumber}/${HAFS_EDITION}`);
    return data;
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
