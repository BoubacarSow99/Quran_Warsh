import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
// Slider removed due to network dependency issues

import { useTheme } from '../../hooks/useTheme';
import { RECITERS } from '../../constants/reciters';
import { useBatchDownload } from '../../hooks/useBatchDownload';
import { usePlayer } from '../../hooks/usePlayer';
import { clearAudioCache } from '../../services/audioCacheService';
import { clearMergedCache } from '../../services/audioMergeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { NativeModules } from 'react-native';

export default function SettingsScreen() {
    const { colors, isDark, settings, updateSettings } = useTheme();
    const activeReciterUrl = RECITERS.find(r => r.id === settings.defaultReciterId)?.baseUrl || RECITERS[0].baseUrl;
    
    const { stats, startDownload, stopDownload, refreshStats } = useBatchDownload(activeReciterUrl);
    const player = usePlayer();
    const s = styles(colors);

    // Calculate progress fraction
    const progress = stats.total > 0 ? stats.completed / stats.total : 0;
    const remaining = stats.total - stats.completed;

    const handleClearData = () => {
        Alert.alert(
            "Zone de danger",
            "Êtes-vous sûr de vouloir effacer toutes les données ? (Ceci effacera vos favoris, votre progression, vos réglages, et supprimera tout l'audio téléchargé pour libérer de l'espace). Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Effacer tout",
                    style: "destructive",
                    onPress: async () => {
                        stopDownload();
                        await player.stop();
                        await clearAudioCache();
                        await clearMergedCache();
                        await AsyncStorage.clear();

                        // Restaure un état par défaut pour éviter un crash
                        updateSettings({
                            fontSize: 24,
                            defaultReciterId: 'alafasy',
                            darkMode: false,
                            autoDownload: false,
                        });

                        refreshStats();

                        Alert.alert(
                            "Succès",
                            "Toutes les données ont été effacées avec succès. L'application va maintenant redémarrer.",
                            [{ 
                                text: "OK", 
                                onPress: async () => {
                                    if (__DEV__ && NativeModules.DevSettings) {
                                        NativeModules.DevSettings.reload();
                                    } else {
                                        try {
                                            await Updates.reloadAsync();
                                        } catch (e) {
                                            console.warn("Redémarrage manuel requis");
                                        }
                                    }
                                } 
                            }]
                        );
                    }
                }
            ]
        );
    };

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

            {/* Minuteur de veille */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Minuteur de veille (Sleep Timer)</Text>
                <View style={[s.modeButtons, { flexWrap: 'wrap' }]}>
                    {[
                        { label: 'Désactivé', value: null },
                        { label: '15 min', value: 15 },
                        { label: '30 min', value: 30 },
                        { label: '45 min', value: 45 },
                        { label: '1 h', value: 60 },
                    ].map(option => {
                        const isActive = player.state.sleepTimerDuration === option.value;
                        return (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    s.modeBtn,
                                    isActive && s.modeBtnActive,
                                ]}
                                onPress={() => player.setSleepTimer(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        s.modeBtnText,
                                        isActive && s.modeBtnTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <Text style={[s.sublabel, { marginTop: 12 }]}>
                    {player.state.sleepTimerDuration
                        ? `Le lecteur audio s'arrêtera automatiquement dans ${player.state.sleepTimerDuration} minutes.`
                        : "Permet de couper automatiquement la lecture audio après la durée sélectionnée."}
                </Text>
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
                <Text style={s.sectionTitle}>Téléchargement Complet</Text>
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.label}>Télécharger tout le Coran</Text>
                        <Text style={s.sublabel}>Rendre toutes les sourates disponibles hors-ligne (~600 Mo)</Text>
                    </View>
                </View>

                {stats.isSupported && !stats.isDownloading && stats.completed < stats.total && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: colors.primary,
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            marginTop: 12,
                        }}
                        onPress={startDownload}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter', fontWeight: 'bold' }}>
                            ⬇ Télécharger {stats.completed > 0 ? 'la suite' : 'tout le Coran'}
                        </Text>
                    </TouchableOpacity>
                )}

                {stats.isSupported && stats.isDownloading && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'transparent',
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                            marginTop: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                        onPress={stopDownload}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Inter', fontWeight: 'bold' }}>
                            ⏸ Mettre en pause
                        </Text>
                    </TouchableOpacity>
                )}

                {!stats.isSupported && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={[s.sublabel, { color: '#e74c3c' }]}>
                            Note : Le téléchargement audio n'est pas supporté sur navigateur web.
                            Veuillez utiliser l'application mobile pour cette fonctionnalité.
                        </Text>
                    </View>
                )}

                {(stats.isDownloading || stats.completed > 0) && (
                    <View style={s.progressContainer}>
                        <View style={s.progressInfo}>
                            <Text style={s.progressText}>
                                {stats.completed === stats.total
                                    ? 'Terminé'
                                    : stats.isDownloading
                                        ? `Téléchargement : ${stats.currentSurah || '...'} (${stats.currentSurahMB} Mo)`
                                        : `En pause (Reprise sur ${stats.currentSurah || '...'})`}
                            </Text>
                            <Text style={s.progressStats}>
                                {stats.completed} / {stats.total}
                            </Text>
                        </View>

                        <View style={s.progressBarTrack}>
                            <View style={[s.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>

                        <View style={s.metaRow}>
                            <Text style={s.metaLabel}>Restant : {remaining} sourates</Text>
                            <Text style={s.metaLabel}>Taille : {stats.sizeMB} Mo</Text>
                        </View>
                    </View>
                )}

                {!stats.isDownloading && stats.completed === 0 && (
                    <Text style={[s.sublabel, { marginTop: 12, fontStyle: 'italic' }]}>
                        Note : Le téléchargement se fait dans l'ordre 1, 114, 113... 2.
                    </Text>
                )}
            </View>


            {/* Zone de danger */}
            <View style={[s.section, { borderColor: '#e74c3c' + '66' }]}>
                <Text style={[s.sectionTitle, { color: '#e74c3c' }]}>Zone de danger</Text>
                <Text style={s.sublabel}>
                    Cette action supprimera toutes vos données locales de l'application (téléchargements audio, favoris, progression en cours, paramètres).
                </Text>
                <TouchableOpacity
                    style={[s.fontBtn, { width: 'auto', paddingHorizontal: 20, height: 48, borderRadius: 12, backgroundColor: '#e74c3c', marginTop: 16 }]}
                    onPress={handleClearData}
                    activeOpacity={0.7}
                >
                    <Text style={[s.fontBtnText, { fontSize: 16, marginTop: 0 }]}>Effacer toutes les données</Text>
                </TouchableOpacity>
            </View>


            {/* À propos */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>À propos</Text>
                <Text style={[s.label, { marginBottom: 8 }]}>al-Qur'an (Hafs)</Text>
                <Text style={s.sublabel}>
                    Une application moderne pour la lecture et l'écoute du Saint Coran,
                    conçue pour offrir une expérience fluide et premium.
                </Text>
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
                    <Text style={s.label}>Développeur</Text>
                    <Text style={[s.primaryText, { fontWeight: 'bold', fontSize: 16, marginTop: 4 }]}>
                        Artemis99 (Boubacar Sow)
                    </Text>
                </View>
            </View>


            {/* Version */}
            <Text style={s.version}>Quran Hafs v1.1 · Récitation Hafs 'an Asim</Text>

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

        // Tajweed Mode Styles
        modeContainer: {
            marginTop: 10,
            paddingLeft: 4,
        },
        modeButtons: {
            flexDirection: 'row',
            gap: 10,
        },
        modeBtn: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.primary + '15',
            borderWidth: 1,
            borderColor: colors.primary + '33',
        },
        modeBtnActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        modeBtnText: {
            fontSize: 13,
            color: colors.text,
            fontFamily: 'Inter',
            fontWeight: '500',
        },
        modeBtnTextActive: {
            color: '#FFFFFF',
        },

        version: {
            color: colors.textMuted,
            fontSize: 12,
            fontFamily: 'Inter',
            textAlign: 'center',
            marginTop: 8,
        },
        primaryText: { color: colors.primary },

        // Progress Bar Styles
        progressContainer: { marginTop: 20 },
        progressInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
        },
        progressText: { color: colors.text, fontSize: 13, fontWeight: '600' },
        progressStats: { color: colors.primary, fontSize: 13, fontWeight: '700' },
        progressBarTrack: {
            height: 8,
            backgroundColor: colors.primary + '15',
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: colors.primary,
        },
        metaRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
        },
        metaLabel: {
            color: colors.textMuted,
            fontSize: 11,
            fontWeight: '500',
        },
    });
