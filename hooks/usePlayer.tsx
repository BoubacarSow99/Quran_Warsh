import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { downloadSurahAudio, isSurahFullyCached } from '../services/audioCacheService';
import { buildSurahTrack } from '../services/audioMergeService';
import { saveLastPosition } from '../services/storageService';
import { PRIMARY_AUDIO_BASE } from '../constants/reciters';
import type { Ayah } from '../services/quranApi';
import { getSurah } from '../services/quranApi';

export interface PlayerState {
    isPlaying: boolean;
    isLoading: boolean;
    isLooping: boolean;
    repeatCount: number;
    isBismillahPlaying: boolean;
    currentSurahNumber: number | null;
    currentAyahIndex: number;
    duration: number; // in ms
    position: number; // in ms
    reciterBaseUrl: string;
    downloadProgress: number; // 0 to 1
    sleepTimerEndsAt: number | null; // timestamp in ms, null = no timer
    sleepTimerDuration: number | null; // configured duration in minutes, null = no timer
}
export interface PlayerContextType {
    state: PlayerState;
    play: (surahNumber: number, ayahIndex: number, ayahs?: Ayah[]) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    next: () => void;
    previous: () => void;
    toggleLoop: () => void;
    cycleRepeat: () => void;
    stop: () => Promise<void>;
    setReciter: (baseUrl: string) => void;
    initializeSurah: (surahNumber: number, ayahs: Ayah[], initialAyahIndex?: number) => void;
    setSleepTimer: (minutes: number | null) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const playerRef = useRef<AudioPlayer>(createAudioPlayer(null));
    
    const ayahsRef = useRef<Ayah[]>([]);
    const ayahOffsetsRef = useRef<{ numberInSurah: number; startMs: number; endMs: number }[]>([]);
    const isLoopingRef = useRef(false);
    const repeatCountRef = useRef(1);
    const currentRepeatRef = useRef(1);
    const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reciterBaseUrlRef = useRef(PRIMARY_AUDIO_BASE);
    
    const [state, setState] = useState<PlayerState>({
        isPlaying: false,
        isLoading: false,
        isLooping: false,
        repeatCount: 1,
        isBismillahPlaying: false,
        currentSurahNumber: null,
        currentAyahIndex: 0,
        duration: 0,
        position: 0,
        reciterBaseUrl: PRIMARY_AUDIO_BASE,
        downloadProgress: 0,
        sleepTimerEndsAt: null,
        sleepTimerDuration: null,
    });

    const onDidJustFinishRef = useRef<() => void>(() => {});
    const hasLoadedUrlRef = useRef(false);

    useEffect(() => {
        reciterBaseUrlRef.current = state.reciterBaseUrl;
    }, [state.reciterBaseUrl]);

    const currentSurahRef = useRef<number | null>(null);
    const currentIndexRef = useRef(0);

    useEffect(() => {
        const configureAudio = () =>
            setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: true,
                interruptionMode: 'doNotMix',
            });

        configureAudio();

