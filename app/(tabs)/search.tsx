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

export default function SearchScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [results, setResults] = useState<Surah[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSurahList()
            .then(data => {
                setSurahs(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const onSearch = useCallback(
        (text: string) => {
            setQuery(text);
            const q = text.toLowerCase().trim();
            if (!q) { setResults([]); return; }
            setResults(
                surahs.filter(s =>
                    s.englishName.toLowerCase().includes(q) ||
                    s.name.includes(q) ||
                    s.number.toString() === q
                )
            );
        },
        [surahs]
    );

    const s = styles(colors);

    return (
        <View style={s.container}>
            <View style={s.searchBox}>
                <TextInput
                    style={s.input}
                    placeholder="Nom ou numéro..."
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={onSearch}
                    autoFocus
                    textAlign="left"
                />

                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                        <Text style={s.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : query.length === 0 ? (
                <View style={s.placeholder}>
                    <Text style={s.placeholderIcon}>🔍</Text>
                    <Text style={s.placeholderText}>Rechercher une sourate</Text>
                    <Text style={s.placeholderSub}>Tapez le nom ou le numéro de la sourate</Text>
                </View>

            ) : results.length === 0 ? (
                <View style={s.placeholder}>
                    <Text style={s.placeholderIcon}>😔</Text>
                    <Text style={s.placeholderText}>Aucun résultat pour "{query}"</Text>
                </View>

            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.number.toString()}
                    contentContainerStyle={s.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={s.resultRow}
                            onPress={() => router.push(`/surah/${item.number}`)}
                            activeOpacity={0.7}
                        >
                            <View style={s.numBadge}>
                                <Text style={s.numText}>{item.number}</Text>
                            </View>
                            <View style={s.rowInfo}>
                                <Text style={s.englishName}>{item.englishName}</Text>
                                <Text style={s.metaText}>{item.numberOfAyahs} versets</Text>

                            </View>
                            <Text style={s.arabicName}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={s.sep} />}
                />
            )}
        </View>
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        searchBox: {
            flexDirection: 'row',
            alignItems: 'center',
            margin: 12,
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.primary,
            paddingHorizontal: 16,
        },
        input: {
            flex: 1,
            height: 48,
            color: colors.text,
            fontFamily: 'Inter',
            fontSize: 16,
        },

        clearBtn: { color: colors.textMuted, fontSize: 16, padding: 4 },
        placeholder: { alignItems: 'center', marginTop: 60, padding: 24 },
        placeholderIcon: { fontSize: 48, marginBottom: 16 },
        placeholderText: {
            color: colors.text,
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: '600',
            textAlign: 'center',
        },
        placeholderSub: {
            color: colors.textMuted,
            fontSize: 13,
            fontFamily: 'Inter',
            marginTop: 6,
            textAlign: 'center',
        },

        list: { paddingHorizontal: 12, paddingBottom: 24 },
        resultRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            gap: 12,
        },
        numBadge: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + '22',
            alignItems: 'center',
            justifyContent: 'center',
        },
        numText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter', fontWeight: '700' },
        rowInfo: { flex: 1 },
        englishName: { color: colors.text, fontSize: 15, fontFamily: 'Inter', fontWeight: '600' },
        metaText: { color: colors.textMuted, fontSize: 12, fontFamily: 'Inter', marginTop: 2 },
        arabicName: { color: colors.arabicText, fontSize: 22, fontFamily: 'Amiri' },
        sep: { height: 1, backgroundColor: colors.border },
    });
