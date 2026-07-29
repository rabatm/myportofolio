# Portfolio Rétro 90s — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a retro 90s-inspired portfolio site in Astro 7 with Tailwind CSS 4.

**Architecture:** Static site with Content Collections for projects/blog. Single scrollable homepage + dedicated pages. Zero client JS except CSS animations.

**Tech Stack:** Astro 7, Tailwind CSS 4, Content Collections, Space Grotesk font

## Global Constraints

- No client JavaScript (React installed but unused)
- Tailwind CSS 4 via `@tailwindcss/vite` (already configured)
- Content collections in `src/content/` for projects and blog
- Accent color: `#00fff7` (cyan)
- Background: `#0a0a0a`
- Text: `#f0f0f0`
- All content in French
- Responsive: desktop → mobile

---

## File Structure

```
src/
├── content/
│   ├── config.ts
│   ├── projects/
│   │   └── exemple-projet.md
│   └── blog/
│       └── premier-article.md
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro
│   ├── projets.astro
│   ├── projets/[slug].astro
│   ├── blog.astro
│   ├── blog/[slug].astro
│   └── contact.astro
├── components/
│   ├── retro/
│   │   ├── Scanlines.astro
│   │   ├── StarField.astro
│   │   └── Marquee.astro
│   └── sections/
│       ├── Hero.astro
│       ├── APropos.astro
│       ├── Skills.astro
│       └── ApercuProjets.astro
└── styles/
    └── retro.css
```

---

### Task 1: Global Setup — retro.css, BaseLayout, nav & footer

**Files:**
- Create: `src/styles/retro.css`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (replace with minimal shell)
- Delete: `src/components/Welcome.astro`
- Delete: `src/assets/astro.svg`
- Delete: `src/assets/background.svg`
- Delete: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/retro.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: 'Space Grotesk', sans-serif;
    background-color: #0a0a0a;
    color: #f0f0f0;
    margin: 0;
  }
}

@layer components {
  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.15) 4px
    );
  }
  .retro-border {
    border: 2px solid #00fff7;
    box-shadow:
      inset -2px -2px 0 0 #00fff7,
      2px 2px 0 0 #00fff7;
  }
  .retro-border:hover {
    box-shadow:
      inset 2px 2px 0 0 #ff00ff,
      -2px -2px 0 0 #ff00ff,
      0 0 12px #00fff7;
    border-color: #ff00ff;
  }
  .star {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #fff;
    border-radius: 50%;
    animation: twinkle var(--duration) ease-in-out infinite;
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  .marquee {
    overflow: hidden;
    white-space: nowrap;
  }
  .marquee:hover .marquee-inner {
    animation: marquee 4s linear infinite;
  }
  .terminal-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid #00fff7;
    color: #f0f0f0;
    font-family: 'Space Grotesk', monospace;
    outline: none;
    width: 100%;
    padding: 4px 0;
  }
  .terminal-input:focus {
    border-bottom-color: #ff00ff;
  }
  .btn-retro {
    display: inline-block;
    padding: 8px 24px;
    background: transparent;
    color: #00fff7;
    border: 2px solid #00fff7;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.15s;
  }
  .btn-retro:hover {
    background: #00fff7;
    color: #0a0a0a;
    box-shadow: 0 0 16px #00fff7;
  }
  .section-title {
    font-size: 2rem;
    font-weight: 700;
    color: #00fff7;
    margin: 0 0 2rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .section-title::before {
    content: '╔══ ';
  }
  .section-title::after {
    content: ' ══╗';
  }
  .card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #333;
    padding: 1.5rem;
    transition: all 0.2s;
  }
  .card:hover {
    border-color: #00fff7;
    box-shadow: 0 0 16px rgba(0, 255, 247, 0.15);
  }
}
```

- [ ] **Step 2: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/retro.css';

export interface Props {
  title: string;
  description?: string;
}

const { title, description = "Portfolio rétro années 90" } = Astro.props;
---

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <style>@import "tailwindcss";</style>
  </head>
  <body class="min-h-screen">
    <div class="scanlines"></div>

    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style="background: rgba(10,10,10,0.85); border-bottom: 1px solid #333;">
      <a href="/" class="text-xl font-bold" style="color: #00fff7;">M</a>
      <div class="flex gap-6 text-sm">
        <a href="/" class="hover:underline" style="color: #888;">Accueil</a>
        <a href="/projets" class="hover:underline" style="color: #888;">Projets</a>
        <a href="/blog" class="hover:underline" style="color: #888;">Blog</a>
        <a href="/contact" class="hover:underline" style="color: #888;">Contact</a>
      </div>
    </nav>

    <main>
      <slot />
    </main>

    <footer class="text-center py-8" style="color: #555; border-top: 1px solid #222;">
      <p class="text-sm">© 2026 — Portofolio rétro 90s</p>
    </footer>
  </body>
</html>
```

