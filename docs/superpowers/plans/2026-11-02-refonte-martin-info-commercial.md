# Refonte commerciale « Martin Info » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the developer portfolio into a prospecting site for Martin Info (services, case studies, À propos, richer contact form, Marvin as a sales-aware assistant), FR + EN, in visual direction A (clear/editorial, retro as accents).

**Architecture:** Same Astro 7 static site + on-demand API routes. New facts live in `src/data/*.ts` (`Record<Lang, …>`, parity-tested) and in project frontmatter; pages are `lang`-parameterized components under `src/components/pages/` with thin FR/EN shells; pure logic goes in `src/lib/` with Vitest tests. Two new routes (`services`, `about`); every existing URL is kept.

**Tech Stack:** Astro 7, Tailwind CSS 4, React 19 (only where already used), Vitest + Testing Library (jsdom), Bun. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-02-refonte-martin-info-commercial-design.md` — read it first, including annexes A (brief extracts: service examples, tone, forbidden phrases, CTAs, SEO queries) and B (Cleo text, verbatim).

## Global Constraints

- No new npm dependency. Stack unchanged. Package manager Bun (`bun run test`, `bun run build`).
- Existing URLs never change: `/`, `/projets`, `/projets/<slug>`, `/blog…`, `/contact`, `/wargames` and their `/en/…` equivalents. New: `/services` ↔ `/en/services`, `/a-propos` ↔ `/en/about`.
- Every page and every data entry exists in FR **and** EN; FR is the reference, EN types derive from FR (`ui.ts`), data files are covered by `src/data/parity.test.ts`.
- Never invent a fact, client, figure, result or testimonial. Only facts from the spec, the existing content files, and annex B. Results section of a case study only when a result is documented.
- Copy rules (brief): no « transformation digitale », « propulser », « libérer le potentiel », « au cœur de votre ADN » (EN: "digital transformation", "propel", "unlock the potential", "in your DNA"); no free audit/consultation promise; CTAs varied, not systematically « Demander un devis ».
- Visual direction A: cream background, dark ink, large modern type (Space Grotesk), monospace accents (JetBrains Mono, `>` prompts, `_` cursor), Marvin as a green-phosphor terminal. No ASCII ornaments (`✦ . * . ☉`, `─── ✦ ───`), no marquee, no purple gradients on commercial pages. Animations discreet and disabled under `prefers-reduced-motion`.
- Accessibility: WCAG AA contrast (check the green `--accent` on cream for text: use `--accent-hover` or darker for text), one `h1` per page, labelled form fields, visible focus.
- Public email: `martin.rabat@gmail.com`, defined once (`CONTACT_EMAIL` in `src/data/site.ts`).
- CKM66 public URL: `https://ckm66.vercel.app` (ckm66.fr does not resolve). App Store: `https://apps.apple.com/us/app/ckm66/id6753923165`. Google Play: `https://play.google.com/store/apps/details?id=com.ckm66.myapp`.
- Route files can't hold tests (a `.test.ts` under `src/pages/` becomes a route). Tests are colocated `src/**/*.test.ts(x)`.
- Commit after each task, message in French, conventional prefix, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **WarGames contact form keeps working** — it posts `{name,email,message,lang,website,elapsedMs}` without `company`/`projectType`; the API must still return 200. Pinned in Task 6.
2. **Hostile values in the new contact fields** — a `company` with a newline or > 100 chars, or a `projectType` outside the allowed list, must be refused (400) or ignored, never reach the mail headers. Pinned in Task 6.
3. **A project without image (CKM66/Cleo until Martin sends captures)** — cards, featured block and detail page must render the initials fallback and the build must pass. Pinned in Task 5 (build check with no `image` field).
4. **Language fallback** — a project present in only one language must still appear in the service filter and in the Services page proofs on the other language (with the existing "only in" badge). Pinned in Task 3 (helpers operate on `Localized` items, including `isFallback` ones).
5. **No-JS / reduced motion** — the Réalisations filter must show every project when JS is off, and the home hero terminal must not animate under `prefers-reduced-motion`. Pinned in Task 10 (filter markup: nothing `hidden` server-side) and Task 7 (CSS media query).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/i18n/routes.ts` (mod) | add `services`, `about` RouteIds |
| `src/data/site.ts` (new) | `CONTACT_EMAIL`, `BUSINESS` (name, founder, city, region) |
| `src/data/services.ts` (new) | 5 services + 4 work steps (`methode`), per lang |
| `src/data/about.ts` (new) | À propos: approach points + 3 « temps forts », per lang |
| `src/lib/copyRules.ts` (new) | forbidden-phrase detector used by tests |
| `src/lib/projectSelect.ts` (new) | pure selectors: featured, by service, client vs atelier |
| `src/content.config.ts` (mod) | `services`, `kind`, `featured` frontmatter fields |
| `src/content/projects/{fr,en}/*.md` (mod/new) | case-study rewrite, + `ckm66.md`, `cleo.md` |
| `src/content/projects/structure.test.ts` (new) | case-study heading order guard |
| `src/lib/contactMail.ts` (mod) | `company`, `projectType` optional fields |
| `src/lib/jsonLd.ts` (new) | `ProfessionalService` structured data |
| `src/lib/chatPrompt.ts` (mod) | services, method, project descriptions, client/atelier |
| `src/styles/retro.css` (mod) | direction-A tokens and shared classes |
| `src/components/ui/*.astro` (new) | `SectionHeading`, `MarvinTerminal`, `ProjectCard` |
| `src/components/contact/ContactForm.astro` (new) | form + submit script, reused by home & contact page |
| `src/components/sections/*.astro` (mod/new) | home blocks |
| `src/components/pages/{ServicesPage,AboutPage}.astro` (new) + shells | new pages |

---

### Task 1: Routes, navigation, site constants

**Files:**
- Modify: `src/i18n/routes.ts`, `src/layouts/BaseLayout.astro` (nav links, footer, og:site_name), `src/components/nav/MenuMobile.tsx` (links), `src/i18n/ui.ts`
- Create: `src/data/site.ts`
- Test: `src/i18n/utils.test.ts`, `src/i18n/ui.test.ts`

**Interfaces:**
- Produces: `RouteId` now `'home' | 'services' | 'projects' | 'about' | 'blog' | 'contact' | 'wargames'`; `ROUTES.services = { fr: '/services', en: '/en/services' }`, `ROUTES.about = { fr: '/a-propos', en: '/en/about' }`.
- Produces: `src/data/site.ts` → `export const CONTACT_EMAIL = 'martin.rabat@gmail.com'`; `export const BUSINESS = { name: 'Martin Info', founder: 'Martin Rabat', city: 'Perpignan', postalCode: '66000', region: 'Pyrénées-Orientales', country: 'FR' } as const`.
- Produces ui keys: `nav.services` (« Services » / "Services"), `nav.projects` (« Réalisations » / "Work"), `nav.about` (« À propos » / "About"), `nav.cta` (« Parler de votre projet » / "Let's talk about your project"). Remove `nav.parcours`, `nav.partners`. `nav.contact` stays (used by mobile menu button text → set to the same as `nav.cta` or keep « Contact »; desktop uses `nav.cta`).
- `layout.footer`: « © 2026 Martin Info — Développement sur mesure · Perpignan » / "© 2026 Martin Info — Custom software · Perpignan, France". `og:site_name` → `Martin Info`.

- [ ] **Step 1: Write failing tests** in `src/i18n/utils.test.ts`:
```ts
it('connaît les nouvelles routes services et à-propos', () => {
  expect(buildPath('services', 'fr')).toBe('/services');
  expect(buildPath('services', 'en')).toBe('/en/services');
  expect(buildPath('about', 'fr')).toBe('/a-propos');
  expect(buildPath('about', 'en')).toBe('/en/about');
  expect(alternatePath('/a-propos')).toBe('/en/about');
  expect(alternatePath('/en/services')).toBe('/services');
});
```
and in `src/i18n/ui.test.ts` change the `nav.projects` expectation to `'Réalisations'` / `'Work'`.
- [ ] **Step 2:** `bun run test src/i18n` → FAIL (unknown route / old label).
- [ ] **Step 3:** Add the routes, `site.ts`, ui keys. Nav order on desktop and mobile: Services · Réalisations · À propos · Blog, FR|EN switch, then the CTA button (`nav.cta`) → `buildPath('contact', lang)`. Keep the logo image link to home.
- [ ] **Step 4:** `bun run test` → all PASS (fix any other test that referenced removed keys).
- [ ] **Step 5:** Commit `feat(nav): routes services et à-propos, navigation orientée prospects`.

---

### Task 2: Copy rules and services data

**Files:**
- Create: `src/lib/copyRules.ts`, `src/lib/copyRules.test.ts`, `src/data/services.ts`
- Modify: `src/data/parity.test.ts`

**Interfaces:**
- Produces `src/lib/copyRules.ts`:
  - `export const FORBIDDEN_PHRASES: readonly string[]` — lowercase: `'transformation digitale'`, `'propulser'`, `'propulse'`, `'libérer le potentiel'`, `'libérez le potentiel'`, `'adn'`, `'demander un devis'`, `'audit gratuit'`, `'consultation gratuite'`, `'digital transformation'`, `'propel'`, `'unlock the potential'`, `'in your dna'`, `'free audit'`, `'free consultation'`, `'request a quote'`.
  - `export function findForbidden(text: string): string[]` — case-insensitive, returns the matched phrases (`'adn'` must match as a whole word only, so « cadnas » doesn't match).
- Produces `src/data/services.ts`:
```ts
export type ServiceId = 'web' | 'mobile' | 'automation' | 'integration' | 'maintenance';
export const SERVICE_IDS: readonly ServiceId[] = ['web', 'mobile', 'automation', 'integration', 'maintenance'];
export interface Service {
  id: ServiceId;
  name: string;      // « Applications web »
  hook: string;      // problem as a question: « Vous gérez tout dans des tableurs ? »
  need: string;      // which need it answers (1–2 sentences)
  builds: string[];  // what Martin can build: ONLY the examples of annex A for this service
  benefit: string;   // concrete benefit (1–2 sentences)
  cta: string;       // CTA label, distinct per service
  proofNote?: string;// automation only: Marvin + Amopi import/export flows (see spec §3.3)
}
export interface Step { title: string; text: string; }
export const services: Record<Lang, Service[]>;
export const methode: Record<Lang, Step[]>; // 4 steps, exact titles/texts from spec §3.2 block 5
```
  Hooks (FR, from spec §3.2 block 3): web « Vous gérez tout dans des tableurs ? », mobile « Vos équipes travaillent sur le terrain ? », automation « Vous refaites les mêmes tâches chaque semaine ? », integration « Vos logiciels ne se parlent pas ? », maintenance « Un logiciel existant à reprendre ? ». CTAs (FR): « Imaginer votre outil », « Parler de votre application », « Discuter d'une automatisation », « Relier vos logiciels », « Voir si je peux vous aider ».

- [ ] **Step 1: Write failing tests.** `copyRules.test.ts`:
```ts
expect(findForbidden('Libérer le potentiel de votre business')).toEqual(['libérer le potentiel']);
expect(findForbidden("L'innovation au cœur de votre ADN")).toContain('adn');
expect(findForbidden('un cadnas')).toEqual([]);
expect(findForbidden('Request a quote today')).toEqual(['request a quote']);
expect(findForbidden('Vos logiciels ne se parlent pas ?')).toEqual([]);
```
  `parity.test.ts`, new cases:
```ts
it('services : mêmes ids dans le même ordre, mêmes nombres d’exemples', () => {
  expect(services.fr.map((s) => s.id)).toEqual([...SERVICE_IDS]);
  expect(services.en.map((s) => s.id)).toEqual([...SERVICE_IDS]);
  services.en.forEach((s, i) => expect(s.builds).toHaveLength(services.fr[i].builds.length));
  expect(services.en.map((s) => !!s.proofNote)).toEqual(services.fr.map((s) => !!s.proofNote));
});
it('méthode : 4 étapes dans chaque langue', () => {
  expect(methode.fr).toHaveLength(4); expect(methode.en).toHaveLength(4);
});
it('services : CTA tous différents, aucun texte interdit', () => {
  for (const lang of LANGS) {
    const ctas = services[lang].map((s) => s.cta);
    expect(new Set(ctas).size).toBe(ctas.length);
    const tout = JSON.stringify([services[lang], methode[lang]]);
    expect(findForbidden(tout)).toEqual([]);
  }
});
```
- [ ] **Step 2:** `bun run test src/lib/copyRules src/data` → FAIL (modules missing).
- [ ] **Step 3:** Implement `copyRules.ts` and write `services.ts` (FR + EN copy, tone of annex A).
- [ ] **Step 4:** `bun run test` → PASS.
- [ ] **Step 5:** Commit `feat(data): services et méthode de travail, garde-fou sur le vocabulaire`.

---

### Task 3: Project frontmatter fields and selectors

**Files:**
- Modify: `src/content.config.ts`, the 12 existing `src/content/projects/{fr,en}/*.md` (frontmatter only)
- Create: `src/lib/projectSelect.ts`, `src/lib/projectSelect.test.ts`

**Interfaces:**
- Consumes: `SERVICE_IDS`, `ServiceId` (Task 2).
- Produces schema fields: `services: z.array(z.enum(SERVICE_IDS)).default([])`, `kind: z.enum(['client', 'atelier']).default('client')`, `featured: z.number().int().positive().optional()` (rank on the home page, 1 = first).
- Produces `src/lib/projectSelect.ts` (generic over the shape, no `astro:content` import so it's unit-testable):
```ts
export interface SelectableData { services: ServiceId[]; kind: 'client' | 'atelier'; featured?: number; }
type Item = { entry: { data: SelectableData } };
export function clientProjects<T extends Item>(items: T[]): T[];
export function atelierProjects<T extends Item>(items: T[]): T[];
export function featuredProjects<T extends Item>(items: T[], max = 3): T[]; // client only, featured set, ascending rank, at most max
export function projectsForService<T extends Item>(items: T[], id: ServiceId): T[]; // client only, input order kept
```
- Frontmatter assignments (both languages identical):

| file | services | featured |
|---|---|---|
| `jurisperform-licence` | `[web]` | — |
| `bomiqo` | `[web]` | — |
| `amiqo` | `[mobile]` | 2 |
| `licence-mobile` | `[mobile]` | — |
| `minouch-sync` | `[integration]` | 3 |
| `pim-bbsoft-middleware` | `[integration, maintenance]` | — |

  (CKM66 gets `[web, mobile]`, featured 1, and Cleo `kind: atelier` in Task 5.)

- [ ] **Step 1: Write failing tests** `projectSelect.test.ts` with in-memory items `p(services, kind, featured?, isFallback?)`:
  - `featuredProjects` returns ranks 1,2,3 in order, ignores an `atelier` item with `featured: 1`, honours `max`.
  - `projectsForService(items,'integration')` returns only client items containing `'integration'`, in input order, **including an item marked `isFallback: true`**.
  - `clientProjects`/`atelierProjects` partition the list.
- [ ] **Step 2:** `bun run test src/lib/projectSelect` → FAIL.
- [ ] **Step 3:** Implement selectors; extend schema; add frontmatter to the 12 files.
- [ ] **Step 4:** `bun run test && bun run build` → PASS (build validates the frontmatter against the schema).
- [ ] **Step 5:** Commit `feat(projets): services, nature et mise à la une dans le frontmatter`.

---

### Task 4: Rewrite the six existing projects as case studies

**Files:**
- Modify: `src/content/projects/{fr,en}/{amiqo,bomiqo,jurisperform-licence,licence-mobile,minouch-sync,pim-bbsoft-middleware}.md`
- Create: `src/content/projects/structure.test.ts`

**Interfaces:**
- Produces the case-study heading contract (level `##`, in this order; `Résultats`/`Results` optional; extra `###` sub-headings allowed inside a section):
  - FR: `Contexte`, `Le besoin`, `La solution`, `Fonctionnalités`, [`Résultats`], `Côté technique`
  - EN: `Context`, `The need`, `The solution`, `Features`, [`Results`], `Under the hood`
- `description` frontmatter rewritten business-first (what it solves, for whom), no technology names. `tags` unchanged (they now render only under « Côté technique »).

- [ ] **Step 1: Write the failing test** `structure.test.ts` (reads files with `node:fs`, parses frontmatter `kind` with a regex, skips `kind: atelier`):
```ts
const ORDRE = { fr: ['Contexte','Le besoin','La solution','Fonctionnalités','Côté technique'],
                en: ['Context','The need','The solution','Features','Under the hood'] };
const OPTIONNEL = { fr: 'Résultats', en: 'Results' };
// for each client .md: h2 = all lines /^## (.+)$/; remove OPTIONNEL; expect(h2).toEqual(ORDRE[lang]);
// if OPTIONNEL present, it sits right before the last heading.
// and: expect(findForbidden(fileText)).toEqual([]);
```
- [ ] **Step 2:** `bun run test src/content` → FAIL (current files use other headings).
- [ ] **Step 3:** Rewrite each file FR then EN. Keep every fact already in the file; add none. Move stack/architecture/legacy details under « Côté technique ». Emoji headings go. « Résultats » only where the current text states an outcome (e.g. Jurisperform Licence: "toujours en production depuis août 2024"; Minouche: double entry removed is a *goal* stated, not a measured result → put it in « La solution », no « Résultats »).
- [ ] **Step 4:** `bun run test && bun run build` → PASS.
- [ ] **Step 5:** Commit `content(projets): six réalisations réécrites en études de cas`.

---

### Task 5: CKM66 and Cleo

**Files:**
- Create: `src/content/projects/{fr,en}/ckm66.md`, `src/content/projects/{fr,en}/cleo.md`, `src/assets/logos/ckm66.png`
- Modify: `src/data/companies.ts`

**Interfaces:**
- Consumes: schema fields (Task 3), heading contract (Task 4).
- `ckm66.md` frontmatter: `title` « CKM66 — Le club de Krav Maga de Perpignan, du site à l'application » / "CKM66 — A Perpignan Krav Maga club, from website to app"; `date: 2025-09-01` (confirmed by Martin: September 2025); `services: [web, mobile]`; `featured: 1`; `url: https://ckm66.vercel.app`; no `image` until captures arrive. Body follows the case-study contract with facts from spec §4 only (client, instructor Jérôme Luque Level 4, Les 5 Éléments, the club's own "before" list, site + app + club management all built by Martin, feature list, store links). No « Résultats ».
- `cleo.md` frontmatter: `kind: atelier`, `services: []`, `date: 2026-09-01` (confirmed by Martin: September 2026), no `image`, no `github` unless Martin gives one. Body = annex B text (FR verbatim; EN faithful translation keeping the humour), plus one closing sentence linking to client work (spec §4). Not bound by the heading contract.
- `companies.ts`: append `{ name: 'CKM66', url: 'https://ckm66.vercel.app', logo: 'ckm66.png', logoBg: 'dark' }` (check the logo; use `'white'` if it reads better), FR tagline « Club de Krav Maga · Perpignan », EN "Krav Maga club · Perpignan"; desc FR/EN from spec §4 (club, instructor, location).

- [ ] **Step 1:** `curl -sL -o src/assets/logos/ckm66.png https://ckm66.vercel.app/images/ckm_logo.png` and open it to confirm it is the club logo.
- [ ] **Step 2:** Write the four `.md` files and the `companies.ts` entry.
- [ ] **Step 3:** `bun run test` → PASS (parity on companies, structure test covers `ckm66`, skips `cleo`).
- [ ] **Step 4:** `bun run build` → PASS, and `ls dist/projets/ckm66 dist/projets/cleo dist/en/projects/ckm66` exist (pages render with the initials fallback, Review Focus 3).
- [ ] **Step 5:** Commit `content(projets): CKM66 et Cleo`.

---

### Task 6: Contact API — company and project type

**Files:**
- Modify: `src/lib/contactMail.ts`, `src/lib/contactMail.test.ts`, `src/lib/contactHandler.test.ts`

**Interfaces:**
- Consumes: `SERVICE_IDS` (Task 2).
- Produces: `PROJECT_TYPES = [...SERVICE_IDS, 'other'] as const`; `type ProjectType = (typeof PROJECT_TYPES)[number]`; `ContactMessage` gains `company?: string` (trimmed, ≤ 100, no `\r\n`) and `projectType?: ProjectType`. Absent or empty → field omitted. `company` invalid → `{ ok:false, error:'invalid company' }`. `projectType` not in the list → `{ ok:false, error:'invalid project type' }`.
- Mail: subject becomes `[Martin Info] ${name}${company ? ` — ${company}` : ''} (${LANG})`; body adds `Entreprise : …` and `Type de projet : …` lines (French label of the service from `services.fr`, « Autre / je ne sais pas encore » for `other`) only when present. `company` never goes into `replyTo`.

- [ ] **Step 1: Write failing tests** in `contactMail.test.ts`:
```ts
it('accepte entreprise et type de projet', () => {
  const r = validateContact({ ...valide, company: ' ACME ', projectType: 'automation' });
  expect(r.ok && r.data).toMatchObject({ company: 'ACME', projectType: 'automation' });
});
it('reste valide sans entreprise ni type (formulaire WarGames)', () => {
  const r = validateContact(valide);
  expect(r.ok && 'company' in r.data).toBe(false);
});
it('refuse une entreprise avec retour à la ligne ou trop longue, un type inconnu', () => {
  expect(validateContact({ ...valide, company: 'A\nBcc: x@y.z' }).ok).toBe(false);
  expect(validateContact({ ...valide, company: 'a'.repeat(101) }).ok).toBe(false);
  expect(validateContact({ ...valide, projectType: 'hack' }).ok).toBe(false);
});
it('met entreprise et type dans le mail, pas dans Reply-To', () => {
  const m = buildContactMail({ name: 'Ada', email: 'ada@example.com', message: 'x', lang: 'fr', company: 'ACME', projectType: 'integration' });
  expect(m.subject).toBe('[Martin Info] Ada — ACME (FR)');
  expect(m.text).toContain('Entreprise : ACME');
  expect(m.text).toContain('Type de projet : Intégration logicielle');
  expect(m.replyTo).not.toContain('ACME');
});
```
  In `contactHandler.test.ts`, add: a WarGames-shaped body (`name,email,message,lang,website:'',elapsedMs:10000`) → 200 and sender called once. Update any existing subject assertion to the new prefix.
- [ ] **Step 2:** `bun run test src/lib/contact` → FAIL.
- [ ] **Step 3:** Implement. (The service label used in the mail is `services.fr.find(s => s.id === t)!.name`; check the actual name you wrote in Task 2 and align the test string.)
- [ ] **Step 4:** `bun run test` → PASS.
- [ ] **Step 5:** Commit `feat(contact): entreprise et type de projet dans les messages`.

---

### Task 7: Direction-A design system and shared components

**Files:**
- Modify: `src/styles/retro.css`
- Create: `src/components/ui/SectionHeading.astro`, `src/components/ui/MarvinTerminal.astro`, `src/components/ui/ProjectCard.astro`, `src/components/contact/ContactForm.astro`
- Modify: `src/components/pages/ContactPage.astro` (use `ContactForm`), `src/i18n/ui.ts`

**Interfaces:**
- CSS tokens (keep names, adjust values if needed for AA): `--bg` cream, `--ink`, `--ink-soft`, `--accent`, `--accent-hover`, `--border`, `--marvin-*`. Add `--bg-dark` (contact block background, = `--ink`). New classes: `.btn-primary` (ink background, white text), `.btn-ghost` (ink border), `.kicker` (mono, small, uppercase-ish label with leading `> `), `.container-wide` (max-width ~72rem, generous padding). `.btn-retro` stays for WarGames/legacy spots only. `@media (prefers-reduced-motion: reduce)` disables transitions/animations added here.
- `SectionHeading.astro` props `{ kicker?: string; title: string; intro?: string; level?: 1 | 2; id?: string }` — renders `<p class="kicker">` + `<h1|h2>` + optional intro.
- `MarvinTerminal.astro` props `{ lines: { who: 'user' | 'marvin'; text: string }[]; label: string }` — static `<figure>` with `aria-label={label}`, user lines in `--marvin-user`, Marvin lines in `--marvin-fg`, blinking `_` cursor (no blink under reduced motion). Static: no LLM call.
- `ProjectCard.astro` props `{ item: LocalizedProject; lang: Lang; variant?: 'default' | 'compact' }` — `ProjectThumb`, title, `description`, service labels (from `services[lang]`) as small text, no tech tags; whole card links to `buildPath('projects', lang, slug)`; shows `OnlyInBadge` when `isFallback`. Emits `data-services="web mobile"` on the root (used by the filter in Task 10).
- `ContactForm.astro` props `{ lang: Lang; idPrefix: string }` — fields: Nom (`name`, required), Entreprise (`company`), Email (`email`, required), Type de projet (`projectType`, `<select>`: empty option « Choisir… », the 5 `services[lang].name` with `value=id`, « Autre / je ne sais pas encore » `value="other"`), Besoin (`message`, required, textarea). Visible `<label for>` on each, honeypot `website` and `elapsedMs` kept exactly as today, success sequence kept. The existing inline script is moved into the component and scoped by `data-contact-form` attributes instead of fixed `id`s, so two instances never clash. Error text uses `fmt(d['contact.error'], { email: CONTACT_EMAIL })`.
- ui keys added/changed (FR/EN): `contact.name`/`company`/`email`/`projectType`/`projectTypeChoose`/`projectTypeOther`/`message` become plain labels (« Nom », « Entreprise », « Email », « Type de projet », « Choisir… », « Autre / je ne sais pas encore », « Votre besoin »); `contact.submit` « Envoyer »; `contact.error` « Envoi impossible. Écrivez-moi directement à {email} » (EN equivalent); `contact.heading` = the brief title « Vous avez une idée, un problème à résoudre ou un outil à créer ? Parlons-en. »; `contact.intro` « Décrivez votre besoin en quelques lignes, je vous réponds rapidement. » (drop "poste à pourvoir", drop the hard 24h promise). Terminal-style transmission sequence after sending stays (it is the retro touch). The site moves from « tu » to « vous » everywhere on commercial pages, including `contact.done.thanks`.

- [ ] **Step 1:** Restyle `retro.css` and build the four components; switch `ContactPage.astro` to `<SectionHeading level={1}>` + `<ContactForm idPrefix="contact">` + direct email link `mailto:${CONTACT_EMAIL}` (GitHub link removed from the contact page).
- [ ] **Step 2:** `bun run test` → PASS (ui parity), `bun run build` → PASS.
- [ ] **Step 3:** Run `astro dev --background`, open `/contact` and `/en/contact`: submit with the five fields filled (expect 200 or 502 without SMTP — either way the request body in devtools contains `company` and `projectType`); tab through every field (visible focus); toggle reduced motion and resubmit (no animation).
- [ ] **Step 4:** Commit `feat(ui): direction A, composants partagés et formulaire de contact enrichi`.

---

### Task 8: Home page

**Files:**
- Modify: `src/components/pages/HomePage.astro`, `src/components/sections/Hero.astro`, `src/components/sections/IlsMeFontConfiance.astro` (→ client strip), `src/components/sections/Temoignages.astro` (restyle only), `src/i18n/ui.ts`
- Create: `src/components/sections/ServicesApercu.astro`, `src/components/sections/RealisationsUne.astro`, `src/components/sections/Methode.astro`, `src/components/sections/Humain.astro`, `src/components/sections/ContactBloc.astro`

**Interfaces:**
- Consumes: `services`, `methode` (Task 2), `featuredProjects` (Task 3), `ProjectCard`, `SectionHeading`, `MarvinTerminal`, `ContactForm` (Task 7), `companies` (incl. CKM66, Task 5), `CONTACT_EMAIL`.
- Section order and ids (ids are used by `sectionLines` in Task 12): `#hero`, `#clients`, `#services`, `#realisations`, `#methode`, `#temoignages`, `#humain`, `#contact`.
- Copy pinned by the spec (FR; EN equivalents in ui.ts):
  - `home.heroTitle` « Vos idées méritent mieux qu'un logiciel standard. » (the page `h1`)
  - `home.heroSub` « Je conçois des applications web et mobiles, des automatisations IA et des outils métier adaptés à votre façon de travailler. »
  - `home.heroCta` « Parler de votre projet » → `#contact`; `home.heroCta2` « Découvrir mes réalisations » → `buildPath('projects')`
  - `home.heroWhere` « Perpignan · Pyrénées-Orientales · partout en France à distance »
  - Hero terminal lines: user « ? mes logiciels ne se parlent pas » / Marvin « Martin a déjà relié une caisse BBSoft à un site e-commerce. On en parle ? »
  - `home.clientsTitle` « Ils m'ont confié leurs outils »
  - `home.servicesTitle` « Ce que je peux faire pour vous » — 5 cards: `hook` as card title, `name` as kicker, link `buildPath('services', lang, undefined, '#'+id)`
  - `home.workTitle` « Réalisations à la une » — `featuredProjects(projects)` (CKM66, amiqo, Minouche) + link to all
  - `home.methodTitle` « Comment on travaille ensemble » — `methode[lang]`, numbered 01–04
  - `home.humanTitle` « Un interlocuteur, du premier café à la mise en ligne » — portrait (`src/assets/martin.png`, `<Picture>`), 4 lines (independent since 2021, ~15 years running critical systems before, Perpignan, direct relationship), link to `buildPath('about')`, one line mentioning Cleo with link to `buildPath('projects', lang, undefined, '#atelier')`
  - `home.contactTitle` = brief contact title; dark background block; `<ContactForm idPrefix="home">` + `mailto` + « ou posez la question à Marvin » (button that opens the dock: dispatch the same event/open mechanism `MarvinDock` already listens to — check `MarvinDock.tsx`; if none exists, link text only, no new mechanism).
  - `home.title` « Martin Info — Développeur indépendant à Perpignan · applications sur mesure » ; `home.description` (≤ 160 chars, mentions applications web et mobiles, automatisation, intégration, Perpignan / Pyrénées-Orientales).
- Client strip: logos only, grayscale → colour on hover, each links to the client URL (`rel="noopener noreferrer"`), CKM66 included.
- Removed from the home page: `APropos`, `Skills`, `Parcours`, `ApercuProjets` (files deleted in Task 14 if unused).

- [ ] **Step 1:** Build the sections and recompose `HomePage.astro`; add ui keys FR/EN.
- [ ] **Step 2:** Add to `parity`/`ui` tests nothing new beyond key parity (automatic). Add one assertion in `src/data/parity.test.ts`: `expect(findForbidden(JSON.stringify(ui.fr)) ).toEqual([])` and same for `ui.en`.
- [ ] **Step 3:** `bun run test && bun run build` → PASS.
- [ ] **Step 4:** Dev server: check `/` and `/en/` at 375 px, 768 px, 1280 px — hero terminal below the text on mobile, no horizontal scroll, one `h1`, CTA « Parler de votre projet » scrolls to the form.
- [ ] **Step 5:** Commit `feat(accueil): page d'accueil orientée prospects`.

---

### Task 9: Services page

**Files:**
- Create: `src/components/pages/ServicesPage.astro`, `src/pages/services.astro`, `src/pages/en/services.astro`
- Modify: `src/i18n/ui.ts`

**Interfaces:**
- Consumes: `services` (Task 2), `projectsForService` (Task 3), `ProjectCard variant="compact"`, `SectionHeading`.
- One `<section id={service.id}>` per service, alternating asymmetric layout: `name` (h2), `hook`, `need`, « Ce que je peux construire » list (`builds`), « Ce que vous y gagnez » (`benefit`), « Déjà réalisé » with `projectsForService(projects, id)` cards, `proofNote` for automation (with a link that opens Marvin or to `#` nothing — text only is fine), and a CTA button labelled `cta` → `buildPath('contact', lang)`.
- ui keys: `services.title` « Services — Applications sur mesure, automatisation et intégration · Martin Info », `services.description` (≤ 160 chars), `services.heading` (h1) « Ce que je peux construire pour vous », `services.intro`, `services.builds`, `services.benefit`, `services.proofs`.
- Marvin page lines key `services` added in Task 12.

- [ ] **Step 1:** Implement page + shells (shells: 3 lines like `src/pages/contact.astro`).
- [ ] **Step 2:** `bun run test && bun run build` → PASS; `ls dist/services/index.html dist/en/services/index.html`.
- [ ] **Step 3:** Dev server: anchors `/services#integration` land on the right block; each service shows ≥ 1 proof except automation, which shows its `proofNote`.
- [ ] **Step 4:** Commit `feat(services): page services`.

---

### Task 10: Réalisations page, Côté atelier, project detail

**Files:**
- Modify: `src/components/pages/ProjectsPage.astro`, `src/components/pages/ProjectPage.astro`, `src/i18n/ui.ts`

**Interfaces:**
- Consumes: `clientProjects`, `atelierProjects` (Task 3), `ProjectCard` (Task 7), `services`.
- `ProjectsPage`: `h1` « Réalisations » / "Work"; filter bar = buttons « Tout » + one per service (`aria-pressed`); clicking sets `hidden` on cards whose `data-services` doesn't include the id. **Server-rendered markup has no card hidden** (no-JS shows all; Review Focus 5). Then `<section id="atelier">` « Côté atelier » with intro (« Ce que je construis pour le plaisir, et qui finit souvent par servir. ») and atelier cards, excluded from the filter.
- `ProjectPage`: header (title h1, `description` as lead), content, then the tech tag chips **after** the content under the « Côté technique » section, then links (`project.visit`, GitHub), then a CTA band « Un besoin qui ressemble à celui-ci ? Parlons-en. » → contact (client projects only; atelier pages get « Une idée un peu folle ? Écrivez-moi. »).
- ui keys: `projects.title`, `projects.description` (rewritten business-first), `projects.heading`, `projects.filterAll`, `projects.filterLabel`, `projects.atelierTitle`, `projects.atelierIntro`, `project.ctaClient`, `project.ctaAtelier`, `project.back` « ← Toutes les réalisations ».

- [ ] **Step 1:** Implement; filter script ≤ 30 lines inline `<script>`.
- [ ] **Step 2:** `bun run test && bun run build` → PASS.
- [ ] **Step 3:** Dev server: filter each service, then « Tout »; disable JS → all 7 client cards + Cleo visible; `/projets/cleo` shows the atelier CTA.
- [ ] **Step 4:** Commit `feat(réalisations): filtre par service, côté atelier, fiches réordonnées`.

---

### Task 11: À propos page

**Files:**
- Create: `src/data/about.ts`, `src/components/pages/AboutPage.astro`, `src/pages/a-propos.astro`, `src/pages/en/about.astro`
- Modify: `src/data/parity.test.ts`, `src/i18n/ui.ts`

**Interfaces:**
- Produces `src/data/about.ts`:
```ts
export interface Approche { title: string; text: string }        // 5 items: compréhension métier, expérience technique, systèmes complexes, relation directe, de la conception à la production
export interface TempsFort { periode: string; title: string; text: string } // exactly 3, spec §3.3
export const approche: Record<Lang, Approche[]>;
export const tempsForts: Record<Lang, TempsFort[]>;
```
  Temps forts: (1) « 2006—2022 » ~15 ans d'administration système et support niveau 3 en grands groupes (Lafarge, Steria, Ministère de la Santé, LCL…); (2) « Depuis 2021 » indépendant, Martin Info; (3) « Aujourd'hui » formateur logiciel (Amopi) et École 42 Perpignan. Facts only from `parcours.ts`.
- Page: `h1` « Martin Rabat, développeur indépendant à Perpignan »; portrait; approach grid; 3 temps forts; testimonials link or reuse `Temoignages`; « Ce qui m'anime » block: Cleo (link `#atelier` page) + a playful line about a hidden game that does **not** name or describe WarGames; CTA « Voir si je peux vous aider » → contact.
- ui keys: `about.title`, `about.description`, `about.heading`, `about.approachTitle`, `about.pathTitle`, `about.fun`, `about.funText`, `about.cta` (reuse/replace the existing `about.*` keys of the removed home section).

- [ ] **Step 1: Failing parity test**: `tempsForts` length 3 in both langs, `approche` same length both langs, `findForbidden` empty on both.
- [ ] **Step 2:** `bun run test src/data` → FAIL. **Step 3:** implement data + page + shells. **Step 4:** `bun run test && bun run build` → PASS, `dist/a-propos/index.html` and `dist/en/about/index.html` exist.
- [ ] **Step 5:** Commit `feat(à-propos): page à propos`.

---

### Task 12: Marvin as a sales-aware assistant

**Files:**
- Modify: `src/lib/chatPrompt.ts`, `src/lib/chatPrompt.test.ts`, `src/pages/api/chat.ts`, `src/data/marvinLines.ts`, `src/data/marvinLines.test.ts`, `src/i18n/ui.ts` (`marvin.greeting`)

**Interfaces:**
- `PromptData` becomes:
```ts
export interface PromptData {
  parcours: ParcoursEntry[]; skills: Record<string, string[]>; companies: Company[]; temoignages: Temoignage[];
  services: Service[]; methode: Step[];
  projects: { title: string; description: string; services: ServiceId[]; kind: 'client' | 'atelier' }[];
}
```
- Prompt changes (FR and EN): role = « l'assistant du site de Martin Info » ; MISSION = help a business visitor see whether Martin can solve their problem, point to the relevant service and real projects, and invite them to `/contact` (`/en/contact`) ; add a SERVICES block (`- name : need`), a MÉTHODE block, projects as `- title [services] : description` with atelier projects in a separate « Projets perso » line ; skills/technos and École 42 kept but introduced as « si on te pose des questions techniques ». Keep every existing RULE and the GAME block unchanged; add: never promise a price, deadline, free audit or free consultation.
- `chat.ts` passes the new fields from `services[lang]`, `methode[lang]` and the collection.
- `marvinLines`: `pageLines` gains `services` and `about` (≥ 2 lines each); `projects` lines updated; `sectionLines` keys become exactly the home section ids `clients, services, realisations, methode, temoignages, humain` (no line on `hero`/`contact`); keep tone (blasé, pince-sans-rire, never at Martin's expense, each line carries a real fact). `marvin.greeting` reworded towards « je peux vous dire si Martin peut vous aider ».

- [ ] **Step 1: Failing tests** (`chatPrompt.test.ts`): `donnees()` adds `services: services[lang]`, `methode: methode[lang]`, projects `[{ title:'amiqo', description:'Appli magasin', services:['mobile'], kind:'client' }, { title:'Cleo', description:'Chat', services:[], kind:'atelier' }]`; assert the FR prompt contains `services.fr[3].name`, `'- amiqo [mobile]'`, `'Cleo'` after the « Projets perso » marker, `'/contact'`, `'[LANCER_JEU]'`; EN prompt contains `services.en[0].name` and not `services.fr[0].name` when they differ. `marvinLines.test.ts`: `pageLines[lang].services` and `.about` non-empty; `Object.keys(sectionLines[lang]).sort()` equals `['clients','humain','methode','realisations','services','temoignages']`; `findForbidden(JSON.stringify(marvinLines))` empty.
- [ ] **Step 2:** `bun run test src/lib/chatPrompt src/data` → FAIL. **Step 3:** implement. **Step 4:** `bun run test` → PASS.
- [ ] **Step 5:** With `GROQ_API_KEY` set, dev server: ask Marvin « Mes logiciels ne se parlent pas, vous pouvez m'aider ? » → answer mentions integration and Minouche or the BBSoft gateway, and points to contact; ask « Combien ça coûte ? » → no price. (If no key locally, note it in the task report.)
- [ ] **Step 6:** Commit `feat(marvin): assistant d'accueil orienté services`.

---

### Task 13: SEO

**Files:**
- Create: `src/lib/jsonLd.ts`, `src/lib/jsonLd.test.ts`
- Modify: `src/layouts/BaseLayout.astro`, `src/i18n/ui.ts` (`layout.defaultDescription`, any remaining dev-centric `*.title`/`*.description`: blog, contact)

**Interfaces:**
- Consumes: `BUSINESS`, `CONTACT_EMAIL` (Task 1), `services` (Task 2).
- `export function professionalServiceJsonLd(lang: Lang, site: URL): Record<string, unknown>` → `@context`, `@type: 'ProfessionalService'`, `name: 'Martin Info'`, `founder: { '@type':'Person', name:'Martin Rabat' }`, `url` (home in that lang), `email`, `address: { '@type':'PostalAddress', addressLocality:'Perpignan', postalCode:'66000', addressRegion:'Pyrénées-Orientales', addressCountry:'FR' }`, `areaServed: [{ '@type':'AdministrativeArea', name:'Pyrénées-Orientales' }, { '@type':'Country', name:'France' }]`, `knowsAbout`/`hasOfferCatalog` from `services[lang].name`, `inLanguage`. **No** `streetAddress`, `telephone`, `vatID`/SIRET.
- `BaseLayout` emits it as `<script type="application/ld+json" set:html={JSON.stringify(...)} />` on every page.

- [ ] **Step 1: Failing test:** FR object has `name 'Martin Info'`, `address.addressLocality 'Perpignan'`, 5 offers matching `services.fr` names, `email === CONTACT_EMAIL`, and `JSON.stringify(obj)` contains neither `streetAddress` nor `telephone`; EN `url` ends with `/en/`.
- [ ] **Step 2:** FAIL → **Step 3:** implement + wire + rewrite remaining titles/descriptions (each ≤ 60/160 chars, one target query each: home « développeur indépendant Perpignan », services « logiciel métier sur mesure / automatisation », projects « réalisations applications web et mobiles », about « développeur informatique PME Pyrénées-Orientales »).
- [ ] **Step 4:** `bun run test && bun run build` → PASS; `grep -c "a-propos\|/services" dist/sitemap-0.xml` ≥ 2; `grep -o 'ProfessionalService' dist/index.html` found; each `dist/**/index.html` has exactly one `<h1` (`for f in $(find dist -name index.html); do echo "$(grep -o '<h1' $f | wc -l) $f"; done | grep -v '^ *1 '` prints nothing except wargames if it has none).
- [ ] **Step 5:** Commit `feat(seo): données structurées et métadonnées orientées prospects`.

---

### Task 14: Cleanup and final verification

**Files:**
- Delete if no longer imported: `src/components/sections/{APropos,Skills,Parcours,ApercuProjets}.astro`, `src/components/retro/Marquee.astro`, unused ui keys (`hero.*`, `skills.*`, `parcours.*`, `projectsPreview.*`, `trust.*` if replaced) and unused CSS (`.marquee`, `.retro-border` if only used by removed parts)
- Modify: `CLAUDE.md`/`AGENTS.md` (architecture bullets: new routes, `services.ts`, `about.ts`, `site.ts`, `projectSelect.ts`, frontmatter fields, case-study heading contract), `README.md` content-editing snippets (new frontmatter fields)

- [ ] **Step 1:** `grep -rn "Skills\|Parcours\|ApercuProjets\|Marquee\|APropos" src --include=*.astro --include=*.tsx --include=*.ts` → only data/ui references you intend to keep; delete the rest. Keep `skills.ts` and `parcours.ts` (Marvin and À propos use them).
- [ ] **Step 2:** `bun run test` → all PASS; `bun run build` → PASS, no warnings about missing images.
- [ ] **Step 3:** Dev server walkthrough FR and EN, 375 px and 1280 px: `/`, `/services`, `/projets`, `/projets/ckm66`, `/projets/cleo`, `/a-propos`, `/blog`, `/contact`, `/wargames` (still works, contact form inside still sends). Language switch keeps the page on each new route. No ASCII ornaments left on commercial pages.
- [ ] **Step 4:** Commit `chore: nettoyage après la refonte, documentation à jour`.
