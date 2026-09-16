/**
 * Règles de la bulle d'amorce de MARVIN-42.
 *
 * La partie décisionnelle est une fonction pure (choosePeekLine) : les
 * huit conditions se testent sans DOM ni minuterie. Le hook de la tâche 4
 * ne fait plus qu'ajouter le rythme — 6 s puis 12 s — par-dessus.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from './track';

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

/**
 * Garde-fous des bulles de section.
 *
 * Volontairement PAS `state.off`. Ouvrir le panneau pose `off: true` pour
 * toute la session, ce qui conviendait quand la bulle n'était qu'une
 * invitation à discuter : qui discute déjà n'a pas besoin d'être sollicité.
 * Mais la bulle porte désormais la personnalité de Marvin, et le premier
 * réflexe d'un visiteur curieux est de cliquer la pastille — ce qui le
 * privait du commentaire pour tout le reste de la visite, rechargements
 * compris, `sessionStorage` y survivant.
 *
 * On ne suspend donc que pendant que le panneau est réellement ouvert : une
 * bulle derrière un panneau ouvert serait invisible et consommerait sa
 * réplique pour rien. Refermé, Marvin reprend la parole.
 *
 * La croix de la bulle, elle, garde tout son pouvoir : elle pose l'opt-out de
 * 30 jours, et c'est la porte de sortie de qui n'en veut pas.
 */
export function sectionPeekAllowed(input: {
  reducedMotion: boolean;
  optedOut: boolean;
  panelOpen: boolean;
}): boolean {
  return !input.reducedMotion && !input.optedOut && !input.panelOpen;
}

export interface UsePeekResult {
  peek: string | null;
  /** Croix de la bulle : coupe la session et pose l'opt-out de 30 jours. */
  dismissPeek: () => void;
  /** Ouverture du panneau : coupe la session seule. */
  suppressPeek: () => void;
}

export function usePeek(
  path: string,
  lines: string[],
  sectionLines?: Record<string, string[]>,
  panneauOuvert = false
): UsePeekResult {
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

  // Répliques de section : Marvin commente ce que le visiteur regarde.
  // Aucune bride de fréquence ici — chaque section parle une fois par
  // chargement, et la dernière entrée à l'écran remplace ce qui est affiché.
  // La croix de la bulle reste la seule porte de sortie, d'où le garde-fou
  // sur l'opt-out.
  const sectionsRef = useRef(sectionLines);
  sectionsRef.current = sectionLines;
  const cleSections = JSON.stringify(sectionLines ?? null);
  const sectionsVues = useRef(new Set<string>());

  // Lu dans le rappel de l'observateur, qui capture l'état du rendu où il a
  // été créé : sans la ref il verrait éternellement la valeur initiale.
  const panneauRef = useRef(panneauOuvert);
  panneauRef.current = panneauOuvert;

  useEffect(() => {
    const sections = sectionsRef.current;
    if (!path || !sections) return;
    // jsdom et le rendu serveur n'ont pas d'IntersectionObserver.
    if (typeof IntersectionObserver === 'undefined') return;

    const reducedMotion = prefersReducedMotion();

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;

          const id = entree.target.id;
          if (sectionsVues.current.has(id)) continue;

          const state = readPeekState();
          if (
            !sectionPeekAllowed({
              reducedMotion,
              optedOut: isOptedOut(),
              panelOpen: panneauRef.current,
            })
          ) {
            return;
          }

          // On ne répète jamais une réplique déjà montrée dans la session,
          // que ce soit par l'arrivée sur une page ou par une autre section.
          const jamaisVues = (sections[id] ?? []).filter((l) => !state.lines.includes(l));
          if (jamaisVues.length === 0) continue;

          const ligne = jamaisVues[Math.floor(Math.random() * jamaisVues.length)];
          sectionsVues.current.add(id);
          writePeekState({ ...state, lines: [...state.lines, ligne] });

          // La nouvelle remplace l'ancienne : commenter ce qu'on ne regarde
          // plus n'aurait pas de sens.
          if (minuterieRepli.current) clearTimeout(minuterieRepli.current);
          setPeek(ligne);
          track('marvin_peek_shown', { line: ligne, path, section: id });
          minuterieRepli.current = setTimeout(() => setPeek(null), PEEK_DURATION_MS);
        }
      },
      // Pas de seuil de proportion : `Parcours` fait quatre hauteurs d'écran,
      // donc 40 % de lui-même ne sont jamais visibles d'un coup et il ne
      // déclenchait jamais. On observe plutôt le passage par une bande
      // centrale de 10 % de l'écran : « la section que le visiteur regarde »,
      // quelle que soit sa hauteur.
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
    );

    for (const id of Object.keys(sections)) {
      const el = document.getElementById(id);
      if (el) observateur.observe(el);
    }

    return () => observateur.disconnect();
  }, [path, cleSections]);

  useEffect(() => {
    // Le chemin n'est connu qu'après hydratation : `MarvinDock` l'initialise
    // à '' puis le renseigne dans un effet de montage. Sans ce garde-fou, ce
    // premier passage armerait une minuterie de 6 s pour rien, aussitôt
    // nettoyée par le rendu suivant.
    if (!path) return;

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
