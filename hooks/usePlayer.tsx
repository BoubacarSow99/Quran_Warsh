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

    // To prevent stale closures in the audio listener, we keep a fresh reference to handleAutoAdvance
    const onDidJustFinishRef = useRef<() => void>(() => {});
    
    // Tracks if a URL was actually loaded into native Expo Audio
    const hasLoadedUrlRef = useRef(false);

    // ── Audio session setup + background keepalive ──────────────────────
    useEffect(() => {
        // Configure audio session for background playback
        const configureAudio = () =>
            setAudioModeAsync({
                playsInSilentMode: true,       // play even when silent/ringer off (iOS)
                shouldPlayInBackground: true,  // keep playing when app is minimised
                interruptionMode: 'doNotMix',  // pause other apps' audio
            });

        configureAudio();

        // Re-apply audio session when app comes back to foreground
        // (iOS may reset the session after a phone call, etc.)
        const appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (next === 'active') {
                configureAudio();
            }
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
                onDidJustFinishRef.current();
            }
        });

        return () => {
            appStateSub.remove();
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

            // Save position for the "Resume" feature
            saveLastPosition({
                surahNumber: surahNumber,
                surahName: ayah.surah?.name || `Sourate ${surahNumber}`,
                ayahNumber: ayah.numberInSurah,
                type: 'listening',
            });

            // Fetch the right URL to play
            const url = playBismillah
                ? await getCachedUri(1, 1, state.reciterBaseUrl)
                : await getCachedUri(surahNumber, ayah.numberInSurah, state.reciterBaseUrl);

            hasLoadedUrlRef.current = true;
            player.replace(url);
            player.play();

            setState(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Audio load error:', error);
            setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
        }
    }, [state.reciterBaseUrl]);

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

        // Gapless: No more setTimeouts. We swap as fast as possible.
        if (playBismillah) {
            // Just finished Bismillah, now play the actual first verse
            loadAndPlayInner(surahNumber, ayahIndex, true);
        } else if (isLoopingRef.current) {
            player.seekTo(0);
            player.play();
        } else if (ayahIndex < ayahsRef.current.length - 1) {
            loadAndPlayInner(surahNumber, ayahIndex + 1, false);
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
        player.pause();
    }, []);

    const resume = useCallback(async () => {
        if (!hasLoadedUrlRef.current && state.currentSurahNumber !== null) {
            play(state.currentSurahNumber, state.currentAyahIndex, ayahsRef.current);
        } else {
            player.play();
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
        player.pause();
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
