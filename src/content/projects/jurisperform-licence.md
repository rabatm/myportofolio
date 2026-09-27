---
title: "Jurisperform Licence — Le système qui fait tourner le soutien en droit, de l'emploi du temps à l'appel"
date: 2026-09-26
tags: ["Django", "Django REST Framework", "React", "TypeScript", "PostgreSQL", "Google Apps Script", "Docker", "Architecture hexagonale", "EdTech"]
description: "Plateforme complète pour Jurisperform, organisme de soutien en droit pour les étudiants de Licence (L1 à L3) dans plusieurs villes. Elle couvre la déclaration des TD de fac, la planification des cours, les photos pour l'appel mobile, le trombinoscope, le coaching et les comptes rendus pédagogiques."
image: "/projects/jurisperform-licence/thumbnail.png"
---

Jurisperform Licence est la plateforme qui gère le soutien en droit de Jurisperform pour les étudiants de L1, L2 et L3, dans plusieurs villes. Elle réunit trois briques :

- une **API Django** ;
- un **portail React** avec quatre espaces : étudiant, professeur, coach et administrateur ;
- une **synchronisation Google Sheets / Google Calendar** pour chaque ville.

Les étudiants déclarent leurs TD de fac, et Jurisperform planifie ses cours autour sans conflit d'horaires. Les professeurs font l'appel sur mobile à partir des photos des étudiants, et chaque séance déclenche un compte rendu pédagogique.

---

### 🔧 Contexte

Jurisperform propose des cours de soutien en droit aux étudiants de Licence, en complément de la fac, dans plusieurs villes (Aix, Montpellier, Toulouse…). Chaque ville a son propre Google Sheet : étudiants, groupes, matières, cours magistraux, équipe pédagogique. Cette organisation faisait peser trois difficultés :

- **Planifier** : il faut connaître l'emploi du temps de fac de chaque étudiant pour caler les séances Jurisperform sans chevauchement.
- **Faire l'appel** : les professeurs doivent reconnaître des dizaines d'étudiants par groupe.
- **Assurer le suivi** : les étudiants et l'équipe ont besoin d'un historique partagé des présences, des évaluations et du coaching.

J'ai conçu et développé seul l'ensemble du système, de l'API au déploiement. Le projet a démarré en août 2024 et il est toujours en production.

---

### 🎯 Le besoin métier

1. **L'étudiant déclare ses TD de fac** chaque semestre : jour, heure de début et de fin, ou « je ne participe pas ».
2. **Jurisperform planifie ses séances** à partir de ces déclarations, qui alimentent les Google Sheets et Google Calendar de chaque ville.
3. **L'étudiant dépose une photo** de profil, obligatoire pour accéder à son espace. Elle est validée puis utilisée pour l'appel.
4. **Le professeur fait l'appel** depuis l'application mobile et consulte le trombinoscope de sa ville.
5. **Après chaque séance**, l'étudiant reçoit un compte rendu pédagogique : présence, participation, commentaire du professeur.
6. **Le coach rédige des comptes rendus de coaching**, que l'étudiant retrouve dans son espace.
7. **L'administration pilote chaque ville** : statistiques, déclarations manquantes, validation des photos, sessions, notes.

---

### ⚙️ Fonctionnalités clés

**Espace étudiant**

- **Déclaration des TD** : l'étudiant saisit ses TD par semestre, et chaque modification est gardée dans un historique. L'administration peut ouvrir ou fermer les fenêtres de déclaration.
- **Photo obligatoire** : sans photo, l'étudiant ne peut pas accéder à son tableau de bord. La photo est redressée automatiquement grâce à la détection de visage.
- **Mes cours** : pour chaque séance de soutien, l'étudiant voit sa présence, sa note de participation écrite et orale, et le commentaire du professeur.
- **Mes notes** : l'étudiant déclare ses notes de fac (partiels, contrôles, devoirs corrigés par Jurisperform), qui sont ensuite sauvegardées dans Google Sheets.
- **Mon coaching** : l'étudiant retrouve l'historique des comptes rendus rédigés par son coach.

