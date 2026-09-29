---
title: "Minouche — Faire communiquer l'ERP et le site e-commerce"
date: 2026-06-01
tags: ["Python", "SQLAlchemy", "PostgreSQL", "Architecture Hexagonale", "BBSoft"]
description: "Une passerelle de synchronisation bidirectionnelle entre l'ERP de Minouche et son site e-commerce."
image: "../images/minouche-sync/thumbnail.png"
---

## Le besoin

Avec la mise en ligne de son site e-commerce, Minouche devait faire communiquer deux systèmes qui n'avaient pas été conçus pour fonctionner ensemble : son logiciel de gestion de magasin, BBSoft, et sa plateforme e-commerce.

L'enjeu était de garder les informations cohérentes entre le magasin et le site, sans obliger les équipes à modifier leurs habitudes de travail ni à effectuer des saisies manuelles.

## La solution

J'ai développé une passerelle de synchronisation bidirectionnelle entre BBSoft et l'API de la plateforme e-commerce.

Elle automatise les échanges de données dans les deux sens :

- **Articles et listes** : les modifications effectuées dans BBSoft sont détectées et transmises au site.
- **Paiements en ligne** : les règlements réalisés sur le site sont récupérés et enregistrés dans BBSoft.
- **Paiements en magasin** : les règlements effectués en boutique sont transmis au site.
- **Photos** : les images des articles sont synchronisées avec leur ordre d'affichage.

La passerelle prend également en charge le calcul de la cagnotte client, à partir des encaissements et des remboursements enregistrés dans l'ERP.

## Ce que cela apporte

L'objectif était avant tout de rendre les deux systèmes complémentaires plutôt que de demander aux équipes de travailler deux fois.

La solution permet notamment de :

- limiter les doubles saisies ;
- maintenir les données cohérentes entre le magasin et le site ;
- automatiser les échanges de paiements ;
- synchroniser les informations et photos des produits ;
- conserver BBSoft comme outil de gestion quotidien.

## Les enjeux

### Faire communiquer deux systèmes différents

BBSoft et la plateforme e-commerce disposent chacun de leur propre modèle de données et de leurs propres règles.

La passerelle joue le rôle d'intermédiaire entre ces deux environnements et transforme les données pour qu'elles puissent être comprises par chacun des systèmes.

### Garantir la fiabilité des données financières

Le calcul de la cagnotte devait rester exact au centime près.

Les montants sont donc manipulés sans conversion en nombres flottants afin d'éviter les erreurs d'arrondi lors des calculs et des échanges.

### Ne synchroniser que ce qui a changé

La passerelle détecte les modifications à partir des données disponibles dans BBSoft afin de ne transmettre que les éléments ayant évolué.

Cela évite de retraiter inutilement l'ensemble des données à chaque synchronisation.

## Architecture

Le projet repose sur une architecture hexagonale afin de séparer la logique métier des systèmes techniques avec lesquels elle communique.

La logique de synchronisation peut ainsi être testée indépendamment de PostgreSQL ou de l'API externe.

Cette approche facilite également l'évolution de la passerelle si l'un des systèmes connectés venait à changer.

## Stack technique

**Python 3.13 · SQLAlchemy 2.0 · PostgreSQL · Pytest · uv**

SQLAlchemy est utilisé avec un mapping impératif afin de conserver une séparation claire entre le modèle métier et la persistance des données.
