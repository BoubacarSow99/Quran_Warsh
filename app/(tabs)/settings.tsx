import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
} from 'react-native';
// Slider removed due to network dependency issues

import { useTheme } from '../../hooks/useTheme';
import { RECITERS } from '../../constants/reciters';

export default function SettingsScreen() {
    const { colors, isDark, settings, updateSettings } = useTheme();
    const s = styles(colors);

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            {/* Mode nuit */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Thème</Text>
                <View style={s.row}>
                    <View>
                        <Text style={s.label}>Mode Sombre</Text>
                        <Text style={s.sublabel}>Utiliser le thème sombre</Text>
                    </View>
                    <Switch
                        value={settings.darkMode}
                        onValueChange={val => updateSettings({ darkMode: val })}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={settings.darkMode ? colors.secondary : '#f4f3f4'}
                    />
                </View>
            </View>


            {/* Taille de la police */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Taille de la police</Text>
                <Text style={s.previewText} numberOfLines={2}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>

                <View style={s.fontControls}>
                    <TouchableOpacity
                        style={s.fontBtn}
                        onPress={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}
                        activeOpacity={0.7}
                    >
                        <Text style={s.fontBtnText}>-</Text>
                    </TouchableOpacity>

                    <View style={s.fontSizeBadge}>
                        <Text style={s.fontSizeLabel}>{settings.fontSize}pt</Text>
                    </View>

                    <TouchableOpacity
                        style={s.fontBtn}
                        onPress={() => updateSettings({ fontSize: Math.min(40, settings.fontSize + 2) })}
                        activeOpacity={0.7}
                    >
                        <Text style={s.fontBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={s.fontSizeMeta}>Ajuster la taille du texte (18-40)</Text>
            </View>


            {/* Récitateur */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Récitateur par défaut</Text>
                {RECITERS.map(r => (
                    <TouchableOpacity
                        key={r.id}
                        style={[
                            s.reciterRow,
                            settings.defaultReciterId === r.id && s.reciterSelected,
                        ]}
                        onPress={() => updateSettings({ defaultReciterId: r.id })}
                        activeOpacity={0.7}
                    >
                        <View style={s.radioOuter}>
                            {settings.defaultReciterId === r.id && (
                                <View style={s.radioInner} />
                            )}
                        </View>
                        <View style={s.reciterInfo}>
                            <Text style={s.reciterFr}>{r.name}</Text>
                            <Text style={s.reciterAr}>{r.nameAr}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>


            {/* Téléchargement */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Téléchargement</Text>
                <View style={s.row}>
                    <View>
                        <Text style={s.label}>Téléchargement auto</Text>
                        <Text style={s.sublabel}>Audio des sourates</Text>
                    </View>
                    <Switch
                        value={settings.autoDownload}
                        onValueChange={val => updateSettings({ autoDownload: val })}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={settings.autoDownload ? colors.secondary : '#f4f3f4'}
                    />
                </View>
            </View>


            {/* Version */}
            <Text style={s.version}>Quran Hafs v1.0.0 · Récitation Hafs 'an Asim</Text>

        </ScrollView>
    );
}

const styles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, paddingBottom: 40 },
        section: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionTitle: {
            color: colors.primary,
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            marginBottom: 14,
            textAlign: 'left',
        },

        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        label: { color: colors.text, fontSize: 15, fontFamily: 'Inter', fontWeight: '500', textAlign: 'left' },
        sublabel: { color: colors.textMuted, fontSize: 12, fontFamily: 'Inter', textAlign: 'left' },

        previewText: {
            color: colors.arabicText,
            fontFamily: 'Amiri',
            fontSize: 24,
            textAlign: 'center',
            marginBottom: 12,
            lineHeight: 42,
        },
        fontControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            marginTop: 10,
        },
        fontBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
        },
        fontBtnText: {
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: -2,
        },
        fontSizeBadge: {
            backgroundColor: colors.primary + '11',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
            minWidth: 80,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '22',
        },
        fontSizeLabel: {
            color: colors.primary,
            fontSize: 18,
            fontWeight: '700',
            fontFamily: 'Inter',
        },
        fontSizeMeta: {
            color: colors.textMuted,
            fontSize: 11,
            fontFamily: 'Inter',
            textAlign: 'center',
            marginTop: 12,
        },
        reciterRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            gap: 12,
            marginBottom: 4,
        },
        reciterSelected: { backgroundColor: colors.primary + '18' },
        radioOuter: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        radioInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
        },
        reciterInfo: { flex: 1, alignItems: 'flex-start' },
        reciterAr: { color: colors.arabicText, fontSize: 16, fontFamily: 'Amiri' },
        reciterFr: { color: colors.text, fontSize: 14, fontFamily: 'Inter', fontWeight: '500' },

        version: {
            color: colors.textMuted,
            fontSize: 12,
            fontFamily: 'Inter',
            textAlign: 'center',
            marginTop: 8,
        },
    });
