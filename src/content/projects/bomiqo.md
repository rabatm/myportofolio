---
title: "BOMIQO — Backoffice de gestion de flotte, licences et infrastructure client"
date: 2026-07-30
tags: ["Django", "DRF", "React", "TypeScript", "TailwindCSS", "PostgreSQL", "MySQL", "AMOPI", "Location de matériel", "Gestion de licences"]
description: "Backoffice web pour un réseau de franchises multi-enseignes (AMOPI). Gère la location de terminaux d'inventaire, les licences logicielles déployées chez les clients et la synchronisation de leur infrastructure technique."
image: "/projects/bomiqo/thumbnail.png"
---

BOMIQO est un backoffice web développé pour un réseau franchisé multi-enseignes (ADBB / BB9 / BVES) géré par AMOPI. L'application centralise trois piliers : la location de terminaux d'inventaire, la gestion des licences logicielles déployées chez les clients, et la synchronisation de leur infrastructure technique.

---

### 📦 Location de terminaux

AMOPI prête des terminaux aux enseignes pour faire leurs inventaires. BOMIQO suit le cycle de vie complet de chaque prêt :
- Date d'expédition du terminal.
- Date de livraison chez le client.
- Date de retour prévue et effective.

---

### 🔑 Gestion des licences

Les logiciels déployés chez les clients sont protégés par un système de licences, avec un serveur de vérification intégré directement au backend Django (pas de service séparé).

---

### 🖥️ Infrastructure technique

BOMIQO synchronise automatiquement les informations techniques des serveurs clients (IP, identifiants, etc.) depuis une base MySQL, pilotée par Django.

---

### ⚙️ Fonctionnalités clés

| Acteur | Action | Technologie | Détail |
|--------|--------|-------------|--------|
| AMOPI | Suivre un prêt de terminal | Django + PostgreSQL | Dates d'expédition, livraison et retour. |
| AMOPI | Gérer une licence logicielle | Django (serveur de vérification intégré) | Validation directe depuis le backend, sans service tiers. |
| Système | Synchroniser l'infra client | Django + connexion MySQL | Récupération automatique IP serveur, logins, etc. |
| AMOPI | Gérer les accès | DRF + JWT (simplejwt) + permissions `HasPerm` | Permissions fines par scope, appliquées côté API et UI. |
| AMOPI | Auditer les actions | Audit trail Django | Couvre matériel, ventes, locations, prêts, SAV. |

---

### 🏗️ Architecture

Le backend suit une architecture hexagonale organisée en slices verticaux : chaque app Django (foundation, materiel, auth_api, audit...) sépare clairement les modèles, la logique métier (services), l'accès aux données (repositories) et l'API (serializers/views), pour garder les vues fines et la logique métier testable indépendamment de DRF.

Le frontend suit une approche "hook-first" en feature slices : chaque fonctionnalité est un dossier autonome avec ses types, ses hooks React Query pour les appels API, et des composants qui ne font que du rendu.

---

### ⚠️ Défis techniques

- Concevoir un système de permissions fin et cohérent (`HasPerm` + scopes) applicable uniformément côté API et côté UI.
- Mettre en place un audit trail fiable couvrant l'ensemble des modèles métier sensibles (matériel, ventes, locations, prêts, SAV).
- Fiabiliser la synchronisation automatique depuis la base MySQL des clients, dont la disponibilité et le schéma échappent au contrôle direct de BOMIQO.
- Sécuriser le serveur de vérification de licences intégré, pour éviter qu'il ne devienne un point de contournement.
- Garder une base de code strictement modulaire (limites de lignes par type de fichier) pour forcer le découpage plutôt que l'accumulation de complexité.

---

### 📈 Résultat

Une plateforme backoffice robuste, testée en conditions réelles via un protocole de recette structuré par blocs fonctionnels, couvrant la location de terminaux, la gestion des licences, la synchronisation d'infrastructure et les opérations SAV.

---

### 🔭 Vision (à venir)

Un espace magasin est envisagé à terme, pour permettre à chaque enseigne de consulter directement ses propres chiffres.

---

### 📷 Visuels

![Accueil BOMIQO](/projects/bomiqo/dashboard.png)
*Accueil : prêts en retard, licences arrivant à expiration, stock disponible et actions rapides (réception, nouveau terminal, recherche, inventaire).*

![Gestion location](/projects/bomiqo/gestion-location.png)
*Gestion location : chronologie des demandes de location par magasin, avec statuts (planifiée, expédiée, en retard, terminée).*

![Stock location](/projects/bomiqo/stock-location.png)
*Stock location : grille des terminaux destinés à la location, avec statut et compte à rebours de licence par appareil.*

![Réception](/projects/bomiqo/reception.png)
*Réception : scan d'un terminal retourné pour clôturer son prêt.*

![Prêts](/projects/bomiqo/prets.png)
*Prêts : terminaux prêtés hors circuit de location, avec échéances et retards.*

![Vente](/projects/bomiqo/vente.png)
*Vente : terminaux destinés à la vente, avec suivi de l'expiration de licence.*
