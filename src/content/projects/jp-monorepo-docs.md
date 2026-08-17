---
title: "JP Monorepo Docs — Application de documentation"
date: 2026-06-01
tags: ["Next.js", "React", "TypeScript", "Turborepo"]
description: "Application Next.js de documentation/référence, compagnon du portail étudiant dans le monorepo JP."
image: "/projects/jp-monorepo-docs.jpg"
---

Application Next.js issue du template de démarrage Turborepo, tournant sur le port 3001, qui partage les packages `@repo/ui`, `@repo/eslint-config` et `@repo/typescript-config` avec l'application `web` du même monorepo.

Elle sert de surface de documentation/référence interne plutôt que de produit destiné aux utilisateurs finaux, illustrant la structuration en monorepo pnpm/Turborepo du projet avec des packages partagés (`@jp/database`, `@jp/auth-config`, `matieres`, `types`, `utilisateurs`).
