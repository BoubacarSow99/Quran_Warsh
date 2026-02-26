import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Share,
} from 'react-native';

import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { getSurah, SurahDetail, Ayah } from '../../services/quranApi';
import { saveLastRead } from '../../services/storageService';
import { usePlayer } from '../../hooks/usePlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { RECITERS, PRIMARY_AUDIO_BASE } from '../../constants/reciters';


export default function SurahScreen() {
    const { id } = useLocalSearchParams();
    const { colors, settings } = useTheme();
    const navigation = useNavigation();

    const { isAyahFav, toggleAyah } = useFavorites();
    const [surah, setSurah] = useState<SurahDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const player = usePlayer();
    const listRef = useRef<ScrollView>(null);
    const [ayahLayouts, setAyahLayouts] = useState<{ [key: number]: number }>({});
    const bismillahLayout = useRef<number>(0);

    // Sync audio player reciter URL with selected settings
    useEffect(() => {
        if (!settings.defaultReciterId) return;
        const selectedReciter = RECITERS.find(r => r.id === settings.defaultReciterId);
        if (selectedReciter && player.state.reciterBaseUrl !== selectedReciter.baseUrl) {
            player.setReciter(selectedReciter.baseUrl);
        }
    }, [settings.defaultReciterId, player.state.reciterBaseUrl]);

    useEffect(() => {
        if (!id) return;
        const surahId = parseInt(id as string);

        // Show the bar IMMEDIATELY on entry
        player.initializeSurah(surahId, []);

        getSurah(surahId)
            .then(data => {
                setSurah(data);
                player.initializeSurah(data.number, data.ayahs);
                navigation.setOptions({
                    headerTitle: `${data.englishName} - ${data.name}`,
                    headerStyle: { backgroundColor: colors.mushafHeader || '#7D1C1C' },
                    headerTintColor: '#FFFFFF',
                });

                setLoading(false);


                // Save last read
                saveLastRead({
                    surahNumber: data.number,
                    surahName: data.name,
                    ayahNumber: 1,
                    timestamp: Date.now(),
                });
            })
            .catch(err => {
                console.error(err);
                setError('Impossible de charger la sourate.');
                setLoading(false);
            });

        return () => {
            // Stop the player when leaving the surah screen to ensure the audio bar disappears.
            player.stop();
        };
    }, [id, colors.mushafHeader, navigation]);

    // Sync scroll with audio player
    // Sync scroll with audio player
    useEffect(() => {
        if (player.state.currentAyahIndex !== undefined && listRef.current) {
            if (player.state.isBismillahPlaying) {
                listRef.current.scrollTo({ y: bismillahLayout.current, animated: true });
            } else {
                const yPos = ayahLayouts[player.state.currentAyahIndex];
                if (yPos !== undefined) {
                    listRef.current.scrollTo({ y: yPos - 100, animated: true });
                }
            }
        }
    }, [player.state.currentAyahIndex, player.state.isBismillahPlaying, ayahLayouts]);

    const onShare = async (ayah: Ayah) => {
        try {
            await Share.share({
                message: `${ayah.text} [${surah?.name} - ${ayah.numberInSurah}]`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAyahPress = (index: number) => {
        if (player.state.isPlaying && player.state.currentSurahNumber === surah!.number && player.state.currentAyahIndex === index) {
            player.pause();
        } else {
            player.play(surah!.number, index, surah!.ayahs);
        }
    };

    const s = styles(colors);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !surah) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>{error || 'Une erreur est survenue'}</Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <ScrollView
                ref={listRef as any}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.mushafFrame}>
                    <View style={s.mushafInnerFrame}>
                        <View style={s.header}>
                            <View style={s.headerRow}>
                                <Text style={s.headerName}>{surah.englishName}</Text>
                                <Text style={s.headerNameDivider}> - </Text>
                                <Text style={s.headerNameAr}>{surah.name}</Text>
                            </View>
                            <Text style={s.headerInfo}>
                                {surah.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'} · {surah.ayahs.length} versets
                            </Text>
                        </View>

                        {surah.number !== 1 && surah.number !== 9 && (
                            <View
                                onLayout={(e) => { bismillahLayout.current = e.nativeEvent.layout.y }}
                                style={[
                                    s.bismillahContainer,
                                    player.state.isBismillahPlaying && s.highlightedBismillah
                                ]}
                            >
                                <Text style={[
                                    s.bismillah,
                                    player.state.isBismillahPlaying && { color: colors.primary }
                                ]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                            </View>
                        )}

                        <View style={s.ayahsContainer}>
                            {surah.ayahs.map((item, index) => {
                                let displayedText = item.text;
                                if (surah.number !== 1 && surah.number !== 9 && index === 0) {
                                    displayedText = displayedText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '');
                                }
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onLayout={(e) => {
                                            const y = e.nativeEvent.layout.y;
                                            setAyahLayouts(prev => ({ ...prev, [index]: y }));
                                        }}
                                        onPress={() => handleAyahPress(index)}
                                        onLongPress={() => {
                                            toggleAyah({
                                                surahNumber: surah.number,
                                                surahName: surah.name,
                                                ayahNumber: item.numberInSurah,
                                                ayahText: item.text
                                            });
                                        }}
                                        activeOpacity={0.7}
                                        style={[
                                            s.ayahCtn,
                                            player.state.currentAyahIndex === index &&
                                            player.state.isPlaying &&
                                            !player.state.isBismillahPlaying &&
                                            s.highlightedAyah
                                        ]}
                                    >
                                        <Text style={[s.mushafText, { fontSize: settings.fontSize, lineHeight: settings.fontSize * 1.8 }]}>
                                            {displayedText}{' '}
                                            <Text style={s.ayahMarker}>﴿{item.numberInSurah}﴾ </Text>
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            padding: 12,
            paddingBottom: 160,
        },
        ayahsContainer: {
            // Container for all ayahs to manage layout correctly
        },
        ayahCtn: {
            marginBottom: 8,
            padding: 4,
            borderRadius: 6,
        },
        mushafFrame: {
            backgroundColor: colors.mushafPaper || '#FBF9F1',
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#E0D6BA',
            margin: 4,
            padding: 2,
        },
        mushafInnerFrame: {
            borderWidth: 1,
            borderColor: '#E0D6BA',
            borderStyle: 'dashed',
            padding: 15,
            minHeight: '100%',
        },
        header: {
            alignItems: 'center',
            paddingBottom: 20,
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerName: {
            fontSize: 24,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            color: colors.primary,
        },
        headerNameDivider: {
            fontSize: 20,
            color: colors.textMuted,
        },
        headerNameAr: {
            fontSize: 28,
            fontFamily: 'Amiri',
            color: colors.primary,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        headerInfo: {
            fontSize: 14,
            color: colors.textMuted,
            fontFamily: 'Inter',
            marginTop: 4,
        },
        bismillahContainer: {
            backgroundColor: colors.mushafHighlight || '#FDECEC',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 4,
            alignSelf: 'center',
            marginBottom: 30,
        },
        bismillah: {
            fontSize: 26,
            fontFamily: 'Amiri',
            color: colors.text,
            textAlign: 'center',
        },
        mushafText: {
            fontFamily: 'Amiri',
            color: colors.arabicText,
            textAlign: 'center',
            writingDirection: 'rtl',
        },
        ayahMarker: {
            fontFamily: 'Amiri',
            color: colors.primary,
            fontWeight: 'normal',
        },
        highlightedAyah: {
            backgroundColor: colors.primary + '22',
            color: colors.primary,
        },
        highlightedBismillah: {
            backgroundColor: colors.primary + '22',
            borderColor: colors.primary,
            borderWidth: 1,
        },
    });
