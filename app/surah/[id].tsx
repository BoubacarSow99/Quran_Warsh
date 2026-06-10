import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { getSurah, SurahDetail, Ayah } from '../../services/quranApi';
import { saveLastRead } from '../../services/storageService';
import { usePlayer } from '../../hooks/usePlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { RECITERS } from '../../constants/reciters';
import { renderColoredText } from '../../utils/textUtils';

// ─── Ornament helpers ──────────────────────────────────────────────────
const ORNAMENT = '❁';
const ORNAMENT_LINE = '✦  ───── ❁ ─────  ✦';

function toArabicNumerals(num: string | number): string {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().replace(/[0-9]/g, (w) => arabicNumbers[Number(w)]);
}



// ─── SurahBlock component ──────────────────────────────────────────────
interface SurahBlockProps {
    surah: SurahDetail;
    settings: any;
    colors: any;
    player: any;
    isAyahFav: (s: number, a: number) => boolean;
    toggleAyah: (info: any) => void;
    onBismillahRef: (surahNum: number, ref: View | null) => void;
    onAyahRef: (surahNum: number, index: number, ref: View | null) => void;
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
    onBismillahRef,
    onAyahRef,
    onBlockLayout,
    resumedAyahIndex,
}: SurahBlockProps) {
    const s = blockStyles(colors);
    const isCurrentSurah = player.state.currentSurahNumber === surah.number;

    // Deferred rendering to prevent UI thread locks on large surahs like Surah 2
    const CHUNK_SIZE = 30;
    const initialLimit = resumedAyahIndex ? Math.max(CHUNK_SIZE, resumedAyahIndex + 10) : CHUNK_SIZE;
    
    const [renderLimit, setRenderLimit] = useState(() => 
        surah.ayahs.length > initialLimit ? initialLimit : surah.ayahs.length
    );

    useEffect(() => {
        if (renderLimit < surah.ayahs.length) {
            // Load the next chunk after a short delay to keep UI responsive
            const timer = setTimeout(() => {
                setRenderLimit(prev => Math.min(prev + CHUNK_SIZE, surah.ayahs.length));
            }, 300);
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
            <View style={s.bannerOuter}>
                <View style={s.bannerInner}>
                    <View style={s.bannerSideDeco}>
                        <Text style={s.sideDecoText}>{toArabicNumerals(surah.number)}</Text>
                    </View>
                    <Text style={s.bannerName}>{surah.name}</Text>
                    <View style={s.bannerSideDeco}>
                        <Text style={s.sideDecoText}>{toArabicNumerals(surah.ayahs.length)}</Text>
                    </View>
                </View>
            </View>

            {/* ── Bismillah ── */}
            {surah.number !== 1 && surah.number !== 9 && (
                <View
                    ref={(r) => onBismillahRef(surah.number, r)}
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
            <View
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    direction: 'rtl',
                    width: '100%',
                }}
            >
                {visibleAyahs.map((item, index) => {
                    let displayedText = item.text;
                    if (surah.number !== 1 && surah.number !== 9 && index === 0) {
                        const rahimIdx = displayedText.search(/ر[\u064E\u064F\u0650\u0651\u0652]*ح[\u064E\u064F\u0650\u0651\u0652]*ي[\u064E\u064F\u0650\u0651\u0652]*م[\u064E\u064F\u0650\u0651\u0652\u0640]*/u);
                        if (rahimIdx !== -1) {
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
                        <TouchableOpacity
                            key={`${surah.number}-${index}`}
                            ref={(r) => onAyahRef(surah.number, index, r as any)}
                            onPress={() => handleAyahPress(index)}
                            onLongPress={() =>
                                toggleAyah({
                                    surahNumber: surah.number,
                                    surahName: surah.name,
                                    ayahNumber: item.numberInSurah,
                                    ayahText: item.text,
                                })
                            }
                            activeOpacity={0.75}
                            style={[
                                { alignSelf: 'flex-start' },
                                isHighlighted && {
                                    backgroundColor: colors.primary + '22',
                                    borderRadius: 4,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    s.ayahsText,
                                    {
                                        fontSize: settings.fontSize,
                                        lineHeight: settings.fontSize * 2.0,
                                        writingDirection: 'rtl',
                                    },
                                    isHighlighted && { color: colors.primary },
                                ]}
                            >
                                {renderColoredText(displayedText)}
                                <Text style={s.ayahMarker}>
                                    {isAyahFav(surah.number, item.numberInSurah) ? ' ⭐ ' : ' '}
                                    {'\u06DD'}
                                    {toArabicNumerals(item.numberInSurah)}
                                    {' '}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

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
    const router = useRouter();
    const { isAyahFav, toggleAyah } = useFavorites();
    const player = usePlayer();
    const insets = useSafeAreaInsets();
    const [currentTitle, setCurrentTitle] = useState('');

    const startId = parseInt(id as string);
    const startAyah = ayah ? parseInt(ayah as string) : undefined;

    const [surahs, setSurahs] = useState<SurahDetail[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumedAyahIndex, setResumedAyahIndex] = useState<number | null>(startAyah ? startAyah - 1 : null);
    
    useEffect(() => {
        if (startAyah !== undefined) {
            setResumedAyahIndex(startAyah - 1);
        } else {
            setResumedAyahIndex(null);
        }
    }, [startAyah]);

    const nextIdRef = useRef(startId);
    const isLoadingRef = useRef(false);

    const scrollRef = useRef<ScrollView>(null);

    // Refs to View nodes for accurate measureLayout-based scrolling
    const ayahRefsRef = useRef<{ [surahNum: number]: { [idx: number]: View | null } }>({});
    const bismillahRefsRef = useRef<{ [surahNum: number]: View | null }>({});
    
    // Header sync (still uses onBlockLayout y for header text only)
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
                    setCurrentTitle(`${data.englishName} · ${data.name}`);
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
                    setCurrentTitle(`${active.english} · ${active.name}`);
                }
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
            const scrollNode = scrollRef.current as any;
            let targetRef: View | null = null;

            if (player.state.isBismillahPlaying) {
                targetRef = bismillahRefsRef.current[surahNum] || null;
            } else {
                targetRef = ayahRefsRef.current[surahNum]?.[idx] || null;
            }

            if (targetRef && scrollNode) {
                (targetRef as any).measureLayout(
                    scrollNode,
                    (x: number, y: number) => {
                        scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
                    },
                    () => {
                        if (attempt < 15) {
                            attempt++;
                            setTimeout(tryScroll, 300);
                        }
                    }
                );
            } else if (attempt < 15) {
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
                const targetRef = ayahRefsRef.current[startId]?.[resumedAyahIndex];
                const scrollNode = scrollRef.current as any;
                if (targetRef && scrollNode) {
                    (targetRef as any).measureLayout(
                        scrollNode,
                        (x: number, y: number) => {
                            scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
                        },
                        () => {} // ignore error
                    );
                }
            }, 600);
        }
    }, [loadingInitial, resumedAyahIndex, startId]);

    const onBismillahRef = useCallback((surahNum: number, ref: View | null) => {
        bismillahRefsRef.current[surahNum] = ref;
    }, []);

    const onAyahRef = useCallback((surahNum: number, index: number, ref: View | null) => {
        if (!ayahRefsRef.current[surahNum]) ayahRefsRef.current[surahNum] = {};
        ayahRefsRef.current[surahNum][index] = ref;
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
            {/* Floating back button */}
            <TouchableOpacity
                style={[s.backButton, { top: insets.top + 8 }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={22} color="#F5E6C8" />
            </TouchableOpacity>

            {/* Floating surah title */}
            {currentTitle ? (
                <View style={[s.floatingTitle, { top: insets.top + 8 }]}>
                    <Text style={s.floatingTitleText} numberOfLines={1}>{currentTitle}</Text>
                </View>
            ) : null}

            <ScrollView
                ref={scrollRef}
                onScroll={handleScroll}
                scrollEventThrottle={200}
                contentContainerStyle={[s.scroll, { paddingTop: insets.top + 50, paddingBottom: 120 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Outer parchment frame ── */}
                <View style={s.pageWrapper}>
                    <View style={s.outerBorder}>
                        <View style={s.middleBorder}>
                            <View style={s.innerBorder}>
                                {surahs.map((surah) => (
                            <SurahBlock
                                key={surah.number}
                                surah={surah}
                                settings={settings}
                                colors={colors}
                                player={player}
                                isAyahFav={isAyahFav}
                                toggleAyah={toggleAyah}
                                onBismillahRef={onBismillahRef}
                                onAyahRef={onAyahRef}
                                onBlockLayout={onBlockLayout}
                                resumedAyahIndex={surah.number === startId ? resumedAyahIndex : null}
                            />
                        ))}



                            </View>
                        </View>
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

const PARCHMENT = '#FCF8E8'; // Lighter, creamy page color
const BORDER_OUTER = '#4A2A18'; // Dark wood/leather brown
const BORDER_MIDDLE = '#C29B62'; // Gold/Tan
const BORDER_INNER = '#24140D'; // Almost black brown
const TEXT_COLOR = '#111111';

const screenStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#1C0D05', // very dark background behind the page
        },
        backButton: {
            position: 'absolute',
            left: 12,
            zIndex: 100,
            backgroundColor: 'rgba(92, 45, 7, 0.85)',
            borderRadius: 20,
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
        },
        floatingTitle: {
            position: 'absolute',
            left: 56,
            right: 12,
            zIndex: 100,
            backgroundColor: 'rgba(92, 45, 7, 0.85)',
            borderRadius: 18,
            paddingVertical: 6,
            paddingHorizontal: 16,
            alignItems: 'center',
        },
        floatingTitleText: {
            fontFamily: 'AmiriBold',
            fontSize: 16,
            color: '#F5E6C8',
        },
        scroll: {
            paddingVertical: 10,
            paddingHorizontal: 0,
        },
        pageWrapper: {
            backgroundColor: PARCHMENT,
            // Main outer drop shadow to separate page from background
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 10,
        },
        outerBorder: {
            margin: 0,
            borderTopWidth: 8,
            borderBottomWidth: 8,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderColor: BORDER_OUTER,
        },
        middleBorder: {
            marginVertical: 2,
            borderTopWidth: 4,
            borderBottomWidth: 4,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderColor: PARCHMENT, // negative space
            backgroundColor: BORDER_MIDDLE,
        },
        innerBorder: {
            marginVertical: 2,
            borderTopWidth: 2,
            borderBottomWidth: 2,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderColor: BORDER_INNER,
            backgroundColor: PARCHMENT,
            paddingHorizontal: 12,
            paddingVertical: 16,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: PARCHMENT,
        },
        loadingText: {
            fontFamily: 'Amiri',
            color: BORDER_MIDDLE,
            marginTop: 12,
            fontSize: 18,
        },
        endText: {
            fontFamily: 'Amiri',
            color: BORDER_MIDDLE,
            textAlign: 'center',
            fontSize: 22,
            paddingVertical: 30,
        },
    });

const blockStyles = (colors: any) =>
    StyleSheet.create({
        surahBlock: {
            marginBottom: 10,
        },

        // ── Banner ──────────────────────────────────
        bannerOuter: {
            backgroundColor: BORDER_MIDDLE,
            borderWidth: 2,
            borderColor: BORDER_INNER,
            marginBottom: 16,
            padding: 3,
        },
        bannerInner: {
            borderWidth: 1,
            borderColor: BORDER_INNER,
            backgroundColor: PARCHMENT,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
            paddingHorizontal: 12,
        },
        bannerSideDeco: {
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sideDecoText: {
            fontFamily: 'Amiri',
            fontSize: 16,
            color: BORDER_OUTER,
        },
        bannerName: {
            fontFamily: 'Amiri',
            fontSize: 28,
            color: BORDER_INNER,
            textAlign: 'center',
            flex: 1,
            fontWeight: '600',
            letterSpacing: 1,
        },

        // ── Bismillah ────────────────────────────────
        bismillahContainer: {
            alignSelf: 'center',
            marginBottom: 18,
            paddingVertical: 4,
            paddingHorizontal: 32,
        },
        bismillah: {
            fontFamily: 'Amiri',
            fontSize: 26,
            color: TEXT_COLOR,
            textAlign: 'center',
        },

        // ── Ayahs ────────────────────────────────────
        ayahsText: {
            fontFamily: 'Amiri',
            color: TEXT_COLOR,
            textAlign: 'justify',
            writingDirection: 'rtl',
            lineHeight: 52, // Extra breathing room for ornate font
        },
        ayahMarker: {
            fontFamily: 'Amiri',
            color: BORDER_OUTER,
        },
        ayahRow: {
            width: '100%',
            paddingVertical: 4,
            paddingHorizontal: 2,
        },

        // ── Divider ──────────────────────────────────
        dividerLine: {
            fontFamily: 'Amiri',
            color: BORDER_MIDDLE,
            textAlign: 'center',
            fontSize: 18,
            marginVertical: 15,
            letterSpacing: 4,
        },
    });
