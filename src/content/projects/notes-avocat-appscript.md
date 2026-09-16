---
title: "Notes Avocat — Outil de notation Google Apps Script"
date: 2026-06-01
tags: ["Google Apps Script", "clasp", "Node.js"]
description: "Outil Google Apps Script pour gérer les notes (precap, DM) directement dans Google Sheets."
image: "/projects/notes-avocat-appscript/thumbnail.jpg"
---

Utilise `clasp` pour gérer une base de code Apps Script unique déployée sur deux projets Google Script distincts — production et un environnement de pré-prod/staging ("R7") — basculables via des scripts npm (`push:prod`, `push:staging`, `pull:*`, `use:*`).

Un script `init.sh` interactif configure les deux Script IDs (ignorés par git) après le clonage du dépôt. Le comportement spécifique à chaque environnement est géré via `PropertiesService` d'Apps Script plutôt que par des constantes codées en dur, gardant ainsi le code identique entre les environnements.

Conçu pour automatiser les workflows de gestion des notes de l'école d'avocats directement dans Google Sheets.
