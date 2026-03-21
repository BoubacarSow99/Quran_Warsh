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


// ── Daily Verse helpers ─────────────────────────────────────────────────

const VERSE_STORAGE_KEY = 'daily_verse_v1';
const TOTAL_AYAHS = 6236;

interface DailyVerse {
    text: string;
    ref: string;
    date: string; // ISO date string YYYY-MM-DD
}

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Seeded selection from offline list using the numeric day-of-year as seed */
function getOfflineVerse(): DailyVerse {
    const now = new Date();
    const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const idx = dayOfYear % OFFLINE_VERSES.length;
    return { ...OFFLINE_VERSES[idx], date: todayISO() };
}

async function fetchRandomVerse(): Promise<DailyVerse | null> {
    try {
        const ayahNum = Math.floor(Math.random() * TOTAL_AYAHS) + 1;
        const res = await fetch(
            `https://api.alquran.cloud/v1/ayah/${ayahNum}/quran-uthmani`
        );
        const json = await res.json();
        if (json.code !== 200) return null;
        const data = json.data;
        return {
            text: data.text,
            ref: `${data.surah.englishName} (${data.surah.name}) – ${data.numberInSurah}`,
            date: todayISO(),
        };
    } catch {
        return null;
    }
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

    // 2. Try fetching a random verse from the network
    const online = await fetchRandomVerse();
    const verse = online ?? getOfflineVerse(); // fallback to offline list

    // 3. Persist (online or offline verse) for the rest of the day
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

// ── Offline Verse List (60 curated verses) ──────────────────────────────
const OFFLINE_VERSES: Omit<DailyVerse, 'date'>[] = [
    { text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', ref: 'Al-Sharh (الشرح) – 6' },
    { text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', ref: 'Al-Sharh (الشرح) – 5' },
    { text: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا', ref: 'At-Talaq (الطلاق) – 2' },
    { text: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ', ref: 'At-Talaq (الطلاق) – 3' },
    { text: 'رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْـَٔاخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ', ref: 'Al-Baqara (البقرة) – 201' },
    { text: 'وَبَشِّرِ ٱلصَّٰبِرِينَ', ref: 'Al-Baqara (البقرة) – 155' },
    { text: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ', ref: 'Al-Baqara (البقرة) – 153' },
    { text: 'وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ', ref: 'Al-Baqara (البقرة) – 45' },
    { text: 'إِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ', ref: 'At-Tawba (التوبة) – 120' },
    { text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', ref: 'Al-Ikhlas (الإخلاص) – 1' },
    { text: 'ٱللَّهُ ٱلصَّمَدُ', ref: 'Al-Ikhlas (الإخلاص) – 2' },
    { text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', ref: 'Al-Ikhlas (الإخلاص) – 3' },
    { text: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', ref: 'Al-Ikhlas (الإخلاص) – 4' },
    { text: 'إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ', ref: 'Al-Baqara (البقرة) – 156' },
    { text: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ', ref: 'Al-Baqara (البقرة) – 153' },
    { text: 'رَبِّ زِدْنِى عِلْمًا', ref: 'Ta-Ha (طه) – 114' },
    { text: 'حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ', ref: 'Al-Imran (آل عمران) – 173' },
    { text: 'وَعَسَىٰٓ أَن تَكْرَهُوا۟ شَيْـًٔا وَهُوَ خَيْرٌ لَّكُمْ', ref: 'Al-Baqara (البقرة) – 216' },
    { text: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', ref: 'Al-Baqara (البقرة) – 152' },
    { text: 'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ', ref: 'Al-Baqara (البقرة) – 186' },
    { text: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ', ref: 'Al-Baqara (البقرة) – 255' },
    { text: 'لَا إِكْرَاهَ فِى ٱلدِّينِ', ref: 'Al-Baqara (البقرة) – 256' },
    { text: 'إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ', ref: 'Al-Baqara (البقرة) – 20' },
    { text: 'وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ', ref: 'Al-Baqara (البقرة) – 29' },
    { text: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', ref: 'Al-Imran (آل عمران) – 8' },
    { text: 'إِنَّ ٱللَّهَ لَا يُخْلِفُ ٱلْمِيعَادَ', ref: 'Al-Imran (آل عمران) – 9' },
    { text: 'يُرِيدُ ٱللَّهُ بِكُمُ ٱلْيُسْرَ وَلَا يُرِيدُ بِكُمُ ٱلْعُسْرَ', ref: 'Al-Baqara (البقرة) – 185' },
    { text: 'وَٱللَّهُ يُحِبُّ ٱلْمُحْسِنِينَ', ref: 'Al-Imran (آل عمران) – 134' },
    { text: 'إِنَّ ٱللَّهَ يُحِبُّ ٱلتَّوَّٰبِينَ وَيُحِبُّ ٱلْمُتَطَهِّرِينَ', ref: 'Al-Baqara (البقرة) – 222' },
    { text: 'فَإِنَّ ٱللَّهَ غَفُورٌ رَّحِيمٌ', ref: 'Al-Baqara (البقرة) – 173' },
    { text: 'إِنَّ ٱلْأَبْرَارَ لَفِى نَعِيمٍ', ref: 'Al-Infitar (الإنفطار) – 13' },
    { text: 'فَأَمَّا مَن أَعْطَىٰ وَٱتَّقَىٰ', ref: 'Al-Layl (الليل) – 5' },
    { text: 'وَٱللَّيْلِ إِذَا يَغْشَىٰ', ref: 'Al-Layl (الليل) – 1' },
    { text: 'وَٱلضُّحَىٰ', ref: 'Ad-Duha (الضحى) – 1' },
    { text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', ref: 'Ad-Duha (الضحى) – 5' },
    { text: 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ', ref: 'Ad-Duha (الضحى) – 6' },
    { text: 'فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ', ref: 'Ad-Duha (الضحى) – 9' },
    { text: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ', ref: 'Ad-Duha (الضحى) – 11' },
    { text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', ref: 'Al-Sharh (الشرح) – 1' },
    { text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ', ref: 'Al-Sharh (الشرح) – 4' },
    { text: 'إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ', ref: 'Al-Kawthar (الكوثر) – 1' },
    { text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', ref: 'Al-Kawthar (الكوثر) – 2' },
    { text: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', ref: 'An-Nasr (النصر) – 1' },
    { text: 'سُبْحَٰنَ رَبِّىَ ٱلْعَظِيمِ', ref: 'Al-Waqi\'a (الواقعة) – 96' },
    { text: 'يَٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ', ref: 'An-Nisa (النساء) – 1' },
    { text: 'وَمَا تَوْفِيقِىٓ إِلَّا بِٱللَّهِ', ref: 'Hud (هود) – 88' },
    { text: 'وَإِن تَعُدُّوا۟ نِعْمَةَ ٱللَّهِ لَا تُحْصُوهَآ', ref: 'Ibrahim (إبراهيم) – 34' },
    { text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', ref: 'Ibrahim (إبراهيم) – 7' },
    { text: 'إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ', ref: 'Al-Ankabut (العنكبوت) – 45' },
    { text: 'وَٱتَّقُوا۟ يَوْمًا تُرْجَعُونَ فِيهِ إِلَى ٱللَّهِ', ref: 'Al-Baqara (البقرة) – 281' },
    { text: 'وَمَا خَلَقْتُ ٱلْجِنَّ وَٱلْإِنسَ إِلَّا لِيَعْبُدُونِ', ref: 'Adh-Dhariyat (الذاريات) – 56' },
    { text: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ ٱللَّهَ حَقَّ تُقَاتِهِ', ref: 'Al-Imran (آل عمران) – 102' },
    { text: 'وَٱعْتَصِمُوا۟ بِحَبْلِ ٱللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا۟', ref: 'Al-Imran (آل عمران) – 103' },
    { text: 'كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ', ref: 'Al-Imran (آل عمران) – 110' },
    { text: 'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ', ref: 'Al-Imran (آل عمران) – 139' },
    { text: 'فَٱصْبِرْ إِنَّ وَعْدَ ٱللَّهِ حَقٌّ', ref: 'Ar-Rum (الروم) – 60' },
    { text: 'وَٱلْعَصْرِ ۝ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ', ref: 'Al-Asr (العصر) – 1-2' },
    { text: 'وَٱللَّهُ خَيْرُ ٱلرَّٰزِقِينَ', ref: 'Al-Jumua (الجمعة) – 11' },
    { text: 'إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُا۟', ref: 'Fatir (فاطر) – 28' },
];



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
                        <Text style={s.ayahText}>{dailyVerse.text}</Text>
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
