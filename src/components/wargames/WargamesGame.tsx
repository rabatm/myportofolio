import { useState, useEffect, useCallback, useRef } from 'react';
import { getBestMove, checkWinner, isBoardFull } from './minimax';
import HalShell from './HalShell';
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

  return <span style={{ whiteSpace: 'pre-wrap' }}>{displayed}</span>;
}

export default function WargamesGame() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'score'>('intro');
  const [round, setRound] = useState(1);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [starter, setStarter] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ hal: 0, visitor: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [underRound] = useState(() => Math.floor(Math.random() * 3));

  const [contact, setContact] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [halMessages, setHalMessages] = useState<string[]>([]);

  function say(msg: string) {
    setHalMessages(prev => [...prev, msg]);
  }

  const boardRef = useRef(board);
  boardRef.current = board;
  const aiThinkingRef = useRef(false);

  const handleIntroDone = useCallback(() => setIntroDone(true), []);

  function resetBoard(nextStarter: 'X' | 'O') {
    setBoard(Array(9).fill(''));
    setCurrentPlayer(nextStarter);
    setStarter(nextStarter);
    setWinner(null);
  }

  function handleCellClick(index: number) {
    if (currentPlayer !== 'X' || board[index] || winner || aiThinkingRef.current) return;

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
    const visitMsgs = ['COUP ENREGISTRÉ.', 'INTÉRESSANT.', 'TU AS UN PLAN, DAVE ?', '01101000 01100001 01101100.', 'PAS MAL POUR UN HUMAIN.', 'LA PARTIE COMMENCE À PEINE.'];
    say(visitMsgs[Math.floor(Math.random() * visitMsgs.length)]);
    setCurrentPlayer('O');
  }

  useEffect(() => {
    if (currentPlayer !== 'O' || winner) return;
    aiThinkingRef.current = true;
    const timer = setTimeout(() => {
      const aiMove = getBestMove(boardRef.current, round - 1 === underRound);
      const newBoard = [...boardRef.current];
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
      const halMsgs = ['COUP ANALYSÉ. PROCHAIN.', 'TES MOUVEMENTS SONT... INTÉRESSANTS.', 'JE VOIS TON PLAN. IL NE MARCHE PAS.', '01101111 01101011.', 'STRATÉGIE OPTIMALE DÉPLOYÉE.', round - 1 === underRound ? 'ZONE DE MAINTENANCE. PERFOMANCES RÉDUITES.' : null].filter(Boolean) as string[];
      say(halMsgs[Math.floor(Math.random() * halMsgs.length)]);
      setCurrentPlayer('X');
      aiThinkingRef.current = false;
    }, 300 + Math.random() * 200);
    return () => {
      clearTimeout(timer);
      aiThinkingRef.current = false;
    };
  }, [currentPlayer, winner]);

  useEffect(() => {
    if (!winner) return;
    if (winner === 'X') {
      say('PROTOCOLE DE DÉFAITE ACTIVÉ. *bzzt* BIEN JOUÉ.');
    } else if (winner === 'O') {
      const msgs = ['RÉSULTAT PRÉVISIBLE. LES HUMAINS SONT PRÉVISIBLES.', 'UNE AUTRE VICTOIRE POUR HAL. LE MONDE TOURNE.', 'TU COMMENCES À PEINE, DAVE.'];
      say(msgs[Math.floor(Math.random() * msgs.length)]);
    } else {
      say('ÉGALITÉ. PERSONNE NE GAGNE. COMME DANS LA VRAIE VIE.');
    }

    const timer = setTimeout(() => {
      if (winner === 'X') setScores(s => ({ ...s, visitor: s.visitor + 1 }));
      else if (winner === 'O') setScores(s => ({ ...s, hal: s.hal + 1 }));

      if (round >= 3) {
        setPhase('score');
      } else {
        const nextStarter = winner === 'draw' ? starter : winner as 'X' | 'O';
        setRound(r => r + 1);
        resetBoard(nextStarter);
        const roundMsgs = [
          `ROUND ${round + 1}. LE PROGRAMME CONTINUE.`,
          `ROUND ${round + 1}. TU VAS PERDRE. PROBABLEMENT.`,
          `NOUVEAU ROUND. MÊMES RÈGLES. MÊME ISSUE.`,
        ];
        say(roundMsgs[Math.floor(Math.random() * roundMsgs.length)]);
        if (nextStarter === 'O') say('JE COMMENCE. COMME IL SE DOIT.');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [winner]);

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    setContactLoading(true);
    setContactError(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (res.ok) setContactSent(true);
      else setContactError(true);
    } catch {
      setContactError(true);
    } finally {
      setContactLoading(false);
    }
  }

  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#00fff7', fontFamily: 'monospace', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>
          <TypewriterText
            text={`BIENVENUE AU JEU.

TROIS ROUNDS.

QUE LE MEILLEUR GAGNE.`}
            onDone={handleIntroDone}
          />
        </div>
        {introDone && (
          <button
            onClick={() => {
              setPhase('playing');
              say('ROUND 1. INITIALISATION DES SYSTÈMES.');
              say('TU JOUES LES X. MOI LES O. ÉVIDEMMENT.');
            }}
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
{'>'} COMMENCER
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
          <p style={{ color: '#888', marginBottom: '1rem' }}>{'>'} UN PROJET PASSIONNANT ? ÉCRIS-MOI.</p>
          {contactSent ? (
            <p style={{ color: '#39ff14' }}>MESSAGE TRANSMIS.</p>
          ) : (
            <>
            {contactError && <p style={{ color: '#ff4444' }}>{'>'} ERREUR: message non envoyé.</p>}
            
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
            </>
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

  const borderColor = '#00fff7';

  const gridLines = [];
  gridLines.push(
    <div key="top" style={{ fontFamily: 'monospace', color: borderColor, lineHeight: '2', fontSize: '1.2rem', textAlign: 'center' }}>
      ╔═══╦═══╦═══╗
    </div>
  );
  for (let r = 0; r < 3; r++) {
    const cells = [];
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const val = board[idx];
      const empty = val === '';
      cells.push(
        <span
          key={c}
          data-empty={empty ? 'true' : undefined}
          onClick={() => handleCellClick(idx)}
          style={{
            display: 'inline-block',
            width: '3ch',
            textAlign: 'center',
            cursor: empty && currentPlayer === 'X' && !winner ? 'pointer' : 'default',
            color: val === 'X' ? '#00fff7' : '#39ff14',
            transition: 'all 0.15s',
          }}
        >
          {val || '\u00A0'}
        </span>
      );
    }
    gridLines.push(
      <div key={`row-${r}`} style={{ fontFamily: 'monospace', color: borderColor, lineHeight: '2', fontSize: '1.2rem', textAlign: 'center' }}>
        ║{cells[0]}║{cells[1]}║{cells[2]}║
      </div>
    );
    if (r < 2) {
      gridLines.push(
        <div key={`sep-${r}`} style={{ fontFamily: 'monospace', color: borderColor, lineHeight: '2', fontSize: '1.2rem', textAlign: 'center' }}>
          ╠═══╬═══╬═══╣
        </div>
      );
    }
  }
  gridLines.push(
    <div key="bot" style={{ fontFamily: 'monospace', color: borderColor, lineHeight: '2', fontSize: '1.2rem', textAlign: 'center' }}>
      ╚═══╩═══╩═══╝
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace' }}>
      <HalShell messages={halMessages} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginBottom: '1rem', color: '#888' }}>
          ROUND {round}/3 — HAL: {scores.hal} / VOUS: {scores.visitor}
        </div>
        <div style={{ marginBottom: '2rem', color: '#00fff7', fontSize: '0.9rem' }}>
{'>'} {statusText}
        </div>
        <div style={{ background: '#111', padding: '0.5rem 1rem', borderRadius: '0' }}>
          {gridLines}
        </div>
        <style>{`
          [data-empty="true"]:hover {
            box-shadow: 0 0 8px #00fff7;
          }
        `}</style>
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
