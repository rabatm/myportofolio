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
