---
title: "Visage Detector — Validation de photos par détection de visage"
date: 2026-06-01
tags: ["Python", "face_recognition", "Computer Vision"]
description: "Script Python de validation des photos de profil par détection de visage."
image: "/projects/rd.jpg"
---

Un petit utilitaire écrit en Python utilisant la librairie `face_recognition` (basée sur dlib) pour analyser en lot un dossier d'images (jpg/png/webp) et déterminer lesquelles contiennent un visage détectable.

Le script imprime un résumé de validité pour chaque image, permettant de pré-filtrer des photos de profil (étudiants, utilisateurs) avant leur acceptation sur une plateforme. Il utilise le modèle de détection HOG avec suréchantillonnage pour améliorer la précision sur du matériel standard, sans nécessiter de GPU.
