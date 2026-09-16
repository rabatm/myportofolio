# Dock flottant MARVIN-42 — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser
> `superpowers:subagent-driven-development` (recommandé) ou
> `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les
> étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**But :** remplacer la barre de chat permanente pleine largeur par un dock
flottant en bas à droite — pastille repliée, bulle d'amorce spontanée,
panneau de conversation — présent sur toutes les pages du layout.

**Architecture :** `ChatBot.tsx` (232 lignes mêlant minuteries, réseau,
rendu et machine à états) est découpé en deux hooks testables sans DOM
(`usePeek`, `useMarvinThread`), trois composants de rendu (`PeekBubble`,
`ChatPanel`, `TypewriterText`) et un orchestrateur (`MarvinDock`).
L'hydratation passe de `client:only` à `client:idle`, ce qui impose que le
premier rendu ne touche ni `window` ni le stockage.

**Pile :** Astro 7, React 19, Tailwind 4, Bun. Vitest et Testing Library
sont introduits par ce plan — c'est le premier dispositif de test du dépôt.

**Spec :** `docs/superpowers/specs/2026-09-16-marvin-dock-design.md`

## Contraintes globales

- Tout le code, les commentaires et les libellés d'interface sont **en
  français** (convention du dépôt).
- Gestionnaire de paquets : **Bun**. Jamais `npm` ni `yarn`.
- **Aucun accès à `window`, `document`, `sessionStorage`, `localStorage`
  ou `matchMedia` pendant le rendu.** Uniquement dans `useEffect` ou dans
  un gestionnaire d'événement. `client:idle` rend le composant côté
  serveur ; un accès au rendu casse le build.
- Tout accès au stockage est enveloppé dans `try/catch` : Safari en
  navigation privée lève sur `setItem`.
- Typographie du chat : `var(--font-mono)`, **jamais sous 13 px**.
- Cibles tactiles : pastille, croix et bouton d'envoi à **44 px minimum**.
- Couleurs : uniquement via les variables `--marvin-*` de la tâche 7.
  Aucune valeur hexadécimale en dur dans les composants.
- `src/pages/api/chat.ts` n'est **jamais** modifié.
- Commit après chaque tâche, message en français, préfixe
  `feat:` / `test:` / `refactor:` / `chore:`.

---

### Tâche 1 : Dispositif de test

**Fichiers :**
- Créer : `vitest.config.ts`
- Créer : `vitest.setup.ts`
- Modifier : `package.json` (dépendances de dev et scripts)
- Test : `src/components/chatbot/setup.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit : `bun run test` exécute les tests en environnement `jsdom` ;
  `vi`, `describe`, `it`, `expect` sont globaux ; `window.matchMedia` est
  pilotable par test via `setReducedMotion(boolean)` exporté depuis
  `vitest.setup.ts` ; `sessionStorage` et `localStorage` sont vidés entre
  chaque test.

- [ ] **Étape 1 : Installer les dépendances**

```bash
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom
```

Note : `@vitejs/plugin-react` est inutile. `tsconfig.json` déclare déjà
`"jsx": "react-jsx"`, et esbuild (intégré à Vite) compile les `.tsx` sans
plugin. Le plugin ne sert qu'au Fast Refresh, hors sujet en test.

- [ ] **Étape 2 : Écrire la configuration Vitest**

`vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Étape 3 : Écrire le fichier d'amorce**

`vitest.setup.ts` :

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

let mouvementReduit = false;

/**
 * jsdom n'implémente pas matchMedia. On le simule ici plutôt que dans
 * chaque test : prefers-reduced-motion conditionne la bulle, l'effet de
 * frappe et les animations, donc presque tous les tests en dépendent.
 */
export function setReducedMotion(valeur: boolean): void {
  mouvementReduit = valeur;
}

beforeEach(() => {
  mouvementReduit = false;
  sessionStorage.clear();
  localStorage.clear();

  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion') ? mouvementReduit : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

- [ ] **Étape 4 : Ajouter les scripts**

Dans `package.json`, section `"scripts"` :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Étape 5 : Écrire le test qui échoue**

`src/components/chatbot/setup.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { setReducedMotion } from '../../../vitest.setup';

describe('dispositif de test', () => {
  it('fournit un DOM', () => {
    document.body.innerHTML = '<p id="cible">bonjour</p>';

    expect(document.getElementById('cible')).toHaveTextContent('bonjour');
  });

  it('fournit un sessionStorage vide à chaque test', () => {
    expect(sessionStorage.getItem('marvin.peek')).toBeNull();
    sessionStorage.setItem('marvin.peek', 'sale');
  });

  it('a bien vidé le sessionStorage du test précédent', () => {
    expect(sessionStorage.getItem('marvin.peek')).toBeNull();
  });

  it('simule prefers-reduced-motion', () => {
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);

    setReducedMotion(true);

    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  });
});
```

- [ ] **Étape 6 : Lancer les tests pour vérifier qu'ils passent**

Commande : `bun run test`
Attendu : 4 tests au vert. Si `toHaveTextContent` est inconnu,
`@testing-library/jest-dom/vitest` n'est pas chargé — vérifier
`setupFiles`.

- [ ] **Étape 7 : Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json bun.lock src/components/chatbot/setup.test.ts
git commit -m "chore: installe vitest et testing-library"
```

---

### Tâche 2 : Émission des événements analytics

**Fichiers :**
- Créer : `src/components/chatbot/track.ts`
- Test : `src/components/chatbot/track.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit :
  - `ANALYTICS_EVENT: 'marvin:analytics'`
  - `type MarvinEventName = 'marvin_peek_shown' | 'marvin_peek_dismissed' | 'marvin_open' | 'marvin_message_sent'`
  - `track(name: MarvinEventName, detail?: Record<string, unknown>): void`

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/track.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENT, track } from './track';

function capturer(action: () => void): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  try {
    action();
  } finally {
    // Sans le finally, une exception dans action() laisserait l'écouteur
    // attaché au window partagé pour tout le reste du fichier.
    window.removeEventListener(ANALYTICS_EVENT, ecouteur);
  }

  return recus;
}

describe('track', () => {
  it('émet un CustomEvent portant le nom et le détail', () => {
    const recus = capturer(() => track('marvin_open', { source: 'pill', path: '/' }));

    expect(recus).toHaveLength(1);
    expect(recus[0].detail).toEqual({ name: 'marvin_open', source: 'pill', path: '/' });
  });

  it('accepte un événement sans détail', () => {
    const recus = capturer(() => track('marvin_peek_dismissed'));

    expect(recus[0].detail).toEqual({ name: 'marvin_peek_dismissed' });
  });

  it('émet un événement par appel, sans en perdre', () => {
    const recus = capturer(() => {
      track('marvin_peek_shown', { line: 'a' });
      track('marvin_message_sent', { length: 3 });
    });

    expect(recus.map((e) => e.detail.name)).toEqual([
      'marvin_peek_shown',
      'marvin_message_sent',
    ]);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/track.test.ts`
Attendu : ÉCHEC — `Failed to resolve import "./track"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/track.ts` :

```ts
/**
 * Émission des événements d'usage du dock.
 *
 * Aucun outil de mesure n'est installé dans ce dépôt. Plutôt que d'en
 * imposer un, on émet un CustomEvent sur window : brancher Plausible ou GA
 * un jour ne demandera qu'un écouteur de trois lignes dans BaseLayout, et
 * les tests n'ont aucune requête réseau à simuler.
 */

export const ANALYTICS_EVENT = 'marvin:analytics';

export type MarvinEventName =
  | 'marvin_peek_shown'
  | 'marvin_peek_dismissed'
  | 'marvin_open'
  | 'marvin_message_sent';

export function track(
  name: MarvinEventName,
  detail: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_EVENT, { detail: { name, ...detail } })
  );

  if (import.meta.env.DEV) {
    console.debug('[marvin]', name, detail);
  }
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/track.test.ts`
Attendu : 3 tests au vert.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/track.ts src/components/chatbot/track.test.ts
git commit -m "feat: emet les evenements d'usage du dock via CustomEvent"
```

---

### Tâche 3 : Règles de la bulle — partie pure

**Fichiers :**
- Créer : `src/components/chatbot/usePeek.ts`
- Test : `src/components/chatbot/usePeek.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit :
  - `PEEK_DELAY_MS = 6000`, `PEEK_DURATION_MS = 12000`,
    `PEEK_SESSION_CAP = 3`, `OPTOUT_MS`, `PEEK_KEY = 'marvin.peek'`,
    `OPTOUT_KEY = 'marvin.peek.optout'`
  - `interface PeekState { pages: string[]; lines: string[]; count: number; off: boolean }`
  - `emptyPeekState(): PeekState` (copie fraîche) et `EMPTY_PEEK_STATE: PeekState`

  - `readPeekState(): PeekState`
  - `writePeekState(state: PeekState): void`
  - `isOptedOut(now?: number): boolean`
  - `setOptOut(now?: number): void`
  - `prefersReducedMotion(): boolean`
  - `choosePeekLine(input: ChooseInput, rand?: () => number): string | null`
    où `ChooseInput = { path: string; lines: string[]; state: PeekState; optedOut: boolean; reducedMotion: boolean }`

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/usePeek.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import {
  choosePeekLine,
  EMPTY_PEEK_STATE,
  isOptedOut,
  OPTOUT_KEY,
  OPTOUT_MS,
  PEEK_KEY,
  PEEK_SESSION_CAP,
  readPeekState,
  setOptOut,
  writePeekState,
  type ChooseInput,
  type PeekState,
} from './usePeek';

const LIGNES = ['une', 'deux', 'trois'];

/** Entrée nominale : toutes les conditions passent, la bulle doit sortir. */
function entree(surcharge: Partial<ChooseInput> = {}): ChooseInput {
  return {
    path: '/projets',
    lines: LIGNES,
    state: EMPTY_PEEK_STATE,
    optedOut: false,
    reducedMotion: false,
    ...surcharge,
  };
}

describe('readPeekState', () => {
  it("retourne un état vide quand rien n'est stocké", () => {
    expect(readPeekState()).toEqual(EMPTY_PEEK_STATE);
  });

  it('relit ce que writePeekState a écrit', () => {
    const etat: PeekState = { pages: ['/blog'], lines: ['une'], count: 1, off: false };

    writePeekState(etat);

    expect(readPeekState()).toEqual(etat);
  });

  it('retourne un état vide sur du JSON corrompu plutôt que de lever', () => {
    sessionStorage.setItem(PEEK_KEY, '{ pas du json');

    expect(readPeekState()).toEqual(EMPTY_PEEK_STATE);
  });

  it("comble les champs manquants d'un état partiel", () => {
    sessionStorage.setItem(PEEK_KEY, JSON.stringify({ count: 2 }));

    expect(readPeekState()).toEqual({ pages: [], lines: [], count: 2, off: false });
  });
});

