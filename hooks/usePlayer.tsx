import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';
import { getAyahAudioUrl } from '../services/audioService';
import { downloadSurahAudio, getCachedUri } from '../services/audioCacheService';
import { PRIMARY_AUDIO_BASE } from '../constants/reciters';
import type { Ayah } from '../services/quranApi';

export interface PlayerState {
    isPlaying: boolean;
    isLoading: boolean;
    isLooping: boolean;
    isBismillahPlaying: boolean;
    currentSurahNumber: number | null;
    currentAyahIndex: number;
    duration: number;
    position: number;
    reciterBaseUrl: string;
    downloadProgress: number; // 0 to 1
}
export interface PlayerContextType {
    state: PlayerState;
    play: (surahNumber: number, ayahIndex: number, ayahs?: Ayah[]) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    next: () => void;
    previous: () => void;
    toggleLoop: () => void;
    stop: () => Promise<void>;
    setReciter: (baseUrl: string) => void;
    initializeSurah: (surahNumber: number, ayahs: Ayah[]) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const ayahsRef = useRef<Ayah[]>([]);
    const isLoopingRef = useRef(false);
    const [state, setState] = useState<PlayerState>({
        isPlaying: false,
        isLoading: false,
        isLooping: false,
        isBismillahPlaying: false,
        currentSurahNumber: null,
        currentAyahIndex: 0,
        duration: 0,
        position: 0,
        reciterBaseUrl: PRIMARY_AUDIO_BASE,
        downloadProgress: 0,
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
        async (surahNumber: number, ayahIndex: number, skipBismillah: boolean = false) => {
            try {
                setState(prev => ({
                    ...prev,
                    isLoading: true,
                    currentSurahNumber: surahNumber,
                    isBismillahPlaying: !skipBismillah && ayahIndex === 0 && surahNumber > 1 && surahNumber !== 9
                }));

                // Unload previous sound
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }

                // Determine URL: if we need to play Bismillah, use Surah 1, Ayah 1 (unless it's actually Fatiha/Tawbah)
                const playBismillah = !skipBismillah && ayahIndex === 0 && surahNumber > 1 && surahNumber !== 9;

                const ayah = ayahsRef.current[ayahIndex];
                if (!ayah) return;

                const url = playBismillah
                    ? await getCachedUri(1, 1, state.reciterBaseUrl)
                    : await getCachedUri(surahNumber, ayah.numberInSurah, state.reciterBaseUrl);

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

                        // Auto-advance
                        if (status.didJustFinish) {
                            setTimeout(() => {
                                if (playBismillah) {
                                    // Just finished Bismillah, now play the actual first verse
                                    loadAndPlay(surahNumber, ayahIndex, true);
                                } else if (isLoopingRef.current) {
                                    loadAndPlay(surahNumber, ayahIndex, true);
                                } else if (ayahIndex < ayahsRef.current.length - 1) {
                                    loadAndPlay(surahNumber, ayahIndex + 1, false);
                                } else {
                                    setState(prev => ({
                                        ...prev,
                                        isPlaying: false,
                                        currentAyahIndex: 0,
                                    }));
                                }
                            }, 50);
                        }
                    }
                );

                soundRef.current = sound;
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    isPlaying: true,
                    // keep visual index at 0 even while Bismillah is playing
                    currentAyahIndex: ayahIndex,
                }));
            } catch (error) {
                console.error('Audio load error:', error);
                setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
            }
        },
        [state.isLooping, state.reciterBaseUrl]
    );

    const play = useCallback(
        async (surahNumber: number, ayahIndex: number, newAyahs?: Ayah[]) => {
            if (newAyahs) {
                ayahsRef.current = newAyahs;
            }

            if (ayahsRef.current.length === 0) {
                console.warn("No ayahs available to play");
                return;
            }

            // Initiate full surah download before playing
            setState(prev => ({ ...prev, isLoading: true, downloadProgress: 0 }));

            try {
                await downloadSurahAudio(
                    surahNumber,
                    ayahsRef.current,
                    state.reciterBaseUrl,
                    (progress) => {
                        setState(prev => ({ ...prev, downloadProgress: progress }));
                    }
                );
            } catch (err) {
                console.error("Failed to download surah", err);
            }

            // Proceed to play locally
            loadAndPlay(surahNumber, ayahIndex);
        },
        [loadAndPlay, state.reciterBaseUrl]
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
        if (nextIdx < ayahsRef.current.length) {
            loadAndPlay(state.currentSurahNumber, nextIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, loadAndPlay]);

    const previous = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const prevIdx = state.currentAyahIndex - 1;
        if (prevIdx >= 0) {
            loadAndPlay(state.currentSurahNumber, prevIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, loadAndPlay]);

    const toggleLoop = useCallback(() => {
        isLoopingRef.current = !isLoopingRef.current;
        setState(prev => ({ ...prev, isLooping: isLoopingRef.current }));
    }, []);

    const stop = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setState(prev => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            currentSurahNumber: null,
            currentAyahIndex: 0,
            downloadProgress: 0
        }));
    }, []);

    const setReciter = useCallback((baseUrl: string) => {
        stop();
        setState(prev => ({ ...prev, reciterBaseUrl: baseUrl }));
    }, [stop]);

    const initializeSurah = useCallback((surahNumber: number, ayahs: Ayah[]) => {
        ayahsRef.current = ayahs;
        setState(prev => ({
            ...prev,
            currentSurahNumber: surahNumber,
            currentAyahIndex: 0,
            isPlaying: false
        }));
    }, []);

    const value = {
        state,
        play,
        pause,
        resume,
        next,
        previous,
        toggleLoop,
        stop,
        setReciter,
        initializeSurah,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer(): PlayerContextType {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
