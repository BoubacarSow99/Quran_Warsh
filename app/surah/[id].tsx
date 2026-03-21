import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';

import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { getSurah, SurahDetail, Ayah } from '../../services/quranApi';
import { saveLastRead } from '../../services/storageService';
import { usePlayer } from '../../hooks/usePlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { RECITERS } from '../../constants/reciters';

// ─── Ornament helpers ──────────────────────────────────────────────────
const ORNAMENT = '❧';
const ORNAMENT_LINE = `${ORNAMENT}  ───────  ${ORNAMENT}`;

// ─── SurahBlock component ──────────────────────────────────────────────
interface SurahBlockProps {
    surah: SurahDetail;
    settings: any;
    colors: any;
    player: any;
    isAyahFav: (s: number, a: number) => boolean;
    toggleAyah: (info: any) => void;
    onBismillahLayout: (surahNum: number, y: number) => void;
    onAyahLayout: (surahNum: number, index: number, y: number) => void;
    onBlockLayout: (surah: SurahDetail, y: number) => void;
    resumedAyahIndex?: number | null;
}



function SurahBlock({
    surah,
    settings,
    colors,
    player,
    isAyahFav,
    toggleAyah,
    onBismillahLayout,
    onAyahLayout,
    onBlockLayout,
    resumedAyahIndex,
}: SurahBlockProps) {
    const s = blockStyles(colors);
    const isCurrentSurah = player.state.currentSurahNumber === surah.number;

    // Deferred rendering to prevent UI thread locks on large surahs like Surah 2
    const initialLimit = resumedAyahIndex ? Math.max(50, resumedAyahIndex + 10) : 50;
    const [renderLimit, setRenderLimit] = useState(() => 
        surah.ayahs.length > initialLimit ? initialLimit : surah.ayahs.length
    );

    useEffect(() => {
        if (renderLimit < surah.ayahs.length) {
            // Delay rendering the rest of the surah until after screen transition ~350ms
            const timer = setTimeout(() => {
                setRenderLimit(surah.ayahs.length);
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [renderLimit, surah.ayahs.length]);

    const visibleAyahs = surah.ayahs.slice(0, renderLimit);

    const handleAyahPress = (index: number) => {
        const ayah = surah.ayahs[index];
        if (ayah) {
            saveLastRead({
                surahNumber: surah.number,
                surahName: surah.name,
                ayahNumber: ayah.numberInSurah,
                type: 'reading',
            });
        }

        if (isCurrentSurah && player.state.currentAyahIndex === index) {
            if (player.state.isPlaying) {
                player.pause();
            } else {
                player.resume();
            }
        } else {
            player.play(surah.number, index, surah.ayahs);
        }
    };

    return (
        <View style={s.surahBlock} onLayout={(e) => onBlockLayout(surah, e.nativeEvent.layout.y)}>
            {/* ── Surah Name Banner ── */}

            <View style={s.banner}>
                <View style={s.bannerInner}>
                    <Text style={s.ornamentLeft}>{ORNAMENT}</Text>
                    <Text style={s.bannerName}>{surah.name}</Text>
                    <Text style={s.ornamentRight}>{ORNAMENT}</Text>
                </View>
                <Text style={s.bannerSub}>
                    {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} ·{' '}
                    {surah.ayahs.length} آية
                </Text>
            </View>

            {/* ── Bismillah ── */}
            {surah.number !== 1 && surah.number !== 9 && (
                <View
                    onLayout={(e) => onBismillahLayout(surah.number, e.nativeEvent.layout.y)}
                    style={[
                        s.bismillahContainer,
                        isCurrentSurah &&
                            player.state.isBismillahPlaying &&
                            { backgroundColor: colors.primary + '22' },
                    ]}
                >
                    <Text style={s.bismillah}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </Text>
                </View>
            )}

            {/* ── Ayahs ── */}
            <Text
                style={[
                    s.ayahsText,
                    { fontSize: settings.fontSize, lineHeight: settings.fontSize * 2.0 },
                ]}
            >
                {visibleAyahs.map((item, index) => {
                    let displayedText = item.text;
                    if (surah.number !== 1 && surah.number !== 9 && index === 0) {
                        // Find the end of the Bismillah by locating the root رحيم
                        // (last word of Bismillah). This works regardless of diacritics/Unicode variant.
                        const rahimIdx = displayedText.search(/ر[\u064E\u064F\u0650\u0651\u0652]*ح[\u064E\u064F\u0650\u0651\u0652]*ي[\u064E\u064F\u0650\u0651\u0652]*م[\u064E\u064F\u0650\u0651\u0652\u0640]*/u);
                        if (rahimIdx !== -1) {
                            // advance past "رحيم" (≈4–8 chars with diacritics) and any trailing space
                            const afterRahim = displayedText.indexOf(' ', rahimIdx + 4);
                            if (afterRahim !== -1) {
                                displayedText = displayedText.slice(afterRahim).trimStart();
                            }
                        }
                    }
                    const isPlayingHighlight =
                        isCurrentSurah &&
                        player.state.currentAyahIndex === index &&
                        player.state.isPlaying &&
                        !player.state.isBismillahPlaying;

                    const isResumeHighlight = isCurrentSurah && resumedAyahIndex === index;
                    const isHighlighted = isPlayingHighlight || isResumeHighlight;

                    return (
                        <Text
                            key={`${surah.number}-${index}`}
                            onPress={() => handleAyahPress(index)}
                            onLongPress={() =>
                                toggleAyah({
                                    surahNumber: surah.number,
                                    surahName: surah.name,
                                    ayahNumber: item.numberInSurah,
                                    ayahText: item.text,
                                })
                            }
                            style={[
                                isHighlighted && {
                                    color: colors.primary,
                                    backgroundColor: colors.primary + '22',
                                },
                            ]}
                        >
                            {displayedText}
                            {' '}
                            <Text style={s.ayahMarker}>
                                {isAyahFav(surah.number, item.numberInSurah) ? '⭐' : ''}
                                {'﴿'}
                                {item.numberInSurah}
                                {'﴾'}
                            </Text>
                            {/* invisible layout anchor */}
                            <View
                                onLayout={(e) =>
                                    onAyahLayout(surah.number, index, e.nativeEvent.layout.y)
                                }
                                style={{ width: 0, height: 0 }}
                            />
                            {' '}
                        </Text>
                    );
                })}
            </Text>

            {/* ── Bottom ornament divider ── */}
            <Text style={s.dividerLine}>{ORNAMENT_LINE}</Text>
        </View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────
export default function SurahScreen() {
    const { id, ayah } = useLocalSearchParams();
    const { colors, settings } = useTheme();
    const navigation = useNavigation();
    const { isAyahFav, toggleAyah } = useFavorites();
    const player = usePlayer();
    const insets = useSafeAreaInsets();

    const startId = parseInt(id as string);
    const startAyah = ayah ? parseInt(ayah as string) : undefined;

    const [surahs, setSurahs] = useState<SurahDetail[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumedAyahIndex, setResumedAyahIndex] = useState<number | null>(startAyah ? startAyah - 1 : null);
    const nextIdRef = useRef(startId);
    const isLoadingRef = useRef(false);

    const scrollRef = useRef<ScrollView>(null);

    // Layout trackers
    const ayahLayoutsRef = useRef<{ [surahNum: number]: { [idx: number]: number } }>({});
    const bismillahLayoutsRef = useRef<{ [surahNum: number]: number }>({});
    
    // Header sync
    const surahYPositionsRef = useRef<{ id: number; english: string; name: string; y: number }[]>([]);
    const activeHeaderRef = useRef('');

    // Sync reciter
    useEffect(() => {
        if (!settings.defaultReciterId) return;
        const selectedReciter = RECITERS.find((r) => r.id === settings.defaultReciterId);
        if (selectedReciter && player.state.reciterBaseUrl !== selectedReciter.baseUrl) {
            player.setReciter(selectedReciter.baseUrl);
        }
    }, [settings.defaultReciterId, player.state.reciterBaseUrl]);

    // Load a batch of surahs starting from `fromId`
    const loadSurah = useCallback(
        async (surahId: number, isFirst: boolean) => {
            if (surahId > 114) return;
            if (isLoadingRef.current) return;
            
            isLoadingRef.current = true;
            if (isFirst) setLoadingInitial(true);
            else setLoadingMore(true);

            try {
                const data = await getSurah(surahId);
                setSurahs((prev) => {
                    if (prev.some(s => s.number === data.number)) return prev;
                    return [...prev, data];
                });
                nextIdRef.current = surahId + 1;

                if (isFirst) {
                    player.initializeSurah(data.number, data.ayahs, startAyah ? startAyah - 1 : 0);
                    navigation.setOptions({
                        headerTitle: `${data.englishName} · ${data.name}`,
                        headerStyle: { backgroundColor: '#5C2D07' },
                        headerTintColor: '#F5E6C8',
                    });
                    saveLastRead({
                        surahNumber: data.number,
                        surahName: data.name,
                        ayahNumber: 1,
                        type: 'reading',
                    });
                    setLoadingInitial(false);
                }
            } catch (err) {
                console.error(err);
                if (isFirst) setError('Impossible de charger la sourate.');
                setLoadingInitial(false);
            } finally {
                setLoadingMore(false);
                isLoadingRef.current = false;
            }
        },
        [navigation, player]
    );

    useEffect(() => {
        loadSurah(startId, true);
        return () => {
            player.stop();
        };
    }, [startId]);

    // Scroll-to-end → load next surah and sync header
    const handleScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            const offsetY = contentOffset.y;

            // 1. Sync header
            if (surahYPositionsRef.current.length > 0) {
                let active = surahYPositionsRef.current[0];
                for (const item of surahYPositionsRef.current) {
                    if (item.y - 150 <= offsetY) {
                        active = item;
                    } else {
                        break;
                    }
                }
                if (active && activeHeaderRef.current !== active.english) {
                    activeHeaderRef.current = active.english;
                    navigation.setOptions({
                        headerTitle: `${active.english} · ${active.name}`,
                    });
                }
            }

            // 2. Infinite scroll
            const distanceFromBottom =
                contentSize.height - (offsetY + layoutMeasurement.height);
            if (distanceFromBottom < 400 && !loadingMore && nextIdRef.current <= 114) {
                loadSurah(nextIdRef.current, false);
            }
        },
        [loadingMore, loadSurah, navigation]
    );

    // If player advances to a surah not yet loaded in view, forcefully pull it
    useEffect(() => {
        const playingSurahNum = player.state.currentSurahNumber;
        if (playingSurahNum && playingSurahNum >= nextIdRef.current && !loadingMore) {
            loadSurah(nextIdRef.current, false);
        }
    }, [player.state.currentSurahNumber, loadingMore, loadSurah]);

    // Auto-scroll when player changes currentAyah
    useEffect(() => {
        const surahNum = player.state.currentSurahNumber;
        const idx = player.state.currentAyahIndex;
        if (surahNum === null || idx === undefined || !scrollRef.current) return;

        let attempt = 0;
        const tryScroll = () => {
            let y;
            if (player.state.isBismillahPlaying) {
                y = bismillahLayoutsRef.current[surahNum];
            } else {
                y = ayahLayoutsRef.current[surahNum]?.[idx];
            }

            const blockY = surahYPositionsRef.current.find(s => s.id === surahNum)?.y;

            if (y !== undefined && blockY !== undefined) {
                const absoluteY = blockY + y;
                scrollRef.current?.scrollTo({ y: Math.max(0, absoluteY - 120), animated: true });
            } else if (attempt < 15) {
                // Element not laid out yet (infinite scroll or deferred rendering pending), try again
                attempt++;
                setTimeout(tryScroll, 300);
            }
        };

        tryScroll();
    }, [player.state.currentSurahNumber, player.state.currentAyahIndex, player.state.isBismillahPlaying]);

    // Clear resumed highlight on play
    useEffect(() => {
        if (player.state.isPlaying) {
            setResumedAyahIndex(null);
        }
    }, [player.state.isPlaying]);

    // Auto-scroll to resumed ayah on load
    useEffect(() => {
        if (!loadingInitial && resumedAyahIndex !== null && scrollRef.current) {
            setTimeout(() => {
                const y = ayahLayoutsRef.current[startId]?.[resumedAyahIndex];
                if (y !== undefined && scrollRef.current) {
                    scrollRef.current.scrollTo({ y: y - 120, animated: true });
                }
            }, 600);
        }
    }, [loadingInitial, resumedAyahIndex, startId]);

    const onBismillahLayout = useCallback((surahNum: number, y: number) => {
        bismillahLayoutsRef.current[surahNum] = y;
    }, []);

    const onAyahLayout = useCallback((surahNum: number, index: number, y: number) => {
        if (!ayahLayoutsRef.current[surahNum]) ayahLayoutsRef.current[surahNum] = {};
        ayahLayoutsRef.current[surahNum][index] = y;
    }, []);

    const onBlockLayout = useCallback((surah: SurahDetail, y: number) => {
        const existing = surahYPositionsRef.current.find(s => s.id === surah.number);
        if (existing) {
            existing.y = y;
        } else {
            surahYPositionsRef.current.push({ id: surah.number, english: surah.englishName, name: surah.name, y });
        }
        surahYPositionsRef.current.sort((a, b) => a.y - b.y);
    }, []);

    const s = screenStyles(colors);

    if (loadingInitial) {
        return (
            <View style={[s.centered]}>
                <ActivityIndicator size="large" color="#B8882A" />
                <Text style={s.loadingText}>جارٍ التحميل...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={s.centered}>
                <Text style={{ color: colors.text, textAlign: 'center', padding: 24 }}>
                    {error}
                </Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <ScrollView
                ref={scrollRef}
                onScroll={handleScroll}
                scrollEventThrottle={200}
                contentContainerStyle={[s.scroll, { paddingBottom: 120 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Outer parchment frame ── */}
                <View style={s.outerFrame}>
                    <View style={s.innerFrame}>
                        {surahs.map((surah) => (
                            <SurahBlock
                                key={surah.number}
                                surah={surah}
                                settings={settings}
                                colors={colors}
                                player={player}
                                isAyahFav={isAyahFav}
                                toggleAyah={toggleAyah}
                                onBismillahLayout={onBismillahLayout}
                                onAyahLayout={onAyahLayout}
                                onBlockLayout={onBlockLayout}
                                resumedAyahIndex={surah.number === startId ? resumedAyahIndex : null}
                            />
                        ))}


                        {/* Load-more spinner */}
                        {loadingMore && (
                            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#B8882A" />
                                <Text style={{ color: '#B8882A', fontFamily: 'Amiri', marginTop: 6 }}>
                                    جارٍ تحميل السورة التالية...
                                </Text>
                            </View>
                        )}

                        {nextIdRef.current > 114 && (
                            <Text style={s.endText}>
                                ❧  خَتَمَ اللهُ لَنَا بِالخَيْرِ  ❧
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Fullscreen Download Overlay */}
            {player.state.downloadProgress > 0 && player.state.downloadProgress < 1 && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#B8882A" />
                    <Text style={{ color: '#fff', fontSize: 20, marginTop: 20, fontFamily: 'Amiri' }}>
                        جاري التحميل...
                    </Text>
                    <Text style={{ color: '#B8882A', fontSize: 32, marginTop: 10, fontWeight: 'bold' }}>
                        {Math.round(player.state.downloadProgress * 100)}%
                    </Text>
                    <Text style={{ color: '#aaa', fontSize: 13, marginTop: 24, textAlign: 'center', paddingHorizontal: 40, fontFamily: 'Inter', lineHeight: 20 }}>
                        La sourate est en cours de téléchargement complet pour une écoute hors-ligne fluide et ininterrompue.
                        {"\n\n"}Ce processus se terminera rapidement et continuera même si vous minimisez l'application.
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────

const PARCHMENT = '#FBF5E6';
const GOLD = '#B8882A';
const GOLD_LIGHT = '#D4A847';
const DARK_BROWN = '#5C2D07';
const BORDER_COLOR = '#C8A96E';

const screenStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background ?? '#2A1500',
        },
        scroll: {
            padding: 8,
        },
        outerFrame: {
            backgroundColor: PARCHMENT,
            borderRadius: 6,
            borderWidth: 3,
            borderColor: BORDER_COLOR,
            // shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        innerFrame: {
            margin: 6,
            borderWidth: 1.5,
            borderColor: BORDER_COLOR,
            borderRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: PARCHMENT,
        },
        loadingText: {
            fontFamily: 'Amiri',
            color: GOLD,
            marginTop: 12,
            fontSize: 18,
        },
        endText: {
            fontFamily: 'Amiri',
            color: GOLD,
            textAlign: 'center',
            fontSize: 20,
            paddingVertical: 24,
        },
    });

const blockStyles = (colors: any) =>
    StyleSheet.create({
        surahBlock: {
            marginBottom: 8,
        },

        // ── Banner ──────────────────────────────────
        banner: {
            backgroundColor: DARK_BROWN,
            borderRadius: 4,
            borderWidth: 1.5,
            borderColor: GOLD,
            marginBottom: 16,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'center',
            // inner gold inset shadow simulation
            shadowColor: GOLD,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 4,
        },
        bannerInner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        bannerName: {
            fontFamily: 'Amiri',
            fontSize: 26,
            color: GOLD_LIGHT,
            textAlign: 'center',
            flex: 1,
        },
        ornamentLeft: {
            color: GOLD_LIGHT,
            fontSize: 20,
        },
        ornamentRight: {
            color: GOLD_LIGHT,
            fontSize: 20,
        },
        bannerSub: {
            fontFamily: 'Amiri',
            fontSize: 14,
            color: '#D4A847AA',
            marginTop: 4,
        },

        // ── Bismillah ────────────────────────────────
        bismillahContainer: {
            alignSelf: 'center',
            marginBottom: 18,
            paddingVertical: 6,
            paddingHorizontal: 24,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            backgroundColor: '#F5EDD0',
        },
        bismillah: {
            fontFamily: 'Amiri',
            fontSize: 24,
            color: DARK_BROWN,
            textAlign: 'center',
        },

        // ── Ayahs ────────────────────────────────────
        ayahsText: {
            fontFamily: 'Amiri',
            color: '#1A0A00',
            textAlign: 'justify',
            writingDirection: 'rtl',
            lineHeight: 48,
        },
        ayahMarker: {
            fontFamily: 'Amiri',
            color: GOLD,
            fontSize: 18,
        },

        // ── Divider ──────────────────────────────────
        dividerLine: {
            fontFamily: 'Amiri',
            color: GOLD,
            textAlign: 'center',
            fontSize: 18,
            marginVertical: 20,
            letterSpacing: 4,
        },
    });
