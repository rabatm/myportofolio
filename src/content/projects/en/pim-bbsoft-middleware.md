---
title: "BBSoft Gateway — Taking over and stabilizing a legacy product/price sync system"
date: 2026-07-30
tags: ["Delphi", "FireDAC", "PostgreSQL", "MSSQL", "FTP/CSV", "BBSoft", "Legacy"]
description: "Delphi middleware handling two-way sync of products and prices between the BBSoft point-of-sale system and external systems, through CSV file exchange and FTP transfers."
image: "/projects/pim-bbsoft-middleware/thumbnail.jpg"
---

This project is a Windows application (Delphi VCL) that acts as middleware for a retail store chain. It syncs product data (items, categories, images, prices) between the BBSoft point-of-sale software and external systems, through CSV file exchange and FTP transfers.

---

### 🔧 Background

The project had never been under version control. The takeover began by setting up Git/GitHub versioning, with a structured commit history to trace changes and roll back in case of regressions.

The inherited Delphi code was dense and unstructured, mixing French, Spanish, and English (UI, comments, identifiers), with a central module (`TdmMain`) holding all of the business logic.

---

### ⚙️ Key features

| Flow | Direction | Technology | Details |
|------|------|-------------|--------|
| Items, categories, prices | External → BBSoft (import) | FireDAC + FTP/CSV | Updates the BBSoft catalog from external files. |
| Product data | BBSoft → External (export) | FireDAC + FTP/CSV | Distributes BBSoft data to external systems. |
| Promotions | BBSoft import | PostgreSQL transactions | More reliable duplicate detection, false positives fixed. |
| Product images | Import/export | FTP + CSV | Bug fixes in image handling. |

---

### 🏗️ Architecture

Central data module (FireDAC, PostgreSQL/MSSQL) + a tabbed UI driving the External → BBSoft (import) and BBSoft → External (export) flows. Configuration persisted in INI files.

---

### ⚠️ Technical challenges

- Getting to grips with inherited code that had no tests and no documentation.
- Making BBSoft updates reliable: PostgreSQL transactions, safety rollbacks, clean connection shutdown.
- Reliable change detection with no false positives, especially for duplicate promotions.
- Fixing recurring bugs in image handling and whitespace/formatting issues in the exchanged data.

---

### 📈 Result

A project that is now version-controlled and traceable, with more reliable BBSoft syncs (safe transactions, fixed duplicate detection) and the recurring image-handling and formatting bugs resolved.
