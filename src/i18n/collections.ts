import { getCollection, type CollectionEntry } from 'astro:content';
import { localizeEntries, type Localized } from './content';
import type { Lang } from './utils';

type Nom = 'projects' | 'blog';

export type LocalizedProject = Localized<CollectionEntry<'projects'>>;
export type LocalizedPost = Localized<CollectionEntry<'blog'>>;

/** Collection vue depuis une langue, du plus récent au plus ancien. */
export async function getLocalizedCollection<C extends Nom>(
  name: C,
  lang: Lang
): Promise<Localized<CollectionEntry<C>>[]> {
  const entrees = (await getCollection(name)) as CollectionEntry<C>[];
  return localizeEntries(entrees, lang).sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime()
  );
}

/** `getStaticPaths` commun aux pages de détail des deux langues. */
export async function localizedStaticPaths(name: Nom, lang: Lang) {
  const items = await getLocalizedCollection(name, lang);
  return items.map((item) => ({ params: { slug: item.slug }, props: { item } }));
}
