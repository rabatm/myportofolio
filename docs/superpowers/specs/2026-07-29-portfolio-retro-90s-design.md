# Portfolio Rétro 90s — Spec Design

**Date :** 2026-07-29
**Projet :** superior-star
**Stack :** Astro 7, Tailwind CSS 4, Content Collections (React installé mais inutilisé)
**Public :** Freelance + projet perso/créatif

---

## 1. Architecture

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── content/
│   │   ├── blog/          # Articles en MD
│   │   └── projects/      # Projets en MD (frontmatter YAML)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro        # Accueil scrollant
│   │   ├── projets.astro      # Grille complète
│   │   ├── projets/[slug].astro # Détail projet
│   │   ├── blog.astro         # Liste articles
│   │   ├── blog/[slug].astro  # Article complet
│   │   └── contact.astro      # Formulaire + liens
│   ├── components/
│   │   ├── retro/
│   │   │   ├── Scanlines.astro
│   │   │   ├── StarField.astro
│   │   │   └── Marquee.astro
│   │   └── sections/
│   │       ├── Hero.astro
│   │       ├── APropos.astro
│   │       ├── Skills.astro
│   │       └── ApercuProjets.astro
│   └── styles/
│       └── retro.css
```

**Pages :** Accueil scrollant (Hero + APropos + Skills + ApercuProjets) + pages dédiées pour Projets, Blog, Contact. 100% statique, zéro JS côté client sauf animations optionnelles.

---

## 2. Palette & Typographie

**Fond :** `#0a0a0a` (noir profond, ambiance Y2K/cyber)
**Accent :** `#00fff7` (cyan phosphorescent, vibe cyber/Y2K)
**Texte :** `#f0f0f0` (blanc cassé)
**Secondaire :** `#888888` (gris)
**Bordures :** Défilé de couleurs vives (Geocities rainbow)

**Titres :** `Space Grotesk` 700 (déjà importée)
**Corps :** `Space Grotesk` 400/500
**Alternate 90s :** Police bitmap optionnelle (type `Press Start 2P` via Google Fonts) pour accents décoratifs

---

## 3. Sections détaillées

### 3.1 Hero (index.astro)

- Nom complet en Space Grotesk bold, large
- Sous-titre en style terminal (`> Développeur créatif`)
- Boutons CTA : "Voir projets", "Me contacter" avec bordure double 3D rétro
- Arrière-plan : StarField (étoiles animées style Y2K) + effet scanlines CRT
- Effet de séparateur : ligne décorative `─── ✦ ───`

### 3.2 À Propos

- Photo + 2-3 paragraphes en flex row (stack sur mobile)
- Ton perso et décontracté (profil freelance créatif)
- Encadré type fenêtre 90s (bordure double ou relief)

### 3.3 Compétences

- Tags organisés par catégorie (Frontend, Backend, Design, Outils)
- Effet marquee Geocities au hover sur chaque tag
- Affichage compact, peut être inclus dans la section À propos sur la page d'accueil

### 3.4 Projets

Page d'accueil : aperçu des 4 derniers projets en grille 2×2.
Page dédiée `/projets` : grille complète.
Page détail `/projets/[slug]` : contenu Markdown.

- Chaque carte : screenshot + titre + tags compétences
- Bordure retro qui s'anime au hover (changement couleur, effet 3D)
- Collection Astro : fichiers `.md` dans `src/content/projects/`

### 3.5 Blog

Page liste `/blog` : articles par date décroissante, extrait + date + tags.
Page article `/blog/[slug]` : contenu Markdown stylé rétro.

- Content collections Astro : fichiers `.md` dans `src/content/blog/`
- Tags et date en frontmatter

### 3.6 Contact

Page `/contact` :
- Liens sociaux (GitHub, LinkedIn, etc.) avec émojis/SVG
- Formulaire style terminal : champs préfixés par `$`, bouton `[ ENVOYER > ]`

Formulaire statique — soit Formspree/Web3Forms (POST externe), soit Netlify Forms (selon déploiement).

---

## 4. Éléments rétro 90s

| Élément | Description | Origine stylistique |
|---------|-------------|---------------------|
| Scanlines | Filtre CSS lignes horizontales semi-transparentes sur le fond | CRT/Y2K |
| StarField | Étoiles animées en fond | Y2K/cyber |
| Marquee | Texte qui défile au hover | Geocities |
| Bordures rainbow | Couleurs vives alternées sur cartes/boutons | Geocities |
| Terminal prompt | `$` avant les labels de formulaire | Cyber |
| Boutons 3D | Bordures doubles, effet relief | Windows 95/early web |

---

## 5. Contenu (Content Collections)

Deux collections Astro :

```yaml
# src/content/projects/mon-projet.md
---
title: "Nom du projet"
date: 2026-06-01
tags: ["React", "Node.js", "Tailwind"]
image: "/images/projet-1.jpg"
description: "Courte description"
url: "https://exemple.com"
github: "https://github.com/..."
---
Contenu détaillé...
```

```yaml
# src/content/blog/mon-article.md
---
title: "Titre article"
date: 2026-07-15
tags: ["dev", "rétro"]
description: "Extrait"
---
Contenu...
```

---

## 6. Non-fonctionnel

- 100% statique — déploiement sur Netlify ou Cloudflare Pages
- SEO : meta tags, Open Graph, sitemap automatique Astro
- Responsive : desktop → mobile
- Pas de React, pas de JavaScript client sauf animations CSS
