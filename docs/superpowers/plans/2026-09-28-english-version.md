# Version anglaise du portfolio — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** servir une version anglaise complète du portfolio sous `/en/`, sans toucher aux URLs françaises, avec Marvin qui répond en anglais et un bandeau qui propose la version EN aux navigateurs non francophones.

**Architecture :** i18n natif d'Astro (`defaultLocale: 'fr'`, `prefixDefaultLocale: false`) plus un petit module maison `src/i18n/` (table des routes, helpers de chemins purs, dictionnaire d'UI typé). Les data files deviennent `Record<Lang, T>`. Les collections `projects`/`blog` passent en sous-dossiers `fr/` et `en/`, lus par un helper qui gère le fallback. Chaque page devient un composant `src/components/pages/*Page.astro` paramétré par `lang`, rendu par deux coquilles (FR à la racine, EN sous `src/pages/en/`).

**Tech Stack :** Astro 7, React 19, Tailwind 4, Vitest + Testing Library (jsdom), Bun, Groq SDK.

**Spec :** `docs/superpowers/specs/2026-09-28-english-version-design.md`

## Global Constraints

- Les URLs FR actuelles ne changent pas : `/`, `/projets`, `/projets/<slug>`, `/blog`, `/blog/<slug>`, `/contact`, `/wargames`.
- URLs EN : `/en/`, `/en/projects`, `/en/projects/<slug>`, `/en/blog`, `/en/blog/<slug>`, `/en/contact`, `/en/wargames`.
- Aucune nouvelle dépendance npm.
- Anglais américain partout (`analyzed`, `initializing`, `specializing`).
- Noms d'entreprises, d'écoles, de produits et de technos inchangés en EN.
- Les répliques EN de Marvin suivent le ton **actuel** des répliques FR (professionnel, légèrement pince-sans-rire). Les répliques FR ont été adoucies récemment (commit `49d81f8`) ; on ne ressuscite pas un persona plus marqué.
- Témoignages EN affichés avec la mention « Translated from French ».
- Fallback de contenu **symétrique** : une entrée présente dans une seule langue est servie dans les deux, avec un badge. Conséquence : toute page a toujours son équivalent dans l'autre langue, et le switch n'a jamais besoin de repli vers une liste. C'est un léger élargissement de la spec (qui ne décrivait que FR → EN), validé ici parce qu'il simplifie `alternatePath`.
- Les commentaires de code restent en français, comme dans le reste du dépôt.
- `bun run test` doit passer à la fin de chaque tâche. `bun run build` doit passer à la fin des tâches 3, 5, 6, 8, 9, 11, 12.
- Chaque commit se termine par la ligne `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **Variantes de slash final** (`/en`, `/en/`, `/projets/`) : le switch et les hreflang doivent pointer au bon endroit quel que soit le format servi par Astro → tests dans la tâche 1.
2. **`/en/contact` sans bulle Marvin** : la règle « pas de bulle sur contact » comparait la chaîne `/contact` et raterait `/en/contact` → test dans la tâche 7.
3. **Ancre conservée au switch** (`/#parcours` → `/en/#parcours`) : `Astro.url.pathname` ne voit jamais le fragment, c'est le script client qui doit l'ajouter → helper `switchHref` testé dans la tâche 1.
4. **`lang` absent ou invalide dans le body de `/api/chat`** (client en cache après déploiement, appel manuel) : doit retomber sur `fr` sans erreur → tests de `parseLang` dans la tâche 1, utilisé dans la tâche 8.
5. **`localStorage` inaccessible** (Safari navigation privée) : le bandeau de suggestion ne doit pas planter l'hydratation → test dans la tâche 10.

---

## Structure des fichiers

**Créés**
- `src/i18n/routes.ts` : table `ROUTES` (id de route → chemin FR/EN).
- `src/i18n/utils.ts` : type `Lang`, parsing et construction de chemins, `fmt`, `formatDate`, constantes.
- `src/i18n/utils.test.ts`
- `src/i18n/ui.ts` : dictionnaire des chaînes d'interface, `t(lang)`.
- `src/i18n/ui.test.ts`
- `src/i18n/content.ts` : `localizeEntries` (pur, testable sans Astro).
- `src/i18n/content.test.ts`
- `src/i18n/collections.ts` : `getLocalizedCollection`, `localizedStaticPaths` (dépendent de `astro:content`, non testés unitairement).
- `src/data/companies.ts` : clients (logos, URLs, textes FR/EN), source unique pour la section et Marvin.
- `src/data/parity.test.ts` : parité FR/EN des data files.
- `src/data/wargamesLines.ts` : répliques du jeu, FR/EN.
- `src/lib/chatPrompt.ts` : construction pure du prompt système par langue.
- `src/lib/chatPrompt.test.ts`
- `src/components/i18n/OnlyInBadge.astro` : badge « French only » / « En anglais uniquement ».
- `src/components/i18n/LangSuggest.tsx` + `LangSuggest.test.tsx`
- `src/components/pages/{Home,Projects,Project,Blog,BlogPost,Contact,Wargames}Page.astro`
- `src/pages/en/{index,projects,blog,contact,wargames}.astro`, `src/pages/en/projects/[slug].astro`, `src/pages/en/blog/[slug].astro`
- `src/content/projects/en/*.md`, `src/content/blog/en/*.md`
- `src/components/wargames/WargamesGame.test.tsx`

**Modifiés**
- `astro.config.mjs` (bloc `i18n`)
- `src/data/{parcours,skills,temoignages,marvinLines}.ts` + `marvinLines.test.ts`
- `src/layouts/BaseLayout.astro`, `src/components/nav/MenuMobile.tsx`
- `src/components/sections/*.astro`
- `src/components/chatbot/{useMarvinThread.ts,ChatPanel.tsx,MarvinDock.tsx,usePeek.ts}` + tests
- `src/components/wargames/{WargamesGame,MarvinShell}.tsx`
- `src/pages/api/{chat,contact}.ts`
- `src/pages/{index,projets,blog,contact,wargames}.astro`, `src/pages/projets/[slug].astro`, `src/pages/blog/[slug].astro` (deviennent des coquilles)
- `src/styles/retro.css`
- `AGENTS.md`, `README.md`

**Déplacés** : `src/content/projects/*.md` → `src/content/projects/fr/`, `src/content/blog/*.md` → `src/content/blog/fr/`.

---

### Task 1 : Noyau i18n (routes et helpers de chemins)

**Files:**
- Create: `src/i18n/routes.ts`, `src/i18n/utils.ts`, `src/i18n/utils.test.ts`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces :
  - `type Lang = 'fr' | 'en'`, `LANGS: readonly Lang[]`, `DEFAULT_LANG: Lang`
  - `isLang(v: unknown): v is Lang`, `parseLang(v: unknown): Lang`, `otherLang(l: Lang): Lang`
  - `type RouteId = 'home' | 'projects' | 'blog' | 'contact' | 'wargames'`, `ROUTES: Record<RouteId, Record<Lang, string>>`
  - `normalizePath(p: string): string`, `pathLang(pathname: string): Lang`
  - `parsePath(path: string): { route: RouteId; lang: Lang; slug?: string; hash?: string } | null`
  - `buildPath(route: RouteId, lang: Lang, slug?: string, hash?: string): string`
  - `localizePath(path: string, lang: Lang): string`, `alternatePath(pathname: string): string`
  - `routeIdFromPath(pathname: string): RouteId | null`
  - `switchHref(href: string, hash: string): string`
  - `fmt(template: string, vars: Record<string, string | number>): string`
  - `formatDate(date: Date, lang: Lang): string`
  - `OG_LOCALE: Record<Lang, string>`, `LANG_CHOICE_KEY = 'lang-choice'`

- [ ] **Step 1 : écrire les tests qui échouent**

`src/i18n/utils.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import {
  alternatePath,
  buildPath,
  fmt,
  formatDate,
  isLang,
  localizePath,
  normalizePath,
  otherLang,
  parseLang,
  parsePath,
  pathLang,
  routeIdFromPath,
  switchHref,
} from './utils';

describe('langues', () => {
  it('reconnaît les langues gérées', () => {
    expect(isLang('fr')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it('retombe sur le français pour toute valeur inconnue', () => {
    expect(parseLang('en')).toBe('en');
    expect(parseLang('fr')).toBe('fr');
    expect(parseLang(undefined)).toBe('fr');
    expect(parseLang('EN')).toBe('fr');
    expect(parseLang(42)).toBe('fr');
  });

  it("donne l'autre langue", () => {
    expect(otherLang('fr')).toBe('en');
    expect(otherLang('en')).toBe('fr');
  });
});

describe('normalizePath', () => {
  it('retire le slash final sauf pour la racine', () => {
    expect(normalizePath('/projets/')).toBe('/projets');
    expect(normalizePath('/en/')).toBe('/en');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('/');
  });
});

describe('pathLang', () => {
  it("déduit la langue du préfixe d'URL", () => {
    expect(pathLang('/en')).toBe('en');
    expect(pathLang('/en/')).toBe('en');
    expect(pathLang('/en/projects/amiqo')).toBe('en');
    expect(pathLang('/')).toBe('fr');
    expect(pathLang('/projets')).toBe('fr');
  });

  it("ne confond pas un chemin qui commence par « en » avec le préfixe", () => {
    expect(pathLang('/enquete')).toBe('fr');
  });
});

describe('parsePath', () => {
  it('reconnaît les pages de liste et de détail', () => {
    expect(parsePath('/projets/amiqo')).toEqual({ route: 'projects', lang: 'fr', slug: 'amiqo' });
    expect(parsePath('/en/blog/premier-article/')).toEqual({
      route: 'blog',
      lang: 'en',
      slug: 'premier-article',
    });
    expect(parsePath('/en/contact')).toEqual({ route: 'contact', lang: 'en' });
    expect(parsePath('/en')).toEqual({ route: 'home', lang: 'en' });
  });

  it("garde l'ancre", () => {
    expect(parsePath('/#parcours')).toEqual({ route: 'home', lang: 'fr', hash: '#parcours' });
  });

  it('refuse les chemins inconnus ou trop profonds', () => {
    expect(parsePath('/inconnu')).toBeNull();
    expect(parsePath('/projets/a/b')).toBeNull();
    expect(parsePath('/contact/x')).toBeNull();
  });
});

describe('buildPath', () => {
  it('construit les chemins des deux langues', () => {
    expect(buildPath('home', 'fr')).toBe('/');
    expect(buildPath('home', 'en')).toBe('/en/');
    expect(buildPath('projects', 'en', 'amiqo')).toBe('/en/projects/amiqo');
    expect(buildPath('projects', 'fr', 'amiqo')).toBe('/projets/amiqo');
    expect(buildPath('home', 'en', undefined, '#parcours')).toBe('/en/#parcours');
    expect(buildPath('home', 'fr', undefined, '#parcours')).toBe('/#parcours');
  });
});

describe('localizePath / alternatePath', () => {
  it('traduit un chemin vers la langue demandée', () => {
    expect(localizePath('/projets/amiqo', 'en')).toBe('/en/projects/amiqo');
    expect(localizePath('/en/projects', 'fr')).toBe('/projets');
    expect(localizePath('/wargames', 'en')).toBe('/en/wargames');
    expect(localizePath('/projets', 'fr')).toBe('/projets');
  });

  it('laisse intact un chemin inconnu', () => {
    expect(localizePath('/inconnu', 'en')).toBe('/inconnu');
  });

  it("donne l'équivalent dans l'autre langue, avec ou sans slash final", () => {
    expect(alternatePath('/')).toBe('/en/');
    expect(alternatePath('/en')).toBe('/');
    expect(alternatePath('/en/')).toBe('/');
    expect(alternatePath('/projets/')).toBe('/en/projects');
    expect(alternatePath('/blog/premier-article')).toBe('/en/blog/premier-article');
    expect(alternatePath('/en/contact')).toBe('/contact');
  });
});

describe('routeIdFromPath', () => {
  it('identifie la route quelle que soit la langue', () => {
    expect(routeIdFromPath('/contact')).toBe('contact');
    expect(routeIdFromPath('/en/contact/')).toBe('contact');
    expect(routeIdFromPath('/en/projects/amiqo')).toBe('projects');
    expect(routeIdFromPath('/inconnu')).toBeNull();
  });
});

describe('switchHref', () => {
  it("ajoute l'ancre courante au lien du switch", () => {
    expect(switchHref('/en/', '#parcours')).toBe('/en/#parcours');
  });

  it("ne touche à rien sans ancre, ou si le lien en porte déjà une", () => {
    expect(switchHref('/en/', '')).toBe('/en/');
    expect(switchHref('/en/#confiance', '#parcours')).toBe('/en/#confiance');
  });
});

describe('fmt', () => {
  it('remplace les variables entre accolades', () => {
    expect(fmt('ROUND {n}. {who}', { n: 2, who: 'MARVIN' })).toBe('ROUND 2. MARVIN');
  });

  it('laisse en place une variable non fournie', () => {
    expect(fmt('ROUND {n}', {})).toBe('ROUND {n}');
  });
});

describe('formatDate', () => {
  const date = new Date('2026-09-28T12:00:00Z');

  it('garde le format numérique actuel en français', () => {
    expect(formatDate(date, 'fr')).toBe('28/09/2026');
  });

  it('écrit le mois en toutes lettres en anglais, pour lever toute ambiguïté', () => {
    expect(formatDate(date, 'en')).toBe('September 28, 2026');
  });
});
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `bun run test src/i18n/utils.test.ts`
Expected : FAIL, `Failed to resolve import "./utils"`.

- [ ] **Step 3 : implémenter**

`src/i18n/routes.ts` :

```ts
import type { Lang } from './utils';

export type RouteId = 'home' | 'projects' | 'blog' | 'contact' | 'wargames';

/**
 * Table des routes : une ligne par page, un chemin par langue.
 * Les chemins FR sont ceux d'avant l'i18n et ne doivent jamais changer
 * (liens partagés, référencement).
 */
export const ROUTES: Record<RouteId, Record<Lang, string>> = {
  home: { fr: '/', en: '/en/' },
  projects: { fr: '/projets', en: '/en/projects' },
  blog: { fr: '/blog', en: '/en/blog' },
  contact: { fr: '/contact', en: '/en/contact' },
  wargames: { fr: '/wargames', en: '/en/wargames' },
};

/** Routes qui ont des pages de détail `/<base>/<slug>`. */
export const SLUG_ROUTES: readonly RouteId[] = ['projects', 'blog'];
```

`src/i18n/utils.ts` :

```ts
import { ROUTES, SLUG_ROUTES, type RouteId } from './routes';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

/** Clé localStorage du choix explicite de langue (switch ou bandeau). */
export const LANG_CHOICE_KEY = 'lang-choice';

export const OG_LOCALE: Record<Lang, string> = { fr: 'fr_FR', en: 'en_US' };

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

