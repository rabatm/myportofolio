---
title: "JurisPerform Infrastructure — Docker & Backup Automation"
date: 2026-06-01
tags: ["Docker", "Docker Compose", "Python", "PostgreSQL", "Nginx"]
description: "Infrastructure Docker et système de sauvegarde automatisé pour la plateforme JurisPerform."
image: "/projects/jp-vps-dockerconf/thumbnail.jpg"
github: "https://github.com/rabatm/JP_VPS_DOCKERCONF"
---

Ce dépôt définit la stack Docker Compose complète (PostgreSQL, backend, frontend, Nginx, Certbot) qui fait tourner les environnements de production et de développement de la plateforme JurisPerform ("pever"/"jpWeb") sur un VPS.

Il comprend un service de sauvegarde automatisée écrit en Python qui exporte la base PostgreSQL selon un planning (rotations hebdomadaires et mensuelles) et envoie les dumps vers Google Drive via un compte de service, avec une politique de rétention (3 sauvegardes hebdomadaires, 12 mensuelles).

Un fichier `docker-compose.dev.yml` séparé fournit un environnement de développement local léger avec Django, Postgres et Nginx. La gestion du TLS est assurée par Certbot et le reverse proxy par Nginx, l'ensemble servant le domaine de production api.surikwat.com.
