import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Moon, Sun, Type, Volume2, Download, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { RECITATEURS } from '../utils/constants';

export default function ParametresScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { settings, updateSettings } = useApp();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Apparence */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Moon size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Apparence
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            {isDarkMode ? (
              <Moon size={20} color={colors.textSecondary} />
            ) : (
              <Sun size={20} color={colors.textSecondary} />
            )}
            <Text style={[styles.settingText, { color: colors.text }]}>
              Mode sombre
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d1d5db', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Type size={20} color={colors.textSecondary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Taille du texte
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {settings.fontSize}px
          </Text>
        </View>

        <View style={styles.sliderContainer}>
          <input
            type="range"
            min="18"
            max="36"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            style={{ width: '100%', accentColor: colors.primary }}
          />
        </View>
      </View>

      {/* Audio */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Volume2 size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Audio
          </Text>
        </View>

        {RECITATEURS.map(rec => (
          <TouchableOpacity
            key={rec.id}
            style={[
              styles.recitatorItem,
              settings.selectedRecitateur === rec.id && {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
                borderWidth: 2,
              }
            ]}
            onPress={() => updateSettings({ selectedRecitateur: rec.id })}
          >
            <View style={styles.recitatorInfo}>
              <Text style={[styles.recitatorName, { color: colors.text }]}>
                {rec.name}
              </Text>
              <Text style={[styles.recitatorNameAr, { color: colors.textSecondary }]}>
                {rec.nameAr}
              </Text>
            </View>
            {settings.selectedRecitateur === rec.id && (
              <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Téléchargements */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Download size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Téléchargements
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>
            Gérer les téléchargements hors ligne
          </Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Téléchargez les sourates pour une utilisation sans connexion Internet
        </Text>
      </View>

      {/* À propos */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Info size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            À propos
          </Text>
        </View>

        <Text style={[styles.aboutText, { color: colors.text }]}>
          <Text style={{ fontWeight: 'bold' }}>Quran Warsh</Text> - Version 1.0.0
        </Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Récitation selon la riwaya Warsh 'an Nafi'
        </Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary, marginTop: 12 }]}>
          Cette application respecte le contenu religieux du Saint Coran.
          Aucune modification du texte sacré n'est effectuée.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
  },
  sliderContainer: {
    marginTop: 8,
  },
  recitatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recitatorInfo: {
    flex: 1,
  },
  recitatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recitatorNameAr: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});