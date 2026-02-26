import { useState, useEffect, useCallback } from 'react';
import { AppSettings, getSettings, saveSettings } from '../services/storageService';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>({
        fontSize: 24,
        defaultReciterId: 'alafasy',
        darkMode: false,
        autoDownload: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettings().then(s => {
            setSettings(s);
            setLoading(false);
        });
    }, []);

    const updateSettings = useCallback(async (changes: Partial<AppSettings>) => {
        const updated = await saveSettings(changes);
        setSettings(updated);
    }, []);

    return { settings, loading, updateSettings };
}
