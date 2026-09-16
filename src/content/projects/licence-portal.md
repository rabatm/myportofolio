---
title: "Licence Portal — Plateforme de gestion académique multi-rôles"
date: 2026-06-01
tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "Zustand"]
description: "Plateforme web multi-rôles (étudiants, professeurs, coachs, admins) de gestion des notes, cours et coaching."
image: "/projects/licence-portal/thumbnail.jpg"
url: "https://api.surikwat.com/licence"
github: "https://github.com/rabatm/licence-portal"
---

Une SPA React 18 + Vite proposant quatre interfaces distinctes selon le rôle — Étudiant (`/`), Admin (`/AdminAlley`), Coach (`/CoachingLicense`) et Professeur (`/ProfesseurLicence`) — chacune avec son propre routage imbriqué et sa mise en page dédiée.

La plateforme gère les données académiques (notes, cours, sessions de coaching) réparties sur plusieurs villes (Aix, Gotham, Montpellier, Toulouse), avec des routes admin/coach scopées par ville.

L'état d'authentification et utilisateur est géré avec Zustand (tokens JWT persistés en localStorage), les données sont récupérées via React Query v3 à travers un `apiService` centralisé, et l'interface s'appuie sur un système de composants façon shadcn/ui construit sur Radix UI et Tailwind CSS. Les graphiques utilisent Recharts et les transitions Framer Motion. La plateforme se connecte en production à l'API `avocat_backend`/"pever".
