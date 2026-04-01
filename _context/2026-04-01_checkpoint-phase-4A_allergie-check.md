# Checkpoint — Allergie Check

**Date :** 2026-04-01
**Phase en cours :** Phase 4A — Build natif + OCR ML Kit + IA on-device + Supabase
**Statut :** Phase complétée

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée : scan de code-barres (API Open Food Facts) et photo d'étiquette (ML Kit OCR + détection sémantique Apple Intelligence).

---

## 2. État d'avancement

### Ce qui est complété

**Phase 1 — Prototype web** (complétée)
- Vite + React, logique de détection FR/EN, multi-profils, persistance localStorage.

**Phase 2 — MVP mobile** (complétée)
- Expo SDK 54, scan code-barres, API Open Food Facts, multi-profils AsyncStorage, navigation Bottom Tabs.

**Phase 3 — Infrastructure OCR** (infrastructure livrée, ML Kit inopérant dans Expo Go)
- `expo-image-picker`, `useOCR.js`, bouton OCR dans `ScannerScreen.jsx`, `source` dans `useRecentScans.js`.

**Phase 4A — Build natif + OCR + IA on-device + Supabase** (complétée lors de cette session)

- **Build natif (expo prebuild + Xcode)** :
  - `expo-dev-client@~6.0.20` installé (version SDK 54 compatible).
  - `expo-build-properties@~1.0.10` installé pour le deployment target Xcode.
  - Plugin custom `plugins/withPodfileDeploymentTarget.js` pour patcher la ligne `platform :ios` du Podfile (nécessaire car `expo-build-properties` ne met à jour que le projet Xcode, pas le Podfile).
  - iOS deployment target : 15.5 (requis par `@react-native-ml-kit/text-recognition`).
  - Bundle identifier : `com.patbed8.allergiecheck`.
  - `name` / `slug` renommés `"Allergie Check"` / `"allergie-check"`.
  - Workflow : `npx expo prebuild --platform ios` → Xcode → build sur iPhone physique.
  - Serveur dev : `npx expo start --dev-client --tunnel`.

- **OCR ML Kit** (`@react-native-ml-kit/text-recognition@^2.0.0`) :
  - Fonctionne dans le dev build (modules natifs liés).
  - `useOCR.js` : `extractTextFromImage()` utilise `result.blocks` (pas `result.text`).
  - `analyzeLabel(uri, profiles)` : pipeline complet OCR → détection mots-clés → IA on-device.

- **IA on-device — Apple Intelligence** (`react-native-apple-llm@^1.0.16`) :
  - `src/utils/onDeviceAI.js` : `getOnDeviceAIProvider()`, `analyzeWithAppleIntelligence()`, `mergeWithAIFindings()`.
  - Résultats IA affichés avec badge 🤖 dans `DetectionBanner` (labels `alertAIAllergies` / `alertAIIntolerances`).
  - Détection IA **additive** — ne remplace pas les mots-clés, ajoute les dérivés manqués.
  - Chemin Android (Gemini Nano) retiré : `rn-on-device-ai` n'existe pas sur npm et Metro ne tolère pas les `require()` non résolus même dans un `try/catch`.

- **Supabase sync** (`@supabase/supabase-js@^2.x`) :
  - `src/utils/supabase.js` : client, `getDeviceId()` (UUID persisté en AsyncStorage), `fetchProfilesFromSupabase()`, `saveProfilesToSupabase()`.
  - `useProfiles.js` : charge le cache local en premier (instantané), puis tire Supabase en arrière-plan et rafraîchit. Sauvegarde dans AsyncStorage + Supabase à chaque modification (last-write-wins, sans auth).
  - Configurer via `.env` à la racine de `mobile/` (non commité).

### Ce qui est en cours

Rien — Phase 4A entièrement complétée et testée sur iPhone physique.

### Ce qui reste à faire (phases futures)

- **Android** : identifier un package Gemini Nano stable et réactiver le chemin `analyzeWithGeminiNano()` dans `onDeviceAI.js`.
- **Phase 4B (optionnel)** : historique détaillé des scans, authentification Supabase (email / magic link), publication App Store / Google Play.

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Abandon de `expo run:ios` | Instable dans cet environnement ; remplacé par `expo prebuild` + build Xcode direct. |
| `ios/` non commité | Ajouté dans `.gitignore` (`/ios`). Regénérer avec `npx expo prebuild --platform ios` après tout changement de module natif ou `app.json`. |
| Plugin custom `withPodfileDeploymentTarget.js` | `expo-build-properties` ne modifie pas la ligne `platform :ios` du Podfile lue par CocoaPods — le plugin la patche directement. |
| iOS deployment target 15.5 | Minimum requis par `@react-native-ml-kit/text-recognition@2.0.0`. |
| Retrait de `rn-on-device-ai` | N'existe pas sur npm. Metro résout les `require()` statiquement même dans `try/catch`, provoquant une erreur de bundle. |
| `expo-dev-client ~6.0.20` | `npm install` installait `^55.x` (SDK 55) — corrigé en épinglant la version SDK 54 via `bundledNativeModules.json`. |
| `expo-build-properties ~1.0.10` | Même problème de version — corrigé de la même façon. |
| `analyzeLabel()` dans `useOCR.js` | Pipeline OCR + mots-clés + IA en un seul appel, résultats pré-calculés passés à `ProductResult` via `precomputedResults`. |

