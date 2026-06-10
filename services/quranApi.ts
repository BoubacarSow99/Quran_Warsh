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

export interface Juz {
    number: number;
    name: string;
    startSurahNumber: number;
    startSurahName: string;
    startSurahEnglishName: string;
    startAyahNumber: number;
    endSurahNumber: number;
    endSurahName: string;
    endSurahEnglishName: string;
    endAyahNumber: number;
}

export interface Hizb {
    number: number;
    juzParent: number;
    startSurahNumber: number;
    startSurahName: string;
    startSurahEnglishName: string;
    startAyahNumber: number;
}

const JUZ_RAW_DATA = [
    { number: 1, name: "الجزء الأول", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
    { number: 2, name: "الجزء الثاني", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
    { number: 3, name: "الجزء الثالث", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
    { number: 4, name: "الجزء الرابع", startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
    { number: 5, name: "الجزء الخامس", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
    { number: 6, name: "الجزء السادس", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
    { number: 7, name: "الجزء السابع", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
    { number: 8, name: "الجزء الثامن", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
    { number: 9, name: "الجزء التاسع", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
    { number: 10, name: "الجزء العاشر", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
    { number: 11, name: "الجزء الحادي عشر", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
    { number: 12, name: "الجزء الثاني عشر", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
    { number: 13, name: "الجزء الثالث عشر", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
    { number: 14, name: "الجزء الرابع عشر", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
    { number: 15, name: "الجزء الخامس عشر", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
    { number: 16, name: "الجزء السادس عشر", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
    { number: 17, name: "الجزء السابع عشر", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
    { number: 18, name: "الجزء الثامن عشر", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
    { number: 19, name: "الجزء التاسع عشر", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
    { number: 20, name: "الجزء العشرون", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
    { number: 21, name: "الجزء الحادي والعشرون", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
    { number: 22, name: "الجزء الثاني والعشرون", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
    { number: 23, name: "الجزء الثالث والعشرون", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
    { number: 24, name: "الجزء الرابع والعشرون", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
    { number: 25, name: "الجزء الخامس والعشرون", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
    { number: 26, name: "الجزء السادس والعشرون", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
    { number: 27, name: "الجزء السابع والعشرون", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
    { number: 28, name: "الجزء الثامن والعشرون", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
    { number: 29, name: "الجزء التاسع والعشرون", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
    { number: 30, name: "الجزء الثلاثون", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 }
];

const HIZB_RAW_DATA = [
    { number: 1, juzParent: 1, startSurah: 1, startAyah: 1 },
    { number: 2, juzParent: 1, startSurah: 2, startAyah: 75 },
    { number: 3, juzParent: 2, startSurah: 2, startAyah: 142 },
    { number: 4, juzParent: 2, startSurah: 2, startAyah: 203 },
    { number: 5, juzParent: 3, startSurah: 2, startAyah: 253 },
    { number: 6, juzParent: 3, startSurah: 3, startAyah: 15 },
    { number: 7, juzParent: 4, startSurah: 3, startAyah: 93 },
    { number: 8, juzParent: 4, startSurah: 3, startAyah: 171 },
    { number: 9, juzParent: 5, startSurah: 4, startAyah: 24 },
    { number: 10, juzParent: 5, startSurah: 4, startAyah: 88 },
    { number: 11, juzParent: 6, startSurah: 4, startAyah: 148 },
    { number: 12, juzParent: 6, startSurah: 5, startAyah: 27 },
    { number: 13, juzParent: 7, startSurah: 5, startAyah: 82 },
    { number: 14, juzParent: 7, startSurah: 6, startAyah: 36 },
    { number: 15, juzParent: 8, startSurah: 6, startAyah: 111 },
    { number: 16, juzParent: 8, startSurah: 7, startAyah: 1 },
    { number: 17, juzParent: 9, startSurah: 7, startAyah: 88 },
    { number: 18, juzParent: 9, startSurah: 7, startAyah: 171 },
    { number: 19, juzParent: 10, startSurah: 8, startAyah: 41 },
    { number: 20, juzParent: 10, startSurah: 9, startAyah: 34 },
    { number: 21, juzParent: 11, startSurah: 9, startAyah: 93 },
    { number: 22, juzParent: 11, startSurah: 10, startAyah: 26 },
    { number: 23, juzParent: 12, startSurah: 11, startAyah: 6 },
    { number: 24, juzParent: 12, startSurah: 11, startAyah: 84 },
    { number: 25, juzParent: 13, startSurah: 12, startAyah: 53 },
    { number: 26, juzParent: 13, startSurah: 13, startAyah: 19 },
    { number: 27, juzParent: 14, startSurah: 15, startAyah: 1 },
    { number: 28, juzParent: 14, startSurah: 16, startAyah: 51 },
    { number: 29, juzParent: 15, startSurah: 17, startAyah: 1 },
    { number: 30, juzParent: 15, startSurah: 17, startAyah: 99 },
    { number: 31, juzParent: 16, startSurah: 18, startAyah: 75 },
    { number: 32, juzParent: 16, startSurah: 20, startAyah: 1 },
    { number: 33, juzParent: 17, startSurah: 21, startAyah: 1 },
    { number: 34, juzParent: 17, startSurah: 22, startAyah: 1 },
    { number: 35, juzParent: 18, startSurah: 23, startAyah: 1 },
    { number: 36, juzParent: 18, startSurah: 24, startAyah: 21 },
    { number: 37, juzParent: 19, startSurah: 25, startAyah: 21 },
    { number: 38, juzParent: 19, startSurah: 26, startAyah: 111 },
    { number: 39, juzParent: 20, startSurah: 27, startAyah: 56 },
    { number: 40, juzParent: 20, startSurah: 28, startAyah: 51 },
    { number: 41, juzParent: 21, startSurah: 29, startAyah: 46 },
    { number: 42, juzParent: 21, startSurah: 31, startAyah: 22 },
    { number: 43, juzParent: 22, startSurah: 33, startAyah: 31 },
    { number: 44, juzParent: 22, startSurah: 34, startAyah: 24 },
    { number: 45, juzParent: 23, startSurah: 36, startAyah: 28 },
    { number: 46, juzParent: 23, startSurah: 37, startAyah: 145 },
    { number: 47, juzParent: 24, startSurah: 39, startAyah: 32 },
    { number: 48, juzParent: 24, startSurah: 40, startAyah: 41 },
    { number: 49, juzParent: 25, startSurah: 41, startAyah: 47 },
    { number: 50, juzParent: 25, startSurah: 43, startAyah: 24 },
    { number: 51, juzParent: 26, startSurah: 46, startAyah: 1 },
    { number: 52, juzParent: 26, startSurah: 48, startAyah: 18 },
    { number: 53, juzParent: 27, startSurah: 51, startAyah: 31 },
    { number: 54, juzParent: 27, startSurah: 55, startAyah: 1 },
    { number: 55, juzParent: 28, startSurah: 58, startAyah: 1 },
    { number: 56, juzParent: 28, startSurah: 62, startAyah: 1 },
    { number: 57, juzParent: 29, startSurah: 67, startAyah: 1 },
    { number: 58, juzParent: 29, startSurah: 72, startAyah: 1 },
    { number: 59, juzParent: 30, startSurah: 78, startAyah: 1 },
    { number: 60, juzParent: 30, startSurah: 87, startAyah: 1 }
];

let cachedJuzList: Juz[] | null = null;
let cachedHizbList: Hizb[] | null = null;

function getSurahMeta(num: number) {
    const s = quranData.surahs.find((x: any) => x.number === num);
    return {
        name: s ? s.name : '',
        englishName: s ? s.englishName : ''
    };
}

function buildJuzAndHizbLists() {
    if (cachedJuzList && cachedHizbList) return;

    cachedJuzList = JUZ_RAW_DATA.map(j => {
        const startMeta = getSurahMeta(j.startSurah);
        const endMeta = getSurahMeta(j.endSurah);
        return {
            number: j.number,
            name: j.name,
            startSurahNumber: j.startSurah,
            startSurahName: startMeta.name,
            startSurahEnglishName: startMeta.englishName,
            startAyahNumber: j.startAyah,
            endSurahNumber: j.endSurah,
            endSurahName: endMeta.name,
            endSurahEnglishName: endMeta.englishName,
            endAyahNumber: j.endAyah
        };
    });

    cachedHizbList = HIZB_RAW_DATA.map(h => {
        const startMeta = getSurahMeta(h.startSurah);
        return {
            number: h.number,
            juzParent: h.juzParent,
            startSurahNumber: h.startSurah,
            startSurahName: startMeta.name,
            startSurahEnglishName: startMeta.englishName,
            startAyahNumber: h.startAyah
        };
    });
}

export async function getJuzList(): Promise<Juz[]> {
    buildJuzAndHizbLists();
    return cachedJuzList || [];
}

export async function getHizbList(): Promise<Hizb[]> {
    buildJuzAndHizbLists();
    return cachedHizbList || [];
}

