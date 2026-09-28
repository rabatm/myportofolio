import { describe, expect, it } from 'vitest';
import {
  alternatePath,
  buildPath,
  fmt,
  formatDate,
  isLang,
  localizePath,
  normalizePath,
  otherLang,
  parseLang,
  parsePath,
  pathLang,
  routeIdFromPath,
  switchHref,
} from './utils';

describe('langues', () => {
  it('reconnaît les langues gérées', () => {
    expect(isLang('fr')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it('retombe sur le français pour toute valeur inconnue', () => {
    expect(parseLang('en')).toBe('en');
    expect(parseLang('fr')).toBe('fr');
    expect(parseLang(undefined)).toBe('fr');
    expect(parseLang('EN')).toBe('fr');
    expect(parseLang(42)).toBe('fr');
  });

  it("donne l'autre langue", () => {
    expect(otherLang('fr')).toBe('en');
    expect(otherLang('en')).toBe('fr');
  });
});

describe('normalizePath', () => {
  it('retire le slash final sauf pour la racine', () => {
    expect(normalizePath('/projets/')).toBe('/projets');
    expect(normalizePath('/en/')).toBe('/en');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('/');
  });
});

describe('pathLang', () => {
  it("déduit la langue du préfixe d'URL", () => {
    expect(pathLang('/en')).toBe('en');
    expect(pathLang('/en/')).toBe('en');
    expect(pathLang('/en/projects/amiqo')).toBe('en');
    expect(pathLang('/')).toBe('fr');
    expect(pathLang('/projets')).toBe('fr');
  });

  it("ne confond pas un chemin qui commence par « en » avec le préfixe", () => {
    expect(pathLang('/enquete')).toBe('fr');
  });
});

describe('parsePath', () => {
  it('reconnaît les pages de liste et de détail', () => {
    expect(parsePath('/projets/amiqo')).toEqual({ route: 'projects', lang: 'fr', slug: 'amiqo' });
    expect(parsePath('/en/blog/premier-article/')).toEqual({
      route: 'blog',
      lang: 'en',
      slug: 'premier-article',
    });
    expect(parsePath('/en/contact')).toEqual({ route: 'contact', lang: 'en' });
    expect(parsePath('/en')).toEqual({ route: 'home', lang: 'en' });
  });

  it("garde l'ancre", () => {
    expect(parsePath('/#parcours')).toEqual({ route: 'home', lang: 'fr', hash: '#parcours' });
  });

  it('refuse les chemins inconnus ou trop profonds', () => {
    expect(parsePath('/inconnu')).toBeNull();
    expect(parsePath('/projets/a/b')).toBeNull();
    expect(parsePath('/contact/x')).toBeNull();
  });
});

describe('buildPath', () => {
  it('construit les chemins des deux langues', () => {
    expect(buildPath('home', 'fr')).toBe('/');
    expect(buildPath('home', 'en')).toBe('/en/');
    expect(buildPath('projects', 'en', 'amiqo')).toBe('/en/projects/amiqo');
    expect(buildPath('projects', 'fr', 'amiqo')).toBe('/projets/amiqo');
    expect(buildPath('home', 'en', undefined, '#parcours')).toBe('/en/#parcours');
    expect(buildPath('home', 'fr', undefined, '#parcours')).toBe('/#parcours');
  });
});

describe('localizePath / alternatePath', () => {
  it('traduit un chemin vers la langue demandée', () => {
    expect(localizePath('/projets/amiqo', 'en')).toBe('/en/projects/amiqo');
    expect(localizePath('/en/projects', 'fr')).toBe('/projets');
    expect(localizePath('/wargames', 'en')).toBe('/en/wargames');
    expect(localizePath('/projets', 'fr')).toBe('/projets');
  });

  it('laisse intact un chemin inconnu', () => {
    expect(localizePath('/inconnu', 'en')).toBe('/inconnu');
  });

  it("donne l'équivalent dans l'autre langue, avec ou sans slash final", () => {
    expect(alternatePath('/')).toBe('/en/');
    expect(alternatePath('/en')).toBe('/');
    expect(alternatePath('/en/')).toBe('/');
    expect(alternatePath('/projets/')).toBe('/en/projects');
    expect(alternatePath('/blog/premier-article')).toBe('/en/blog/premier-article');
    expect(alternatePath('/en/contact')).toBe('/contact');
  });
});

describe('routeIdFromPath', () => {
  it('identifie la route quelle que soit la langue', () => {
    expect(routeIdFromPath('/contact')).toBe('contact');
    expect(routeIdFromPath('/en/contact/')).toBe('contact');
    expect(routeIdFromPath('/en/projects/amiqo')).toBe('projects');
    expect(routeIdFromPath('/inconnu')).toBeNull();
  });
});

describe('switchHref', () => {
  it("ajoute l'ancre courante au lien du switch", () => {
    expect(switchHref('/en/', '#parcours')).toBe('/en/#parcours');
  });

  it("ne touche à rien sans ancre, ou si le lien en porte déjà une", () => {
    expect(switchHref('/en/', '')).toBe('/en/');
    expect(switchHref('/en/#confiance', '#parcours')).toBe('/en/#confiance');
  });
});

describe('fmt', () => {
  it('remplace les variables entre accolades', () => {
    expect(fmt('ROUND {n}. {who}', { n: 2, who: 'MARVIN' })).toBe('ROUND 2. MARVIN');
  });

  it('laisse en place une variable non fournie', () => {
    expect(fmt('ROUND {n}', {})).toBe('ROUND {n}');
  });
});

describe('formatDate', () => {
  const date = new Date('2026-09-28T12:00:00Z');

  it('garde le format numérique actuel en français', () => {
    expect(formatDate(date, 'fr')).toBe('28/09/2026');
  });

  it('écrit le mois en toutes lettres en anglais, pour lever toute ambiguïté', () => {
    expect(formatDate(date, 'en')).toBe('September 28, 2026');
  });
});
