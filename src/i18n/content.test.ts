import { describe, expect, it } from 'vitest';
import { localizeEntries, splitId } from './content';

const e = (id: string) => ({ id });

describe('splitId', () => {
  it('sépare la langue du slug', () => {
    expect(splitId('fr/amiqo')).toEqual({ lang: 'fr', slug: 'amiqo' });
    expect(splitId('en/amiqo')).toEqual({ lang: 'en', slug: 'amiqo' });
  });

  it("ne reconnaît pas de langue sans préfixe valide", () => {
    expect(splitId('amiqo')).toEqual({ lang: null, slug: 'amiqo' });
    expect(splitId('de/amiqo')).toEqual({ lang: null, slug: 'de/amiqo' });
  });
});

describe('localizeEntries', () => {
  const entrees = [e('fr/amiqo'), e('en/amiqo'), e('fr/seulement-fr'), e('en/only-en')];

  it("sert la version de la langue demandée quand elle existe", () => {
    const en = localizeEntries(entrees, 'en');
    expect(en.find((x) => x.slug === 'amiqo')).toEqual({
      entry: e('en/amiqo'),
      slug: 'amiqo',
      contentLang: 'en',
      isFallback: false,
    });
  });

  it("retombe sur l'autre langue, en le signalant", () => {
    const en = localizeEntries(entrees, 'en');
    expect(en.find((x) => x.slug === 'seulement-fr')).toEqual({
      entry: e('fr/seulement-fr'),
      slug: 'seulement-fr',
      contentLang: 'fr',
      isFallback: true,
    });
  });

  it('le repli marche dans les deux sens', () => {
    const fr = localizeEntries(entrees, 'fr');
    expect(fr.find((x) => x.slug === 'only-en')?.isFallback).toBe(true);
  });

  it('ne sert chaque slug qu\'une fois', () => {
    expect(localizeEntries(entrees, 'fr').map((x) => x.slug).sort()).toEqual([
      'amiqo',
      'only-en',
      'seulement-fr',
    ]);
  });

  it('ignore les fichiers rangés hors des dossiers fr/ et en/', () => {
    expect(localizeEntries([e('perdu')], 'fr')).toEqual([]);
  });
});
