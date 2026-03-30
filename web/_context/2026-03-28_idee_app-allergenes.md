# Idée d'application — Détecteur d'allergènes alimentaires

**Date d'analyse :** 2026-03-28  
**Statut :** Analyse complète — prêt pour développement

---

## 1. Description de l'idée

Une application mobile permettant à un utilisateur de détecter rapidement la présence d'ingrédients auxquels il est allergique ou intolérant dans un produit alimentaire vendu en épicerie. L'utilisateur configure une fois son profil d'allergies, puis scanne les produits à l'achat pour obtenir une alerte immédiate si un allergène détecté correspond à son profil.

L'application repose sur deux modes d'entrée complémentaires :

1. **Scan du code-barres** : interroge une base de données externe pour récupérer automatiquement la liste d'ingrédients et les allergènes déclarés du produit.
2. **Lecture optique (OCR)** : l'utilisateur photographie directement l'étiquette du produit, et le texte est extrait et analysé pour en déduire les allergènes présents.

---

## 2. Analyse de faisabilité

### Faisabilité globale

Le projet est **entièrement faisable** avec des technologies matures et largement documentées. Chacun des composants principaux s'appuie sur des solutions éprouvées et, pour la plupart, gratuites ou à faible coût.

### Composants techniques

**Base de données produits (Open Food Facts)**  
Open Food Facts est une base de données alimentaires ouverte, gratuite et collaborative. Elle recense plusieurs millions de produits vendus au Canada et à l'international. Son API REST ne nécessite aucune clé d'API pour un usage standard, et sa couverture des produits canadiens est bonne. C'est le pilier du mode scan — fiable, rapide, et sans coût.

**Scan de code-barres**  
Sur mobile, la librairie `expo-barcode-scanner` (Expo / React Native) permet d'accéder à la caméra et de lire les codes-barres UPC-A et EAN-13 en temps réel. L'intégration est simple et fonctionne sur iOS et Android sans configuration native.

**Lecture optique — OCR**  
Deux options viables selon les contraintes :
- **Google ML Kit** (via `@react-native-ml-kit/text-recognition`) : traitement hors ligne, gratuit, performant pour les textes imprimés clairs. Recommandé en première implémentation.
- **Google Cloud Vision API** : traitement en ligne, plus précis pour les étiquettes complexes, mais implique un compte Google Cloud et un coût par requête (niveau gratuit généreux : 1 000 appels/mois).

