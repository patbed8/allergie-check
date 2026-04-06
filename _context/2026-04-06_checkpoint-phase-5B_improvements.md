# Checkpoint — Allergie Check (Phase 5B — Améliorations)

**Date :** 2026-04-06
**Phase en cours :** Phase 5B — Améliorations UX et détection
**Statut :** En cours

---

## 1. Objectif du projet

Application mobile native SwiftUI permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits (code-barres ou photo d'étiquette) pour obtenir une alerte immédiate.

---

## 2. État d'avancement

### Ce qui est complété (cette session)

1. **Rangée récente fully tappable** — Ajout `.contentShape(Rectangle())` sur les lignes de l'historique des scans pour que toute la surface soit cliquable (ScannerView.swift).

2. **Correction faux positifs allergènes** — Remplacement de la neutralisation par chaînes exactes par des **regex patterns** tolérants aux typos OCR. Ex: `pommes de terre` (y compris la variante OCR `POMMES DE IERRE`) est neutralisé en `_POTATO_` avant la détection par mots-clés. 11 patterns couvrent : pommes de terre, beurre de cacao, beurre de karité, crème de cacao, lait de coco, crème de coco (FR+EN).

3. **Architecture détection : keywords first + AI additive** — Les mots-clés (14 familles de synonymes FR/EN) s'exécutent TOUJOURS en premier (détection fiable). Apple Intelligence s'ajoute par-dessus sans jamais supprimer les résultats des mots-clés. Méthode unifiée `runDetection()`.

4. **Correction flash/disparition des alertes** — Dans `openRecentScan`, les résultats mots-clés sont affichés immédiatement, puis l'IA ajoute ses résultats seulement si `withAI.count >= detectionResults.count` (garde contre le remplacement par des résultats incomplets).

5. **OCR : stockage photo comme preuve** — La photo capturée lors d'un scan OCR est conservée dans `ocrCapturedImage` et affichée dans une section repliable `OCRPhotoSection`.

6. **OCR : extraction ingrédients seulement** — Nouveau prompt IA strict dans `extractIngredientsFromOCR` pour extraire UNIQUEMENT la liste d'ingrédients du texte OCR brut. Fallback par mots-clés (`extractIngredientsKeyword`) quand l'IA n'est pas disponible.

7. **Profils : swipe-to-delete** — Remplacement du bouton poubelle par `.swipeActions` dans la liste des membres de la famille (FamilyListView).

8. **Profils : affichage liste** — Remplacement des tags/chips par une `List` avec sections (⛔️ Allergies, ⚠️ Intolérances), icônes distinctes, swipe-to-delete sur chaque item.

### Ce qui est en cours

- **Extraction OCR des ingrédients** : Le prompt IA a été amélioré mais extrait encore parfois plus que les ingrédients. Nécessite un affinement supplémentaire du prompt ou une approche de post-traitement.

### Ce qui reste à faire

- Affiner davantage l'extraction OCR (prompt ou post-traitement)
- Tests unitaires pour la neutralisation des composés et la détection
- Supabase sync (non porté)
- App Store (icône, captures, soumission)
- Polish UI (animations, dark mode, accessibilité)

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Regex-based compound neutralization | Les chaînes exactes ne gèrent pas les typos OCR. Les regex avec `\S*erres?` tolèrent les variations. |
| Keywords ALWAYS first, AI additive | L'IA ne connaît pas nos mappings de synonymes (ex: blé → gluten). Les mots-clés sont fiables et rapides. L'IA ajoute des détections contextuelles supplémentaires. |
| Guard `withAI.count >= detectionResults.count` | Empêche l'IA d'écraser les résultats mots-clés avec des résultats incomplets (corrige le flash/disparition). |
| AI extraction + keyword fallback pour OCR | IA pour l'extraction sémantique des ingrédients quand disponible, regex/marqueurs pour les appareils sans Apple Intelligence. |
| `NSRegularExpression` avec `.caseInsensitive` | Gère les variations de casse dans le texte OCR sans normalisation manuelle. |

---

## 4. Fichiers du projet

### Structure `iosNative/AllergieCheck/`

```
AllergieCheck/
├── Info.plist                                 Config iOS
├── AllergieCheckApp.swift              (50)   @main, TabView, stores
├── Localization.swift                 (102)   Labels FR/EN, formatDate(), ocrPhotoTitle
├── Models/
│   └── Models.swift                    (76)   Profile, OFFProduct, ScanResult, DetectionResult
├── Services/
│   ├── AllergenDetection.swift        (212)   14 familles, regex neutralization, merge IA
│   ├── OpenFoodFactsService.swift      (34)   API OFF, UPC-A→EAN-13
│   ├── OCRService.swift                (56)   Vision VNRecognizeTextRequest
│   └── OnDeviceAIService.swift        (153)   FoundationModels, extractIngredientsFromOCR, extractIngredientsKeyword
├── Stores/
│   ├── ProfileStore.swift              (98)   @Observable, CRUD, UserDefaults
│   └── ScanHistoryStore.swift          (55)   @Observable, max 10 scans
└── Views/
    ├── Scanner/
    │   ├── ScannerView.swift         (1062)   Scanner principal, runDetection, OCR, historique
    │   └── BarcodeScannerView.swift    (139)   AVFoundation caméra
    └── Profiles/
        └── ProfilesView.swift         (499)   Profils, famille, List avec sections
```

**Total : ~2 536 lignes — 12 fichiers Swift**

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Faux positif "pommes de terre" → "pommes" | Neutralisation regex avant détection. Pattern `\bpommes?\s+de\s+\S*erres?\b` → `_POTATO_`. |
| OCR typo "POMMES DE IERRE" pas géré par chaîne exacte | Regex avec `\S*erres?` au lieu de `terre` pour tolérer les variations OCR. |
| IA seule rate les synonymes (blé → gluten) | Architecture changée : keywords toujours en premier, IA additive seulement. |
| Flash d'alerte puis disparition dans scans récents | Guard `withAI.count >= detectionResults.count` avant d'écraser les résultats. |
| OCR extrait trop de texte (pas juste ingrédients) | Prompt IA strict + fallback par marqueurs (`ingrédients:`) et section terminale. Amélioration encore en cours. |

---

## 6. Problèmes non résolus et obstacles connus

- **Extraction OCR encore imparfaite** : Le prompt IA dans `extractIngredientsFromOCR` retourne parfois plus que les ingrédients (ex: infos nutritionnelles, avertissements). Le fallback `extractIngredientsKeyword` dépend de la présence d'un marqueur "ingrédients:" dans le texte OCR.
- **Warnings non résolus** (pré-existants, non bloquants) :
  - `ScannerView.swift:574` — Cast `String?` to `OCRService.OCRError` always fails
  - `ScannerView.swift:932` — Main actor-isolated property `captureSession` referenced from Sendable closure

---

## 7. Point de reprise

**Prochaine étape : affiner l'extraction OCR des ingrédients**

Le problème actuel : quand l'utilisateur prend une photo d'étiquette, le texte conservé dans le produit contient encore des éléments non-ingrédients (nom du produit, infos nutritionnelles, etc.).

Pistes d'amélioration :
1. **Affiner le prompt IA** dans `OnDeviceAIService.extractIngredientsFromOCR()` (ligne 76) — être encore plus explicite sur ce qu'il faut exclure, ajouter des exemples few-shot.
2. **Post-traitement** : après l'extraction IA, appliquer `extractIngredientsKeyword` pour valider/recouper le résultat.
3. **Combiner les deux** : utiliser les marqueurs pour borner la zone, puis l'IA pour nettoyer le texte dans cette zone.

Fichiers à modifier :
- `OnDeviceAIService.swift` — prompt d'extraction et logique de fallback
- `ScannerView.swift` — `processOCRImage()` (ligne ~548) et `processSupplementOCR()` (ligne ~636)

---

## 8. Architecture de détection (résumé)

```
Scan code-barres:
  API Open Food Facts → ingredientsText + allergenTags
  → neutralizeCompounds() → keyword detection (14 familles)
  → Apple Intelligence additive (si iOS 26+)
  → merge results (AI ne supprime jamais de résultats keywords)

Scan OCR photo:
  Vision OCR → rawText
  → extractIngredientsFromOCR (AI) ou extractIngredientsKeyword (fallback)
  → neutralizeCompounds() → keyword detection
  → Apple Intelligence additive (si iOS 26+)
  → merge results

Ouverture scan récent:
  → keyword detection immédiate (affichage instantané)
  → Task { AI additive } (guard: ne remplace que si count >=)
```

---

## 9. Notes libres

- Code et commentaires en **anglais**, UI **bilingue FR/EN**.
- Apple Intelligence disponible sur iPhone 15 Pro+ / iOS 26+ uniquement.
- Barcode test : `063211311051` (fonctionne), `056210261069` (pommes de terre, utilisé pour tester faux positifs).
- Le `.xcodeproj` est géré via Xcode, pas besoin de XcodeGen pour le moment.
- Les 2 warnings pré-existants ne sont pas bloquants et ne proviennent pas des modifications de cette session.
