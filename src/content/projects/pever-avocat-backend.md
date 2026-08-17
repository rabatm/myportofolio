---
title: "Pever — API de gestion d'école de coaching juridique"
date: 2026-06-01
tags: ["Node.js", "TypeScript", "AdonisJS", "PostgreSQL"]
description: "API REST pilotant une plateforme de coaching/école pour avocats avec gestion multi-rôles."
image: "/projects/avocat-backend.jpg"
github: "https://github.com/rabatm/avocat_backend"
---

Construite avec AdonisJS 6 (ESM, TypeScript) et l'ORM Lucid sur PostgreSQL, cette API gère un programme de coaching pour une école d'avocats avec des rôles utilisateurs qui se chevauchent (admin, coach, enseignant, étudiant-avocat, étudiant-licence).

Elle prend en charge les matières enseignées, les sessions hebdomadaires avec suivi de présence, les rendez-vous de coaching individuels, ainsi que l'évaluation des pré-cap avec notation, en suivant une architecture stricte en couches Controller → Repository → Model.

Le système envoie des notifications email automatisées (via une commande ace pilotée par cron quotidien) aux enseignants en cas d'absence non signalée, et utilise une authentification par token avec hashage scrypt des mots de passe. La logique métier et le nommage sont largement en français pour coller au domaine.