**Détection des allergènes**  
Une fois le texte des ingrédients obtenu (via API ou OCR), la détection s'effectue par comparaison avec le profil utilisateur. L'implémentation peut évoluer en deux niveaux :
- **Niveau 1 (MVP)** : recherche de mots-clés exacts et variantes communes (ex. : « lait », « lactosérum », « caséine » pour l'allergie au lait).
- **Niveau 2 (évolution)** : analyse via un modèle de langage (appel à l'API Claude) pour une détection plus intelligente des dérivés et des noms scientifiques peu connus.

**Stockage du profil utilisateur**  
Pour le MVP, le profil peut être stocké localement sur l'appareil (AsyncStorage). Pour une version multi-appareils ou avec compte utilisateur, Supabase offre une solution backend légère (base de données PostgreSQL + authentification + API REST) avec un niveau gratuit suffisant pour un projet en développement.

### Points d'attention — contexte québécois

- **Bilinguisme des étiquettes** : les produits vendus au Québec portent des étiquettes en français et en anglais. La logique de détection doit couvrir les deux langues (ex. : « arachides » et « peanuts », « œufs » et « eggs »).
- **Couverture Open Food Facts** : la base de données est bien fournie pour les grandes marques, mais peut être incomplète pour les produits de marques locales ou les épiceries spécialisées. Le mode OCR compense cette limite.

---

## 3. Stack technologique recommandé

| Couche | Technologie | Justification |
|---|---|---|
| Frontend mobile | React Native + Expo | Base de code unique iOS/Android, accès simplifié à la caméra |
| Scan code-barres | expo-barcode-scanner | Natif Expo, simple à intégrer |
| Base de données produits | API Open Food Facts | Gratuit, couverture Canada, pas de clé requise |
| OCR | Google ML Kit (hors ligne) | Gratuit, fonctionne sans connexion |
| Détection intelligente (v2) | API Claude (Anthropic) | Analyse sémantique des dérivés d'allergènes |
| Stockage profil (MVP) | AsyncStorage | Simple, local, aucun backend requis |
| Stockage profil (v2) | Supabase | Gratuit en dev, multi-appareils, auth intégrée |

---

## 4. Plan de développement par phases

> Les estimés de temps supposent un abonnement Claude Pro et une familiarité de base avec JavaScript et React. Ils représentent du temps de travail actif (sessions de développement avec Claude Code), excluant les temps de réflexion, les tests sur appareils physiques et les démarches administratives.

---

### Phase 1 — Prototype web (validation de la logique)

**Complexité :** Faible  
**Durée estimée : 1 à 2 jours**

Avant de s'attaquer aux contraintes mobiles, l'objectif est de valider la logique métier dans une application web React simple. Cela comprend la configuration du projet (Vite), l'intégration de l'API Open Food Facts avec saisie manuelle d'un code-barres, la création d'une interface de configuration du profil d'allergies permettant à l'utilisateur de définir librement ses propres allergènes et intolérances, et l'implémentation de la logique de détection par mots-clés en français et en anglais.

**Livrable :** Une app web fonctionnelle permettant de valider la détection avant de passer au mobile.

---

### Phase 2 — Application mobile avec scan (MVP mobile)

**Complexité :** Moyenne  
**Durée estimée : 3 à 5 jours**

Cette phase consiste à initialiser un projet Expo (React Native), intégrer le scan de code-barres en temps réel, brancher l'API Open Food Facts, porter la logique de la Phase 1, stocker le profil utilisateur localement via AsyncStorage, et concevoir une interface mobile claire avec une alerte visuelle distincte (vert/rouge).

**Livrable :** Une application mobile fonctionnelle sur simulateur et appareils physiques Android et iOS.

---

### Phase 3 — Ajout de l'OCR

**Complexité :** Moyenne à élevée  
**Durée estimée : 3 à 4 jours**

Cette phase ajoute le mode « Photographier l'étiquette » via Google ML Kit. Elle inclut l'intégration de la reconnaissance de texte, le traitement du résultat OCR par la logique de détection existante, et la gestion des cas d'échec (image floue, éclairage insuffisant).

**Livrable :** L'OCR comme mode alternatif au scan de code-barres, utile pour les produits absents de la base de données.

---

### Phase 4 — Améliorations et publication (optionnel)

**Complexité :** Élevée  
**Durée estimée : 5 à 10 jours**

Cette phase optionnelle couvre la détection intelligente des dérivés d'allergènes via l'API Claude, l'historique des produits scannés, la synchronisation multi-appareils via Supabase, l'internationalisation de l'interface (FR/EN), ainsi que toutes les démarches de publication sur l'App Store et Google Play (politique de confidentialité, icône, captures d'écran, soumission).

**Livrable :** Application publiée et disponible sur les stores.

---

### Estimé total

| Phase | Complexité | Durée estimée |
|---|---|---|
| Phase 1 — Prototype web | Faible | 1–2 jours |
| Phase 2 — MVP mobile | Moyenne | 3–5 jours |
| Phase 3 — OCR | Moyenne à élevée | 3–4 jours |
| Phase 4 — Publication | Élevée | 5–10 jours |
| **Total Phase 1 à 3** | | **7–11 jours** |
| **Total Phase 1 à 4** | | **12–21 jours** |

---

## 5. Ressources clés

- **API Open Food Facts** : https://world.openfoodfacts.org/data  
- **Documentation Expo** : https://docs.expo.dev  
- **Google ML Kit (React Native)** : https://developers.google.com/ml-kit/vision/text-recognition  
- **Supabase** : https://supabase.com/docs