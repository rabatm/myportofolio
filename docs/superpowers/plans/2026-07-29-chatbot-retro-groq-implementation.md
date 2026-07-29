# Chatbot Rétro Groq — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a retro 90s chatbot to the portfolio footer, powered by Groq API (Llama 3.3 70B).

**Architecture:** React component for the chat UI (`client:only`), Astro API route (`/api/chat`) as server-side proxy to Groq. Astro in `hybrid` mode (static pages + server endpoints).

**Tech Stack:** React 19, Groq SDK, Astro 7 (hybrid mode), Tailwind CSS 4

## Global Constraints

- `client:only="react"` for the ChatBot component (no SSR — this is client-side interactivity)
- Groq model: `llama-3.3-70b-versatile`
- API key via `GROQ_API_KEY` environment variable
- System prompt: ORDI-9000 persona, French, retro 90s tone, max 3-4 sentences, 404 for off-topic
- On 429 (rate limit): respond with a funny retro 90s message about memory full
- Astro config: `output: 'hybrid'` in `astro.config.mjs`
- Responsive: chat bar full width on mobile

---

## File Structure

```
src/
├── components/
│   └── chatbot/
│       └── ChatBot.tsx
├── pages/
│   └── api/
│       └── chat.ts
```

**Modified files:**
- `astro.config.mjs` (set output to hybrid)
- `src/layouts/BaseLayout.astro` (add ChatBot before footer)
- `.env.example` (document GROQ_API_KEY)

---

### Task 1: Backend — API Endpoint + Config

**Files:**
- Create: `src/pages/api/chat.ts`
- Create: `.env.example`
- Modify: `astro.config.mjs` (add `output: 'hybrid'`)

Dependencies: Install `groq-sdk`

- [ ] **Step 1: Install groq-sdk**

```bash
bun add groq-sdk
```

- [ ] **Step 2: Update `astro.config.mjs` to hybrid mode**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 3: Create `.env.example`**

```
# Groq API key for the retro chatbot
# Get yours at https://console.groq.com
GROQ_API_KEY=
```

- [ ] **Step 4: Create `src/pages/api/chat.ts`**

```ts
import type { APIRoute } from 'astro';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Tu es ORDI-9000, un assistant rétro des années 90 intégré au portfolio de [Prénom]. Ton rôle :
- Réponds aux questions sur le portfolio (projets, compétences, contact)
- Tu peux répondre à des questions techniques basiques liées au dev
- Ajoute une touche rétro 90s (références, blagues geek, style "ordinateur")
- Reste concis (max 3-4 phrases)
- Si on te demande quelque chose hors-sujet ou inapproprié, réponds : "ERREUR 404 : sujet non trouvé. Redirection vers le chat principal."
- Utilise du français`;

const RATE_LIMIT_MESSAGE = "ORDI-9000: MÉMOIRE VIVE PLEINE ! 🧨 *bruit de disque dur qui souffre* Réessaie dans quelques secondes, je dois défragmenter.";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err?.status === 429) {
      return new Response(JSON.stringify({ content: RATE_LIMIT_MESSAGE }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ content: 'ERREUR: connexion au serveur perdue. Réessaie plus tard.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 5: Verify build for API route**

Run: `bun run build`
Expected: Build completes. The API route is server-only so it won't error.

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs src/pages/api/chat.ts .env.example && git commit -m "feat: add Groq chatbot API endpoint with hybrid mode"
```

---

### Task 2: Frontend — React ChatBot Component

**Files:**
- Create: `src/components/chatbot/ChatBot.tsx`
- Modify: `src/layouts/BaseLayout.astro` (add ChatBot before footer)

- [ ] **Step 1: Create `src/components/chatbot/ChatBot.tsx`**

```tsx
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
```

- [ ] **Step 2: Update `src/layouts/BaseLayout.astro`**

Add import and component before the footer:

```astro
---
import '../styles/retro.css';
import ChatBot from '../components/chatbot/ChatBot.tsx';

export interface Props {
  title: string;
  description?: string;
}

const { title, description = "Portfolio rétro années 90" } = Astro.props;
---

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <style>@import "tailwindcss";</style>
  </head>
  <body class="min-h-screen">
    <div class="scanlines"></div>

    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style="background: rgba(10,10,10,0.85); border-bottom: 1px solid #333;">
      <a href="/" class="text-xl font-bold" style="color: #00fff7;">M</a>
      <div class="flex gap-6 text-sm">
        <a href="/" class="hover:underline" style="color: #888;">Accueil</a>
        <a href="/projets" class="hover:underline" style="color: #888;">Projets</a>
        <a href="/blog" class="hover:underline" style="color: #888;">Blog</a>
        <a href="/contact" class="hover:underline" style="color: #888;">Contact</a>
      </div>
    </nav>

    <main>
      <slot />
    </main>

    <ChatBot client:only="react" />

    <footer class="text-center py-8" style="color: #555; border-top: 1px solid #222;">
      <p class="text-sm">© 2026 — Portfolio rétro 90s</p>
    </footer>
  </body>
</html>
```

- [ ] **Step 3: Verify build**

Run: `bun run build`
Expected: Build completes with all 6 pages + API route

- [ ] **Step 4: Commit**

```bash
git add src/components/chatbot/ChatBot.tsx src/layouts/BaseLayout.astro && git commit -m "feat: add retro chatbot React component"
```
