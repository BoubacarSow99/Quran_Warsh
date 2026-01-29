import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../utils/colors';
import StorageService from '../services/storageService';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    const settings = await StorageService.getSettings();
    if (settings.success) {
      setIsDarkMode(settings.data.darkMode ?? systemColorScheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    const settings = await StorageService.getSettings();
    if (settings.success) {
      await StorageService.saveSettings({
        ...settings.data,
        darkMode: newMode
      });
    }
  };

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  const value = {
    isDarkMode,
    colors,
    toggleTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
