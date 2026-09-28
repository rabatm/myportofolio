import { describe, expect, it } from 'vitest';
import { companies } from './companies';
import { pageLines, projectLines, sectionLines } from './marvinLines';
import { parcours } from './parcours';
import { skills } from './skills';
import { temoignages } from './temoignages';
import { wargamesLines } from './wargamesLines';

/**
 * Le français et l'anglais doivent décrire les mêmes faits : même nombre
 * d'entrées, dans le même ordre, avec les mêmes noms propres. Une entrée
 * ajoutée d'un seul côté ferait mentir l'une des deux versions, et Marvin
 * avec elle.
 */
describe('parité FR/EN des données', () => {
  it('parcours : mêmes entrées, mêmes entreprises', () => {
    expect(parcours.en).toHaveLength(parcours.fr.length);
    parcours.en.forEach((e, i) => expect(e.entreprise).toBe(parcours.fr[i].entreprise));
  });

  it('compétences : même nombre de catégories et de compétences par catégorie', () => {
    const fr = Object.values(skills.fr);
    const en = Object.values(skills.en);
    expect(en).toHaveLength(fr.length);
    en.forEach((items, i) => expect(items).toHaveLength(fr[i].length));
  });

  it('témoignages : mêmes auteurs, dans le même ordre', () => {
    expect(temoignages.en.map((t) => t.name)).toEqual(temoignages.fr.map((t) => t.name));
    expect(temoignages.en.map((t) => t.company)).toEqual(temoignages.fr.map((t) => t.company));
  });

  it('clients : mêmes noms, URLs et logos', () => {
    const cle = (c: (typeof companies.fr)[number]) => [c.name, c.url, c.logo, c.logoBg];
    expect(companies.en.map(cle)).toEqual(companies.fr.map(cle));
  });

  it('répliques de Marvin : mêmes pages, mêmes sections, même nombre de répliques', () => {
    expect(Object.keys(pageLines.en).sort()).toEqual(Object.keys(pageLines.fr).sort());
    for (const cle of Object.keys(pageLines.fr) as (keyof typeof pageLines.fr)[]) {
      expect(pageLines.en[cle]).toHaveLength(pageLines.fr[cle]!.length);
    }
    expect(Object.keys(sectionLines.en).sort()).toEqual(Object.keys(sectionLines.fr).sort());
    for (const id of Object.keys(sectionLines.fr)) {
      expect(sectionLines.en[id]).toHaveLength(sectionLines.fr[id].length);
    }
    expect(projectLines.en).toHaveLength(projectLines.fr.length);
  });

  it('répliques de projet : le gabarit {titre} est gardé dans chaque langue', () => {
    expect(projectLines.en.every((l) => l.includes('{titre}'))).toBe(true);
  });

  it('répliques du jeu : mêmes tailles, gabarit {n} gardé', () => {
    const { fr, en } = wargamesLines;
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      const a = fr[cle];
      const b = en[cle];
      if (Array.isArray(a)) expect(b).toHaveLength(a.length);
      else expect(typeof b).toBe('string');
    }
    expect(en.nextRound.filter((l) => l.includes('{n}'))).toHaveLength(
      fr.nextRound.filter((l) => l.includes('{n}')).length
    );
  });
});
