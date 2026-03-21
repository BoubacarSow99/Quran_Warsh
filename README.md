# 📖 Al-Qur'an Hafs

> Application mobile de lecture et d'écoute du Saint Coran — Récitation Hafs 'an Âsim

---

## 📋 Présentation

**Al-Qur'an Hafs** est une application mobile (Android / iOS) développée avec **React Native (Expo)**, permettant la lecture et l'écoute du Saint Coran avec la récitation **Hafs 'an Âsim**, l'une des récitations les plus répandues dans le monde musulman.

L'application est conçue pour être sobre, rapide, et respectueuse du contenu religieux, sans publicité ni collecte de données personnelles.

---

## ✅ Fonctionnalités Implémentées

### 📖 Lecture du Coran
- [x] Texte complet du Coran en arabe (édition `quran-uthmani` via AlQuran.cloud API)
- [x] Affichage par sourate
- [x] Mode nuit / mode jour (thème automatique selon le système)
- [x] Affichage des numéros de versets discrets
- [x] Mise en page en flux continu façon **Mushaf** (texte qui s'enchaîne naturellement)
- [x] Suppression automatique de la Basmala dupliquée dans le premier verset
- [x] Surlignage dynamique du verset en cours de lecture

### 🎧 Écoute Audio
- [x] Écoute de la sourate entière en Hafs
- [x] Choix de plusieurs récitateurs (Sheikh Al-Alafasy, Al-Hussary, Abd Al-Basit, etc.)
- [x] Lecture verset par verset avec **auto-avance automatique** et **enchaînement inter-sourates transparent (Gapless)**
- [x] Commandes audio : Lecture / Pause, Verset précédent / Suivant, Boucle de répétition
- [x] Lecture de la **Basmala audio** avant chaque sourate (sauf Al-Fatiha et At-Tawbah)
- [x] **Mise en cache locale** intelligente et hors-ligne complet (vérification instantanée via système de fichiers)
- [x] Gestionnaire de téléchargement complet en arrière-plan (mode Pause/Reprise) avec suivi du poids (en Mo)
- [x] Lecteur audio global persistant (visible sur toute l'application)
- [x] Défilement automatique multi-sourates vers le verset en cours (**Auto-Scroll absolu**)
- [x] Migration vers l'API moderne `expo-audio` (compatible Expo SDK 54)

### ⭐ Favoris & Reprise
- [x] Sauvegarde automatique de la dernière position de lecture (Reprise depuis l'Accueil)
- [x] Marquer / démarquer une sourate en favori (icône cœur dans la liste)
- [x] Marquer / démarquer un verset en favori
- [x] Onglet dédié aux favoris avec affichage nom FR + AR
- [x] Synchronisation temps réel entre les onglets
- [x] Indicateur visuel ⭐ sur les versets favoris dans la lecture

### 🔍 Recherche
- [x] Onglet de liste complète des 114 sourates avec numéro, nom arabe et nombre de versets

### ⚙️ Paramètres & Gestion des données
- [x] Sélection manuelle du récitateur par défaut
- [x] Changement de thème (clair / sombre)
- [x] Gérer le téléchargement automatique des sourates (Bouton Pause/Lancement)
- [x] **Zone de danger** : Réinitialisation complète du cache vocal et de l'historique avec redémarrage natif automatique de l'application
- [x] Section **À propos** avec description de l'app et crédits du développeur

### 🎨 Design & UX
- [x] Thème épuré avec couleurs douces (vert/beige/marron)
- [x] Navigation par onglets fluide : Accueil, Sourates, Favoris, Paramètres
- [x] Icône de lancement et Splash Screen "Al-Qur'an Hafs" harmonisés
- [x] Police arabique **Amiri** avec mode "Mushaf" continu
- [x] Barre audio premium flottante avec contrôles complets
- [x] **Rendu différé (Deferred Rendering)** : Ouverture immédiate sans aucun "freeze" pour les sourates géantes (ex: Al-Baqara)

---

## 🚧 Fonctionnalités à Venir (Backlog)

### Fonctionnalités Principales
- [ ] Affichage par **Juz'** (30 parties)
- [ ] Affichage par **Hizb**
- [ ] Taille de police ajustable (zoom du texte)

### Fonctionnalités Secondaires
- [ ] Système de recherche avancée (par nom de sourate, numéro, numéro de verset)
- [ ] Suggestions automatiques dans la recherche

### Évolutions Futures
- [ ] Tajwid coloré
- [ ] Mode répétition pour mémorisation (répétition du verset N fois)
- [ ] Minuteur de lecture (sleep timer)
- [ ] Widgets mobiles (Android/iOS)
- [ ] Mode hors ligne complet (texte pré-chargé sans internet)
- [ ] Support de la plateforme **Web** (Next.js)

---

## 📊 Avancement Global

| Section | Avancement |
|---|---|
| Lecture du Coran | 🟢 95% |
| Écoute Audio | 🟢 95% |
| Favoris & Reprise | 🟢 100% |
| Recherche | 🟡 60% |
| Mode Hors Ligne | 🟢 90% (audio et cache intelligent) |
| Paramètres | 🟢 95% |
| Design / UX | 🟢 90% |
| **Global MVP** | **🟢 ~90%** |

---

## 🛠️ Stack Technique

| Technologie | Usage |
|---|---|
| **React Native + Expo SDK 54** | Framework mobile |
| **Expo Router** | Navigation par fichiers |
| **expo-audio** | Lecture audio |
| **expo-file-system** | Cache local audio |
| **AlQuran.cloud API** | Texte et audio du Coran |
| **TypeScript** | Typage statique |
| **@expo-google-fonts/amiri** | Police arabique |

---

## 🚀 Installation & Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npx expo start -c

# Android
npx expo start --android

# iOS
npx expo start --ios
```

> **Prérequis :** Node.js >= 18, Expo Go installé sur le téléphone ou un émulateur Android/iOS.

---

## 📁 Structure du Projet

```
al-quran-hafs/
├── app/                    # Écrans (Expo Router)
│   ├── (tabs)/             # Navigation principale
│   │   ├── index.tsx       # Accueil (Ayat du jour)
│   │   ├── surahs.tsx      # Liste des sourates
│   │   ├── favorites.tsx   # Favoris
│   │   └── settings.tsx    # Paramètres
│   └── surah/[id].tsx      # Lecture d'une sourate
├── components/
│   └── AudioPlayer.tsx     # Lecteur audio persistant
├── hooks/
│   ├── usePlayer.tsx       # Contexte global audio
│   ├── useFavorites.ts     # Gestion des favoris
│   └── useTheme.tsx        # Gestion du thème
├── services/
│   ├── quranApi.ts         # Appels API Coran
│   └── audioCacheService.ts# Cache et téléchargement audio
├── constants/
│   └── reciters.ts         # Liste des récitateurs
└── assets/                 # Icônes, polices, images
```

---

## 👤 Développeur

Développé par **Boubacar Sow (Artemis99)**  
*Projet personnel — Application coranique dédiée à la communauté muslmane francophone*

---

## 📜 Licence

Ce projet est à usage personnel et éducatif. Le texte coranique est la propriété publique intangible de l'islam. Toute diffusion doit respecter le contenu religieux et son intégrité.
