# Quran Warsh

Bienvenue — ceci est le dépôt d'une application mobile visant à proposer la lecture et l'écoute
du Saint Coran selon la récitation Warsh. Le ton du projet est sobre et respectueux ; l'application
se concentre sur l'expérience de lecture audio/texte sans traductions intrusives.

Résumé rapide
- Public cible : utilisateurs francophones et arabophones, étudiants en sciences islamiques, fidèles souhaitant la récitation Warsh.
- Plateforme : application mobile (React Native / Expo). Option Web possible ultérieurement.

Ce qui fonctionne aujourd'hui (état réel du code)
- Structure de l'app : fichiers d'entrée `App.js` / `App.jsx`.
- Navigation et écrans : accueil, liste des sourates, détail d'une sourate, recherche, favoris, paramètres.
- Composants visibles : lecteur audio (`AudioPlayer.jsx`), cartes de sourate/verset (`SourateCard.jsx`, `VerseCard.jsx`), barre de recherche (`SearchBar.jsx`), loaders et états vides.
- Contexte global : `AppContext.jsx`, `AudioContext.jsx`, `ThemeContext.jsx` pour partager l'état et les préférences.
- Hooks utiles : récupération des sourates, détails, recherche, gestion des favoris et téléchargement (`useSourates.js`, `useSourateDetail.js`, `useSearch.js`, `useFavorites.js`, `useDownload.js`).
- Services techniques : interface API (`quranAPI.js`), gestion audio (`audioService.js`), téléchargement (`downloadService.js`) et stockage local (`storageService.js`).
- Ressources : polices dans `assets/fonts`, variables couleurs et constantes dans `utils/`.

Notes courtes sur l'état
- Le squelette fonctionnel est en place : UI, hooks, contexts et services existent. Plusieurs comportements doivent être validés et complétés (notamment l'audio Warsh, l'indexation exacte des versets, et le mode hors-ligne).

Priorités immédiates (propositions de priorisation)
- Priorité A — Vérifier le texte et l'API Warsh : s'assurer que `quranAPI.js` renvoie bien le texte en rasm `ʿUthmânî` et la récitation Warsh.
- Priorité A — Audio : lecture par verset, commandes (play/pause, précédent/suivant), sélection du récitateur, boucle.
- Priorité B — Téléchargement / hors-ligne : implémenter la gestion des fichiers audio téléchargés et leur suppression.
- Priorité B — Favoris & reprise automatique : persistance de la position de lecture.
- Priorité C — Recherche améliorée et suggestions automatiques.

Tâches détaillées (roadmap)
- Valider format rasm et découpage par verset/juz/hizb.
- Intégrer au moins un récitant Warsh fiable et prévoir sélection.
- Finaliser `downloadService.js` et `useDownload.js` (tests de taille et résilience réseau).
- Ajouter barre de progression audio et affichage sourate/verset en cours.
- Ajouter réglages d'affichage : taille de police, mode nuit/jour.
- Écrire tests unitaires pour hooks et services critiques.
- Préparer scripts de build Expo pour Android/iOS.

Comment lancer le projet en local (développement)
1. Installer les dépendances :

```bash
npm install
# ou
yarn
```

2. Lancer Expo :

```bash
npx expo start
# ou
yarn start
```

Contribuer
- Créez une issue pour discuter d'une fonctionnalité ou d'un bug.
- Ouvrez une PR ciblée : une fonctionnalité par PR, avec description claire et capture d'écran si besoin.

Fichier modifié : [README.md](README.md)

Souhaitez-vous que je :
- ouvre des issues correspondant aux « Priorité A »,
- ou commence l'implémentation d'une des priorités (précisez laquelle) ?