- [ ] **Step 3: Clean up starter files**

Delete: `src/components/Welcome.astro`, `src/assets/astro.svg`, `src/assets/background.svg`, `src/styles/global.css`

- [ ] **Step 4: Replace `src/pages/index.astro` with minimal shell**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Portfolio rétro 90s">
  <div class="relative">
    <!-- Task 3 will fill sections here -->
  </div>
</BaseLayout>
```

- [ ] **Step 5: Remove old Layout.astro**

Delete `src/layouts/Layout.astro` (replaced by BaseLayout).

- [ ] **Step 6: Commit**

```bash
git add src/styles/retro.css src/layouts/BaseLayout.astro src/pages/index.astro && \
git rm src/components/Welcome.astro src/assets/astro.svg src/assets/background.svg src/styles/global.css src/layouts/Layout.astro && \
git commit -m "feat: add retro.css, BaseLayout, clean up starter files"
```

---

### Task 2: Retro Decor Components — Scanlines, StarField, Marquee

**Files:**
- Create: `src/components/retro/Scanlines.astro`
- Create: `src/components/retro/StarField.astro`
- Create: `src/components/retro/Marquee.astro`

- [ ] **Step 1: Create `src/components/retro/Scanlines.astro`**

```astro---
---

<div class="scanlines"></div>
```

- [ ] **Step 2: Create `src/components/retro/StarField.astro`**

```astro---
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: `star-${i}`,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  duration: `${2 + Math.random() * 4}s`,
  delay: `${Math.random() * 4}s`,
}));
---

<div class="fixed inset-0 overflow-hidden pointer-events-none" style="z-index: 0;">
  {stars.map(s => (
    <div
      class="star"
      style={{
        left: s.left,
        top: s.top,
        width: `${s.size}px`,
        height: `${s.size}px`,
        '--duration': s.duration,
        animationDelay: s.delay,
      }}
    ></div>
  ))}
</div>
```

- [ ] **Step 3: Create `src/components/retro/Marquee.astro`**

```astro---
export interface Props {
  items: string[];
}

const { items } = Astro.props;
---

<div class="marquee">
  <span class="marquee-inner inline-block">
    {items.map(item => `${item}  •  `).join('')}
  </span>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/retro/ && git commit -m "feat: add Scanlines, StarField, Marquee components"
```

---

### Task 3: Homepage — Hero, APropos, Skills, ApercuProjets

**Files:**
- Create: `src/components/sections/Hero.astro`
- Create: `src/components/sections/APropos.astro`
- Create: `src/components/sections/Skills.astro`
- Create: `src/components/sections/ApercuProjets.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/Hero.astro`**

```astro---
import StarField from '../retro/StarField.astro';
---

