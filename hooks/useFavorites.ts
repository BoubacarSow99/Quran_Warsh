import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    getFavoriteSurahs,
    toggleFavoriteSurah,
    getFavoriteAyahs,
    toggleFavoriteAyah,
    FavoriteAyah,
} from '../services/storageService';
import { getSurahList, Surah } from '../services/quranApi';

export function useFavorites() {
    const [favSurahs, setFavSurahs] = useState<number[]>([]);
    const [favAyahs, setFavAyahs] = useState<FavoriteAyah[]>([]);
    const [surahList, setSurahList] = useState<Surah[]>([]);

    const reload = useCallback(async () => {
        const [surahs, ayahs, fullList] = await Promise.all([
            getFavoriteSurahs(),
            getFavoriteAyahs(),
            surahList.length === 0 ? getSurahList() : Promise.resolve(surahList)
        ]);
        setFavSurahs(surahs);
        setFavAyahs(ayahs);
        if (surahList.length === 0) setSurahList(fullList);
    }, [surahList]);

    // This ensures synchronization when switching between tabs
    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    const toggleSurah = useCallback(async (surahNumber: number) => {
        await toggleFavoriteSurah(surahNumber);
        await reload();
    }, [reload]);

    const toggleAyah = useCallback(async (ayah: FavoriteAyah) => {
        await toggleFavoriteAyah(ayah);
        await reload();
    }, [reload]);

    const isSurahFav = (surahNumber: number) => favSurahs.includes(surahNumber);
    const isAyahFav = (surahNumber: number, ayahNumber: number) =>
        favAyahs.some(f => f.surahNumber === surahNumber && f.ayahNumber === ayahNumber);

    // Get detailed info for the favorite surahs
    const favSurahDetails = surahList.filter(s => favSurahs.includes(s.number));

    return {
        favSurahs,
        favAyahs,
        favSurahDetails,
        toggleSurah,
        toggleAyah,
        isSurahFav,
        isAyahFav,
        reload
    };
}