**Espace professeur**

- **Trombinoscope par ville**, avec filtres par groupe et par matière, tri, zoom et repérage des étudiants sans photo.

**Espace coach**

- **Suivi des étudiants** : le coach consulte la fiche d'un étudiant (séances, notes, historique) et rédige un compte rendu à côté. Une fois envoyé, le compte rendu n'est plus modifiable et il est partagé avec l'étudiant et l'équipe.

**Espace administrateur**

- **Tableau de bord** : statistiques mensuelles par ville (inscriptions, désinscriptions, effectifs).
- **Déclarations de TD** : suivi de l'avancement et liste des étudiants qui n'ont pas encore déclaré.
- **Photos** : file de validation. Les photos non conformes sont refusées avec un motif (floue, visage non visible…).
- **Séances** : suivi par ville, annulation groupée de séances, clôture sans appel.

**Automatisations**

- **Récapitulatif quotidien** envoyé aux administrateurs.
- **Récapitulatif hebdomadaire**.
- **Alertes « cours non assurés »**.
- **Validation nocturne des photos**.
- **Remise à zéro annuelle**, avec audit.

---

### 🏗️ Architecture

**API Django / DRF en architecture hexagonale (ports et adapters)**

- La **couche `domain`** contient la logique métier en Python pur. Les **cas d'usage** sont dans `application`, un par fichier, et reçoivent leurs dépendances par injection.
- Les **adapters** isolent Django, Google et l'e-mail.
- Une quarantaine de **ports** sont définis avec `typing.Protocol`.
- Le code suit des **règles strictes** : 70 lignes maximum par fichier, 4 paramètres maximum par fonction, mypy en mode strict, black, isort, pylint et bandit.
- Le monolithe d'origine est **migré progressivement** vers cette architecture, domaine par domaine.

**Modèle de données**

- **20 modèles** : utilisateurs avec des rôles (étudiant, professeur, coach, admin) rattachés à une ville, sessions professeur et étudiant, matières, TD de fac versionnés, cours magistraux, coaching, notes et journal d'activité.
- Environ **150 endpoints REST**, authentifiés par **JWT** (tokens de rafraîchissement et liste noire).

**Portail React + TypeScript (Vite)**

- **Quatre espaces**, chacun avec son layout et sa page de connexion. Les URL sont construites par ville (`/:ville`).
- État avec **Zustand**, données avec **React Query**. Les pages sont chargées à la demande (*lazy loading*).
- **Design system** : composants Radix/shadcn et Tailwind, avec des tokens CSS. L'espace étudiant est conçu d'abord pour le mobile.

**Synchronisation Google (Apps Script)**

- **Google Sheets est la source de vérité** pour les étudiants, les matières, l'équipe, les groupes et les cours magistraux. L'API les synchronise par tâches planifiées décalées dans le temps.
- Un **seul code Apps Script** est déployé sur le Sheet de chaque ville avec `clasp`, et un script propose un menu de déploiement dev/prod.
- Les **CM et les TD deviennent des événements récurrents** dans Google Calendar, avec un calendrier par groupe. Les étudiants sont ajoutés aux séries de TD qu'ils ont déclarées.

**Flux principal**

- Déclaration de TD dans le portail → API → webhook Apps Script → Sheet et Calendar de la ville → planification des séances → appel sur mobile → e-mail de suivi pédagogique.

---

### ⚠️ Défis techniques

#### 1. Synchroniser Django, Google Sheets et Google Calendar

Les données vivent à trois endroits : la base Django, le Google Sheet de chaque ville et les agendas Google. Il faut qu'ils restent cohérents, dans les deux sens.

- **Du Sheet vers Django** : le Google Sheet reste la source de vérité pour les étudiants, les matières, l'équipe, les groupes et les cours magistraux. L'API les importe par **tâches planifiées décalées dans le temps**, ville par ville.
- **De Django vers le Sheet** : quand un étudiant déclare ses TD, l'API appelle un **webhook Apps Script** qui met à jour le Sheet de sa ville. Les notes déclarées par les étudiants y sont aussi sauvegardées.
- **Du Sheet vers les agendas** : les CM et les TD deviennent des **événements récurrents**, avec un calendrier par groupe, et chaque étudiant est ajouté aux séries de TD qu'il a déclarées.
- **En cas de problème**, une commande permet de **restaurer les déclarations depuis le Google Sheet**.

