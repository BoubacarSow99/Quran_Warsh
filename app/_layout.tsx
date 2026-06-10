import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { PlayerProvider } from '../hooks/usePlayer';
import { AudioPlayer } from '../components/AudioPlayer';
import { OnboardingModal } from '../components/OnboardingModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'hasSeenOnboarding';

function RootLayoutNav() {
    const { isDark, colors } = useTheme();

    // Phase 1 – fonts
    const [fontsLoaded, setFontsLoaded] = useState(false);

    // Phase 2 – onboarding
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // ── Load fonts ─────────────────────────────────────────────────────────
    useEffect(() => {
        Font.loadAsync({
            Amiri:     require('../assets/fonts/Amiri-Regular.ttf'),
            AmiriBold: require('../assets/fonts/Amiri-Bold.ttf'),
            Inter:     require('../assets/fonts/Inter-Regular.ttf'),
            InterBold: require('../assets/fonts/Inter-Bold.ttf'),
        })
            .catch(err => console.warn('Font loading error:', err))
            .finally(() => setFontsLoaded(true));
    }, []);

    // ── Check onboarding flag (runs after fonts so splash stays hidden) ────
    useEffect(() => {
        if (!fontsLoaded) return;
        AsyncStorage.getItem(ONBOARDING_KEY).then(value => {
            setShowOnboarding(value !== 'true');
            setOnboardingChecked(true);
            SplashScreen.hideAsync();
        });
    }, [fontsLoaded]);

    // ── Called when onboarding is dismissed (download or skip) ─────────────
    const handleOnboardingDone = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    };

    // Keep splash until fonts + AsyncStorage read are done
    if (!fontsLoaded || !onboardingChecked) {
        return null;
    }

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <PlayerProvider>
                <Stack
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.headerBg },
                        headerTintColor: colors.headerText,
                        headerTitleStyle: { fontFamily: 'AmiriBold', fontSize: 20 },
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="surah/[id]"
                        options={{
                            headerShown: false,
                            title: 'Le Saint Coran',
                        }}
                    />
                </Stack>
                <AudioPlayer />
            </PlayerProvider>

            {/* Onboarding modal is rendered above the app so it sits on top */}
            <OnboardingModal
                visible={showOnboarding}
                onDone={handleOnboardingDone}
            />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RootLayoutNav />
        </ThemeProvider>
    );
}
