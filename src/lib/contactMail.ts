import { parseLang, type Lang } from '../i18n/utils';
import { SERVICE_IDS, services } from '../data/services';

export const PROJECT_TYPES = [...SERVICE_IDS, 'other'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

const LIBELLE_AUTRE = 'Autre / je ne sais pas encore';

function libelleType(t: ProjectType): string {
  return t === 'other' ? LIBELLE_AUTRE : (services.fr.find((s) => s.id === t)?.name ?? t);
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  lang: Lang;
  company?: string;
  projectType?: ProjectType;
}

export type ContactValidation = { ok: true; data: ContactMessage } | { ok: false; error: string };

const MAX = { name: 100, company: 100, email: 200, message: 5000 } as const;

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

  const data: ContactMessage = { name, email, message, lang: parseLang(b.lang) };

  // Entreprise et type sont facultatifs (le formulaire WarGames ne les envoie
  // pas) ; absents ou vides, ils sont omis. L'entreprise finit dans le sujet du
  // mail : pas de retour à la ligne.
  if (b.company !== undefined && b.company !== null && b.company !== '') {
    const company = champ(b, 'company');
    if (company === null && typeof b.company === 'string' && !b.company.trim()) {
      // espaces seuls : traité comme vide
    } else if (!company || /[\r\n]/.test(company)) {
      return { ok: false, error: 'invalid company' };
    } else {
      data.company = company;
    }
  }
  if (b.projectType !== undefined && b.projectType !== null && b.projectType !== '') {
    if (!(PROJECT_TYPES as readonly unknown[]).includes(b.projectType)) {
      return { ok: false, error: 'invalid project type' };
    }
    data.projectType = b.projectType as ProjectType;
  }

  return { ok: true, data };
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
    subject: `[Martin Info] ${m.name}${m.company ? ` — ${m.company}` : ''} (${langue})`,
    replyTo: `"${m.name.replace(/(["\\])/g, '\\$1')}" <${m.email}>`,
    text: [
      `Nom : ${m.name}`,
      `Email : ${m.email}`,
      ...(m.company ? [`Entreprise : ${m.company}`] : []),
      ...(m.projectType ? [`Type de projet : ${libelleType(m.projectType)}`] : []),
      `Langue : ${langue}`,
      '',
      m.message,
    ].join('\n'),
  };
}
