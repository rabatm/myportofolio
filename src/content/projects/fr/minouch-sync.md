---
title: "Minouche — Faire communiquer l'ERP et le site e-commerce"
date: 2026-06-01
tags: ["Python", "SQLAlchemy", "PostgreSQL", "Architecture Hexagonale", "BBSoft"]
description: "Une passerelle qui fait circuler articles, photos et paiements entre le logiciel du magasin Minouche et son site e-commerce, dans les deux sens, pour garder les deux cohérents et limiter les doubles saisies."
image: "../images/minouche-sync/thumbnail.png"
services: [integration]
featured: 3
---

## Contexte

Minouche gère son magasin avec un logiciel de gestion, BBSoft. Avec la mise en ligne de son site e-commerce, Minouche devait faire communiquer deux systèmes qui n'avaient pas été conçus pour fonctionner ensemble : BBSoft d'un côté, sa plateforme e-commerce de l'autre. Chacun a sa propre façon d'organiser les données et ses propres règles.

## Le besoin

Garder les informations cohérentes entre le magasin et le site, sans obliger les équipes à modifier leurs habitudes de travail ni à effectuer des saisies manuelles.

Avec une exigence particulière sur l'argent : la cagnotte des clients, calculée à partir des encaissements et des remboursements, devait rester exacte au centime près.

## La solution

J'ai développé une passerelle de synchronisation entre BBSoft et la plateforme e-commerce, qui fait circuler les données dans les deux sens. Elle joue l'intermédiaire entre les deux systèmes et traduit les données pour que chacun les comprenne.

L'objectif était avant tout de rendre les deux systèmes complémentaires, plutôt que de demander aux équipes de travailler deux fois. La passerelle permet notamment de :

- limiter les doubles saisies ;
- maintenir les données cohérentes entre le magasin et le site ;
- automatiser les échanges de paiements ;
- synchroniser les informations et photos des produits ;
- conserver BBSoft comme outil de gestion quotidien.

## Fonctionnalités

- **Articles et listes** : les modifications effectuées dans BBSoft sont détectées et transmises au site.
- **Paiements en ligne** : les règlements réalisés sur le site sont récupérés et enregistrés dans BBSoft.
- **Paiements en magasin** : les règlements effectués en boutique sont transmis au site.
- **Photos** : les images des articles sont synchronisées avec leur ordre d'affichage.
- **Cagnotte client** : calculée à partir des encaissements et des remboursements enregistrés dans BBSoft, au centime près.
- **Seulement ce qui a changé** : la passerelle ne transmet que les éléments qui ont évolué, sans retraiter toutes les données à chaque synchronisation.

## Côté technique

**Python 3.13 · SQLAlchemy 2.0 · PostgreSQL · Pytest · uv**

### Faire communiquer deux systèmes différents

BBSoft (l'ERP) et la plateforme e-commerce disposent chacun de leur propre modèle de données. La passerelle se branche sur l'API de la plateforme e-commerce et transforme les données dans les deux sens.

### Fiabilité des données financières

Les montants sont manipulés sans conversion en nombres flottants, afin d'éviter les erreurs d'arrondi lors des calculs et des échanges.

### Synchronisation incrémentale

La passerelle détecte les modifications à partir des données disponibles dans BBSoft, afin de ne transmettre que les éléments ayant évolué.

### Architecture

Le projet repose sur une architecture hexagonale, qui sépare la logique métier des systèmes techniques avec lesquels elle communique. La logique de synchronisation peut ainsi être testée indépendamment de PostgreSQL ou de l'API externe, et la passerelle évolue plus facilement si l'un des systèmes connectés venait à changer.

SQLAlchemy est utilisé avec un mapping impératif, afin de conserver une séparation claire entre le modèle métier et la persistance des données.
