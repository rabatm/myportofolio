import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Commentaire de navigation généré automatiquement (pas une réponse à l'utilisateur). */
  auto?: boolean;
}

const CHAR_INTERVAL = 15;

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        onDone?.();
      }
    }, CHAR_INTERVAL);
    return () => clearInterval(t);
  }, [text]);

  return <>{displayed}</>;
}

interface ChatBotProps {
  /** Réplique affichée à l'arrivée sur la page (déjà choisie côté serveur). */
  pageLine?: string;
  /** Réplique par section observable, indexée sur l'id du <section>. */
  sectionLines?: Record<string, string>;
}

/** Délai minimum entre deux commentaires automatiques (anti-spam au scroll). */
const COMMENT_COOLDOWN = 8000;

export default function ChatBot({ pageLine, sectionLines }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "> Assistant portfolio. Pose-moi des questions, ou pas. Ça ne changera pas grand-chose à mon état." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number | null>(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIndex]);

  // Commentaires de navigation : répliques pré-écrites, aucun appel réseau.
  // Le quota Groq est ainsi entièrement réservé aux vraies questions du chat.
  const lastCommentRef = useRef(0);
  const commentedRef = useRef(new Set<string>());

  const comment = useCallback((key: string, line: string) => {
    if (commentedRef.current.has(key)) return;
    // Espacement minimum : sans ça, un scroll rapide empilerait les répliques.
    if (Date.now() - lastCommentRef.current < COMMENT_COOLDOWN) return;

    commentedRef.current.add(key);
    lastCommentRef.current = Date.now();

    setMessages(prev => {
      setTypingIndex(prev.length);
      return [...prev, { role: 'assistant', content: `> ${line}`, auto: true }];
    });
  }, []);

  // Réplique à l'arrivée sur une page.
  useEffect(() => {
    if (!pageLine) return;
    comment(`page:${window.location.pathname}`, pageLine);
  }, [pageLine, comment]);

  // Réplique quand une section entre à l'écran.
  useEffect(() => {
    if (!sectionLines) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          const line = sectionLines[id];
          if (line) comment(`section:${id}`, line);
        }
      },
      { threshold: 0.4 }
    );

    for (const id of Object.keys(sectionLines)) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionLines, comment]);

  const handleTypeDone = useCallback((auto = false) => {
    setTypingIndex(null);
    if (!auto) inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setTypingIndex(null);

    const userMsg: Message = { role: 'user', content: `$ ${input}` };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const CONTEXT_WINDOW = 6;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Les commentaires de navigation sont exclus : ils n'apportent rien à
          // la conversation et gonflent inutilement le contexte facturé.
          messages: newMessages
            .filter(m => !m.auto)
            .slice(-CONTEXT_WINDOW)
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
        }),
      });
      const data = await res.json();
      const nextCount = userCount + 1;
      setUserCount(nextCount);

      const idx = newMessages.length;
      const rawContent = String(data.content);
      const launchGame = /\[LANCER_JEU\]/.test(rawContent);
      const cleanContent = rawContent.replace(/\[LANCER_JEU\]/g, '').replace(/^\s*>\s*/, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: `> ${cleanContent}` }]);
      setTypingIndex(idx);

      if (launchGame) {
        setTimeout(() => {
          window.location.href = '/wargames';
        }, 2200);
      }

      if (!launchGame && nextCount % 15 === 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '> SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.',
          }]);
        }, 2500);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '> ERREUR: connexion au serveur perdue.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2"
      style={{
        borderColor: '#00fff7',
        background: '#0a0a0a',
        boxShadow: '0 -4px 12px rgba(0,255,247,0.1)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-1 text-xs font-mono"
        style={{ background: '#111', borderBottom: '1px solid #333' }}
      >
        <span style={{ color: '#00fff7' }}>╔══</span>
        <span style={{ color: '#888' }}>MARVIN-42</span>
        <span style={{ color: '#00fff7' }}>══╗</span>
      </div>

      <div className="px-4 py-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <p
            key={i}
            className="text-sm font-mono leading-relaxed"
            style={{ color: msg.role === 'user' ? '#00fff7' : '#39ff14' }}
          >
            {/* Le nom est un élément à part : le typewriter ne doit pas le taper
                lettre par lettre, et il ne doit pas partir dans l'historique LLM. */}
            {msg.role === 'assistant' && (
              <span style={{ color: '#8fffa8', fontWeight: 700 }}>MARVIN-42 </span>
            )}
            {msg.role === 'assistant' && typingIndex === i ? (
              <TypewriterText text={msg.content} onDone={() => handleTypeDone(msg.auto)} />
            ) : (
              msg.content
            )}
          </p>
        ))}
        {isLoading && (
          <p className="text-sm font-mono" style={{ color: '#39ff14' }}>
            &gt; <span className="animate-pulse">_</span>
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-2">
        <span className="text-sm font-mono" style={{ color: '#39ff14' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Écris un message..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-sm font-mono outline-none"
          style={{ color: '#f0f0f0' }}
        />
      </form>
    </div>
  );
}
