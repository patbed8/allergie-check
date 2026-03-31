# Checkpoint — Allergie Check

**Date :** 2026-03-30
**Phase en cours :** Phase 1 — Prototype web (validation de la logique)
**Statut :** En cours

---

## 1. Objectif du projet

Application mobile permettant de détecter rapidement la présence d'allergènes dans un produit alimentaire vendu en épicerie. L'utilisateur configure son profil d'allergies une fois, puis scanne les produits pour obtenir une alerte immédiate. Deux modes d'entrée : scan de code-barres (API Open Food Facts) et lecture optique de l'étiquette (OCR).

---

## 2. État d'avancement

### Ce qui est complété

- **Étape 1 — Repo GitHub** : repo `allergie-check` créé, README en anglais, `.gitignore` adapté Node/React/Expo, structure de dossiers initiale avec dossier `web/` réservé à la Phase 1.
- **Étape 2 — Initialisation Vite + React** : projet Vite + React scaffoldé dans `web/`, template nettoyé (fichiers SVG inutiles supprimés, `App.jsx` / `App.css` / `index.css` épurés), démarrage confirmé sur port 5173 via GitHub Codespaces.

### Ce qui est en cours

Aucune tâche en cours — transition vers Claude Code (VS Code) pour la suite de la Phase 1.

### Ce qui reste à faire dans la phase en cours

- **Étape 3** — Intégration API Open Food Facts : champ de saisie manuelle d'un code-barres, appel API, affichage du nom du produit et de la liste d'ingrédients.
- **Étape 4** — Interface du profil d'allergies : ajout/suppression d'allergènes librement, persistance via `localStorage`.
- **Étape 5** — Logique de détection : comparaison profil ↔ ingrédients, couverture FR + EN.
- **Étape 6** — Interface résultat + polish : affichage clair ✅ / 🚨, détail des allergènes trouvés, nettoyage du code.

---

## 3. Décisions techniques prises

| Décision | Justification |
|---|---|
| README en anglais seulement | Préférence établie par l'utilisateur durant la session |
| Environnement : GitHub Codespaces | L'utilisateur n'a pas toujours accès à son ordinateur — Codespaces permet de travailler depuis n'importe quel appareil |
| Phase 2+ : `npx expo start --tunnel` requis | Pour tester Expo depuis un Codespace, le tunnel est nécessaire pour joindre Expo Go sur mobile |
| Dossier `web/` à la racine | Sépare clairement le prototype web (Phase 1) du futur projet mobile (Phase 2+) |

---

## 4. Fichiers importants du projet

### Créés lors de ce projet

| Fichier | Rôle |
|---|---|
| `README.md` | Documentation principale du repo GitHub |
| `.gitignore` | Exclusions Git adaptées Node / React / Expo |
| `web/` | Dossier du prototype web Vite + React (Phase 1) |
| `web/src/App.jsx` | Composant racine épuré, prêt pour le développement |

### Fournis par l'utilisateur

| Fichier | Rôle |
|---|---|
| `modele-checkpoint-projet-dev.md` | Modèle de checkpoint à suivre pour chaque fin de session |
| `2026-03-28_idee_app-allergenes.md` | Analyse complète du projet : faisabilité, stack, plan de développement |

### Références externes

- API Open Food Facts : https://world.openfoodfacts.org/data
- Documentation Expo : https://docs.expo.dev
- Google ML Kit — Text Recognition : https://developers.google.com/ml-kit/vision/text-recognition
- Supabase : https://supabase.com/docs

---

## 5. Problèmes rencontrés et solutions

Aucun.

---

## 6. Problèmes non résolus et obstacles connus

Aucun pour l'instant. À surveiller lors de la Phase 2 : le test Expo depuis Codespaces nécessite `--tunnel` et une connexion stable.

---

## 7. Point de reprise

**Prochaine étape : Étape 3 — Intégration de l'API Open Food Facts**

Dans `web/src/`, créer un composant `BarcodeInput.jsx` permettant à l'utilisateur de saisir manuellement un code-barres (ex. : `0059749979452`). Au submit, effectuer un appel à l'API Open Food Facts :

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

Afficher dans l'interface :
- Le nom du produit (`product.product_name`)
- La liste d'ingrédients en texte brut (`product.ingredients_text`)
- Les allergènes déclarés (`product.allergens_tags`)

Gérer les cas d'erreur : produit introuvable, réseau indisponible.

---

## 8. Notes libres

- L'utilisateur travaille principalement via GitHub Codespaces et Claude Code (VS Code).
- Les messages d'interface utilisateur doivent être bilingues (français et anglais) dans l'application.
- Le code, les commentaires, les noms de fichiers et de dossiers sont en anglais.
- Le fichier de checkpoint doit être déposé dans le dossier `_context/` du repo de code ET dans les fichiers du Projet Claude.
