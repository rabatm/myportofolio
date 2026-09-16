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