        const appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (next === 'active') configureAudio();
        });

        const sub = playerRef.current.addListener('playbackStatusUpdate', (status) => {
            const posMs = status.currentTime * 1000;
            const offsets = ayahOffsetsRef.current;
            
            let isBism = false;
            let newIndex = currentIndexRef.current;

            if (offsets.length > 0 && status.playing) {
                const currentAyahOffset = offsets[currentIndexRef.current];
                
                // Track Bismillah (if before first ayah)
                isBism = posMs < offsets[0].startMs && currentSurahRef.current! > 1 && currentSurahRef.current !== 9;

                if (currentAyahOffset && posMs >= currentAyahOffset.endMs) {
                    if (repeatCountRef.current > 1 && currentRepeatRef.current < repeatCountRef.current) {
                        currentRepeatRef.current += 1;
                        playerRef.current.seekTo(currentAyahOffset.startMs / 1000);
                        return; // Skip state update to avoid flickers
                    } else {
                        currentRepeatRef.current = 1;
                        newIndex = currentIndexRef.current + 1;
                    }
                }

                // If jumping via seek or normal advance
                if (!currentAyahOffset || posMs < currentAyahOffset.startMs || posMs > currentAyahOffset.endMs) {
                    const foundIndex = offsets.findIndex(o => posMs >= o.startMs && posMs < o.endMs);
                    if (foundIndex !== -1 && foundIndex !== currentIndexRef.current) {
                        newIndex = foundIndex;
                    }
                }
            }

            // Did the index change?
            if (newIndex !== currentIndexRef.current && newIndex < offsets.length) {
                currentIndexRef.current = newIndex;
                
                const ayah = ayahsRef.current[newIndex];
                if (ayah && currentSurahRef.current) {
                    saveLastPosition({
                        surahNumber: currentSurahRef.current,
                        surahName: ayah.surah?.name || `Sourate ${currentSurahRef.current}`,
                        ayahNumber: ayah.numberInSurah,
                        type: 'listening',
                    });
                }
            }

            setState(prev => ({
                ...prev,
                isPlaying: status.playing,
                duration: status.duration * 1000,
                position: posMs,
                isLoading: status.isBuffering && !status.playing,
                currentAyahIndex: currentIndexRef.current,
                isBismillahPlaying: isBism,
            }));

            if (status.didJustFinish) {
                onDidJustFinishRef.current();
            }
        });

        return () => {
            appStateSub.remove();
            sub.remove();
            playerRef.current.remove();
        };
    }, []);

    const loadAndPlayInner = useCallback(async (surahNumber: number, ayahIndex: number) => {
        try {
            currentSurahRef.current = surahNumber;
            currentIndexRef.current = ayahIndex;
            currentRepeatRef.current = 1;

            setState(prev => ({
                ...prev,
                isLoading: true,
                currentSurahNumber: surahNumber,
                currentAyahIndex: ayahIndex,
            }));

            const ayahs = ayahsRef.current;
            if (ayahs.length === 0) return;

            const merged = await buildSurahTrack(surahNumber, ayahs, reciterBaseUrlRef.current);
            ayahOffsetsRef.current = merged.ayahOffsets;

            await playerRef.current.replace(merged.uri);

            try {
                playerRef.current.setActiveForLockScreen(true, {
                    title: ayahs[0]?.surah?.name || `Sourate ${surahNumber}`,
                    artist: 'Al-Quran Hafs',
                    albumTitle: 'Coran Complet',
                });
            } catch (e) {
                console.log("Lock screen metadata unsupported", e);
            }

            if (ayahIndex === 0) {
                playerRef.current.seekTo(0);
            } else {
                const offset = merged.ayahOffsets[ayahIndex];
                if (offset) {
                    playerRef.current.seekTo(offset.startMs / 1000);
                }
            }
            
            playerRef.current.play();
            hasLoadedUrlRef.current = true;

            setState(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Audio load error:', error);
            setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
        }
    }, []);

    const playRef = useRef<PlayerContextType['play']>(async () => {});

    const handleAutoAdvance = useCallback(async () => {
        const surahNumber = currentSurahRef.current;
        if (!surahNumber) return;

        if (isLoopingRef.current) {
            playerRef.current.seekTo(0);
            playerRef.current.play();
        } else {
            setState(prev => ({
                ...prev,
                isPlaying: false,
                currentAyahIndex: 0,
            }));
        }
    }, []);

    useEffect(() => {
        onDidJustFinishRef.current = handleAutoAdvance;
    }, [handleAutoAdvance]);

    const play = useCallback(
        async (surahNumber: number, ayahIndex: number, newAyahs?: Ayah[]) => {
            if (newAyahs) {
                ayahsRef.current = newAyahs;
            }

            if (ayahsRef.current.length === 0) {
                console.warn("No ayahs available to play");
                return;
            }
            
            const isFullyCached = await isSurahFullyCached(surahNumber, ayahsRef.current.length, state.reciterBaseUrl);

            if (!isFullyCached) {
                setState(prev => ({ ...prev, isLoading: true, downloadProgress: 0.01 }));
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
            } else {
                setState(prev => ({ ...prev, isLoading: true }));
            }

            loadAndPlayInner(surahNumber, ayahIndex);
        },
        [loadAndPlayInner, state.reciterBaseUrl]
    );

    useEffect(() => {
        playRef.current = play;
    }, [play]);

    const pause = useCallback(async () => {
        playerRef.current.pause();
    }, []);

    const resume = useCallback(async () => {
        if (!hasLoadedUrlRef.current && state.currentSurahNumber !== null) {
            play(state.currentSurahNumber, state.currentAyahIndex, ayahsRef.current);
        } else {
            playerRef.current.play();
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, play]);

    const next = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const nextIdx = state.currentAyahIndex + 1;
        const offsets = ayahOffsetsRef.current;
        if (nextIdx < offsets.length) {
            currentRepeatRef.current = 1;
            playerRef.current.seekTo(offsets[nextIdx].startMs / 1000);
            playerRef.current.play();
        }
    }, [state.currentSurahNumber, state.currentAyahIndex]);

    const previous = useCallback(() => {
        if (!state.currentSurahNumber) return;
        const prevIdx = state.currentAyahIndex - 1;
        const offsets = ayahOffsetsRef.current;
        if (prevIdx >= 0) {
            currentRepeatRef.current = 1;
            playerRef.current.seekTo(offsets[prevIdx].startMs / 1000);
            playerRef.current.play();
        } else if (prevIdx === -1) {
            currentRepeatRef.current = 1;
            playerRef.current.seekTo(0);
            playerRef.current.play();
        }
    }, [state.currentSurahNumber, state.currentAyahIndex]);

    const toggleLoop = useCallback(() => {
        isLoopingRef.current = !isLoopingRef.current;
        if (isLoopingRef.current) {
            repeatCountRef.current = 1;
            currentRepeatRef.current = 1;
        }
        setState(prev => ({ ...prev, isLooping: isLoopingRef.current, repeatCount: 1 }));
    }, []);

    const REPEAT_CYCLE = [1, 2, 3, 5];
    const cycleRepeat = useCallback(() => {
        if (isLoopingRef.current) {
            isLoopingRef.current = false;
        }
        const currentIdx = REPEAT_CYCLE.indexOf(repeatCountRef.current);
        const nextRepeat = REPEAT_CYCLE[(currentIdx + 1) % REPEAT_CYCLE.length];
        repeatCountRef.current = nextRepeat;
        currentRepeatRef.current = 1;
        setState(prev => ({ ...prev, repeatCount: nextRepeat, isLooping: false }));
    }, []);

    const stop = useCallback(async () => {
        playerRef.current.pause();
        hasLoadedUrlRef.current = false;
        currentRepeatRef.current = 1;
        if (sleepTimerRef.current) {
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
        }
        setState(prev => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            currentSurahNumber: null,
            currentAyahIndex: 0,
            downloadProgress: 0,
            sleepTimerEndsAt: null,
            sleepTimerDuration: null,
        }));
    }, []);

    const setReciter = useCallback((baseUrl: string) => {
        stop();
        setState(prev => ({ ...prev, reciterBaseUrl: baseUrl }));
    }, [stop]);

    const initializeSurah = useCallback((surahNumber: number, ayahs: Ayah[], initialAyahIndex: number = 0) => {
        ayahsRef.current = ayahs;
        hasLoadedUrlRef.current = false;
        setState(prev => ({
            ...prev,
            currentSurahNumber: surahNumber,
            currentAyahIndex: initialAyahIndex,
            isPlaying: false
        }));
    }, []);

    const setSleepTimer = useCallback((minutes: number | null) => {
        if (sleepTimerRef.current) {
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
        }

        if (minutes === null) {
            setState(prev => ({ ...prev, sleepTimerEndsAt: null, sleepTimerDuration: null }));
            return;
        }

        const endsAt = Date.now() + minutes * 60 * 1000;
        setState(prev => ({ ...prev, sleepTimerEndsAt: endsAt, sleepTimerDuration: minutes }));

        sleepTimerRef.current = setInterval(() => {
            if (Date.now() >= endsAt) {
                if (sleepTimerRef.current) {
                    clearInterval(sleepTimerRef.current);
                    sleepTimerRef.current = null;
                }
                playerRef.current.pause();
                setState(prev => ({
                    ...prev,
                    isPlaying: false,
                    sleepTimerEndsAt: null,
                    sleepTimerDuration: null,
                }));
            }
        }, 1000);
    }, []);

    const value = {
        state,
        play,
        pause,
        resume,
        next,
        previous,
        toggleLoop,
        cycleRepeat,
        stop,
        setReciter,
        initializeSurah,
        setSleepTimer,
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
