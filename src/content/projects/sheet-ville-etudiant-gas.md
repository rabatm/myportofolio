---
title: "Sheet Ville Étudiant — Automatisation Google Sheets vers Calendar"
date: 2026-06-01
tags: ["Google Apps Script", "clasp", "Bash"]
description: "Outil Google Apps Script qui synchronise automatiquement les emplois du temps depuis une feuille Google Sheets vers Google Calendar."
image: "/projects/sheet-ville-etudiant-gas.jpg"
github: "https://github.com/rabatm/JP_sheet_update"
---

Automatise l'insertion des événements de cours TD/CM depuis une feuille Google Sheets vers Google Calendar, à travers plusieurs projets Apps Script/calendriers organisés par "ville", avec un code modulaire structuré en dossiers numérotés (config, calendar, api, utils, triggers).

Le projet se connecte également à une API externe pour la synchronisation et la mise à jour de données complémentaires.

Un script `deploy.sh` sur mesure permet de déployer/récupérer le code, consulter les logs et gérer la configuration/les secrets sur l'ensemble des projets configurés, les secrets étant tenus à l'écart de git via `.env`/`secrets.js` et `PropertiesService`. Le projet envoie des notifications d'erreur par email.