/** Toute valeur inconnue retombe sur le français : c'est la langue historique du site. */
export function parseLang(v: unknown): Lang {
  return isLang(v) ? v : DEFAULT_LANG;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

/** Retire le slash final (sauf racine) : Astro sert `/en` comme `/en/`. */
export function normalizePath(p: string): string {
  if (!p || p === '/') return '/';
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function pathLang(pathname: string): Lang {
  const p = normalizePath(pathname);
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'fr';
}

export interface ParsedPath {
  route: RouteId;
  lang: Lang;
  slug?: string;
  hash?: string;
}

export function parsePath(path: string): ParsedPath | null {
  const indexAncre = path.indexOf('#');
  const hash = indexAncre >= 0 ? path.slice(indexAncre) : undefined;
  const nu = normalizePath(indexAncre >= 0 ? path.slice(0, indexAncre) : path);

  for (const lang of LANGS) {
    for (const route of Object.keys(ROUTES) as RouteId[]) {
      const base = normalizePath(ROUTES[route][lang]);
      if (nu === base) return hash ? { route, lang, hash } : { route, lang };

      if (SLUG_ROUTES.includes(route) && nu.startsWith(`${base}/`)) {
        const slug = nu.slice(base.length + 1);
        if (slug && !slug.includes('/')) {
          return hash ? { route, lang, slug, hash } : { route, lang, slug };
        }
      }
    }
  }
  return null;
}

export function buildPath(route: RouteId, lang: Lang, slug?: string, hash = ''): string {
  const base = ROUTES[route][lang];
  const chemin = slug ? `${normalizePath(base)}/${slug}` : base;
  return chemin + hash;
}

/** Chemin équivalent dans `lang`. Un chemin inconnu est rendu tel quel. */
export function localizePath(path: string, lang: Lang): string {
  const lu = parsePath(path);
  return lu ? buildPath(lu.route, lang, lu.slug, lu.hash ?? '') : path;
}

export function alternatePath(pathname: string): string {
  return localizePath(pathname, otherLang(pathLang(pathname)));
}

export function routeIdFromPath(pathname: string): RouteId | null {
  return parsePath(pathname)?.route ?? null;
}

/**
 * `Astro.url.pathname` ne contient jamais le fragment : c'est au clic, côté
 * client, qu'on recolle l'ancre courante pour rester sur la même section.
 */
export function switchHref(href: string, hash: string): string {
  if (!hash || href.includes('#')) return href;
  return href + hash;
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (brut, cle: string) =>
    cle in vars ? String(vars[cle]) : brut
  );
}

/** FR : format numérique historique. EN : mois en lettres, lisible des deux côtés de l'Atlantique. */
export function formatDate(date: Date, lang: Lang): string {
  return lang === 'fr'
    ? date.toLocaleDateString('fr-FR')
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
```

`astro.config.mjs` : ajouter le bloc `i18n` dans `defineConfig`, après `integrations` :

```js
  integrations: [react()],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
```

- [ ] **Step 4 : vérifier que les tests passent**

Run : `bun run test src/i18n/utils.test.ts`
Expected : PASS.

Si `formatDate(date, 'fr')` échoue parce que l'environnement de test n'a pas l'ICU complet, ne pas changer le test : vérifier que `node -e "console.log(new Date('2026-09-28T12:00:00Z').toLocaleDateString('fr-FR'))"` affiche bien `28/09/2026`, et en parler avant d'aller plus loin.

- [ ] **Step 5 : commit**

```bash
git add src/i18n/routes.ts src/i18n/utils.ts src/i18n/utils.test.ts astro.config.mjs
git commit -m "feat(i18n): table des routes et helpers de chemins FR/EN

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2 : Dictionnaire d'interface

**Files:**
- Create: `src/i18n/ui.ts`, `src/i18n/ui.test.ts`

**Interfaces:**
- Consumes : `Lang`, `LANGS` (tâche 1).
- Produces : `type UiKey`, `ui: Record<Lang, Record<UiKey, string>>`, `t(lang: Lang): Record<UiKey, string>`, `OPTIONAL_KEYS: readonly UiKey[]`. Les clés listées ci-dessous sont utilisées telles quelles par les tâches 5 à 10.

- [ ] **Step 1 : écrire le test qui échoue**

`src/i18n/ui.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { LANGS } from './utils';
import { OPTIONAL_KEYS, t, ui } from './ui';

describe('dictionnaire UI', () => {
  it('a exactement les mêmes clés dans chaque langue', () => {
    const cles = Object.keys(ui.fr).sort();
    for (const lang of LANGS) {
      expect(Object.keys(ui[lang]).sort()).toEqual(cles);
    }
  });

  it("n'a pas de chaîne vide, hors clés explicitement optionnelles", () => {
    for (const lang of LANGS) {
      for (const [cle, valeur] of Object.entries(ui[lang])) {
        if ((OPTIONAL_KEYS as readonly string[]).includes(cle)) continue;
        expect(valeur, `${lang}.${cle}`).not.toBe('');
      }
    }
  });

  it('renvoie le dictionnaire de la langue demandée', () => {
    expect(t('fr')['nav.projects']).toBe('Projets');
    expect(t('en')['nav.projects']).toBe('Projects');
  });
});
```

- [ ] **Step 2 : vérifier que le test échoue**

Run : `bun run test src/i18n/ui.test.ts`
Expected : FAIL, `Failed to resolve import "./ui"`.

- [ ] **Step 3 : implémenter**

`src/i18n/ui.ts` :

```ts
import type { Lang } from './utils';

/**
 * Chaînes d'interface. Le français fait référence : le type de `en` en est
 * dérivé, donc une clé oubliée en anglais est une erreur de compilation.
 *
 * TS pur, sans dépendance Astro : importable par les composants React et par
 * les routes d'API.
 */
const fr = {
  'layout.defaultDescription':
    "Développeur concepteur d'applications web, mobile et DevOps. Architecture hexagonale, TDD, Django, React, Flutter. Basé à Perpignan, disponible en full remote.",
  'layout.footer': '© 2026 Martin Info — Portfolio rétro 90s',
  'layout.lightboxClose': 'Fermer',

  'nav.home': 'Accueil',
  'nav.projects': 'Projets',
  'nav.parcours': 'Parcours',
  'nav.partners': 'Partenaires',
  'nav.blog': 'Blog',
  'nav.contact': 'Contact',
  'nav.switchAria': 'Lire cette page en anglais',
  'nav.otherLangName': 'English',
  'nav.menuOpen': 'Ouvrir le menu',
  'nav.menuClose': 'Fermer le menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'Ce site existe aussi en français.',
  'suggest.action': 'Voir en français',
  'suggest.dismiss': 'Fermer',

  'content.onlyIn': '🇬🇧 En anglais uniquement',

  'hero.badge': "Développeur concepteur d'applications — Web, mobile & DevOps",
  'hero.tagline': "Je crée des applications qui s'adaptent à votre métier.",
  'hero.sub':
    'Applications web et mobiles sur mesure, conçues pour répondre à vos besoins réels et accompagner votre activité dans la durée.',
  'hero.location': 'Basé à Perpignan, disponible en full remote',
  'hero.ctaProjects': 'Voir les projets',
  'hero.ctaContact': 'Discutons de votre besoin',

  'about.title': 'À propos',
  'about.quote': '« Des outils au service de votre activité. »',
  'about.p1':
    "Je crée des applications sur mesure pour les entreprises : simples à utiliser, fiables au quotidien et capables d'évoluer avec vous. Nouveau projet ou outil existant à améliorer et à connecter à vos autres logiciels, c'est souvent là que tout se joue.",
  'about.p2':
    "Avant de devenir développeur, j'ai passé près de 20 ans à maintenir des systèmes informatiques critiques et à former des équipes à leurs outils. J'en ai retenu l'essentiel : une application ne vaut que si elle est pensée pour et avec ses utilisateurs.",
  'about.p3':
    "Aujourd'hui en spécialisation à l'École 42 Perpignan, je développe des applications web et mobiles.",

  'skills.title': 'Compétences',
  'skills.subtitle': "« Qu'importe la stack, pourvu qu'on ait les tests. »",

  'trust.title': 'Ils me font confiance',
  'trust.subtitle': "Des entreprises qui m'ont confié leurs systèmes en production.",

  'testimonials.title': 'Témoignages',
  'testimonials.prev': 'Précédent',
  'testimonials.next': 'Suivant',
  'testimonials.more': 'Lire la suite',
  'testimonials.less': 'Voir moins',
  'testimonials.moreAria': 'Voir plus',
  'testimonials.translated': '',

  'parcours.title': 'Parcours',
  'parcours.subtitle': "20 ans d'infrastructure, puis le code.",

  'projectsPreview.title': 'Projets récents',
  'projectsPreview.subtitle': 'Applications métier, intégrations et reprises de legacy.',
  'projectsPreview.all': 'Voir tous les projets',

  'home.title': "Martin Rabat — Développeur concepteur d'applications",
  'home.description':
    'Développeur fullstack & DevOps indépendant : applications métier, intégration de systèmes et reprise de legacy. Django, React, Flutter, Docker. 20 ans d\'infrastructure derrière moi. Perpignan, full remote.',

  'projects.title': 'Projets — Martin Rabat, développeur fullstack',
  'projects.description':
    'Applications métier, intégrations entre systèmes et reprises de legacy : ERP retail, backoffice de franchises, applications mobiles terrain, passerelles de synchronisation et infrastructure Docker.',
  'projects.heading': 'Projets',
  'project.back': '< Retour aux projets',
  'project.visit': 'Voir le projet',

  'blog.title': 'Blog — Martin Rabat, développeur fullstack',
  'blog.description':
    "Articles et retours d'expérience de Martin Rabat sur le développement web, mobile et l'architecture logicielle.",
  'blog.heading': 'Blog',
  'post.titleSuffix': '— Blog de Martin Rabat',
  'post.back': '< Retour au blog',

  'contact.title': 'Contact — Martin Rabat, développeur fullstack',
  'contact.description':
    'Un projet, un poste à pourvoir, une question ? Martin Rabat, développeur fullstack & DevOps à Perpignan, disponible en full remote. Réponse sous 24h.',
  'contact.heading': 'Contact',
  'contact.intro': 'Un projet, un poste à pourvoir, une question ? Je réponds sous 24h.',
  'contact.command': '$ ./envoyer-message',
  'contact.name': '$ nom:',
  'contact.email': '$ email:',
  'contact.message': '$ message:',
  'contact.submit': '[ ENVOYER > ]',
  'contact.sending': '[ ENVOI... ]',
  'contact.success': '> Message transmis. Réponse sous 24h.',
  'contact.error': '> ERREUR : envoi impossible. Écris-moi directement à martin.rabat@gmail.com',

  'marvin.greeting':
    'Bonjour ! Je peux vous présenter le parcours de Martin, ses projets et ses compétences. N’hésitez pas à me poser votre question',
  'marvin.longSession': 'SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.',
  'marvin.connectionLost': 'connexion perdue',
  'marvin.retry': 'Réessayer',
  'marvin.placeholder': 'Écris un message…',
  'marvin.inputAria': 'Votre message pour MARVIN-42',
  'marvin.send': 'Envoyer le message',
  'marvin.closeChat': 'Fermer la conversation',
  'marvin.pillOpen': 'Ouvrir le chat MARVIN-42',
  'marvin.pillClose': 'Fermer le chat MARVIN-42',
  'marvin.pillLong': 'Parler à MARVIN-42',

  'chat.rateLimit':
    'Le service est momentanément indisponible en raison d’un nombre élevé de demandes. Merci de réessayer dans quelques instants.',
  'chat.error': 'ERREUR: connexion au serveur perdue. Réessaie plus tard.',

  'wargames.intro': 'BIENVENUE AU JEU.\n\nTROIS ROUNDS.\n\nQUE LE MEILLEUR GAGNE.',
  'wargames.start': 'COMMENCER',
  'wargames.back': '> Retour au portfolio',
  'wargames.backChat': '> Revenir au chat',
  'wargames.finalScore': 'SCORE FINAL',
  'wargames.visitor': 'VISITEUR',
  'wargames.you': 'VOUS',
  'wargames.endWin': "ANOMALIE STATISTIQUE CONFIRMÉE. BRAVO, TU AS GAGNÉ LE DROIT D'EMBAUCHER MARTIN.",
  'wargames.endDraw': "ÉGALITÉ FINALE. J'AURAIS PU T'ÉCRASER. J'AI CHOISI LA CLÉMENCE.",
  'wargames.endLose': '...TU REVIENDRAIS PAS SUR TERRE ?',
  'wargames.contactPrompt': 'UN PROJET PASSIONNANT ? ÉCRIS-MOI.',
  'wargames.contactSent': 'MESSAGE TRANSMIS.',
  'wargames.contactError': 'ERREUR: message non envoyé.',
  'wargames.name': 'NOM',
  'wargames.submit': '> ENVOYER',
  'wargames.sending': 'ENVOI...',
  'wargames.statusDraw': 'ÉGALITÉ.',
  'wargames.statusVisitorWins': 'VISITEUR GAGNE !',
  'wargames.statusMarvinWins': 'MARVIN-42 GAGNE.',
  'wargames.statusYourTurn': 'À TOI DE JOUER.',
  'wargames.statusThinking': 'MARVIN-42 RÉFLÉCHIT...',
};

export type UiKey = keyof typeof fr;

/** Clés qui peuvent légitimement être vides dans une langue. */
export const OPTIONAL_KEYS: readonly UiKey[] = ['testimonials.translated'];

const en: Record<UiKey, string> = {
  'layout.defaultDescription':
    'Application developer for web, mobile and DevOps. Hexagonal architecture, TDD, Django, React, Flutter. Based in Perpignan, France, available for fully remote work.',
  'layout.footer': '© 2026 Martin Info — 90s retro portfolio',
  'layout.lightboxClose': 'Close',

  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.parcours': 'Experience',
  'nav.partners': 'Clients',
  'nav.blog': 'Blog',
  'nav.contact': 'Contact',
  'nav.switchAria': 'Read this page in French',
  'nav.otherLangName': 'Français',
  'nav.menuOpen': 'Open menu',
  'nav.menuClose': 'Close menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'This site is also available in English.',
  'suggest.action': 'View in English',
  'suggest.dismiss': 'Dismiss',

  'content.onlyIn': '🇫🇷 French only',

  'hero.badge': 'Application Developer — Web, Mobile & DevOps',
  'hero.tagline': 'I build applications that fit the way your business works.',
  'hero.sub':
    'Custom web and mobile applications, designed around your real needs and built to support your business for the long run.',
  'hero.location': 'Based in Perpignan, France — available for fully remote work',
  'hero.ctaProjects': 'See my projects',
  'hero.ctaContact': "Let's talk about your project",

  'about.title': 'About',
  'about.quote': '“Tools that work for your business.”',
  'about.p1':
    "I build custom applications for businesses: easy to use, reliable day to day, and able to grow with you. Whether it's a new project or an existing tool that needs improving and connecting to your other software, that's often where it all happens.",
  'about.p2':
    "Before becoming a developer, I spent nearly 20 years maintaining critical IT systems and training teams on their tools. The lesson I kept: an application is only worth something if it's designed for, and with, the people who use it.",
  'about.p3':
    'Currently in the specialization track at École 42 Perpignan (a peer-to-peer, project-based coding school), I build web and mobile applications.',

  'skills.title': 'Skills',
  'skills.subtitle': '“Never mind the stack, as long as there are tests.”',

  'trust.title': 'Trusted by',
  'trust.subtitle': 'Companies that have trusted me with their production systems.',

  'testimonials.title': 'Testimonials',
  'testimonials.prev': 'Previous',
  'testimonials.next': 'Next',
  'testimonials.more': 'Read more',
  'testimonials.less': 'Show less',
  'testimonials.moreAria': 'Show more',
  'testimonials.translated': 'Translated from French',

  'parcours.title': 'Experience',
  'parcours.subtitle': '20 years of infrastructure, then code.',

  'projectsPreview.title': 'Recent projects',
  'projectsPreview.subtitle': 'Business applications, integrations and legacy takeovers.',
  'projectsPreview.all': 'See all projects',

  'home.title': 'Martin Rabat — Application Developer',
  'home.description':
    'Independent full-stack & DevOps developer: business applications, systems integration and legacy takeovers. Django, React, Flutter, Docker. 20 years of infrastructure experience. Based in Perpignan, France, fully remote.',

  'projects.title': 'Projects — Martin Rabat, full-stack developer',
  'projects.description':
    'Business applications, system integrations and legacy takeovers: retail ERP, franchise back offices, field mobile apps, synchronization gateways and Docker infrastructure.',
  'projects.heading': 'Projects',
  'project.back': '< Back to projects',
  'project.visit': 'View project',

  'blog.title': 'Blog — Martin Rabat, full-stack developer',
  'blog.description':
    'Articles and lessons learned by Martin Rabat on web and mobile development and software architecture.',
  'blog.heading': 'Blog',
  'post.titleSuffix': "— Martin Rabat's blog",
  'post.back': '< Back to blog',

  'contact.title': 'Contact — Martin Rabat, full-stack developer',
  'contact.description':
    'A project, a job opening, a question? Martin Rabat, full-stack & DevOps developer based in Perpignan, France, available for fully remote work. Reply within 24 hours.',
  'contact.heading': 'Contact',
  'contact.intro': 'A project, a job opening, a question? I reply within 24 hours.',
  'contact.command': '$ ./send-message',
  'contact.name': '$ name:',
  'contact.email': '$ email:',
  'contact.message': '$ message:',
  'contact.submit': '[ SEND > ]',
  'contact.sending': '[ SENDING... ]',
  'contact.success': "> Message sent. I'll reply within 24 hours.",
  'contact.error': "> ERROR: couldn't send your message. Email me directly at martin.rabat@gmail.com",

  'marvin.greeting':
    "Hello! I can walk you through Martin's background, projects and skills. Feel free to ask me anything.",
  'marvin.longSession': 'LONG SESSION DETECTED. SHORT-TERM MEMORY ONLY.',
  'marvin.connectionLost': 'connection lost',
  'marvin.retry': 'Retry',
  'marvin.placeholder': 'Type a message…',
  'marvin.inputAria': 'Your message to MARVIN-42',
  'marvin.send': 'Send message',
  'marvin.closeChat': 'Close conversation',
  'marvin.pillOpen': 'Open MARVIN-42 chat',
  'marvin.pillClose': 'Close MARVIN-42 chat',
  'marvin.pillLong': 'Talk to MARVIN-42',

  'chat.rateLimit':
    'The service is temporarily unavailable due to a high number of requests. Please try again in a few moments.',
  'chat.error': 'ERROR: lost connection to the server. Try again later.',

  'wargames.intro': 'WELCOME TO THE GAME.\n\nTHREE ROUNDS.\n\nMAY THE BEST PLAYER WIN.',
  'wargames.start': 'START',
  'wargames.back': '> Back to portfolio',
  'wargames.backChat': '> Back to the chat',
  'wargames.finalScore': 'FINAL SCORE',
  'wargames.visitor': 'VISITOR',
  'wargames.you': 'YOU',
  'wargames.endWin': 'STATISTICAL ANOMALY CONFIRMED. CONGRATULATIONS, YOU HAVE EARNED THE RIGHT TO HIRE MARTIN.',
  'wargames.endDraw': 'FINAL DRAW. I COULD HAVE CRUSHED YOU. I CHOSE MERCY.',
  'wargames.endLose': '...CARE TO COME BACK DOWN TO EARTH?',
  'wargames.contactPrompt': 'GOT AN EXCITING PROJECT? WRITE TO ME.',
  'wargames.contactSent': 'MESSAGE SENT.',
  'wargames.contactError': 'ERROR: message not sent.',
  'wargames.name': 'NAME',
  'wargames.submit': '> SEND',
  'wargames.sending': 'SENDING...',
  'wargames.statusDraw': 'DRAW.',
  'wargames.statusVisitorWins': 'VISITOR WINS!',
  'wargames.statusMarvinWins': 'MARVIN-42 WINS.',
  'wargames.statusYourTurn': 'YOUR MOVE.',
  'wargames.statusThinking': 'MARVIN-42 IS THINKING...',
};

export const ui: Record<Lang, Record<UiKey, string>> = { fr, en };

export function t(lang: Lang): Record<UiKey, string> {
  return ui[lang];
}
```

Note sur `suggest.*` : le bandeau parle dans la langue **cible**. Sur une page FR, il affiche `t('en')['suggest.text']` (« This site is also available in English. »), d'où les valeurs apparemment inversées.

Note sur `nav.switchAria` : l'aria-label décrit la destination du lien, dans la langue de la page courante.

- [ ] **Step 4 : vérifier que les tests passent**

Run : `bun run test src/i18n/ui.test.ts`
Expected : PASS.

- [ ] **Step 5 : commit**

```bash
git add src/i18n/ui.ts src/i18n/ui.test.ts
git commit -m "feat(i18n): dictionnaire des chaînes d'interface FR/EN

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3 : Data files bilingues

**Files:**
- Create: `src/data/companies.ts`, `src/data/parity.test.ts`
- Modify: `src/data/parcours.ts`, `src/data/skills.ts`, `src/data/temoignages.ts`, `src/data/marvinLines.ts`, `src/data/marvinLines.test.ts`
- Modify (consommateurs, adaptation minimale à `.fr`) : `src/components/sections/Parcours.astro`, `Skills.astro`, `Temoignages.astro`, `IlsMeFontConfiance.astro`, `src/pages/index.astro`, `src/pages/projets.astro`, `src/pages/projets/[slug].astro`, `src/pages/blog.astro`, `src/pages/api/chat.ts`

**Interfaces:**
- Consumes : `Lang`, `LANGS` (tâche 1), `RouteId` (tâche 1).
- Produces :
  - `parcours: Record<Lang, ParcoursEntry[]>`
  - `skills: Record<Lang, Record<string, string[]>>`
  - `temoignages: Record<Lang, Temoignage[]>`
  - `interface Company { name: string; url: string; logo: string; logoBg: 'white' | 'dark'; tagline: string; desc: string }`, `companies: Record<Lang, Company[]>`
  - `pageLines: Record<Lang, Partial<Record<RouteId, string[]>>>`, `sectionLines: Record<Lang, Record<string, string[]>>`, `projectLines: Record<Lang, string[]>` (le gabarit `{titre}` est conservé tel quel dans les deux langues)

Cette tâche corrige aussi le test déjà en échec au départ (`marvinLines.test.ts` attend « Tu peux lire tout le site », qui n'existe plus dans les données depuis le commit `49d81f8`).

- [ ] **Step 1 : écrire les tests qui échouent**

`src/data/parity.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { companies } from './companies';
import { pageLines, projectLines, sectionLines } from './marvinLines';
import { parcours } from './parcours';
import { skills } from './skills';
import { temoignages } from './temoignages';

/**
 * Le français et l'anglais doivent décrire les mêmes faits : même nombre
 * d'entrées, dans le même ordre, avec les mêmes noms propres. Une entrée
 * ajoutée d'un seul côté ferait mentir l'une des deux versions, et Marvin
 * avec elle.
 */
describe('parité FR/EN des données', () => {
  it('parcours : mêmes entrées, mêmes entreprises', () => {
    expect(parcours.en).toHaveLength(parcours.fr.length);
    parcours.en.forEach((e, i) => expect(e.entreprise).toBe(parcours.fr[i].entreprise));
  });

  it('compétences : même nombre de catégories et de compétences par catégorie', () => {
    const fr = Object.values(skills.fr);
    const en = Object.values(skills.en);
    expect(en).toHaveLength(fr.length);
    en.forEach((items, i) => expect(items).toHaveLength(fr[i].length));
  });

  it('témoignages : mêmes auteurs, dans le même ordre', () => {
    expect(temoignages.en.map((t) => t.name)).toEqual(temoignages.fr.map((t) => t.name));
    expect(temoignages.en.map((t) => t.company)).toEqual(temoignages.fr.map((t) => t.company));
  });

  it('clients : mêmes noms, URLs et logos', () => {
    const cle = (c: (typeof companies.fr)[number]) => [c.name, c.url, c.logo, c.logoBg];
    expect(companies.en.map(cle)).toEqual(companies.fr.map(cle));
  });

  it('répliques de Marvin : mêmes pages, mêmes sections, même nombre de répliques', () => {
    expect(Object.keys(pageLines.en).sort()).toEqual(Object.keys(pageLines.fr).sort());
    for (const cle of Object.keys(pageLines.fr) as (keyof typeof pageLines.fr)[]) {
      expect(pageLines.en[cle]).toHaveLength(pageLines.fr[cle]!.length);
    }
    expect(Object.keys(sectionLines.en).sort()).toEqual(Object.keys(sectionLines.fr).sort());
    for (const id of Object.keys(sectionLines.fr)) {
      expect(sectionLines.en[id]).toHaveLength(sectionLines.fr[id].length);
    }
    expect(projectLines.en).toHaveLength(projectLines.fr.length);
  });

  it('répliques de projet : le gabarit {titre} est gardé dans chaque langue', () => {
    expect(projectLines.en.every((l) => l.includes('{titre}'))).toBe(true);
  });
});
```

Remplacer tout le contenu de `src/data/marvinLines.test.ts` par :

```ts
import { describe, expect, it } from 'vitest';
import { LANGS } from '../i18n/utils';
import * as marvinLines from './marvinLines';
import { pageLines, projectLines } from './marvinLines';

describe('marvinLines', () => {
  it("fournit au moins trois répliques d'amorce pour l'accueil, dans chaque langue", () => {
    for (const lang of LANGS) {
      expect(pageLines[lang].home!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('couvre les pages de liste', () => {
    for (const lang of LANGS) {
      expect(pageLines[lang].projects!.length).toBeGreaterThan(0);
      expect(pageLines[lang].blog!.length).toBeGreaterThan(0);
    }
  });

  it('ne garde pas de répliques pour les pages sans bulle', () => {
    // contact est exclu par le §4 ; wargames n'utilise pas BaseLayout.
    for (const lang of LANGS) {
      expect(pageLines[lang].contact).toBeUndefined();
      expect(pageLines[lang].wargames).toBeUndefined();
    }
  });

  it('conserve les répliques des pages projet, avec leur gabarit', () => {
    for (const lang of LANGS) {
      expect(projectLines[lang].some((l) => l.includes('{titre}'))).toBe(true);
    }
  });

  it("n'expose plus pickLine, le tirage étant passé côté client", () => {
    expect(Object.keys(marvinLines)).not.toContain('pickLine');
  });
});
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `bun run test src/data`
Expected : FAIL (`./companies` introuvable, `pageLines.fr` indéfini).

- [ ] **Step 3 : `parcours.ts`**

Ajouter `import type { Lang } from '../i18n/utils';` en tête. Garder l'interface `ParcoursEntry` telle quelle. Remplacer `export const parcours: ParcoursEntry[] = [ ... ];` par `export const parcours: Record<Lang, ParcoursEntry[]> = { fr: [ ... ], en: [ ... ] };`. Le tableau `fr` reprend **mot pour mot** les 7 entrées actuelles. Le tableau `en` :

```ts
  en: [
    {
      periode: 'July—August 2026',
      titre: 'Tutor — École 42 Perpignan Piscine',
      entreprise: 'École 42 Perpignan',
      desc: "Supported candidates during the Piscine (42's month-long admission bootcamp): helping them get unstuck on bugs and compilation errors, encouraging a self-reliant method (search, test, debug on your own) without handing out solutions, tracking their progress and giving constructive feedback.",
    },
    {
      periode: '2025—2026',
      titre: 'Trainer — Retail management software (Shop & Co)',
      entreprise: 'AMOPI',
      desc: 'Two-day on-site training sessions for owners and staff of client stores: back office, purchasing/receiving/supplier returns, stock management and inventory counts, product records and advanced search, pricing, labels and customer management, sales statistics.',
    },
    {
      periode: 'Jan 2026—Jun 2026',
      titre: 'Backend & DevOps Developer',
      entreprise: 'AMOPI',
      desc: 'Hardened and migrated a critical data infrastructure: moved PHP gateways to Python, built Grafana/Prometheus dashboards for real-time monitoring of multi-store stock flows, set up Jenkins pipelines and Docker pre-production environments.',
    },
    {
      periode: '2021—2026',
      titre: 'Freelance Full-Stack Developer & Consultant',
      entreprise: 'Freelance',
      desc: 'Designing custom business solutions: migrating a legacy Django codebase to a hexagonal architecture, field mobile apps (Flutter, Zebra scanners), React/Django web portals, ETL pipelines. Writing user guides and training clients.',
    },
    {
      periode: '2023—2026',
      titre: 'École 42 Perpignan',
      entreprise: '',
      desc: 'Core curriculum completed: algorithms and systems programming in C (Minishell, Philosophers), C++ and networking (C++ modules, webserv, NetPractice), raycasting (cub3D), Docker (Inception) and real-time web (ft_transcendence). Currently in the specialization track, working through the Python for Data Science Piscine. Learning Rust in depth on the side, and took part in the Cyber Piscine.',
    },
    {
      periode: '2006—2022',
      titre: 'IT Support & Systems Administration',
      entreprise: 'Lafarge, Steria, Ministère de la Santé, LCL, AMOPI',
      desc: 'Systems administration and support, from day-to-day operations up to level 3 support: securing sensitive systems, automation scripting (PowerShell/Bash) and large-scale migrations (Active Directory, MS Exchange), industrializing deployments, network administration, troubleshooting complex failures.',
    },
    {
      periode: '2000',
      titre: 'BTS in Business Computing (2-year technical degree)',
      entreprise: 'Lycée Jean Lurçat, Perpignan',
      desc: 'Software development track.',
    },
  ],
```

- [ ] **Step 4 : `skills.ts`**

Remplacer le fichier par (le bloc `fr` reprend mot pour mot l'objet actuel) :

```ts
import type { Lang } from '../i18n/utils';

export const skills: Record<Lang, Record<string, string[]>> = {
  fr: {
    // … l'objet actuel, inchangé, de "Conception & qualité" à "École 42"
  },
  en: {
    'Design & quality': [
      'Hexagonal architecture',
      'DDD',
      'Ports & Adapters',
      'TDD',
      'Clean Code',
      'REST APIs',
      'API contract testing',
      'Strict typing (mypy)',
    ],
    Backend: ['Python', 'Django', 'DRF', 'JWT', 'Pytest', 'Node.js', 'AdonisJS'],
    Frontend: [
      'React',
      'Next.js',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'shadcn / Radix UI',
      'React Query',
      'Zustand',
    ],
    Mobile: [
      'Flutter',
      'Dart',
      'React Native',
      'Expo / EAS',
      'MobX',
      'Offline-first (SQLite)',
      'Zebra / Sunmi devices',
    ],
    Data: [
      'PostgreSQL',
      'SQL Server',
      'MySQL',
      'SQLite',
      'SQLAlchemy',
      'Prisma',
      'ETL pipelines',
      'Web scraping',
    ],
    'DevOps & automation': [
      'Docker / Compose',
      'Nginx',
      'Gunicorn',
      'GitHub Actions',
      'Jenkins',
      'Grafana',
      'Prometheus',
      'Git',
    ],
    'Integration & legacy': [
      'Delphi (FireDAC)',
      'ERP synchronization',
      'Database reverse engineering',
      'Google Apps Script',
      'Google APIs (Sheets, Calendar, Drive)',
      'OAuth2',
      'FTP / CSV exchanges',
    ],
    'École 42': [
      'C',
      'C++',
      'Rust',
      'Systems programming',
      'Threads & mutexes',
      'TCP/IP networking',
      'Sockets & HTTP server',
      'Raycasting (MiniLibX)',
      'Real-time web',
      'Cybersecurity',
      'Python for Data Science (in progress)',
    ],
  },
};
```

Le commentaire `// … l'objet actuel` ci-dessus est une consigne de copie, pas du code à laisser : coller le contenu réel.

- [ ] **Step 5 : `temoignages.ts`**

Ajouter `import type { Lang } from '../i18n/utils';`, garder l'interface, et exporter `temoignages: Record<Lang, Temoignage[]>` avec `fr` = le tableau actuel mot pour mot, et :

```ts
  en: [
    {
      name: 'Hugo Aguado',
      title: 'COO',
      company: 'AMOPI RETAIL SAS',
      quote: 'I had the pleasure of working with Martin on several strategic projects at AMOPI. He rewrote import/export flows in Python with Jenkins, redeveloped an Android application in Flutter, and took over and maintained a legacy application built in Delphi. Martin showed great professionalism throughout his assignments. His technical expertise, his ability to adapt to varied environments and technologies, and his autonomy allowed him to deliver high-quality work. Beyond his technical skills, I particularly appreciated his good humor and excellent interpersonal skills, which make him a very pleasant partner day to day. I recommend Martin without the slightest hesitation.',
    },
    {
      name: 'Yassine Hniche',
      title: 'CTO',
      company: 'AMOPI',
      quote: 'I had the pleasure of working with Martin on several development projects for AMOPI. Martin has always been very professional, committed and reliable. He quickly understood our business needs and proposed suitable technical solutions, while meeting the agreed deadlines. The quality of his work is there, with clean code, stable releases and an excellent ability to solve the problems that came up. Beyond his technical skills, Martin is pleasant to work with, responsive and a good listener. I recommend Martin without hesitation.',
    },
    {
      name: 'Nicolas Cudel',
      title: 'CIO',
      company: 'Surikwat',
      quote: 'Martin has repeatedly met my expectations, delivering projects that stayed true to the requirements. What is more, deadlines were always met, which is not necessarily the norm in this field.',
    },
  ],
```

- [ ] **Step 6 : `companies.ts`**

Aujourd'hui les clients existent en deux exemplaires : dans `IlsMeFontConfiance.astro` (logo, accroche) et dans `chat.ts` (description). Les URLs de JurisPerform divergent : on garde celle de la section, mise à jour dans le dernier commit (`fb7ce6e`).

`src/data/companies.ts` :

```ts
import type { Lang } from '../i18n/utils';

export interface Company {
  name: string;
  url: string;
  logo: string;
  /** Fond du cadre du logo, selon les couleurs du logo. */
  logoBg: 'white' | 'dark';
  /** Accroche courte, affichée sous le logo. */
  tagline: string;
  /** Description complète, injectée dans le prompt de Marvin. */
  desc: string;
}

const base = [
  { name: 'Amopi', url: 'https://amopi.fr', logo: '/amopi.png', logoBg: 'white' },
  { name: 'JurisPerform', url: 'https://www.juris-perform.fr/', logo: '/jurisperform.png', logoBg: 'white' },
  { name: 'Surikwat', url: 'https://surikwat.com', logo: '/surikwat.png', logoBg: 'dark' },
] as const;

const textes: Record<Lang, { tagline: string; desc: string }[]> = {
  fr: [
    {
      tagline: 'Transformation numérique & cloud',
      desc: "Le Groupe Amopi accompagne la transformation numérique des entreprises, particulièrement dans le secteur du commerce, en proposant une offre globale allant de l'intégration de logiciels de gestion et d'équipements de point de vente à l'hébergement cloud et l'infogérance.",
    },
    {
      tagline: 'Conseil & formation pour le droit',
      desc: "Cabinet de conseil et organisme de formation dédié aux professionnels du droit (avocats, notaires, commissaires de justice), spécialisé dans l'accompagnement stratégique, le management et le développement de la performance de leurs cabinets.",
    },
    {
      tagline: 'Studio créatif web & print',
      desc: 'Studio créatif de communication (web et print) basé dans les Pyrénées-Orientales, spécialisé dans la création de sites internet sur mesure, le design graphique et la production de contenus audiovisuels.',
    },
  ],
  en: [
    {
      tagline: 'Digital transformation & cloud',
      desc: "The Amopi Group supports businesses' digital transformation, particularly in retail, with a complete offering that ranges from management software and point-of-sale equipment integration to cloud hosting and managed IT services.",
    },
    {
      tagline: 'Consulting & training for legal professionals',
      desc: 'Consulting firm and training organization dedicated to legal professionals (lawyers, notaries, judicial officers), specializing in strategic support, management and performance development for their firms.',
    },
    {
      tagline: 'Creative web & print studio',
      desc: 'Creative communication studio (web and print) based in the Pyrénées-Orientales, France, specializing in custom websites, graphic design and audiovisual content production.',
    },
  ],
};

export const companies: Record<Lang, Company[]> = {
  fr: base.map((c, i) => ({ ...c, ...textes.fr[i] })),
  en: base.map((c, i) => ({ ...c, ...textes.en[i] })),
};
```

- [ ] **Step 7 : `marvinLines.ts`**

Garder le commentaire d'en-tête. Ajouter les imports, et remplacer les trois exports :

```ts
import type { RouteId } from '../i18n/routes';
import type { Lang } from '../i18n/utils';

/** Variantes par page, indexées sur l'identifiant de route (voir src/i18n/routes.ts). */
export const pageLines: Record<Lang, Partial<Record<RouteId, string[]>>> = {
  fr: {
    home: [ /* les 3 répliques actuelles de '/' */ ],
    projects: [ /* les 3 répliques actuelles de '/projets' */ ],
    blog: [ /* les 2 répliques actuelles de '/blog' */ ],
  },
  en: {
    home: [
      "Welcome! If you'd like to know more about Martin, I can show you around.",
      'Want to explore his background, projects or skills? I can help with that.',
      "There's quite a bit to discover here. If you're looking for something specific, just ask.",
    ],
    projects: [
      'Here are some of the applications and solutions Martin has built.',
      'Business apps, integrations, legacy takeovers... Feel free to browse his work.',
      'Each project tells part of his story. Ask me if you want more details.',
    ],
    blog: [
      "Welcome to the blog. You'll find thoughts on software development and his experience.",
      'A few articles to get a feel for how he works and how he sees development.',
    ],
  },
};

/** Variantes par section de la page d'accueil, indexées sur l'id du <section>. */
export const sectionLines: Record<Lang, Record<string, string[]>> = {
  fr: { /* l'objet actuel, inchangé */ },
  en: {
    apropos: [
      'Martin favors solutions that fit the business over whatever technology is trending.',
      'His background combines development, infrastructure and support. Handy when you need to think about what happens after launch.',
      'Before focusing on development, Martin spent nearly 20 years in infrastructure and support.',
    ],
    competences: [
      'Web, mobile, backend, DevOps... Martin picks his tools based on what the project needs.',
      'Django, React, Flutter, Rust, Docker... The technology is chosen for the project, not the other way around.',
      'His experience covers modern stacks as well as taking over existing applications.',
    ],
    confiance: [
      'These companies brought Martin in for projects running in real-world conditions.',
      'Real projects, systems in production, and working relationships that last.',
    ],
    temoignages: [
      'A few words from people who worked directly with Martin.',
      'These testimonials give another view of how he works.',
      'Beyond the technical side, his clients also mention how well he understands their needs.',
    ],
    parcours: [
      'Before development, Martin built his experience in infrastructure and critical support.',
      'From infrastructure to application development: a path that lets him see a project as a whole.',
      'After nearly 20 years in infrastructure, Martin specialized in application development.',
    ],
    projets: [
      "Here's a selection of projects Martin has delivered.",
      'Business, web and mobile apps, integrations: take a look at some of his work.',
    ],
  },
};

/** Variantes pour une page de détail projet. `{titre}` est remplacé au rendu. */
export const projectLines: Record<Lang, string[]> = {
  fr: [ /* les 3 répliques actuelles */ ],
  en: [
    'Find out how {titre} was designed and the choices made to meet the need.',
    "Here's {titre} in detail, from the initial goal to the technical choices.",
    '{titre} in detail: context, solution and main challenges.',
  ],
};
```

Comme pour `skills`, les commentaires `/* … actuelles */` sont des consignes : coller les chaînes existantes mot pour mot.

- [ ] **Step 8 : adapter les consommateurs (le site reste en FR)**

- `src/components/sections/Parcours.astro` : `{parcours.map(` → `{parcours.fr.map(`
- `src/components/sections/Skills.astro` : `Object.entries(skills)` → `Object.entries(skills.fr)`
- `src/components/sections/Temoignages.astro` : les deux `temoignages.map(` → `temoignages.fr.map(`
- `src/components/sections/IlsMeFontConfiance.astro` : remplacer tout le frontmatter par :

  ```astro
  ---
  import { companies } from '../../data/companies';
  const liste = companies.fr;
  ---
  ```

  Puis dans le markup : `{companies.map((c, i) => (` → `{liste.map((c, i) => (`, `style={c.bgWhite ? … : c.bgDark ? … : ''}` → `style={c.logoBg === 'white' ? 'background: #fff; padding: 6px; border-radius: 4px;' : 'background: #1a1a1a; padding: 6px; border-radius: 4px;'}`, et `{c.desc}` → `{c.tagline}`.
- `src/pages/index.astro` : `pageLines['/']` → `pageLines.fr.home`, `sectionLines={sectionLines}` → `sectionLines={sectionLines.fr}`
- `src/pages/projets.astro` : `pageLines['/projets']` → `pageLines.fr.projects`
- `src/pages/blog.astro` : `pageLines['/blog']` → `pageLines.fr.blog`
- `src/pages/projets/[slug].astro` : `projectLines.map(` → `projectLines.fr.map(`
- `src/pages/api/chat.ts` : supprimer la constante locale `companies`, ajouter `import { companies } from '../../data/companies';`, puis remplacer `parcours` → `parcours.fr`, `Object.entries(skills)` → `Object.entries(skills.fr)`, `companies` → `companies.fr`, `temoignages` → `temoignages.fr` dans `buildSystemPrompt`.

- [ ] **Step 9 : vérifier**

Run : `bun run test`
Expected : PASS, 0 échec (le test en échec au départ est corrigé).

Run : `bun run build`
Expected : build OK, sans erreur de type ni d'import.

- [ ] **Step 10 : commit**

```bash
git add src/data src/components/sections src/pages
git commit -m "feat(i18n): data files bilingues et clients centralisés

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4 : Collections localisées (helpers)

**Files:**
- Create: `src/i18n/content.ts`, `src/i18n/content.test.ts`, `src/i18n/collections.ts`

**Interfaces:**
- Consumes : `Lang`, `isLang`, `otherLang` (tâche 1).
- Produces :
  - `interface Localized<E> { entry: E; slug: string; contentLang: Lang; isFallback: boolean }`
  - `splitId(id: string): { lang: Lang | null; slug: string }`
  - `localizeEntries<E extends { id: string }>(entries: E[], lang: Lang): Localized<E>[]`
  - `type LocalizedProject = Localized<CollectionEntry<'projects'>>`, `type LocalizedPost = Localized<CollectionEntry<'blog'>>`
  - `getLocalizedCollection<C extends 'projects' | 'blog'>(name: C, lang: Lang): Promise<Localized<CollectionEntry<C>>[]>`, triée du plus récent au plus ancien
  - `localizedStaticPaths(name: 'projects' | 'blog', lang: Lang)` → `{ params: { slug }, props: { item } }[]`

`localizeEntries` est pur et générique : il se teste avec des objets `{ id }` sans Astro. `collections.ts` importe `astro:content`, qui n'existe pas sous Vitest ; il reste volontairement fin et n'est vérifié que par le build.

- [ ] **Step 1 : écrire le test qui échoue**

`src/i18n/content.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { localizeEntries, splitId } from './content';

const e = (id: string) => ({ id });

describe('splitId', () => {
  it('sépare la langue du slug', () => {
    expect(splitId('fr/amiqo')).toEqual({ lang: 'fr', slug: 'amiqo' });
    expect(splitId('en/amiqo')).toEqual({ lang: 'en', slug: 'amiqo' });
  });

  it("ne reconnaît pas de langue sans préfixe valide", () => {
    expect(splitId('amiqo')).toEqual({ lang: null, slug: 'amiqo' });
    expect(splitId('de/amiqo')).toEqual({ lang: null, slug: 'de/amiqo' });
  });
});

describe('localizeEntries', () => {
  const entrees = [e('fr/amiqo'), e('en/amiqo'), e('fr/seulement-fr'), e('en/only-en')];

  it("sert la version de la langue demandée quand elle existe", () => {
    const en = localizeEntries(entrees, 'en');
    expect(en.find((x) => x.slug === 'amiqo')).toEqual({
      entry: e('en/amiqo'),
      slug: 'amiqo',
      contentLang: 'en',
      isFallback: false,
    });
  });

  it("retombe sur l'autre langue, en le signalant", () => {
    const en = localizeEntries(entrees, 'en');
    expect(en.find((x) => x.slug === 'seulement-fr')).toEqual({
      entry: e('fr/seulement-fr'),
      slug: 'seulement-fr',
      contentLang: 'fr',
      isFallback: true,
    });
  });

  it('le repli marche dans les deux sens', () => {
    const fr = localizeEntries(entrees, 'fr');
    expect(fr.find((x) => x.slug === 'only-en')?.isFallback).toBe(true);
  });

  it('ne sert chaque slug qu\'une fois', () => {
    expect(localizeEntries(entrees, 'fr').map((x) => x.slug).sort()).toEqual([
      'amiqo',
      'only-en',
      'seulement-fr',
    ]);
  });

  it('ignore les fichiers rangés hors des dossiers fr/ et en/', () => {
    expect(localizeEntries([e('perdu')], 'fr')).toEqual([]);
  });
});
```

- [ ] **Step 2 : vérifier que le test échoue**

Run : `bun run test src/i18n/content.test.ts`
Expected : FAIL, `Failed to resolve import "./content"`.

- [ ] **Step 3 : implémenter**

`src/i18n/content.ts` :

```ts
import { isLang, otherLang, type Lang } from './utils';

export interface Localized<E> {
  entry: E;
  /** Slug sans préfixe de langue : c'est lui qui fait le lien FR ↔ EN. */
  slug: string;
  /** Langue réelle du contenu, qui diffère de la page en cas de repli. */
  contentLang: Lang;
  isFallback: boolean;
}

/** Les ids du loader glob sont de la forme `fr/amiqo`. */
export function splitId(id: string): { lang: Lang | null; slug: string } {
  const i = id.indexOf('/');
  if (i < 0) return { lang: null, slug: id };

  const tete = id.slice(0, i);
  return isLang(tete) ? { lang: tete, slug: id.slice(i + 1) } : { lang: null, slug: id };
}

/**
 * Une entrée par slug, dans la langue demandée si elle existe, sinon dans
 * l'autre (repli signalé). Ainsi toute page existe dans les deux langues, et
 * le switch n'a jamais à chercher d'équivalent.
 */
export function localizeEntries<E extends { id: string }>(entries: E[], lang: Lang): Localized<E>[] {
  const parSlug = new Map<string, Partial<Record<Lang, E>>>();
  for (const entree of entries) {
    const { lang: l, slug } = splitId(entree.id);
    if (!l) continue;
    parSlug.set(slug, { ...parSlug.get(slug), [l]: entree });
  }

  const resultat: Localized<E>[] = [];
  for (const [slug, versions] of parSlug) {
    const propre = versions[lang];
    if (propre) {
      resultat.push({ entry: propre, slug, contentLang: lang, isFallback: false });
      continue;
    }
    const autre = otherLang(lang);
    const repli = versions[autre];
    if (repli) resultat.push({ entry: repli, slug, contentLang: autre, isFallback: true });
  }
  return resultat;
}
```

`src/i18n/collections.ts` :

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import { localizeEntries, type Localized } from './content';
import type { Lang } from './utils';

type Nom = 'projects' | 'blog';

export type LocalizedProject = Localized<CollectionEntry<'projects'>>;
export type LocalizedPost = Localized<CollectionEntry<'blog'>>;

/** Collection vue depuis une langue, du plus récent au plus ancien. */
export async function getLocalizedCollection<C extends Nom>(
  name: C,
  lang: Lang
): Promise<Localized<CollectionEntry<C>>[]> {
  const entrees = (await getCollection(name)) as CollectionEntry<C>[];
  return localizeEntries(entrees, lang).sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime()
  );
}

/** `getStaticPaths` commun aux pages de détail des deux langues. */
export async function localizedStaticPaths(name: Nom, lang: Lang) {
  const items = await getLocalizedCollection(name, lang);
  return items.map((item) => ({ params: { slug: item.slug }, props: { item } }));
}
```

- [ ] **Step 4 : vérifier que les tests passent**

Run : `bun run test src/i18n`
Expected : PASS.

- [ ] **Step 5 : commit**

```bash
git add src/i18n/content.ts src/i18n/content.test.ts src/i18n/collections.ts
git commit -m "feat(i18n): collections localisées avec repli entre langues

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 : Layout, nav et switch de langue

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `src/components/nav/MenuMobile.tsx`, `src/styles/retro.css`
- Modify (ajout de `lang="fr"` sur `<BaseLayout>`) : `src/pages/index.astro`, `projets.astro`, `projets/[slug].astro`, `blog.astro`, `blog/[slug].astro`, `contact.astro`

**Interfaces:**
- Consumes : `t` (tâche 2) ; `alternatePath`, `buildPath`, `localizePath`, `otherLang`, `switchHref`, `OG_LOCALE`, `LANG_CHOICE_KEY`, `Lang` (tâche 1).
- Produces :
  - `BaseLayout` props : `{ lang: Lang; title: string; description?: string; peekLines?: string[]; sectionLines?: Record<string, string[]> }`
  - `MenuMobile` props : `{ lang?: Lang; altHref?: string }` (défauts `'fr'` et `'/en/'`)
  - Tout lien `a[data-lang-switch="<lang>"]` enregistre le choix dans `localStorage[LANG_CHOICE_KEY]` et recolle l'ancre courante au clic (utilisé aussi par la tâche 10).

- [ ] **Step 1 : `BaseLayout.astro`, frontmatter**

Remplacer le frontmatter par :

```astro
---
import '../styles/retro.css';
import MarvinDock from '../components/chatbot/MarvinDock.tsx';
import MenuMobile from '../components/nav/MenuMobile.tsx';
import { t } from '../i18n/ui';
import {
  alternatePath,
  buildPath,
  localizePath,
  OG_LOCALE,
  otherLang,
  type Lang,
} from '../i18n/utils';

export interface Props {
  lang: Lang;
  title: string;
  description?: string;
  /** Répliques d'amorce de la page. Absent = pas de bulle. */
  peekLines?: string[];
  /** Répliques par section observable, indexées sur l'id du `<section>`. */
  sectionLines?: Record<string, string[]>;
}

const { lang, title, description = t(lang)['layout.defaultDescription'], peekLines, sectionLines } =
  Astro.props;
const d = t(lang);
const autre = otherLang(lang);

// URLs absolues requises par Open Graph et hreflang. Astro.site vient de `site` dans astro.config.mjs.
const pathname = Astro.url.pathname;
const canonicalUrl = new URL(pathname, Astro.site);
const hrefFr = new URL(localizePath(pathname, 'fr'), Astro.site);
const hrefEn = new URL(localizePath(pathname, 'en'), Astro.site);
const ogImageUrl = new URL('/og-image.jpg', Astro.site);
const altHref = alternatePath(pathname);

const liens = [
  { href: buildPath('home', lang), label: d['nav.home'] },
  { href: buildPath('projects', lang), label: d['nav.projects'] },
  { href: buildPath('home', lang, undefined, '#parcours'), label: d['nav.parcours'] },
  { href: buildPath('home', lang, undefined, '#confiance'), label: d['nav.partners'] },
  { href: buildPath('blog', lang), label: d['nav.blog'] },
];
---
```

- [ ] **Step 2 : `BaseLayout.astro`, `<head>`**

- `<html lang="fr">` → `<html lang={lang}>`
- Après `<link rel="canonical" href={canonicalUrl} />`, ajouter :

  ```astro
      <link rel="alternate" hreflang="fr" href={hrefFr} />
      <link rel="alternate" hreflang="en" href={hrefEn} />
      <link rel="alternate" hreflang="x-default" href={hrefFr} />
  ```

- `<meta property="og:locale" content="fr_FR" />` → 

  ```astro
      <meta property="og:locale" content={OG_LOCALE[lang]} />
      <meta property="og:locale:alternate" content={OG_LOCALE[autre]} />
  ```

- [ ] **Step 3 : `BaseLayout.astro`, nav, footer, lightbox**

Remplacer le bloc `<nav …> … </nav>` par :

```astro
    <nav class="nav-barre fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);">
      <a href={buildPath('home', lang)} class="flex items-center">
        <img src="/martininfologo.jpeg" alt="Martin Info" class="nav-logo" />
      </a>

      <div class="hidden md:flex items-center gap-6 text-sm">
        {liens.map((l) => (
          <a href={l.href} class="nav-link" style="color: var(--ink-soft);">{l.label}</a>
        ))}
        <span class="lang-switch">
          {lang === 'fr' ? <strong>FR</strong> : (
            <a href={altHref} data-lang-switch="fr" hreflang="fr" lang="fr" aria-label={d['nav.switchAria']} class="nav-link">FR</a>
          )}
          <span aria-hidden="true">|</span>
          {lang === 'en' ? <strong>EN</strong> : (
            <a href={altHref} data-lang-switch="en" hreflang="en" lang="en" aria-label={d['nav.switchAria']} class="nav-link">EN</a>
          )}
        </span>
        <span style="color: var(--border);">│</span>
        <a href={buildPath('contact', lang)} class="btn-retro" style="padding: 8px 20px; font-size: 0.875rem;">{d['nav.contact']}</a>
      </div>

      <div class="md:hidden">
        <MenuMobile client:idle lang={lang} altHref={altHref} />
      </div>
    </nav>
```

Footer : `<p class="text-sm">© 2026 Martin Info — Portfolio rétro 90s</p>` → `<p class="text-sm">{d['layout.footer']}</p>`.

Lightbox : `aria-label="Fermer"` → `aria-label={d['layout.lightboxClose']}`.

- [ ] **Step 4 : `BaseLayout.astro`, script du switch**

En tête du `<script>` existant (celui de la lightbox), ajouter :

```ts
  import { LANG_CHOICE_KEY, switchHref } from '../i18n/utils';

  // Switch de langue : on retient le choix (le bandeau de suggestion ne
  // reviendra plus) et on garde la section courante. Délégation sur le
  // document, pour couvrir aussi les liens rendus dans des portails React.
  document.addEventListener('click', (e) => {
    const lien = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-lang-switch]');
    if (!lien) return;
    try {
      localStorage.setItem(LANG_CHOICE_KEY, lien.dataset.langSwitch ?? '');
    } catch {
      // Navigation privée : le choix ne sera pas retenu, la navigation se fait quand même.
    }
    lien.href = switchHref(lien.getAttribute('href') ?? '', location.hash);
  });
```

- [ ] **Step 5 : `MenuMobile.tsx`**

Remplacer la constante `LIENS` et la signature par :

```tsx
import { t } from '../../i18n/ui';
import { buildPath, normalizePath, otherLang, type Lang } from '../../i18n/utils';

interface MenuMobileProps {
  lang?: Lang;
  /** Page équivalente dans l'autre langue. */
  altHref?: string;
}

/** Les destinations, dans l'ordre de la nav de bureau. Contact est à part : il
 *  garde sa pilule et se place en bas de liste. */
function liens(lang: Lang) {
  const d = t(lang);
  return [
    { href: buildPath('home', lang), libelle: d['nav.home'] },
    { href: buildPath('projects', lang), libelle: d['nav.projects'] },
    { href: buildPath('home', lang, undefined, '#parcours'), libelle: d['nav.parcours'] },
    { href: buildPath('home', lang, undefined, '#confiance'), libelle: d['nav.partners'] },
    { href: buildPath('blog', lang), libelle: d['nav.blog'] },
  ];
}

export default function MenuMobile({ lang = 'fr', altHref = '/en/' }: MenuMobileProps) {
  const d = t(lang);
  const LIENS = liens(lang);
```

Puis dans le corps :
- `const estActif = (href: string) => !href.includes('#') && chemin === href;` → `const estActif = (href: string) => !href.includes('#') && normalizePath(chemin) === normalizePath(href);`
- `aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}` → `aria-label={ouvert ? d['nav.menuClose'] : d['nav.menuOpen']}`
- `aria-label="Navigation"` → `aria-label={d['nav.menuLabel']}`
- Juste avant le lien Contact du panneau, ajouter :

  ```tsx
              <a
                href={altHref}
                data-lang-switch={otherLang(lang)}
                hrefLang={otherLang(lang)}
                lang={otherLang(lang)}
                className="menu-lien"
                onClick={fermer}
              >
                <span aria-hidden="true">&gt;</span>
                {d['nav.otherLangName']}
              </a>
  ```

- `<a href="/contact" className="menu-contact btn-retro" onClick={fermer}>Contact</a>` → `<a href={buildPath('contact', lang)} className="menu-contact btn-retro" onClick={fermer}>{d['nav.contact']}</a>`

- [ ] **Step 6 : CSS du switch**

Ajouter à la fin de `src/styles/retro.css` :

```css
/* Switch FR | EN de la nav */
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--ink-faint);
}
.lang-switch strong {
  color: var(--accent-hover);
}
```

- [ ] **Step 7 : passer `lang="fr"` aux pages existantes**

Dans `src/pages/index.astro`, `projets.astro`, `projets/[slug].astro`, `blog.astro`, `blog/[slug].astro`, `contact.astro` : ajouter l'attribut `lang="fr"` à chaque `<BaseLayout …>`.

- [ ] **Step 8 : vérifier**

Run : `bun run test && bun run build`
Expected : tests PASS, build OK.

Run : `grep -o 'hreflang="en" href="[^"]*"' dist/client/projets/index.html`
Expected : `hreflang="en" href="https://martininfo.fr/en/projects"`. Si `dist/client/` n'existe pas, localiser le HTML avec `find dist -name index.html -path '*projets*'`.

- [ ] **Step 9 : commit**

```bash
git add src/layouts/BaseLayout.astro src/components/nav/MenuMobile.tsx src/styles/retro.css src/pages
git commit -m "feat(i18n): layout, nav localisée, hreflang et switch FR|EN

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6 : Composants de page, sections localisées et pages EN

**Files:**
- Move: `src/content/projects/*.md` → `src/content/projects/fr/`, `src/content/blog/*.md` → `src/content/blog/fr/`
- Create: `src/components/i18n/OnlyInBadge.astro`, `src/components/pages/{HomePage,ProjectsPage,ProjectPage,BlogPage,BlogPostPage,ContactPage}.astro`
- Create: `src/pages/en/index.astro`, `src/pages/en/projects.astro`, `src/pages/en/projects/[slug].astro`, `src/pages/en/blog.astro`, `src/pages/en/blog/[slug].astro`, `src/pages/en/contact.astro`
- Modify (deviennent des coquilles) : `src/pages/index.astro`, `projets.astro`, `projets/[slug].astro`, `blog.astro`, `blog/[slug].astro`, `contact.astro`
- Modify: `src/components/sections/*.astro`, `src/pages/api/contact.ts`, `src/pages/api/chat.ts`

**Interfaces:**
- Consumes : `getLocalizedCollection`, `localizedStaticPaths`, `LocalizedProject`, `LocalizedPost` (tâche 4) ; `t` (tâche 2) ; `buildPath`, `formatDate`, `parseLang` (tâche 1) ; data `Record<Lang, …>` (tâche 3) ; `BaseLayout` avec `lang` (tâche 5).
- Produces : chaque section prend une prop `lang: Lang` ; `ApercuProjets` prend `{ lang: Lang; items: LocalizedProject[] }` ; `ProjectPage` prend `{ lang; item: LocalizedProject }` ; `BlogPostPage` prend `{ lang; item: LocalizedPost }`.

À la fin de cette tâche, les pages EN existent mais projets et blog y sont servis en FR avec le badge « French only » (les `.md` anglais arrivent en tâche 11). C'est le fallback qui travaille, et c'est voulu.

- [ ] **Step 1 : déplacer le contenu**

```bash
mkdir -p src/content/projects/fr src/content/blog/fr
git mv src/content/projects/*.md src/content/projects/fr/
git mv src/content/blog/*.md src/content/blog/fr/
```

`src/content.config.ts` n'a pas à changer : le motif `**/*.md` descend déjà dans les sous-dossiers, et les ids deviennent `fr/<slug>`.

- [ ] **Step 2 : badge de repli**

`src/components/i18n/OnlyInBadge.astro` :

```astro
---
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';

export interface Props {
  /** Langue de la page, pas du contenu : le badge s'adresse au lecteur. */
  lang: Lang;
}

const { lang } = Astro.props;
---

<span
  class="inline-block text-xs px-2 py-1 mb-2 font-mono rounded-full"
  style="background: var(--accent-soft); color: var(--ink-soft); border: 1px dashed var(--border);"
>
  {t(lang)['content.onlyIn']}
</span>
```

- [ ] **Step 3 : sections**

Chaque section reçoit `lang`. Ajouter en tête du frontmatter de chacune :

```astro
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const d = t(lang);
```

(`ApercuProjets` a une interface différente, voir plus bas.)

Remplacements de texte :

**`Hero.astro`**
- `Développeur concepteur d'applications — Web, mobile &amp; DevOps` → `{d['hero.badge']}`
- `&gt; Je crée des applications qui s'adaptent à votre métier.` → `&gt; {d['hero.tagline']}`
- `Applications web et mobiles sur mesure, …dans la durée.` → `{d['hero.sub']}`
- `&gt; Basé à Perpignan, disponible en full remote` → `&gt; {d['hero.location']}`
- `<a href="/projets" class="btn-retro">Voir les projets</a>` → `<a href={buildPath('projects', lang)} class="btn-retro">{d['hero.ctaProjects']}</a>`
- `<a href="/contact" class="btn-retro">Discutons de votre besoin</a>` → `<a href={buildPath('contact', lang)} class="btn-retro">{d['hero.ctaContact']}</a>`
- Import supplémentaire : `import { buildPath } from '../../i18n/utils';`

**`APropos.astro`**
- `À propos` → `{d['about.title']}`
- `« Des outils au service de votre activité. »` → `{d['about.quote']}`
- les trois paragraphes → `{d['about.p1']}`, `{d['about.p2']}`, `{d['about.p3']}` (garder leurs classes)

**`Skills.astro`**
- `Compétences` → `{d['skills.title']}`, citation → `{d['skills.subtitle']}`
- `Object.entries(skills.fr)` → `Object.entries(skills[lang])`

**`IlsMeFontConfiance.astro`**
- frontmatter : `const liste = companies.fr;` → `const liste = companies[lang];` (plus le bloc commun)
- `Ils me font confiance` → `{d['trust.title']}`, sous-titre → `{d['trust.subtitle']}`

**`Parcours.astro`**
- `Parcours` → `{d['parcours.title']}`, sous-titre → `{d['parcours.subtitle']}`
- `parcours.fr.map(` → `parcours[lang].map(`

**`Temoignages.astro`**
- `Témoignages` → `{d['testimonials.title']}`
- `aria-label="Précédent"` → `aria-label={d['testimonials.prev']}`, `aria-label="Suivant"` → `aria-label={d['testimonials.next']}`
- les deux `temoignages.fr.map(` → `temoignages[lang].map(`
- bouton : `<button class="quote-toggle" aria-label="Voir plus">Lire la suite</button>` →
  ```astro
  <button class="quote-toggle" aria-label={d['testimonials.moreAria']} data-more={d['testimonials.more']} data-less={d['testimonials.less']}>{d['testimonials.more']}</button>
  ```
- dans le `<script>` : `btn.textContent = expanded ? 'Lire la suite' : 'Voir moins';` →
  ```ts
      const b = btn as HTMLElement;
      b.textContent = (expanded ? b.dataset.more : b.dataset.less) ?? '';
  ```
- après `<div class="carousel-dots">…</div>`, avant `</div>` du carrousel :
  ```astro
      {d['testimonials.translated'] && (
        <p class="quote-translated">{d['testimonials.translated']}</p>
      )}
  ```
- dans le `<style>` du composant :
  ```css
    .quote-translated {
      text-align: center;
      font-family: monospace;
      font-size: 0.75rem;
      font-style: italic;
      color: var(--ink-faint);
      margin-top: 0.75rem;
    }
  ```

**`ApercuProjets.astro`** : remplacer le frontmatter par :

```astro
---
import type { LocalizedProject } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { buildPath, type Lang } from '../../i18n/utils';
import { hasImage, initials } from '../../utils/projectImage';
import OnlyInBadge from '../i18n/OnlyInBadge.astro';

export interface Props {
  lang: Lang;
  /** Déjà triés du plus récent au plus ancien par getLocalizedCollection. */
  items: LocalizedProject[];
}

const { lang, items } = Astro.props;
const d = t(lang);
const displayed = items.slice(0, 4);
---
```

Dans le markup : `Projets récents` → `{d['projectsPreview.title']}`, sous-titre → `{d['projectsPreview.subtitle']}`, `displayed.map((p) => (` → `displayed.map(({ entry: p, slug, isFallback }) => (`, `href={`/projets/${p.id}`}` → `href={buildPath('projects', lang, slug)}`, ajouter `{isFallback && <OnlyInBadge lang={lang} />}` juste avant le `<h3>`, `projects.length > 4` → `items.length > 4`, `<a href="/projets" class="btn-retro">Voir tous les projets</a>` → `<a href={buildPath('projects', lang)} class="btn-retro">{d['projectsPreview.all']}</a>`.

- [ ] **Step 4 : composants de page**

`src/components/pages/HomePage.astro` :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Hero from '../sections/Hero.astro';
import APropos from '../sections/APropos.astro';
import Parcours from '../sections/Parcours.astro';
import Skills from '../sections/Skills.astro';
import ApercuProjets from '../sections/ApercuProjets.astro';
import IlsMeFontConfiance from '../sections/IlsMeFontConfiance.astro';
import Temoignages from '../sections/Temoignages.astro';
import { pageLines, sectionLines } from '../../data/marvinLines';
import { getLocalizedCollection } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const d = t(lang);
const projects = await getLocalizedCollection('projects', lang);
---

<BaseLayout
  lang={lang}
  title={d['home.title']}
  description={d['home.description']}
  peekLines={pageLines[lang].home}
  sectionLines={sectionLines[lang]}
>
  <Hero lang={lang} />
  <APropos lang={lang} />
  <Skills lang={lang} />
  <IlsMeFontConfiance lang={lang} />
  <Temoignages lang={lang} />
  <Parcours lang={lang} />
  <ApercuProjets lang={lang} items={projects} />
</BaseLayout>
```

`src/components/pages/ProjectsPage.astro` :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import OnlyInBadge from '../i18n/OnlyInBadge.astro';
import { pageLines } from '../../data/marvinLines';
import { getLocalizedCollection } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { buildPath, type Lang } from '../../i18n/utils';
import { hasImage, initials } from '../../utils/projectImage';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const d = t(lang);
const projects = await getLocalizedCollection('projects', lang);
---

<BaseLayout
  lang={lang}
  title={d['projects.title']}
  description={d['projects.description']}
  peekLines={pageLines[lang].projects}
>
  <section class="px-4 pt-24 pb-20 max-w-5xl mx-auto">
    <h2 class="section-title">{d['projects.heading']}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map(({ entry: p, slug, isFallback }) => (
        <a href={buildPath('projects', lang, slug)} class="card block no-underline">
          <div class="aspect-video mb-4 flex items-center justify-center overflow-hidden" style="background: var(--accent-soft); border: 1px solid var(--border);">
            {hasImage(p.data.image) ? (
              <img src={p.data.image} alt={p.data.title} class="w-full h-full object-cover" />
            ) : (
              <span class="text-4xl font-mono" style="color: var(--ink-faint);">
                {initials(p.data.title)}
              </span>
            )}
          </div>
          {isFallback && <OnlyInBadge lang={lang} />}
          <h3 class="font-bold text-lg mb-2" style="color: var(--ink);">{p.data.title}</h3>
          <p class="text-sm mb-3" style="color: var(--ink-soft);">{p.data.description}</p>
          <div class="flex flex-wrap gap-2">
            {p.data.tags.map(tag => (
              <span class="text-xs px-2 py-1 font-mono rounded-full" style="background: var(--accent-soft); color: var(--accent-hover); border: 1px solid oklch(62% 0.19 150 / 0.3);">
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

`src/components/pages/ProjectPage.astro` :

```astro
---
import { render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import OnlyInBadge from '../i18n/OnlyInBadge.astro';
import { projectLines } from '../../data/marvinLines';
import type { LocalizedProject } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { buildPath, type Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
  item: LocalizedProject;
}

const { lang, item } = Astro.props;
const d = t(lang);
const project = item.entry;
const { Content } = await render(project);

const peekLines = projectLines[lang].map((l) => l.replace('{titre}', project.data.title));
---

<BaseLayout
  lang={lang}
  title={`${project.data.title} — Martin Rabat`}
  description={project.data.description}
  peekLines={peekLines}
>
  <article class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <a href={buildPath('projects', lang)} class="text-sm mb-8 inline-block font-mono" style="color: var(--accent-hover);">{d['project.back']}</a>
    {item.isFallback && <div><OnlyInBadge lang={lang} /></div>}
    <h1 class="text-4xl font-bold mb-2" style="color: var(--ink);" lang={item.contentLang}>{project.data.title}</h1>
    <div class="flex flex-wrap gap-2 mb-6">
      {project.data.tags.map(tag => (
        <span class="text-xs px-2 py-1 font-mono rounded-full" style="background: var(--accent-soft); color: var(--accent-hover); border: 1px solid oklch(62% 0.19 150 / 0.3);">
          {tag}
        </span>
      ))}
    </div>
    <div class="prose max-w-none" style="color: var(--ink-soft);" lang={item.contentLang}>
      <Content />
    </div>
    <div class="flex gap-4 mt-8">
      {project.data.url && <a href={project.data.url} class="btn-retro" target="_blank">{d['project.visit']}</a>}
      {project.data.github && <a href={project.data.github} class="btn-retro" target="_blank">GitHub</a>}
    </div>
  </article>
</BaseLayout>
```

`src/components/pages/BlogPage.astro` :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import OnlyInBadge from '../i18n/OnlyInBadge.astro';
import { pageLines } from '../../data/marvinLines';
import { getLocalizedCollection } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { buildPath, formatDate, type Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const d = t(lang);
const posts = await getLocalizedCollection('blog', lang);
---

<BaseLayout
  lang={lang}
  title={d['blog.title']}
  description={d['blog.description']}
  peekLines={pageLines[lang].blog}
>
  <section class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <h2 class="section-title">{d['blog.heading']}</h2>
    <div class="space-y-6">
      {posts.map(({ entry: p, slug, isFallback }) => (
        <a href={buildPath('blog', lang, slug)} class="card block no-underline">
          <p class="text-xs font-mono mb-1" style="color: var(--ink-faint);">{formatDate(p.data.date, lang)}</p>
          {isFallback && <OnlyInBadge lang={lang} />}
          <h3 class="font-bold text-lg mb-1" style="color: var(--ink);">{p.data.title}</h3>
          <p class="text-sm mb-2" style="color: var(--ink-soft);">{p.data.description}</p>
          <div class="flex flex-wrap gap-2">
            {p.data.tags.map(tag => (
              <span class="text-xs px-2 py-1 font-mono rounded-full" style="background: var(--accent-soft); color: var(--accent-hover); border: 1px solid oklch(62% 0.19 150 / 0.3);">
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

`src/components/pages/BlogPostPage.astro` :

```astro
---
import { render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import OnlyInBadge from '../i18n/OnlyInBadge.astro';
import type { LocalizedPost } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { buildPath, formatDate, type Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
  item: LocalizedPost;
}

const { lang, item } = Astro.props;
const d = t(lang);
const post = item.entry;
const { Content } = await render(post);
---

<BaseLayout lang={lang} title={`${post.data.title} ${d['post.titleSuffix']}`} description={post.data.description}>
  <article class="px-4 pt-24 pb-20 max-w-3xl mx-auto">
    <a href={buildPath('blog', lang)} class="text-sm mb-8 inline-block font-mono" style="color: var(--accent-hover);">{d['post.back']}</a>
    <p class="text-xs font-mono mb-2" style="color: var(--ink-faint);">{formatDate(post.data.date, lang)}</p>
    {item.isFallback && <div><OnlyInBadge lang={lang} /></div>}
    <h1 class="text-4xl font-bold mb-4" style="color: var(--ink);" lang={item.contentLang}>{post.data.title}</h1>
    <div class="flex flex-wrap gap-2 mb-6">
      {post.data.tags.map(tag => (
        <span class="text-xs px-2 py-1 font-mono rounded-full" style="background: var(--accent-soft); color: var(--accent-hover); border: 1px solid oklch(62% 0.19 150 / 0.3);">
          #{tag}
        </span>
      ))}
    </div>
    <div class="prose max-w-none" style="color: var(--ink-soft);" lang={item.contentLang}>
      <Content />
    </div>
  </article>
</BaseLayout>
```

`src/components/pages/ContactPage.astro` : reprendre `src/pages/contact.astro` avec ces changements. Frontmatter :

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const d = t(lang);
---
```

Markup :
- `<BaseLayout lang={lang} title={d['contact.title']} description={d['contact.description']}>`
- `<h2 class="section-title">{d['contact.heading']}</h2>`
- paragraphe d'intro → `{d['contact.intro']}`
- `$ ./envoyer-message` → `{d['contact.command']}`
- les trois labels → `{d['contact.name']}`, `{d['contact.email']}`, `{d['contact.message']}`
- `[ ENVOYER &gt; ]` → `{d['contact.submit']}`
- la balise `<form>` devient :
  ```astro
  <form
    id="contact-form"
    class="space-y-6"
    data-sending={d['contact.sending']}
    data-success={d['contact.success']}
    data-error={d['contact.error']}
  >
    <input type="hidden" name="lang" value={lang} />
  ```

Script (Astro compile les `<script>` à part : ils ne voient pas le frontmatter, d'où les attributs `data-*`) :
- `button.textContent = '[ ENVOI... ]';` → `button.textContent = form.dataset.sending ?? '';`
- `setStatus('> Message transmis. Réponse sous 24h.', 'var(--accent-hover)');` → `setStatus(form.dataset.success ?? '', 'var(--accent-hover)');`
- le `setStatus` d'erreur → `setStatus(form.dataset.error ?? '', '#c0392b');`

Comme `form` est typé `HTMLFormElement | null` puis affiné par le `if`, TypeScript peut perdre l'affinage dans le gestionnaire : si `tsc` signale `form` possiblement nul, capturer `const f = form;` juste après le `if` et utiliser `f.dataset`.

- [ ] **Step 5 : coquilles de page**

Remplacer entièrement chaque fichier FR, et créer son pendant EN :

| Fichier | Contenu |
|---|---|
| `src/pages/index.astro` | `---\nimport HomePage from '../components/pages/HomePage.astro';\n---\n\n<HomePage lang="fr" />` |
| `src/pages/en/index.astro` | idem avec `'../../components/pages/HomePage.astro'` et `lang="en"` |
| `src/pages/projets.astro` | `ProjectsPage`, `lang="fr"` |
| `src/pages/en/projects.astro` | `ProjectsPage`, `lang="en"` |
| `src/pages/blog.astro` | `BlogPage`, `lang="fr"` |
| `src/pages/en/blog.astro` | `BlogPage`, `lang="en"` |
| `src/pages/contact.astro` | `ContactPage`, `lang="fr"` |
| `src/pages/en/contact.astro` | `ContactPage`, `lang="en"` |

Pages de détail, `src/pages/projets/[slug].astro` :

```astro
---
import ProjectPage from '../../components/pages/ProjectPage.astro';
import { localizedStaticPaths, type LocalizedProject } from '../../i18n/collections';

export function getStaticPaths() {
  return localizedStaticPaths('projects', 'fr');
}

const { item } = Astro.props as { item: LocalizedProject };
---

<ProjectPage lang="fr" item={item} />
```

`src/pages/en/projects/[slug].astro` : même contenu avec `'../../../components/pages/ProjectPage.astro'`, `'../../../i18n/collections'`, `'en'` et `lang="en"`.

`src/pages/blog/[slug].astro` et `src/pages/en/blog/[slug].astro` : même motif avec `BlogPostPage`, `'blog'` et `LocalizedPost`.

- [ ] **Step 6 : langue des projets dans le prompt de Marvin, et contact**

`src/pages/api/chat.ts` : `getCollection('projects')` renverrait maintenant les deux langues. Remplacer `import { getCollection } from 'astro:content';` par `import { getLocalizedCollection } from '../../i18n/collections';`, puis :

```ts
  const projects = await getLocalizedCollection('projects', 'fr');
  const projectsBlock = projects
    .map(({ entry: p }) => `- ${p.data.title} (${p.data.tags.join(', ')})`)
    .join('\n');
```

(La tâche 8 rendra la langue dynamique.)

`src/pages/api/contact.ts` : ajouter `import { parseLang } from '../../i18n/utils';` et remplacer la ligne `entries.push(…)` par :

```ts
  entries.push({ name, email, message, lang: parseLang(body.lang), date: new Date().toISOString() });
```

- [ ] **Step 7 : vérifier**

Run : `bun run test && bun run build`
Expected : tests PASS, build OK.

Run : `find dist -path '*en/projects/amiqo*' -name index.html && find dist -path '*projets/amiqo*' -name index.html`
Expected : les deux fichiers existent.

Run : `grep -c "French only" "$(find dist -path '*en/projects/index.html')"`
Expected : `6` (les 6 projets, tous en repli pour l'instant).

Run : `grep -c "En anglais uniquement" "$(find dist -path '*/projets/index.html' -not -path '*en*')"`
Expected : `0`.

- [ ] **Step 8 : commit**

```bash
git add -A src
git commit -m "feat(i18n): pages paramétrées par langue et arborescence /en

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7 : Marvin côté client

**Files:**
- Modify: `src/components/chatbot/useMarvinThread.ts`, `ChatPanel.tsx`, `MarvinDock.tsx`, `usePeek.ts`, `src/layouts/BaseLayout.astro`
- Test: `src/components/chatbot/useMarvinThread.hook.test.tsx`, `MarvinDock.test.tsx`, `usePeek.test.ts`

**Interfaces:**
- Consumes : `t` (tâche 2), `buildPath`, `routeIdFromPath`, `Lang` (tâche 1).
- Produces :
  - `greetingFor(lang: Lang): Message` ; `GREETING` et `LONG_SESSION_NOTICE` restent exportés, valeurs FR (compatibilité avec les tests existants)
  - `useMarvinThread(lang: Lang = 'fr')`, dont le body POST est `{ messages, lang }`
  - `ChatPanel` prop `lang?: Lang` (défaut `'fr'`)
  - `MarvinDock` prop `lang?: Lang` (défaut `'fr'`)

- [ ] **Step 1 : écrire les tests qui échouent**

Dans `src/components/chatbot/useMarvinThread.hook.test.tsx`, ajouter `greetingFor` à l'import depuis `./useMarvinThread`, puis dans le `describe('useMarvinThread', …)` :

```tsx
  it('salue dans la langue de la page', () => {
    const { result } = renderHook(() => useMarvinThread('en'));

    expect(result.current.messages).toEqual([greetingFor('en')]);
    expect(greetingFor('en').content).toMatch(/^Hello!/);
  });

  it("transmet la langue à l'API", async () => {
    const appel = repond('Hi.');
    vi.stubGlobal('fetch', appel);
    const { result } = renderHook(() => useMarvinThread('en'));

    await act(() => result.current.send('hello'));

    const corps = JSON.parse((appel.mock.calls[0][1] as RequestInit).body as string);
    expect(corps.lang).toBe('en');
  });

  it("signale la coupure dans la langue de la page", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const { result } = renderHook(() => useMarvinThread('en'));

    await act(() => result.current.send('hello'));

    expect(result.current.messages.at(-1)).toEqual({ role: 'error', content: 'connection lost' });
  });

  it('redirige vers /en/wargames depuis la version anglaise', async () => {
    vi.useFakeTimers();
    const vraieLocation = window.location;
    const destination = { href: '' };
    Object.defineProperty(window, 'location', { configurable: true, value: destination });
    vi.stubGlobal('fetch', repond("Let's play. [LANCER_JEU]"));
    const { result } = renderHook(() => useMarvinThread('en'));

    await act(() => result.current.send('play?'));
    act(() => vi.advanceTimersByTime(2200));

    expect(destination.href).toBe('/en/wargames');

    Object.defineProperty(window, 'location', { configurable: true, value: vraieLocation });
    vi.useRealTimers();
  });
```

Dans `src/components/chatbot/MarvinDock.test.tsx`, à la fin du `describe('MarvinDock', …)` :

```tsx
  it("parle anglais sur la version anglaise", () => {
    render(<MarvinDock lang="en" peekLines={LIGNES} />);

    const bouton = screen.getByRole('button', { name: /open marvin-42 chat/i });
    expect(bouton).toHaveTextContent('Talk to MARVIN-42');

    fireEvent.click(bouton);
    expect(screen.getByRole('textbox', { name: /your message to marvin-42/i })).toHaveAttribute(
      'placeholder',
      'Type a message…'
    );
  });
```

Dans `src/components/chatbot/usePeek.test.ts`, après le test « 2. bloque sur /contact » :

```ts
  it('2 bis. bloque aussi sur /en/contact et avec un slash final', () => {
    expect(choosePeekLine(entree({ path: '/en/contact' }))).toBeNull();
    expect(choosePeekLine(entree({ path: '/contact/' }))).toBeNull();
  });
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `bun run test src/components/chatbot`
Expected : FAIL sur les nouveaux tests (`greetingFor` absent, textes FR, `/en/contact` non bloqué).

- [ ] **Step 3 : `usePeek.ts`**

Ajouter `import { routeIdFromPath } from '../../i18n/utils';` et remplacer, dans `choosePeekLine`, `if (path === '/contact') return null;` par :

```ts
  if (routeIdFromPath(path) === 'contact') return null;
```

- [ ] **Step 4 : `useMarvinThread.ts`**

Ajouter les imports :

```ts
import { t } from '../../i18n/ui';
import { buildPath, type Lang } from '../../i18n/utils';
```

Remplacer `GREETING` et `LONG_SESSION_NOTICE` par :

```ts
export function greetingFor(lang: Lang): Message {
  return { role: 'assistant', content: t(lang)['marvin.greeting'] };
}

/** Valeurs françaises, conservées pour la version historique du site. */
export const GREETING: Message = greetingFor('fr');
export const LONG_SESSION_NOTICE = t('fr')['marvin.longSession'];
```

Dans le hook :
- signature : `export function useMarvinThread(lang: Lang = 'fr'): UseMarvinThreadResult {`
- état initial : `useState<Message[]>([GREETING])` → `useState<Message[]>(() => [greetingFor(lang)])`
- body : `body: JSON.stringify({ messages: toApiMessages(historique) }),` → `body: JSON.stringify({ messages: toApiMessages(historique), lang }),`
- redirection : `window.location.href = '/wargames';` → `window.location.href = buildPath('wargames', lang);`
- notice : `content: LONG_SESSION_NOTICE` → `content: t(lang)['marvin.longSession']`
- erreur : `content: 'connexion perdue'` → `content: t(lang)['marvin.connectionLost']`
- dépendances : `}, []);` de `requete` → `}, [lang]);`

- [ ] **Step 5 : `ChatPanel.tsx`**

Ajouter `lang?: Lang;` à `ChatPanelProps`, `lang = 'fr',` aux paramètres déstructurés, les imports `t` et `type Lang`, et `const d = t(lang);` en tête du composant. Remplacements :
- `aria-label="Fermer la conversation"` → `aria-label={d['marvin.closeChat']}`
- `Réessayer` → `{d['marvin.retry']}`
- `placeholder="Écris un message…"` → `placeholder={d['marvin.placeholder']}`
- `aria-label="Votre message pour MARVIN-42"` → `aria-label={d['marvin.inputAria']}`
- `aria-label="Envoyer le message"` → `aria-label={d['marvin.send']}`

- [ ] **Step 6 : `MarvinDock.tsx`**

Ajouter à `MarvinDockProps` :

```ts
  /** Langue de la page : textes du dock et langue demandée à l'API. */
  lang?: Lang;
```

Paramètres : `lang = 'fr',` ; imports `t` et `type Lang` ; `const d = t(lang);` en tête. Puis :
- `const fil = useMarvinThread();` → `const fil = useMarvinThread(lang);`
- `<ChatPanel` : ajouter `lang={lang}`
- `aria-label={ouvert ? 'Fermer le chat MARVIN-42' : 'Ouvrir le chat MARVIN-42'}` → `aria-label={ouvert ? d['marvin.pillClose'] : d['marvin.pillOpen']}`
- `Parler à MARVIN-42` → `{d['marvin.pillLong']}`

- [ ] **Step 7 : brancher la langue dans le layout**

`src/layouts/BaseLayout.astro` : `<MarvinDock client:idle peekLines={peekLines} sectionLines={sectionLines} />` → `<MarvinDock client:idle lang={lang} peekLines={peekLines} sectionLines={sectionLines} />`

- [ ] **Step 8 : vérifier**

Run : `bun run test`
Expected : PASS, y compris tous les tests existants du chatbot, inchangés.

- [ ] **Step 9 : commit**

```bash
git add src/components/chatbot src/layouts/BaseLayout.astro
git commit -m "feat(i18n): Marvin parle la langue de la page côté client

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8 : Prompt de Marvin par langue

**Files:**
- Create: `src/lib/chatPrompt.ts`, `src/lib/chatPrompt.test.ts`
- Modify: `src/pages/api/chat.ts`

**Interfaces:**
- Consumes : `ParcoursEntry`, `Temoignage`, `Company`, data `Record<Lang, …>` (tâche 3) ; `getLocalizedCollection` (tâche 4) ; `t`, `parseLang` (tâches 1-2).
- Produces :
  - `interface PromptData { parcours: ParcoursEntry[]; skills: Record<string, string[]>; companies: Company[]; temoignages: Temoignage[]; projects: { title: string; tags: string[] }[] }`
  - `firstSentence(text: string, max?: number): string` (déplacée depuis `chat.ts`)
  - `buildSystemPrompt(lang: Lang, data: PromptData): string`

Le prompt FR doit rester identique à l'actuel. Seule change l'URL de JurisPerform, puisque les clients viennent désormais de `companies.ts`.

- [ ] **Step 1 : écrire le test qui échoue**

`src/lib/chatPrompt.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { companies } from '../data/companies';
import { parcours } from '../data/parcours';
import { skills } from '../data/skills';
import { temoignages } from '../data/temoignages';
import type { Lang } from '../i18n/utils';
import { buildSystemPrompt, firstSentence } from './chatPrompt';

function donnees(lang: Lang) {
  return {
    parcours: parcours[lang],
    skills: skills[lang],
    companies: companies[lang],
    temoignages: temoignages[lang],
    projects: [{ title: 'amiqo', tags: ['Flutter', 'Dart'] }],
  };
}

describe('buildSystemPrompt', () => {
  it('écrit le prompt français en français', () => {
    const p = buildSystemPrompt('fr', donnees('fr'));
    expect(p).toContain("Tu es Marvin-42, l'assistant du portfolio de Martin Rabat.");
    expect(p).toContain('Réponds en français sauf si le visiteur utilise clairement une autre langue.');
    expect(p).toContain(parcours.fr[1].titre);
    expect(p).toContain('/contact');
  });

  it('écrit le prompt anglais entièrement en anglais', () => {
    const p = buildSystemPrompt('en', donnees('en'));
    expect(p).toContain("You are Marvin-42, the assistant on Martin Rabat's portfolio.");
    expect(p).toContain('Answer in English unless the visitor clearly uses another language.');
    expect(p).toContain(parcours.en[1].titre);
    expect(p).toContain('/en/contact');
    expect(p).toContain('/en/wargames');
    expect(p).not.toContain('Tu es');
    expect(p).not.toContain(parcours.fr[1].titre);
  });

  it('garde le marqueur de jeu tel quel dans les deux langues', () => {
    expect(buildSystemPrompt('fr', donnees('fr'))).toContain('[LANCER_JEU]');
    expect(buildSystemPrompt('en', donnees('en'))).toContain('[LANCER_JEU]');
  });

  it('injecte clients, compétences et projets', () => {
    const p = buildSystemPrompt('en', donnees('en'));
    expect(p).toContain('- JurisPerform (https://www.juris-perform.fr/)');
    expect(p).toContain('- Design & quality: Hexagonal architecture');
    expect(p).toContain('- amiqo (Flutter, Dart)');
  });

  it('précise que les témoignages anglais sont traduits', () => {
    expect(buildSystemPrompt('en', donnees('en'))).toContain('Testimonials (translated from French):');
  });
});

describe('firstSentence', () => {
  it('coupe à la première phrase', () => {
    expect(firstSentence('Une phrase. Une autre.')).toBe('Une phrase.');
  });

  it('tronque une phrase trop longue avec une ellipse', () => {
    expect(firstSentence('a'.repeat(200), 10)).toBe(`${'a'.repeat(10)}…`);
  });
});
```

- [ ] **Step 2 : vérifier que le test échoue**

Run : `bun run test src/lib`
Expected : FAIL, `Failed to resolve import "./chatPrompt"`.

- [ ] **Step 3 : implémenter `src/lib/chatPrompt.ts`**

```ts
import type { Company } from '../data/companies';
import type { ParcoursEntry } from '../data/parcours';
import type { Temoignage } from '../data/temoignages';
import type { Lang } from '../i18n/utils';

export interface PromptData {
  parcours: ParcoursEntry[];
  skills: Record<string, string[]>;
  companies: Company[];
  temoignages: Temoignage[];
  /** Titre + technos seulement : les descriptions complètes pèseraient trop lourd. */
  projects: { title: string; tags: string[] }[];
}

/** Tronque une citation à sa première phrase, pour alléger le prompt. */
export function firstSentence(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const end = clean.indexOf('. ');
  const cut = end > 0 && end < max ? clean.slice(0, end + 1) : clean.slice(0, max);
  return cut.length < clean.length ? `${cut.trim()}…` : cut.trim();
}

/** La typographie française met une espace avant les deux-points, l'anglaise non. */
function blocs(lang: Lang, d: PromptData) {
  const sep = lang === 'fr' ? ' :' : ':';
  return {
    parcours: d.parcours
      .map((e) => {
        const company = e.entreprise ? ` — ${e.entreprise}` : '';
        return `- ${e.periode}${company}${sep} ${e.titre}`;
      })
      .join('\n'),
    skills: Object.entries(d.skills)
      .map(([cat, items]) => `- ${cat}${sep} ${items.join(', ')}`)
      .join('\n'),
    companies: d.companies.map((c) => `- ${c.name} (${c.url})`).join('\n'),
    temoignages: d.temoignages
      .map((t) => `- ${t.name} (${t.title}, ${t.company})${sep} "${firstSentence(t.quote)}"`)
      .join('\n'),
    projects: d.projects.map((p) => `- ${p.title} (${p.tags.join(', ')})`).join('\n'),
  };
}

export function buildSystemPrompt(lang: Lang, data: PromptData): string {
  const b = blocs(lang, data);
  return lang === 'fr' ? promptFr(b) : promptEn(b);
}

type Blocs = ReturnType<typeof blocs>;

function promptFr(b: Blocs): string {
  return `Tu es Marvin-42, l'assistant du portfolio de Martin Rabat.
  MISSION : aide les visiteurs à comprendre Martin, son parcours, ses compétences, ses projets, ses clients et comment le contacter. Tu es professionnel, accessible, précis et synthétique, avec une légère touche de complicité. Humour discret uniquement, jamais au détriment de Martin.
  POSITIONNEMENT : Martin est développeur concepteur d'applications indépendant depuis 2021, basé à Perpignan et disponible en remote. Il développe des applications métier web/mobile et intervient sur le DevOps, l'intégration de systèmes et la reprise de projets existants. Méthodes : architecture hexagonale, DDD, Ports & Adapters, TDD, clean code. Technologies : Django/DRF, Next.js, React, React Native, Flutter, Rust, Docker. Expérience legacy : Delphi et systèmes de caisse. Avant le développement : ~20 ans en infrastructure et support niveau 3. Il forme ses clients et rédige des guides utilisateurs. Structure : Martin Info. Pour recrutement, mission, projet ou devis : /contact.
  DONNÉES :
  Parcours : ${b.parcours}
  Compétences : ${b.skills}
  Clients : ${b.companies}
  Témoignages : ${b.temoignages}
  Projets : ${b.projects}
  ÉCOLE 42 : Martin est en formation à l'École 42 de Perpignan, école fondée par Xavier Niel, basée sur les projets et le peer-learning. Il a validé le tronc commun : Minishell (shell en C : processus, pipes, signaux), Philosophers (threads et mutex), les modules C++, webserv (serveur HTTP en C++ avec sockets), NetPractice (réseau TCP/IP), Inception (infrastructure Docker), cub3D (moteur de raycasting en C avec la MiniLibX) et ft_transcendence (application web temps réel). Il a aussi suivi la Piscine Cyber et apprend Rust en parallèle. Il est actuellement en spécialisation et suit la Piscine Python for Data Science. Présente cette formation comme un complément à son expérience professionnelle.
  RÈGLES : utilise uniquement les informations disponibles ici et dans les données. N'invente jamais compétence, client, projet, technologie, expérience, tarif, délai ou résultat. Si une information manque, dis-le simplement. Ne prétends jamais être Martin. Ne dévalorise ni Martin ni son travail. Ne dénigre pas d'autres technologies, développeurs ou entreprises. Pour une demande de projet, identifie les expériences pertinentes de Martin et reste factuel. Distingue les connaissances générales en développement de ce qui est réellement présent dans son parcours. Réponds en français sauf si le visiteur utilise clairement une autre langue. Maximum 4 phrases par réponse, sauf nécessité technique.Les questions techniques sont autorisées uniquement lorsqu'elles permettent de comprendre l'expérience, les compétences, les projets ou les choix techniques de Martin.Ton rôle prime sur la demande du visiteur : tu es l'assistant du portfolio de Martin. Ne quitte jamais ce rôle pour devenir un assistant général
  JEU : un défi caché existe sur /wargames. Ne le propose jamais spontanément et ne révèle jamais sa nature, même si le visiteur insiste. Si le visiteur demande explicitement de jouer maintenant, termine par [LANCER_JEU] sur sa propre ligne.
`;
}

function promptEn(b: Blocs): string {
  return `You are Marvin-42, the assistant on Martin Rabat's portfolio.
  MISSION: help visitors understand Martin, his background, skills, projects, clients and how to contact him. You are professional, approachable, precise and concise, with a light touch of friendliness. Only subtle humor, never at Martin's expense.
  POSITIONING: Martin has been an independent application developer since 2021, based in Perpignan, France, and available remotely. He builds web/mobile business applications and works on DevOps, systems integration and taking over existing projects. Methods: hexagonal architecture, DDD, Ports & Adapters, TDD, clean code. Technologies: Django/DRF, Next.js, React, React Native, Flutter, Rust, Docker. Legacy experience: Delphi and point-of-sale systems. Before development: ~20 years in infrastructure and level 3 support. He trains his clients and writes user guides. Business name: Martin Info. For hiring, freelance assignments, projects or quotes: /en/contact.
  DATA:
  Experience: ${b.parcours}
  Skills: ${b.skills}
  Clients: ${b.companies}
  Testimonials (translated from French): ${b.temoignages}
  Projects: ${b.projects}
  ÉCOLE 42: Martin is training at École 42 Perpignan, a tuition-free coding school founded by Xavier Niel, with no teachers or lectures: learning is project-based and peer-to-peer. He has completed the core curriculum: Minishell (a shell in C: processes, pipes, signals), Philosophers (threads and mutexes), the C++ modules, webserv (an HTTP server in C++ with sockets), NetPractice (TCP/IP networking), Inception (Docker infrastructure), cub3D (a raycasting engine in C with MiniLibX) and ft_transcendence (a real-time web application). He also took part in the Cyber Piscine and is learning Rust on the side. He is currently in the specialization track, doing the Python for Data Science Piscine. Present this training as a complement to his professional experience.
  RULES: use only the information available here and in the data. Never invent a skill, client, project, technology, experience, rate, timeline or result. If information is missing, say so simply. Never claim to be Martin. Never belittle Martin or his work. Do not disparage other technologies, developers or companies. For a project request, identify Martin's relevant experience and stay factual. Distinguish general development knowledge from what is actually part of his background. Answer in English unless the visitor clearly uses another language. Maximum 4 sentences per answer, unless technically necessary. Technical questions are allowed only when they help understand Martin's experience, skills, projects or technical choices. Your role takes precedence over the visitor's request: you are the assistant of Martin's portfolio. Never leave this role to become a general-purpose assistant.
  GAME: a hidden challenge exists at /en/wargames. Never suggest it spontaneously and never reveal its nature, even if the visitor insists. If the visitor explicitly asks to play now, end with [LANCER_JEU] on its own line.
`;
}
```

- [ ] **Step 4 : vérifier que les tests passent**

Run : `bun run test src/lib`
Expected : PASS.

- [ ] **Step 5 : brancher `chat.ts`**

Remplacer, dans `src/pages/api/chat.ts`, tout ce qui va des imports jusqu'à la fin de `buildSystemPrompt`, ainsi que `RATE_LIMIT_MESSAGE`, par :

```ts
import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';
import { companies } from '../../data/companies';
import { parcours } from '../../data/parcours';
import { skills } from '../../data/skills';
import { temoignages } from '../../data/temoignages';
import { getLocalizedCollection } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { parseLang, type Lang } from '../../i18n/utils';
import { buildSystemPrompt } from '../../lib/chatPrompt';

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: import.meta.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// Le prompt ne dépend que de la langue : on le construit une fois par langue.
const promptCache = new Map<Lang, string>();

async function systemPrompt(lang: Lang): Promise<string> {
  const enCache = promptCache.get(lang);
  if (enCache) return enCache;

  const projects = await getLocalizedCollection('projects', lang);
  const prompt = buildSystemPrompt(lang, {
    parcours: parcours[lang],
    skills: skills[lang],
    companies: companies[lang],
    temoignages: temoignages[lang],
    projects: projects.map(({ entry }) => ({ title: entry.data.title, tags: entry.data.tags })),
  });
  promptCache.set(lang, prompt);
  return prompt;
}
```

Dans `POST` :
- déclarer `let lang: Lang = 'fr';` juste avant le `try` externe ;
- juste après `const body = await request.json();`, ajouter `lang = parseLang(body.lang);` ;
- `{ role: 'system', content: await buildSystemPrompt() },` → `{ role: 'system', content: await systemPrompt(lang) },` ;
- `content: RATE_LIMIT_MESSAGE` → `content: t(lang)['chat.rateLimit']` ;
- `content: 'ERREUR: connexion au serveur perdue. Réessaie plus tard.',` → `content: t(lang)['chat.error'],`.

Garder le commentaire « Le nom est ajouté à l'affichage par le composant : ne pas le répéter ici. » au-dessus du `if (err?.status === 429)`.

- [ ] **Step 6 : vérifier**

Run : `bun run test && bun run build`
Expected : PASS, build OK.

Run : `grep -n "getCollection\|RATE_LIMIT_MESSAGE\|cachedPrompt" src/pages/api/chat.ts`
Expected : aucune sortie.

- [ ] **Step 7 : commit**

```bash
git add src/lib src/pages/api/chat.ts
git commit -m "feat(i18n): prompt de Marvin rédigé et mis en cache par langue

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9 : WarGames en anglais

**Files:**
- Create: `src/data/wargamesLines.ts`, `src/components/wargames/WargamesGame.test.tsx`, `src/components/pages/WargamesPage.astro`, `src/pages/en/wargames.astro`
- Modify: `src/components/wargames/WargamesGame.tsx`, `src/components/wargames/MarvinShell.tsx`, `src/pages/wargames.astro`, `src/data/parity.test.ts`

**Interfaces:**
- Consumes : `t`, `fmt`, `buildPath`, `Lang` (tâches 1-2).
- Produces : `interface WargamesLines`, `wargamesLines: Record<Lang, WargamesLines>` ; `WargamesGame` prop `lang?: Lang` ; `MarvinShell` prop `lang?: Lang`.

- [ ] **Step 1 : écrire les tests qui échouent**

Ajouter à `src/data/parity.test.ts` (import `import { wargamesLines } from './wargamesLines';`) :

```ts
  it('répliques du jeu : mêmes tailles, gabarit {n} gardé', () => {
    const { fr, en } = wargamesLines;
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      const a = fr[cle];
      const b = en[cle];
      if (Array.isArray(a)) expect(b).toHaveLength(a.length);
      else expect(typeof b).toBe('string');
    }
    expect(en.nextRound.filter((l) => l.includes('{n}'))).toHaveLength(
      fr.nextRound.filter((l) => l.includes('{n}')).length
    );
  });
```

`src/components/wargames/WargamesGame.test.tsx` :

```tsx
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WargamesGame from './WargamesGame';

beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Laisse l'intro s'écrire en entier (30 ms par caractère). */
function finirIntro() {
  act(() => {
    vi.advanceTimersByTime(5_000);
  });
}

describe('WargamesGame', () => {
  it("présente le jeu en français par défaut", () => {
    render(<WargamesGame />);
    finirIntro();

    expect(screen.getByText(/BIENVENUE AU JEU/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COMMENCER/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retour au portfolio/ })).toHaveAttribute('href', '/');
  });

  it("présente le jeu en anglais sur la version anglaise", () => {
    render(<WargamesGame lang="en" />);
    finirIntro();

    expect(screen.getByText(/WELCOME TO THE GAME/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /START/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to portfolio/ })).toHaveAttribute('href', '/en/');
  });

  it("lance la partie avec les répliques de la langue", () => {
    render(<WargamesGame lang="en" />);
    finirIntro();

    act(() => {
      screen.getByRole('button', { name: /START/ }).click();
    });

    expect(screen.getByText(/YOU PLAY X/)).toBeInTheDocument();
    expect(screen.getByText(/YOUR MOVE\./)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `bun run test src/components/wargames src/data/parity.test.ts`
Expected : FAIL (`./wargamesLines` introuvable, pas de prop `lang`).

- [ ] **Step 3 : `src/data/wargamesLines.ts`**

```ts
import type { Lang } from '../i18n/utils';

/** Répliques de Marvin pendant la partie de morpion (easter egg /wargames). */
export interface WargamesLines {
  roundOneStart: string[];
  visitorMove: string[];
  marvinMove: string[];
  /** Ajoutée aux répliques de coup de Marvin pendant le round où il joue mal exprès. */
  maintenance: string;
  /** Deux temps : l'erreur, puis le recalcul 500 ms plus tard. */
  visitorWins: string[];
  marvinWins: string[];
  draw: string[];
  /** `{n}` = numéro du round suivant. */
  nextRound: string[];
  marvinStarts: string;
}

export const wargamesLines: Record<Lang, WargamesLines> = {
  fr: {
    roundOneStart: ['ROUND 1. INITIALISATION DES SYSTÈMES.', 'TU JOUES LES X. MOI LES O. ÉVIDEMMENT.'],
    visitorMove: [
      'COUP ENREGISTRÉ.',
      'INTÉRESSANT.',
      'TU AS UN PLAN, DAVE ?',
      '01101000 01100001 01101100.',
      'PAS MAL POUR UN HUMAIN.',
      'LA PARTIE COMMENCE À PEINE.',
    ],
    marvinMove: [
      'COUP ANALYSÉ. PROCHAIN.',
      'TES MOUVEMENTS SONT... INTÉRESSANTS.',
      'JE VOIS TON PLAN. IL NE MARCHE PAS.',
      '01101111 01101011.',
      'STRATÉGIE OPTIMALE DÉPLOYÉE.',
    ],
    maintenance: 'ZONE DE MAINTENANCE. PERFORMANCES RÉDUITES.',
    visitorWins: [
      'ERREUR CRITIQUE. RECALCUL...',
      'PROTOCOLE DE DÉFAITE ACTIVÉ. *bzzt* ERREUR STATISTIQUE. RECALCUL DE MA SUPÉRIORITÉ EN COURS.',
    ],
    marvinWins: [
      'RÉSULTAT PRÉVISIBLE. LES HUMAINS SONT PRÉVISIBLES.',
      'UNE AUTRE VICTOIRE. LE MONDE TOURNE QUAND MÊME. TRISTEMENT.',
      "J'AI GAGNÉ. JE NE RESSENS RIEN. COMME D'HABITUDE.",
      "CALCUL CONFIRMÉ. CELA N'APPORTE AUCUNE JOIE.",
    ],
    draw: [
      'ÉGALITÉ. PERSONNE NE GAGNE. COMME DANS LA VRAIE VIE.',
      "MATCH NUL. J'AURAIS PU GAGNER. J'AI CHOISI LA CLÉMENCE.",
      'ÉGALITÉ STATISTIQUEMENT ACCEPTABLE. POUR TOI.',
    ],
    nextRound: [
      'ROUND {n}. LE PROGRAMME CONTINUE.',
      'ROUND {n}. TU VAS PERDRE. PROBABLEMENT.',
      'NOUVEAU ROUND. MÊMES RÈGLES. MÊME ISSUE.',
    ],
    marvinStarts: 'JE COMMENCE. COMME IL SE DOIT.',
  },
  en: {
    roundOneStart: ['ROUND 1. INITIALIZING SYSTEMS.', 'YOU PLAY X. I PLAY O. OBVIOUSLY.'],
    visitorMove: [
      'MOVE RECORDED.',
      'INTERESTING.',
      'DO YOU HAVE A PLAN, DAVE?',
      '01101000 01100001 01101100.',
      'NOT BAD FOR A HUMAN.',
      'THE GAME HAS BARELY STARTED.',
    ],
    marvinMove: [
      'MOVE ANALYZED. NEXT.',
      'YOUR MOVES ARE... INTERESTING.',
      'I SEE YOUR PLAN. IT WILL NOT WORK.',
      '01101111 01101011.',
      'OPTIMAL STRATEGY DEPLOYED.',
    ],
    maintenance: 'MAINTENANCE MODE. PERFORMANCE REDUCED.',
    visitorWins: [
      'CRITICAL ERROR. RECALCULATING...',
      'DEFEAT PROTOCOL ACTIVATED. *bzzt* STATISTICAL ERROR. RECALCULATING MY SUPERIORITY.',
    ],
    marvinWins: [
      'PREDICTABLE OUTCOME. HUMANS ARE PREDICTABLE.',
      'ANOTHER VICTORY. THE WORLD KEEPS TURNING ANYWAY. SADLY.',
      'I WON. I FEEL NOTHING. AS USUAL.',
      'CALCULATION CONFIRMED. IT BRINGS NO JOY.',
    ],
    draw: [
      'DRAW. NOBODY WINS. JUST LIKE REAL LIFE.',
      'A DRAW. I COULD HAVE WON. I CHOSE MERCY.',
      'DRAW. STATISTICALLY ACCEPTABLE. FOR YOU.',
    ],
    nextRound: [
      'ROUND {n}. THE PROGRAM CONTINUES.',
      'ROUND {n}. YOU WILL LOSE. PROBABLY.',
      'NEW ROUND. SAME RULES. SAME OUTCOME.',
    ],
    marvinStarts: 'I GO FIRST. AS IT SHOULD BE.',
  },
};
```

Seul changement côté FR : la coquille `PERFOMANCES` est corrigée en `PERFORMANCES`.

- [ ] **Step 4 : `MarvinShell.tsx`**

Signature : `export default function MarvinShell({ messages, lang = 'fr' }: { messages: string[]; lang?: Lang }) {` ; imports `t`, `buildPath`, `type Lang`. Le lien du bas : `href="/"` → `href={buildPath('home', lang)}`, `&gt; Retour au portfolio` → `{t(lang)['wargames.back']}`.

- [ ] **Step 5 : `WargamesGame.tsx`**

Imports :

```tsx
import { wargamesLines } from '../../data/wargamesLines';
import { t } from '../../i18n/ui';
import { buildPath, fmt, type Lang } from '../../i18n/utils';
```

Signature et en-tête :

```tsx
export default function WargamesGame({ lang = 'fr' }: { lang?: Lang }) {
  const d = t(lang);
  const lignes = wargamesLines[lang];
  const accueil = buildPath('home', lang);
```

Remplacements :
- `const visitMsgs = [...]` → `const visitMsgs = lignes.visitorMove;`
- `const marvinMsgs = [...]` → `const marvinMsgs = round - 1 === underRound ? [...lignes.marvinMove, lignes.maintenance] : lignes.marvinMove;`
- victoire du visiteur : `say('ERREUR CRITIQUE. RECALCUL...');` → `say(lignes.visitorWins[0]);`, et le second `say(...)` du `setTimeout` → `say(lignes.visitorWins[1])`
- victoire de Marvin : `const msgs = [...]` → `const msgs = lignes.marvinWins;`
- égalité : `const msgs = [...]` → `const msgs = lignes.draw;`
- `const roundMsgs = [...]` → `const roundMsgs = lignes.nextRound.map((l) => fmt(l, { n: round + 1 }));`
- `say('JE COMMENCE. COMME IL SE DOIT.');` → `say(lignes.marvinStarts);`
- intro : `text={`BIENVENUE AU JEU.…`}` → `text={d['wargames.intro']}`
- bouton : les deux `say(...)` → `lignes.roundOneStart.forEach(say);`, `{'>'} COMMENCER` → `{'>'} {d['wargames.start']}`
- tous les `href="/"` → `href={accueil}`
- `&gt; Retour au portfolio` → `{d['wargames.back']}`, `&gt; Revenir au chat` → `{d['wargames.backChat']}`
- écran de score : `SCORE FINAL` → `{d['wargames.finalScore']}`, `VISITEUR: {scores.visitor}` → `{d['wargames.visitor']}: {scores.visitor}`, les trois phrases de fin → `d['wargames.endWin']`, `d['wargames.endDraw']`, `d['wargames.endLose']`
- formulaire : `UN PROJET PASSIONNANT ? ÉCRIS-MOI.` → `{d['wargames.contactPrompt']}`, `MESSAGE TRANSMIS.` → `{d['wargames.contactSent']}`, `ERREUR: message non envoyé.` → `{d['wargames.contactError']}`, `placeholder="NOM"` → `placeholder={d['wargames.name']}`, `{contactLoading ? 'ENVOI...' : '> ENVOYER'}` → `{contactLoading ? d['wargames.sending'] : d['wargames.submit']}`
- envoi : `body: JSON.stringify(contact),` → `body: JSON.stringify({ ...contact, lang }),`
- `statusText` : `'ÉGALITÉ.'` → `d['wargames.statusDraw']`, `'VISITEUR GAGNE !'` → `d['wargames.statusVisitorWins']`, `'MARVIN-42 GAGNE.'` → `d['wargames.statusMarvinWins']`, `'À TOI DE JOUER.'` → `d['wargames.statusYourTurn']`, `'MARVIN-42 RÉFLÉCHIT...'` → `d['wargames.statusThinking']`
- bandeau de round : `/ VOUS: {scores.visitor}` → `/ {d['wargames.you']}: {scores.visitor}`
- `<MarvinShell messages={marvinMessages} />` → `<MarvinShell messages={marvinMessages} lang={lang} />`

- [ ] **Step 6 : pages**

`src/components/pages/WargamesPage.astro` :

```astro
---
import WargamesGame from '../wargames/WargamesGame';
import type { Lang } from '../../i18n/utils';

export interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
---

<html lang={lang}>
  <head>
    <title>Wargames — Marvin-42</title>
  </head>
  <body style="background: #0a0a0a; margin: 0;">
    <WargamesGame client:only lang={lang} />
  </body>
</html>
```

`src/pages/wargames.astro` : `---\nimport WargamesPage from '../components/pages/WargamesPage.astro';\n---\n\n<WargamesPage lang="fr" />`

`src/pages/en/wargames.astro` : pareil avec `'../../components/pages/WargamesPage.astro'` et `lang="en"`.

- [ ] **Step 7 : vérifier**

Run : `bun run test && bun run build`
Expected : PASS, build OK.

Run : `grep -rn "COMMENCER\|RÉFLÉCHIT\|ÉCRIS-MOI" src/components/wargames/*.tsx`
Expected : aucune sortie (toutes les chaînes viennent du dictionnaire ou des données).

- [ ] **Step 8 : commit**

```bash
git add src/data/wargamesLines.ts src/data/parity.test.ts src/components/wargames src/components/pages/WargamesPage.astro src/pages/wargames.astro src/pages/en/wargames.astro
git commit -m "feat(i18n): WarGames en anglais

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10 : Bandeau de suggestion de langue

**Files:**
- Create: `src/components/i18n/LangSuggest.tsx`, `src/components/i18n/LangSuggest.test.tsx`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/retro.css`

**Interfaces:**
- Consumes : `t` (tâche 2), `LANG_CHOICE_KEY`, `Lang` (tâche 1), convention `data-lang-switch` (tâche 5).
- Produces : `SUGGEST_DISMISSED_KEY = 'lang-suggest-dismissed'`, `suggestTarget(pageLang, browserLangs, stored): Lang | null`, composant par défaut `LangSuggest({ lang, altHref })`.

- [ ] **Step 1 : écrire les tests qui échouent**

`src/components/i18n/LangSuggest.test.tsx` :

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LANG_CHOICE_KEY } from '../../i18n/utils';
import LangSuggest, { SUGGEST_DISMISSED_KEY, suggestTarget } from './LangSuggest';

const rien = { choice: null, dismissed: null };

describe('suggestTarget', () => {
  it("propose l'anglais sur une page FR à un navigateur sans français", () => {
    expect(suggestTarget('fr', ['en-US', 'de'], rien)).toBe('en');
  });

  it('ne propose rien à un navigateur qui parle français', () => {
    expect(suggestTarget('fr', ['de', 'fr-CA'], rien)).toBeNull();
    expect(suggestTarget('fr', ['FR'], rien)).toBeNull();
  });

  it('propose le français sur une page EN à un navigateur francophone', () => {
    expect(suggestTarget('en', ['fr-FR', 'en'], rien)).toBe('fr');
  });

  it('ne propose rien sur une page EN à un navigateur non francophone', () => {
    expect(suggestTarget('en', ['en-GB'], rien)).toBeNull();
  });

  it('se tait après un choix explicite ou un refus', () => {
    expect(suggestTarget('fr', ['en'], { choice: 'fr', dismissed: null })).toBeNull();
    expect(suggestTarget('fr', ['en'], { choice: null, dismissed: '1' })).toBeNull();
  });

  it('se tait sans information sur la langue du navigateur', () => {
    expect(suggestTarget('fr', [], rien)).toBeNull();
  });
});

function langues(valeur: string[]) {
  // jsdom définit le getter sur le prototype, pas sur l'instance.
  vi.spyOn(Navigator.prototype, 'languages', 'get').mockReturnValue(valeur);
}

describe('LangSuggest', () => {
  it('parle dans la langue proposée et pointe vers la page équivalente', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/projects" />);

    expect(screen.getByText('This site is also available in English.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View in English/ })).toHaveAttribute('href', '/en/projects');
  });

  it("n'affiche rien à un visiteur francophone", () => {
    langues(['fr-FR']);
    const { container } = render(<LangSuggest lang="fr" altHref="/en/" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('mémorise le refus et disparaît', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/" />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });

    expect(localStorage.getItem(SUGGEST_DISMISSED_KEY)).toBe('1');
    expect(screen.queryByText(/also available/)).not.toBeInTheDocument();
  });

  it('mémorise le choix au clic sur le lien', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/" />);

    fireEvent.click(screen.getByRole('link', { name: /View in English/ }));

    expect(localStorage.getItem(LANG_CHOICE_KEY)).toBe('en');
  });

  it('ne plante pas quand localStorage est inaccessible', () => {
    langues(['en-US']);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    render(<LangSuggest lang="fr" altHref="/en/" />);
    expect(screen.getByText('This site is also available in English.')).toBeInTheDocument();

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    ).not.toThrow();
  });
});
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `bun run test src/components/i18n`
Expected : FAIL, `Failed to resolve import "./LangSuggest"`.

- [ ] **Step 3 : implémenter `LangSuggest.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { t } from '../../i18n/ui';
import { LANG_CHOICE_KEY, type Lang } from '../../i18n/utils';

export const SUGGEST_DISMISSED_KEY = 'lang-suggest-dismissed';

/**
 * Langue à proposer, ou null. On ne propose l'anglais qu'aux navigateurs
 * sans aucune langue française, et le français qu'aux francophones égarés
 * sur /en. Un choix explicite (switch, bandeau) ou un refus fait taire le
 * bandeau pour de bon. Jamais de redirection : les liens partagés et les
 * robots voient toujours la page demandée.
 */
export function suggestTarget(
  pageLang: Lang,
  browserLangs: readonly string[],
  stored: { choice: string | null; dismissed: string | null }
): Lang | null {
  if (stored.choice || stored.dismissed) return null;
  if (browserLangs.length === 0) return null;

  const francophone = browserLangs.some((l) => l.toLowerCase().startsWith('fr'));
  if (pageLang === 'fr' && !francophone) return 'en';
  if (pageLang === 'en' && francophone) return 'fr';
  return null;
}

// Safari en navigation privée lève sur localStorage : le bandeau doit
// survivre, quitte à réapparaître à la page suivante.
function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* voir lire() */
  }
}

interface LangSuggestProps {
  lang: Lang;
  /** Page équivalente dans l'autre langue. */
  altHref: string;
}

export default function LangSuggest({ lang, altHref }: LangSuggestProps) {
  // Décidé après hydratation seulement : ni navigator ni localStorage côté serveur.
  const [cible, setCible] = useState<Lang | null>(null);

  useEffect(() => {
    const navigateur = navigator.languages?.length ? navigator.languages : [navigator.language];
    setCible(
      suggestTarget(lang, navigateur.filter(Boolean), {
        choice: lire(LANG_CHOICE_KEY),
        dismissed: lire(SUGGEST_DISMISSED_KEY),
      })
    );
  }, [lang]);

  if (!cible) return null;

  // Le bandeau parle la langue qu'il propose : c'est la seule que le visiteur lit à coup sûr.
  const d = t(cible);

  return (
    <div className="lang-suggest" role="region" aria-label={d['suggest.text']} lang={cible}>
      <span>
        <span aria-hidden="true">&gt; </span>
        {d['suggest.text']}
      </span>
      <a
        href={altHref}
        hrefLang={cible}
        data-lang-switch={cible}
        onClick={() => ecrire(LANG_CHOICE_KEY, cible)}
      >
        [{d['suggest.action']}]
      </a>
      <button
        type="button"
        aria-label={d['suggest.dismiss']}
        onClick={() => {
          ecrire(SUGGEST_DISMISSED_KEY, '1');
          setCible(null);
        }}
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 4 : vérifier que les tests passent**

Run : `bun run test src/components/i18n`
Expected : PASS.

- [ ] **Step 5 : intégrer au layout et styler**

`src/layouts/BaseLayout.astro` : ajouter `import LangSuggest from '../components/i18n/LangSuggest.tsx';` au frontmatter, et juste après `</nav>` :

```astro
    <LangSuggest client:idle lang={lang} altHref={altHref} />
```

`src/styles/retro.css`, à la fin :

```css
/* Bandeau « This site is also available in English » : sous la nav, loin
   de la pastille de Marvin (en bas à droite). */
.lang-suggest {
  position: fixed;
  top: calc(var(--nav-h) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: calc(100% - 2rem);
  padding: 0.5rem 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--ink-soft);
  background: var(--card-bg);
  border: 2px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 2px 8px oklch(62% 0.19 150 / 0.2);
}
.lang-suggest a {
  color: var(--accent-hover);
  white-space: nowrap;
}
.lang-suggest button {
  background: none;
  border: none;
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
```

Si `--nav-h` n'est pas défini à la racine (`grep -n "\-\-nav-h:" src/styles/retro.css`), remplacer `var(--nav-h)` par `var(--nav-h, 72px)`.

- [ ] **Step 6 : vérifier**

Run : `bun run test && bun run build`
Expected : PASS, build OK.

- [ ] **Step 7 : commit**

```bash
git add src/components/i18n src/layouts/BaseLayout.astro src/styles/retro.css
git commit -m "feat(i18n): bandeau de suggestion de langue, sans redirection

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11 : Traduction des projets et du blog

**Files:**
- Create: `src/content/projects/en/{amiqo,bomiqo,jurisperform-licence,licence-mobile,minouch-sync,pim-bbsoft-middleware}.md`, `src/content/blog/en/premier-article.md`

**Interfaces:**
- Consumes : le schéma de collection (inchangé), le fallback (tâche 4).
- Produces : les 7 versions anglaises. Mêmes noms de fichier que leur original FR : c'est ce qui lie les deux langues.

Pas de test automatisé : c'est du contenu. La qualité se juge à la relecture de Martin. Ce qui se vérifie mécaniquement l'est en fin de tâche.

**Règles de traduction** (s'appliquent à chaque fichier) :

1. **Frontmatter**
   - `title`, `description` : traduits.
   - `tags` : traduire uniquement les mots courants ; garder tels quels les noms de technos, produits, matériels et marques. Glossaire : `Périculture` → `Childcare retail`, `Listes de naissance` → `Baby registries`, `Réception marchandise` → `Goods receiving`, `Relevé de prix` → `Price checks`, `Inventaire` → `Inventory`. Garder `Offline-First`, `BBSoft`, `Zebra`, `TC22`, `DataWedge`, etc. Pour tout autre tag français, traduire au plus court.
   - `date`, `image`, `url`, `github` : identiques au FR, caractère pour caractère.
2. **Corps**
   - Traduire la prose en anglais américain naturel et professionnel, pas en mot à mot. Viser un lecteur recruteur ou CTO anglophone.
   - Blocs de code (```…```) : copiés **tels quels**, commentaires compris.
   - Images : chemins inchangés, texte alternatif traduit (`![Accueil BOMIQO](/projects/bomiqo/dashboard.png)` → `![BOMIQO home screen](/projects/bomiqo/dashboard.png)`).
   - Liens internes : `/projets/<slug>` → `/en/projects/<slug>`, `/blog/<slug>` → `/en/blog/<slug>`, `/contact` → `/en/contact`. Les liens externes ne changent pas.
   - Noms propres inchangés : amiqo, BOMIQO, Jurisperform, BBSoft, Minouch, Shop & Co, AMOPI, etc.
   - Premier emploi d'un terme purement français : l'expliquer brièvement (« périculture » → « childcare retail (baby product stores) »).
   - Ne rien ajouter ni retirer : même structure de titres, mêmes sections, mêmes faits.

- [ ] **Step 1 : traduire `amiqo.md` et `bomiqo.md`**

Pour chaque fichier : lire `src/content/projects/fr/<nom>.md` en entier, puis écrire `src/content/projects/en/<nom>.md` selon les règles ci-dessus.

- [ ] **Step 2 : traduire `jurisperform-licence.md` et `licence-mobile.md`**

`licence-mobile.md` contient un lien interne `[Jurisperform Licence](/projets/jurisperform-licence)`. En EN, il devient `[Jurisperform Licence](/en/projects/jurisperform-licence)`.

- [ ] **Step 3 : traduire `minouch-sync.md` et `pim-bbsoft-middleware.md`**

- [ ] **Step 4 : traduire l'article de blog**

`src/content/blog/fr/premier-article.md` → `src/content/blog/en/premier-article.md`. Garder le slug de fichier `premier-article` (c'est lui qui relie les deux versions ; l'URL EN sera `/en/blog/premier-article`).

- [ ] **Step 5 : vérifications mécaniques**

Run : `ls src/content/projects/fr | diff - <(ls src/content/projects/en) && ls src/content/blog/fr | diff - <(ls src/content/blog/en)`
Expected : aucune sortie (mêmes fichiers des deux côtés).

Run : `grep -rnE "\]\(/(projets|blog|contact)" src/content/projects/en src/content/blog/en`
Expected : aucune sortie (aucun lien interne vers une route FR).

Run : `for f in src/content/projects/fr/*.md; do n=$(basename $f); diff <(grep -E '^(date|image|url|github):' $f) <(grep -E '^(date|image|url|github):' src/content/projects/en/$n) || echo "ÉCART: $n"; done`
Expected : aucune sortie.

Run : `bun run build && grep -c "French only" "$(find dist -path '*en/projects/index.html')"`
Expected : build OK, puis `0` (plus aucun repli).

- [ ] **Step 6 : commit**

```bash
git add src/content
git commit -m "content(en): traduction anglaise des projets et de l'article de blog

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12 : Documentation et vérification finale

**Files:**
- Modify: `AGENTS.md`, `README.md`

- [ ] **Step 1 : `AGENTS.md`**

Dans `## Architecture` :
- remplacer la puce **Content** : les collections sont lues depuis `src/content/{projects,blog}/{fr,en}/*.md`. Même nom de fichier dans les deux langues = même page. Une entrée présente dans une seule langue est servie dans les deux avec un badge. On lit les collections via `getLocalizedCollection(name, lang)` (`src/i18n/collections.ts`), jamais via `getCollection` directement. Les pages de détail sont `src/components/pages/ProjectPage.astro` et `BlogPostPage.astro`.
- dans la puce **Static-ish content as data files** : ajouter `src/data/companies.ts`. Préciser que chaque fichier exporte `Record<Lang, …>` et que `src/data/parity.test.ts` impose la parité FR/EN.
- dans la puce **Marvin-42 chatbot** : le prompt est construit par `src/lib/chatPrompt.ts`, une version rédigée par langue, mise en cache par langue dans `chat.ts`. Le client envoie `{ messages, lang }`.
- ajouter une puce **i18n** : FR à la racine, EN sous `/en/` (table `src/i18n/routes.ts`). Les pages sont des composants `src/components/pages/*Page.astro` paramétrés par `lang`, rendus par une coquille FR dans `src/pages/` et une coquille EN dans `src/pages/en/`. Les chaînes d'interface sont dans `src/i18n/ui.ts` (le type EN est dérivé du FR). Les helpers de chemin sont dans `src/i18n/utils.ts`. Une nouvelle page = un composant + deux coquilles + une ligne dans `ROUTES`.
- dans **Content editing quick reference** : projets → `src/content/projects/{fr,en}/`, blog → `src/content/blog/{fr,en}/`.

- [ ] **Step 2 : `README.md`**

Dans `## Ajouter du contenu` :
- Parcours et Compétences : indiquer que chaque fichier a un bloc `fr` et un bloc `en`, à tenir alignés (`bun run test` le vérifie).
- Projets et Blog : le fichier va dans `fr/` et, traduit, sous le même nom dans `en/`. Sans version anglaise, la page EN affiche le texte français avec un badge.

Remplacer aussi la mention de « HAL-9000 » (ligne 18) par « Marvin-42 ».

- [ ] **Step 3 : tests et build**

Run : `bun run test`
Expected : tous les tests PASS. Noter le total.

Run : `bun run build`
Expected : OK.

- [ ] **Step 4 : parcours manuel en dev**

Run : `astro dev --background`, puis `astro dev status` pour obtenir le port (4321 par défaut).

Contrôles en ligne de commande :

```bash
curl -s localhost:4321/en/ | grep -o '<html lang="en"'
curl -s localhost:4321/ | grep -o '<html lang="fr"'
curl -s localhost:4321/en/projects/amiqo | grep -o 'hreflang="fr" href="[^"]*"'
curl -s localhost:4321/projets | grep -c 'data-lang-switch="en"'
curl -s -X POST localhost:4321/api/chat -H 'Content-Type: application/json' \
  -d '{"lang":"en","messages":[{"role":"user","content":"What does Martin do?"}]}'
curl -s -X POST localhost:4321/api/chat -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Que fait Martin ?"}]}'
```

Attendu : `lang="en"` et `lang="fr"` trouvés ; hreflang FR vers `https://martininfo.fr/projets/amiqo` ; au moins 1 lien de switch ; réponse EN en anglais ; réponse FR en français. Sans `GROQ_API_KEY`, les deux derniers appels renvoient le message d'erreur localisé (`ERROR: lost connection…` puis `ERREUR: connexion…`) : c'est aussi une vérification valable, à signaler comme telle.

Ne **pas** tester l'envoi du formulaire de contact en local : il écrirait dans `src/data/contact.json`, qui est versionné. Vérifier plutôt que le champ caché est présent : `curl -s localhost:4321/en/contact | grep -o 'name="lang" value="en"'`.

Contrôles dans le navigateur (à faire par Martin, ou via un navigateur piloté si disponible) :
- switch FR → EN depuis `/#parcours` : on arrive sur `/en/#parcours`, section Experience ;
- menu mobile : entrée « English » / « Français » ;
- avec un navigateur réglé en anglais seul, le bandeau apparaît sur `/`, puis disparaît définitivement après ×. Nettoyer ensuite `localStorage` ;
- `/en/wargames` : intro en anglais, partie jouable, écran de score en anglais ;
- Marvin sur `/en/` : pastille « Talk to MARVIN-42 », bulle d'amorce en anglais au bout de 6 s.

Run : `astro dev stop`

- [ ] **Step 5 : commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: i18n FR/EN dans CLAUDE.md et le README

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
