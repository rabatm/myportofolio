import { ROUTES, SLUG_ROUTES, type RouteId } from './routes';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

/** Clé localStorage du choix explicite de langue (switch ou bandeau). */
export const LANG_CHOICE_KEY = 'lang-choice';

export const OG_LOCALE: Record<Lang, string> = { fr: 'fr_FR', en: 'en_US' };

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

/** Toute valeur inconnue retombe sur le français : c'est la langue historique du site. */
export function parseLang(v: unknown): Lang {
  return isLang(v) ? v : DEFAULT_LANG;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

/** Retire le slash final (sauf racine) : Astro sert `/en` comme `/en/`. */
export function normalizePath(p: string): string {
  if (!p || p === '/') return '/';
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function pathLang(pathname: string): Lang {
  const p = normalizePath(pathname);
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'fr';
}

export interface ParsedPath {
  route: RouteId;
  lang: Lang;
  slug?: string;
  hash?: string;
}

export function parsePath(path: string): ParsedPath | null {
  const indexAncre = path.indexOf('#');
  const hash = indexAncre >= 0 ? path.slice(indexAncre) : undefined;
  const nu = normalizePath(indexAncre >= 0 ? path.slice(0, indexAncre) : path);

  for (const lang of LANGS) {
    for (const route of Object.keys(ROUTES) as RouteId[]) {
      const base = normalizePath(ROUTES[route][lang]);
      if (nu === base) return hash ? { route, lang, hash } : { route, lang };

      if (SLUG_ROUTES.includes(route) && nu.startsWith(`${base}/`)) {
        const slug = nu.slice(base.length + 1);
        if (slug && !slug.includes('/')) {
          return hash ? { route, lang, slug, hash } : { route, lang, slug };
        }
      }
    }
  }
  return null;
}

export function buildPath(route: RouteId, lang: Lang, slug?: string, hash = ''): string {
  const base = ROUTES[route][lang];
  const chemin = slug ? `${normalizePath(base)}/${slug}` : base;
  return chemin + hash;
}

/** Chemin équivalent dans `lang`. Un chemin inconnu est rendu tel quel. */
export function localizePath(path: string, lang: Lang): string {
  const lu = parsePath(path);
  return lu ? buildPath(lu.route, lang, lu.slug, lu.hash ?? '') : path;
}

export function alternatePath(pathname: string): string {
  return localizePath(pathname, otherLang(pathLang(pathname)));
}

export function routeIdFromPath(pathname: string): RouteId | null {
  return parsePath(pathname)?.route ?? null;
}

export interface SeoLinks {
  canonical: string;
  alternates: { hreflang: string; href: string }[];
}

/**
 * URLs absolues de référencement (canonical, hreflang, et par extension
 * og:url) construites avec le même helper `localizePath`, pour que le
 * canonical soit toujours égal au hreflang « self » — Google attend les deux
 * identiques, slash final compris.
 *
 * En repli de contenu (`contentLang` renseigné et différent de `lang`), la
 * page sert du contenu dans une autre langue que la sienne : le canonical
 * pointe alors vers l'URL de la langue du contenu, et aucune alternance
 * hreflang n'est émise — annoncer une version dans l'autre langue serait
 * mensonger tant qu'elle n'existe pas vraiment.
 */
export function seoLinks(
  pathname: string,
  lang: Lang,
  site: URL | string,
  contentLang?: Lang
): SeoLinks {
  if (contentLang && contentLang !== lang) {
    return {
      canonical: new URL(localizePath(pathname, contentLang), site).toString(),
      alternates: [],
    };
  }

  const canonical = new URL(localizePath(pathname, lang), site).toString();
  const alternates = LANGS.map((l) => ({
    hreflang: l as string,
    href: new URL(localizePath(pathname, l), site).toString(),
  }));
  alternates.push({
    hreflang: 'x-default',
    href: new URL(localizePath(pathname, DEFAULT_LANG), site).toString(),
  });

  return { canonical, alternates };
}

/**
 * `Astro.url.pathname` ne contient jamais le fragment : c'est au clic, côté
 * client, qu'on recolle l'ancre courante pour rester sur la même section.
 */
export function switchHref(href: string, hash: string): string {
  if (!hash || href.includes('#')) return href;
  return href + hash;
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (brut, cle: string) =>
    cle in vars ? String(vars[cle]) : brut
  );
}

/** FR : format numérique historique. EN : mois en lettres, lisible des deux côtés de l'Atlantique. */
export function formatDate(date: Date, lang: Lang): string {
  return lang === 'fr'
    ? date.toLocaleDateString('fr-FR')
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
