import { parseLang, type Lang } from '../i18n/utils';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  lang: Lang;
}

export type ContactValidation = { ok: true; data: ContactMessage } | { ok: false; error: string };

const MAX = { name: 100, email: 200, message: 5000 } as const;

// Volontairement simple : on veut écarter les fautes de frappe, pas valider la RFC 5322.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function champ(body: Record<string, unknown>, cle: keyof typeof MAX): string | null {
  const brut = body[cle];
  if (typeof brut !== 'string') return null;
  const propre = brut.trim();
  return propre && propre.length <= MAX[cle] ? propre : null;
}

/**
 * Valide la charge envoyée par les formulaires de contact.
 * Le nom et l'email finissent dans les en-têtes du mail (Reply-To) : un
 * retour à la ligne y permettrait d'injecter des en-têtes, d'où le refus.
 */
export function validateContact(body: unknown): ContactValidation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid body' };
  const b = body as Record<string, unknown>;

  const name = champ(b, 'name');
  const email = champ(b, 'email');
  const message = champ(b, 'message');

  if (!name || /[\r\n]/.test(name)) return { ok: false, error: 'invalid name' };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid email' };
  if (!message) return { ok: false, error: 'invalid message' };

  return { ok: true, data: { name, email, message, lang: parseLang(b.lang) } };
}

export interface ContactMail {
  subject: string;
  text: string;
  replyTo: string;
}

/** Mail reçu par Martin : « Répondre » dans sa boîte écrit directement au visiteur. */
export function buildContactMail(m: ContactMessage): ContactMail {
  const langue = m.lang.toUpperCase();
  return {
    subject: `[Portfolio] Message de ${m.name} (${langue})`,
    replyTo: `"${m.name.replace(/(["\\])/g, '\\$1')}" <${m.email}>`,
    text: [
      `Nom : ${m.name}`,
      `Email : ${m.email}`,
      `Langue : ${langue}`,
      '',
      m.message,
    ].join('\n'),
  };
}
