---
title: "BBSoft Gateway — Taking over and stabilizing a legacy product/price sync system"
date: 2026-07-30
tags: ["Delphi", "FireDAC", "PostgreSQL", "MSSQL", "FTP/CSV", "BBSoft", "Legacy"]
description: "Taking over existing software that moves products and prices between a store chain's BBSoft point of sale and its other systems: brought back under control, its updates made reliable, and its recurring bugs fixed."
image: "../images/pim-bbsoft-middleware/thumbnail.jpg"
services: [integration, maintenance]
---

## Context

A retail store chain uses a Windows application that links its point-of-sale software, BBSoft, with external systems. It syncs product data (items, categories, images, prices) in both directions, through file exchange.

I took over this existing software, built before me.

## The need

When I took it over, several things needed fixing:

- **no history of changes**: no way to know what had changed or to roll back when something went wrong;
- **inherited code with no tests and no documentation**, dense and poorly structured;
- **BBSoft updates that needed to be made reliable**;
- **promotions wrongly flagged as duplicates**;
- **recurring bugs** in image handling and with whitespace and formatting issues in the exchanged data.

## The solution

I started by putting the project under version control, with a structured history of changes: every change is traced, and it's possible to roll back if a change causes a problem.

Then I made the software reliable:

- **BBSoft updates** are safe: if an operation fails, it is cleanly cancelled instead of leaving half-written data behind;
- **change detection** no longer reports false positives, especially for duplicate promotions;
- **the recurring bugs** in image handling and data formatting are fixed.

## Features

- **Import into BBSoft**: items, categories, and prices from external systems update the BBSoft catalog.
- **Export from BBSoft**: BBSoft product data is distributed to external systems.
- **Promotions**: imported into BBSoft with more reliable duplicate detection.
- **Product images**: import and export, with image handling fixed.

## Results

A project that is now version-controlled and traceable, with more reliable BBSoft syncs (safe transactions, fixed duplicate detection) and the recurring image-handling and formatting bugs resolved.

## Under the hood

Windows application in Delphi (VCL), acting as middleware. Exchanges go through CSV files and FTP transfers.

| Flow | Direction | Technology | Details |
|------|-----------|------------|---------|
| Items, categories, prices | External → BBSoft (import) | FireDAC + FTP/CSV | Updates the BBSoft catalog from external files. |
| Product data | BBSoft → External (export) | FireDAC + FTP/CSV | Distributes BBSoft data to external systems. |
| Promotions | BBSoft import | PostgreSQL transactions | More reliable duplicate detection, false positives fixed. |
| Product images | Import/export | FTP + CSV | Bug fixes in image handling. |

### Architecture

Central data module (FireDAC, PostgreSQL/MSSQL) and a tabbed UI driving the External → BBSoft (import) and BBSoft → External (export) flows. Configuration persisted in INI files.

### Taking over the legacy code

- The project had never been under version control: the takeover began by setting up Git/GitHub, with a structured commit history.
- The inherited Delphi code was dense and unstructured, mixing French, Spanish, and English (UI, comments, identifiers), with a central module (`TdmMain`) holding all of the business logic.
- No tests and no documentation at the start.

### Technical challenges

- Making BBSoft updates reliable: PostgreSQL transactions, safety rollbacks, clean connection shutdown.
- Reliable change detection with no false positives, especially for duplicate promotions.
- Fixing recurring bugs in image handling and whitespace/formatting issues in the exchanged data.
