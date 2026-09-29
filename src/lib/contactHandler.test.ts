import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleContactRequest, type ContactSender } from './contactHandler';

function requete(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valide = { name: 'Ada', email: 'ada@example.com', message: 'Bonjour', lang: 'fr' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleContactRequest', () => {
  it("envoie le mail et répond 200", async () => {
    const send = vi.fn<ContactSender>().mockResolvedValue(undefined);

    const res = await handleContactRequest(requete(valide), send);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Portfolio] Message de Ada (FR)',
        replyTo: '"Ada" <ada@example.com>',
      })
    );
  });

  it('répond 400 sans rien envoyer si la charge est invalide', async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete({ ...valide, email: 'faux' }), send);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid email' });
    expect(send).not.toHaveBeenCalled();
  });

  it("répond 400 si le corps n'est pas du JSON", async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete('pas du json'), send);

    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('fait semblant de réussir quand le champ piège est rempli', async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete({ ...valide, website: 'http://spam.example' }), send);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("répond 502 et journalise l'erreur quand le SMTP échoue", async () => {
    const send = vi.fn<ContactSender>().mockRejectedValue(new Error('SMTP down'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handleContactRequest(requete(valide), send);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'send failed' });
    expect(log).toHaveBeenCalled();
  });
});
