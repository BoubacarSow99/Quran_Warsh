
// ============================================
// src/App.jsx - Point d'entrée principal
// ============================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider } from './context/AudioContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <AudioProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </AudioProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
