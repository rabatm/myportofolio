---
title: "BOMIQO"
date: 2026-07-30
tags: ["Django", "DRF", "React", "TypeScript", "TailwindCSS", "PostgreSQL"]
description: "Backoffice web pour un réseau de franchises (multi-enseignes), avec gestion du matériel, des licences et des accès."
image: "/projects/bomiqo.jpg"
---

BOMIQO est un backoffice web développé pour un réseau franchisé multi-enseignes (ADBB / BB9 / BVES) géré par AMOPI. L'application centralise la gestion du matériel, des licences, des franchises et des
accès pour l'ensemble du réseau.

## Stack technique

- Backend : Django 5 + Django REST Framework, authentification par JWT (simplejwt)
- Frontend : React 19 + Vite + TypeScript + TailwindCSS v4
- Base de données : PostgreSQL, migrations Django classiques

## Architecture

Le backend suit une architecture hexagonale organisée en slices verticaux : chaque app Django (foundation, materiel, auth_api, audit...) sépare clairement les modèles, la logique métier (services),
l'accès aux données (repositories) et l'API (serializers/views), pour garder les vues fines et la logique métier testable indépendamment de DRF.

Le frontend suit une approche "hook-first" en feature slices : chaque fonctionnalité est un dossier autonome avec ses types, ses hooks React Query pour les appels API, et des composants qui ne font
que du rendu.

## Défis rencontrés

- Concevoir un système de permissions fin et cohérent (`HasPerm` + scopes) applicable uniformément côté API et côté UI.
- Mettre en place un audit trail fiable couvrant l'ensemble des modèles métier sensibles (matériel, ventes, locations, prêts, SAV).
- Garder une base de code strictement modulaire (limites de lignes par type de fichier) pour forcer le découpage plutôt que l'accumulation de complexité.

## Résultat

Une plateforme backoffice robuste, testée en conditions réelles via un protocole de recette structuré par blocs fonctionnels, couvrant la gestion du matériel/licences, les fondations réseau et les
opérations SAV.
