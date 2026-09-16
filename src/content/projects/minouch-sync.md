---
title: "Minouch Sync"
date: 2026-06-01
tags: ["Python", "SQLAlchemy", "PostgreSQL", "Architecture Hexagonale"]
description: "Passerelle de synchronisation bidirectionnelle entre un ERP retail (BBSoft/PostgreSQL) et une plateforme e-commerce (API Minouch)."
image: "/projects/minouch-sync/thumbnail.jpg"
---

Minouch Sync est une passerelle de synchronisation bidirectionnelle entre **BBSoft**, un logiciel de gestion de magasin basé sur PostgreSQL, et **Minouch**, une API e-commerce dédiée aux listes de
naissance.

## Ce qui a été fait

Le projet gère trois flux de données distincts, chacun avec sa propre logique métier :

- **Listes & articles (BBSoft → Minouch)** : détection des modifications par comparaison de timestamps, calcul de la cagnotte restante à partir des règlements enregistrés, et envoi des données mises à
jour vers l'API.
- **Paiements (Minouch → BBSoft)** : récupération des paiements effectués en ligne et injection dans la base PostgreSQL via une fonction stockée.
- **Photos (BBSoft → Minouch)** : synchronisation d'images en upload multipart, avec calcul de l'ordre d'affichage de chaque photo par article.

## Architecture

Le code suit une architecture hexagonale (Clean Architecture) pour isoler la logique métier des détails techniques — base de données, appels API — ce qui permet de tester les règles de synchronisation
indépendamment de l'infrastructure.

## Défis

- **Cohérence financière** : le calcul de la cagnotte (encaissements moins remboursements) devait rester exact au centime près, stocké et transmis sans conversion flottante.
- **Détection incrémentale** : identifier précisément ce qui a changé depuis la dernière synchronisation, sur plusieurs tables liées (articles, règlements), sans resynchroniser l'intégralité des
données à chaque exécution.
- **Fiabilité en production** : ajout d'un mode dry-run pour visualiser les envois avant exécution réelle, et de tests d'intégration sur SQLite/PostgreSQL pour sécuriser les évolutions.

## Stack technique

Python 3.13, SQLAlchemy 2.0 (mapping impératif), PostgreSQL, Pytest, `uv` pour la gestion des dépendances.
