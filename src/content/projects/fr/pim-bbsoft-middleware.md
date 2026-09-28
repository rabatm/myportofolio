---
title: "Passerelle BBSoft — Reprise et fiabilisation d'un legacy de synchronisation produits/prix"
date: 2026-07-30
tags: ["Delphi", "FireDAC", "PostgreSQL", "MSSQL", "FTP/CSV", "BBSoft", "Legacy"]
description: "Middleware Delphi assurant la synchronisation bidirectionnelle de produits et de prix entre le système de caisse BBSoft et des systèmes externes, via échange de fichiers CSV et transferts FTP."
image: "/projects/pim-bbsoft-middleware/thumbnail.jpg"
---

Ce projet est une application Windows (Delphi VCL) qui fait office de middleware pour une chaîne de magasins de retail. Elle synchronise les données produits (articles, catégories, images, tarifs) entre le logiciel de caisse BBSoft et des systèmes externes, via échange de fichiers CSV et transferts FTP.

---

### 🔧 Contexte

Le projet n'était jusque-là pas versionné. La reprise a démarré par la mise en place du versionning Git/GitHub, avec un historique de commits structuré permettant de tracer les évolutions et de revenir en arrière en cas de régression.

Le code Delphi hérité était dense et non structuré, mêlant français/espagnol/anglais (UI, commentaires, identifiants), avec un module central (`TdmMain`) concentrant toute la logique métier.

---

### ⚙️ Fonctionnalités clés

| Flux | Sens | Technologie | Détail |
|------|------|-------------|--------|
| Articles, catégories, tarifs | Externe → BBSoft (import) | FireDAC + FTP/CSV | Mise à jour du catalogue BBSoft depuis les fichiers externes. |
| Données produits | BBSoft → Externe (export) | FireDAC + FTP/CSV | Diffusion des données BBSoft vers les systèmes externes. |
| Promotions | Import BBSoft | Transactions PostgreSQL | Détection de doublons fiabilisée, faux positifs corrigés. |
| Images produits | Import/export | FTP + CSV | Correction de bugs sur la gestion des images. |

---

### 🏗️ Architecture

Module de données central (FireDAC, PostgreSQL/MSSQL) + UI à onglets pilotant les flux Externe → BBSoft (import) et BBSoft → Externe (export). Configuration persistée en fichiers INI.

---

### ⚠️ Défis techniques

- Reprise en main d'un code hérité sans tests ni documentation.
- Fiabilisation des mises à jour BBSoft : transactions PostgreSQL, rollback de sécurité, fermeture propre des connexions.
- Détection de changements fiable, sans faux positifs, notamment sur les doublons de promotions.
- Corrections de bugs récurrents sur la gestion des images et sur des problèmes d'espaces/formatage dans les données échangées.

---

### 📈 Résultat

Un projet désormais versionné et traçable, avec des synchronisations BBSoft fiabilisées (transactions sécurisées, détection de doublons corrigée) et les bugs récurrents de gestion d'images et de formatage résolus.
