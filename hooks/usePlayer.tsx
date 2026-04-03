import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { getAyahAudioUrl } from '../services/audioService';
import { downloadSurahAudio, getCachedUri, isSurahFullyCached } from '../services/audioCacheService';
import { saveLastPosition } from '../services/storageService';
import { PRIMARY_AUDIO_BASE } from '../constants/reciters';
import type { Ayah } from '../services/quranApi';
import { getSurah } from '../services/quranApi';

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
    initializeSurah: (surahNumber: number, ayahs: Ayah[], initialAyahIndex?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const player1Ref = useRef<AudioPlayer>(createAudioPlayer(null));
    const player2Ref = useRef<AudioPlayer>(createAudioPlayer(null));
    const activePlayerIdx = useRef<1 | 2>(1);
    
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

    const getActivePlayer = () => activePlayerIdx.current === 1 ? player1Ref.current : player2Ref.current;
    const getInactivePlayer = () => activePlayerIdx.current === 1 ? player2Ref.current : player1Ref.current;

    const onDidJustFinishRef = useRef<() => void>(() => {});
    const hasLoadedUrlRef = useRef(false);

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

        // Combined listener for both players
        const setupListener = (p: AudioPlayer, id: number) => {
            return p.addListener('playbackStatusUpdate', (status) => {
                // SAFETY: If an INACTIVE player is playing, stop it.
                if (activePlayerIdx.current !== id && status.playing) {
                    p.pause();
                    return;
                }

                // Only update global state if this is the ACTIVE player
                if (activePlayerIdx.current === id) {
                    setState(prev => ({
                        ...prev,
                        isPlaying: status.playing,
                        duration: status.duration * 1000,
                        position: status.currentTime * 1000,
                        isLoading: status.isBuffering && !status.playing,
                    }));

                    if (status.didJustFinish) {
                        onDidJustFinishRef.current();
                    }
                }
            });
        };

        const sub1 = setupListener(player1Ref.current, 1);
        const sub2 = setupListener(player2Ref.current, 2);

        return () => {
            appStateSub.remove();
            sub1.remove();
            sub2.remove();
            player1Ref.current.remove();
            player2Ref.current.remove();
        };
    }, []);

    // Auto-advance logic (moved to a function to be called from the listener)
    // We use refs for surah/index to avoid stale closures in the listener
    const currentSurahRef = useRef<number | null>(null);
    const currentIndexRef = useRef(0);
    const isBismillahPlayingRef = useRef(false);

    const preloadNext = useCallback(async (surahNumber: number, ayahIndex: number) => {
        try {
            const nextIdx = ayahIndex + 1;
            if (nextIdx < ayahsRef.current.length) {
                const url = await getCachedUri(surahNumber, ayahsRef.current[nextIdx].numberInSurah, state.reciterBaseUrl);
                const p = getInactivePlayer();
                p.pause(); // Safety: make sure it's not playing
                p.replace(url);
            }
        } catch (e) {
            console.error('Preload error:', e);
        }
    }, [state.reciterBaseUrl]);

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

            saveLastPosition({
                surahNumber: surahNumber,
                surahName: ayah.surah?.name || `Sourate ${surahNumber}`,
                ayahNumber: ayah.numberInSurah,
                type: 'listening',
            });

            const url = playBismillah
                ? await getCachedUri(1, 1, state.reciterBaseUrl)
                : await getCachedUri(surahNumber, ayah.numberInSurah, state.reciterBaseUrl);

            hasLoadedUrlRef.current = true;
            const p = getActivePlayer();
            p.replace(url);
            p.play();

            setState(prev => ({ ...prev, isLoading: false }));

            // PRELOAD the next one in the other player
            if (!playBismillah) {
                preloadNext(surahNumber, ayahIndex);
            }
        } catch (error) {
            console.error('Audio load error:', error);
            setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
        }
    }, [state.reciterBaseUrl, preloadNext]);

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
                setState(prev => ({ ...prev, isLoading: true, downloadProgress: 0.01 })); // 0.01 to show initial UI
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

    const lastAdvanceTimeRef = useRef(0);

    const handleAutoAdvance = useCallback(() => {
        const now = Date.now();
        if (now - lastAdvanceTimeRef.current < 500) return; // Debounce duplicate events
        lastAdvanceTimeRef.current = now;

        const surahNumber = currentSurahRef.current;
        const ayahIndex = currentIndexRef.current;
        const playBismillah = isBismillahPlayingRef.current;

        if (!surahNumber) return;

        if (playBismillah) {
            loadAndPlayInner(surahNumber, ayahIndex, true);
        } else if (isLoopingRef.current) {
            const p = getActivePlayer();
            p.seekTo(0);
            p.play();
        } else if (ayahIndex < ayahsRef.current.length - 1) {
            // GAPLESS SWITCH
            const oldPlayer = getActivePlayer();
            oldPlayer.pause(); // Ensure old is silent
            
            activePlayerIdx.current = activePlayerIdx.current === 1 ? 2 : 1;
            const p = getActivePlayer();
            
            p.play(); 
            
            currentIndexRef.current = ayahIndex + 1;
            setState(prev => ({ ...prev, currentAyahIndex: ayahIndex + 1 }));

            preloadNext(surahNumber, ayahIndex + 1);
        } else if (surahNumber < 114) {
             // Surah finished, auto continue to the next surah
             const nextSurahNum = surahNumber + 1;
             
             setState(prev => ({
                 ...prev,
                 isLoading: true,
                 currentSurahNumber: nextSurahNum,
                 currentAyahIndex: 0,
             }));

             getSurah(nextSurahNum).then(nextSurah => {
                 play(nextSurahNum, 0, nextSurah.ayahs);
             }).catch(e => {
                 console.error("Failed to continue to next surah automatically", e);
                 setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
             });
        } else {
            setState(prev => ({
                ...prev,
                isPlaying: false,
                currentAyahIndex: 0,
            }));
        }
    }, [loadAndPlayInner, play]);

    useEffect(() => {
        onDidJustFinishRef.current = handleAutoAdvance;
    }, [handleAutoAdvance]);

    const pause = useCallback(async () => {
        getActivePlayer().pause();
    }, []);

    const resume = useCallback(async () => {
        if (!hasLoadedUrlRef.current && state.currentSurahNumber !== null) {
            play(state.currentSurahNumber, state.currentAyahIndex, ayahsRef.current);
        } else {
            getActivePlayer().play();
        }
    }, [state.currentSurahNumber, state.currentAyahIndex, play]);

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
        player1Ref.current.pause();
        player2Ref.current.pause();
        hasLoadedUrlRef.current = false;
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
