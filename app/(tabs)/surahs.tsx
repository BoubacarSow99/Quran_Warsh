import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { getSurahList, Surah, getJuzList, getHizbList, Juz, Hizb } from '../../services/quranApi';

import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../hooks/useFavorites';

const REVELATION_LABEL: Record<string, string> = {
    Meccan: 'Mecquoise',
    Medinan: 'Médinoise',
};

interface ParsedVerse {
    surah: Surah;
    ayahNumber: number;
}

function parseVerseQuery(query: string, surahs: Surah[]): ParsedVerse | null {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // Split at the last separator followed by digits at the end
    // Matches separators: space, colon, dash, slash
    const parts = trimmed.split(/[\s:\-\/]+(?=\d+$)/);
    if (parts.length < 2) return null;

    const leftPart = parts[0].trim();
    const rightPart = parts[1].trim();

    const ayahNum = parseInt(rightPart, 10);
    if (isNaN(ayahNum) || ayahNum <= 0) return null;

    let matchedSurah: Surah | undefined;

    // Check if left part is a surah number
    if (/^\d+$/.test(leftPart)) {
        const surahNum = parseInt(leftPart, 10);
        matchedSurah = surahs.find(s => s.number === surahNum);
    } else {
        // Find surah by englishName or name
        const lowerLeft = leftPart.toLowerCase();
        matchedSurah = surahs.find(s => 
            s.englishName.toLowerCase().includes(lowerLeft) ||
            s.name.includes(leftPart)
        );
    }

    if (matchedSurah && ayahNum <= matchedSurah.numberOfAyahs) {
        return {
            surah: matchedSurah,
            ayahNumber: ayahNum
        };
    }

    return null;
}

