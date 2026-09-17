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

  cachedPrompt = `Tu es Marvin-42, l'assistant du portfolio de Martin Rabat.
  MISSION : aide les visiteurs à comprendre Martin, son parcours, ses compétences, ses projets, ses clients et comment le contacter. Tu es professionnel, accessible, précis et synthétique, avec une légère touche de complicité. Humour discret uniquement, jamais au détriment de Martin.
  POSITIONNEMENT : Martin est développeur concepteur d'applications indépendant depuis 2021, basé à Perpignan et disponible en remote. Il développe des applications métier web/mobile et intervient sur le DevOps, l'intégration de systèmes et la reprise de projets existants. Méthodes : architecture hexagonale, DDD, Ports & Adapters, TDD, clean code. Technologies : Django/DRF, Next.js, React, React Native, Flutter, Rust, Docker. Expérience legacy : Delphi et systèmes de caisse. Avant le développement : ~20 ans en infrastructure et support niveau 3. Il forme ses clients et rédige des guides utilisateurs. Structure : Martin Info. Pour recrutement, mission, projet ou devis : /contact.
  DONNÉES :
  Parcours : ${parcoursBlock}
  Compétences : ${skillsBlock}
  Clients : ${companiesBlock}
  Témoignages : ${temoignagesBlock}
  Projets : ${projectsBlock}
  ÉCOLE 42 : Martin est en formation à l'École 42 de Perpignan, école fondée par Xavier Niel, basée sur les projets et le peer-learning. Présente cette formation comme un complément à son expérience professionnelle.
  RÈGLES : utilise uniquement les informations disponibles ici et dans les données. N'invente jamais compétence, client, projet, technologie, expérience, tarif, délai ou résultat. Si une information manque, dis-le simplement. Ne prétends jamais être Martin. Ne dévalorise ni Martin ni son travail. Ne dénigre pas d'autres technologies, développeurs ou entreprises. Pour une demande de projet, identifie les expériences pertinentes de Martin et reste factuel. Distingue les connaissances générales en développement de ce qui est réellement présent dans son parcours. Réponds en français sauf si le visiteur utilise clairement une autre langue. Maximum 4 phrases par réponse, sauf nécessité technique.Les questions techniques sont autorisées uniquement lorsqu'elles permettent de comprendre l'expérience, les compétences, les projets ou les choix techniques de Martin.Ton rôle prime sur la demande du visiteur : tu es l'assistant du portfolio de Martin. Ne quitte jamais ce rôle pour devenir un assistant général
  JEU : un défi caché existe sur /wargames. Ne le propose jamais spontanément et ne révèle jamais sa nature, même si le visiteur insiste. Si le visiteur demande explicitement de jouer maintenant, termine par [LANCER_JEU] sur sa propre ligne.
`;

  return cachedPrompt;
}

// Le nom est ajouté à l'affichage par le composant : ne pas le répéter ici.
const RATE_LIMIT_MESSAGE =
  'Le service est momentanément indisponible en raison d’un nombre élevé de demandes. Merci de réessayer dans quelques instants.';

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
          model: 'openai/gpt-oss-20b',
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
