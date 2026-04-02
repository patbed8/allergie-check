# Checkpoint — Allergie Check (Native SwiftUI)

**Date :** 2026-04-02
**Phase en cours :** Phase 5 — App native SwiftUI (remplacement Expo/React Native)
**Statut :** Complétée — build et installation sur iPhone physique confirmés

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée : scan de code-barres (API Open Food Facts) et photo d'étiquette (Vision OCR + détection sémantique Apple Intelligence).

---

## 2. Contexte de cette phase

La Phase 4A utilisait React Native + Expo SDK 54 avec de nombreuses dépendances natives (ML Kit, expo-dev-client, CocoaPods, etc.). Cette phase 5 remplace **entièrement** le stack Expo/React Native par une **app 100% native SwiftUI**, sans dépendance externe. Avantages :

- Zéro dépendance npm / CocoaPods / Pods
- Build instantané dans Xcode (pas de Metro bundler)
- Accès direct aux frameworks Apple (Vision, AVFoundation, FoundationModels)
- App plus légère (~2 Mo vs ~50+ Mo avec Expo)
- Projet généré via XcodeGen (reproductible à partir de `project.yml`)

---

## 3. État d'avancement

### Ce qui est complété

**Phase 5 — App native SwiftUI** (complétée lors de cette session)

