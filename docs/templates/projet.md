---
# Copier ce fichier dans src/content/projects/<slug>.md
# <slug> = nom du fichier sans extension → URL /projets/<slug>
# Les commentaires HTML (<!-- -->) ne s'affichent pas : supprime-les quand tu veux.
title: "Nom du projet — Ce qu'il fait en une ligne"
date: 2026-01-01                       # sans guillemets (z.date) ; sert au tri, plus récent en premier
tags: ["Techno 1", "Techno 2", "Domaine métier"]
description: "Une à deux phrases : pour qui, quel problème, quelle solution. Affichée sur les cartes et reprise par Marvin-42."
image: "/projects/<slug>/thumbnail.png" # optionnel — sinon les initiales s'affichent
# url: "https://exemple.com"            # optionnel — URL complète (https://…)
# github: "https://github.com/rabatm/…" # optionnel — uniquement si le dépôt est public
---

<!-- Accroche : 2-3 phrases qui résument le projet pour un lecteur pressé. -->
Nom du projet est … Il permet à … de … sans …

---

### 🔧 Contexte

<!-- Le client, la situation de départ, pourquoi le projet existe.
     Pour une reprise de legacy : état initial du code, absence de versionning, etc. -->

---

### 🎯 Le besoin métier

<!-- Ce que les utilisateurs devaient pouvoir faire. Une liste numérotée si c'est un parcours. -->
1. …
2. …
3. …

---

### ⚙️ Fonctionnalités clés

- **Fonctionnalité** : ce qu'elle apporte.
- **Fonctionnalité** : ce qu'elle apporte.
- **Fonctionnalité** : ce qu'elle apporte.

---

### 🏗️ Architecture

<!-- Choix d'architecture (hexagonale, DDD, couches…), composants, flux de données. -->

---

### ⚠️ Défis techniques

#### 1. Premier défi

<!-- Le problème, puis comment tu l'as résolu. -->

#### 2. Deuxième défi

---

### 📈 Résultats

<!-- Ce que ça a changé concrètement : temps gagné, erreurs évitées, adoption.
     Uniquement des faits vérifiables : le chatbot peut s'appuyer sur ce contenu. -->
- …
- …

---

### 📷 Visuels

<!-- Images dans public/projects/<slug>/ — réduites à l'affichage, agrandies au clic. -->
![Écran principal](/projects/<slug>/capture-1.png)

---

### 🧰 Stack technique

- **Front** : …
- **Back** : …
- **Données** : …
- **Infra** : …
