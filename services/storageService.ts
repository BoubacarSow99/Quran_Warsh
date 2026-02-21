import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    FAVORITES_SURAHS: 'favorites_surahs',
    FAVORITES_AYAHS: 'favorites_ayahs',
    LAST_READ: 'last_read',
    SETTINGS: 'settings',
    DOWNLOADED_SURAHS: 'downloaded_surahs',
};

export interface LastRead {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    timestamp: number;
}

export interface FavoriteAyah {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    ayahText: string;
}

export interface AppSettings {
    fontSize: number;          // 18–36
    defaultReciterId: string;
    darkMode: boolean;
    autoDownload: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    fontSize: 24,
    defaultReciterId: 'hussary_warsh',
    darkMode: false,
    autoDownload: false,
};

// ─── Favorites – Surahs ───────────────────────────────────────────────────────

export async function getFavoriteSurahs(): Promise<number[]> {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITES_SURAHS);
    return raw ? JSON.parse(raw) : [];
}

export async function toggleFavoriteSurah(surahNumber: number): Promise<boolean> {
    const favs = await getFavoriteSurahs();
    const idx = favs.indexOf(surahNumber);
    if (idx >= 0) {
        favs.splice(idx, 1);
        await AsyncStorage.setItem(KEYS.FAVORITES_SURAHS, JSON.stringify(favs));
        return false; // removed
    } else {
        favs.push(surahNumber);
        await AsyncStorage.setItem(KEYS.FAVORITES_SURAHS, JSON.stringify(favs));
        return true; // added
    }
}

// ─── Favorites – Ayahs ────────────────────────────────────────────────────────

export async function getFavoriteAyahs(): Promise<FavoriteAyah[]> {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITES_AYAHS);
    return raw ? JSON.parse(raw) : [];
}

export async function toggleFavoriteAyah(ayah: FavoriteAyah): Promise<boolean> {
    const favs = await getFavoriteAyahs();
    const idx = favs.findIndex(
        f => f.surahNumber === ayah.surahNumber && f.ayahNumber === ayah.ayahNumber
    );
    if (idx >= 0) {
        favs.splice(idx, 1);
        await AsyncStorage.setItem(KEYS.FAVORITES_AYAHS, JSON.stringify(favs));
        return false;
    } else {
        favs.push(ayah);
        await AsyncStorage.setItem(KEYS.FAVORITES_AYAHS, JSON.stringify(favs));
        return true;
    }
}

export async function isAyahFavorite(surahNumber: number, ayahNumber: number): Promise<boolean> {
    const favs = await getFavoriteAyahs();
    return favs.some(f => f.surahNumber === surahNumber && f.ayahNumber === ayahNumber);
}

// ─── Last Read ────────────────────────────────────────────────────────────────

export async function saveLastRead(lastRead: LastRead): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(lastRead));
}

export async function getLastRead(): Promise<LastRead | null> {
    const raw = await AsyncStorage.getItem(KEYS.LAST_READ);
    return raw ? JSON.parse(raw) : null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

// ─── Downloaded Surahs ────────────────────────────────────────────────────────

export async function getDownloadedSurahs(): Promise<number[]> {
    const raw = await AsyncStorage.getItem(KEYS.DOWNLOADED_SURAHS);
    return raw ? JSON.parse(raw) : [];
}

export async function markSurahDownloaded(surahNumber: number): Promise<void> {
    const downloaded = await getDownloadedSurahs();
    if (!downloaded.includes(surahNumber)) {
        downloaded.push(surahNumber);
        await AsyncStorage.setItem(KEYS.DOWNLOADED_SURAHS, JSON.stringify(downloaded));
    }
}
