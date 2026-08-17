---
title: 'amiqo — Scan de codes-barres pour terminaux professionnels'
date: 2026-07-30
tags: ['Flutter', 'Dart', 'PostgreSQL', 'SQLite', 'Android']
description: 'Application Flutter offline-first pour la logistique terrain, connectée directement à PostgreSQL, avec synchronisation automatique et support natif des scanners Zebra et Sunmi.'
image: '/public/projects/amiqo.png'
---

**amiqo** est une application Android destinée aux équipes logistique et retail
qui utilisent des terminaux de scan durcis (Zebra et Sunmi) pour consulter des
produits et enregistrer des scans sur le terrain, même en connexion instable.

## Le problème

Sur le terrain, la connexion réseau n'est jamais garantie. Une app qui dépend
d'une API en ligne bloque l'opérateur dès la moindre coupure. amiqo devait donc
fonctionner **offline-first**, en gardant les données du catalogue et les scans
localement, tout en restant synchronisée avec la base centrale dès que possible.

## Ce qui a été fait

- **Connexion directe à PostgreSQL** (sans API REST intermédiaire), avec un
  pool de connexions et une couche de requêtes dédiée.
- **Cache local SQLite** pour les articles, fournisseurs et scans, permettant
  un fonctionnement complet hors ligne.
- **Synchronisation en arrière-plan** avec reprise sur point de contrôle : en
  cas d'échec réseau, la sync des articles reprend au dernier lot traité au
  lieu de tout recommencer.
- **Surveillance réseau adaptative** combinant les évènements Wi-Fi/data du
  système et un ping périodique de la base PostgreSQL, pour piloter les
  tentatives de resynchronisation.
- **Abstraction matérielle du scanner** : détection automatique du fabricant
  au démarrage pour brancher soit DataWedge (Zebra), soit un EventChannel natif
  (Sunmi), sans logique conditionnelle ailleurs dans l'app.
- **Mode démo à durée limitée** (trial) et **mises à jour OTA** via GitHub,
  pour faciliter la distribution en dehors du Play Store.

## Architecture

Clean Architecture en feature-first (domain / infrastructure / presentation),
avec injection de dépendances via GetIt et gestion d'état par Provider. Les cas
d'usage sont sans état et retournent des `Either<Failure, T>` pour une gestion
d'erreur explicite (réseau, cache, auth, validation).

## Défis rencontrés

Le plus délicat a été de garantir la cohérence des données lors des allers-retours
online/offline : éviter les scans dupliqués, gérer les échecs partiels de
synchronisation, et s'assurer que l'app reste utilisable sur des écrans très
étroits (~320 dp) propres aux terminaux professionnels.
