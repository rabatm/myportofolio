import { buildContactMail, validateContact, type ContactMail, type ContactMessage } from './contactMail';
import { hasTooManyLinks, isTooFast, type RateLimiter } from './spamGuard';

/** Envoie un mail à Martin. Injectée pour pouvoir tester sans SMTP. */
export type ContactSender = (mail: ContactMail) => Promise<void>;

/**
 * Dit si un message ressemble à du spam. Ne doit jamais lever : en cas de
 * doute ou de panne, répondre false (le message part alors normalement).
 */
export type SpamJudge = (message: ContactMessage) => Promise<boolean>;

export interface ContactContext {
  /** IP du visiteur, voir clientIp(). */
  ip: string;
  limiter: RateLimiter;
  /** Avis d'un modèle sur le texte ; absent = pas de contrôle. */
  judge?: SpamJudge;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Traitement de POST /api/contact, sorti de la route pour être testable :
 * un fichier de test dans src/pages/ deviendrait lui-même une route.
 */
export async function handleContactRequest(
  request: Request,
  send: ContactSender,
  { ip, limiter, judge }: ContactContext
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid body' });
  }
  const champs = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  // Robots : champ piège rempli, ou envoi sans passer (assez longtemps) par le
  // formulaire. On répond comme si tout allait bien pour ne rien leur apprendre.
  if (champs.website || isTooFast(champs.elapsedMs)) return json(200, { ok: true });

  const verdict = validateContact(body);
  if (!verdict.ok) return json(400, { ok: false, error: verdict.error });
  if (hasTooManyLinks(verdict.data)) return json(400, { ok: false, error: 'too many links' });

  // En dernier : seuls les messages qui partiraient vraiment consomment du quota.
  const debit = limiter.hit(ip);
  if (debit !== 'ok') {
    if (debit === 'global') console.warn('[contact] plafond global atteint : messages refusés jusqu’à la fin de la fenêtre');
    return json(429, { ok: false, error: 'rate limited' });
  }

  try {
    // Un message suspect n'est jamais refusé (un vrai prospect perdu coûte plus
    // cher qu'un spam reçu) : son objet est marqué, pour un filtre de la boîte mail.
    const suspect = judge ? await judge(verdict.data) : false;
    await send(buildContactMail(verdict.data, { suspect }));
  } catch (err) {
    console.error('[contact] échec de l’envoi du mail', err);
    return json(502, { ok: false, error: 'send failed' });
  }

  return json(200, { ok: true });
}
