import { useState, useEffect, useCallback } from 'react';
import { getBestMove, checkWinner, isBoardFull } from './minimax';
import type { FormEvent } from 'react';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const CHAR_INTERVAL = 30;

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

export default function WargamesGame() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'score'>('intro');
  const [round, setRound] = useState(1);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ hal: 0, visitor: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [halMoved, setHalMoved] = useState(false);
  const [underRound] = useState(() => Math.floor(Math.random() * 3));

  const [contact, setContact] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const handleIntroDone = useCallback(() => setIntroDone(true), []);

  function resetBoard() {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setWinner(null);
    setHalMoved(false);
  }

  function handleCellClick(index: number) {
    if (currentPlayer !== 'X' || board[index] || winner || halMoved) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      return;
    }
    if (isBoardFull(newBoard)) {
      setWinner('draw');
      return;
    }
    setCurrentPlayer('O');
    setHalMoved(false);
  }

  useEffect(() => {
    if (currentPlayer !== 'O' || winner || halMoved) return;
    setHalMoved(true);
    const timer = setTimeout(() => {
      const aiMove = getBestMove(board, 'O', round - 1 === underRound);
      const newBoard = [...board];
      newBoard[aiMove] = 'O';
      setBoard(newBoard);

      const w = checkWinner(newBoard);
      if (w) {
        setWinner(w);
        return;
      }
      if (isBoardFull(newBoard)) {
        setWinner('draw');
        return;
      }
      setCurrentPlayer('X');
      setHalMoved(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [currentPlayer, winner, halMoved]);

  useEffect(() => {
    if (!winner) return;
    const timer = setTimeout(() => {
      if (winner === 'X') setScores(s => ({ ...s, visitor: s.visitor + 1 }));
      else if (winner === 'O') setScores(s => ({ ...s, hal: s.hal + 1 }));

      if (round >= 3) {
        setPhase('score');
      } else {
        setRound(r => r + 1);
        resetBoard();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [winner]);

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    setContactLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      setContactSent(true);
    } catch {
      // silent
    } finally {
      setContactLoading(false);
    }
  }

  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#00fff7', fontFamily: 'monospace', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
          <TypewriterText
            text="BIENVENUE AU JEU.\n\nTROIS ROUNDS.\n\nQUE LE MEILLEUR GAGNE."
            onDone={handleIntroDone}
          />
        </div>
        {introDone && (
          <button
            onClick={() => setPhase('playing')}
            style={{
              marginTop: '2rem',
              background: 'transparent',
              color: '#39ff14',
              border: '1px solid #39ff14',
              padding: '0.5rem 1.5rem',
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            > COMMENCER
          </button>
        )}
      </div>
    );
  }

  if (phase === 'score') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace', padding: '2rem' }}>
        <h1 style={{ color: '#00fff7', fontSize: '1.8rem', marginBottom: '1rem' }}>SCORE FINAL</h1>
        <p style={{ color: '#00fff7', fontSize: '1.2rem' }}>HAL-9000: {scores.hal}</p>
        <p style={{ color: '#39ff14', fontSize: '1.2rem' }}>VISITEUR: {scores.visitor}</p>
        <p style={{ color: '#f0f0f0', fontSize: '1rem', marginTop: '1rem' }}>
          {scores.visitor > 0 ? 'BIEN JOUÉ, DAVE.' : '...TU REVIENDRAIS PAS SUR TERRE ?'}
        </p>

        <div style={{ marginTop: '2rem', width: '100%', maxWidth: '400px' }}>
          <p style={{ color: '#888', marginBottom: '1rem' }}>> UN PROJET PASSIONNANT ? ÉCRIS-MOI.</p>
          {contactSent ? (
            <p style={{ color: '#39ff14' }}>MESSAGE TRANSMIS.</p>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#39ff14' }}>$</span>
                <input
                  value={contact.name}
                  onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                  placeholder="NOM"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#39ff14' }}>$</span>
                <input
                  value={contact.email}
                  onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                  placeholder="EMAIL"
                  type="email"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#39ff14' }}>$</span>
                <textarea
                  value={contact.message}
                  onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                  placeholder="MESSAGE"
                  required
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                disabled={contactLoading}
                style={{
                  background: 'transparent',
                  color: '#00fff7',
                  border: '1px solid #00fff7',
                  padding: '0.5rem 1rem',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                {contactLoading ? 'ENVOI...' : '> ENVOYER'}
              </button>
            </form>
          )}
        </div>

        <a
          href="/"
          style={{ color: '#888', marginTop: '2rem', textDecoration: 'none', fontFamily: 'monospace' }}
        >
          &gt; Revenir au chat
        </a>
      </div>
    );
  }

  const statusText = winner
    ? winner === 'draw'
      ? 'ÉGALITÉ.'
      : winner === 'X'
        ? 'VISITEUR GAGNE !'
        : 'HAL-9000 GAGNE.'
    : currentPlayer === 'X'
      ? 'À TOI DE JOUER.'
      : 'HAL-9000 RÉFLÉCHIT...';

  const cellStyle = (i: number): React.CSSProperties => ({
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontFamily: 'monospace',
    borderRight: i % 3 < 2 ? '1px solid #333' : 'none',
    borderBottom: i < 6 ? '1px solid #333' : 'none',
    color: board[i] === 'X' ? '#00fff7' : '#39ff14',
    cursor: board[i] === '' && currentPlayer === 'X' && !winner ? 'pointer' : 'default',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: '1rem', color: '#888' }}>
        ROUND {round}/3 — HAL: {scores.hal} / VOUS: {scores.visitor}
      </div>
      <div style={{ marginBottom: '2rem', color: '#00fff7', fontSize: '0.9rem' }}>
        > {statusText}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', background: '#111', padding: '0', border: '1px solid #333' }}>
        {board.map((cell, i) => (
          <div key={i} style={cellStyle(i)} onClick={() => handleCellClick(i)}>
            {cell || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #333',
  color: '#f0f0f0',
  fontFamily: 'monospace',
  fontSize: '1rem',
  outline: 'none',
  padding: '0.25rem 0',
};
