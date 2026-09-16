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

export const EMPTY_PEEK_STATE: PeekState = {
  pages: [],
  lines: [],
  count: 0,
  off: false,
};

export function readPeekState(): PeekState {
  try {
    const brut = sessionStorage.getItem(PEEK_KEY);
    if (!brut) return EMPTY_PEEK_STATE;

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
    return EMPTY_PEEK_STATE;
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
