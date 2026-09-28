---
title: "amiqo — The all-in-one app for childcare retail stores"
date: 2026-07-30
tags: ['Flutter', 'Dart', 'PostgreSQL', 'SQLite', 'Android', 'Childcare retail', 'Zebra', 'TC22', 'TC27', 'Sunmi L3', 'DataWedge', 'Offline-First', 'Baby registries', 'Goods receiving', 'Price checks', 'Inventory', 'BBSoft']
description: 'Flutter app for Zebra (TC22/TC27) and Sunmi L3 handheld terminals. Baby registries, goods receiving, price checks, and inventory in childcare retail stores. Direct integration with BBSoft through PostgreSQL (reverse engineering).'
image: '/projects/amiqo/thumbnail.png'
---

amiqo is a mobile app for childcare retail stores (shops selling baby gear and nursery products).
Parents use it to build their baby registry right in the store by scanning products with a handheld terminal, and friends can then come in and buy gifts without any risk of duplicates.
On the store side, the same app also serves staff for goods receiving, shelf price checks, and inventory.

---

### 👶 The business need

In a childcare retail store, parents:
1. Walk around with a handheld terminal (Zebra TC22/TC27 or Sunmi L3).
2. Scan the products they're interested in (1 item per scan).
3. Confirm their registry → it is sent straight to the BBSoft database.

Friends:
- Come to the store with the registry reference (e.g., "Jeanne Martin's registry").
- Scan or search for items on the registry to buy them.
- No duplicates: a purchased gift is marked as "reserved" in real time.

The initial problem:
- The old app was incompatible with the TC22/TC27 (recent Android) and the Sunmi L3.
- No BBSoft API → no clean way to sync the data.

Store staff use the same terminal for two other equally critical workflows:
- Goods receiving: scanning delivered parcels/items to update BBSoft stock without manual re-entry.
- Price checks and inventory: scanning on the shelf to verify displayed prices or run a physical stock count, including offline.

---

### 📦 Key features

| Actor  | Action | Technology | Details |
|-------------|------------|-----------------|------------|
| Parent | Scan a product | Zebra DataWedge / Sunmi API | 1 scan = 1 item added to the registry. |
| Parent | Confirm the registry | PostgreSQL (BBSoft) | Sent directly after each scan. |
| Store | View registries | Flutter + SQLite (local cache) | ~100 items per registry. |
| Friends | Buy a gift from the registry | Zebra/Sunmi terminal | Real-time status update. |
| Store | Receive goods | Zebra DataWedge / Sunmi API | Scan delivered parcels, update BBSoft stock. |
| Store | Check a price | Flutter + PostgreSQL (BBSoft) | Scan an item on the shelf, read the current price. |
| Store | Run an inventory | Offline mode + auto sync | Works even without a network. |

---

### ⚠️ Technical challenges

#### 1. Integrating with BBSoft (without an API)
- Problem: BBSoft exposes no API to read or write data.
- Solution:
  - Reverse engineering of the PostgreSQL schema (`produits`, `listes`, `stocks` tables).
  - Direct connection from Dart using the `postgres` driver.
  - Risks addressed:
    - Schema changes → regression tests.
    - Security → encrypted connection (SSL/TLS) + secured credentials.

#### 2. Multi-device compatibility
- Target hardware:
  - Zebra TC22/TC27 → DataWedge (configured through Android intents).
  - Sunmi L3 → Sunmi's native API (through their SDK).
- Solution:
  - Automatic manufacturer detection at startup.
  - Scanner abstraction: a single interface for both types of terminals.

#### 3. Managing baby registries
- Constraints:
  - ~100 items per registry.
  - No duplicates: an item can only be added once per registry.
  - Real-time status: "Available" / "Reserved" / "Purchased".
- Solution:
  - Local SQLite cache for active registries.
  - Immediate sync with PostgreSQL after each scan.

#### 4. Offline mode
- Problem: stores run inventories offline (e.g., in a warehouse without Wi-Fi).
- Solution:
  - Local SQLite storage (all registries + stock).
  - Checkpoint recovery: if a sync fails, it resumes from the last scanned item.

---

### 📈 Results
- For parents:
  - A registry created in < 5 min (vs. 20 min with the old solution).
  - Zero errors: no more risk of forgetting an item.
- For stores:
  - 100% compatible with the TC22/TC27 and Sunmi L3.
  - Time saved: sales staff spend 40% less time managing registries manually.
- For store staff (receiving, price checks, inventory):
  - One terminal, one app for all day-to-day operations, with no manual re-entry into BBSoft.
- For friends:
  - A smooth experience: no duplicates to deal with.

---

### 📷 Visuals
> *Photo 1: A Zebra TC27 terminal with amiqo open on the product scan screen (e.g., a stroller).*
> *Photo 2: A Sunmi L3 terminal showing a confirmed baby registry.*
> *Caption: "amiqo in action — scanning products for a baby registry in a childcare retail store."*

---

### 🏗️ Architecture
- Clean Architecture:
  - `domain`: use cases (e.g., `CreateBirthList`, `ScanProduct`).
  - `infrastructure`: PostgreSQL connection, SQLite cache, scanner abstraction.
  - `presentation`: Flutter UI designed for narrow screens (~320 dp).
- State management: Provider + GetIt (dependency injection).
- Error handling: `Either<Failure, T>` for explicit logic (e.g., a `Failure` when a product isn't found).

---

### 💻 Code samples

// Example: scanner abstraction
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

// Example: PostgreSQL connection
```dart
final connection = PostgreSQLConnection(
  'host', 5432, 'database',
  username: 'user',
  password: 'pass',
  useSSL: true,
);
```