- **12 fichiers Swift** portant toute la logique de l'app React Native
- **Scan code-barres** : AVFoundation (EAN-13, EAN-8, UPC-E) avec overlay cadre + bouton annuler + retour haptique
- **OCR photo d'étiquette** : Apple Vision (`VNRecognizeTextRequest`, français + anglais, niveau `.accurate`)
- **Détection allergènes** : 14 familles d'allergènes avec synonymes FR/EN, normalisation des accents, regex word-boundary, retrait des mentions "sans X" / "X-free"
- **Apple Intelligence** : FoundationModels (iOS 26+), détection additive par IA on-device, badge distinctif pour les résultats IA
- **Multi-profils** : "Moi" + membres famille, allergies vs intolérances, CRUD complet, persistance UserDefaults
- **Historique des scans** : 10 derniers scans, dédoublonnage par code-barres
- **UI bilingue FR/EN** : toggle langue dans les profils, ~50+ labels traduits, formatage dates (aujourd'hui/hier/date)
- **Installation iPhone** : testée avec succès après correction Info.plist (clés CFBundle manquantes)

### Ce qui reste à faire (phases futures)

- **Supabase sync** : non porté dans la version native (était dans la version Expo). À ajouter si souhaité.
- **App Store** : icône, captures d'écran, politique de confidentialité, soumission via Xcode / Transporter.
- **Tests unitaires** : ajouter un target de tests avec le framework Testing.
- **Améliorations UI** : animations, dark mode, accessibilité VoiceOver.

---

## 4. Stack technique

| Composant | Technologie |
|---|---|
| UI | SwiftUI (iOS 17+) |
| Scan code-barres | AVFoundation (`AVCaptureMetadataOutput`) |
| OCR | Vision (`VNRecognizeTextRequest`) |
| IA on-device | FoundationModels (`LanguageModelSession`, iOS 26+) |
| Persistance | UserDefaults (JSON encodé) |
| API produits | Open Food Facts (URLSession async/await) |
| Observation | `@Observable` (Swift Observation framework) |
| Génération projet | XcodeGen (`project.yml`) |
| Langage | Swift 6.0 (concurrency : minimal) |
| Cible | iOS 17.0, iPhone uniquement |
| Bundle ID | `com.patbed8.allergiecheck` |

---

## 5. Décisions techniques prises

| Décision | Justification |
|---|---|
| SwiftUI pur (pas UIKit sauf caméra) | Modernité, moins de code, animations natives. UIKit utilisé uniquement pour `AVCaptureSession` et `UIImagePickerController` (pas d'équivalent SwiftUI natif). |
| XcodeGen au lieu de Xcode UI | Fichier `project.yml` versionnable, reproductible, pas de conflits `.pbxproj`. |
| `@Observable` au lieu de `ObservableObject` | API moderne (iOS 17+), pas besoin de `@Published`, tracking automatique des propriétés. |
| UserDefaults au lieu de Core Data | Simplicité pour des profils JSON légers. Suffisant pour < 100 profils. |
| Vision au lieu de ML Kit | Framework Apple natif, pas de dépendance externe, excellent support FR/EN. |
| FoundationModels avec `#if canImport` | Compilation conditionnelle — l'app fonctionne sur iOS 17-25 sans IA, et utilise Apple Intelligence sur iOS 26+. |
| `SWIFT_STRICT_CONCURRENCY: minimal` | Évite les erreurs de concurrency stricte avec AVFoundation delegates tout en gardant Swift 6. |
| `nonisolated` sur le delegate AVCapture | Requis par Swift 6 — le delegate `AVCaptureMetadataOutputObjectsDelegate` est appelé depuis une queue non-main. |
| `GENERATE_INFOPLIST_FILE: NO` | Utilisation d'un Info.plist custom avec toutes les clés CFBundle nécessaires pour l'installation sur device. |

---

## 6. Fichiers du projet

### Structure `iosNative/`

```
iosNative/
├── project.yml                                    XcodeGen — config du projet Xcode
├── AllergieCheck.xcodeproj/                       Généré par xcodegen (ne pas éditer manuellement)
└── AllergieCheck/
    ├── Info.plist                                 Config iOS — bundle ID, permissions caméra
    ├── AllergieCheckApp.swift                     @main entry point, TabView, stores, langue
    ├── Localization.swift                         Labels FR/EN (~50+ strings), formatDate()
    ├── Models/
    │   └── Models.swift                           Profile, OFFProduct, ScanResult, DetectionResult
    ├── Services/
    │   ├── AllergenDetection.swift                14 familles allergènes, synonymes FR/EN, regex, merge IA
    │   ├── OpenFoodFactsService.swift             API OFF, timeout 10s, normalisation UPC-A → EAN-13
    │   ├── OCRService.swift                       Vision VNRecognizeTextRequest, FR+EN, .accurate
    │   └── OnDeviceAIService.swift                FoundationModels iOS 26+, LanguageModelSession
    ├── Stores/
    │   ├── ProfileStore.swift                     @Observable, CRUD profils, UserDefaults
    │   └── ScanHistoryStore.swift                 @Observable, max 10 scans, dédoublonnage
    └── Views/
        ├── Scanner/
        │   ├── ScannerView.swift                  Tab scanner — états idle/barcode/loading/result/error
        │   └── BarcodeScannerView.swift           AVFoundation caméra, EAN-13/8, UPC-E
        └── Profiles/
            └── ProfilesView.swift                 NavigationStack, profil perso + famille, synonymes
```

### Taille du code

| Fichier | Lignes | Rôle |
|---|---|---|
| Models.swift | 77 | Modèles de données |
| AllergenDetection.swift | 176 | Moteur de détection allergènes |
| OpenFoodFactsService.swift | 35 | Client API Open Food Facts |
| OCRService.swift | 57 | OCR Vision framework |
| OnDeviceAIService.swift | 78 | Apple Intelligence |
| ProfileStore.swift | 99 | Store profils + persistance |
| ScanHistoryStore.swift | 51 | Store historique scans |
| ScannerView.swift | 629 | Vue scanner principale |
| BarcodeScannerView.swift | 140 | Caméra code-barres |
| ProfilesView.swift | 524 | Vue profils + famille |
| AllergieCheckApp.swift | 51 | Point d'entrée app |
| Localization.swift | 100 | Labels bilingues |
| **Total** | **~2 064** | **12 fichiers Swift** |

---

## 7. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| `ProposableSize` introuvable (FlowLayout) | Renommé en `ProposedViewSize` — le type correct du protocole `Layout` de SwiftUI. |
| Swift 6 concurrency : `AVCaptureMetadataOutputObjectsDelegate` isolé sur main actor | Conformance delegate déplacée dans une extension `nonisolated`, dispatch vers main queue pour les mises à jour UI. `SWIFT_STRICT_CONCURRENCY: minimal` dans project.yml. |
| API `Tab("title", systemImage:)` disponible iOS 18+ uniquement | Remplacée par `.tabItem { Label() }` compatible iOS 17. |
| `OpenFoodFactsError` non `Equatable` pour `== .notFound` | Remplacé par `switch` pattern matching sur `catch let offError as OpenFoodFactsError`. |
| Code signing requis pour build simulateur | Ajouté `CODE_SIGNING_ALLOWED=NO` pour les builds CLI xcodebuild. |
| Simulateur iPhone 16 introuvable (Xcode 26) | Listé les simulateurs avec `xcrun simctl list`, utilisé `iPhone 17 Pro`. |
| Installation iPhone : "not a valid bundle" / CFBundleIdentifier manquant | Ajouté les clés standard dans Info.plist : `CFBundleIdentifier`, `CFBundleExecutable`, `CFBundlePackageType`, `CFBundleVersion`, `CFBundleShortVersionString`. Ajouté `GENERATE_INFOPLIST_FILE: NO` dans project.yml. |

---

## 8. Correspondance React Native → SwiftUI

| Fonctionnalité RN/Expo | Équivalent natif Swift |
|---|---|
| `expo-camera` (barcode) | `AVCaptureSession` + `AVCaptureMetadataOutput` |
| `expo-image-picker` | `UIImagePickerController` via `UIViewControllerRepresentable` |
| `@react-native-ml-kit/text-recognition` | `Vision.VNRecognizeTextRequest` |
| `react-native-apple-llm` | `FoundationModels.LanguageModelSession` |
| `AsyncStorage` | `UserDefaults` |
| `@supabase/supabase-js` | Non porté (à ajouter si nécessaire) |
| React Navigation (Bottom Tabs) | SwiftUI `TabView` |
| React Navigation (Stack) | SwiftUI `NavigationStack` + `navigationDestination` |
| `useState` / `useEffect` | `@State` / `.task {}` / `.onChange` |
| `useContext` | `.environment()` |
| `FlatList` | SwiftUI `List` / `ForEach` |
| JS `string.normalize('NFD')` | Swift `string.folding(options: .diacriticInsensitive)` |
| JS `new RegExp('\\b' + word + '\\b')` | Swift `NSRegularExpression("\\b\(word)\\b")` |

---

## 9. Point de reprise

**Prochaine étape : polish et publication**

Pour régénérer le projet Xcode :
```bash
cd iosNative
brew install xcodegen  # si pas déjà installé
xcodegen generate
open AllergieCheck.xcodeproj
```

Pour build sur iPhone :
1. Ouvrir `AllergieCheck.xcodeproj` dans Xcode
2. Configurer le Development Team dans Signing & Capabilities
3. Sélectionner l'iPhone comme destination
4. Cmd+R pour build et run

Options pour la suite :
- **Polish UI** : icône d'app, launch screen, animations, dark mode
- **Supabase sync** : porter `supabase.js` en Swift avec le SDK Supabase Swift
- **Tests** : ajouter un target `AllergieCheckTests` avec le framework Testing
- **App Store** : icône 1024x1024, captures d'écran, fiche App Store Connect, soumission

---

## 10. Notes libres

- Code, commentaires, noms de fichiers : **anglais uniquement**. Messages UI : **bilingues FR/EN**.
- L'app originale React Native reste dans `mobile/` — elle n'est pas supprimée, juste remplacée par `iosNative/`.
- Barcode de test confirmé fonctionnel : `063211311051`.
- Le `.xcodeproj` est généré — ne pas éditer le `.pbxproj` manuellement, modifier `project.yml` et regénérer.
- Structure de données profils UserDefaults (clé `allergie-check-profiles`) :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergies": ["arachides", "gluten"], "intolerances": ["lactose"] },
    { "id": "def456", "name": "Ma femme", "allergies": ["noix"], "intolerances": [] }
  ]
  ```
- Apple Intelligence disponible uniquement sur iPhone 15 Pro / 16 / 17, iOS 26+, avec Apple Intelligence activé. Sur les autres appareils, la détection se limite aux mots-clés.
