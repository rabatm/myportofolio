import { describe, expect, it } from 'vitest';
import { ui } from '../i18n/ui';
import { LANGS } from '../i18n/utils';
import { findForbidden } from '../lib/copyRules';
import { approche, tempsForts } from './about';
import { companies } from './companies';
import { pageLines, projectLines, sectionLines } from './marvinLines';
import { parcours } from './parcours';
import { SERVICE_IDS, methode, services } from './services';
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

  it('clients : chaque langue a une accroche et une description non vides, en nombre égal', () => {
    expect(companies.en).toHaveLength(companies.fr.length);
    expect(companies.fr.every((c) => c.tagline && c.desc)).toBe(true);
    expect(companies.en.every((c) => c.tagline && c.desc)).toBe(true);
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

  it('services : mêmes ids dans le même ordre, mêmes nombres d’exemples', () => {
    expect(services.fr.map((s) => s.id)).toEqual([...SERVICE_IDS]);
    expect(services.en.map((s) => s.id)).toEqual([...SERVICE_IDS]);
    services.en.forEach((s, i) => expect(s.builds).toHaveLength(services.fr[i].builds.length));
    expect(services.en.map((s) => !!s.proofNote)).toEqual(services.fr.map((s) => !!s.proofNote));
  });

  it('méthode : 4 étapes dans chaque langue', () => {
    expect(methode.fr).toHaveLength(4);
    expect(methode.en).toHaveLength(4);
  });

  it('services : CTA tous différents, aucun texte interdit', () => {
    for (const lang of LANGS) {
      const ctas = services[lang].map((s) => s.cta);
      expect(new Set(ctas).size).toBe(ctas.length);
      const tout = JSON.stringify([services[lang], methode[lang]]);
      expect(findForbidden(tout)).toEqual([]);
    }
  });

  it('à propos : 3 temps forts et autant de points d’approche dans chaque langue, aucun texte interdit', () => {
    expect(tempsForts.fr).toHaveLength(3);
    expect(tempsForts.en).toHaveLength(3);
    expect(approche.fr.length).toBeGreaterThan(0);
    expect(approche.en).toHaveLength(approche.fr.length);
    for (const lang of LANGS) {
      expect(findForbidden(JSON.stringify([approche[lang], tempsForts[lang]]))).toEqual([]);
    }
  });

  it('chaînes d’interface : aucun texte interdit', () => {
    expect(findForbidden(JSON.stringify(ui.fr))).toEqual([]);
    expect(findForbidden(JSON.stringify(ui.en))).toEqual([]);
  });
});
