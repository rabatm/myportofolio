import { useEffect, useRef } from 'react';

export default function MarvinShell({ messages }: { messages: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      style={{
        flex: '0 0 40%',
        maxWidth: '40%',
        background: '#0d0d0d',
        borderRight: '1px solid #333',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#39ff14',
        overflowY: 'auto',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ color: '#888', marginBottom: '0.75rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
        MARVIN-42 TERMINAL v2.0
      </div>
      {messages.map((msg, i) => (
        <div key={i} style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          <span style={{ color: '#00fff7' }}>&gt;</span> {msg}
        </div>
      ))}
      <div ref={endRef} />
      <a
        href="/"
        style={{ color: '#555', textDecoration: 'none', display: 'block', marginTop: '1rem', fontSize: '0.85rem' }}
      >
        &gt; Retour au portfolio
      </a>
    </div>
  );
}
