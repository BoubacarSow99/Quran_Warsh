import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { PlayerState } from '../hooks/usePlayer';

interface AudioPlayerProps {
    state: PlayerState;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onToggleLoop: () => void;
    currentSurahName?: string;
    currentAyahNumber?: number;
}

export default function AudioPlayer({
    state,
    onPlay,
    onPause,
    onNext,
    onPrevious,
    onToggleLoop,
    currentSurahName,
    currentAyahNumber,
}: AudioPlayerProps) {
    const { colors } = useTheme();
    const s = styles(colors);

    if (!state.currentSurahNumber) return null;

    const progress = state.duration > 0 ? (state.position / state.duration) * 100 : 0;

    return (
        <View style={s.container}>
            {/* Progress Bar */}
            <View style={s.progressContainer}>
                <View style={[s.progressBar, { width: `${progress}%` }]} />
            </View>

            <View style={s.content}>
                {/* Info */}
                <View style={s.info}>
                    <Text style={s.surahName} numberOfLines={1}>{currentSurahName}</Text>
                    <Text style={s.ayahInfo}>Verset {currentAyahNumber}</Text>
                </View>


                {/* Controls */}
                <View style={s.controls}>
                    <TouchableOpacity onPress={onPrevious} style={s.controlBtn}>
                        <Text style={s.controlIcon}>⏮</Text>
                    </TouchableOpacity>

                    {state.isLoading ? (
                        <ActivityIndicator color={colors.primary} style={s.playBtn} />
                    ) : state.isPlaying ? (
                        <TouchableOpacity onPress={onPause} style={s.playBtn}>
                            <Text style={s.playIcon}>⏸</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onPlay} style={s.playBtn}>
                            <Text style={s.playIcon}>▶️</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={onNext} style={s.controlBtn}>
                        <Text style={s.controlIcon}>⏭</Text>
                    </TouchableOpacity>
                </View>

                {/* Extra */}
                <TouchableOpacity onPress={onToggleLoop} style={[s.loopBtn, state.isLooping && s.loopActive]}>
                    <Text style={[s.loopIcon, state.isLooping && { color: colors.primary }]}>🔁</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1A1A1A', // Dark player as per screenshot
            paddingBottom: 20,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
        },

        progressContainer: {
            height: 3,
            backgroundColor: colors.border,
            width: '100%',
        },
        progressBar: {
            height: '100%',
            backgroundColor: colors.primary,
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            justifyContent: 'space-between',
        },
        info: {
            flex: 1,
        },
        surahName: {
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: 'Inter',
            fontWeight: '600',
        },


        ayahInfo: {
            color: colors.textMuted,
            fontSize: 11,
            fontFamily: 'Inter',
        },
        controls: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        controlBtn: {
            padding: 8,
        },
        controlIcon: {
            fontSize: 24,
            color: '#FFFFFF',
        },

        playBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary + '11',
            alignItems: 'center',
            justifyContent: 'center',
        },
        playIcon: {
            fontSize: 28,
            color: '#FFFFFF',
        },

        loopBtn: {
            padding: 8,
            borderRadius: 8,
        },
        loopActive: {
            backgroundColor: colors.primary + '11',
        },
        loopIcon: {
            fontSize: 18,
            color: colors.textMuted,
        },
    });
