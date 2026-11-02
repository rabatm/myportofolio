import { describe, expect, it } from 'vitest';
import { findForbidden } from './copyRules';

describe('findForbidden', () => {
  it('repère une formule interdite, sans tenir compte de la casse', () => {
    expect(findForbidden('Libérer le potentiel de votre business')).toEqual(['libérer le potentiel']);
  });

  it('repère « ADN » comme mot entier', () => {
    expect(findForbidden("L'innovation au cœur de votre ADN")).toContain('adn');
  });

  it('ne confond pas « adn » avec une sous-chaîne', () => {
    expect(findForbidden('un cadnas')).toEqual([]);
  });

  it('couvre l’anglais', () => {
    expect(findForbidden('Request a quote today')).toEqual(['request a quote']);
  });

  it('laisse passer un texte propre', () => {
    expect(findForbidden('Vos logiciels ne se parlent pas ?')).toEqual([]);
  });
});
