import { buildContactMail, validateContact, type ContactMail } from './contactMail';

/** Envoie un mail à Martin. Injectée pour pouvoir tester sans SMTP. */
export type ContactSender = (mail: ContactMail) => Promise<void>;

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
export async function handleContactRequest(request: Request, send: ContactSender): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid body' });
  }

  // Champ piège invisible pour un humain : s'il est rempli, c'est un robot.
  // On répond comme si tout allait bien pour ne pas lui apprendre à l'éviter.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) {
    return json(200, { ok: true });
  }

  const verdict = validateContact(body);
  if (!verdict.ok) return json(400, { ok: false, error: verdict.error });

  try {
    await send(buildContactMail(verdict.data));
  } catch (err) {
    console.error('[contact] échec de l’envoi du mail', err);
    return json(502, { ok: false, error: 'send failed' });
  }

  return json(200, { ok: true });
}
