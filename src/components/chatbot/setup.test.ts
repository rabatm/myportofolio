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
