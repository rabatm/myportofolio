---
title: "Licence Mobile — Application de suivi des cours étudiants"
date: 2026-06-01
tags: ["React Native", "Expo", "TypeScript", "MobX"]
description: "Application mobile permettant aux étudiants de suivre leurs cours et l'état de leurs sessions."
image: "/projects/licence-mobile/thumbnail.jpg"
github: "https://github.com/rabatm/licence-mobile"
---

Développée avec Expo 53 et Expo Router (routage basé sur les fichiers) sur React Native 0.79 / React 19, cette application mobile permet aux étudiants de consulter la liste de leurs cours et le détail de chacun (matière, sessions effectuées, nombre de séances hebdomadaires, ville, groupe), ainsi que le statut de chaque session.

L'état de l'application est géré avec MobX, le stockage sécurisé des tokens utilise `expo-secure-store`, et les notifications push sont gérées via `expo-notifications`.

Le projet est configuré pour des builds EAS (build Android AAB présent) et inclut un dossier `backend_tests` pour les tests d'intégration avec l'API. Il consomme le même écosystème backend que `licence-portal` et `avocat_backend`/`jp-monorepo`.
