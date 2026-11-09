import { describe, expect, it, vi } from 'vitest';
import { chatCompletion, MISTRAL_MODEL, MistralError } from './mistral';

const reponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('chatCompletion', () => {
  it('envoie le modèle, la clé et les messages, et renvoie le texte', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reponse(200, { choices: [{ message: { content: 'Bonjour' } }] }));
    const messages = [{ role: 'user' as const, content: 'Salut' }];

    await expect(chatCompletion('clé', messages, { fetchImpl })).resolves.toBe('Bonjour');

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer clé');
    expect(JSON.parse(init.body)).toMatchObject({ model: MISTRAL_MODEL, messages, max_tokens: 250 });
  });

  it('renvoie une chaîne vide si la réponse n’a pas de contenu', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reponse(200, { choices: [] }));
    await expect(chatCompletion('clé', [], { fetchImpl })).resolves.toBe('');
  });

  it('expose le statut HTTP en cas d’erreur (429 géré par la route)', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => reponse(429, { message: 'rate limit' }));
    await expect(chatCompletion('clé', [], { fetchImpl })).rejects.toMatchObject({
      name: 'MistralError',
      status: 429,
    });
    await expect(chatCompletion('clé', [], { fetchImpl })).rejects.toBeInstanceOf(MistralError);
  });

  it('refuse d’appeler l’API sans clé', async () => {
    const fetchImpl = vi.fn();
    await expect(chatCompletion(undefined, [], { fetchImpl })).rejects.toThrow('MISTRAL_API_KEY');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