describe('opt-out de 30 jours', () => {
  it('est faux par défaut', () => {
    expect(isOptedOut()).toBe(false);
  });

  it('est vrai juste après avoir été posé', () => {
    setOptOut(1_000);

    expect(isOptedOut(1_000)).toBe(true);
  });

  it('est encore vrai à 29 jours', () => {
    setOptOut(0);

    expect(isOptedOut(29 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  it('est faux une fois les 30 jours écoulés', () => {
    setOptOut(0);

    expect(isOptedOut(OPTOUT_MS + 1)).toBe(false);
  });

  it('ignore une valeur stockée illisible', () => {
    localStorage.setItem(OPTOUT_KEY, 'jamais');

    expect(isOptedOut()).toBe(false);
  });
});

describe('choosePeekLine', () => {
  it('retourne une des répliques quand toutes les conditions passent', () => {
    expect(LIGNES).toContain(choosePeekLine(entree()));
  });

  // Les huit conditions de la spec §6.2, chacune bloquante isolément.
  it('1. bloque quand la page ne fournit aucune réplique', () => {
    expect(choosePeekLine(entree({ lines: [] }))).toBeNull();
  });

  it('2. bloque sur /contact, pour ne pas concurrencer le formulaire', () => {
    expect(choosePeekLine(entree({ path: '/contact' }))).toBeNull();
  });

  it('3. bloque sous prefers-reduced-motion', () => {
    expect(choosePeekLine(entree({ reducedMotion: true }))).toBeNull();
  });

  it("4. bloque quand l'opt-out est actif", () => {
    expect(choosePeekLine(entree({ optedOut: true }))).toBeNull();
  });

  it('5. bloque quand la session est coupée', () => {
    expect(choosePeekLine(entree({ state: { ...EMPTY_PEEK_STATE, off: true } }))).toBeNull();
  });

  it('6. bloque au plafond de bulles par session', () => {
    const state = { ...EMPTY_PEEK_STATE, count: PEEK_SESSION_CAP };

    expect(choosePeekLine(entree({ state }))).toBeNull();
  });

  it('7. bloque quand cette page a déjà eu sa bulle', () => {
    const state = { ...EMPTY_PEEK_STATE, pages: ['/projets'] };

    expect(choosePeekLine(entree({ state }))).toBeNull();
  });

  it('8. bloque quand toutes les répliques ont déjà été vues', () => {
    const state = { ...EMPTY_PEEK_STATE, lines: [...LIGNES] };

    expect(choosePeekLine(entree({ state }))).toBeNull();
  });

  it('ne retire jamais au sort une réplique déjà vue', () => {
    const state = { ...EMPTY_PEEK_STATE, lines: ['une', 'deux'] };

    // rand() = 0 comme 0,999 : il ne reste qu'un candidat possible.
    expect(choosePeekLine(entree({ state }), () => 0)).toBe('trois');
    expect(choosePeekLine(entree({ state }), () => 0.999)).toBe('trois');
  });

  it("tire dans tout l'intervalle des répliques non vues", () => {
    expect(choosePeekLine(entree(), () => 0)).toBe('une');
    expect(choosePeekLine(entree(), () => 0.999)).toBe('trois');
  });

  it("reste en deçà du plafond tant qu'il n'est pas atteint", () => {
    const state = { ...EMPTY_PEEK_STATE, count: PEEK_SESSION_CAP - 1 };

    expect(choosePeekLine(entree({ state }))).not.toBeNull();
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/usePeek.test.ts`
Attendu : ÉCHEC — `Failed to resolve import "./usePeek"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/usePeek.ts` :

```ts
/**
 * Règles de la bulle d'amorce de MARVIN-42.
 *
 * La partie décisionnelle est une fonction pure (choosePeekLine) : les
 * huit conditions se testent sans DOM ni minuterie. Le hook de la tâche 4
 * ne fait plus qu'ajouter le rythme — 6 s puis 12 s — par-dessus.
 */

export const PEEK_DELAY_MS = 6_000;
export const PEEK_DURATION_MS = 12_000;
export const PEEK_SESSION_CAP = 3;
export const OPTOUT_MS = 30 * 24 * 60 * 60 * 1000;

export const PEEK_KEY = 'marvin.peek';
export const OPTOUT_KEY = 'marvin.peek.optout';

export interface PeekState {
  /** Chemins ayant déjà servi une bulle, pour n'en servir qu'une par page. */
  pages: string[];
  /** Répliques déjà montrées, pour ne jamais répéter dans la session. */
  lines: string[];
  /** Nombre de bulles servies, plafonné par PEEK_SESSION_CAP. */
  count: number;
  /** Coupé : croix de la bulle, ou ouverture du panneau. */
  off: boolean;
}

/**
 * État vide, toujours rendu en copie fraîche.
 *
 * Partager une seule instance exposerait ses tableaux : un appelant qui
 * ferait `state.pages.push(...)` au lieu d'un spread corromprait la notion
 * même d'« aucun état stocké » pour tout le reste de la session.
 */
export function emptyPeekState(): PeekState {
  return { pages: [], lines: [], count: 0, off: false };
}

/** Repère de comparaison pour les tests. Ne jamais muter. */
export const EMPTY_PEEK_STATE: PeekState = emptyPeekState();

export function readPeekState(): PeekState {
  try {
    const brut = sessionStorage.getItem(PEEK_KEY);
    if (!brut) return emptyPeekState();

    const lu = JSON.parse(brut) as Partial<PeekState>;
    return {
      pages: Array.isArray(lu.pages) ? lu.pages : [],
      lines: Array.isArray(lu.lines) ? lu.lines : [],
      count: typeof lu.count === 'number' ? lu.count : 0,
      off: lu.off === true,
    };
  } catch {
    // JSON corrompu ou stockage inaccessible : on repart d'un état vide
    // plutôt que de priver le visiteur du dock entier.
    return emptyPeekState();
  }
}

export function writePeekState(state: PeekState): void {
  try {
    sessionStorage.setItem(PEEK_KEY, JSON.stringify(state));
  } catch {
    // Safari en navigation privée lève sur setItem. La bulle réapparaîtra
    // au rechargement : préférable à une erreur non rattrapée.
  }
}

export function isOptedOut(now: number = Date.now()): boolean {
  try {
    const brut = localStorage.getItem(OPTOUT_KEY);
    if (!brut) return false;

    const expiration = Number(brut);
    return Number.isFinite(expiration) && now < expiration;
  } catch {
    return false;
  }
}

export function setOptOut(now: number = Date.now()): void {
  try {
    localStorage.setItem(OPTOUT_KEY, String(now + OPTOUT_MS));
  } catch {
    /* voir writePeekState */
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface ChooseInput {
  path: string;
  lines: string[];
  state: PeekState;
  optedOut: boolean;
  reducedMotion: boolean;
}

/**
 * Les huit conditions de la spec §6.2, dans l'ordre. La bulle n'est
 * programmée que si toutes passent.
 */
export function choosePeekLine(
  input: ChooseInput,
  rand: () => number = Math.random
): string | null {
  const { path, lines, state, optedOut, reducedMotion } = input;

  if (lines.length === 0) return null;
  if (path === '/contact') return null;
  if (reducedMotion) return null;
  if (optedOut) return null;
  if (state.off) return null;
  if (state.count >= PEEK_SESSION_CAP) return null;
  if (state.pages.includes(path)) return null;

  const jamaisVues = lines.filter((ligne) => !state.lines.includes(ligne));
  if (jamaisVues.length === 0) return null;

  return jamaisVues[Math.floor(rand() * jamaisVues.length)];
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/usePeek.test.ts`
Attendu : 21 tests au vert (4 + 5 + 12).

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/usePeek.ts src/components/chatbot/usePeek.test.ts
git commit -m "feat: regles de selection de la bulle d'amorce"
```

---

### Tâche 4 : Règles de la bulle — le hook

**Fichiers :**
- Modifier : `src/components/chatbot/usePeek.ts` (ajout du hook en fin de fichier)
- Test : `src/components/chatbot/usePeek.hook.test.tsx`

**Interfaces :**
- Consomme : tout ce que produit la tâche 3 ; `track` de la tâche 2.
- Produit : `usePeek(path: string, lines: string[]): { peek: string | null; dismissPeek: () => void; suppressPeek: () => void }`
  - `peek` : la réplique à afficher, ou `null`.
  - `dismissPeek` : croix de la bulle — coupe la session **et** pose
    l'opt-out de 30 jours. Émet `marvin_peek_dismissed`.
  - `suppressPeek` : ouverture du panneau — coupe la session seule.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/usePeek.hook.test.tsx` :

```tsx
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { setReducedMotion } from '../../../vitest.setup';
import { ANALYTICS_EVENT } from './track';
import {
  EMPTY_PEEK_STATE,
  isOptedOut,
  PEEK_DELAY_MS,
  PEEK_DURATION_MS,
  PEEK_SESSION_CAP,
  readPeekState,
  usePeek,
  writePeekState,
} from './usePeek';

const LIGNES = ['une', 'deux', 'trois'];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Capte les événements analytics du test, et se désabonne à sa fin. */
function capterAnalytics(): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  onTestFinished(() => window.removeEventListener(ANALYTICS_EVENT, ecouteur));

  return recus;
}

/** Fait avancer les minuteries en laissant React appliquer ses effets. */
function avancer(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('usePeek', () => {
  it("n'affiche rien avant le délai de 6 s", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    expect(result.current.peek).toBeNull();

    avancer(PEEK_DELAY_MS - 1);

    expect(result.current.peek).toBeNull();
  });

  it('affiche une réplique au bout de 6 s', () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(LIGNES).toContain(result.current.peek);
  });

  it("replie la bulle au bout de 12 s d'affichage", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);
    avancer(PEEK_DURATION_MS - 1);
    expect(result.current.peek).not.toBeNull();

    avancer(1);

    expect(result.current.peek).toBeNull();
  });

  it("enregistre la page, la réplique et le compteur à l'affichage", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    const etat = readPeekState();
    expect(etat.pages).toEqual(['/projets']);
    expect(etat.lines).toEqual([result.current.peek]);
    expect(etat.count).toBe(1);
    expect(etat.off).toBe(false);
  });

  it('émet marvin_peek_shown avec la réplique et le chemin', () => {
    const recus = capterAnalytics();

    const { result } = renderHook(() => usePeek('/projets', LIGNES));
    avancer(PEEK_DELAY_MS);

    expect(recus[0].detail).toEqual({
      name: 'marvin_peek_shown',
      line: result.current.peek,
      path: '/projets',
    });
  });

  it("n'affiche rien sur /contact", () => {
    const { result } = renderHook(() => usePeek('/contact', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBeNull();
  });

  it("n'affiche rien sous prefers-reduced-motion", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBeNull();
  });

  it("n'affiche rien quand la page ne fournit aucune réplique", () => {
    const { result } = renderHook(() => usePeek('/blog/mon-article', []));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBeNull();
  });

  it("n'affiche pas de seconde bulle sur une page déjà servie", () => {
    writePeekState({ ...EMPTY_PEEK_STATE, pages: ['/projets'], count: 1 });
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBeNull();
  });

  it('respecte le plafond de bulles par session', () => {
    writePeekState({ ...EMPTY_PEEK_STATE, count: PEEK_SESSION_CAP });
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBeNull();
  });

  it('ne répète jamais une réplique déjà vue sur une autre page', () => {
    writePeekState({ ...EMPTY_PEEK_STATE, lines: ['une', 'deux'], count: 2 });
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS);

    expect(result.current.peek).toBe('trois');
  });

  it("annule la bulle si le panneau s'ouvre pendant les 6 s", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    avancer(PEEK_DELAY_MS - 1000);
    act(() => result.current.suppressPeek());
    avancer(2000);

    expect(result.current.peek).toBeNull();
    expect(readPeekState().count).toBe(0);
  });

  it("suppressPeek coupe la session sans poser l'opt-out", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));

    act(() => result.current.suppressPeek());

    expect(readPeekState().off).toBe(true);
    expect(isOptedOut()).toBe(false);
  });

  it("dismissPeek coupe la session et pose l'opt-out de 30 jours", () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));
    avancer(PEEK_DELAY_MS);

    act(() => result.current.dismissPeek());

    expect(result.current.peek).toBeNull();
    expect(readPeekState().off).toBe(true);
    expect(isOptedOut()).toBe(true);
  });

  it('dismissPeek émet marvin_peek_dismissed', () => {
    const { result } = renderHook(() => usePeek('/projets', LIGNES));
    avancer(PEEK_DELAY_MS);
    // Abonnement après coup : recus[0] doit être l'événement de fermeture.
    const recus = capterAnalytics();

    act(() => result.current.dismissPeek());

    expect(recus[0].detail).toEqual({
      name: 'marvin_peek_dismissed',
      path: '/projets',
    });
  });

  it('ne laisse pas de minuterie derrière lui au démontage', () => {
    const { unmount } = renderHook(() => usePeek('/projets', LIGNES));

    unmount();
    avancer(PEEK_DELAY_MS + PEEK_DURATION_MS);

    expect(readPeekState()).toEqual(EMPTY_PEEK_STATE);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/usePeek.hook.test.tsx`
Attendu : ÉCHEC — `usePeek is not a function` (le fichier existe mais
n'exporte pas encore le hook).

- [ ] **Étape 3 : Écrire l'implémentation minimale**

Ajouter le hook en fin de `src/components/chatbot/usePeek.ts`. Les deux
lignes d'import vont **en tête du fichier**, avec les autres — les mettre
en bas fonctionnerait (les imports sont hissés) mais brouillerait la
lecture.

```ts
// en tête du fichier
import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from './track';

// ... puis, en fin de fichier :

export interface UsePeekResult {
  peek: string | null;
  /** Croix de la bulle : coupe la session et pose l'opt-out de 30 jours. */
  dismissPeek: () => void;
  /** Ouverture du panneau : coupe la session seule. */
  suppressPeek: () => void;
}

export function usePeek(path: string, lines: string[]): UsePeekResult {
  const [peek, setPeek] = useState<string | null>(null);
  const minuterieRepli = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `lines` vient des props et change d'identité à chaque rendu. On dépend
  // de son contenu, pas de sa référence : sinon l'effet se relancerait sans
  // cesse et la minuterie de 6 s n'arriverait jamais à son terme.
  const lignesRef = useRef(lines);
  lignesRef.current = lines;
  const cleLignes = JSON.stringify(lines);

  const arreter = useCallback(() => {
    if (minuterieRepli.current) {
      clearTimeout(minuterieRepli.current);
      minuterieRepli.current = null;
    }
    setPeek(null);
  }, []);

  const suppressPeek = useCallback(() => {
    writePeekState({ ...readPeekState(), off: true });
    arreter();
  }, [arreter]);

  const dismissPeek = useCallback(() => {
    writePeekState({ ...readPeekState(), off: true });
    setOptOut();
    track('marvin_peek_dismissed', { path });
    arreter();
  }, [path, arreter]);

  useEffect(() => {
    const reducedMotion = prefersReducedMotion();
    const lignes = lignesRef.current;

    // Pré-filtrage : inutile d'armer une minuterie si la bulle est déjà
    // exclue. Le verdict qui compte est repris au déclenchement.
    const possible = choosePeekLine({
      path,
      lines: lignes,
      state: readPeekState(),
      optedOut: isOptedOut(),
      reducedMotion,
    });
    if (!possible) return;

    const minuterieAffichage = setTimeout(() => {
      // Réévaluation : le visiteur a pu ouvrir le panneau entre-temps.
      const state = readPeekState();
      const ligne = choosePeekLine({
        path,
        lines: lignes,
        state,
        optedOut: isOptedOut(),
        reducedMotion,
      });
      if (!ligne) return;

      writePeekState({
        pages: [...state.pages, path],
        lines: [...state.lines, ligne],
        count: state.count + 1,
        off: state.off,
      });

      setPeek(ligne);
      track('marvin_peek_shown', { line: ligne, path });

      minuterieRepli.current = setTimeout(() => setPeek(null), PEEK_DURATION_MS);
    }, PEEK_DELAY_MS);

    return () => {
      clearTimeout(minuterieAffichage);
      if (minuterieRepli.current) clearTimeout(minuterieRepli.current);
    };
  }, [path, cleLignes]);

  return { peek, dismissPeek, suppressPeek };
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/`
Attendu : tous les tests au vert, tâches 1 à 4 comprises.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/usePeek.ts src/components/chatbot/usePeek.hook.test.tsx
git commit -m "feat: rythme de la bulle d'amorce, 6s puis 12s"
```

---

### Tâche 5 : Fil de conversation — partie pure

**Fichiers :**
- Créer : `src/components/chatbot/useMarvinThread.ts`
- Test : `src/components/chatbot/useMarvinThread.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit :
  - `type Role = 'assistant' | 'user' | 'error'`
  - `interface Message { role: Role; content: string }`
  - `THREAD_KEY = 'marvin.thread'`, `THREAD_CAP = 40`,
    `CONTEXT_WINDOW = 6`, `GAME_MARKER = '[LANCER_JEU]'`,
    `LONG_SESSION_EVERY = 15`, `GREETING: Message`,
    `LONG_SESSION_NOTICE: string`
  - `capThread(messages: Message[]): Message[]`
  - `toApiMessages(messages: Message[]): { role: 'user' | 'assistant'; content: string }[]`
  - `parseReply(raw: string): { content: string; launchGame: boolean }`
  - `readThread(): Message[] | null`
  - `writeThread(messages: Message[]): void`

Note de conception : le contenu stocké est **nu**. Les préfixes `>` et `$`
sont aujourd'hui concaténés au contenu et partent donc vers Groq dans
l'historique ; ils passent au rendu (tâche 10).

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/useMarvinThread.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import {
  capThread,
  CONTEXT_WINDOW,
  parseReply,
  readThread,
  THREAD_CAP,
  THREAD_KEY,
  toApiMessages,
  writeThread,
  type Message,
} from './useMarvinThread';

function messages(n: number): Message[] {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: `message ${i}`,
  }));
}

describe('capThread', () => {
  it('laisse un fil court intact', () => {
    const fil = messages(5);

    expect(capThread(fil)).toEqual(fil);
  });

  it('ne garde que les derniers messages au-delà du plafond', () => {
    const fil = messages(THREAD_CAP + 10);

    const coupe = capThread(fil);

    expect(coupe).toHaveLength(THREAD_CAP);
    expect(coupe[coupe.length - 1]).toEqual(fil[fil.length - 1]);
  });
});

describe('toApiMessages', () => {
  it("exclut les entrées d'erreur de la charge envoyée à l'API", () => {
    const fil: Message[] = [
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
      { role: 'assistant', content: 'bonjour' },
    ];

    expect(toApiMessages(fil)).toEqual([
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'bonjour' },
    ]);
  });

  it('ne retient que les six derniers messages', () => {
    expect(toApiMessages(messages(20))).toHaveLength(CONTEXT_WINDOW);
  });

  it('coupe après avoir retiré les erreurs, pas avant', () => {
    const fil: Message[] = [
      ...messages(CONTEXT_WINDOW),
      { role: 'error', content: 'connexion perdue' },
    ];

    expect(toApiMessages(fil)).toHaveLength(CONTEXT_WINDOW);
  });
});

describe('parseReply', () => {
  it("rend le texte tel quel quand il n'y a pas de marqueur", () => {
    expect(parseReply('Bonjour.')).toEqual({ content: 'Bonjour.', launchGame: false });
  });

  it('détecte le marqueur de jeu et le retire du texte affiché', () => {
    expect(parseReply('Jouons. [LANCER_JEU]')).toEqual({
      content: 'Jouons.',
      launchGame: true,
    });
  });

  it('retire le chevron que le modèle ajoute parfois', () => {
    expect(parseReply('> Bonjour.').content).toBe('Bonjour.');
  });

  it('retire plusieurs marqueurs sans laisser de trace', () => {
    expect(parseReply('[LANCER_JEU] Allez. [LANCER_JEU]').content).toBe('Allez.');
  });
});

describe('persistance du fil', () => {
  it("retourne null quand rien n'est stocké", () => {
    expect(readThread()).toBeNull();
  });

  it('relit ce que writeThread a écrit', () => {
    const fil: Message[] = [{ role: 'user', content: 'salut' }];

    writeThread(fil);

    expect(readThread()).toEqual(fil);
  });

  it("ne persiste pas les entrées d'erreur", () => {
    writeThread([
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
    ]);

    expect(readThread()).toEqual([{ role: 'user', content: 'salut' }]);
  });

  it('retourne null sur du JSON corrompu plutôt que de lever', () => {
    sessionStorage.setItem(THREAD_KEY, 'pas du json');

    expect(readThread()).toBeNull();
  });

  it('écarte les entrées mal formées', () => {
    sessionStorage.setItem(
      THREAD_KEY,
      JSON.stringify([{ role: 'user', content: 'ok' }, { role: 'pirate' }, null])
    );

    expect(readThread()).toEqual([{ role: 'user', content: 'ok' }]);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/useMarvinThread.test.ts`
Attendu : ÉCHEC — `Failed to resolve import "./useMarvinThread"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/useMarvinThread.ts` :

```ts
/**
 * Fil de conversation de MARVIN-42 : modèle, persistance et appel à l'API.
 *
 * Le contenu stocké est nu. Les préfixes « > » et « $ » du terminal sont
 * décoratifs et vivent dans ChatPanel : les concaténer au contenu, comme
 * le faisait l'ancien composant, revenait à les envoyer à Groq.
 */

export type Role = 'assistant' | 'user' | 'error';

export interface Message {
  role: Role;
  content: string;
}

export const THREAD_KEY = 'marvin.thread';
export const THREAD_CAP = 40;
export const CONTEXT_WINDOW = 6;
export const GAME_MARKER = '[LANCER_JEU]';
export const LONG_SESSION_EVERY = 15;

export const GREETING: Message = {
  role: 'assistant',
  content:
    "Assistant portfolio. Pose-moi des questions, ou pas. Ça ne changera pas grand-chose à mon état.",
};

export const LONG_SESSION_NOTICE =
  'SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.';

export function capThread(messages: Message[]): Message[] {
  return messages.length <= THREAD_CAP ? messages : messages.slice(-THREAD_CAP);
}

/**
 * Charge envoyée à /api/chat. Les entrées d'erreur sont retirées d'abord :
 * elles n'apportent rien au modèle et prendraient la place d'un vrai
 * message dans la fenêtre de contexte.
 */
export function toApiMessages(
  messages: Message[]
): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((m): m is Message & { role: 'user' | 'assistant' } => m.role !== 'error')
    .slice(-CONTEXT_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function parseReply(raw: string): { content: string; launchGame: boolean } {
  const launchGame = raw.includes(GAME_MARKER);
  const content = raw.split(GAME_MARKER).join('').replace(/^\s*>\s*/, '').trim();

  return { content, launchGame };
}

export function readThread(): Message[] | null {
  try {
    const brut = sessionStorage.getItem(THREAD_KEY);
    if (!brut) return null;

    const lu: unknown = JSON.parse(brut);
    if (!Array.isArray(lu)) return null;

    const messages = lu.filter(
      (m): m is Message =>
        !!m &&
        typeof (m as Message).content === 'string' &&
        ['user', 'assistant', 'error'].includes((m as Message).role)
    );

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

export function writeThread(messages: Message[]): void {
  try {
    sessionStorage.setItem(
      THREAD_KEY,
      JSON.stringify(messages.filter((m) => m.role !== 'error'))
    );
  } catch {
    // Navigation privée : le fil ne survivra pas au changement de page.
  }
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/useMarvinThread.test.ts`
Attendu : 14 tests au vert.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/useMarvinThread.ts src/components/chatbot/useMarvinThread.test.ts
git commit -m "feat: modele et persistance du fil de conversation"
```

---

### Tâche 6 : Fil de conversation — le hook

**Fichiers :**
- Modifier : `src/components/chatbot/useMarvinThread.ts` (ajout du hook)
- Test : `src/components/chatbot/useMarvinThread.hook.test.tsx`

**Interfaces :**
- Consomme : tout ce que produit la tâche 5 ; `track` de la tâche 2.
- Produit : `useMarvinThread(): UseMarvinThreadResult` avec

```ts
interface UseMarvinThreadResult {
  messages: Message[];
  isLoading: boolean;
  /** Vrai quand le dernier message est en cours de frappe. */
  typing: boolean;
  /** Vrai quand la dernière requête a échoué : affiche « Réessayer ». */
  canRetry: boolean;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  finishTyping: () => void;
}
```

Note de conception : on suit un booléen `typing` plutôt qu'un index de
message. `ChatPanel` typographie le dernier message quand `typing` est
vrai — plus aucun index à tenir à jour à travers les ajouts différés.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/useMarvinThread.hook.test.tsx` :

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { ANALYTICS_EVENT } from './track';
import {
  GREETING,
  LONG_SESSION_NOTICE,
  useMarvinThread,
  writeThread,
  type Message,
} from './useMarvinThread';

/** Simule une réponse de /api/chat. */
function repond(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ content }),
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', repond('Réponse.'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Capte les événements analytics du test, et se désabonne à sa fin. */
function capterAnalytics(): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  onTestFinished(() => window.removeEventListener(ANALYTICS_EVENT, ecouteur));

  return recus;
}

describe('useMarvinThread', () => {
  it('démarre sur la phrase de présentation', () => {
    const { result } = renderHook(() => useMarvinThread());

    expect(result.current.messages).toEqual([GREETING]);
  });

  it('restaure le fil stocké, sans réinjecter la présentation', async () => {
    const fil: Message[] = [
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'bonjour' },
    ];
    writeThread(fil);

    const { result } = renderHook(() => useMarvinThread());

    await waitFor(() => expect(result.current.messages).toEqual(fil));
  });

  it('ajoute le message du visiteur puis la réponse', async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('Qui est Martin ?'));

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'Qui est Martin ?' },
      { role: 'assistant', content: 'Réponse.' },
    ]);
  });

  it("typographie la réponse à l'arrivée, jusqu'à finishTyping", async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));
    expect(result.current.typing).toBe(true);

    act(() => result.current.finishTyping());

    expect(result.current.typing).toBe(false);
  });

  it("n'envoie ni les préfixes ni les entrées d'erreur à l'API", async () => {
    const appel = repond('Réponse.');
    vi.stubGlobal('fetch', appel);
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    const corps = JSON.parse((appel.mock.calls[0][1] as RequestInit).body as string);
    expect(corps.messages).toEqual([
      { role: 'assistant', content: GREETING.content },
      { role: 'user', content: 'salut' },
    ]);
  });

  it("ignore un message vide ou uniquement composé d'espaces", async () => {
    const appel = repond('Réponse.');
    vi.stubGlobal('fetch', appel);
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('   '));

    expect(appel).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([GREETING]);
  });

  it('émet marvin_message_sent avec la longueur et le rang', async () => {
    const recus = capterAnalytics();
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(recus[0].detail).toEqual({
      name: 'marvin_message_sent',
      length: 5,
      index: 1,
    });
  });

  it("ajoute une entrée d'erreur sans vider l'historique", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
    ]);
    expect(result.current.canRetry).toBe(true);
  });

  it('traite une réponse HTTP en échec comme une erreur réseau', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
    );
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(result.current.messages.at(-1)).toEqual({
      role: 'error',
      content: 'connexion perdue',
    });
  });

  it('réessaie sans dupliquer le message du visiteur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const { result } = renderHook(() => useMarvinThread());
    await act(() => result.current.send('salut'));

    vi.stubGlobal('fetch', repond('Enfin.'));
    await act(() => result.current.retry());

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'Enfin.' },
    ]);
    expect(result.current.canRetry).toBe(false);
  });

  it('redirige vers /wargames quand le modèle demande le jeu', async () => {
    vi.useFakeTimers();
    // window.location est en lecture seule sous jsdom : on le redéfinit, et
    // on le restaure ensuite — sinon les tests suivants héritent du faux.
    const vraieLocation = window.location;
    const destination = { href: '' };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: destination,
    });
    vi.stubGlobal('fetch', repond('Jouons. [LANCER_JEU]'));
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('on joue ?'));
    expect(result.current.messages.at(-1)?.content).toBe('Jouons.');

    act(() => vi.advanceTimersByTime(2200));

    expect(destination.href).toBe('/wargames');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: vraieLocation,
    });
    vi.useRealTimers();
  });

  it('signale une session longue tous les quinze messages', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMarvinThread());

    for (let i = 0; i < 15; i++) {
      await act(() => result.current.send(`message ${i}`));
      act(() => result.current.finishTyping());
    }
    act(() => vi.advanceTimersByTime(2500));

    expect(result.current.messages.at(-1)?.content).toBe(LONG_SESSION_NOTICE);
    vi.useRealTimers();
  });

  it('persiste le fil après une réponse', async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    const stocke = JSON.parse(sessionStorage.getItem('marvin.thread')!);
    expect(stocke.at(-1)).toEqual({ role: 'assistant', content: 'Réponse.' });
  });

  it("n'écrase pas le fil stocké au montage", async () => {
    const fil: Message[] = [{ role: 'user', content: 'salut' }];
    writeThread(fil);

    renderHook(() => useMarvinThread());

    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem('marvin.thread')!)).toEqual(fil)
    );
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/useMarvinThread.hook.test.tsx`
Attendu : ÉCHEC — `useMarvinThread is not a function`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

Ajouter le hook en fin de `src/components/chatbot/useMarvinThread.ts`. Les
deux lignes d'import vont **en tête du fichier**, avec les autres.

```ts
// en tête du fichier
import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from './track';

