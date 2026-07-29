# Chatbot Rétro 90s avec Groq — Spec Design

**Date :** 2026-07-29
**Base :** portfolio-retro-90s branch
**Stack :** React 19 (déjà installé), Astro 7 hybrid mode, Groq API (via `groq-sdk`)

---

## 1. Architecture

```
src/
├── components/
│   └── chatbot/
│       └── ChatBot.tsx          # React component client-side
├── pages/
│   └── api/
│       └── chat.ts              # API endpoint server-side
```

**Mode Astro :** `hybrid` (static par défaut, routes API en server-side).

**Flux :**
1. User tape un message dans ChatBot React
2. ChatBot envoie un POST à `/api/chat` avec `{ messages: [{role, content}] }`
3. L'endpoint Astro forwarde à Groq API avec le system prompt
4. La réponse Groq est retournée au client
5. ChatBot affiche la réponse avec animation "typing" rétro

---

## 2. Component React : ChatBot.tsx

**Props :** aucune (self-contained)

**State :**
- `messages: { role: 'user' | 'assistant', content: string }[]`
- `input: string`
- `isLoading: boolean`

**UI :**
- Barre fixe en bas de page (`fixed bottom-0`)
- Fond noir `#0a0a0a`, bordures cyan `#00fff7` (style retro)
- Messages : vert terminal `#39ff14` sur fond noir
- Préfixe bot : `> `, préfixe user : `$ `
- Input : champ texte avec préfixe terminal `$ _`
- Scroll auto vers le bas
- Animation : points clignotants style "chargement 90s" pendant la réponse
- Hauteur max ~200px, scrollable si trop de messages

---

## 3. API Endpoint : `/api/chat`

**Méthode :** POST
**Body :** `{ messages: { role: 'user' | 'assistant', content: string }[] }`
**Response :** `{ content: string }`

**Logique :**
1. Reçoit l'historique des messages
2. Ajoute le system prompt en tête
3. Appelle Groq (modèle : `llama-3.3-70b-versatile`)
4. Retourne la réponse

**System prompt :**
```
Tu es ORDI-9000, un assistant rétro des années 90 intégré au portfolio de [Prénom]. Ton rôle :
- Réponds aux questions sur le portfolio (projets, compétences, contact)
- Tu peux répondre à des questions techniques basiques liées au dev
- Ajoute une touche rétro 90s (références, blagues geek, style "ordinateur")
- Reste concis (max 3-4 phrases)
- Si on te demande quelque chose hors-sujet ou inapproprié, réponds : "ERREUR 404 : sujet non trouvé. Redirection vers le chat principal."
- Utilise du français
```

**Clé API :** `GROQ_API_KEY` en variable d'environnement.

---

## 4. Configuration

**astro.config.mjs :** passage en mode `hybrid` :
```js
export default defineConfig({
  output: 'hybrid',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

**Dépendance à ajouter :** `groq-sdk` (npm)

---

## 5. Style

- Barre de chat : `fixed bottom-0 left-0 right-0`, hauteur auto (max 300px)
- Bordure haute avec effet retro (rainbow ou cyan)
- Messages en `font-mono`
- Input : style terminal (curseur clignotant)
- Fond de la barre : `bg-black` avec bordures retro
- Bouton/envoyer : touche Entrée (pas de bouton visible)

---

## 6. Non-fonctionnel

- Clé API en variable d'environnement (jamais en dur)
- Appel API avec timeout (5 secondes)
- Gestion d'erreur 429 (rate limit / plus de tokens) : répondre un message drôle façon 90s, ex: "ORDI-9000: MÉMOIRE VIVE PLEINE ! 🧨 *bruit de disque dur qui souffre* Réessaie dans quelques secondes, je dois défragmenter."
- Gestion d'erreur réseau : message "ERREUR: connexion au serveur perdue" si Groq est inaccessible
- Hydratation : `<ChatBot client:only="react" />` (uniquement côté client)
