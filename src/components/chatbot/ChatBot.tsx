import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '> HAL-9000 — Assistant portfolio. Pose-moi des questions sur le parcours, les compétences ou les projets.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number | null>(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gameProposed, setGameProposed] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIndex]);

  const handleTypeDone = useCallback(() => {
    setTypingIndex(null);
    inputRef.current?.focus();
    idleRef.current = setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '> Veux-tu jouer à un jeu, Dave ? tape OUI ou NON.',
      }]);
      setGameProposed(true);
    }, 10000);
    // stable — refs + setState only
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setTypingIndex(null);

    if (idleRef.current) clearTimeout(idleRef.current);
    if (gameProposed) {
      if (input.trim().toLowerCase().startsWith('oui')) {
        window.location.href = '/wargames';
        return;
      }
      setGameProposed(false);
    }

    const userMsg: Message = { role: 'user', content: `$ ${input}` };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const nextCount = userCount + 1;
      setUserCount(nextCount);

      if (nextCount >= 3) {
        const newMsgs: Message[] = [
          { role: 'assistant', content: `> ${data.content}` },
          { role: 'assistant', content: '> REBOOT SYSTÈME. Session terminée. Tape un message pour une nouvelle session.' },
        ];
        setMessages(newMsgs);
        setTypingIndex(0);
        setUserCount(0);
      } else {
        const idx = messages.length + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: `> ${data.content}` }]);
        setTypingIndex(idx);
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
        <span style={{ color: '#888' }}>HAL-9000</span>
        <span style={{ color: '#00fff7' }}>══╗</span>
      </div>

      <div className="px-4 py-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <p
            key={i}
            className="text-sm font-mono leading-relaxed"
            style={{ color: msg.role === 'user' ? '#00fff7' : '#39ff14' }}
          >
            {msg.role === 'assistant' && typingIndex === i ? (
              <TypewriterText text={msg.content} onDone={handleTypeDone} />
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
