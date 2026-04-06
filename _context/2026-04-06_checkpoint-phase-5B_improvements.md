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

2. **Correction faux positifs — composés** — Regex patterns tolérants aux typos OCR pour neutraliser les expressions composées. Ex: `pommes de terre` (y compris `POMMES DE IERRE`) → `_POTATO_`. 11 patterns couvrent : pommes de terre, beurre de cacao, beurre de karité, crème de cacao, lait de coco, crème de coco (FR+EN).

3. **Correction faux positifs — "sans X" / "X-free"** — `removeFreeOfClaims` réécrit pour retirer le **segment complet entre virgules** contenant "sans X", "X-free", ou "free of X". Corrige le cas "avoine sans gluten" où l'ancienne version retirait seulement "sans gluten" mais laissait "avoine" (synonyme gluten) triggerer une fausse alerte.

4. **Architecture détection : keywords first + AI additive** — Les mots-clés (14 familles de synonymes FR/EN) s'exécutent TOUJOURS en premier (détection fiable). Apple Intelligence s'ajoute par-dessus sans jamais supprimer les résultats des mots-clés. Méthode unifiée `runDetection()`.

5. **Correction flash/disparition des alertes** — Dans `openRecentScan`, suppression complète du bloc `Task { runDetection }` qui relançait l'IA. Seul `detectAllProfiles()` (mots-clés synchrones) est conservé — l'IA a déjà tourné lors du scan initial.

