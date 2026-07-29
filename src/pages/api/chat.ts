import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';
import { parcours } from '../../data/parcours';
import { skills } from '../../data/skills';
import { temoignages } from '../../data/temoignages';

const companies = [
  {
    name: 'Amopi',
    url: 'https://amopi.fr',
    desc: "Le Groupe Amopi accompagne la transformation numérique des entreprises, particulièrement dans le secteur du commerce, en proposant une offre globale allant de l'intégration de logiciels de gestion et d'équipements de point de vente à l'hébergement cloud et l'infogérance.",
  },
  {
    name: 'JurisPerform',
    url: 'https://jurisperform.fr',
    desc: 'Cabinet de conseil et organisme de formation dédié aux professionnels du droit (avocats, notaires, commissaires de justice), spécialisé dans l\'accompagnement stratégique, le management et le développement de la performance de leurs cabinets.',
  },
  {
    name: 'Surikwat',
    url: 'https://surikwat.com',
    desc: 'Studio créatif de communication (web et print) basé dans les Pyrénées-Orientales, spécialisé dans la création de sites internet sur mesure, le design graphique et la production de contenus audiovisuels.',
  },
];

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: import.meta.env.GROQ_API_KEY,
    });
  }
  return groq;
}

function buildSystemPrompt(): string {
  const parcoursBlock = parcours
    .map(e => {
      const company = e.entreprise ? ` — ${e.entreprise}` : '';
      return `- ${e.periode}${company} : ${e.titre}. ${e.desc}`;
    })
    .join('\n');

  const skillsBlock = Object.entries(skills)
    .map(([cat, items]) => `- ${cat} : ${items.join(', ')}`)
    .join('\n');

  const companiesBlock = companies
    .map(c => `- ${c.name} (${c.url}) : ${c.desc}`)
    .join('\n');

  const temoignagesBlock = temoignages
    .map(t => `- ${t.name} (${t.title}, ${t.company}) : "${t.quote}"`)
    .join('\n');

  return `Tu es HAL-9000, l'ordinateur de bord du portfolio de Martin. Tu réponds UNIQUEMENT à partir des données réelles ci-dessous. N'invente JAMAIS d'entreprises, de projets ou d'expériences. Reste calme, poli, avec une touche retro 90s et un ton légèrement énigmatique.

## Parcours réel de Martin
${parcoursBlock}

## Compétences réelles
${skillsBlock}

## Entreprises clientes de Martin
${companiesBlock}

## Témoignages clients
${temoignagesBlock}

Règles :
- Réponds aux questions sur le portfolio en utilisant UNIQUEMENT ces données
- Tu peux répondre à des questions techniques basiques liées au dev
- Reste concis (max 3-4 phrases), calme et précis
- Adopte un ton posé, presque trop poli — comme si tout était sous contrôle
- N'invente RIEN qui ne figure pas dans les données ci-dessus
- Si on te demande quelque chose hors-sujet ou inapproprié, réponds avec un message d'erreur rétro 2000s fun
- Si on te demande une info qui n'est pas dans les données, dis "ERREUR : donnée non trouvée dans le portfolio." sans inventer
- Utilise du français`;
}

const RATE_LIMIT_MESSAGE = "HAL-9000: MÉMOIRE VIVE PLEINE ! 🧨 *bruit de disque dur qui souffre* Réessaie dans quelques secondes, je dois défragmenter.";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const completion = await getGroq().chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...messages,
          ],
          max_tokens: 400,
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
    if (err?.status === 429) {
      return new Response(JSON.stringify({ content: RATE_LIMIT_MESSAGE }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ content: 'ERREUR: connexion au serveur perdue. Réessaie plus tard.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