<section class="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
  <StarField />
  <p class="text-sm mb-4" style="color: #555;">✦ . * . ☉ . * . ✦</p>
  <h1 class="text-5xl md:text-7xl font-bold mb-4" style="color: #f0f0f0;">
    Prénom Nom
  </h1>
  <p class="text-lg md:text-xl mb-2 font-mono" style="color: #00fff7;">
    &gt; Développeur créatif
  </p>
  <p class="text-md mb-8 font-mono" style="color: #888;">
    &gt; Freelance basé à ...
  </p>
  <div class="flex gap-4">
    <a href="/projets" class="btn-retro">Voir projets</a>
    <a href="/contact" class="btn-retro">Me contacter</a>
  </div>
  <p class="mt-16 text-sm" style="color: #444;">─── ✦ ─── ✦ ─── ✦ ───</p>
</section>
```

- [ ] **Step 2: Create `src/components/sections/APropos.astro`**

```astro---
---

<section class="px-4 py-20 max-w-3xl mx-auto">
  <h2 class="section-title">À propos</h2>
  <div class="flex flex-col md:flex-row gap-8 items-start">
    <div class="w-32 h-32 shrink-0 retro-border rounded-full overflow-hidden flex items-center justify-center" style="background: #111;">
      <span class="text-4xl" style="color: #00fff7;">👤</span>
    </div>
    <div>
      <p class="mb-4 leading-relaxed" style="color: #ccc;">
        Passionné par le développement web et le design rétro, je crée des expériences
        numériques uniques qui marient esthétique vintage et technologies modernes.
      </p>
      <p class="leading-relaxed" style="color: #ccc;">
        Freelance basé à ..., je travaille avec des clients créatifs pour donner vie
        à leurs idées — du site vitrine à l'application web complète.
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `src/components/sections/Skills.astro`**

```astro---
import Marquee from '../retro/Marquee.astro';

const skills = {
  Frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Astro", "Tailwind"],
  Backend: ["Node.js", "Python", "API REST"],
  Design: ["Figma", "UI/UX", "Design rétro"],
  Outils: ["Git", "VS Code", "Bun"],
};
---

<section class="px-4 py-20 max-w-3xl mx-auto">
  <h2 class="section-title">Compétences</h2>
  <div class="space-y-6">
    {Object.entries(skills).map(([category, items]) => (
      <div>
        <h3 class="text-sm font-bold mb-2 font-mono" style="color: #00fff7;">
          &gt; {category}
        </h3>
        <div class="card">
          <Marquee items={items} />
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Create `src/components/sections/ApercuProjets.astro`**

```astro---
import type { CollectionEntry } from 'astro:content';

export interface Props {
  projects: CollectionEntry<'projects'>[];
}

const { projects } = Astro.props;
const displayed = projects.slice(0, 4);
---

<section class="px-4 py-20 max-w-5xl mx-auto">
  <h2 class="section-title">Projets récents</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {displayed.map(p => (
      <a href={`/projets/${p.slug}`} class="card block no-underline">
        <div class="aspect-video mb-4 flex items-center justify-center" style="background: #111; border: 1px solid #333;">
          <span class="text-4xl" style="color: #555;">🖥</span>
        </div>
        <h3 class="font-bold text-lg mb-2" style="color: #f0f0f0;">{p.data.title}</h3>
        <div class="flex flex-wrap gap-2">
          {p.data.tags.map(tag => (
            <span class="text-xs px-2 py-1 font-mono" style="background: rgba(0,255,247,0.1); color: #00fff7; border: 1px solid rgba(0,255,247,0.3);">
              {tag}
            </span>
          ))}
        </div>
      </a>
    ))}
  </div>
  {projects.length > 4 && (
    <div class="text-center mt-8">
      <a href="/projets" class="btn-retro">Voir tous les projets</a>
    </div>
  )}
</section>
```

- [ ] **Step 5: Update `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
import APropos from '../components/sections/APropos.astro';
import Skills from '../components/sections/Skills.astro';
import ApercuProjets from '../components/sections/ApercuProjets.astro';
import { getCollection } from 'astro:content';

const projects = await getCollection('projects');
---

