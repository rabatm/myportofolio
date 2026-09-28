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
