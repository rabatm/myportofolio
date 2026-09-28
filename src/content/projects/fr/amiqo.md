---
title: "amiqo — L'appli tout-en-un des magasins de périculture"
date: 2026-07-30
tags: ['Flutter', 'Dart', 'PostgreSQL', 'SQLite', 'Android', 'Périculture', 'Zebra', 'TC22', 'TC27', 'Sunmi L3', 'DataWedge', 'Offline-First', 'Listes de naissance', 'Réception marchandise', 'Relevé de prix', 'Inventaire', 'BBSoft']
description: 'Application Flutter pour terminaux Zebra (TC22/TC27) et Sunmi L3. Listes de naissance, réception de marchandise, relevé de prix et inventaire en magasin de périculture. Intégration directe avec BBSoft via PostgreSQL (reverse engineering).'
image: '/projects/amiqo/thumbnail.png'
---

amiqo est une application mobile pour les magasins de périculture.
Elle permet aux parents de créer leur liste de naissance directement en magasin en scannant les produits avec un terminal, et aux amis de venir acheter les cadeaux sans risque de doublon.
Côté magasin, la même application sert aussi au personnel pour la réception de marchandise, le relevé de prix en rayon et l'inventaire.

---

### 👶 Le besoin métier

Dans un magasin de périculture, les parents :
1. Se baladent avec un terminal (Zebra TC22/TC27 ou Sunmi L3).
2. Scannent les produits qui les intéressent (1 article par scan).
3. Valident leur liste → celle-ci est envoyée directement à la base BBSoft.

Les amis :
- Viennent en magasin avec la référence de la liste (ex: "Liste Jeanne Martin").
- Scannent ou recherchent les articles de la liste pour les acheter.
- Pas de doublon : un cadeau acheté est marqué comme "réservé" en temps réel.

Problème initial :
- L’ancienne application était incompatible avec les TC22/TC27 (Android récent) et les Sunmi L3.
- Pas d’API BBSoft → impossible de synchroniser les données proprement.

Le personnel magasin utilise le même terminal pour deux autres flux tout aussi centraux :
- Réception de marchandise : scan des colis/articles livrés pour mettre à jour le stock BBSoft sans ressaisie manuelle.
- Relevé de prix et inventaire : scan en rayon pour vérifier les prix affichés ou faire le comptage physique du stock, y compris hors ligne.

---

### 📦 Fonctionnalités clés

| Acteur  | Action | Technologie | Détail |
|-------------|------------|-----------------|------------|
| Parent | Scan un produit | Zebra DataWedge / Sunmi API | 1 scan = 1 article ajouté à la liste. |
| Parent | Valider la liste | PostgreSQL (BBSoft) | Envoi direct après chaque scan. |
| Magasin | Consulter les listes | Flutter + SQLite (cache local) | ~100 articles par liste. |
| Amis | Acheter un cadeau de la liste | Terminal Zebra/Sunmi | Mise à jour en temps réel du statut. |
| Magasin | Réceptionner la marchandise | Zebra DataWedge / Sunmi API | Scan des colis livrés, mise à jour du stock BBSoft. |
| Magasin | Relever un prix | Flutter + PostgreSQL (BBSoft) | Scan d'un article en rayon, lecture du prix courant. |
| Magasin | Faire un inventaire | Mode offline + sync auto | Fonctionne même sans réseau. |

---

### ⚠️ Défis techniques

#### 1. Intégration avec BBSoft (sans API)
- Problème : BBSoft n’expose aucune API pour lire/écrire les données.
- Solution :
  - Reverse engineering du schéma PostgreSQL (tables `produits`, `listes`, `stocks`).
  - Connexion directe en Dart via le driver `postgres`.
  - Risques gérés :
    - Changements de schéma → tests de non-régression.
    - Sécurité → connexion chiffrée (SSL/TLS) + credentials sécurisés.

#### 2. Compatibilité multi-terminaux
- Matériel cible :
  - Zebra TC22/TC27 → Utilisation de DataWedge (configuration via intent Android).
  - Sunmi L3 → Utilisation de l’API native Sunmi (via leur SDK).
- Solution :
  - Détection automatique du fabricant au démarrage.
  - Abstraction du scanner : une seule interface pour les deux types de terminaux.

#### 3. Gestion des listes de naissance
- Contraintes :
  - ~100 articles par liste.
  - Pas de doublon : un article ne peut être ajouté qu’une fois par liste.
  - Statut en temps réel : "Disponible" / "Réservé" / "Acheté".
- Solution :
  - Cache SQLite local pour les listes en cours.
  - Synchronisation immédiate avec PostgreSQL après chaque scan.

#### 4. Mode offline
- Problème : Les magasins font des inventaires hors ligne (ex: entrepôt sans Wi-Fi).
- Solution :
  - Stockage local SQLite (toutes les listes + stocks).
  - Reprise sur point de contrôle : si la sync échoue, elle reprend au dernier article scanné.

---

### 📈 Résultats
- Pour les parents :
  - Création d’une liste en < 5 min (vs. 20 min avec l’ancienne solution).
  - Zéro erreur : plus de risque d’oublier un article.
- Pour les magasins :
  - 100% compatible avec les TC22/TC27 et Sunmi L3.
  - Gain de temps : les vendeurs passent 40% moins de temps à gérer les listes manuellement.
- Pour le personnel magasin (réception, relevé de prix, inventaire) :
  - Un seul terminal, une seule appli pour toutes les opérations courantes, sans ressaisie manuelle dans BBSoft.
- Pour les amis :
  - Expérience fluide : pas besoin de gérer des doublons.

---

### 📷 Visuels
> *Photo 1 : Un terminal Zebra TC27 avec amiqo ouvert sur l’écran de scan d’un produit (ex: poussette).*
> *Photo 2 : Un terminal Sunmi L3 affichant une liste de naissance validée.*
> *Légende : "amiqo en action — scan de produits pour liste de naissance, magasin de périculture."*

---

### 🏗️ Architecture
- Clean Architecture :
  - `domain` : Cas d’usage (ex: `CreateBirthList`, `ScanProduct`).
  - `infrastructure` : Connexion PostgreSQL, cache SQLite, abstraction des scanners.
  - `presentation` : UI Flutter adaptée aux écrans étroits (~320 dp).
- Gestion d’état : Provider + GetIt (injection de dépendances).
- Gestion d’erreur : `Either<Failure, T>` pour une logique explicite (ex: `Failure` si produit introuvable).

---

### 💻 Extraits de code

// Exemple : Abstraction du scanner
```dart
abstract class Scanner {
  Stream<String> scanBarcode();
}

class ZebraScanner implements Scanner {
  // Utilise DataWedge
}

class SunmiScanner implements Scanner {
  // Utilise Sunmi Scanner SDK
}
```

// Exemple : Connexion PostgreSQL
```dart
final connection = PostgreSQLConnection(
  'host', 5432, 'database',
  username: 'user',
  password: 'pass',
  useSSL: true,
);
```
