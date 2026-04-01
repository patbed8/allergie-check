# Checkpoint — Allergie Check

**Date :** 2026-03-31
**Phase en cours :** Phase 2 — MVP mobile (Expo + React Native)
**Statut :** Phase complétée

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée prévus : scan de code-barres (API Open Food Facts) et lecture optique de l'étiquette (OCR, Phase 3).

---

## 2. État d'avancement

### Ce qui est complété

**Phase 1 — Prototype web** (complétée lors de la session précédente)
- Vite + React, logique de détection FR/EN, multi-profils, persistance localStorage, interface bilingue.

**Phase 2 — MVP mobile** (complétée lors de cette session)

- **Scaffolding Expo** : projet `mobile/` créé avec `create-expo-app --template blank`, Expo SDK 54, Node 23 requis (`.nvmrc` inclus).
- **Dépendances installées** : `expo-camera`, `@react-native-async-storage/async-storage`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`.
- **Utilitaires portés** : `allergenDetection.js` étendu avec `getAllergenSynonyms()`, support `allergies` / `intolerances` distincts, et filtre `removeFreeOfClaims()` pour éviter les faux positifs.
- **Hooks AsyncStorage** : `useProfiles.js` (migration auto depuis ancien format `allergens` → `allergies`), `useLanguage.js`, `useRecentScans.js` (10 derniers produits).
- **Navigation** : React Navigation Bottom Tabs — onglet Scanner (défaut) + onglet Profils.
- **ScannerScreen** :
  - Caméra inactive au démarrage — activée seulement sur bouton "Scanner un produit"
  - `CameraView` plein écran pendant le scan, bouton "Annuler"
  - Normalisation UPC-A (12 chiffres) → EAN-13 (13 chiffres)
  - Appel API Open Food Facts, bannière verte/rouge par profil
  - Bannière distingue allergies (rouge ⚠) et intolérances (ambre ⚡)
  - `scanLock` ref pour bloquer les déclenchements multiples
  - Liste des 10 produits récents sur l'écran idle (tap → résultat direct)
  - Boutons "Retour" et "Scanner à nouveau" sur l'écran résultat
- **ProfilesScreen** :
  - Navigation en pile maison : liste principale → Mon profil / Famille → profil individuel
  - Mon profil : nom éditable, allergies (chips rouges) et intolérances (chips ambre) séparées
  - Famille : liste de sélection, ajout/suppression de membres
  - Tap sur un chip → modal affichant tous les synonymes FR + EN de l'ingrédient
  - Toggle FR/EN dans l'en-tête, persisté via AsyncStorage

### Ce qui est en cours

Rien — Phase 2 entièrement complétée.

### Ce qui reste à faire (phases futures)

- **Phase 3** — OCR : photo de l'étiquette → Google ML Kit Text Recognition → détection sur texte extrait.
- **Phase 4** — Claude API pour détection sémantique, Supabase sync multi-appareils, soumission App Store / Google Play.

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Node 23 requis (`.nvmrc`) | Expo SDK 54 requiert Node ≥ 20 ; Metro utilise `toReversed()` qui nécessite Node 20+. Node 14/18 causaient des erreurs de syntaxe au démarrage. |
| `expo-camera` (pas `expo-barcode-scanner`) | `expo-barcode-scanner` déprécié depuis SDK 50 ; `CameraView` + `onBarcodeScanned` est l'API officielle actuelle. |
| `scanLock` ref (pas seulement state) | `onBarcodeScanned` se déclenche plusieurs fois avant le re-rendu React ; un `ref` bloque les appels en double de façon synchrone contrairement au state. |
| Caméra inactive au démarrage | UX : la caméra ne doit pas tourner en permanence, seulement lors d'un scan intentionnel. |
| Stack maison dans ProfilesScreen | Navigation imbriquée dans un seul onglet sans créer un `Stack.Navigator` React Navigation — évite la complexité pour 2-3 niveaux de profondeur. |
| Migration `allergens` → `allergies` | Les anciens profils Phase 1 (format `allergens: []`) sont normalisés automatiquement au chargement AsyncStorage vers `allergies: []` + `intolerances: []`. |
| `removeFreeOfClaims` sur texte seulement | Les expressions "X-free" dans le texte d'ingrédients causaient des faux positifs. Les `allergens_tags` OFF sont structurés et fiables — ne pas les filtrer. |
| `useRecentScans` stocke `productData` partiel | Seulement les champs nécessaires à l'affichage résultat sont stockés (pas l'objet produit entier), pour limiter la taille AsyncStorage. |
| `--tunnel` pour Expo Go | `npx expo start --tunnel` (avec `@expo/ngrok`) requis si le téléphone et le Mac ne sont pas sur le même réseau. |

---

## 4. Fichiers importants du projet

### Structure `mobile/`

```
mobile/
├── .nvmrc                          Node 23 requis
├── App.js                          Navigation shell (Bottom Tabs)
├── app.json                        Config Expo + plugin expo-camera (permission iOS)
├── src/
│   ├── components/
│   │   ├── ScannerScreen.jsx       Écran scanner + résultats + produits récents
│   │   └── ProfilesScreen.jsx      Profils avec navigation en pile, modal synonymes
│   ├── hooks/
│   │   ├── useProfiles.js          CRUD profils + migration, AsyncStorage
│   │   ├── useLanguage.js          Toggle FR/EN persisté
│   │   └── useRecentScans.js       10 derniers produits scannés, AsyncStorage
│   └── utils/
│       └── allergenDetection.js    Détection allergies/intolérances, synonymes, filtre faux positifs
```

### Hérité de Phase 1 (`web/`)

| Fichier | Rôle |
|---|---|
| `web/src/utils/allergenDetection.js` | Source originale portée dans `mobile/` |
| `web/src/hooks/useProfiles.js` | Source originale portée dans `mobile/` |
| `web/src/components/BarcodeInput.jsx` | Logique API OFF + normalisation UPC-A portée dans ScannerScreen |
| `web/src/components/ProfilesPage.jsx` | Interface profils portée dans ProfilesScreen |

### Références externes

- API Open Food Facts : `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- Expo Camera : https://docs.expo.dev/versions/latest/sdk/camera/
- AsyncStorage : https://react-native-async-storage.github.io/async-storage/
- React Navigation Bottom Tabs : https://reactnavigation.org/docs/bottom-tab-navigator
- Google ML Kit Text Recognition (Phase 3) : https://developers.google.com/ml-kit/vision/text-recognition

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| `SyntaxError: Unexpected token '??='` au démarrage | Node 14 trop ancien pour `create-expo-app`. Créé `.nvmrc` avec Node 23, lancer via `source ~/.nvm/nvm.sh && nvm use`. |
| `TypeError: configs.toReversed is not a function` | Node 18 insuffisant pour Metro. `.nvmrc` mis à jour vers Node 23. |
| `CommandError: Cannot read properties of undefined (reading 'body')` avec `--tunnel` | `@expo/ngrok` non installé. Résolu avec `npm install -g @expo/ngrok@^4.0.0`. |
| `press i` ne lance pas le simulateur iOS | Simulateurs disponibles tous sous iOS 26.4 (beta), incompatible avec Expo Go. Contournement : `open -a Simulator` manuellement, puis `i` dans le terminal Expo. |
| Faux positifs "Network error" au scan (scan réussi juste après) | `onBarcodeScanned` déclenché plusieurs fois avant le re-rendu React. Résolu avec un `scanLock` ref mis à `true` au premier appel. |
| Faux positifs allergènes sur mentions "X-free" dans le texte | Ajout de `removeFreeOfClaims()` appliqué sur `ingredientsText` avant détection. |

