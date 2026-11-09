/** Modèle utilisé par Marvin-42 (alias Mistral : suit la dernière version « small »). */
export const MISTRAL_MODEL = 'mistral-small-latest';

const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Erreur HTTP de l'API : `status` permet à la route de distinguer le 429. */
export class MistralError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'MistralError';
  }
}

/**
 * Appelle l'API chat de Mistral et renvoie le texte de la réponse.
 * `fetch` est injectable pour les tests ; la clé vient de MISTRAL_API_KEY.
 */
export async function chatCompletion(
  apiKey: string | undefined,
  messages: ChatMessage[],
  {
    signal,
    fetchImpl = fetch,
    maxTokens = 250,
    temperature,
  }: { signal?: AbortSignal; fetchImpl?: typeof fetch; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!apiKey) throw new Error('MISTRAL_API_KEY manquante');

  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MISTRAL_MODEL, messages, max_tokens: maxTokens, temperature }),
    signal,
  });
  if (!res.ok) throw new MistralError(res.status, `Mistral ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}
