---
title: "PIM BBSoft Middleware"
date: 2026-07-30
tags: ["Delphi", "FireDAC", "PostgreSQL", "MSSQL", "FTP/CSV"]
description: "Middleware PIM assurant la synchronisation bidirectionnelle entre le système de caisse BBSoft et des systèmes externes via échange de fichiers CSV et transferts FTP."
image: "/projects/pim-bbsoft.jpg"
---

Ce projet est une application Windows (Delphi VCL) qui fait office de middleware PIM pour une chaîne de magasins de retail franco-espagnole. Elle synchronise les données produits (articles,
catégories, images, tarifs) entre le logiciel de caisse BBSoft et des systèmes externes, via échange de fichiers CSV et transferts FTP.

## Ce qui a été fait

- **Mise en place du versionning Git/GitHub** : le projet n'était jusque-là pas versionné ; migration vers un dépôt Git avec historique de commits structuré, permettant de tracer les évolutions et de
revenir en arrière en cas de régression.
- **Reprise d'un code Delphi hérité non structuré** : prise en main d'un codebase existant, dense et mêlant français/espagnol/anglais (UI, commentaires, identifiants), avec un module central (TdmMain)
concentrant toute la logique métier.
- **Fiabilisation des mises à jour BBSoft** : améliorations de la logique d'import/export lors des synchronisations avec BBSoft (transactions PostgreSQL, rollback de sécurité, fermeture propre des
connexions, correction de faux positifs sur la détection de doublons de promotions).
- **Corrections d'erreurs** : bugs sur la gestion des images et sur des problèmes d'espaces/formatage dans les données échangées.

## Architecture

Module de données central (FireDAC, PostgreSQL/MSSQL) + UI à onglets pilotant les flux Externe → BBSoft (import) et BBSoft → Externe (export). Configuration persistée en fichiers INI.

## Défis

- Reprise en main d'un code hérité sans tests ni documentation.
- Fiabilité des synchronisations (rollback, gestion des connexions).
- Détection de changements fiable, sans faux positifs.

## Stack technique

Delphi (VCL, Win32), FireDAC (PostgreSQL, MSSQL), Indy (FTP, SMTP, MD5), FastReport, Git/GitHub.
