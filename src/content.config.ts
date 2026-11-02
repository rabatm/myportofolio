import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SERVICE_IDS } from './data/services';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  // `image()` : chemin relatif au .md (../images/<slug>/…), vérifié et optimisé
  // au build. Une image introuvable fait échouer le build au lieu de casser en silence.
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
    image: image().optional(),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
    services: z.array(z.enum(SERVICE_IDS)).default([]),
    kind: z.enum(['client', 'atelier']).default('client'),
    // Rang sur l'accueil (1 = premier).
    featured: z.number().int().positive().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
  }),
});

export const collections = {
  projects,
  blog,
};
