# Checkpoint — Allergie Check

**Date :** 2026-04-01
**Phase en cours :** Phase 4 — Détection intelligente (Claude API)
**Statut :** En cours

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée prévus : scan de code-barres (API Open Food Facts) et analyse d'étiquette par photo (Claude API, Phase 4).

---

## 2. État d'avancement

### Ce qui est complété

**Phase 1 — Prototype web** (complétée)
- Vite + React, logique de détection FR/EN, multi-profils, persistance localStorage, interface bilingue.

**Phase 2 — MVP mobile** (complétée)
- Expo SDK 54, scan code-barres avec `expo-camera`, API Open Food Facts, multi-profils AsyncStorage, navigation Bottom Tabs, détection FR/EN avec synonymes et filtre faux positifs.

**Phase 3 — OCR : infrastructure partiellement complétée, puis abandonnée**

Ce qui a été livré :
- `expo-image-picker` (~17.0.10) installé et configuré dans `app.json` (permissions iOS/Android).
- `useOCR.js` créé : `pickImageFromCamera()` via `expo-image-picker`, `extractTextFromImage()` via `@react-native-ml-kit/text-recognition`, gestion des erreurs (`permission_denied`, `empty_text`, `ocr_failed`).
- `useRecentScans.js` mis à jour : champ `source: 'barcode' | 'ocr'`, déduplication désactivée pour les scans OCR.
- `ScannerScreen.jsx` mis à jour : `scanMode: null | 'barcode' | 'ocr'`, bouton "Photographier l'étiquette", flux OCR complet avec `ActivityIndicator`, écran d'erreur avec réessai, section repliable "Texte extrait", badge OCR dans les produits récents.

Pourquoi abandonnée :
- `@react-native-ml-kit/text-recognition` utilise des modules natifs (`NativeModules.TextRecognition`) et **n'est pas compatible avec Expo Go** (managed workflow). L'erreur obtenue : `The package doesn't seem to be linked — You are not using Expo managed workflow`.
- Décision : sauter directement à la Phase 4 et utiliser l'API Claude pour l'analyse d'image, qui couvre à la fois la reconnaissance de texte (OCR) et la détection sémantique des allergènes en un seul appel.

### Ce qui est en cours

Phase 4 — Détection intelligente via API Claude : en démarrage.

### Ce qui reste à faire

- **Phase 4** :
  - Remplacer `@react-native-ml-kit/text-recognition` par un appel à l'API Claude avec image encodée en base64.
  - `useOCR.js` : remplacer `extractTextFromImage()` par `analyzeImageWithClaude(uri, profiles)` — envoie l'image + les profils d'allergènes, reçoit directement les allergènes détectés et le texte extrait.
  - Ou approche en deux temps : Claude extrait le texte → `detectAllProfiles()` analyse le texte (réutilise la logique existante).
  - Synchronisation multi-appareils via Supabase (optionnel).
  - Historique des produits scannés (déjà partiellement fait via `useRecentScans`).
  - Publication App Store / Google Play.

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Abandon de `@react-native-ml-kit/text-recognition` | Module natif incompatible avec Expo Go managed workflow ; nécessiterait un development build (Expo run:ios) ou un bare workflow. |
| Phase 4 avant Phase 3 complète | L'API Claude peut faire OCR + détection sémantique en un seul appel — élimine le besoin de ML Kit et couvre les deux objectifs. |
| `expo-image-picker` conservé | Compatible Expo Go, utilisé pour capturer la photo — reste valide pour le flux OCR/Claude. |
| Infrastructure OCR conservée dans le code | `useOCR.js`, les boutons et les états dans `ScannerScreen.jsx` sont déjà en place — il suffit de remplacer le moteur d'analyse. |

---

## 4. Fichiers importants du projet

### Structure `mobile/`