// ... puis, en fin de fichier :

export interface UseMarvinThreadResult {
  messages: Message[];
  isLoading: boolean;
  typing: boolean;
  canRetry: boolean;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  finishTyping: () => void;
}

export function useMarvinThread(): UseMarvinThreadResult {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const chargementRef = useRef(false);
  const nbMessagesVisiteur = useRef(0);

  // Restauration après hydratation seulement : `client:idle` rend ce
  // composant côté serveur, où sessionStorage n'existe pas. Le premier
  // rendu client doit être identique au rendu serveur.
  useEffect(() => {
    const stocke = readThread();
    if (stocke) setMessages(stocke);
  }, []);

  // La toute première exécution est ignorée : sans ça, elle écrirait
  // [GREETING] par-dessus le fil que l'effet de restauration vient tout
  // juste de lire, et la conversation ne survivrait pas au changement de page.
  const premierPassage = useRef(true);
  useEffect(() => {
    if (premierPassage.current) {
      premierPassage.current = false;
      return;
    }
    writeThread(messages);
  }, [messages]);

  const requete = useCallback(async (historique: Message[]) => {
    chargementRef.current = true;
    setIsLoading(true);
    setCanRetry(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApiMessages(historique) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const { content, launchGame } = parseReply(String(data.content));

      setMessages(capThread([...historique, { role: 'assistant', content }]));
      setTyping(true);

      if (launchGame) {
        // Laisse le temps de lire la réplique avant de basculer sur le jeu.
        setTimeout(() => {
          window.location.href = '/wargames';
        }, 2200);
        return;
      }

      if (
        nbMessagesVisiteur.current > 0 &&
        nbMessagesVisiteur.current % LONG_SESSION_EVERY === 0
      ) {
        setTimeout(() => {
          setMessages((prev) =>
            capThread([...prev, { role: 'assistant', content: LONG_SESSION_NOTICE }])
          );
        }, 2500);
      }
    } catch {
      setMessages(
        capThread([...historique, { role: 'error', content: 'connexion perdue' }])
      );
      setCanRetry(true);
    } finally {
      chargementRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const propre = text.trim();
      if (!propre || chargementRef.current) return;

      nbMessagesVisiteur.current += 1;
      track('marvin_message_sent', {
        length: propre.length,
        index: nbMessagesVisiteur.current,
      });

      setTyping(false);
      const historique = capThread([
        ...messagesRef.current,
        { role: 'user' as const, content: propre },
      ]);
      setMessages(historique);

      await requete(historique);
    },
    [requete]
  );

  const retry = useCallback(async () => {
    if (chargementRef.current) return;

    // On retire la seule entrée d'erreur : le message du visiteur reste en
    // place et n'est donc jamais dupliqué.
    const historique = messagesRef.current.filter((m) => m.role !== 'error');
    setMessages(historique);

    await requete(historique);
  }, [requete]);

  const finishTyping = useCallback(() => setTyping(false), []);

  return { messages, isLoading, typing, canRetry, send, retry, finishTyping };
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/`
Attendu : tous les tests au vert.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/useMarvinThread.ts src/components/chatbot/useMarvinThread.hook.test.tsx
git commit -m "feat: envoi, reessai et persistance du fil de conversation"
```

---

### Tâche 7 : Jetons visuels et police

**Fichiers :**
- Modifier : `src/styles/retro.css:1` (import de polices)
- Modifier : `src/styles/retro.css:3-14` (bloc `:root`)

**Interfaces :**
- Consomme : rien.
- Produit les variables CSS utilisées par les tâches 8 à 11 :
  `--font-mono`, `--marvin-pill-bg`, `--marvin-pill-fg`,
  `--marvin-surface`, `--marvin-border`, `--marvin-fg`, `--marvin-user`,
  `--marvin-placeholder`, `--marvin-shadow`, `--marvin-z`.

Cette tâche n'a pas de test automatisé : elle ne produit que des jetons.
Sa vérification est visuelle, à l'étape 3.

- [ ] **Étape 1 : Ajouter JetBrains Mono à l'import existant**

Remplacer la ligne 1 de `src/styles/retro.css` par :

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
```

La famille est ajoutée à la requête existante : pas de connexion
supplémentaire, et `display=swap` évite le texte invisible au chargement.

- [ ] **Étape 2 : Ajouter les jetons du dock**

Dans `src/styles/retro.css`, à la fin du bloc `:root`, après
`--card-bg: #fff;` :

```css
  /* Dock MARVIN-42. Valeurs du brief §5, sauf --marvin-placeholder :
     le #2A4C38 d'origine tombe à 2,0:1 sur --marvin-surface, sous le
     4,5:1 exigé par WCAG 1.4.3 pour un texte porteur d'information.
     #5C8F71 vaut 4,6:1 en gardant la même teinte vert sourd. */
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --marvin-pill-bg: #0F1C17;
  --marvin-pill-fg: #B9F6CE;
  --marvin-surface: #05120C;
  --marvin-border: #1E3A2A;
  --marvin-fg: #35D97A;
  --marvin-user: #6FE3FF;
  --marvin-placeholder: #5C8F71;
  --marvin-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  --marvin-z: 40;
```

- [ ] **Étape 3 : Vérifier le chargement de la police**

Lancer `astro dev --background`, ouvrir `http://localhost:4321`, puis dans
la console du navigateur :

```js
getComputedStyle(document.documentElement).getPropertyValue('--marvin-fg')
document.fonts.check('13px "JetBrains Mono"')
```

Attendu : `" #35D97A"` et `true`. Arrêter avec `astro dev stop`.

- [ ] **Étape 4 : Commit**

```bash
git add src/styles/retro.css
git commit -m "feat: jetons visuels du dock et chargement de JetBrains Mono"
```

---

### Tâche 8 : Effet de frappe borné

**Fichiers :**
- Créer : `src/components/chatbot/TypewriterText.tsx`
- Test : `src/components/chatbot/TypewriterText.test.tsx`

**Interfaces :**
- Consomme : `prefersReducedMotion` de la tâche 3.
- Produit : `TYPE_BUDGET_MS = 2000` et
  `<TypewriterText text={string} onDone?={() => void} />`
  - Durée totale plafonnée à `TYPE_BUDGET_MS`, quelle que soit la longueur.
  - Sous `prefers-reduced-motion`, le texte apparaît d'un bloc et `onDone`
    est appelé immédiatement.
  - Accessibilité : le texte en cours de frappe est `aria-hidden` ; une
    fois terminé, un jumeau `sr-only` porte la phrase entière, ce qui
    produit **une seule** annonce dans la région `aria-live` du panneau.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/TypewriterText.test.tsx` :

```tsx
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setReducedMotion } from '../../../vitest.setup';
import { TYPE_BUDGET_MS, TypewriterText } from './TypewriterText';

const COURT = 'Bonjour.';
const LONG = 'a'.repeat(1000);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('TypewriterText', () => {
  it('commence vide puis se remplit', () => {
    const { container } = render(<TypewriterText text={COURT} />);

    expect(container.textContent).toBe('');

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    expect(container.textContent).toContain(COURT);
  });

  it('termine un texte long dans le budget de 2 s', () => {
    const fini = vi.fn();
    render(<TypewriterText text={LONG} onDone={fini} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    expect(fini).toHaveBeenCalled();
  });

  it('appelle onDone une seule fois', () => {
    const fini = vi.fn();
    render(<TypewriterText text={COURT} onDone={fini} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS * 3));

    expect(fini).toHaveBeenCalledTimes(1);
  });

  it("affiche tout d'un bloc sous prefers-reduced-motion", () => {
    setReducedMotion(true);
    const fini = vi.fn();

    const { container } = render(<TypewriterText text={COURT} onDone={fini} />);

    expect(container.textContent).toContain(COURT);
    expect(fini).toHaveBeenCalled();
  });

  it("masque le texte en cours de frappe aux lecteurs d'écran", () => {
    const { container } = render(<TypewriterText text={COURT} />);

    act(() => vi.advanceTimersByTime(30));

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByText(COURT)).not.toBeInTheDocument();
  });

  it("expose la phrase entière aux lecteurs d'écran une fois la frappe finie", () => {
    render(<TypewriterText text={COURT} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    expect(screen.getByText(COURT)).toHaveClass('sr-only');
  });

  it('repart de zéro quand le texte change', () => {
    const { container, rerender } = render(<TypewriterText text={COURT} />);
    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    rerender(<TypewriterText text="Autre chose." />);

    expect(container.textContent).toBe('');
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/TypewriterText.test.tsx`
Attendu : ÉCHEC — `Failed to resolve import "./TypewriterText"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/TypewriterText.tsx` :

```tsx
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './usePeek';

/** Durée totale de la frappe, quelle que soit la longueur du texte. */
export const TYPE_BUDGET_MS = 2_000;

/** Un battement par image environ : plus fin ne se voit pas. */
const BATTEMENT_MS = 16;

interface TypewriterTextProps {
  text: string;
  onDone?: () => void;
}

/**
 * Frappe caractère par caractère, à budget constant.
 *
 * L'ancien composant avançait de 15 ms par caractère : une réponse de 400
 * signes mettait six secondes, illisible en diagonale dans un panneau
 * étroit. Ici c'est le nombre de caractères par battement qui s'adapte au
 * texte, pas la durée.
 */
export function TypewriterText({ text, onDone }: TypewriterTextProps) {
  const reduit = prefersReducedMotion();
  const [affiche, setAffiche] = useState(reduit ? text : '');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduit) {
      setAffiche(text);
      onDoneRef.current?.();
      return;
    }

    setAffiche('');

    const battements = Math.max(1, Math.round(TYPE_BUDGET_MS / BATTEMENT_MS));
    const pas = Math.max(1, Math.ceil(text.length / battements));
    let i = 0;

    const minuterie = setInterval(() => {
      i = Math.min(i + pas, text.length);
      setAffiche(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(minuterie);
        onDoneRef.current?.();
      }
    }, BATTEMENT_MS);

    return () => clearInterval(minuterie);
  }, [text, reduit]);

  const fini = affiche.length >= text.length;

  return (
    <>
      {/* Masqué aux lecteurs d'écran : sans ça, la région aria-live du
          panneau annoncerait le texte par fragments à chaque battement. */}
      <span aria-hidden="true">{affiche}</span>
      {fini && <span className="sr-only">{text}</span>}
    </>
  );
}

export default TypewriterText;
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/TypewriterText.test.tsx`
Attendu : 7 tests au vert.

- [ ] **Étape 5 : Commit**

```bash
git add src/components/chatbot/TypewriterText.tsx src/components/chatbot/TypewriterText.test.tsx
git commit -m "feat: effet de frappe a duree plafonnee"
```

---

### Tâche 9 : La bulle d'amorce

**Fichiers :**
- Créer : `src/components/chatbot/PeekBubble.tsx`
- Test : `src/components/chatbot/PeekBubble.test.tsx`

**Interfaces :**
- Consomme : les jetons de la tâche 7.
- Produit : `<PeekBubble line={string} onOpen={() => void} onDismiss={() => void} />`

Rappel de la décision D8 : la bulle porte `aria-hidden="true"` et ses
boutons `tabIndex={-1}`. Le §7 du brief exige que la bulle ne soit jamais
annoncée ni focusée ; un bouton focusable dans un conteneur `aria-hidden`
serait une faute d'accessibilité. Conséquence assumée : un visiteur au
clavier ne perçoit pas la bulle et atteint directement la pastille.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/PeekBubble.test.tsx` :

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeekBubble } from './PeekBubble';

const LIGNE = 'Je connais son parcours par cœur.';

function poser() {
  const props = { line: LIGNE, onOpen: vi.fn(), onDismiss: vi.fn() };
  return { ...render(<PeekBubble {...props} />), props };
}

describe('PeekBubble', () => {
  it('affiche la réplique', () => {
    const { container } = poser();

    expect(container.textContent).toContain(LIGNE);
  });

  it("est invisible aux lecteurs d'écran (décision D8)", () => {
    const { container } = poser();

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('ouvre le panneau au clic sur le corps de la bulle', () => {
    const { props } = poser();

    fireEvent.click(screen.getByTestId('peek-corps'));

    expect(props.onOpen).toHaveBeenCalledOnce();
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('ferme au clic sur la croix, sans ouvrir le panneau', () => {
    const { props } = poser();

    fireEvent.click(screen.getByTestId('peek-fermer'));

    expect(props.onDismiss).toHaveBeenCalledOnce();
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it('retire ses boutons du parcours de tabulation (décision D8)', () => {
    poser();

    expect(screen.getByTestId('peek-corps')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('peek-fermer')).toHaveAttribute('tabindex', '-1');
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/PeekBubble.test.tsx`
Attendu : ÉCHEC — `Failed to resolve import "./PeekBubble"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/PeekBubble.tsx` :

```tsx
interface PeekBubbleProps {
  line: string;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * Bulle d'amorce : la réplique qui s'échappe de la pastille.
 *
 * `aria-hidden` et `tabIndex={-1}` viennent du §7 du brief — la bulle ne
 * doit jamais être annoncée ni prendre le focus. C'est une sollicitation,
 * pas un contrôle : la pastille, elle, est pleinement accessible.
 */
export function PeekBubble({ line, onOpen, onDismiss }: PeekBubbleProps) {
  return (
    <div aria-hidden="true" className="marvin-peek">
      <button
        type="button"
        data-testid="peek-corps"
        tabIndex={-1}
        onClick={onOpen}
        className="marvin-peek__corps"
      >
        {line}
      </button>

      <button
        type="button"
        data-testid="peek-fermer"
        tabIndex={-1}
        onClick={onDismiss}
        className="marvin-peek__fermer"
      >
        ✕
      </button>
    </div>
  );
}

export default PeekBubble;
```

- [ ] **Étape 4 : Ajouter les styles de la bulle**

À la fin de `src/styles/retro.css` :

```css
/* ---- Dock MARVIN-42 : bulle d'amorce ----------------------------- */

.marvin-peek {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  max-width: 250px;
  padding: 10px 4px 10px 14px;
  background: var(--marvin-surface);
  border: 1px solid var(--marvin-border);
  border-radius: 12px;
  box-shadow: var(--marvin-shadow);
  color: var(--marvin-fg);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  animation: marvin-bulle 240ms ease-out;
}

.marvin-peek button {
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.marvin-peek__corps { flex: 1; }

/* 44 px de cible tactile (§5) sans occuper 44 px de hauteur visible. */
.marvin-peek__fermer {
  flex: none;
  width: 44px;
  height: 44px;
  margin-top: -10px;
  display: grid;
  place-items: center;
  color: var(--marvin-placeholder);
}

@keyframes marvin-bulle {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 639px) {
  .marvin-peek { max-width: calc(100vw - 96px); }
}

@media (prefers-reduced-motion: reduce) {
  .marvin-peek { animation: none; }
}
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/PeekBubble.test.tsx`
Attendu : 5 tests au vert.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/chatbot/PeekBubble.tsx src/components/chatbot/PeekBubble.test.tsx src/styles/retro.css
git commit -m "feat: bulle d'amorce de MARVIN-42"
```

---

### Tâche 10 : Le panneau de conversation

**Fichiers :**
- Créer : `src/components/chatbot/ChatPanel.tsx`
- Test : `src/components/chatbot/ChatPanel.test.tsx`
- Modifier : `src/styles/retro.css` (panneau et feuille mobile)

**Interfaces :**
- Consomme : `Message` (tâche 5), `TypewriterText` (tâche 8), les jetons
  (tâche 7).
- Produit :

```tsx
interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  typing: boolean;
  canRetry: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onFinishTyping: () => void;
}
```

Le panneau porte `id="marvin-panneau"` — `MarvinDock` (tâche 11) y pointe
via `aria-controls`.

La croix du panneau est libellée « Fermer la conversation », et **non**
« Fermer le chat MARVIN-42 » : ce dernier libellé est celui de la pastille
quand elle est ouverte. Deux boutons homonymes rendraient les requêtes de
test ambiguës et feraient annoncer deux fois la même chose par un lecteur
d'écran.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/ChatPanel.test.tsx` :

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import type { Message } from './useMarvinThread';

const FIL: Message[] = [
  { role: 'assistant', content: 'Assistant portfolio.' },
  { role: 'user', content: 'Qui est Martin ?' },
];

function poser(surcharge: Partial<Parameters<typeof ChatPanel>[0]> = {}) {
  const props = {
    messages: FIL,
    isLoading: false,
    typing: false,
    canRetry: false,
    onSend: vi.fn(),
    onRetry: vi.fn(),
    onClose: vi.fn(),
    onFinishTyping: vi.fn(),
    ...surcharge,
  };
  return { ...render(<ChatPanel {...props} />), props };
}

describe('ChatPanel', () => {
  it('est un dialogue non modal nommé', () => {
    poser();

    const dialogue = screen.getByRole('dialog');
    expect(dialogue).toHaveAttribute('aria-modal', 'false');
    expect(dialogue).toHaveAccessibleName(/MARVIN-42/);
  });

  it("place le focus sur la saisie à l'ouverture", () => {
    poser();

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('affiche tout le fil', () => {
    const { container } = poser();

    expect(container.textContent).toContain('Assistant portfolio.');
    expect(container.textContent).toContain('Qui est Martin ?');
  });

  it('annonce poliment les nouveaux messages', () => {
    poser();

    expect(screen.getByTestId('marvin-historique')).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });

  it('envoie la saisie et vide le champ', () => {
    const { props } = poser();
    const champ = screen.getByRole('textbox');

    fireEvent.change(champ, { target: { value: 'Bonjour' } });
    fireEvent.submit(champ.closest('form')!);

    expect(props.onSend).toHaveBeenCalledWith('Bonjour');
    expect(champ).toHaveValue('');
  });

  it("n'envoie rien quand le champ est vide", () => {
    const { props } = poser();

    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('ferme à la demande', () => {
    const { props } = poser();

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('propose de réessayer après une erreur, sans vider le fil', () => {
    const avecErreur: Message[] = [
      ...FIL,
      { role: 'error', content: 'connexion perdue' },
    ];
    const { props, container } = poser({ messages: avecErreur, canRetry: true });

    expect(container.textContent).toContain('connexion perdue');
    expect(container.textContent).toContain('Qui est Martin ?');

    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('ne propose pas de réessayer quand tout va bien', () => {
    poser();

    expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument();
  });

  it("termine la frappe au clic dans l'historique", () => {
    const { props } = poser({ typing: true });

    fireEvent.click(screen.getByTestId('marvin-historique'));

    expect(props.onFinishTyping).toHaveBeenCalledOnce();
  });

  it('désactive la saisie pendant le chargement', () => {
    poser({ isLoading: true });

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/ChatPanel.test.tsx`
Attendu : ÉCHEC — `Failed to resolve import "./ChatPanel"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/ChatPanel.tsx` :

```tsx
import { useEffect, useRef, useState } from 'react';
import { TypewriterText } from './TypewriterText';
import type { Message } from './useMarvinThread';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  typing: boolean;
  canRetry: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onFinishTyping: () => void;
}

/** Le préfixe de terminal est décoratif : il ne part jamais vers l'API. */
function prefixe(role: Message['role']): string {
  if (role === 'user') return '$';
  if (role === 'error') return '!';
  return '>';
}

function couleur(role: Message['role']): string {
  if (role === 'user') return 'var(--marvin-user)';
  if (role === 'error') return 'var(--marvin-pill-fg)';
  return 'var(--marvin-fg)';
}

export function ChatPanel({
  messages,
  isLoading,
  typing,
  canRetry,
  onSend,
  onRetry,
  onClose,
  onFinishTyping,
}: ChatPanelProps) {
  const [saisie, setSaisie] = useState('');
  const champRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    champRef.current?.focus();
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing]);

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const propre = saisie.trim();
    if (!propre) return;

    setSaisie('');
    onSend(propre);
  }

  return (
    <section
      id="marvin-panneau"
      role="dialog"
      aria-modal="false"
      aria-labelledby="marvin-titre"
      className="marvin-panneau"
    >
      <header className="marvin-panneau__titre">
        <span className="marvin-panneau__poignee" aria-hidden="true" />
        <span id="marvin-titre">MARVIN-42</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la conversation"
          className="marvin-panneau__fermer"
        >
          ✕
        </button>
      </header>

      <div
        data-testid="marvin-historique"
        className="marvin-panneau__historique"
        aria-live="polite"
        onClick={() => typing && onFinishTyping()}
      >
        {messages.map((msg, i) => {
          const enFrappe =
            typing && i === messages.length - 1 && msg.role === 'assistant';

          return (
            <p key={i} style={{ color: couleur(msg.role) }}>
              <span aria-hidden="true">{prefixe(msg.role)} </span>
              {enFrappe ? (
                <TypewriterText text={msg.content} onDone={onFinishTyping} />
              ) : (
                msg.content
              )}
            </p>
          );
        })}

        {isLoading && (
          <p aria-hidden="true" style={{ color: 'var(--marvin-fg)' }}>
            &gt; <span className="animate-pulse">_</span>
          </p>
        )}

        {canRetry && (
          <button type="button" onClick={onRetry} className="marvin-panneau__reessayer">
            Réessayer
          </button>
        )}

        <div ref={finRef} />
      </div>

      <form onSubmit={envoyer} className="marvin-panneau__saisie">
        <span aria-hidden="true" style={{ color: 'var(--marvin-fg)' }}>
          $
        </span>
        <input
          ref={champRef}
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Écris un message…"
          aria-label="Votre message pour MARVIN-42"
          disabled={isLoading}
        />
        <button type="submit" aria-label="Envoyer le message" disabled={isLoading}>
          ⏎
        </button>
      </form>
    </section>
  );
}

export default ChatPanel;
```

- [ ] **Étape 4 : Écrire les styles du panneau, feuille mobile comprise**

À la fin de `src/styles/retro.css` :

```css
/* ---- Dock MARVIN-42 : panneau ------------------------------------ */

.marvin-panneau {
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 480px;
  overflow: hidden;
  background: var(--marvin-surface);
  border: 1px solid var(--marvin-border);
  border-radius: 12px;
  box-shadow: var(--marvin-shadow);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  transform-origin: bottom right;
  animation: marvin-ouverture 200ms ease-out;
}

@keyframes marvin-ouverture {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.marvin-panneau__titre {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 14px;
  border-bottom: 1px solid var(--marvin-border);
  color: var(--marvin-pill-fg);
}

.marvin-panneau__poignee { display: none; }

.marvin-panneau__fermer,
.marvin-panneau__saisie button {
  margin-left: auto;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--marvin-fg);
  font-family: var(--font-mono);
  font-size: 13px;
}

.marvin-panneau__historique {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.marvin-panneau__historique p { margin: 0 0 10px; }

.marvin-panneau__reessayer {
  min-height: 44px;
  padding: 0 14px;
  background: none;
  border: 1px solid var(--marvin-border);
  border-radius: 8px;
  color: var(--marvin-pill-fg);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 13px;
}

.marvin-panneau__saisie {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom)) 14px;
  border-top: 1px solid var(--marvin-border);
}

.marvin-panneau__saisie input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--marvin-user);
  font-family: var(--font-mono);
  font-size: 13px;
}

.marvin-panneau__saisie input::placeholder { color: var(--marvin-placeholder); }

/* Feuille pleine largeur sous 640 px.
   `dvh` et non `vh` : c'est ce qui fait que la feuille se réduit quand le
   clavier logiciel monte, au lieu de passer dessous. L'historique est en
   flex:1, donc la saisie reste collée en bas et visible. */
@media (max-width: 639px) {
  .marvin-panneau {
    width: 100vw;
    height: 80dvh;
    border-radius: 12px 12px 0 0;
    border-bottom: none;
  }

  .marvin-panneau__titre { position: relative; padding-top: 16px; }

  .marvin-panneau__poignee {
    display: block;
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--marvin-border);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marvin-panneau { animation: none; }
}
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/components/chatbot/ChatPanel.test.tsx`
Attendu : 11 tests au vert.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/chatbot/ChatPanel.tsx src/components/chatbot/ChatPanel.test.tsx src/styles/retro.css
git commit -m "feat: panneau de conversation et feuille mobile"
```

---

### Tâche 11 : L'orchestrateur

**Fichiers :**
- Créer : `src/components/chatbot/MarvinDock.tsx`
- Test : `src/components/chatbot/MarvinDock.test.tsx`
- Modifier : `src/styles/retro.css` (conteneur et pastille)

**Interfaces :**
- Consomme : `usePeek` (tâche 4), `useMarvinThread` (tâche 6), `PeekBubble`
  (tâche 9), `ChatPanel` (tâche 10), `track` (tâche 2).
- Produit : `export default function MarvinDock({ peekLines }: { peekLines?: string[] })`

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/components/chatbot/MarvinDock.test.tsx` :

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import MarvinDock from './MarvinDock';
import { ANALYTICS_EVENT } from './track';
import { PEEK_DELAY_MS, readPeekState } from './usePeek';

const LIGNES = ['Tu peux lire tout le site, ou me demander.'];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: 'Soit.' }) })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function avancer(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function pastille() {
  return screen.getByRole('button', { name: /ouvrir le chat marvin-42/i });
}

/** Capte les événements analytics du test, et se désabonne à sa fin. */
function capterAnalytics(): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  onTestFinished(() => window.removeEventListener(ANALYTICS_EVENT, ecouteur));

  return recus;
}


describe('MarvinDock', () => {
  it("ne montre qu'une pastille au repos", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    expect(pastille()).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("décrit l'état du panneau via aria-expanded", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    expect(pastille()).toHaveAttribute('aria-expanded', 'false');
    expect(pastille()).toHaveAttribute('aria-controls', 'marvin-panneau');

    fireEvent.click(pastille());

    expect(
      screen.getByRole('button', { name: /fermer le chat marvin-42/i })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('ouvre le panneau au clic sur la pastille', () => {
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('émet marvin_open avec la source du clic', () => {
    const recus = capterAnalytics();
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());

    expect(recus.at(-1)?.detail).toMatchObject({ name: 'marvin_open', source: 'pill' });
  });

  it("affiche la bulle au bout de 6 s, puis l'ouvre au clic", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    avancer(PEEK_DELAY_MS);
    expect(screen.getByText(LIGNES[0])).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('peek-corps'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
  });

  it('coupe définitivement la bulle au clic sur la croix', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    avancer(PEEK_DELAY_MS);

    fireEvent.click(screen.getByTestId('peek-fermer'));

    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
    expect(readPeekState().off).toBe(true);
    expect(localStorage.getItem('marvin.peek.optout')).not.toBeNull();
  });

  it('ferme le panneau sur Échap et rend le focus à la pastille', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    fireEvent.click(pastille());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pastille()).toHaveFocus();
  });

  it('rend le focus à la pastille après fermeture par la croix du panneau', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    fireEvent.click(pastille());

    fireEvent.click(screen.getByRole('button', { name: /fermer la conversation/i }));

    expect(pastille()).toHaveFocus();
  });

  it("n'affiche plus de bulle une fois le panneau ouvert", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());
    fireEvent.click(screen.getByRole('button', { name: /fermer la conversation/i }));
    avancer(PEEK_DELAY_MS * 2);

    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
  });

  it('fonctionne sans répliques (page sans amorce)', () => {
    render(<MarvinDock />);

    avancer(PEEK_DELAY_MS * 2);

    expect(pastille()).toBeInTheDocument();
    expect(screen.queryByTestId('peek-corps')).not.toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/components/chatbot/MarvinDock.test.tsx`
Attendu : ÉCHEC — `Failed to resolve import "./MarvinDock"`.

- [ ] **Étape 3 : Écrire l'implémentation minimale**

`src/components/chatbot/MarvinDock.tsx` :

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import PeekBubble from './PeekBubble';
import { track } from './track';
import { useMarvinThread } from './useMarvinThread';
import { usePeek } from './usePeek';

interface MarvinDockProps {
  /** Répliques d'amorce de la page courante. Absent = pas de bulle. */
  peekLines?: string[];
}

/** Référence stable : un littéral par défaut relancerait l'effet à chaque rendu. */
const SANS_REPLIQUE: string[] = [];

export default function MarvinDock({ peekLines = SANS_REPLIQUE }: MarvinDockProps) {
  const [ouvert, setOuvert] = useState(false);
  const pastilleRef = useRef<HTMLButtonElement>(null);

  // Pas de `window` au rendu : ce composant est rendu côté serveur par
  // `client:idle`. Le chemin n'est connu qu'après hydratation.
  const [chemin, setChemin] = useState('');
  useEffect(() => setChemin(window.location.pathname), []);

  const { peek, dismissPeek, suppressPeek } = usePeek(chemin, peekLines);
  const fil = useMarvinThread();

  const ouvrir = useCallback(
    (source: 'pill' | 'bubble') => {
      suppressPeek();
      setOuvert(true);
      track('marvin_open', { source, path: chemin });
    },
    [chemin, suppressPeek]
  );

  const fermer = useCallback(() => {
    setOuvert(false);
    pastilleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    document.addEventListener('keydown', surTouche);

    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, fermer]);

  return (
    <div className="marvin-dock">
      {ouvert && (
        <ChatPanel
          messages={fil.messages}
          isLoading={fil.isLoading}
          typing={fil.typing}
          canRetry={fil.canRetry}
          onSend={fil.send}
          onRetry={fil.retry}
          onClose={fermer}
          onFinishTyping={fil.finishTyping}
        />
      )}

      {!ouvert && peek && (
        <PeekBubble line={peek} onOpen={() => ouvrir('bubble')} onDismiss={dismissPeek} />
      )}

      <button
        ref={pastilleRef}
        type="button"
        className="marvin-pastille"
        aria-expanded={ouvert}
        aria-controls="marvin-panneau"
        aria-label={ouvert ? 'Fermer le chat MARVIN-42' : 'Ouvrir le chat MARVIN-42'}
        onClick={() => (ouvert ? fermer() : ouvrir('pill'))}
      >
        <span aria-hidden="true">$_</span>
      </button>
    </div>
  );
}
```

- [ ] **Étape 4 : Ajouter les styles du conteneur et de la pastille**

À la fin de `src/styles/retro.css` :

```css
/* ---- Dock MARVIN-42 : conteneur et pastille ---------------------- */

.marvin-dock {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: var(--marvin-z);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.marvin-pastille {
  flex: none;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--marvin-border);
  background: var(--marvin-pill-bg);
  box-shadow: var(--marvin-shadow);
  color: var(--marvin-pill-fg);
  font-family: var(--font-mono);
  font-size: 15px;
  cursor: pointer;
}

/* La feuille mobile occupe toute la largeur : le dock s'ancre aux bords
   et la pastille s'efface, la fermeture passant par la barre de titre. */
@media (max-width: 639px) {
  .marvin-dock:has(.marvin-panneau) {
    right: 0;
    bottom: 0;
    gap: 0;
  }

  .marvin-dock:has(.marvin-panneau) .marvin-pastille { display: none; }
}
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test`
Attendu : toute la suite au vert, tâches 1 à 11 comprises.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/chatbot/MarvinDock.tsx src/components/chatbot/MarvinDock.test.tsx src/styles/retro.css
git commit -m "feat: orchestrateur du dock MARVIN-42"
```

---

### Tâche 12 : Bascule — contenu, layout et pages

**Fichiers :**
- Modifier : `src/data/marvinLines.ts`
- Modifier : `src/layouts/BaseLayout.astro:3,5-12,14-19,76`
- Modifier : `src/pages/index.astro:11,15-17,24`
- Modifier : `src/pages/projets.astro:5,11,17`
- Modifier : `src/pages/blog.astro:5,10,16`
- Modifier : `src/pages/contact.astro:3,5,11`
- Modifier : `src/pages/projets/[slug].astro:4,17,23`
- Supprimer : `src/components/chatbot/ChatBot.tsx`
- Test : `src/data/marvinLines.test.ts`

**Interfaces :**
- Consomme : `MarvinDock` (tâche 11).
- Produit : `BaseLayout` accepte `peekLines?: string[]` en lieu et place de
  `pageLine?: string` et `sectionLines?: Record<string, string>`.

- [ ] **Étape 1 : Écrire le test qui échoue**

`src/data/marvinLines.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import * as marvinLines from './marvinLines';
import { pageLines, projectLines } from './marvinLines';

describe('marvinLines', () => {
  it("fournit des répliques d'amorce pour la page d'accueil", () => {
    expect(pageLines['/']).toHaveLength(3);
    expect(pageLines['/'][0]).toContain('Tu peux lire tout le site');
  });

  it('couvre les pages de liste', () => {
    expect(pageLines['/projets'].length).toBeGreaterThan(0);
    expect(pageLines['/blog'].length).toBeGreaterThan(0);
  });

  it('ne garde pas de répliques pour les pages sans bulle', () => {
    // /contact est exclu par le §4 ; /wargames n'utilise pas BaseLayout.
    expect(pageLines['/contact']).toBeUndefined();
    expect(pageLines['/wargames']).toBeUndefined();
  });

  it('conserve les répliques des pages projet, avec leur gabarit', () => {
    expect(projectLines.length).toBeGreaterThan(0);
    expect(projectLines.some((l) => l.includes('{titre}'))).toBe(true);
  });

  it("n'expose plus que les données, le tirage étant passé côté client", () => {
    expect(Object.keys(marvinLines).sort()).toEqual(['pageLines', 'projectLines']);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

Commande : `bun run test src/data/marvinLines.test.ts`
Attendu : ÉCHEC — `pageLines['/']` vaut `undefined`.

- [ ] **Étape 3 : Mettre à jour le contenu**

Dans `src/data/marvinLines.ts` :

1. Ajouter l'entrée `'/'` **en tête** de `pageLines` :

```ts
  '/': [
    "Tu peux lire tout le site, ou me demander. Les deux me sont égaux.",
    "Je connais son parcours par cœur. Ce n'est pas un privilège.",
    "Vingt ans d'infrastructure avant le code. Pose la question, je développerai.",
  ],
```

2. Supprimer l'entrée `'/contact'` : le §4 du brief interdit toute bulle
   sur cette page, pour ne pas concurrencer le formulaire.
3. Supprimer l'entrée `'/wargames'` : cette page déclare son propre
   `<html>` et ne monte pas le dock — ces répliques n'étaient lues par
   personne.
4. Supprimer entièrement l'export `sectionLines` (les six sections). Ces
   répliques commentaient ce que le visiteur a déjà sous les yeux, et
   l'`IntersectionObserver` qui les servait disparaît avec `ChatBot.tsx`.
5. Conserver `projectLines` inchangé.
5 bis. **Supprimer `pickLine`.** Le tirage au sort se fait désormais côté
   client, dans `choosePeekLine`, qui seul connaît les répliques déjà vues.
   Plus aucune page ne l'appelle : la garder serait du code mort.
6. Mettre à jour le commentaire d'en-tête : les répliques alimentent
   désormais la bulle d'amorce du dock, plus un terminal toujours ouvert.

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

Commande : `bun run test src/data/marvinLines.test.ts`
Attendu : 5 tests au vert.

- [ ] **Étape 5 : Mettre à jour le layout**

Dans `src/layouts/BaseLayout.astro`, ligne 3 :

```diff
-import ChatBot from '../components/chatbot/ChatBot.tsx';
+import MarvinDock from '../components/chatbot/MarvinDock.tsx';
```

Remplacer les deux props par une seule dans l'interface :

```ts
export interface Props {
  title: string;
  description?: string;
  /** Répliques d'amorce de la page. Absent = pas de bulle. */
  peekLines?: string[];
}
```

Adapter la déstructuration —
`const { title, description = "...", peekLines } = Astro.props;` — en
conservant la valeur par défaut de `description` telle quelle.

Puis le montage, ligne 76 :

```diff
-    <ChatBot client:only="react" pageLine={pageLine} sectionLines={sectionLines} />
+    <MarvinDock client:idle peekLines={peekLines} />
```

`client:idle` et non `client:only` : la pastille est rendue côté serveur —
donc présente dans le HTML, sans décalage de mise en page — et le
JavaScript n'est hydraté qu'à l'inactivité, ce qui laisse le hero se
charger d'abord.

- [ ] **Étape 6 : Mettre à jour les pages**

`src/pages/index.astro` — supprimer l'import de `sectionLines` et de
`pickLine`, supprimer le bloc `const sectionLines = Object.fromEntries(...)`
et la prop `sectionLines`, puis :

```astro
import { pageLines } from '../data/marvinLines';
```

et sur `<BaseLayout>` : `peekLines={pageLines['/']}`.

`src/pages/projets.astro` — retirer `pickLine` de l'import et supprimer la
ligne `const marvinLine = ...`, puis remplacer `pageLine={marvinLine}` par
`peekLines={pageLines['/projets']}`.

`src/pages/blog.astro` — même transformation, avec `pageLines['/blog']`.

`src/pages/contact.astro` — supprimer l'import de `marvinLines`, la ligne
`const marvinLine = ...` et la prop `pageLine`. La page ne passe plus
rien : le §4 y interdit la bulle.

`src/pages/projets/[slug].astro` — le gabarit `{titre}` reste substitué,
mais sur toute la liste :

```astro
import { projectLines } from '../../data/marvinLines';
...
const peekLines = projectLines.map((l) => l.replace('{titre}', project.data.title));
```

et sur `<BaseLayout>` : `peekLines={peekLines}`.

`src/pages/blog/[slug].astro` — inchangé : aucune réplique n'est écrite
pour les articles, donc aucune bulle. Le dock y est présent et
fonctionnel.

- [ ] **Étape 7 : Supprimer l'ancien composant**

```bash
git rm src/components/chatbot/ChatBot.tsx
grep -rnE "ChatBot|sectionLines|pageLine\b" src/
```

Attendu : la commande `grep` ne renvoie rien. La limite de mot `\b` est
indispensable : sans elle le motif `pageLine` matcherait `pageLines`, qui
doit rester.

- [ ] **Étape 8 : Vérifier la suite et la compilation**

```bash
bun run test
bunx astro check
bun run build
```

Attendu : tests au vert, aucune erreur de type, build réussi.

- [ ] **Étape 9 : Commit**

```bash
git add -A src/
git commit -m "refactor: bascule le chat sur le dock flottant MARVIN-42"
```

---

### Tâche 13 : Vérification finale

**Fichiers :** aucun, sauf correctif éventuel.

Cette tâche n'introduit pas de code. Elle confronte le résultat aux huit
critères d'acceptation de la spec §12. Ne pas la déclarer terminée sans
avoir exécuté chaque vérification et constaté son résultat.

- [ ] **Étape 1 : Vérifier la suite automatisée**

```bash
bun run test
bunx astro check
bun run build
```

Attendu : tout au vert. Noter le nombre de tests passés.

- [ ] **Étape 2 : Vérifier la pastille dans le HTML servi**

```bash
bun run preview &
sleep 3
curl -s http://localhost:4321/ | grep -c 'marvin-pastille'
```

Attendu : au moins `1`. C'est la preuve que `client:idle` rend bien la
pastille côté serveur — critère §12.5, aucun décalage de mise en page.

- [ ] **Étape 3 : Parcours manuel dans le navigateur**

Lancer `astro dev --background`, puis vérifier une à une :

| Critère | Vérification |
|---|---|
| §12.1 | Sur `/`, au repos : rien d'autre qu'une pastille de 48 px en bas à droite. Aucun bloc noir dans le flux. |
| §12.2 | Attendre 6 s : une bulle paraît. Attendre 12 s : elle se replie. Recharger : pas de seconde bulle sur cette page. Aller sur `/projets` : nouvelle bulle, réplique différente. |
| §12.2 | Cliquer la croix d'une bulle, puis recharger : plus aucune bulle. Vérifier `localStorage.getItem('marvin.peek.optout')` en console, puis vider cette clé pour la suite. |
| §12.3 | Ouvrir le panneau sur `/`, envoyer un message, naviguer vers `/projets`, rouvrir : la conversation est intacte. |
| §12.4 | Au clavier seul : Tab jusqu'à la pastille, Entrée pour ouvrir, le focus arrive dans le champ, taper puis Entrée pour envoyer, Échap pour fermer, le focus revient sur la pastille. |
| §12.6 | Activer « Réduire les animations » dans les réglages système : aucune bulle même après 30 s, pas d'animation d'ouverture, le texte des réponses apparaît d'un bloc. |
| §12.7 | Émuler un iPhone dans les outils de développement : le panneau devient une feuille pleine largeur ; au focus dans le champ avec clavier logiciel émulé, la saisie reste visible. |
| Erreur | Passer hors ligne dans l'onglet Réseau, envoyer un message : « connexion perdue » apparaît, l'historique est conservé, « Réessayer » relance sans dupliquer le message. |
| `/contact` | Aucune bulle, même après 30 s. Le dock reste ouvrable. |
| `/wargames` | Aucun dock — la page est hors layout, c'est attendu. |

- [ ] **Étape 4 : Vérifier les événements analytics**

Dans la console du navigateur, avant d'interagir :

```js
addEventListener('marvin:analytics', (e) => console.log(e.detail));
```

Attendu, au fil du parcours : `marvin_peek_shown`, `marvin_peek_dismissed`,
`marvin_open`, `marvin_message_sent`, chacun avec son détail.

- [ ] **Étape 5 : Arrêter le serveur et rendre compte**

```bash
astro dev stop
```

Rendre compte critère par critère. Tout écart constaté est signalé, jamais
passé sous silence.

- [ ] **Étape 6 : Commit du correctif éventuel**

S'il a fallu corriger quelque chose :

```bash
git add -A
git commit -m "fix: <ce qui a ete corrige lors de la verification>"
```

---

## Notes pour l'exécutant

**Pourquoi `client:idle` change la façon d'écrire.** Le composant est rendu
une fois côté serveur, où `window`, `sessionStorage` et `matchMedia`
n'existent pas. Toute lecture d'état persisté doit donc vivre dans un
`useEffect`, et le premier rendu client doit être identique au rendu
serveur — sinon React signale une divergence d'hydratation. C'est la
raison d'être du drapeau `premierPassage` de la tâche 6 et du `chemin`
initialisé à chaîne vide dans la tâche 11.

**Le fil se restaure, la bulle non.** `marvin.thread` traverse les pages
via `sessionStorage`, mais `usePeek` réévalue ses conditions à chaque
chargement : c'est voulu. Une page nouvelle mérite sa réplique, dans la
limite du plafond de trois.

**Deux comportements hérités à ne pas perdre.** Le marqueur `[LANCER_JEU]`
qui redirige vers `/wargames`, et le message de session longue tous les
quinze envois. Ils vivaient dans `ChatBot.tsx` et n'apparaissent nulle part
dans le brief ; la tâche 6 les reprend et les teste.
