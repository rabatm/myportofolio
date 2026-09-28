---
title: "Minouche — Connecting the ERP and the e-commerce site"
date: 2026-06-01
tags: ["Python", "SQLAlchemy", "PostgreSQL", "Hexagonal Architecture", "BBSoft"]
description: "A two-way sync gateway between Minouche's ERP and its e-commerce site."
image: "/projects/minouche-sync/thumbnail.png"
---

## The need

When it launched its e-commerce site, Minouche needed to connect two systems that were never designed to work together: its store management software, BBSoft, and its e-commerce platform.

The challenge was to keep information consistent between the store and the site, without forcing staff to change the way they work or to enter data by hand.

## The solution

I built a two-way sync gateway between BBSoft and the e-commerce platform's API.

It automates data exchange in both directions:

- **Products and lists**: changes made in BBSoft are detected and pushed to the site.
- **Online payments**: payments made on the site are retrieved and recorded in BBSoft.
- **In-store payments**: payments made in the shop are sent to the site.
- **Photos**: product images are synced along with their display order.

The gateway also handles calculating the customer balance (the *cagnotte*, a stored-value fund), based on the payments and refunds recorded in the ERP.

## What it delivers

The main goal was to make the two systems complement each other rather than asking staff to do the work twice.

In particular, the solution:

- reduces duplicate data entry;
- keeps data consistent between the store and the site;
- automates payment exchanges;
- syncs product information and photos;
- keeps BBSoft as the day-to-day management tool.

## The challenges

### Connecting two different systems

BBSoft and the e-commerce platform each have their own data model and their own rules.

The gateway acts as the intermediary between these two environments and transforms the data so each system can understand it.

### Guaranteeing the reliability of financial data

The customer balance calculation had to stay accurate to the cent.

Amounts are therefore handled without converting them to floating-point numbers, to avoid rounding errors during calculations and exchanges.

### Syncing only what has changed

The gateway detects changes based on the data available in BBSoft, so it only sends the items that have changed.

This avoids needlessly reprocessing the entire dataset on every sync.

## Architecture

The project is built on a hexagonal architecture to separate the business logic from the technical systems it communicates with.

The sync logic can therefore be tested independently of PostgreSQL or the external API.

This approach also makes it easier to evolve the gateway if one of the connected systems changes.

## Tech stack

**Python 3.13 · SQLAlchemy 2.0 · PostgreSQL · Pytest · uv**

SQLAlchemy is used with imperative mapping to keep a clear separation between the domain model and data persistence.
