import { describe, expect, it } from 'vitest';
import { LANGS } from '../i18n/utils';
import { findForbidden } from '../lib/copyRules';
import * as marvinLines from './marvinLines';
import { pageLines, projectLines, sectionLines } from './marvinLines';

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

  it('couvre les pages Services et À propos', () => {
    for (const lang of LANGS) {
      expect(pageLines[lang].services!.length).toBeGreaterThanOrEqual(2);
      expect(pageLines[lang].about!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("suit exactement les sections commentées de l'accueil", () => {
    for (const lang of LANGS) {
      expect(Object.keys(sectionLines[lang]).sort()).toEqual([
        'clients',
        'humain',
        'methode',
        'realisations',
        'services',
        'temoignages',
      ]);
    }
  });

  it("n'emploie aucune formule interdite", () => {
    expect(findForbidden(JSON.stringify(marvinLines))).toEqual([]);
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
