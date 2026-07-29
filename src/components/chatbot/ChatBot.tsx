import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '> Allô ? Je suis ORDI-9000, prêt à causer ! Pose-moi des questions sur le portfolio.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      setMessages(prev => [...prev, { role: 'assistant', content: `> ${data.content}` }]);
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
        <span style={{ color: '#888' }}>RETRO-CHAT v1.0</span>
        <span style={{ color: '#00fff7' }}>══╗</span>
      </div>

      <div className="px-4 py-2" style={{ maxHeight: '160px', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <p
            key={i}
            className="text-sm font-mono leading-relaxed"
            style={{ color: msg.role === 'user' ? '#00fff7' : '#39ff14' }}
          >
            {msg.content}
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
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Écris un message..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-sm font-mono outline-none"
          style={{ color: '#f0f0f0' }}
          autoFocus
        />
      </form>
    </div>
  );
}
