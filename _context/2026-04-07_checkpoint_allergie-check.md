# Checkpoint — Allergie Check

**Date :** 2026-04-07
**Phase en cours :** Phase 5C — Distribution TestFlight + iCloud sync
**Statut :** En cours

---

## 1. Objectif du projet

Application mobile native SwiftUI permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils (un par membre de la famille), chaque profil distinguant allergies et intolérances, puis scanne les produits (code-barres ou photo d'étiquette) pour obtenir une alerte immédiate.

---

## 2. État d'avancement

### Ce qui est complété

**Phase 5 — App native SwiftUI** (complétée session précédente)
- 12 fichiers Swift, scan code-barres, OCR Vision, Apple Intelligence, multi-profils, historique, UI bilingue FR/EN, build et installation sur iPhone physique confirmés.

**Phase 5B — Améliorations UX et détection** (complétée session précédente)
- Correction faux positifs composés, `removeFreeOfClaims` amélioré, architecture keywords first + AI additive, filtre anti-hallucination, swipe-to-delete, liste allergènes avec sections.

**Phase 5C — Distribution TestFlight + iCloud sync** (complétée cette session)

- **Icône de l'app** : icône finale choisie par l'utilisateur (bouclier vert + panier d'épicerie + crochet), intégrée dans `Assets.xcassets` dans Xcode.
- **Paramètres General Xcode** : Display Name `Allergie Check`, Version `0.7.0`, Build `1`.
- **Compte Apple Developer** : créé et activé (129 CAD/an), équipe sélectionnée dans Xcode.
- **iCloud Key-Value Storage** :
  - Entitlement `iCloud Key-value storage` activé dans Signing & Capabilities.
  - `ProfileStore.swift` mis à jour : synchronisation via `NSUbiquitousKeyValueStore`, cache local `UserDefaults` conservé pour chargement instantané au démarrage, écoute de `NSUbiquitousKeyValueStoreDidChangeExternallyNotification` pour sync entre appareils du même Apple ID.
  - Fonctionne sans compte utilisateur — utilise l'Apple ID existant de l'iPhone.
- **Premier build TestFlight** : version 0.7.0 (build 1) archivée depuis Xcode, uploadée sur App Store Connect, statut **Prêt à tester**.
- **Groupe TestFlight "Famille"** : créé avec distribution automatique activée, invitations envoyées à la femme et la mère de l'utilisateur par courriel.
- **Description App Store** : rédigée en FR et EN, avec mots-clés, catégories, sous-titre.
- **Politique de confidentialité** : rédigée en FR et EN, conforme à la Loi 25 (Québec) et LPRPDE.

### Ce qui est en cours

Tests utilisateurs en cours — la femme et la mère de l'utilisateur ont reçu l'invitation TestFlight et vont tester l'app.

### Ce qui reste à faire dans la phase en cours

- Recueillir les retours des testeurs et corriger les bugs identifiés
- Affiner l'extraction OCR des ingrédients (point en suspens de la Phase 5B)
- Héberger la politique de confidentialité sur une URL publique (requis pour App Store)
- Préparer les captures d'écran pour la fiche App Store
- Soumission finale sur l'App Store

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| iCloud KV Store plutôt que Supabase | iOS uniquement, données personnelles non partagées entre utilisateurs, aucun backend à gérer, plus sécuritaire (données dans le compte iCloud de l'utilisateur) |
| `NSUbiquitousKeyValueStore` + `UserDefaults` en parallèle | UserDefaults pour chargement instantané au démarrage, iCloud pour sync entre appareils — les deux restent toujours à jour |
| TestFlight interne (pas externe) | Pas de révision Apple requise, disponible immédiatement, suffisant pour 2-3 testeurs familiaux |
| Distribution automatique activée dans le groupe Famille | Chaque nouveau build est automatiquement disponible aux testeurs sans action manuelle |
| Chiffrement déclaré : aucun algorithme personnalisé | L'app utilise uniquement HTTPS et iCloud gérés par Apple — aucun chiffrement propriétaire |

---

## 4. Fichiers importants du projet

### Créés lors de cette session

| Fichier | Rôle |
|---|---|
| `app-store-description.md` | Description App Store bilingue FR/EN avec mots-clés et catégories |
| `privacy-policy.md` | Politique de confidentialité bilingue FR/EN, conforme Loi 25 Québec |

### Modifiés lors de cette session

| Fichier | Modification |
|---|---|
| `ProfileStore.swift` | Ajout sync iCloud KV Store + écoute changements externes |
| `Assets.xcassets` | Ajout icône de l'app (bouclier vert + panier + crochet) |

### Références externes

- App Store Connect : https://appstoreconnect.apple.com
- Apple Developer Program : https://developer.apple.com
- Open Food Facts API : `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- TestFlight (App Store) : https://apps.apple.com/app/testflight/id899247664

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Compte Apple Developer en statut "pending" plusieurs heures | Attente normale — activé après quelques heures. Pendant ce temps, iCloud non disponible dans Signing & Capabilities. |
| `Assets.xcassets` absent du projet (généré via XcodeGen) | Créé manuellement via New File → Asset Catalog dans Xcode |
| Icône non visible immédiatement dans App Store Connect | Normal — délai de quelques minutes après l'upload |
| Chiffrement : question obligatoire avant TestFlight | Répondu "Aucun des algorithmes mentionnés" — correct pour cette app |

---

## 6. Problèmes non résolus et obstacles connus

- **Extraction OCR encore imparfaite** : le prompt IA dans `extractIngredientsFromOCR` retourne parfois plus que les ingrédients. À améliorer dans une prochaine session.
- **Politique de confidentialité non hébergée** : Apple exige une URL publique pour la soumission App Store. À héberger sur GitHub Pages, Notion public, ou équivalent avant la soumission.
- **Print debug temporaire** : `print("🤖 AI response [...]")` dans `analyzeWithAppleIntelligence` — à retirer avant la soumission App Store.
- **Warnings non résolus** (pré-existants, non bloquants) :
  - `ScannerView.swift:576` — Cast `String?` to `OCRService.OCRError` always fails
  - `ScannerView.swift:924` — Main actor-isolated property `captureSession` referenced from Sendable closure
- **iCloud sync** : fonctionne uniquement entre appareils du même Apple ID. Les testeurs (femme, mère) auront leurs propres profils indépendants — c'est le comportement voulu.

---

## 7. Point de reprise

**Prochaine étape : recueillir les retours des tests et corriger les bugs**

Une fois les retours reçus :
1. Corriger les bugs identifiés par les testeurs
2. Améliorer l'extraction OCR dans `OnDeviceAIService.swift` → `extractIngredientsFromOCR()`
3. Retirer le `print` debug dans `analyzeWithAppleIntelligence`
4. Corriger les 2 warnings dans `ScannerView.swift`
5. Héberger la politique de confidentialité sur une URL publique
6. Préparer les captures d'écran App Store (sur iPhone physique)
7. Archiver une nouvelle version → uploader sur TestFlight → soumettre pour l'App Store

Pour un nouveau build TestFlight :
- Incrémenter le **Build number** dans Xcode (General → Build : 2, 3, etc.)
- Product → Archive → Distribute App → TestFlight Internal Only → Upload
- Le groupe Famille reçoit automatiquement le nouveau build

---

## 8. Notes libres

- Code et commentaires en **anglais**, UI **bilingue FR/EN**.
- Apple Intelligence disponible sur iPhone 15 Pro+ / iOS 26+ uniquement. Sur les autres appareils, détection par mots-clés seulement.
- Barcodes test confirmés : `063211311051`, `056210261069` (pommes de terre), `0602652203046` (avoine sans gluten).
- La politique de confidentialité doit être mise à jour avec le vrai courriel de l'utilisateur avant publication (`[VOTRE ADRESSE COURRIEL]`).
- Le nom de l'app dans App Store Connect apparaît comme `AllergieCheck` (sans espace) — à vérifier et corriger si nécessaire dans la fiche App Store.
- Structure de données profils UserDefaults / iCloud KV Store (clé `allergie-check-profiles`) :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergies": ["arachides", "gluten"], "intolerances": ["lactose"] },
    { "id": "def456", "name": "Ma femme", "allergies": ["noix"], "intolerances": [] }
  ]
  ```
- Le fichier de checkpoint doit être déposé dans `_context/` du repo ET dans les fichiers du Projet Claude.