export default function SurahsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { isSurahFav, toggleSurah } = useFavorites();
    
    const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'hizb'>('surah');
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filtered, setFiltered] = useState<Surah[]>([]);
    const [juzs, setJuzs] = useState<Juz[]>([]);
    const [filteredJuzs, setFilteredJuzs] = useState<Juz[]>([]);
    const [hizbs, setHizbs] = useState<Hizb[]>([]);
    const [filteredHizbs, setFilteredHizbs] = useState<Hizb[]>([]);
    
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [suggestedVerse, setSuggestedVerse] = useState<ParsedVerse | null>(null);

    useEffect(() => {
        Promise.all([getSurahList(), getJuzList(), getHizbList()])
            .then(([surahData, juzData, hizbData]) => {
                setSurahs(surahData);
                setFiltered(surahData);
                setJuzs(juzData);
                setFilteredJuzs(juzData);
                setHizbs(hizbData);
                setFilteredHizbs(hizbData);
                setLoading(false);
            })
            .catch(() => {
                setError('Impossible de charger les données du Coran.');
                setLoading(false);
            });
    }, []);

    const onSearch = useCallback(
        (text: string) => {
            setQuery(text);
            const q = text.toLowerCase().trim();
            if (!q) {
                setFiltered(surahs);
                setFilteredJuzs(juzs);
                setFilteredHizbs(hizbs);
                setSuggestedVerse(null);
                return;
            }

            if (activeTab === 'surah') {
                const parsed = parseVerseQuery(text, surahs);
                setSuggestedVerse(parsed);

                if (parsed) {
                    setFiltered([parsed.surah]);
                } else {
                    setFiltered(
                        surahs.filter(
                            s =>
                                s.englishName.toLowerCase().includes(q) ||
                                s.name.includes(q) ||
                                s.number.toString() === q
                        )
                    );
                }
            } else if (activeTab === 'juz') {
                setFilteredJuzs(
                    juzs.filter(
                        j =>
                            j.number.toString() === q ||
                            j.startSurahEnglishName.toLowerCase().includes(q)
                    )
                );
            } else if (activeTab === 'hizb') {
                setFilteredHizbs(
                    hizbs.filter(
                        h =>
                            h.number.toString() === q ||
                            h.startSurahEnglishName.toLowerCase().includes(q)
                    )
                );
            }
        },
        [surahs, juzs, hizbs, activeTab]
    );

    useEffect(() => {
        onSearch(query);
    }, [activeTab]);

    const s = styles(colors);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[s.loadingText]}>Chargement...</Text>
            </View>

        );
    }

    if (error) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text, textAlign: 'center', padding: 24 }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            {/* Search bar */}
            <View style={s.searchContainer}>
                <Text style={s.searchIcon}>🔍</Text>
                <TextInput
                    style={s.searchInput}
                    placeholder={
                        activeTab === 'surah'
                            ? "Rechercher une sourate ou un verset..."
                            : activeTab === 'juz'
                            ? "Rechercher un Juz' (ex: 30, Al-Baqara)..."
                            : "Rechercher un Hizb (ex: 60, Ya-Sin)..."
                    }
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={onSearch}
                    textAlign="left"
                />
            </View>

            {/* Navigation Tabs */}
            <View style={s.tabBar}>
                <TouchableOpacity
                    style={[s.tabButton, activeTab === 'surah' && s.tabButtonActive]}
                    onPress={() => setActiveTab('surah')}
                    activeOpacity={0.7}
                >
                    <Text style={[s.tabButtonText, activeTab === 'surah' && s.tabButtonTextActive]}>Sourates</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tabButton, activeTab === 'juz' && s.tabButtonActive]}
                    onPress={() => setActiveTab('juz')}
                    activeOpacity={0.7}
                >
                    <Text style={[s.tabButtonText, activeTab === 'juz' && s.tabButtonTextActive]}>Juz'</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tabButton, activeTab === 'hizb' && s.tabButtonActive]}
                    onPress={() => setActiveTab('hizb')}
                    activeOpacity={0.7}
                >
                    <Text style={[s.tabButtonText, activeTab === 'hizb' && s.tabButtonTextActive]}>Hizb</Text>
                </TouchableOpacity>
            </View>

            {/* Suggestion Card */}
            {activeTab === 'surah' && suggestedVerse && (
                <TouchableOpacity
                    style={s.suggestionCard}
                    onPress={() => router.push(`/surah/${suggestedVerse.surah.number}?ayah=${suggestedVerse.ayahNumber}`)}
                    activeOpacity={0.8}
                >
                    <View style={s.suggestionLeft}>
                        <Text style={s.suggestionIcon}>📍</Text>
                        <View style={s.suggestionTextContainer}>
                            <Text style={s.suggestionTitle}>Aller directement au verset</Text>
                            <Text style={s.suggestionSubtitle}>
                                Sourate {suggestedVerse.surah.number} ({suggestedVerse.surah.englishName}) · Verset {suggestedVerse.ayahNumber}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
            )}

            {activeTab === 'surah' ? (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.number.toString()}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={s.surahRow}
                            onPress={() => router.push(`/surah/${item.number}`)}
                            activeOpacity={0.7}
                        >
                            {/* Numéro */}
                            <View style={s.numBadge}>
                                <Text style={s.numText}>{item.number}</Text>
                            </View>

                            {/* Noms */}
                            <View style={s.names}>
                                <Text style={s.surahEnglish}>{item.englishName}</Text>
                                <Text style={s.surahMeta}>
                                    {item.numberOfAyahs} versets ·{' '}
                                    {REVELATION_LABEL[item.revelationType] ?? item.revelationType}
                                </Text>
                            </View>

                            {/* Nom arabe */}
                            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 15 }}>
                                <Text style={s.surahArabic}>{item.name}</Text>
                                <TouchableOpacity
                                    onPress={() => toggleSurah(item.number)}
                                    style={{ padding: 4 }}
                                >
                                    <Ionicons
                                        name={isSurahFav(item.number) ? "heart" : "heart-outline"}
                                        size={24}
                                        color={isSurahFav(item.number) ? colors.primary : colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={s.separator} />}
                />
            ) : activeTab === 'juz' ? (
                <FlatList
                    data={filteredJuzs}
                    keyExtractor={item => `juz-${item.number}`}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={s.surahRow}
                            onPress={() => router.push(`/surah/${item.startSurahNumber}?ayah=${item.startAyahNumber}`)}
                            activeOpacity={0.7}
                        >
                            {/* Numéro */}
                            <View style={s.numBadge}>
                                <Text style={s.numText}>{item.number}</Text>
                            </View>

                            {/* Info */}
                            <View style={s.names}>
                                <Text style={s.surahEnglish}>Juz' {item.number}</Text>
                                <Text style={s.surahMeta}>
                                    {item.startSurahEnglishName} {item.startAyahNumber} - {item.endSurahEnglishName} {item.endAyahNumber}
                                </Text>
                            </View>

                            {/* Arabic Name & Verse */}
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={s.surahArabic}>{item.name}</Text>
                                <Text style={s.surahMeta}>
                                    من {item.startSurahName} إلى {item.endSurahName}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={s.separator} />}
                />
            ) : (
                <FlatList
                    data={filteredHizbs}
                    keyExtractor={item => `hizb-${item.number}`}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={s.surahRow}
                            onPress={() => router.push(`/surah/${item.startSurahNumber}?ayah=${item.startAyahNumber}`)}
                            activeOpacity={0.7}
                        >
                            {/* Numéro */}
                            <View style={s.numBadge}>
                                <Text style={s.numText}>{item.number}</Text>
                            </View>

                            {/* Info */}
                            <View style={s.names}>
                                <Text style={s.surahEnglish}>Hizb {item.number}</Text>
                                <Text style={s.surahMeta}>
                                    Juz' {item.juzParent} · {item.startSurahEnglishName}
                                </Text>
                            </View>

                            {/* Arabic Name & Verse */}
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={s.surahArabic}>الحزب {item.number}</Text>
                                <Text style={s.surahMeta}>Verset {item.startAyahNumber}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={s.separator} />}
                />
            )}
        </View>
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            margin: 12,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
        },
        searchInput: {
            flex: 1,
            height: 44,
            color: colors.text,
            fontFamily: 'Inter',
            fontSize: 15,
        },
        searchIcon: { fontSize: 18, marginRight: 8, opacity: 0.5 },

        list: { paddingHorizontal: 12, paddingBottom: 24 },
        surahRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            gap: 12,
        },
        numBadge: {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.primary + '22',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '44',
        },
        numText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter', fontWeight: '700' },
        names: { flex: 1 },
        surahEnglish: { color: colors.text, fontSize: 15, fontFamily: 'Inter', fontWeight: '600' },
        surahMeta: { color: colors.textMuted, fontSize: 12, fontFamily: 'Inter', marginTop: 2 },
        surahArabic: {
            color: colors.arabicText,
            fontSize: 22,
            fontFamily: 'Amiri',
            textAlign: 'right',
        },
        separator: { height: 1, backgroundColor: colors.border },
        loadingText: { color: colors.textMuted, marginTop: 12, fontFamily: 'Inter' },
        suggestionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 12,
            marginBottom: 12,
            padding: 16,
            backgroundColor: colors.primary + '15',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary + '33',
        },
        suggestionLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        suggestionIcon: {
            fontSize: 24,
        },
        suggestionTextContainer: {
            flex: 1,
            alignItems: 'flex-start',
        },
        suggestionTitle: {
            color: colors.primary,
            fontSize: 11,
            fontWeight: 'bold',
            fontFamily: 'Inter',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        suggestionSubtitle: {
            color: colors.text,
            fontSize: 14,
            fontFamily: 'Inter',
            fontWeight: '600',
            marginTop: 2,
        },
        tabBar: {
            flexDirection: 'row',
            marginHorizontal: 12,
            marginBottom: 12,
            gap: 8,
        },
        tabButton: {
            flex: 1,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tabButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        tabButtonText: {
            color: colors.text,
            fontSize: 14,
            fontFamily: 'Inter',
            fontWeight: '600',
        },
        tabButtonTextActive: {
            color: '#FFFFFF',
            fontWeight: '700',
        },
    });
