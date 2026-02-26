import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useFavorites } from '../../hooks/useFavorites';

export default function FavoritesScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { favSurahDetails, favAyahs, toggleSurah, toggleAyah } = useFavorites();

    const s = styles(colors);

    const sections = [
        ...(favSurahDetails.length > 0
            ? [{ title: 'Sourates favorites', data: favSurahDetails, type: 'surah' as const }]
            : []),
        ...(favAyahs.length > 0
            ? [{ title: 'Versets favoris', data: favAyahs, type: 'ayah' as const }]
            : []),
    ];


    if (sections.length === 0) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={s.emptyIcon}>⭐</Text>
                <Text style={s.emptyText}>Aucun favori pour le moment</Text>
                <Text style={s.emptySub}>
                    Appuyez sur le cœur ou ⭐ dans une sourate pour l'ajouter ici
                </Text>
            </View>

        );
    }

    return (
        <SectionList
            style={s.container}
            contentContainerStyle={s.content}
            sections={sections as any}
            keyExtractor={(item, index) =>
                (item as any).number ? `surah-${(item as any).number}` : `ayah-${index}`
            }
            renderSectionHeader={({ section }) => (
                <Text style={s.sectionHeader}>{(section as any).title}</Text>
            )}
            renderItem={({ item, section }) => {
                if ((section as any).type === 'surah') {
                    const surah = item as any;
                    return (
                        <TouchableOpacity
                            style={s.surahRow}
                            onPress={() => router.push(`/surah/${surah.number}`)}
                            activeOpacity={0.7}
                        >
                            <View style={s.numBadge}>
                                <Text style={s.numText}>{surah.number}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.surahLabel}>{surah.englishName}</Text>
                                <Text style={[s.surahLabel, { fontSize: 13, color: colors.textMuted, marginTop: 2, fontFamily: 'Amiri' }]}>
                                    {surah.name}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={s.removeBtn}
                                onPress={() => toggleSurah(surah.number)}
                            >
                                <Text style={s.removeTxt}>✕</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }

                const ayah = item as any;
                return (
                    <TouchableOpacity
                        style={s.ayahRow}
                        onPress={() => router.push(`/surah/${ayah.surahNumber}`)}
                        activeOpacity={0.7}
                    >
                        <View style={s.ayahInfo}>
                            <Text style={s.ayahSurahLabel}>
                                {ayah.surahName} – Verset {ayah.ayahNumber}
                            </Text>

                            <Text style={s.ayahText} numberOfLines={2}>
                                {ayah.ayahText}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={s.removeBtn}
                            onPress={() => toggleAyah(ayah)}
                        >
                            <Text style={s.removeTxt}>✕</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                );
            }}
            ItemSeparatorComponent={() => <View style={s.sep} />}
        />
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 12, paddingBottom: 32 },
        emptyIcon: { fontSize: 52, marginBottom: 16 },
        emptyText: {
            color: colors.text,
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: '600',
            textAlign: 'center',
        },

        emptySub: {
            color: colors.textMuted,
            fontSize: 13,
            fontFamily: 'Inter',
            textAlign: 'center',
            marginTop: 8,
            paddingHorizontal: 32,
        },
        sectionHeader: {
            color: colors.primary,
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: '700',
            paddingVertical: 10,
            paddingTop: 20,
        },

        surahRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            gap: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        numBadge: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primary + '22',
            alignItems: 'center',
            justifyContent: 'center',
        },
        numText: { color: colors.primary, fontFamily: 'Inter', fontWeight: '700', fontSize: 13 },
        surahLabel: { flex: 1, color: colors.text, fontSize: 16, fontFamily: 'Inter', fontWeight: '500' },

        ayahRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
        },
        ayahInfo: { flex: 1 },
        ayahSurahLabel: {
            color: colors.primary,
            fontSize: 12,
            fontFamily: 'Inter',
            marginBottom: 6,
        },
        ayahText: {
            color: colors.arabicText,
            fontSize: 20,
            fontFamily: 'Amiri',
            textAlign: 'right',
            lineHeight: 34,
        },
        removeBtn: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
        },
        removeTxt: { color: colors.textMuted, fontSize: 13 },
        sep: { height: 8 },
    });
