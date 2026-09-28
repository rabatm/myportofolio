import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';
import { companies } from '../../data/companies';
import { parcours } from '../../data/parcours';
import { skills } from '../../data/skills';
import { temoignages } from '../../data/temoignages';
import { getLocalizedCollection } from '../../i18n/collections';
import { t } from '../../i18n/ui';
import { parseLang, type Lang } from '../../i18n/utils';
import { buildSystemPrompt } from '../../lib/chatPrompt';

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: import.meta.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// Le prompt ne dépend que de la langue : on le construit une fois par langue.
const promptCache = new Map<Lang, string>();

async function systemPrompt(lang: Lang): Promise<string> {
  const enCache = promptCache.get(lang);
  if (enCache) return enCache;

  const projects = await getLocalizedCollection('projects', lang);
  const prompt = buildSystemPrompt(lang, {
    parcours: parcours[lang],
    skills: skills[lang],
    companies: companies[lang],
    temoignages: temoignages[lang],
    projects: projects.map(({ entry }) => ({ title: entry.data.title, tags: entry.data.tags })),
  });
  promptCache.set(lang, prompt);
  return prompt;
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let lang: Lang = 'fr';
  try {
    const body = await request.json();
    lang = parseLang(body.lang);
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const completion = await getGroq().chat.completions.create(
        {
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: await systemPrompt(lang) },
            ...messages,
          ],
          max_tokens: 250,
        },
        { signal: controller.signal }
      );

      const content = completion.choices[0]?.message?.content || '';

      return new Response(JSON.stringify({ content }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    // Le nom est ajouté à l'affichage par le composant : ne pas le répéter ici.
    if (err?.status === 429) {
      return new Response(JSON.stringify({ content: t(lang)['chat.rateLimit'] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({
        content: t(lang)['chat.error'],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
