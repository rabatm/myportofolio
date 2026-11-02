// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { localizePath, pathLang } from './src/i18n/utils';

// ⚠️ À REMPLACER par le domaine réel une fois le site déployé.
// Utilisé pour les URLs absolues (Open Graph, canonical, sitemap).
const SITE_URL = 'https://martininfo.fr';

// Le sitemap liste les pages telles qu'Astro les génère (`/contact/`), alors
// que le canonical des pages est construit sans slash final (`/contact`) :
// Google classait alors chaque URL du sitemap en « Autre page avec balise
// canonique correcte ». On repasse chaque URL par `localizePath`, le même
// helper que `seoLinks`, pour que sitemap, hreflang et canonical coïncident.
/** @param {string} url */
const canonicalize = (url) => {
  const { pathname } = new URL(url);
  return new URL(localizePath(pathname, pathLang(pathname)), SITE_URL).toString();
};

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Images en largeur contrainte par défaut : srcset généré automatiquement,
  // y compris pour les images des .md (captures des pages projet).
  image: { layout: 'constrained' },
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-US',
        },
      },
      filter: (page) => !page.includes('/api/') && !page.includes('/wargames'),
      serialize: (item) => ({
        ...item,
        url: canonicalize(item.url),
        links: item.links?.map((l) => ({ ...l, url: canonicalize(l.url) })),
      }),
    }),
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});