6. **Prompt IA amélioré** — Instructions détaillées avec result builder `Instructions { }` (au lieu d'un `String` brut qui ne se transmettait pas). Exemples explicites de quoi ne PAS flagger ("avoine sans gluten", "lait de coco", "beurre de cacao") et quoi flagger ("farine de blé", "lait écrémé").

7. **Filtre anti-hallucination IA** — Après parsing JSON, chaque allergène retourné par l'IA est corroboré contre le texte nettoyé (`removeFreeOfClaims` + `neutralizeCompounds`). Un allergène n'est accepté que si son nom ou un synonyme (via `getKeywords`) apparaît dans le texte nettoyé.

8. **Stripping markdown réponse IA** — L'IA répond parfois avec ` ```json ... ``` `. Le code strip maintenant les code fences avant le parsing JSON.

9. **Print debug IA avec barcode** — `print("🤖 AI response [BARCODE]: ...")` pour identifier quel produit cause un problème. Affiche "ocr" pour les scans photo.

10. **OCR : stockage photo comme preuve** — La photo capturée lors d'un scan OCR est conservée dans `ocrCapturedImage` et affichée dans une section repliable `OCRPhotoSection`.

11. **OCR : extraction ingrédients seulement** — Prompt IA strict dans `extractIngredientsFromOCR` + fallback par mots-clés (`extractIngredientsKeyword`) quand l'IA n'est pas disponible.

12. **Profils : swipe-to-delete** — Remplacement du bouton poubelle par `.swipeActions` dans FamilyListView et dans les listes d'allergies/intolérances.

13. **Profils : affichage liste** — Remplacement des tags/chips par une `List` avec sections (⛔️ Allergies, ⚠️ Intolérances), icônes distinctes, swipe-to-delete sur chaque item.

### Ce qui reste à faire

- Affiner davantage l'extraction OCR (prompt ou post-traitement)
- Tests unitaires pour la neutralisation des composés et la détection
- Retirer le `print` debug IA une fois le comportement validé
- Supabase sync (non porté)
- App Store (icône, captures, soumission)
- Polish UI (animations, dark mode, accessibilité)

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Regex-based compound neutralization | Les chaînes exactes ne gèrent pas les typos OCR. Les regex avec `\S*erres?` tolèrent les variations. |
| `removeFreeOfClaims` retire le segment complet | Retirer seulement "sans X" laisse l'ingrédient (ex: "avoine") qui peut être un synonyme de l'allergène. Retirer le segment complet entre virgules élimine le faux positif. |
| Keywords ALWAYS first, AI additive | L'IA ne connaît pas nos mappings de synonymes (ex: blé → gluten). Les mots-clés sont fiables et rapides. L'IA ajoute des détections contextuelles supplémentaires. |
| Pas de `Task { AI }` sur scan récent | L'IA a déjà tourné lors du scan initial. La relancer cause un flash visuel et est inutile. |
| `Instructions { }` result builder | Un `String` passé à `LanguageModelSession(instructions:)` ne transmet pas les instructions correctement. Le result builder `Instructions { }` est l'API correcte de FoundationModels. |
| Filtre anti-hallucination post-IA | L'IA peut retourner des allergènes non présents dans le texte. Le filtre corrobore chaque résultat contre le texte nettoyé (mêmes transformations que la détection keywords). |
| Stripping markdown avant JSON parse | L'IA on-device peut envelopper sa réponse dans ` ```json ``` `. Il faut stripper avant `JSONSerialization`. |
| AI extraction + keyword fallback pour OCR | IA pour l'extraction sémantique des ingrédients quand disponible, regex/marqueurs pour les appareils sans Apple Intelligence. |

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
│   ├── AllergenDetection.swift        (215)   14 familles, regex neutralization, removeFreeOfClaims, merge IA
│   ├── OpenFoodFactsService.swift      (34)   API OFF, UPC-A→EAN-13
│   ├── OCRService.swift                (56)   Vision VNRecognizeTextRequest
│   └── OnDeviceAIService.swift        (198)   FoundationModels, extraction OCR, filtre anti-hallucination
├── Stores/
│   ├── ProfileStore.swift              (98)   @Observable, CRUD, UserDefaults
│   └── ScanHistoryStore.swift          (55)   @Observable, max 10 scans
└── Views/
    ├── Scanner/
    │   ├── ScannerView.swift         (1054)   Scanner principal, runDetection, OCR, historique
    │   └── BarcodeScannerView.swift    (139)   AVFoundation caméra
    └── Profiles/
        └── ProfilesView.swift         (499)   Profils, famille, List avec sections
```

**Total : ~2 576 lignes — 12 fichiers Swift**

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Faux positif "pommes de terre" → "pommes" | Neutralisation regex avant détection. Pattern `\bpommes?\s+de\s+\S*erres?\b` → `_POTATO_`. |
| OCR typo "POMMES DE IERRE" pas géré par chaîne exacte | Regex avec `\S*erres?` au lieu de `terre` pour tolérer les variations OCR. |
| Faux positif "avoine sans gluten" → "gluten" | `removeFreeOfClaims` retirait "sans gluten" mais laissait "avoine" (synonyme gluten). Réécrit pour retirer le segment complet entre virgules. |
| IA seule rate les synonymes (blé → gluten) | Architecture changée : keywords toujours en premier, IA additive seulement. |
| Flash d'alerte puis disparition dans scans récents | Supprimé le `Task { AI }` de `openRecentScan` — seuls les mots-clés s'affichent. |
| Instructions IA pas transmises (`String` vs `Instructions`) | Remplacé le multiline `String` par le result builder `Instructions { }` de FoundationModels. |
| IA retourne markdown ` ```json ``` ` | Stripping des code fences avant `JSONSerialization.jsonObject`. |
| IA hallucine des allergènes absents ("fruits de mers") | Filtre post-parsing : corroboration de chaque allergène IA contre le texte nettoyé avec synonymes. |
| OCR extrait trop de texte (pas juste ingrédients) | Prompt IA strict + fallback par marqueurs (`ingrédients:`). Amélioration encore en cours. |

---

## 6. Problèmes non résolus et obstacles connus

- **Extraction OCR encore imparfaite** : Le prompt IA dans `extractIngredientsFromOCR` retourne parfois plus que les ingrédients. Le fallback `extractIngredientsKeyword` dépend de la présence d'un marqueur "ingrédients:" dans le texte OCR.
- **Print debug temporaire** : `print("🤖 AI response [...]")` dans `analyzeWithAppleIntelligence` — à retirer une fois le comportement validé.
- **Warnings non résolus** (pré-existants, non bloquants) :
  - `ScannerView.swift:576` — Cast `String?` to `OCRService.OCRError` always fails
  - `ScannerView.swift:924` — Main actor-isolated property `captureSession` referenced from Sendable closure

---

## 7. Point de reprise

**Prochaine étape : affiner l'extraction OCR des ingrédients**

Le problème actuel : quand l'utilisateur prend une photo d'étiquette, le texte conservé dans le produit contient encore des éléments non-ingrédients.

Pistes d'amélioration :
1. **Affiner le prompt IA** dans `OnDeviceAIService.extractIngredientsFromOCR()` (ligne ~110) — ajouter des exemples few-shot.
2. **Post-traitement** : après l'extraction IA, appliquer `extractIngredientsKeyword` pour valider/recouper.
3. **Combiner les deux** : marqueurs pour borner la zone, IA pour nettoyer.

Fichiers à modifier :
- `OnDeviceAIService.swift` — prompt d'extraction et logique de fallback
- `ScannerView.swift` — `processOCRImage()` (ligne ~548) et `processSupplementOCR()` (ligne ~636)

---

## 8. Architecture de détection (résumé)

```
Scan code-barres:
  API Open Food Facts → ingredientsText + allergenTags
  → removeFreeOfClaims() (retire segments "sans X" / "X-free" entiers)
  → neutralizeCompounds() (pommes de terre → _POTATO_, etc.)
  → keyword detection (14 familles, word-boundary matching)
  → Apple Intelligence additive (si iOS 26+) :
      → prompt avec Instructions { } result builder
      → strip markdown ``` de la réponse
      → parse JSON
      → filtre anti-hallucination (corroboration sur texte nettoyé)
  → mergeWithAIFindings (AI ne supprime jamais de résultats keywords)

Scan OCR photo:
  Vision OCR → rawText
  → extractIngredientsFromOCR (AI) ou extractIngredientsKeyword (fallback)
  → même pipeline que ci-dessus

Ouverture scan récent:
  → detectAllProfiles() seulement (mots-clés synchrones, pas d'IA)
```

---

## 9. Notes libres

- Code et commentaires en **anglais**, UI **bilingue FR/EN**.
- Apple Intelligence disponible sur iPhone 15 Pro+ / iOS 26+ uniquement.
- Barcodes test : `063211311051` (fonctionne), `056210261069` (pommes de terre), `0602652203046` (avoine sans gluten).
- Le `.xcodeproj` est géré via Xcode, pas besoin de XcodeGen pour le moment.
- Les 2 warnings pré-existants ne sont pas bloquants et ne proviennent pas des modifications de cette session.
- `removeFreeOfClaims` split par virgules et drop le segment entier — approche plus robuste que les regex qui retirent seulement la portion "sans X".
