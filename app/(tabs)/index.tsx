import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { getLastRead, LastRead } from '../../services/storageService';

const AYAT_DU_JOUR = [
    { text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', ref: 'Sourate Al-Sharh – 6' },
    { text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', ref: 'Sourate At-Talaq – 2' },
    { text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', ref: 'Sourate Al-Sharh – 5' },
    { text: 'وَنَفْسٍ وَمَا سَوَّاهَا', ref: 'Sourate Ash-Shams – 7' },
    { text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', ref: 'Sourate Al-Fatiha – 1' },
];


function getTodayAyah() {
    const day = new Date().getDate();
    return AYAT_DU_JOUR[day % AYAT_DU_JOUR.length];
}

export default function HomeScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [lastRead, setLastRead] = useState<LastRead | null>(null);
    const [loading, setLoading] = useState(true);
    const todayAyah = getTodayAyah();

    useEffect(() => {
        getLastRead().then(lr => {
            setLastRead(lr);
            setLoading(false);
        });
    }, []);

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

                <Text style={s.ayahText}>{todayAyah.text}</Text>
                <Text style={s.ayahRef}>{todayAyah.ref}</Text>
            </View>

            {/* Reprendre la lecture */}
            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : lastRead ? (
                <TouchableOpacity
                    style={s.continueCard}
                    onPress={() => router.push(`/surah/${lastRead.surahNumber}`)}
                    activeOpacity={0.8}
                >
                    <View style={s.continueLeft}>
                        <Text style={s.continueIcon}>📖</Text>
                        <View>
                            <Text style={s.continueLabel}>Reprendre la lecture</Text>
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
