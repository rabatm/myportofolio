# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

(Note: `CLAUDE.md` is a symlink to this file, `AGENTS.md`.)

## Project

Retro 90s-themed personal portfolio for Martin. Astro 7 + Tailwind CSS 4 + React 19, package manager is Bun.

## Development

```bash
bun install
bun run dev        # astro dev, localhost:4321
bun run build      # production build -> dist/
bun run preview    # preview the production build
bun run test       # vitest (jsdom), once
bun run test:watch # vitest in watch mode
```

When starting the dev server from Claude Code, use background mode so it doesn't block:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.

Tests are Vitest + Testing Library (jsdom, setup in `vitest.setup.ts`), colocated as `src/**/*.test.{ts,tsx}`. There is no lint script or CI config.

## Environment

`GROQ_API_KEY` (see `.env.example`) is required for the chatbot API route — get one at https://console.groq.com.

## Architecture

- **Rendering**: `output: 'static'` with the `@astrojs/node` adapter in standalone mode (`astro.config.mjs`), but the API routes (`src/pages/api/*.ts`) set `export const prerender = false` to run as on-demand server endpoints. New API routes need the same flag.
- **Content**: two content collections defined in `src/content.config.ts` — `projects` and `blog`, both loaded via `glob` from `src/content/{projects,blog}/{fr,en}/*.md` with zod schemas (title, date, tags, description, plus optional image/url/github for projects). Same filename in both language folders = the same page; an entry present in only one language is served in both, with a badge marking the fallback. Collections are read through `getLocalizedCollection(name, lang)` (`src/i18n/collections.ts`), never `getCollection` directly. Detail pages are the `src/components/pages/ProjectPage.astro` and `BlogPostPage.astro` components (see the **i18n** bullet below for how pages are wired to routes).
- **Static-ish content as data files**: `src/data/parcours.ts` (career timeline), `src/data/skills.ts` (skills by category), `src/data/temoignages.ts` (testimonials), `src/data/companies.ts` (client list) are plain TS objects imported directly by both the page sections (`src/components/sections/*.astro`) and the chatbot's system prompt builder (`src/lib/chatPrompt.ts`). Each file exports a `Record<Lang, …>` (one block per language); `src/data/parity.test.ts` enforces that the FR and EN blocks stay in sync (same keys/shape). Editing these files updates both the UI and what the chatbot is allowed to talk about — keep them as the single source of truth for personal/portfolio facts.
- **Marvin-42 chatbot** (`src/pages/api/chat.ts` + `src/components/chatbot/`: `MarvinDock.tsx` floating dock, `ChatPanel.tsx`, `useMarvinThread.ts` conversation state persisted in sessionStorage, `PeekBubble.tsx`/`usePeek.ts` teaser bubbles): a Groq-backed (`openai/gpt-oss-20b`) chat endpoint. The system prompt is built by `src/lib/chatPrompt.ts` — one version written per language (`buildSystemPrompt(lang, data)`), from `parcours`, `skills`, `temoignages` and `companies`; `chat.ts` caches the built prompt per language (`promptCache`) so it's only assembled once per lang. The client sends `{ messages, lang }`. The bot is instructed to answer only from that injected data and never invent facts — if you add a new real-world fact (company, job, testimonial) it must go through the data files above, not be hardcoded elsewhere, so the bot stays truthful. The teaser bubbles don't hit the LLM: they draw from pre-written lines in `src/data/marvinLines.ts` (per page and per homepage section, also `Record<Lang, …>`). If the model replies with `[LANCER_JEU]`, the client redirects to the localized `/wargames` route.
- **Contact form** (`src/pages/api/contact.ts`): persists submissions by reading/writing `src/data/contact.json` directly on disk (no database). `GET` returns all entries, `POST` appends one. This only works with the Node server running (not on fully static hosting).
- **WarGames easter egg** (`src/pages/wargames.astro`, `src/components/wargames/`): a Tic-Tac-Toe game (`WargamesGame.tsx`) against an unbeatable minimax AI (`minimax.ts`), framed as a `WOPR`-style terminal (`MarvinShell.tsx`). It includes its own contact form posting to `/api/contact`.
- **Retro theming**: shared retro visual components (`src/components/retro/Marquee.astro`) and global retro styles in `src/styles/retro.css`, applied via `src/layouts/BaseLayout.astro`.
- **i18n**: French lives at the root URLs, English under `/en/`, with the mapping between them in `src/i18n/routes.ts` (`ROUTES`, one path per language per `RouteId`). Each page is a `lang`-parameterized component in `src/components/pages/*Page.astro`, rendered by a thin FR shell in `src/pages/` and a thin EN shell in `src/pages/en/`. UI strings live in `src/i18n/ui.ts` (`t(lang)`; the EN dictionary type is derived from the FR one, so a missing translation is a type error). Path helpers (`buildPath`, `localizePath`, `alternatePath`, `parseLang`, the `Lang` type) are in `src/i18n/utils.ts`. Adding a new page means: one component in `src/components/pages/`, two shells (FR + EN), and one line in `ROUTES`.
- **Content editing quick reference** (see README.md for full snippets): timeline → `src/data/parcours.ts`; skills → `src/data/skills.ts`; projects → new `.md` in `src/content/projects/{fr,en}/`; blog posts → new `.md` in `src/content/blog/{fr,en}/`. Projects and blog posts render newest-first; `parcours` entries render in array order (also newest-first by convention).
