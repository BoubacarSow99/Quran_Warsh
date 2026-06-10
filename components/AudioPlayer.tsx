import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { usePlayer } from '../hooks/usePlayer';

export function AudioPlayer() {
    const { colors, isDark } = useTheme();
    const { state, play, pause, resume, next, previous, toggleLoop, cycleRepeat, stop, setSleepTimer } = usePlayer();
    const pathname = usePathname();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [timerLabel, setTimerLabel] = useState<string | null>(null);
    useEffect(() => {
        if (!state.sleepTimerEndsAt) {
            setTimerLabel(null);
            return;
        }
        const update = () => {
            const remaining = Math.max(0, state.sleepTimerEndsAt! - Date.now());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setTimerLabel(`${mins}:${secs.toString().padStart(2, '0')}`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [state.sleepTimerEndsAt]);

    // The currentSurahNumber is set by initializeSurah in SurahScreen
    // and cleared by stop() when leaving. This is our source of truth for visibility.
    // However, to be extra safe as requested by the user, we also check the pathname.
    // Must be placed after all hook calls to satisfy the Rules of Hooks.
    if (!pathname.includes('/surah/') || !state.currentSurahNumber) {
        return null;
    }

    const handlePlayPause = () => {
        if (state.isPlaying) {
            pause();
        } else {
            // If we have a sound object (it was already playing but paused), resume
            // If no sound object yet, start from currentAyahIndex
            if (state.position > 0 || state.duration > 0) {
                resume();
            } else {
                play(state.currentSurahNumber!, state.currentAyahIndex);
            }
        }
    };

    const navigateToSettings = () => {
        router.push('/(tabs)/settings');
    };

    const repeatLabel = state.repeatCount > 1 ? `×${state.repeatCount}` : null;
    const isRepeatActive = state.repeatCount > 1;

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 8, height: (timerLabel ? 88 : 64) + insets.bottom }]}>
            {timerLabel && (
                <TouchableOpacity onPress={() => setSleepTimer(null)} style={styles.timerBar} activeOpacity={0.7}>
                    <Ionicons name="time" size={13} color="#C9A84C" />
                    <Text style={styles.timerBarText}>Arrêt dans {timerLabel} · Annuler</Text>
                </TouchableOpacity>
            )}

            {/* Loading / Download Progress */}
            {state.isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    {state.downloadProgress > 0 && state.downloadProgress < 1 && (
                        <Text style={styles.downloadText}>
                            Téléchargement... {Math.round(state.downloadProgress * 100)}%
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.controlsRow}>
                {/* User / Reciter Icon */}
                <TouchableOpacity onPress={navigateToSettings} style={styles.iconButton}>
                    <Ionicons name="person" size={24} color="#aaa" />
                </TouchableOpacity>

                {/* Previous */}
                <TouchableOpacity onPress={previous} style={styles.iconButton}>
                    <Ionicons name="play-skip-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Play / Pause */}
                <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                    <Ionicons
                        name={state.isPlaying ? "pause" : "play"}
                        size={32}
                        color="#fff"
                        style={{ marginLeft: state.isPlaying ? 0 : 4 }}
                    />
                </TouchableOpacity>

                {/* Next */}
                <TouchableOpacity onPress={next} style={styles.iconButton}>
                    <Ionicons name="play-skip-forward" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Repeat N times (cycle: 1 → 2 → 3 → 5 → 1) */}
                <TouchableOpacity onPress={cycleRepeat} style={styles.repeatBtn}>
                    <Ionicons
                        name="repeat"
                        size={22}
                        color={isRepeatActive ? '#C9A84C' : '#aaa'}
                    />
                    {repeatLabel && (
                        <Text style={styles.repeatLabel}>{repeatLabel}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212', // Force true dark for premium look
        height: 64,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingHorizontal: 20,
        // paddingBottom is applied dynamically via insets
        zIndex: 1000,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    iconButton: {
        padding: 10,
    },
    repeatBtn: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
    },
    repeatLabel: {
        color: '#C9A84C',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: 'Inter',
        marginTop: 2,
    },
    playPauseBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2D6A4F', // Primary green as accent
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2D6A4F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: 12,
    },
    downloadText: {
        color: '#FFF',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'InterBold',
    },
    timerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 6,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
        marginBottom: 4,
        gap: 6,
    },
    timerBarText: {
        color: '#C9A84C',
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: '600',
    },
});

