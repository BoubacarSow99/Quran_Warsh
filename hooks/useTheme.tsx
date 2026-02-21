import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import type { AppSettings } from '../services/storageService';
import { getSettings, saveSettings } from '../services/storageService';

interface ThemeContextValue {
    isDark: boolean;
    colors: typeof Colors.light;
    settings: AppSettings;
    updateSettings: (changes: Partial<AppSettings>) => Promise<void>;
}

const defaults: AppSettings = {
    fontSize: 24,
    defaultReciterId: 'hussary_warsh',
    darkMode: false,
    autoDownload: false,
};

const ThemeContext = createContext<ThemeContextValue>({
    isDark: false,
    colors: Colors.light,
    settings: defaults,
    updateSettings: async () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [settings, setSettings] = useState<AppSettings>(defaults);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    const isDark = settings.darkMode ?? systemScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const updateSettings = async (changes: Partial<AppSettings>) => {
        const updated = await saveSettings(changes);
        setSettings(updated);
    };

    return (
        <ThemeContext.Provider value={{ isDark, colors, settings, updateSettings }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
