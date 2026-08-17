---
title: "Licence Web Portal — Portail étudiant (Next.js)"
date: 2026-06-01
tags: ["Next.js", "React", "TypeScript", "NextAuth.js", "Prisma", "Tailwind CSS"]
description: "Portail étudiant Next.js avec authentification basée sur une base Django existante."
image: "/projects/jp-monorepo-web.jpg"
---

Construite avec Next.js 15 (App Router) et React 19, cette application implémente une structure d'URL évolutive basée sur les rôles (`/student`, avec `/teacher`, `/admin`, `/coaching` prévus), à commencer par la connexion et le tableau de bord étudiant.

L'authentification est gérée par NextAuth.js v5 via le package partagé `@jp/auth-config`, qui authentifie les identifiants directement contre une table Django `auth_user` existante (supportant les hashs PBKDF2, Argon2 et BCrypt) plutôt qu'un modèle utilisateur Prisma natif.

L'accès aux données passe par `@jp/database`, un client Prisma avec un schéma multi-fichiers reflétant le schéma PostgreSQL Django à travers les domaines auth/mobile/django. L'application partage une librairie de composants `@repo/ui` avec l'application `docs` du même monorepo, et est stylée avec Tailwind CSS v4.
