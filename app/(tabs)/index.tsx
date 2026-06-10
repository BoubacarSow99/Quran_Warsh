import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../hooks/useTheme';
import { getLastRead, LastRead } from '../../services/storageService';
import { useCallback } from 'react';
import { renderColoredText } from '../../utils/textUtils';
import { getSurah, getSurahList } from '../../services/quranApi';

// ── Daily Verse helpers ─────────────────────────────────────────────────

const VERSE_STORAGE_KEY = 'daily_verse_v1';

interface DailyVerse {
    text: string;
    ref: string;
    date: string; // ISO date string YYYY-MM-DD
}

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


/** Seeded selection from offline JSON */
async function getOfflineRandomVerse(): Promise<DailyVerse> {
    const now = new Date();
    // Jours écoulés depuis une époque fixe
    const dayIndex = Math.floor(
        (now.getTime() - new Date(2024, 0, 1).getTime()) / 86400000
    );

    const TOTAL_AYAHS = 6236;
    
    // Le pas de 137 (premier avec 6236) garantit un cycle parfait :
    // Chaque jour donne un nouveau verset, sans aucune répétition avant 6236 jours (~17 ans).
    const absoluteAyahIndex = (Math.abs(dayIndex) * 137) % TOTAL_AYAHS;

    const surahs = await getSurahList();
    let accumulated = 0;
    let targetSurahNum = 1;
    let targetAyahInSurah = 1;

    for (const s of surahs) {
        if (accumulated + s.numberOfAyahs > absoluteAyahIndex) {
            targetSurahNum = s.number;
            targetAyahInSurah = absoluteAyahIndex - accumulated + 1;
            break;
        }
        accumulated += s.numberOfAyahs;
    }

    const surahDetail = await getSurah(targetSurahNum);
    const ayah = surahDetail.ayahs[targetAyahInSurah - 1];

    return {
        text: ayah.text,
        ref: `${surahDetail.englishName} (${surahDetail.name}) – ${ayah.numberInSurah}`,
        date: todayISO(),
    };
}

async function getDailyVerse(): Promise<DailyVerse> {
    // 1. Return cached verse if it's still today
    try {
        const stored = await AsyncStorage.getItem(VERSE_STORAGE_KEY);
        if (stored) {
            const parsed: DailyVerse = JSON.parse(stored);
            if (parsed.date === todayISO()) return parsed;
        }
    } catch { /* ignore parse error */ }

    // 2. Fetch a random verse locally
    const verse = await getOfflineRandomVerse();

    // 3. Persist for the rest of the day
    await AsyncStorage.setItem(VERSE_STORAGE_KEY, JSON.stringify(verse));
    return verse;
}

/** ms until next midnight */
function msUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
}



