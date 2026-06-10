import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    Platform,
} from 'react-native';
import { useBatchDownload } from '../hooks/useBatchDownload';

interface Props {
    visible: boolean;
    onDone: () => void;
}

export function OnboardingModal({ visible, onDone }: Props) {
    const { stats, startDownload, stopDownload } = useBatchDownload();

    // Progress animation
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (stats.isDownloading) {
            const ratio = stats.total > 0 ? stats.completed / stats.total : 0;
            Animated.timing(progressAnim, {
                toValue: ratio,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        }
    }, [stats.completed, stats.total, stats.isDownloading]);

    const handleDownload = () => {
        startDownload();
    };

    // Auto-close when completed
    useEffect(() => {
        if (stats.total > 0 && stats.completed === stats.total) {
            const timer = setTimeout(() => {
                onDone();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [stats.completed, stats.total, onDone]);

    const handleSkip = () => {
        if (stats.isDownloading) stopDownload();
        onDone();
    };

    const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    const barWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <View style={s.backdrop}>
                <View style={s.card}>
                    {/* Header ornament */}
                    <Text style={s.ornament}>۞</Text>
                    <Text style={s.title}>بِسْمِ اللَّهِ</Text>
                    <Text style={s.subtitle}>Al-Qur'an Hafs</Text>

                    <View style={s.divider} />

                    {!stats.isDownloading ? (
                        <>
                            <Text style={s.body}>
                                Téléchargez la récitation complète du Coran pour une écoute{' '}
                                <Text style={s.bold}>entièrement hors-ligne</Text>.
                            </Text>
                            <Text style={s.size}>~600 Mo · Wi-Fi recommandé</Text>

                            <TouchableOpacity
                                style={s.btnPrimary}
                                onPress={handleDownload}
                                activeOpacity={0.8}
                            >
                                <Text style={s.btnPrimaryText}>⬇  Télécharger maintenant</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={s.btnSecondary}
                                onPress={handleSkip}
                                activeOpacity={0.7}
                            >
                                <Text style={s.btnSecondaryText}>Plus tard</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={s.downloadingLabel}>Téléchargement en cours…</Text>
                            <Text style={s.surahLabel} numberOfLines={1}>
                                {stats.currentSurah}
                            </Text>

                            {/* Progress bar */}
                            <View style={s.barTrack}>
                                <Animated.View style={[s.barFill, { width: barWidth }]} />
                            </View>

                            <Text style={s.pctLabel}>
                                {stats.completed} / {stats.total} sourates · {pct}%
                            </Text>

                            <TouchableOpacity
                                style={s.btnCancel}
                                onPress={handleSkip}
                                activeOpacity={0.7}
                            >
                                <Text style={s.btnCancelText}>Annuler et continuer</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const GOLD = '#C9A84C';
const GREEN = '#2D6A4F';
const BG = '#0F1C14';
const CARD = '#1A2E22';
const BORDER = '#2A3F2F';

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 28,
        alignItems: 'center',
        // Gold top accent
        borderTopWidth: 3,
        borderTopColor: GOLD,
        ...Platform.select({
            ios: {
                shadowColor: GOLD,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 16,
            },
            android: { elevation: 12 },
        }),
    },
    ornament: {
        fontSize: 32,
        color: GOLD,
        marginBottom: 4,
    },
    title: {
        fontSize: 26,
        fontFamily: 'AmiriBold',
        color: GOLD,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'InterBold',
        color: '#8BA893',
        marginTop: 2,
        letterSpacing: 1.5,
    },
    divider: {
        width: '60%',
        height: 1,
        backgroundColor: BORDER,
        marginVertical: 20,
    },
    body: {
        fontSize: 15,
        fontFamily: 'Inter',
        color: '#D4E8DA',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 6,
    },
    bold: {
        fontFamily: 'InterBold',
        color: '#fff',
    },
    size: {
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#7A9985',
        marginBottom: 24,
    },
    btnPrimary: {
        width: '100%',
        backgroundColor: GREEN,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3A8A60',
    },
    btnPrimaryText: {
        fontFamily: 'InterBold',
        fontSize: 15,
        color: '#fff',
        letterSpacing: 0.3,
    },
    btnSecondary: {
        paddingVertical: 10,
    },
    btnSecondaryText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6A9075',
    },
    // Downloading state
    downloadingLabel: {
        fontFamily: 'InterBold',
        fontSize: 15,
        color: '#D4E8DA',
        marginBottom: 6,
    },
    surahLabel: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: GOLD,
        marginBottom: 14,
    },
    barTrack: {
        width: '100%',
        height: 8,
        backgroundColor: '#0F1C14',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    barFill: {
        height: '100%',
        backgroundColor: GREEN,
        borderRadius: 4,
    },
    pctLabel: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#7A9985',
        marginBottom: 20,
    },
    btnCancel: {
        paddingVertical: 10,
    },
    btnCancelText: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#6A9075',
    },
});
