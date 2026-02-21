import { useState, useEffect, useCallback } from 'react';
import {
    getFavoriteSurahs,
    toggleFavoriteSurah,
    getFavoriteAyahs,
    toggleFavoriteAyah,
    FavoriteAyah,
} from '../services/storageService';

export function useFavorites() {
    const [favSurahs, setFavSurahs] = useState<number[]>([]);
    const [favAyahs, setFavAyahs] = useState<FavoriteAyah[]>([]);

    useEffect(() => {
        reload();
    }, []);

    const reload = async () => {
        const [surahs, ayahs] = await Promise.all([getFavoriteSurahs(), getFavoriteAyahs()]);
        setFavSurahs(surahs);
        setFavAyahs(ayahs);
    };

    const toggleSurah = useCallback(async (surahNumber: number) => {
        await toggleFavoriteSurah(surahNumber);
        const updated = await getFavoriteSurahs();
        setFavSurahs(updated);
    }, []);

    const toggleAyah = useCallback(async (ayah: FavoriteAyah) => {
        await toggleFavoriteAyah(ayah);
        const updated = await getFavoriteAyahs();
        setFavAyahs(updated);
    }, []);

    const isSurahFav = (surahNumber: number) => favSurahs.includes(surahNumber);
    const isAyahFav = (surahNumber: number, ayahNumber: number) =>
        favAyahs.some(f => f.surahNumber === surahNumber && f.ayahNumber === ayahNumber);

    return { favSurahs, favAyahs, toggleSurah, toggleAyah, isSurahFav, isAyahFav, reload };
}