export default function HomeScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [lastRead, setLastRead] = useState<LastRead | null>(null);
    const [loading, setLoading] = useState(true);
    const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
    const [verseLoading, setVerseLoading] = useState(true);
    const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load (or fetch) the daily verse and schedule refresh at midnight
    const loadVerse = async () => {
        setVerseLoading(true);
        const verse = await getDailyVerse();
        setDailyVerse(verse);
        setVerseLoading(false);

        // Schedule reload at next midnight
        if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
        midnightTimerRef.current = setTimeout(() => {
            // Clear stored verse so a new one gets fetched
            AsyncStorage.removeItem(VERSE_STORAGE_KEY);
            loadVerse();
        }, msUntilMidnight());
    };

    // Clear midnight timer on unmount
    useEffect(() => {
        return () => {
            if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
        };
    }, []);

    useEffect(() => {
        loadVerse();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getLastRead().then(lr => {
                setLastRead(lr);
                setLoading(false);
            });
        }, [])
    );


    const s = styles(colors, isDark);

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            {/* Header décoratif */}
            <View style={s.headerCard}>
                <Text style={s.headerTitle}>al-Qur'an</Text>
                <Text style={s.headerSub}>Récitation Hafs 'an Asim</Text>
            </View>


            {/* Verset du jour */}
            <View style={s.card}>
                <View style={s.cardHeaderRow}>
                    <Text style={s.cardIcon}>🌙</Text>
                    <Text style={s.cardTitle}>Verset du jour</Text>
                </View>
                {verseLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                ) : dailyVerse ? (
                    <>
                        <Text style={s.ayahText}>{renderColoredText(dailyVerse.text)}</Text>
                        <Text style={s.ayahRef}>{dailyVerse.ref}</Text>
                    </>
                ) : (
                    <Text style={[s.ayahRef, { textAlign: 'center', marginTop: 8 }]}>
                        Impossible de charger le verset (mode hors-ligne)
                    </Text>
                )}
            </View>

            {/* Reprendre la lecture */}
            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : lastRead ? (
                <TouchableOpacity
                    style={s.continueCard}
                    onPress={() => router.push(`/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}`)}
                    activeOpacity={0.8}
                >
                    <View style={s.continueLeft}>
                        <Text style={s.continueIcon}>{lastRead.type === 'listening' ? '🎧' : '📖'}</Text>
                        <View>
                            <Text style={s.continueLabel}>
                                {lastRead.type === 'listening' ? "Reprendre l'écoute" : "Reprendre la lecture"}
                            </Text>
                            <Text style={s.continueSurah}>{lastRead.surahName}</Text>
                            <Text style={s.continueAyah}>Verset {lastRead.ayahNumber}</Text>
                        </View>
                    </View>
                    <Text style={s.continueArrow}>→</Text>

                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={s.startCard}
                    onPress={() => router.push('/surah/1')}
                    activeOpacity={0.8}
                >
                    <Text style={s.startIcon}>🕌</Text>
                    <Text style={s.startText}>Al-Fatiha</Text>
                    <Text style={s.startSub}>Commencer la lecture</Text>

                </TouchableOpacity>
            )}

            {/* Accès rapide */}
            <Text style={s.sectionTitle}>Accès Rapide</Text>

            <View style={s.quickGrid}>
                {QUICK_SURAHS.map(q => (
                    <TouchableOpacity
                        key={q.id}
                        style={s.quickItem}
                        onPress={() => router.push(`/surah/${q.id}`)}
                        activeOpacity={0.7}
                    >
                        <Text style={s.quickNum}>{q.id}</Text>
                        <Text style={s.quickAr}>{q.nameAr}</Text>
                        <Text style={s.quickFr}>{q.nameFr}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const QUICK_SURAHS = [
    { id: 1, nameAr: 'الفاتحة', nameFr: 'Al-Fatiha' },
    { id: 2, nameAr: 'البقرة', nameFr: 'Al-Baqara' },
    { id: 36, nameAr: 'يس', nameFr: 'Ya-Sin' },
    { id: 55, nameAr: 'الرحمن', nameFr: 'Ar-Rahman' },
    { id: 67, nameAr: 'الملك', nameFr: 'Al-Mulk' },
    { id: 112, nameAr: 'الإخلاص', nameFr: 'Al-Ikhlas' },
];

const styles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, paddingBottom: 32 },
        headerCard: {
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 28,
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
        },
        headerTitle: {
            color: '#FFFFFF',
            fontSize: 32,
            fontFamily: 'Amiri',
            textAlign: 'center',
            letterSpacing: 1,
            fontWeight: 'bold',
        },
        bismillah: {
            color: '#FFFFFF',
            fontSize: 26,
            fontFamily: 'Amiri',
            textAlign: 'center',
            letterSpacing: 1,
        },
        headerSub: {
            color: 'rgba(255,255,255,0.75)',
            fontSize: 13,
            marginTop: 8,
            fontFamily: 'Inter',
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
        cardIcon: { fontSize: 18 },
        cardTitle: { color: colors.primary, fontSize: 15, fontFamily: 'Inter', fontWeight: '600' },
        ayahText: {
            color: colors.arabicText,
            fontSize: 24,
            fontFamily: 'Amiri',
            textAlign: 'right',
            lineHeight: 44,
            writingDirection: 'rtl',
        },
        ayahRef: {
            color: colors.textMuted,
            fontSize: 12,
            textAlign: 'right',
            marginTop: 8,
            fontFamily: 'Inter',
        },
        continueCard: {
            backgroundColor: colors.primaryDark,
            borderRadius: 16,
            padding: 18,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        continueLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
        continueIcon: { fontSize: 28 },
        continueLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter' },
        continueSurah: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Amiri', textAlign: 'right' },
        continueAyah: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter' },
        continueArrow: { color: '#FFFFFF', fontSize: 22, opacity: 0.6 },
        startCard: {
            backgroundColor: colors.secondary,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
        },
        startIcon: { fontSize: 36, marginBottom: 8 },
        startText: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold' },
        startSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontFamily: 'Inter' },

        sectionTitle: {
            color: colors.text,
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: 'bold',
            textAlign: 'left',
            marginBottom: 12,
        },

        quickGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
        },
        quickItem: {
            width: '30%',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        quickNum: { color: colors.primary, fontSize: 13, fontFamily: 'Inter', fontWeight: '700' },
        quickAr: { color: colors.arabicText, fontSize: 16, fontFamily: 'Amiri', marginTop: 4 },
        quickFr: { color: colors.textMuted, fontSize: 10, fontFamily: 'Inter', marginTop: 2 },
    });