---

## 6. Problèmes non résolus et obstacles connus

- **iOS Simulator + Expo SDK 54** : les simulateurs disponibles sur ce Mac sont sous iOS 26.4 (beta). Expo Go n'est pas encore compatible. Les tests se font sur appareil physique via Expo Go + tunnel.
- **Couverture OFF incomplète** : certains produits locaux québécois absents de la base Open Food Facts. La Phase 3 (OCR) compensera cette limite.
- **Détection lexicale limitée** : la détection par mots-clés peut manquer des formulations inhabituelles. La Phase 4 (Claude API sémantique) apportera une détection plus robuste.

---

## 7. Point de reprise

**Prochaine étape : Phase 3 — OCR (lecture d'étiquette par photo)**

Objectif : permettre à l'utilisateur de photographier l'étiquette d'un produit (quand il n'y a pas de code-barres, ou que le produit n'est pas dans OFF) et d'extraire le texte pour y appliquer la détection d'allergènes.

Stack prévu :
- `expo-image-picker` pour capturer ou sélectionner une photo depuis la galerie
- `@react-native-ml-kit/text-recognition` (Google ML Kit) pour l'OCR
- Réutilisation directe de `detectAllProfiles()` depuis `allergenDetection.js` — le texte extrait remplace `ingredientsText`, `allergenTags` = `[]`

Intégration dans `ScannerScreen.jsx` : un second bouton "Photographier l'étiquette" sur l'écran idle, menant à un flux OCR séparé qui affiche le même composant de résultats que le flux barcode.

---

## 8. Notes libres

- Code, commentaires, noms de fichiers : **anglais uniquement**. Messages UI : **bilingues FR/EN**.
- Environnement de dev : macOS, VS Code + Claude Code, Node 23 via nvm.
- Tests effectués sur iPhone physique via Expo Go + tunnel ngrok.
- Barcode de test confirmé fonctionnel : `063211311051`.
- Structure de données profils en AsyncStorage (format Phase 2) :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergies": ["arachides", "gluten"], "intolerances": ["lactose"] },
    { "id": "def456", "name": "Ma femme", "allergies": ["noix"], "intolerances": [] }
  ]
  ```
- Le fichier de checkpoint doit être déposé dans `_context/` du repo ET dans les fichiers du Projet Claude.
