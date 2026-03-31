# Instructions de projet — Allergie Check

## Contexte du projet

Une application mobile permettant à un utilisateur de détecter rapidement la présence d’ingrédients auxquels il est allergique ou intolérant dans un produit alimentaire vendu en épicerie. L’utilisateur configure une fois son profil d’allergies, puis scanne les produits à l’achat pour obtenir une alerte immédiate si un allergène détecté correspond à son profil.
L’application repose sur deux modes d’entrée complémentaires :
	1.	Scan du code-barres : interroge une base de données externe pour récupérer automatiquement la liste d’ingrédients et les allergènes déclarés du produit.
	2.	Lecture optique (OCR) : l’utilisateur photographie directement l’étiquette du produit, et le texte est extrait et analysé pour en déduire les allergènes présents.

Le document d'analyse complet est joint aux fichiers de ce projet.
Tous les checkpoints du projet sont joints aux fichiers de ce projet — ils documentent l'historique complet des décisions et de l'avancement. Le checkpoint le plus récent contient le point de reprise actuel.

> **Note pour Claude Code (VS Code) :** Le contexte du projet se trouve dans le dossier `_context/` à la racine du projet. Lire tous les fichiers de ce dossier avant de commencer, en portant une attention particulière au checkpoint le plus récent (fichier dont la date est la plus récente).

## Stack technologique

|Couche                     |Technologie               |Justification                                               |
|---------------------------|--------------------------|------------------------------------------------------------|
|Frontend mobile            |React Native + Expo       |Base de code unique iOS/Android, accès simplifié à la caméra|
|Scan code-barres           |expo-barcode-scanner      |Natif Expo, simple à intégrer                               |
|Base de données produits   |API Open Food Facts       |Gratuit, couverture Canada, pas de clé requise              |
|OCR                        |Google ML Kit (hors ligne)|Gratuit, fonctionne sans connexion                          |
|Détection intelligente (v2)|API Claude (Anthropic)    |Analyse sémantique des dérivés d’allergènes                 |
|Stockage profil (MVP)      |AsyncStorage              |Simple, local, aucun backend requis                         |
|Stockage profil (v2)       |Supabase                  |Gratuit en dev, multi-appareils, auth intégrée              |

## Règles de travail

- Coder, commenter le code, nommer les fichiers et les dossiers en anglais.
- Les messages d'interface utilisateur doivent être bilingues (français et anglais).
- Respecter le stack technologique défini ci-dessus. Si une alternative est envisagée, l'expliquer avant de l'implémenter.
- Avant de proposer du code, exposer brièvement l'approche prévue.
- Si une décision d'architecture est ambiguë, poser la question plutôt qu'assumer.
- Prévenir si une tâche demandée dépasse la portée de la phase en cours.
- À la fin de chaque session, si le mot-clé « checkpoint » est mentionné, générer un fichier `.md` téléchargeable en suivant strictement le modèle de checkpoint joint aux fichiers de ce projet (modele-checkpoint-projet-dev.md). Nommer le fichier selon la convention : AAAA-MM-JJ_checkpoint_allergie-check.md. Ce fichier doit ensuite être déposé aux deux endroits : dans le dossier `_context/` du projet de code, et dans les fichiers du Projet Claude.

## Environnement de développement

- Éditeur : VS Code avec Claude Code
- Système : macOS
- Abonnement : Claude Pro