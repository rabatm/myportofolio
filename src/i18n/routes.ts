import type { Lang } from './utils';

export type RouteId = 'home' | 'projects' | 'blog' | 'contact' | 'wargames';

/**
 * Table des routes : une ligne par page, un chemin par langue.
 * Les chemins FR sont ceux d'avant l'i18n et ne doivent jamais changer
 * (liens partagés, référencement).
 */
export const ROUTES: Record<RouteId, Record<Lang, string>> = {
  home: { fr: '/', en: '/en/' },
  projects: { fr: '/projets', en: '/en/projects' },
  blog: { fr: '/blog', en: '/en/blog' },
  contact: { fr: '/contact', en: '/en/contact' },
  wargames: { fr: '/wargames', en: '/en/wargames' },
};

/** Routes qui ont des pages de détail `/<base>/<slug>`. */
export const SLUG_ROUTES: readonly RouteId[] = ['projects', 'blog'];
