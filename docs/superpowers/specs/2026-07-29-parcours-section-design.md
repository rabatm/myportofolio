# Section Parcours — Spec Design

**Date :** 2026-07-29
**Feature :** Ajout d'une section "Formation & Parcours" sur la page d'accueil

---

## Contenu

Chronologie inversée (du plus récent au plus ancien), 6 entrées de 1996 à aujourd'hui. Données en dur dans le composant.

## Component

**Fichier :** `src/components/sections/Parcours.astro`

- Timeline avec séparateur `── année ──` en cyan `#00fff7`
- Puce `▌` devant le titre
- Entreprise en gris `#888` sous le titre
- Description en `#aaa`
- Mêmes classes que les autres sections (`.section-title`, `.card`)

## Placement

Dans `src/pages/index.astro`, entre `<APropos />` et `<Skills />`.
