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
- **Content**: two content collections defined in `src/content.config.ts` — `projects` and `blog`, both loaded via `glob` from `src/content/{projects,blog}/*.md` with zod schemas (title, date, tags, description, plus optional image/url/github for projects). Adding content is just dropping a new `.md` file with matching frontmatter; no code changes needed. Detail pages are `src/pages/projets/[slug].astro` and `src/pages/blog/[slug].astro`.
- **Static-ish content as data files**: `src/data/parcours.ts` (career timeline), `src/data/skills.ts` (skills by category), `src/data/temoignages.ts` (testimonials) are plain TS arrays/objects imported directly by both the page sections (`src/components/sections/*.astro`) and the chatbot's system prompt builder (`src/pages/api/chat.ts`). Editing these files updates both the UI and what the chatbot is allowed to talk about — keep them as the single source of truth for personal/portfolio facts.
- **Marvin-42 chatbot** (`src/pages/api/chat.ts` + `src/components/chatbot/`: `MarvinDock.tsx` floating dock, `ChatPanel.tsx`, `useMarvinThread.ts` conversation state persisted in sessionStorage, `PeekBubble.tsx`/`usePeek.ts` teaser bubbles): a Groq-backed (`openai/gpt-oss-20b`) chat endpoint whose system prompt is built entirely from `parcours`, `skills`, `temoignages`, and a hardcoded `companies` list in that file. It's instructed to answer only from that injected data and never invent facts — if you add a new real-world fact (company, job, testimonial) it must go through the data files above, not be hardcoded elsewhere, so the bot stays truthful. The teaser bubbles don't hit the LLM: they draw from pre-written lines in `src/data/marvinLines.ts` (per page and per homepage section). If the model replies with `[LANCER_JEU]`, the client redirects to `/wargames`.
- **Contact form** (`src/pages/api/contact.ts`): persists submissions by reading/writing `src/data/contact.json` directly on disk (no database). `GET` returns all entries, `POST` appends one. This only works with the Node server running (not on fully static hosting).
- **WarGames easter egg** (`src/pages/wargames.astro`, `src/components/wargames/`): a Tic-Tac-Toe game (`WargamesGame.tsx`) against an unbeatable minimax AI (`minimax.ts`), framed as a `WOPR`-style terminal (`MarvinShell.tsx`). It includes its own contact form posting to `/api/contact`.
- **Retro theming**: shared retro visual components (`src/components/retro/Marquee.astro`) and global retro styles in `src/styles/retro.css`, applied via `src/layouts/BaseLayout.astro`.
- **Content editing quick reference** (see README.md for full snippets): timeline → `src/data/parcours.ts`; skills → `src/data/skills.ts`; projects → new `.md` in `src/content/projects/`; blog posts → new `.md` in `src/content/blog/`. Projects and blog posts render newest-first; `parcours` entries render in array order (also newest-first by convention).
