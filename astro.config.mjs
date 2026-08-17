// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// ⚠️ À REMPLACER par le domaine réel une fois le site déployé.
// Utilisé pour les URLs absolues (Open Graph, canonical, sitemap).
const SITE_URL = 'https://martininfo.fr';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});