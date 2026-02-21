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
import { getSurahList, Surah } from '../../services/quranApi';

const REVELATION_LABEL: Record<string, string> = {
    Meccan: 'Mecquoise',
    Medinan: 'Médinoise',
};


export default function SurahsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filtered, setFiltered] = useState<Surah[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSurahList()
            .then(data => {
                setSurahs(data);
                setFiltered(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Impossible de charger la liste des sourates. Vérifiez votre connexion.');
                setLoading(false);
            });

    }, []);

    const onSearch = useCallback(
        (text: string) => {
            setQuery(text);
            const q = text.toLowerCase().trim();
            if (!q) {
                setFiltered(surahs);
                return;
            }
            setFiltered(
                surahs.filter(
                    s =>
                        s.englishName.toLowerCase().includes(q) ||
                        s.name.includes(q) ||
                        s.number.toString() === q
                )
            );
        },
        [surahs]
    );

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
                    placeholder="Rechercher une sourate..."
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={onSearch}
                    textAlign="left"
                />
            </View>


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
                        <Text style={s.surahArabic}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={s.separator} />}
            />
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
    });
