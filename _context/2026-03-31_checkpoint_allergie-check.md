# Checkpoint — Allergie Check

**Date :** 2026-03-31
**Phase en cours :** Phase 1 — Prototype web (validation de la logique)
**Statut :** En cours

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure des profils d'allergies (un par membre de la famille), puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée prévus : scan de code-barres (API Open Food Facts) et lecture optique de l'étiquette (OCR).

---

## 2. État d'avancement

### Ce qui est complété

- **Étape 1 — Repo GitHub** : repo `allergie-check` créé, README, `.gitignore`, structure de dossiers.
- **Étape 2 — Initialisation Vite + React** : projet scaffoldé dans `web/`, démarrage confirmé sur port 5173.
- **Étape 3 — Intégration API Open Food Facts** : saisie manuelle d'un code-barres, normalisation UPC-A (12 chiffres) → EAN-13 (13 chiffres), affichage du nom du produit, des ingrédients et des allergènes déclarés. Gestion des erreurs (introuvable, réseau).
- **Étape 4 — Profil d'allergies** : hook `useProfiles` avec persistance `localStorage`, plusieurs profils (nom + liste d'allergènes), ajout/suppression d'allergènes et de profils.
- **Étape 5 — Logique de détection** : dictionnaire de synonymes FR/EN (15 familles d'allergènes), détection dans le texte d'ingrédients et les tags OFF, résultats groupés par profil.
- **Étape 6 — Interface résultat + polish** : bannière verte ✓ / rouge ✕ par profil, navigation deux pages (Profil / Scanner), sélecteur de langue FR/EN sur la page Profil, persistance de la langue en `localStorage`.

### Ce qui est en cours

Phase 1 complétée dans ses grandes lignes. Aucune tâche en cours au moment du checkpoint.

### Ce qui reste à faire dans la phase en cours

La Phase 1 est fonctionnellement complète. Un nettoyage final optionnel pourrait inclure :
- Tests manuels complets sur Codespaces
- Vérification de la couverture des synonymes avec des produits réels variés

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| Navigation par état (`page`) sans React Router | Suffisant pour 2 pages, évite une dépendance supplémentaire avant Phase 2 |
| Plusieurs profils avec détection simultanée (option A) | Plus pratique à l'épicerie : un seul scan détecte les allergènes de toute la famille |
| Normalisation UPC-A → EAN-13 côté client | OFF indexe les produits en EAN-13 ; les codes à 12 chiffres scannés doivent être convertis |
| Langue persistée en `localStorage` | L'utilisateur ne devrait pas avoir à rechoisir sa langue à chaque visite |
| Profils persistés en `localStorage` (structure JSON) | Simple, local, sans backend — cohérent avec la stratégie MVP |
| `_context/` déplacé à la racine du repo | Meilleure accessibilité depuis Claude Code (VS Code) |

---

## 4. Fichiers importants du projet

### Créés lors de ce projet

| Fichier | Rôle |
|---|---|
| `web/src/App.jsx` | Composant racine : navigation Profil/Scanner, état lang, useProfiles |
| `web/src/App.css` | Styles globaux de l'application |
| `web/src/hooks/useProfiles.js` | Hook custom : gestion multi-profils + persistance localStorage |
| `web/src/components/ProfilesPage.jsx` | Page Profil : sélecteur langue, cartes profil, ajout/suppression |
| `web/src/components/BarcodeInput.jsx` | Page Scanner : saisie code-barres, appel API OFF, affichage résultat + bannière détection |
| `web/src/utils/allergenDetection.js` | Dictionnaire FR/EN de synonymes + fonctions de détection mono et multi-profils |

### Fournis par l'utilisateur

| Fichier | Rôle |
|---|---|
| `_context/modele-checkpoint-projet-dev.md` | Modèle de checkpoint à suivre |
| `_context/2026-03-28_idee_app-allergenes.md` | Analyse complète du projet : faisabilité, stack, plan de développement |
| `_context/2026-03-30_checkpoint_allergie-check.md` | Checkpoint précédent |

### Références externes

- API Open Food Facts : https://world.openfoodfacts.org/data
- Documentation Expo : https://docs.expo.dev
- Google ML Kit — Text Recognition : https://developers.google.com/ml-kit/vision/text-recognition
- Supabase : https://supabase.com/docs

---

## 5. Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Code-barres `059749979452` retournait "introuvable" | Produit absent de la base OFF. Normalisation UPC-A → EAN-13 ajoutée (padding 12 → 13 chiffres), validée avec `063211311051`. |

---

## 6. Problèmes non résolus et obstacles connus

- La couverture d'Open Food Facts est incomplète pour certains produits locaux québécois — le mode OCR (Phase 3) compensera cette limite.
- Aucun mécanisme de migration des données `localStorage` si la structure des profils évolue en Phase 2.

---

## 7. Point de reprise

**Phase 1 complétée. Prochaine étape : Phase 2 — Application mobile Expo (MVP mobile).**

Initialiser un projet Expo dans un dossier `mobile/` à la racine du repo :

```bash
npx create-expo-app mobile --template blank
```

Étapes de la Phase 2 :
1. Initialisation du projet Expo dans `mobile/`
2. Intégration du scan de code-barres en temps réel (`expo-barcode-scanner` ou `expo-camera`)
3. Port de la logique de détection depuis `web/src/utils/allergenDetection.js`
4. Port du hook `useProfiles` (remplacer `localStorage` par `AsyncStorage`)
5. Interface mobile avec alerte visuelle verte/rouge
6. Test sur simulateur et appareil physique (via `npx expo start --tunnel` depuis Codespaces)

---

## 8. Notes libres

- L'utilisateur travaille principalement via GitHub Codespaces et Claude Code (VS Code).
- Pour tester Expo depuis Codespaces, utiliser `npx expo start --tunnel` et scanner le QR code avec l'app Expo Go sur mobile.
- Le code, les commentaires, les noms de fichiers et de dossiers sont en anglais.
- L'interface utilisateur est bilingue FR/EN avec bascule persistée.
- Structure de données profils en `localStorage` :
  ```json
  [
    { "id": "abc123", "name": "Moi", "allergens": ["arachides", "gluten"] },
    { "id": "def456", "name": "Ma femme", "allergens": ["lait"] }
  ]
  ```
- Le fichier de checkpoint doit être déposé dans `_context/` du repo ET dans les fichiers du Projet Claude.
