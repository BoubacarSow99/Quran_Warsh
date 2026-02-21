import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { getAyahAudioUrl } from '../services/audioService';
import { PRIMARY_AUDIO_BASE } from '../constants/reciters';
import type { Ayah } from '../services/quranApi';

export interface PlayerState {
    isPlaying: boolean;
    isLoading: boolean;
    isLooping: boolean;
    currentSurahNumber: number | null;
    currentAyahIndex: number;
    duration: number;
    position: number;
    reciterBaseUrl: string;
}

export function usePlayer(ayahs: Ayah[] = []) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [state, setState] = useState<PlayerState>({
        isPlaying: false,
        isLoading: false,
        isLooping: false,
        currentSurahNumber: null,
        currentAyahIndex: 0,
        duration: 0,
        position: 0,
        reciterBaseUrl: PRIMARY_AUDIO_BASE,
    });

    // Cleanup on unmount
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
        });
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    const loadAndPlay = useCallback(
        async (surahNumber: number, ayahIndex: number) => {
            try {
                setState(prev => ({ ...prev, isLoading: true, currentSurahNumber: surahNumber }));

                // Unload previous sound
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }

                const ayah = ayahs[ayahIndex];
                if (!ayah) return;

                const url = getAyahAudioUrl(
                    surahNumber,
                    ayah.numberInSurah,
                    state.reciterBaseUrl
                );

                const { sound } = await Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: true },
                    (status) => {
                        if (!status.isLoaded) return;
                        setState(prev => ({
                            ...prev,
                            isPlaying: status.isPlaying,
                            duration: status.durationMillis ?? 0,
                            position: status.positionMillis ?? 0,
                        }));
                        // Auto-advance to next ayah
                        if (status.didJustFinish) {
                            if (state.isLooping) {
                                loadAndPlay(surahNumber, ayahIndex);
                            } else if (ayahIndex < ayahs.length - 1) {
                                loadAndPlay(surahNumber, ayahIndex + 1);
                            } else {
                                setState(prev => ({
                                    ...prev,
                                    isPlaying: false,
                                    currentAyahIndex: 0,
                                }));
                            }
                        }
                    }
                );

                soundRef.current = sound;
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    isPlaying: true,
                    currentAyahIndex: ayahIndex,
                }));
            } catch (error) {
                console.error('Audio load error:', error);
                setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
            }
        },
        [ayahs, state.isLooping, state.reciterBaseUrl]
    );

    const play = useCallback(
        (surahNumber: number, ayahIndex: number) => {
            loadAndPlay(surahNumber, ayahIndex);
        },
        [loadAndPlay]
    );

    const pause = useCallback(async () => {
        await soundRef.current?.pauseAsync();
        setState(prev => ({ ...prev, isPlaying: false }));
    }, []);

    const resume = useCallback(async () => {
        await soundRef.current?.playAsync();
        setState(prev => ({ ...prev, isPlaying: true }));
    }, []);

    const next = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const nextIdx = state.currentAyahIndex + 1;
        if (nextIdx < ayahs.length) {
            loadAndPlay(state.currentSurahNumber, nextIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, ayahs.length, loadAndPlay]);

    const previous = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const prevIdx = state.currentAyahIndex - 1;
        if (prevIdx >= 0) {
            loadAndPlay(state.currentSurahNumber, prevIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, loadAndPlay]);

    const toggleLoop = useCallback(() => {
        setState(prev => ({ ...prev, isLooping: !prev.isLooping }));
    }, []);

    const stop = useCallback(async () => {
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        setState(prev => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            position: 0,
        }));
    }, []);

    const setReciter = useCallback((baseUrl: string) => {
        stop();
        setState(prev => ({ ...prev, reciterBaseUrl: baseUrl }));
    }, [stop]);

    return {
        state,
        play,
        pause,
        resume,
        next,
        previous,
        toggleLoop,
        stop,
        setReciter,
    };
}