```
mobile/
├── .nvmrc                          Node 23 requis
├── App.js                          Navigation shell (Bottom Tabs)
├── app.json                        Config Expo + plugins expo-camera + expo-image-picker
├── src/
│   ├── components/
│   │   ├── ScannerScreen.jsx       Écran scanner + résultats + OCR + produits récents
│   │   └── ProfilesScreen.jsx      Profils avec navigation en pile, modal synonymes
│   ├── hooks/
│   │   ├── useProfiles.js          CRUD profils + migration, AsyncStorage
│   │   ├── useLanguage.js          Toggle FR/EN persisté
│   │   ├── useRecentScans.js       10 derniers produits, champ source barcode/ocr
│   │   └── useOCR.js               Capture photo + analyse (à remplacer par Claude API)
│   └── utils/
│       └── allergenDetection.js    Détection allergies/intolérances, synonymes, filtre faux positifs
```

### Références externes

- API Open Food Facts : `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- API Claude (Anthropic) : `https://api.anthropic.com/v1/messages`
- Expo Camera : https://docs.expo.dev/versions/latest/sdk/camera/
- Expo Image Picker : https://docs.expo.dev/versions/latest/sdk/imagepicker/
- AsyncStorage : https://react-native-async-storage.github.io/async-storage/

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| `expo-image-picker@^55.0.14` installée (SDK 55) sur SDK 54 | Réinstallation via `npm install expo-image-picker@~17.0.10` (version lue dans `bundledNativeModules.json`). |
| `@react-native-ml-kit/text-recognition` : `NativeModules.TextRecognition` non lié dans Expo Go | Package incompatible avec Expo Go managed workflow. Décision d'utiliser l'API Claude à la place. |
| Tunnel ngrok impossible dans l'environnement de CI | Tests effectués via `npx expo start --tunnel` directement sur le Mac du développeur. |

---

## 6. Problèmes non résolus et obstacles connus

- **`@react-native-ml-kit/text-recognition` toujours dans `package.json`** : la dépendance est encore installée mais inutilisée une fois `useOCR.js` migré vers Claude API. Elle devra être retirée.
- **Clé API Claude** : l'intégration Phase 4 nécessitera une clé `ANTHROPIC_API_KEY`. À stocker de façon sécurisée (variable d'environnement Expo via `expo-constants` ou `app.config.js`).
- **Coût API** : chaque analyse d'image est un appel API payant. À documenter pour l'utilisateur.

---

## 7. Point de reprise

**Prochaine étape : Phase 4 — Remplacer le moteur OCR par l'API Claude**

L'infrastructure du flux OCR est déjà en place dans `ScannerScreen.jsx` et `useOCR.js`. Il faut :

1. **Retirer `@react-native-ml-kit/text-recognition`** de `package.json`.
2. **Modifier `useOCR.js`** : remplacer `extractTextFromImage(uri)` par un appel à l'API Claude Messages avec l'image encodée en base64 (`image/jpeg`). Prompt suggéré : extraire la liste d'ingrédients du texte visible sur l'étiquette et retourner uniquement le texte brut des ingrédients.
3. **Clé API** : lire `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` (préfixe `EXPO_PUBLIC_` pour l'exposer au bundle React Native).
4. **Approche recommandée** : Claude extrait le texte → `detectAllProfiles()` analyse le texte (réutilise la logique de détection existante, cohérence avec le flux barcode).

Exemple d'appel API à implémenter dans `useOCR.js` :
```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        { type: 'text', text: 'Extract only the ingredients list from this food label. Return the plain text of the ingredients only, no commentary.' },
      ],
    }],
  }),
})
```

---

## 8. Notes libres

- Code, commentaires, noms de fichiers : **anglais uniquement**. Messages UI : **bilingues FR/EN**.
- Environnement de dev : macOS, VS Code + Claude Code, Node 23 via nvm.
- Tests effectués sur iPhone physique via Expo Go + `npx expo start --tunnel` (lancé sur le Mac).
- Barcode de test confirmé fonctionnel : `063211311051`.
- Structure de données profils en AsyncStorage :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergies": ["arachides", "gluten"], "intolerances": ["lactose"] },
    { "id": "def456", "name": "Ma femme", "allergies": ["noix"], "intolerances": [] }
  ]
  ```
- Le fichier de checkpoint doit être déposé dans `_context/` du repo ET dans les fichiers du Projet Claude.
