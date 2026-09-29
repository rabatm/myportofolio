// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// ⚠️ À REMPLACER par le domaine réel une fois le site déployé.
// Utilisé pour les URLs absolues (Open Graph, canonical, sitemap).
const SITE_URL = 'https://martininfo.fr';

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
      filter: (page) => !page.includes('/api/'),
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