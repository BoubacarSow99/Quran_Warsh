import AsyncStorage from '@react-native-async-storage/async-storage';

// ── App Settings ──────────────────────────────────────────────────────────
export interface AppSettings {
    fontSize: number;
    defaultReciterId: string;
    darkMode: boolean;
    autoDownload: boolean;
}

const SETTINGS_KEY = 'app_settings_v1';
const SETTINGS_DEFAULTS: AppSettings = {
    fontSize: 24,
    defaultReciterId: 'sudais',
    darkMode: false,
    autoDownload: false,
};

export async function getSettings(): Promise<AppSettings> {
    try {
        const json = await AsyncStorage.getItem(SETTINGS_KEY);
        return json ? { ...SETTINGS_DEFAULTS, ...JSON.parse(json) } : SETTINGS_DEFAULTS;
    } catch (e) {
        return SETTINGS_DEFAULTS;
    }
}

export async function saveSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
    try {
        const current = await getSettings();
        const updated = { ...current, ...changes };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to save settings', e);
        return SETTINGS_DEFAULTS;
    }
}


// ── Favorites Management ──────────────────────────────────────────────────
export interface FavoriteAyah {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    ayahText: string;
}

const FAV_SURAHS_KEY = 'fav_surahs_v1';
const FAV_AYAHS_KEY = 'fav_ayahs_v1';

export async function getFavoriteSurahs(): Promise<number[]> {
    try {
        const json = await AsyncStorage.getItem(FAV_SURAHS_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
}

export async function toggleFavoriteSurah(surahNumber: number) {
    const current = await getFavoriteSurahs();
    const updated = current.includes(surahNumber)
        ? current.filter(n => n !== surahNumber)
        : [...current, surahNumber];
    await AsyncStorage.setItem(FAV_SURAHS_KEY, JSON.stringify(updated));
}

export async function getFavoriteAyahs(): Promise<FavoriteAyah[]> {
    try {
        const json = await AsyncStorage.getItem(FAV_AYAHS_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
}

export async function toggleFavoriteAyah(ayah: FavoriteAyah) {
    const current = await getFavoriteAyahs();
    const exists = current.find(f => f.surahNumber === ayah.surahNumber && f.ayahNumber === ayah.ayahNumber);
    const updated = exists
        ? current.filter(f => !(f.surahNumber === ayah.surahNumber && f.ayahNumber === ayah.ayahNumber))
        : [...current, ayah];
    await AsyncStorage.setItem(FAV_AYAHS_KEY, JSON.stringify(updated));
}


// ── Last Position Tracking ────────────────────────────────────────────────
const LAST_READ_KEY = 'last_read_v1';

export interface LastRead {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    timestamp: number;
    type?: 'reading' | 'listening';
}

/**
 * Saves the last read/listened position.
 */
export async function saveLastRead(data: Omit<LastRead, 'timestamp'>) {
    try {
        const payload: LastRead = {
            ...data,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error('Failed to save last read', e);
    }
}

/**
 * Alias for saveLastRead to support "position" terminology
 */
export const saveLastPosition = saveLastRead;

/**
 * Retrieves the last read position.
 */
export async function getLastRead(): Promise<LastRead | null> {
    try {
        const json = await AsyncStorage.getItem(LAST_READ_KEY);
        return json ? JSON.parse(json) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Clears the last read position.
 */
export async function clearLastRead() {
    await AsyncStorage.removeItem(LAST_READ_KEY);
}
