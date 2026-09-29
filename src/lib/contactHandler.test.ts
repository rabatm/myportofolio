import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleContactRequest, type ContactSender } from './contactHandler';
import { createRateLimiter, type RateLimiter } from './spamGuard';

function requete(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valide = { name: 'Ada', email: 'ada@example.com', message: 'Bonjour', lang: 'fr', elapsedMs: 8000 };

/** Contexte nominal : une IP, un limiteur neuf. */
function ctx(limiter: RateLimiter = createRateLimiter(), ip = '203.0.113.9') {
  return { ip, limiter };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleContactRequest', () => {
  it("envoie le mail et répond 200", async () => {
    const send = vi.fn<ContactSender>().mockResolvedValue(undefined);

    const res = await handleContactRequest(requete(valide), send, ctx());

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

    const res = await handleContactRequest(requete({ ...valide, email: 'faux' }), send, ctx());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid email' });
    expect(send).not.toHaveBeenCalled();
  });

  it("répond 400 si le corps n'est pas du JSON", async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete('pas du json'), send, ctx());

    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('fait semblant de réussir quand le champ piège est rempli', async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete({ ...valide, website: 'http://spam.example' }), send, ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("répond 502 et journalise l'erreur quand le SMTP échoue", async () => {
    const send = vi.fn<ContactSender>().mockRejectedValue(new Error('SMTP down'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handleContactRequest(requete(valide), send, ctx());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'send failed' });
    expect(log).toHaveBeenCalled();
  });

  it('fait semblant de réussir quand le formulaire est envoyé trop vite', async () => {
    const send = vi.fn<ContactSender>();

    const res = await handleContactRequest(requete({ ...valide, elapsedMs: 500 }), send, ctx());

    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('fait semblant de réussir quand la mesure de temps manque', async () => {
    const send = vi.fn<ContactSender>();
    const { elapsedMs: _, ...sansMesure } = valide;

    const res = await handleContactRequest(requete(sansMesure), send, ctx());

    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuse un message bourré de liens', async () => {
    const send = vi.fn<ContactSender>();
    const message = 'https://a.fr https://b.fr https://c.fr https://d.fr';

    const res = await handleContactRequest(requete({ ...valide, message }), send, ctx());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'too many links' });
    expect(send).not.toHaveBeenCalled();
  });

  it('répond 429 au-delà de la limite par IP', async () => {
    const send = vi.fn<ContactSender>().mockResolvedValue(undefined);
    const limiter = createRateLimiter({ perIp: 1, perIpWindowMs: 60_000, global: 10, globalWindowMs: 60_000 });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await handleContactRequest(requete(valide), send, ctx(limiter));
    const res = await handleContactRequest(requete(valide), send, ctx(limiter));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ ok: false, error: 'rate limited' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('répond 429 et prévient dans les logs quand le plafond global est atteint', async () => {
    const send = vi.fn<ContactSender>().mockResolvedValue(undefined);
    const limiter = createRateLimiter({ perIp: 10, perIpWindowMs: 60_000, global: 1, globalWindowMs: 60_000 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await handleContactRequest(requete(valide), send, ctx(limiter, '1.1.1.1'));
    const res = await handleContactRequest(requete(valide), send, ctx(limiter, '2.2.2.2'));

    expect(res.status).toBe(429);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('plafond global'));
  });

  it("ne décompte pas les requêtes rejetées avant l'envoi", async () => {
    const send = vi.fn<ContactSender>().mockResolvedValue(undefined);
    const limiter = createRateLimiter({ perIp: 1, perIpWindowMs: 60_000, global: 10, globalWindowMs: 60_000 });

    await handleContactRequest(requete({ ...valide, email: 'faux' }), send, ctx(limiter));
    const res = await handleContactRequest(requete(valide), send, ctx(limiter));

    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
