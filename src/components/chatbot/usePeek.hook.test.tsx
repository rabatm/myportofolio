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
