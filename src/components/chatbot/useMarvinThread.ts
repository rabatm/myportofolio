/**
 * Fil de conversation de MARVIN-42 : modèle, persistance et appel à l'API.
 *
 * Le contenu stocké est nu. Les préfixes « > » et « $ » du terminal sont
 * décoratifs et vivent dans ChatPanel : les concaténer au contenu, comme
 * le faisait l'ancien composant, revenait à les envoyer à Groq.
 */

export type Role = 'assistant' | 'user' | 'error';

export interface Message {
  role: Role;
  content: string;
}

export const THREAD_KEY = 'marvin.thread';
export const THREAD_CAP = 40;
export const CONTEXT_WINDOW = 6;
export const GAME_MARKER = '[LANCER_JEU]';
export const LONG_SESSION_EVERY = 15;

export const GREETING: Message = {
  role: 'assistant',
  content:
    "Assistant portfolio. Pose-moi des questions, ou pas. Ça ne changera pas grand-chose à mon état.",
};

export const LONG_SESSION_NOTICE =
  'SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.';

export function capThread(messages: Message[]): Message[] {
  return messages.length <= THREAD_CAP ? messages : messages.slice(-THREAD_CAP);
}

/**
 * Charge envoyée à /api/chat. Les entrées d'erreur sont retirées d'abord :
 * elles n'apportent rien au modèle et prendraient la place d'un vrai
 * message dans la fenêtre de contexte.
 */
export function toApiMessages(
  messages: Message[]
): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((m): m is Message & { role: 'user' | 'assistant' } => m.role !== 'error')
    .slice(-CONTEXT_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function parseReply(raw: string): { content: string; launchGame: boolean } {
  const launchGame = raw.includes(GAME_MARKER);
  const content = raw.split(GAME_MARKER).join('').replace(/^\s*>\s*/, '').trim();

  return { content, launchGame };
}

export function readThread(): Message[] | null {
  try {
    const brut = sessionStorage.getItem(THREAD_KEY);
    if (!brut) return null;

    const lu: unknown = JSON.parse(brut);
    if (!Array.isArray(lu)) return null;

    const messages = lu.filter(
      (m): m is Message =>
        !!m &&
        typeof (m as Message).content === 'string' &&
        ['user', 'assistant', 'error'].includes((m as Message).role)
    );

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

export function writeThread(messages: Message[]): void {
  try {
    sessionStorage.setItem(
      THREAD_KEY,
      JSON.stringify(messages.filter((m) => m.role !== 'error'))
    );
  } catch {
    // Navigation privée : le fil ne survivra pas au changement de page.
  }
}
