import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, AudioPlayer } from 'expo-audio';
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
    duration: number; // in ms
    position: number; // in ms
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
    const playerRef = useRef<AudioPlayer | null>(null);
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

    // Stable reference to the player
    if (!playerRef.current) {
        playerRef.current = createAudioPlayer(null);
    }
    const player = playerRef.current;

    // Background mode & cleanup
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'doNotMix',
        });

        const statusSub = player.addListener('playbackStatusUpdate', (status) => {
            setState(prev => ({
                ...prev,
                isPlaying: status.playing,
                duration: status.duration * 1000,
                position: status.currentTime * 1000,
                isLoading: status.isBuffering && !status.playing,
            }));

            if (status.didJustFinish) {
                handleAutoAdvance();
            }
        });

        return () => {
            statusSub.remove();
            player.remove();
        };
    }, []);

    // Auto-advance logic (moved to a function to be called from the listener)
    // We use refs for surah/index to avoid stale closures in the listener
    const currentSurahRef = useRef<number | null>(null);
    const currentIndexRef = useRef(0);
    const isBismillahPlayingRef = useRef(false);

    const loadAndPlayInner = useCallback(async (surahNumber: number, ayahIndex: number, skipBismillah: boolean = false) => {
        try {
            const playBismillah = !skipBismillah && ayahIndex === 0 && surahNumber > 1 && surahNumber !== 9;

            isBismillahPlayingRef.current = playBismillah;
            currentSurahRef.current = surahNumber;
            currentIndexRef.current = ayahIndex;

            setState(prev => ({
                ...prev,
                isLoading: true,
                currentSurahNumber: surahNumber,
                isBismillahPlaying: playBismillah,
                currentAyahIndex: ayahIndex,
            }));

            const ayah = ayahsRef.current[ayahIndex];
            if (!ayah) return;

            const url = playBismillah
                ? await getCachedUri(1, 1, state.reciterBaseUrl)
                : await getCachedUri(surahNumber, ayah.numberInSurah, state.reciterBaseUrl);

            player.replace(url);
            player.play();

            setState(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Audio load error:', error);
            setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
        }
    }, [state.reciterBaseUrl]);

    const handleAutoAdvance = useCallback(() => {
        const surahNumber = currentSurahRef.current;
        const ayahIndex = currentIndexRef.current;
        const playBismillah = isBismillahPlayingRef.current;

        if (!surahNumber) return;

        setTimeout(() => {
            if (playBismillah) {
                // Just finished Bismillah, now play the actual first verse
                loadAndPlayInner(surahNumber, ayahIndex, true);
            } else if (isLoopingRef.current) {
                player.seekTo(0);
                player.play();
            } else if (ayahIndex < ayahsRef.current.length - 1) {
                loadAndPlayInner(surahNumber, ayahIndex + 1, false);
            } else {
                setState(prev => ({
                    ...prev,
                    isPlaying: false,
                    currentAyahIndex: 0,
                }));
            }
        }, 50);
    }, [loadAndPlayInner]);

    const play = useCallback(
        async (surahNumber: number, ayahIndex: number, newAyahs?: Ayah[]) => {
            if (newAyahs) {
                ayahsRef.current = newAyahs;
            }

            if (ayahsRef.current.length === 0) {
                console.warn("No ayahs available to play");
                return;
            }

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

            loadAndPlayInner(surahNumber, ayahIndex);
        },
        [loadAndPlayInner, state.reciterBaseUrl]
    );

    const pause = useCallback(async () => {
        player.pause();
    }, []);

    const resume = useCallback(async () => {
        player.play();
    }, []);

    const next = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const nextIdx = state.currentAyahIndex + 1;
        if (nextIdx < ayahsRef.current.length) {
            loadAndPlayInner(state.currentSurahNumber, nextIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, loadAndPlayInner]);

    const previous = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const prevIdx = state.currentAyahIndex - 1;
        if (prevIdx >= 0) {
            loadAndPlayInner(state.currentSurahNumber, prevIdx);
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, loadAndPlayInner]);

    const toggleLoop = useCallback(() => {
        isLoopingRef.current = !isLoopingRef.current;
        setState(prev => ({ ...prev, isLooping: isLoopingRef.current }));
    }, []);

    const stop = useCallback(async () => {
        player.pause();
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
