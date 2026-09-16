/**
 * Fil de conversation de MARVIN-42 : modèle, persistance et appel à l'API.
 *
 * Le contenu stocké est nu. Les préfixes « > » et « $ » du terminal sont
 * décoratifs et vivent dans ChatPanel : les concaténer au contenu, comme
 * le faisait l'ancien composant, revenait à les envoyer à Groq.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from './track';

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

export interface UseMarvinThreadResult {
  messages: Message[];
  isLoading: boolean;
  typing: boolean;
  canRetry: boolean;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  finishTyping: () => void;
}

export function useMarvinThread(): UseMarvinThreadResult {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const chargementRef = useRef(false);
  const nbMessagesVisiteur = useRef(0);
  const minuterieJeuRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Le dock reste monté même quand le panneau est fermé (voir MarvinDock),
  // donc ce nettoyage au démontage ne couvre pas le cas « fermer le panneau
  // pendant les 2,2 s » — seul un remaniement de l'arbre le pourrait. Il
  // reste la sécurité minimale : si ce hook venait à être démonté, un
  // visiteur qui a fermé la page ne doit pas déclencher une navigation
  // fantôme après coup.
  useEffect(() => {
    return () => {
      if (minuterieJeuRef.current) clearTimeout(minuterieJeuRef.current);
    };
  }, []);

  // Restauration après hydratation seulement : `client:idle` rend ce
  // composant côté serveur, où sessionStorage n'existe pas. Le premier
  // rendu client doit être identique au rendu serveur.
  useEffect(() => {
    const stocke = readThread();
    if (stocke) setMessages(stocke);
  }, []);

  // La toute première exécution est ignorée : sans ça, elle écrirait
  // [GREETING] par-dessus le fil que l'effet de restauration vient tout
  // juste de lire, et la conversation ne survivrait pas au changement de page.
  const premierPassage = useRef(true);
  useEffect(() => {
    if (premierPassage.current) {
      premierPassage.current = false;
      return;
    }
    writeThread(messages);
  }, [messages]);

  const requete = useCallback(async (historique: Message[]) => {
    chargementRef.current = true;
    setIsLoading(true);
    setCanRetry(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApiMessages(historique) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const { content, launchGame } = parseReply(String(data.content));

      setMessages(capThread([...historique, { role: 'assistant', content }]));
      setTyping(true);

      if (launchGame) {
        // Laisse le temps de lire la réplique avant de basculer sur le jeu.
        // Le visiteur peut désormais fermer le panneau pendant ces 2,2 s
        // (croix ou Échap) : l'id est gardé pour pouvoir annuler la
        // navigation au démontage plutôt que de le rediriger malgré lui.
        minuterieJeuRef.current = setTimeout(() => {
          window.location.href = '/wargames';
        }, 2200);
        return;
      }

      if (
        nbMessagesVisiteur.current > 0 &&
        nbMessagesVisiteur.current % LONG_SESSION_EVERY === 0
      ) {
        setTimeout(() => {
          setMessages((prev) =>
            capThread([...prev, { role: 'assistant', content: LONG_SESSION_NOTICE }])
          );
        }, 2500);
      }
    } catch {
      setMessages(
        capThread([...historique, { role: 'error', content: 'connexion perdue' }])
      );
      setCanRetry(true);
    } finally {
      chargementRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const propre = text.trim();
      if (!propre || chargementRef.current) return;

      nbMessagesVisiteur.current += 1;
      track('marvin_message_sent', {
        length: propre.length,
        index: nbMessagesVisiteur.current,
      });

      setTyping(false);
      const historique = capThread([
        ...messagesRef.current,
        { role: 'user' as const, content: propre },
      ]);
      setMessages(historique);

      await requete(historique);
    },
    [requete]
  );

  const retry = useCallback(async () => {
    if (chargementRef.current) return;

    // On retire la seule entrée d'erreur : le message du visiteur reste en
    // place et n'est donc jamais dupliqué.
    const historique = messagesRef.current.filter((m) => m.role !== 'error');
    setMessages(historique);

    await requete(historique);
  }, [requete]);

  const finishTyping = useCallback(() => setTyping(false), []);

  return { messages, isLoading, typing, canRetry, send, retry, finishTyping };
}
