import { useState, useEffect, useCallback, useRef } from 'react';
import { getBestMove, checkWinner, isBoardFull } from './minimax';
import MarvinShell from './MarvinShell';
import type { FormEvent } from 'react';
import { wargamesLines } from '../../data/wargamesLines';
import { t } from '../../i18n/ui';
import { buildPath, fmt, type Lang } from '../../i18n/utils';

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

export default function WargamesGame({ lang = 'fr' }: { lang?: Lang }) {
  const d = t(lang);
  const lignes = wargamesLines[lang];
  const accueil = buildPath('home', lang);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'score'>('intro');
  const [round, setRound] = useState(1);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [starter, setStarter] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ hal: 0, visitor: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [underRound] = useState(() => Math.floor(Math.random() * 3));
  // Début de la visite : l'API rejette les envois trop rapides pour être humains.
  const [arrivee] = useState(() => performance.now());

  const [contact, setContact] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [marvinMessages, setMarvinMessages] = useState<string[]>([]);
  const [effect, setEffect] = useState<'glitch' | 'flash' | 'flicker' | null>(null);

  function say(msg: string) {
    setMarvinMessages(prev => [...prev, msg]);
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
    const visitMsgs = lignes.visitorMove;
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
      const marvinMsgs = round - 1 === underRound ? [...lignes.marvinMove, lignes.maintenance] : lignes.marvinMove;
      say(marvinMsgs[Math.floor(Math.random() * marvinMsgs.length)]);
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
      setEffect('glitch');
      say(lignes.visitorWins[0]);
      setTimeout(() => say(lignes.visitorWins[1]), 500);
    } else if (winner === 'O') {
      setEffect('flash');
      const msgs = lignes.marvinWins;
      say(msgs[Math.floor(Math.random() * msgs.length)]);
    } else {
      setEffect('flicker');
      const msgs = lignes.draw;
      say(msgs[Math.floor(Math.random() * msgs.length)]);
    }
    const effectTimer = setTimeout(() => setEffect(null), 500);

    const timer = setTimeout(() => {
      if (winner === 'X') setScores(s => ({ ...s, visitor: s.visitor + 1 }));
      else if (winner === 'O') setScores(s => ({ ...s, hal: s.hal + 1 }));

      if (round >= 3) {
        setPhase('score');
      } else {
        const nextStarter = winner === 'draw' ? starter : winner as 'X' | 'O';
        setRound(r => r + 1);
        resetBoard(nextStarter);
        const roundMsgs = lignes.nextRound.map((l) => fmt(l, { n: round + 1 }));
        say(roundMsgs[Math.floor(Math.random() * roundMsgs.length)]);
        if (nextStarter === 'O') say(lignes.marvinStarts);
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
      clearTimeout(effectTimer);
    };
  }, [winner]);

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    // Champ piège, non contrôlé : seul un robot le remplit.
    const website = new FormData(e.currentTarget as HTMLFormElement).get('website');
    setContactLoading(true);
    setContactError(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, lang, website, elapsedMs: Math.round(performance.now() - arrivee) }),
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
            text={d['wargames.intro']}
            onDone={handleIntroDone}
          />
        </div>
        {introDone && (
          <>
          <button
            onClick={() => {
              setPhase('playing');
              lignes.roundOneStart.forEach(say);
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
{'>'} {d['wargames.start']}
          </button>
          <a
            href={accueil}
            style={{ color: '#555', marginTop: '1.5rem', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {d['wargames.back']}
          </a>
          </>
        )}
      </div>
    );
  }

  if (phase === 'score') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace', padding: '2rem' }}>
        <h1 style={{ color: '#00fff7', fontSize: '1.8rem', marginBottom: '1rem' }}>{d['wargames.finalScore']}</h1>
        <p style={{ color: '#00fff7', fontSize: '1.2rem' }}>MARVIN-42: {scores.hal}</p>
        <p style={{ color: '#39ff14', fontSize: '1.2rem' }}>{d['wargames.visitor']}: {scores.visitor}</p>
        <p style={{ color: '#f0f0f0', fontSize: '1rem', marginTop: '1rem' }}>
          {scores.visitor > scores.hal
            ? d['wargames.endWin']
            : scores.visitor === scores.hal
              ? d['wargames.endDraw']
              : d['wargames.endLose']}
        </p>

        <div style={{ marginTop: '2rem', width: '100%', maxWidth: '400px' }}>
          <p style={{ color: '#888', marginBottom: '1rem' }}>{'>'} {d['wargames.contactPrompt']}</p>
          {contactSent ? (
            <p style={{ color: '#39ff14' }}>{d['wargames.contactSent']}</p>
          ) : (
            <>
            {contactError && <p style={{ color: '#ff4444' }}>{'>'} {d['wargames.contactError']}</p>}
            
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#39ff14' }}>$</span>
                <input
                  value={contact.name}
                  onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                  placeholder={d['wargames.name']}
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
                {contactLoading ? d['wargames.sending'] : d['wargames.submit']}
              </button>
            </form>
            </>
          )}
        </div>

        <a
          href={accueil}
          style={{ color: '#888', marginTop: '2rem', textDecoration: 'none', fontFamily: 'monospace' }}
        >
          {d['wargames.backChat']}
        </a>
      </div>
    );
  }

  const statusText = winner
    ? winner === 'draw'
      ? d['wargames.statusDraw']
      : winner === 'X'
        ? d['wargames.statusVisitorWins']
        : d['wargames.statusMarvinWins']
    : currentPlayer === 'X'
      ? d['wargames.statusYourTurn']
      : d['wargames.statusThinking'];

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
    <div
      className={effect === 'glitch' ? 'wg-shake' : undefined}
      style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace', position: 'relative' }}
    >
      {effect === 'flash' && (
        <>
          <div className="wg-flash" />
          <div className="wg-scanline" />
        </>
      )}
      <MarvinShell messages={marvinMessages} lang={lang} />
      <div
        className={effect === 'glitch' ? 'wg-glitch-text' : effect === 'flicker' ? 'wg-flicker' : undefined}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ marginBottom: '1rem', color: '#888' }}>
          ROUND {round}/3 — MARVIN: {scores.hal} / {d['wargames.you']}: {scores.visitor}
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
          @keyframes wg-shake-kf {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          .wg-shake {
            animation: wg-shake-kf 0.4s ease;
          }
          @keyframes wg-glitch-kf {
            0%, 100% { opacity: 1; transform: translate(0, 0); }
            20% { opacity: 0.6; transform: translate(-2px, 1px); color: #ff4444; }
            40% { opacity: 1; transform: translate(2px, -1px); }
            60% { opacity: 0.7; transform: translate(-1px, 0); color: #ff4444; }
            80% { opacity: 1; transform: translate(1px, 1px); }
          }
          .wg-glitch-text {
            animation: wg-glitch-kf 0.4s ease;
          }
          @keyframes wg-flash-kf {
            0% { opacity: 0; }
            30% { opacity: 0.5; }
            100% { opacity: 0; }
          }
          .wg-flash {
            position: absolute;
            inset: 0;
            background: #00fff7;
            pointer-events: none;
            z-index: 10;
            animation: wg-flash-kf 0.4s ease;
          }
          @keyframes wg-scanline-kf {
            0% { top: 0%; opacity: 0.8; }
            100% { top: 100%; opacity: 0; }
          }
          .wg-scanline {
            position: absolute;
            left: 0;
            right: 0;
            height: 3px;
            background: #00fff7;
            box-shadow: 0 0 12px #00fff7;
            pointer-events: none;
            z-index: 11;
            animation: wg-scanline-kf 0.5s ease-out;
          }
          @keyframes wg-flicker-kf {
            0%, 100% { opacity: 1; }
            25% { opacity: 0.3; }
            50% { opacity: 1; }
            75% { opacity: 0.4; }
          }
          .wg-flicker {
            animation: wg-flicker-kf 0.4s ease;
          }
        `}</style>
        <a
          href={accueil}
          style={{ color: '#555', marginTop: '2rem', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
        >
          {d['wargames.back']}
        </a>
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
