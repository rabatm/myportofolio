---
# Copier ce fichier dans src/content/projects/fr/<slug>.md (et sa traduction dans en/<slug>.md)
# <slug> = nom du fichier sans extension → URL /projets/<slug>
# Les commentaires HTML (<!-- -->) ne s'affichent pas : supprime-les quand tu veux.
title: "Nom du projet — Ce qu'il fait en une ligne"
date: 2026-01-01                       # sans guillemets (z.date) ; sert au tri, plus récent en premier
tags: ["Techno 1", "Techno 2", "Domaine métier"]
description: "Une à deux phrases : pour qui, quel problème, quelle solution. Affichée sur les cartes et reprise par Marvin-42."
image: "../images/<slug>/thumbnail.png" # optionnel — sans ce champ, le nom court du projet s'affiche
services: [web]                        # web | mobile | automation | integration | maintenance (filtre de /projets et preuves de /services)
kind: client                           # client (étude de cas, défaut) | atelier (projet perso, plan libre)
# featured: 1                           # optionnel — rang sur l'accueil (1 = premier, 3 mis en avant au maximum)
# url: "https://exemple.com"            # optionnel — URL complète (https://…)
# github: "https://github.com/rabatm/…" # optionnel — uniquement si le dépôt est public
---

<!-- Étude de cas client : les titres `##` ci-dessous sont imposés, dans cet ordre
     (src/content/projects/structure.test.ts). Version EN : Context / The need /
     The solution / Features / (Results) / Under the hood.
     Un projet `kind: atelier` n'a pas de plan imposé. Aucun fait inventé. -->

## Contexte

<!-- Le client, la situation de départ, pourquoi le projet existe. -->

## Le besoin

- …
- …

## La solution

<!-- Ce qui a été construit et pourquoi. -->

## Fonctionnalités

- **Fonctionnalité** : ce qu'elle apporte.
- **Fonctionnalité** : ce qu'elle apporte.

<!-- Captures : ![Légende](../images/<slug>/ecran.png) suivies de *légende en italique*. -->

## Résultats

<!-- FACULTATIF, uniquement si un résultat est documenté. Supprimer sinon. -->

## Côté technique

<!-- Stack, architecture, défis techniques. -->
