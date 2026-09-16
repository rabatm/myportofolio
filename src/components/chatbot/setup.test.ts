import { describe, expect, it } from 'vitest';
import { setReducedMotion } from '../../../vitest.setup';

describe('dispositif de test', () => {
  it('fournit un DOM', () => {
    document.body.innerHTML = '<p id="cible">bonjour</p>';

    expect(document.getElementById('cible')).toHaveTextContent('bonjour');
  });

  // La paire ci-dessous est volontairement séquentielle : elle vérifie
  // l'isolation apportée par le `beforeEach` de vitest.setup.ts, dont
  // dépendent tous les tests des tâches suivantes. Vitest exécute les
  // tests d'un même fichier dans l'ordre de déclaration, donc « 1/2 »
  // salit l'état et « 2/2 » vérifie qu'il a été nettoyé avant de
  // s'exécuter.
  it('isolation 1/2 : salit le sessionStorage pour le test suivant', () => {
    expect(sessionStorage.getItem('marvin.peek')).toBeNull();
    sessionStorage.setItem('marvin.peek', 'sale');
    setReducedMotion(true);
  });

  it('isolation 2/2 : le beforeEach a bien vidé ce que 1/2 a écrit', () => {
    expect(sessionStorage.getItem('marvin.peek')).toBeNull();
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
  });

  it('simule prefers-reduced-motion', () => {
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);

    setReducedMotion(true);

    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  });
});