---

## 4. Fichiers importants du projet

### Structure `mobile/`

```
mobile/
├── .nvmrc                              Node 23 requis (sur Mac avec nvm)
├── app.json                            Config Expo — name, slug, plugins, bundleIdentifier, deploymentTarget
├── plugins/
│   └── withPodfileDeploymentTarget.js  Plugin custom — patch platform :ios dans le Podfile
├── src/
│   ├── components/
│   │   ├── ScannerScreen.jsx           Scanner + OCR + résultats + badge IA + produits récents
│   │   └── ProfilesScreen.jsx          Profils multi, modal synonymes
│   ├── hooks/
│   │   ├── useProfiles.js              CRUD profils + sync Supabase
│   │   ├── useLanguage.js              Toggle FR/EN persisté
│   │   ├── useRecentScans.js           10 derniers scans, champ source barcode/ocr
│   │   └── useOCR.js                   pickImageFromCamera, extractTextFromImage, analyzeLabel
│   └── utils/
│       ├── allergenDetection.js        Détection mots-clés FR/EN, synonymes, filtre faux positifs
│       ├── onDeviceAI.js               Apple Intelligence — getOnDeviceAIProvider, analyzeWithAppleIntelligence, mergeWithAIFindings
│       └── supabase.js                 Client Supabase, getDeviceId, fetch/save profils
```

### Références externes

- API Open Food Facts : `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- Expo Camera : https://docs.expo.dev/versions/latest/sdk/camera/
- Expo Image Picker : https://docs.expo.dev/versions/latest/sdk/imagepicker/
- ML Kit Text Recognition : https://github.com/a0viedo/react-native-ml-kit
- Apple LLM (Foundation Models) : https://github.com/daemontus/react-native-apple-llm
- Supabase : https://supabase.com/docs

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| `expo run:ios` instable (pod install, code signing, build timeout) | Abandon au profit de `expo prebuild` + build Xcode direct. |
| `expo-dev-client`, `expo-build-properties`, `expo-image-picker` : mauvaises versions (SDK 55) installées par `npm install` | Versions correctes lues dans `bundledNativeModules.json` et épinglées manuellement. |
| `expo-build-properties` ne modifie pas le Podfile | Plugin custom `withPodfileDeploymentTarget.js` patch la ligne `platform :ios` directement. |
| `rn-on-device-ai` : bundle error (Metro résout require statiquement) | Chemin Android retiré entièrement — ne peut pas utiliser `require()` pour un package absent. |
| `ngrok tunnel` : `Cannot read properties of undefined (reading 'body')` | `npm install -g @expo/ngrok@^4.1.0` requis sur le Mac du développeur. |
| `AllergieCheck.xcworkspace` introuvable | `rm -rf ios` requis avant chaque `npx expo prebuild --platform ios` si le dossier existe déjà. |

---

## 6. Problèmes non résolus et obstacles connus

- **Android / Gemini Nano** : aucun package npm stable identifié pour l'IA on-device Android. Le chemin est prévu dans l'architecture mais non implémenté.
- **Apple Intelligence** : disponible uniquement sur iPhone 15 Pro / 16 series, iOS 26+, avec Apple Intelligence activé (Réglages → Apple Intelligence & Siri). Sur les autres appareils, la détection se limite aux mots-clés.
- **Supabase** : non configuré par défaut — requiert un projet Supabase et un fichier `.env`.

---

## 7. Point de reprise

**Prochaine étape : Phase 4B ou publication**

Options :
- **Configurer Supabase** : créer un projet sur supabase.com, créer la table `profiles`, ajouter `.env` dans `mobile/`.
  ```sql
  create table profiles (
    device_id uuid primary key,
    data jsonb not null,
    updated_at timestamptz default now()
  );
  ```
  Variables d'environnement dans `mobile/.env` :
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
  ```
- **Publication App Store** : icône finale, captures d'écran, politique de confidentialité, soumission via Xcode / Transporter.
- **Android** : configurer le build Android (`npx expo prebuild --platform android`) si nécessaire.

---

## 8. Notes libres

- Code, commentaires, noms de fichiers : **anglais uniquement**. Messages UI : **bilingues FR/EN**.
- Workflow de développement établi :
  1. Changements JS/JSX → hot reload automatique, aucun rebuild nécessaire.
  2. Nouveau module natif ou changement `app.json` → `rm -rf ios && npx expo prebuild --platform ios` → rebuild Xcode.
  3. Lancer le serveur : `npx expo start --dev-client --tunnel` (depuis `mobile/`).
- Tests effectués sur iPhone physique (dev build, pas Expo Go).
- Barcode de test confirmé fonctionnel : `063211311051`.
- Structure de données profils AsyncStorage :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergies": ["arachides", "gluten"], "intolerances": ["lactose"] },
    { "id": "def456", "name": "Ma femme", "allergies": ["noix"], "intolerances": [] }
  ]
  ```
- Le fichier de checkpoint doit être déposé dans `_context/` du repo ET dans les fichiers du Projet Claude.