<BaseLayout title="Portfolio rétro 90s">
  <Hero />
  <APropos />
  <Skills />
  <ApercuProjets projects={projects} />
</BaseLayout>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ src/pages/index.astro && git commit -m "feat: homepage with Hero, APropos, Skills, ApercuProjets"
```

---

### Task 4: Content Collections + Projects

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/projects/exemple-projet.md`
- Create: `src/pages/projets.astro`
- Create: `src/pages/projets/[slug].astro`
- Modify: `astro.config.mjs` (if needed for content collections)

- [ ] **Step 1: Create `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
    image: z.string().optional(),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
  }),
});

export const collections = {
  projects: projectsCollection,
  blog: blogCollection,
};
```

- [ ] **Step 2: Create example project `src/content/projects/exemple-projet.md`**

```markdown
---
title: "Nom du projet"
date: 2026-06-01
tags: ["React", "Node.js", "Tailwind"]
description: "Courte description du projet et de ce qui a été fait."
image: "/projects/projet-1.jpg"
url: "https://exemple.com"
github: "https://github.com/..."
---

Contenu détaillé du projet. Description complète de la réalisation,
des technos utilisées, des défis rencontrés et des solutions apportées.
```

- [ ] **Step 3: Create `src/pages/projets.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const projects = await getCollection('projects');
---

<BaseLayout title="Projets — Portfolio rétro 90s">
  <section class="px-4 pt-24 pb-20 max-w-5xl mx-auto">
    <h2 class="section-title">Projets</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map(p => (
        <a href={`/projets/${p.slug}`} class="card block no-underline">
          <div class="aspect-video mb-4 flex items-center justify-center" style="background: #111; border: 1px solid #333;">
            <span class="text-4xl" style="color: #555;">🖥</span>
          </div>
          <h3 class="font-bold text-lg mb-2" style="color: #f0f0f0;">{p.data.title}</h3>
          <p class="text-sm mb-3" style="color: #888;">{p.data.description}</p>
          <div class="flex flex-wrap gap-2">
            {p.data.tags.map(tag => (
              <span class="text-xs px-2 py-1 font-mono" style="background: rgba(0,255,247,0.1); color: #00fff7; border: 1px solid rgba(0,255,247,0.3);">
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Create `src/pages/projets/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map(p => ({
    params: { slug: p.slug },
    props: { project: p },
  }));
}

const { project } = Astro.props;
const { Content } = await project.render();
---

<BaseLayout title={`${project.data.title} — Portfolio`}>
  <article class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <a href="/projets" class="text-sm mb-8 inline-block font-mono" style="color: #00fff7;">&lt; Retour aux projets</a>
    <h1 class="text-4xl font-bold mb-2" style="color: #f0f0f0;">{project.data.title}</h1>
    <div class="flex flex-wrap gap-2 mb-6">
      {project.data.tags.map(tag => (
        <span class="text-xs px-2 py-1 font-mono" style="background: rgba(0,255,247,0.1); color: #00fff7; border: 1px solid rgba(0,255,247,0.3);">
          {tag}
        </span>
      ))}
    </div>
    <div class="prose prose-invert max-w-none" style="color: #ccc;">
      <Content />
    </div>
    <div class="flex gap-4 mt-8">
      {project.data.url && <a href={project.data.url} class="btn-retro" target="_blank">Voir le projet</a>}
      {project.data.github && <a href={project.data.github} class="btn-retro" target="_blank">GitHub</a>}
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 5: Commit**

```bash
git add src/content/config.ts src/content/projects/ src/pages/projets.astro src/pages/projets/ && git commit -m "feat: content collections and projects pages"
```

---

### Task 5: Blog

**Files:**
- Create: `src/content/blog/premier-article.md`
- Create: `src/pages/blog.astro`
- Create: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Create example article `src/content/blog/premier-article.md`**

