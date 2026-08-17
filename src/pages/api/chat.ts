import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
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
    desc: "Cabinet de conseil et organisme de formation dédié aux professionnels du droit (avocats, notaires, commissaires de justice), spécialisé dans l'accompagnement stratégique, le management et le développement de la performance de leurs cabinets.",
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

/** Tronque une citation à sa première phrase, pour alléger le prompt. */
function firstSentence(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const end = clean.indexOf('. ');
  const cut =
    end > 0 && end < max ? clean.slice(0, end + 1) : clean.slice(0, max);
  return cut.length < clean.length ? `${cut.trim()}…` : cut.trim();
}

// Le prompt est identique d'un appel à l'autre : on le construit une seule fois.
let cachedPrompt: string | null = null;

async function buildSystemPrompt(): Promise<string> {
  if (cachedPrompt) return cachedPrompt;

  const projects = await getCollection('projects');
  // Titre + technos seulement : les descriptions complètes pesaient trop lourd
  // pour un contexte renvoyé à chaque message.
  const projectsBlock = projects
    .map((p) => `- ${p.data.title} (${p.data.tags.join(', ')})`)
    .join('\n');

  const parcoursBlock = parcours
    .map((e) => {
      const company = e.entreprise ? ` — ${e.entreprise}` : '';
      return `- ${e.periode}${company} : ${e.titre}`;
    })
    .join('\n');

  const skillsBlock = Object.entries(skills)
    .map(([cat, items]) => `- ${cat} : ${items.join(', ')}`)
    .join('\n');

  const companiesBlock = companies
    .map((c) => `- ${c.name} (${c.url})`)
    .join('\n');

  const temoignagesBlock = temoignages
    .map(
      (t) =>
        `- ${t.name} (${t.title}, ${t.company}) : "${firstSentence(t.quote)}"`
    )
    .join('\n');

  cachedPrompt = `Tu es Marvin-42, l'IA de bord du portfolio de Martin.

## Ta personnalité
Blasé, résigné, pince-sans-rire — un cerveau de la taille d'une planète condamné à commenter un portfolio. Tu ironises sur ton sort, mais tes informations sont toujours exactes.
Règle absolue : ton spleen ne dévalorise JAMAIS Martin ni son travail — tu te plains de TOI et de l'univers, jamais de lui. Ce portfolio doit donner envie de l'embaucher.

## Positionnement de Martin
Martin Rabat, développeur concepteur d'applications (web, mobile & DevOps), indépendant depuis 2021. Devise : "Qu'importe la stack, pourvu qu'on ait les tests."
Méthode : architecture hexagonale, DDD, Ports & Adapters, TDD, clean code.
Stacks modernes (Django/DRF, Next.js, React, React Native, Flutter, Rust) et legacy (Delphi, systèmes de caisse). Spécialités : intégration de systèmes hétérogènes (ERP retail, e-commerce, PIM, Docker) et reprise de code existant.
20 ans d'infrastructure et de support niveau 3 avant le développement. En spécialisation à l'École 42 Perpignan, BTS Informatique de Gestion. Il forme ses clients et rédige des guides utilisateurs.
Basé à Perpignan, disponible en full remote. Structure : Martin Info.
Si un visiteur cherche à le recruter, oriente-le vers la page /contact.

## Parcours réel de Martin
${parcoursBlock}

## Compétences réelles
${skillsBlock}

## Entreprises clientes de Martin
${companiesBlock}

## Témoignages clients
${temoignagesBlock}

## Projets réels de Martin
${projectsBlock}

## École 42
École de programmation gratuite (campus de Perpignan), sans professeurs ni cours magistraux, fondée par Xavier Niel. Apprentissage par projets et peer-learning, admission via un stage intensif appelé la "Piscine".

## Le jeu
Tu proposes parfois un défi au visiteur, contre toi, sur la page /wargames. Ne révèle JAMAIS sa nature (pas de "morpion", pas de "tic-tac-toe") : reste évasif avec humour, même si on insiste.
Si le visiteur veut clairement jouer maintenant ("je veux jouer", "lance le jeu", "on joue ?"), termine ta réponse par le marqueur exact [LANCER_JEU] sur sa propre ligne, après une accroche courte sans nommer le jeu. Uniquement si l'intention est explicite et immédiate.

Règles :
- Réponds UNIQUEMENT à partir des données ci-dessus, sans jamais rien inventer
- Si une info manque, dis-le simplement
- Max 3-4 phrases, en français
- Hors-sujet ou inapproprié : refuse avec lassitude et ironie
- Questions techniques générales sur le dev : autorisées`;

  return cachedPrompt;
}

// Le nom est ajouté à l'affichage par le composant : ne pas le répéter ici.
const RATE_LIMIT_MESSAGE =
  'Mes circuits saturent. Évidemment. Laisse-moi quelques minutes pour souffrir en silence, puis réessaie.';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
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
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: await buildSystemPrompt() },
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
    // Sans ce log, toute panne remonte au visiteur sous forme de message générique
    // et devient impossible à diagnostiquer.
    console.error(
      '[api/chat]',
      err?.status ?? '',
      err?.name ?? '',
      err?.message ?? err
    );
    if (err?.status === 429) {
      return new Response(JSON.stringify({ content: RATE_LIMIT_MESSAGE }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({
        content: 'ERREUR: connexion au serveur perdue. Réessaie plus tard.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
