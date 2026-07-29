# Portfolio Rétro 90s — Martin

Portfolio développé avec [Astro](https://astro.build) 7, Tailwind CSS 4, React 19 et Bun.

## Ajouter du contenu

### Parcours (timeline carrière)

Fichier : `src/data/parcours.ts`

```ts
{
  periode: "2024—2025",
  titre: "Ton poste",
  entreprise: "Nom de l'entreprise",
  desc: "Description de ce que tu as fait.",
}
```

Les entrées s'affichent dans l'ordre du tableau (de la plus récente à la plus ancienne).

### Compétences

Fichier : `src/data/skills.ts`

```ts
export const skills: Record<string, string[]> = {
  Frontend: ["HTML", "CSS", "JavaScript"],
  Backend: ["Node.js", "Python"],
  Design: ["Figma"],
  Outils: ["Git", "VS Code"],
};
```

Ajoute/modifie des catégories et des listes de compétences librement.

### Projets

Crée un fichier `.md` dans `src/content/projects/` :

```md
---
title: "Nom du projet"
date: 2026-07-20
tags: ["React", "Node.js"]
description: "Courte description du projet."
image: "/projects/photo.jpg"   # optionnel, met l'image dans public/projects/
url: "https://exemple.com"      # optionnel
github: "https://github.com/..." # optionnel
---

Description détaillée en Markdown…
```

Les projets s'affichent du plus récent au plus ancien.

### Articles de blog

Crée un fichier `.md` dans `src/content/blog/` :

```md
---
title: "Titre de l'article"
date: 2026-07-29
tags: ["dev", "rétro"]
description: "Accroche de l'article."
---

## Contenu

Ton article en Markdown…
```

## Développement

```bash
bun install
bun run dev        # serveur local sur localhost:4321
bun run build      # build de production dans dist/
bun run preview    # prévisualisation du build
```

Le mode dev se lance en arrière-plan avec `astro dev --background`.