```markdown
---
title: "Premier article"
date: 2026-07-29
tags: ["dev", "rétro"]
description: "Bienvenue sur mon blog rétro !"
---

## Bienvenue !

C'est mon premier article sur ce blog rétro années 90. Ici je partagerai
mes découvertes, tutoriels et réflexions sur le développement web,
le design et la culture tech.

Restez connectés !
```

- [ ] **Step 2: Create `src/pages/blog.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="Blog — Portfolio rétro 90s">
  <section class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <h2 class="section-title">Blog</h2>
    <div class="space-y-6">
      {posts.map(p => (
        <a href={`/blog/${p.slug}`} class="card block no-underline">
          <p class="text-xs font-mono mb-1" style="color: #555;">{p.data.date.toLocaleDateString('fr-FR')}</p>
          <h3 class="font-bold text-lg mb-1" style="color: #f0f0f0;">{p.data.title}</h3>
          <p class="text-sm mb-2" style="color: #888;">{p.data.description}</p>
          <div class="flex flex-wrap gap-2">
            {p.data.tags.map(tag => (
              <span class="text-xs px-2 py-1 font-mono" style="background: rgba(0,255,247,0.1); color: #00fff7; border: 1px solid rgba(0,255,247,0.3);">
                #{tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/blog/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(p => ({
    params: { slug: p.slug },
    props: { post: p },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BaseLayout title={`${post.data.title} — Blog`}>
  <article class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <a href="/blog" class="text-sm mb-8 inline-block font-mono" style="color: #00fff7;">&lt; Retour au blog</a>
    <p class="text-xs font-mono mb-2" style="color: #555;">{post.data.date.toLocaleDateString('fr-FR')}</p>
    <h1 class="text-4xl font-bold mb-4" style="color: #f0f0f0;">{post.data.title}</h1>
    <div class="flex flex-wrap gap-2 mb-6">
      {post.data.tags.map(tag => (
        <span class="text-xs px-2 py-1 font-mono" style="background: rgba(0,255,247,0.1); color: #00fff7; border: 1px solid rgba(0,255,247,0.3);">
          #{tag}
        </span>
      ))}
    </div>
    <div class="prose prose-invert max-w-none" style="color: #ccc;">
      <Content />
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Commit**

```bash
git add src/content/blog/ src/pages/blog.astro src/pages/blog/ && git commit -m "feat: blog pages and example article"
```

---

### Task 6: Contact Page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Create `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Contact — Portfolio rétro 90s">
  <section class="px-4 pt-24 pb-20 max-w-xl mx-auto">
    <h2 class="section-title">Contact</h2>

    <div class="flex gap-4 mb-8 justify-center">
      <a href="https://github.com/" target="_blank" class="btn-retro" style="padding: 8px 16px;">GitHub</a>
      <a href="https://linkedin.com/" target="_blank" class="btn-retro" style="padding: 8px 16px;">LinkedIn</a>
      <a href="mailto:prenom@exemple.com" class="btn-retro" style="padding: 8px 16px;">Email</a>
    </div>

    <div class="card">
      <p class="font-mono text-sm mb-6" style="color: #00fff7;">$ ./envoyer-message</p>
      <form action="https://formspree.io/f/your-form-id" method="POST" class="space-y-6">
        <div>
          <label class="font-mono text-sm" style="color: #888;">$ nom:</label>
          <input type="text" name="name" required class="terminal-input" />
        </div>
        <div>
          <label class="font-mono text-sm" style="color: #888;">$ email:</label>
          <input type="email" name="email" required class="terminal-input" />
        </div>
        <div>
          <label class="font-mono text-sm" style="color: #888;">$ message:</label>
          <textarea name="message" required rows="4" class="terminal-input" style="resize: vertical;"></textarea>
        </div>
        <button type="submit" class="btn-retro w-full text-center font-mono">
          [ ENVOYER &gt; ]
        </button>
      </form>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/contact.astro && git commit -m "feat: contact page with terminal-style form"
```
