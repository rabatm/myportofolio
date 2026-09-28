import { describe, expect, it } from 'vitest';
import { LANGS } from './utils';
import { OPTIONAL_KEYS, t, ui } from './ui';

describe('dictionnaire UI', () => {
  it('a exactement les mêmes clés dans chaque langue', () => {
    const cles = Object.keys(ui.fr).sort();
    for (const lang of LANGS) {
      expect(Object.keys(ui[lang]).sort()).toEqual(cles);
    }
  });

  it("n'a pas de chaîne vide, hors clés explicitement optionnelles", () => {
    for (const lang of LANGS) {
      for (const [cle, valeur] of Object.entries(ui[lang])) {
        if ((OPTIONAL_KEYS as readonly string[]).includes(cle)) continue;
        expect(valeur, `${lang}.${cle}`).not.toBe('');
      }
    }
  });

  it('renvoie le dictionnaire de la langue demandée', () => {
    expect(t('fr')['nav.projects']).toBe('Projets');
    expect(t('en')['nav.projects']).toBe('Projects');
  });
});
