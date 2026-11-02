---
title: "Passerelle BBSoft — Reprise et fiabilisation d'un legacy de synchronisation produits/prix"
date: 2026-07-30
tags: ["Delphi", "FireDAC", "PostgreSQL", "MSSQL", "FTP/CSV", "BBSoft", "Legacy"]
description: "Reprise d'un logiciel existant qui fait circuler les produits et les prix entre la caisse BBSoft d'une chaîne de magasins et ses autres systèmes : remis sous contrôle, ses mises à jour fiabilisées et ses bugs récurrents corrigés."
image: "../images/pim-bbsoft-middleware/thumbnail.jpg"
services: [integration, maintenance]
---

## Contexte

Une chaîne de magasins de retail utilise une application Windows qui fait le lien entre son logiciel de caisse, BBSoft, et des systèmes externes. Elle synchronise les données produits (articles, catégories, images, tarifs) dans les deux sens, par échange de fichiers.

J'ai repris ce logiciel existant, développé avant moi.

## Le besoin

À la reprise, plusieurs points étaient à régler :

- **aucun historique des modifications** : impossible de savoir ce qui avait changé ni de revenir en arrière en cas de problème ;
- **un code hérité sans tests ni documentation**, dense et peu structuré ;
- **des mises à jour de BBSoft à fiabiliser** ;
- **des promotions détectées à tort comme des doublons** ;
- **des bugs récurrents** sur les images et sur des problèmes d'espaces et de mise en forme dans les données échangées.

## La solution

J'ai commencé par mettre le projet sous contrôle de version, avec un historique des modifications structuré : chaque évolution est tracée, et on peut revenir en arrière si une modification pose problème.

Ensuite, j'ai fiabilisé le logiciel :

- **les mises à jour de BBSoft** sont sécurisées : si une opération échoue, elle est annulée proprement au lieu de laisser des données à moitié écrites ;
- **la détection des changements** ne remonte plus de faux positifs, notamment sur les doublons de promotions ;
- **les bugs récurrents** sur les images et la mise en forme des données sont corrigés.

## Fonctionnalités

- **Import vers BBSoft** : articles, catégories et tarifs venant des systèmes externes mettent à jour le catalogue BBSoft.
- **Export depuis BBSoft** : les données produits de BBSoft sont diffusées vers les systèmes externes.
- **Promotions** : import dans BBSoft avec une détection de doublons fiabilisée.
- **Images produits** : import et export, avec une gestion des images corrigée.

## Résultats

Un projet désormais versionné et traçable, avec des synchronisations BBSoft fiabilisées (transactions sécurisées, détection de doublons corrigée) et les bugs récurrents de gestion d'images et de formatage résolus.

## Côté technique

Application Windows en Delphi (VCL), qui fait office de middleware. Les échanges passent par des fichiers CSV et des transferts FTP.

| Flux | Sens | Technologie | Détail |
|------|------|-------------|--------|
| Articles, catégories, tarifs | Externe → BBSoft (import) | FireDAC + FTP/CSV | Mise à jour du catalogue BBSoft depuis les fichiers externes. |
| Données produits | BBSoft → Externe (export) | FireDAC + FTP/CSV | Diffusion des données BBSoft vers les systèmes externes. |
| Promotions | Import BBSoft | Transactions PostgreSQL | Détection de doublons fiabilisée, faux positifs corrigés. |
| Images produits | Import/export | FTP + CSV | Correction de bugs sur la gestion des images. |

### Architecture

Module de données central (FireDAC, PostgreSQL/MSSQL) et UI à onglets pilotant les flux Externe → BBSoft (import) et BBSoft → Externe (export). Configuration persistée en fichiers INI.

### Reprise du legacy

- Le projet n'était pas versionné : la reprise a démarré par la mise en place de Git/GitHub, avec un historique de commits structuré.
- Le code Delphi hérité était dense et non structuré, mêlant français, espagnol et anglais (UI, commentaires, identifiants), avec un module central (`TdmMain`) concentrant toute la logique métier.
- Aucun test ni documentation à l'arrivée.

### Défis techniques

- Fiabilisation des mises à jour BBSoft : transactions PostgreSQL, rollback de sécurité, fermeture propre des connexions.
- Détection de changements fiable, sans faux positifs, notamment sur les doublons de promotions.
- Corrections de bugs récurrents sur la gestion des images et sur des problèmes d'espaces/formatage dans les données échangées.
