import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Amiri_400Regular,
    Amiri_700Bold
} from '@expo-google-fonts/amiri';
import {
    Inter_400Regular,
    Inter_700Bold
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { PlayerProvider } from '../hooks/usePlayer';
import { AudioPlayer } from '../components/AudioPlayer';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isDark, colors } = useTheme();
    const [loaded, error] = useFonts({
        Amiri: Amiri_400Regular,
        AmiriBold: Amiri_700Bold,
        Inter: Inter_400Regular,
        InterBold: Inter_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
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
