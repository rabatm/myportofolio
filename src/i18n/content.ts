import { isLang, otherLang, type Lang } from './utils';

export interface Localized<E> {
  entry: E;
  /** Slug sans préfixe de langue : c'est lui qui fait le lien FR ↔ EN. */
  slug: string;
  /** Langue réelle du contenu, qui diffère de la page en cas de repli. */
  contentLang: Lang;
  isFallback: boolean;
}

/** Les ids du loader glob sont de la forme `fr/amiqo`. */
export function splitId(id: string): { lang: Lang | null; slug: string } {
  const i = id.indexOf('/');
  if (i < 0) return { lang: null, slug: id };

  const tete = id.slice(0, i);
  return isLang(tete) ? { lang: tete, slug: id.slice(i + 1) } : { lang: null, slug: id };
}

/**
 * Une entrée par slug, dans la langue demandée si elle existe, sinon dans
 * l'autre (repli signalé). Ainsi toute page existe dans les deux langues, et
 * le switch n'a jamais à chercher d'équivalent.
 */
export function localizeEntries<E extends { id: string }>(entries: E[], lang: Lang): Localized<E>[] {
  const parSlug = new Map<string, Partial<Record<Lang, E>>>();
  for (const entree of entries) {
    const { lang: l, slug } = splitId(entree.id);
    if (!l) continue;
    parSlug.set(slug, { ...parSlug.get(slug), [l]: entree });
  }

  const resultat: Localized<E>[] = [];
  for (const [slug, versions] of parSlug) {
    const propre = versions[lang];
    if (propre) {
      resultat.push({ entry: propre, slug, contentLang: lang, isFallback: false });
      continue;
    }
    const autre = otherLang(lang);
    const repli = versions[autre];
    if (repli) resultat.push({ entry: repli, slug, contentLang: autre, isFallback: true });
  }
  return resultat;
}
