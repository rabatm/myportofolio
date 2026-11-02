---
title: "Minouche — Connecting the ERP and the e-commerce site"
date: 2026-06-01
tags: ["Python", "SQLAlchemy", "PostgreSQL", "Hexagonal Architecture", "BBSoft"]
description: "A gateway that moves products, photos, and payments between Minouche's store software and its e-commerce site, in both directions, to keep the two consistent and reduce duplicate data entry."
image: "../images/minouche-sync/thumbnail.png"
services: [integration]
featured: 3
---

## Context

Minouche runs its store with management software, BBSoft. When it launched its e-commerce site, Minouche needed to connect two systems that were never designed to work together: BBSoft on one side, its e-commerce platform on the other. Each has its own way of organizing data and its own rules.

## The need

Keep information consistent between the store and the site, without forcing staff to change the way they work or to enter data by hand.

With one specific requirement about money: the customer's cash fund (*cagnotte*), calculated from payments and refunds, had to stay accurate to the cent.

## The solution

I built a sync gateway between BBSoft and the e-commerce platform that moves data in both directions. It acts as the intermediary between the two systems and translates the data so each one can understand it.

The main goal was to make the two systems complement each other, rather than asking staff to do the work twice. In particular, the gateway:

- reduces duplicate data entry;
- keeps data consistent between the store and the site;
- automates payment exchanges;
- syncs product information and photos;
- keeps BBSoft as the day-to-day management tool.

## Features

- **Products and lists**: changes made in BBSoft are detected and pushed to the site.
- **Online payments**: payments made on the site are retrieved and recorded in BBSoft.
- **In-store payments**: payments made in the shop are sent to the site.
- **Photos**: product images are synced along with their display order.
- **Customer cash fund**: calculated from the payments and refunds recorded in BBSoft, accurate to the cent.
- **Only what has changed**: the gateway only sends the items that have changed, without reprocessing all the data on every sync.

## Under the hood

**Python 3.13 · SQLAlchemy 2.0 · PostgreSQL · Pytest · uv**

### Connecting two different systems

BBSoft (the ERP) and the e-commerce platform each have their own data model. The gateway connects to the e-commerce platform's API and transforms the data in both directions.

### Reliable financial data

Amounts are handled without converting them to floating-point numbers, to avoid rounding errors during calculations and exchanges.

### Incremental sync

The gateway detects changes based on the data available in BBSoft, so it only sends the items that have changed.

### Architecture

The project is built on a hexagonal architecture that separates the business logic from the technical systems it communicates with. The sync logic can therefore be tested independently of PostgreSQL or the external API, and the gateway is easier to evolve if one of the connected systems changes.

SQLAlchemy is used with imperative mapping to keep a clear separation between the domain model and data persistence.