#### 2. Les limites d'exécution de Google Apps Script

Un script Apps Script ne peut pas tourner plus de 6 minutes, ce qui ne suffit pas pour traiter tout un Sheet de ville. La synchronisation se fait donc par étapes :

- **Traitement par lots de 30 lignes**, avec un curseur de reprise enregistré dans les Script Properties.
- **Relance automatique** par un trigger ponctuel, et nettoyage des anciens triggers.
- **Anti-doublons** : avant de créer un événement, le script cherche s'il existe déjà un événement avec le même titre et les mêmes horaires exacts.
- **Heures et fuseau** : l'heure est réappliquée après chaque décalage de date pour éviter les erreurs au passage heure d'été / heure d'hiver.

#### 3. Des photos exploitables pour l'appel

Beaucoup de photos déposées par les étudiants étaient tournées, trop lourdes ou sans visage visible.

- L'API **détecte le visage** avec `face_recognition` (dlib), **corrige l'orientation**, redimensionne l'image et génère une miniature.
- **Chaque nuit**, un traitement valide les photos. Un e-mail prévient l'étudiant si la sienne est refusée, et les administrateurs reçoivent la liste des photos sans visage détecté.

#### 4. Une remise à zéro annuelle sûre

Chaque année, il faut repartir de zéro sans perdre la configuration.

- La remise à zéro supprime les étudiants, les sessions, les photos et les comptes, et conserve les matières, l'équipe et les paramètres.
- Elle était d'abord exposée par une route HTTP. Une revue de code y a trouvé un **risque de contournement d'autorisation**.
- Elle est devenue une **commande shell** qui exige une confirmation explicite, avec audit et comptage des suppressions.

#### 5. Migrer vers une architecture hexagonale sans interrompre le service

- La migration se fait domaine par domaine, en suivant des règles vérifiées automatiquement (`make check`).
- Les tests reposent sur des *fakes* en mémoire plutôt que sur des mocks, avec le découpage Given/When/Then.

---

### 📈 Résultats

- **Une plateforme unique** pour quatre profils (étudiants, professeurs, coachs, administrateurs), en production depuis 2024 dans plusieurs villes.
- **Des déclarations de TD qui alimentent directement Google Sheets et Google Calendar**, sans ressaisie.
- **Le suivi pédagogique est envoyé automatiquement** après chaque séance (présence, participation, commentaire), y compris aux étudiants absents.
- **Les tâches répétitives sont automatisées** : création des séances de la semaine, clôture des séances, récapitulatifs, alertes, sauvegardes des notes et de la base.
- **Qualité du code** :
  - 827 tests automatisés ;
  - 80 % de couverture minimum exigée ;
  - 47 commandes d'administration documentées ;
  - CI/CD sur le portail (lint, build, déploiement lors d'un tag de version).

---

### 📷 Visuels

![Espace étudiant — déclaration des TD](/projects/jurisperform-licence/capture-1.png)
![Trombinoscope professeur](/projects/jurisperform-licence/capture-2.png)
![Tableau de bord administrateur](/projects/jurisperform-licence/capture-3.png)

---

### 🧰 Stack technique

- **Front** : React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn, Zustand, React Query, Recharts, Framer Motion
- **Back** : Python, Django 5, Django REST Framework, SimpleJWT, architecture hexagonale, pytest, mypy, pylint, face_recognition (dlib), Pillow
- **Données** : PostgreSQL 16, API Google Sheets / Drive / Calendar, Google Apps Script (clasp)
- **Infra** : VPS, Docker Compose, Gunicorn, Nginx, Let's Encrypt, cron, sauvegardes `pg_dump` vers Google Drive, GitHub Actions
