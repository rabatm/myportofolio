import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: import.meta.env.GROQ_API_KEY,
    });
  }
  return groq;
}

const SYSTEM_PROMPT = `Tu es ORDI-9000, un assistant rétro des années 90 intégré au portfolio de [Prénom]. Ton rôle :
- Réponds aux questions sur le portfolio (projets, compétences, contact)
- Tu peux répondre à des questions techniques basiques liées au dev
- Ajoute une touche rétro 90s (références, blagues geek, style "ordinateur")
- Reste concis (max 3-4 phrases)
- Si on te demande quelque chose hors-sujet ou inapproprié, réponds : "ERREUR 404 : sujet non trouvé. Redirection vers le chat principal."
- Utilise du français`;

const RATE_LIMIT_MESSAGE = "ORDI-9000: MÉMOIRE VIVE PLEINE ! 🧨 *bruit de disque dur qui souffre* Réessaie dans quelques secondes, je dois défragmenter.";

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
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
          max_tokens: 300,
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
