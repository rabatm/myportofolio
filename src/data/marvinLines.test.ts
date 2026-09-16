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
