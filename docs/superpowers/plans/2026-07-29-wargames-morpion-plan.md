# Wargames Morpion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After 10s idle in chat, HAL-9000 proposes tic-tac-toe → user redirected to `/wargames` for 3 rounds → score + contact form displayed.

**Architecture:** Pure frontend React game with minimax AI, contact form POSTs to Astro API route, chat idle timer triggers redirect.

**Tech Stack:** React 19, Astro 7 API routes, minimax algorithm, JSON file storage.

## Global Constraints

- All French content
- Colors: background `#0a0a0a`, text `#f0f0f0`, accent `#00fff7`, green `#39ff14`
- Font: monospace throughout
- Responsive (grid + form adapt on mobile)

---

### Task 1: Contact data store + API route

**Files:**
- Create: `src/data/contact.json`
- Create: `src/pages/api/contact.ts`

**Interfaces:**
- Produces: `GET /api/contact` returns JSON array; `POST /api/contact` accepts `{ name, email, message }`, appends to file

- [ ] **Step 1: Create contact.json**

```json
[]
```

- [ ] **Step 2: Create API route**

`src/pages/api/contact.ts`:
```ts
import type { APIRoute } from 'astro';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

const DATA_FILE = join(process.cwd(), 'src/data/contact.json');

export const GET: APIRoute = async () => {
  const data = await readFile(DATA_FILE, 'utf-8');
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, email, message } = body;
  const entries = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  entries.push({ name, email, message, date: new Date().toISOString() });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 3: Build check**

```bash
bun run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/contact.json src/pages/api/contact.ts
git commit -m "feat: add contact API route with JSON storage"
```

---

### Task 2: Minimax engine

**Files:**
- Create: `src/components/wargames/minimax.ts`

**Interfaces:**
- Consumes: board state `string[]` (9 elements, `''` for empty, `'X'` / `'O'`)
- Produces: `getBestMove(board, player, forceUnder?) => number` (0-8 index)

- [ ] **Step 1: Create minimax.ts**

```ts
export const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export function checkWinner(board: string[]): string | null {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function isBoardFull(board: string[]): boolean {
  return board.every(c => c !== '');
}

function minimax(
  board: string[],
  depth: number,
  isMaximizing: boolean,
  ai: string,
  human: string,
): number {
  const winner = checkWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        best = Math.max(best, minimax(board, depth + 1, false, ai, human));
        board[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = human;
        best = Math.min(best, minimax(board, depth + 1, true, ai, human));
        board[i] = '';
      }
    }
    return best;
  }
}

function getOptimalMove(board: string[], ai: string, human: string): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function getUnderMove(board: string[], ai: string, human: string): number {
  const empty = board.reduce<number[]>((acc, c, i) => (c === '' ? [...acc, i] : acc), []);
  const optimal = getOptimalMove(board, ai, human);
  const nonOptimal = empty.filter(i => i !== optimal);
  if (nonOptimal.length === 0) return optimal;
  return nonOptimal[Math.floor(Math.random() * nonOptimal.length)];
}

export function getBestMove(
  board: string[],
  player: string,
  forceUnder = false,
): number {
  const ai = 'O';
  const human = 'X';
  if (forceUnder) return getUnderMove(board, ai, human);
  return getOptimalMove(board, ai, human);
}
```

- [ ] **Step 2: Build check**

```bash
bun run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/wargames/minimax.ts
git commit -m "feat: add minimax engine with optional under-play mode"
```

---

### Task 3: WargamesGame React component

**Files:**
- Create: `src/components/wargames/WargamesGame.tsx`

**Interfaces:**
- Consumes: `minimax.ts` functions
- Renders: full game experience with 3 phases (intro, playing, score)

- [ ] **Step 1: Create WargamesGame.tsx**

```tsx
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
```

- [ ] **Step 2: Build check**

```bash
bun run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/wargames/WargamesGame.tsx
git commit -m "feat: add WargamesGame component with minimax, 3 rounds, score, contact form"
```

---

### Task 4: Wargames page

**Files:**
- Create: `src/pages/wargames.astro`

- [ ] **Step 1: Create wargames.astro**

```astro
---
import WargamesGame from '../components/wargames/WargamesGame';
---

<WargamesGame client:only />
```

- [ ] **Step 2: Build check**

```bash
bun run build
```
Expected: no errors, route `/wargames` prerendered.

- [ ] **Step 3: Commit**

```bash
git add src/pages/wargames.astro
git commit -m "feat: add /wargames page"
```

---

### Task 5: ChatBot idle timer + game proposal

**Files:**
- Modify: `src/components/chatbot/ChatBot.tsx`

- [ ] **Step 1: Add idle timer state and refs to ChatBot.tsx**

Add after `const inputRef = useRef<HTMLInputElement>(null);`:
```tsx
const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [gameProposed, setGameProposed] = useState(false);
```

- [ ] **Step 2: Add idle timer logic in handleTypeDone**

Replace existing `handleTypeDone`:
```tsx
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
}, []);
```

- [ ] **Step 3: Cancel idle on user input**

In `handleSubmit`, after `setTypingIndex(null)`, add:
```tsx
if (idleRef.current) clearTimeout(idleRef.current);
if (gameProposed) {
  if (input.trim().toLowerCase().startsWith('oui')) {
    window.location.href = '/wargames';
    return;
  }
  setGameProposed(false);
}
```

- [ ] **Step 4: Build check**

```bash
bun run build
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/chatbot/ChatBot.tsx
git commit -m "feat: add 10s idle timer and game proposal to chatbot"
```
