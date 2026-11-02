---
title: "amiqo — The all-in-one app for childcare retail stores"
date: 2026-07-30
tags: ['Flutter', 'Dart', 'PostgreSQL', 'SQLite', 'Android', 'Childcare retail', 'Zebra', 'TC22', 'TC27', 'Sunmi L3', 'DataWedge', 'Offline-First', 'Baby registries', 'Goods receiving', 'Price checks', 'Inventory', 'BBSoft']
description: "One app, on the store's handheld terminals, for everything a childcare retail store does day to day: parents build their baby registry by scanning products, friends and family buy from it without duplicates, and staff use it for goods receiving, price checks, and inventory."
image: '../images/amiqo/thumbnail.png'
services: [mobile]
featured: 2
---

## Context

amiqo is a mobile app for childcare retail stores (shops selling baby gear and nursery products).

Parents use it to build their baby registry right in the store, by scanning products with a handheld terminal, and their friends can then come in and buy gifts without any risk of duplicates. Store staff use the same app for goods receiving, shelf price checks, and inventory.

The store manages its products, registries, and stock in its management software, BBSoft.

## The need

Two problems stood in the way:

- **The old app didn't work on the store's new terminals** (Zebra TC22/TC27 and Sunmi L3).
- **BBSoft offers no way in for other software**: there was no clean way to sync the data.

So the store needed an app that would let:

1. **parents** walk around the store with a terminal, scan the products they're interested in (one item per scan), and confirm their registry, which goes straight into BBSoft;
2. **friends** come in with the registry reference (e.g., "Jeanne Martin's registry"), find the items, and buy them without duplicates;
3. **staff** receive goods without re-entering anything, check the prices on display, and count stock on the shelves, even without a network.

## The solution

I built amiqo: a single app for all of these uses, running on both families of terminals. At startup, it recognizes the terminal on its own and reads barcodes the same way on both.

Since BBSoft offers no way in, amiqo reads and writes its data directly, over an encrypted connection. Every scan goes into BBSoft right away: stock and registries stay up to date with no re-entry.

When there's no network, for example in a warehouse without Wi-Fi, the app keeps everything on the terminal. If a sync fails, it picks up where it left off, from the last scanned item.

## Features

**For parents**

- **Scan a product**: one scan, one item added to the registry. An item can only appear once on a registry.
- **Confirm the registry**: the registry is sent straight to BBSoft.

**For friends**

- **Buy a gift from the registry**: items can be scanned or searched for.
- **Real-time status**: each item is "Available," "Reserved," or "Purchased." A purchased gift is marked "reserved" immediately, which prevents duplicates.

**For the store**

- **View registries**: around 100 items per registry.
- **Goods receiving**: scan delivered parcels and items, and BBSoft stock is updated with no manual re-entry.
- **Price checks**: scan an item on the shelf to read the current price and verify the displayed price.
- **Inventory**: physical stock counts, even without a network, synced automatically afterwards.

## Results

- **For parents**: a registry created in under 5 minutes, versus 20 minutes with the old solution. Zero errors: no more risk of forgetting an item.
- **For stores**: an app that is 100% compatible with the TC22/TC27 and the Sunmi L3, and sales staff who spend 40% less time managing registries by hand.
- **For store staff** (receiving, price checks, inventory): one terminal, one app for all day-to-day operations, with no manual re-entry into BBSoft.
- **For friends**: a smooth experience, with no duplicates to deal with.

## Under the hood

Flutter (Dart) app for Android, on Zebra TC22/TC27 (recent Android) and Sunmi L3 terminals.

| Action | Technology | Details |
|--------|------------|---------|
| Scan a product | Zebra DataWedge / Sunmi API | 1 scan = 1 item added to the registry. |
| Confirm the registry | PostgreSQL (BBSoft) | Sent directly after each scan. |
| View registries | Flutter + SQLite (local cache) | ~100 items per registry. |
| Buy a gift | Zebra/Sunmi terminal | Real-time status update. |
| Receive goods | Zebra DataWedge / Sunmi API | BBSoft stock update. |
| Check a price | Flutter + PostgreSQL (BBSoft) | Reads the current price. |
| Run an inventory | Offline mode + auto sync | Works without a network. |

### Integrating with BBSoft (without an API)

- BBSoft exposes no API to read or write data.
- Reverse engineering of the PostgreSQL schema (`produits`, `listes`, `stocks` tables).
- Direct connection from Dart using the `postgres` driver.
- Risks addressed: schema changes → regression tests; security → encrypted connection (SSL/TLS) and secured credentials.

### Multi-device compatibility

- Zebra TC22/TC27 → DataWedge (configured through Android intents).
- Sunmi L3 → Sunmi's native API (through their SDK).
- Automatic manufacturer detection at startup, and a scanner abstraction: a single interface for both types of terminals.

### Baby registries and offline mode

- Local SQLite cache for active registries, immediate sync with PostgreSQL after each scan.
- "Available" / "Reserved" / "Purchased" statuses, each item added only once per registry.
- Local SQLite storage (all registries and stock) for offline inventories.
- Checkpoint recovery: if a sync fails, it resumes from the last scanned item.

### Architecture

- Clean Architecture:
  - `domain`: use cases (e.g., `CreateBirthList`, `ScanProduct`);
  - `infrastructure`: PostgreSQL connection, SQLite cache, scanner abstraction;
  - `presentation`: Flutter UI designed for narrow screens (~320 dp).
- State management: Provider + GetIt (dependency injection).
- Error handling: `Either<Failure, T>` for explicit logic (e.g., a `Failure` when a product isn't found).

### Code samples

Scanner abstraction:

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

PostgreSQL connection:

```dart
final connection = PostgreSQLConnection(
  'host', 5432, 'database',
  username: 'user',
  password: 'pass',
  useSSL: true,
);
```
