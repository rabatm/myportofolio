---
title: "amiqo — L'appli tout-en-un des magasins de périculture"
date: 2026-07-30
tags: ['Flutter', 'Dart', 'PostgreSQL', 'SQLite', 'Android', 'Périculture', 'Zebra', 'TC22', 'TC27', 'Sunmi L3', 'DataWedge', 'Offline-First', 'Listes de naissance', 'Réception marchandise', 'Relevé de prix', 'Inventaire', 'BBSoft']
description: "Une seule application, sur les terminaux du magasin, pour tout le quotidien d'un magasin de périculture : les parents créent leur liste de naissance en scannant les produits, les proches l'achètent sans doublon, et le personnel s'en sert pour la réception, les prix et l'inventaire."
image: '../images/amiqo/thumbnail.png'
services: [mobile]
featured: 2
---

## Contexte

amiqo est une application mobile pour les magasins de périculture.

Les parents y créent leur liste de naissance directement en magasin, en scannant les produits avec un terminal, et leurs amis viennent ensuite acheter les cadeaux sans risque de doublon. Le personnel se sert de la même application pour la réception de marchandise, le relevé de prix en rayon et l'inventaire.

Le magasin gère ses produits, ses listes et son stock dans son logiciel de gestion, BBSoft.

## Le besoin

Deux problèmes bloquaient :

- **L'ancienne application ne fonctionnait pas sur les nouveaux terminaux** du magasin (Zebra TC22/TC27 et Sunmi L3).
- **BBSoft ne prévoit aucune porte d'entrée pour d'autres logiciels** : impossible de synchroniser les données proprement.

Il fallait donc une application qui permette :

1. **aux parents** de se balader dans le magasin terminal en main, de scanner les produits qui les intéressent (un article par scan) et de valider leur liste, envoyée directement dans BBSoft ;
2. **aux amis** de venir avec la référence de la liste (par exemple « Liste Jeanne Martin »), de retrouver les articles et de les acheter sans doublon ;
3. **au personnel** de réceptionner la marchandise sans ressaisie, de vérifier les prix affichés et de compter le stock en rayon, y compris sans réseau.

## La solution

J'ai développé amiqo : une seule application pour tous ces usages, qui fonctionne sur les deux familles de terminaux. Au démarrage, elle reconnaît le terminal toute seule et lit les codes-barres de la même façon sur les deux.

Comme BBSoft n'offre pas de porte d'entrée, amiqo lit et écrit directement dans ses données, avec une connexion chiffrée. Chaque scan part aussitôt dans BBSoft : le stock et les listes restent à jour sans ressaisie.

Quand le réseau manque, par exemple dans un entrepôt sans Wi-Fi, l'application garde tout sur le terminal. Si une synchronisation échoue, elle reprend là où elle s'était arrêtée, au dernier article scanné.

## Fonctionnalités

**Pour les parents**

- **Scan d'un produit** : un scan, un article ajouté à la liste. Un article ne peut figurer qu'une fois dans une liste.
- **Validation de la liste** : la liste est envoyée directement dans BBSoft.

**Pour les amis**

- **Achat d'un cadeau de la liste** : les articles se scannent ou se recherchent.
- **Statut en temps réel** : chaque article est « Disponible », « Réservé » ou « Acheté ». Un cadeau acheté est marqué « réservé » aussitôt, ce qui évite les doublons.

**Pour le magasin**

- **Consultation des listes** : environ 100 articles par liste.
- **Réception de marchandise** : scan des colis et articles livrés, stock BBSoft mis à jour sans ressaisie manuelle.
- **Relevé de prix** : scan d'un article en rayon pour lire le prix courant et vérifier le prix affiché.
- **Inventaire** : comptage physique du stock, même sans réseau, avec synchronisation automatique ensuite.

## Résultats

- **Pour les parents** : une liste créée en moins de 5 minutes, contre 20 minutes avec l'ancienne solution. Zéro erreur : plus de risque d'oublier un article.
- **Pour les magasins** : une application 100 % compatible avec les TC22/TC27 et les Sunmi L3, et des vendeurs qui passent 40 % de temps en moins à gérer les listes à la main.
- **Pour le personnel** (réception, relevé de prix, inventaire) : un seul terminal, une seule appli pour toutes les opérations courantes, sans ressaisie manuelle dans BBSoft.
- **Pour les amis** : une expérience fluide, sans doublons à gérer.

## Côté technique

Application Flutter (Dart) pour Android, sur terminaux Zebra TC22/TC27 (Android récent) et Sunmi L3.

| Action | Technologie | Détail |
|--------|-------------|--------|
| Scanner un produit | Zebra DataWedge / API Sunmi | 1 scan = 1 article ajouté à la liste. |
| Valider la liste | PostgreSQL (BBSoft) | Envoi direct après chaque scan. |
| Consulter les listes | Flutter + SQLite (cache local) | ~100 articles par liste. |
| Acheter un cadeau | Terminal Zebra/Sunmi | Mise à jour du statut en temps réel. |
| Réceptionner la marchandise | Zebra DataWedge / API Sunmi | Mise à jour du stock BBSoft. |
| Relever un prix | Flutter + PostgreSQL (BBSoft) | Lecture du prix courant. |
| Faire un inventaire | Mode offline + sync auto | Fonctionne sans réseau. |

### Intégration avec BBSoft (sans API)

- BBSoft n'expose aucune API pour lire ou écrire les données.
- Reverse engineering du schéma PostgreSQL (tables `produits`, `listes`, `stocks`).
- Connexion directe en Dart via le driver `postgres`.
- Risques gérés : changements de schéma → tests de non-régression ; sécurité → connexion chiffrée (SSL/TLS) et credentials sécurisés.

### Compatibilité multi-terminaux

- Zebra TC22/TC27 → DataWedge (configuration via intent Android).
- Sunmi L3 → API native Sunmi (via leur SDK).
- Détection automatique du fabricant au démarrage, et abstraction du scanner : une seule interface pour les deux types de terminaux.

### Listes de naissance et mode offline

- Cache SQLite local pour les listes en cours, synchronisation immédiate avec PostgreSQL après chaque scan.
- Statuts « Disponible » / « Réservé » / « Acheté », un article ajouté une seule fois par liste.
- Stockage local SQLite (toutes les listes et les stocks) pour les inventaires hors ligne.
- Reprise sur point de contrôle : si la sync échoue, elle reprend au dernier article scanné.

### Architecture

- Clean Architecture :
  - `domain` : cas d'usage (ex. `CreateBirthList`, `ScanProduct`) ;
  - `infrastructure` : connexion PostgreSQL, cache SQLite, abstraction des scanners ;
  - `presentation` : UI Flutter adaptée aux écrans étroits (~320 dp).
- Gestion d'état : Provider + GetIt (injection de dépendances).
- Gestion d'erreur : `Either<Failure, T>` pour une logique explicite (ex. `Failure` si produit introuvable).

### Extraits de code

Abstraction du scanner :

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

Connexion PostgreSQL :

```dart
final connection = PostgreSQLConnection(
  'host', 5432, 'database',
  username: 'user',
  password: 'pass',
  useSSL: true,
);
```
