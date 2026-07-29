# Wargames — Tic-Tac-Toe HAL-9000

## Objectif
Après 10s d'inactivité dans le chat, HAL-9000 propose une partie de morpion.
Si le visiteur accepte, redirection vers `/wargames` pour 3 rounds.
Le visiteur doit gagner au moins une fois. Score + formulaire de contact affiché à la fin.

## Composants

### ChatBot — idle timer
- Après `handleTypeDone` (typewriter fini), lancer un `setTimeout` de 10s
- Si l'utilisateur tape un message avant les 10s → annuler le timer
- Si le timer expire → HAL-9000 envoie un message : "> Veux-tu jouer à un jeu, Dave ?" + un callback bouton "JOUER" ou l'utilisateur tape "oui"
- Si oui → `window.location.href = '/wargames'`

### `/src/pages/wargames.astro`
- Layout terminal retro plein écran (noir, fond `#0a0a0a`)
- Importe `<WargamesGame />` en `client:only`
- Pas de nav, pas de footer — juste le jeu qui prend tout l'écran

### `/src/components/wargames/WargamesGame.tsx`
Composant React qui gère toute la logique.

**États :**
- `phase: 'intro' | 'playing' | 'score'`
- `round: 1 | 2 | 3`
- `board: string[3][3]` ('X' | 'O' | '')
- `currentPlayer: 'X' | 'O'` (X = visiteur, O = HAL)
- `scores: { hal: number, visitor: number }`
- `halPlaysUnder: boolean` — true pour le round où HAL doit perdre

**Écrans :**
1. **Intro** — texte défilant façon terminal : "BIENVENUE AU JEU. TROIS ROUNDS. QUE LE MEILLEUR GAGNE."
2. **Playing** — grille 3×3 cliquable, tour par tour
3. **Score** — scores affichés, puis formulaire contact, puis lien retour au chat

### IA (Minimax avec "bienveillance forcée")
- Un round sur 3 (déterminé aléatoirement à la création) : HAL choisit des coups sous-optimaux
- Les autres rounds : minimax optimal (HAL ne peut pas perdre)
- Règle : le visiteur DOIT pouvoir gagner au moins une partie

### Grille
- CSS grid 3×3
- Couleur X : `#00fff7` (cyan), O : `#39ff14` (vert)
- Bordures en caractères `║` et `═══` pour l'aspect terminal
- Au survol : léger glow cyan sur les cases libres

### Formulaire de contact
- 3 champs : **Nom**, **Email**, **Message**
- Style terminal (input transparent, police monospace, `$` prompt)
- POST vers `/api/contact`
- Après envoi : message de confirmation "MESSAGE TRANSMIS."
- Lien "> Revenir au chat" → `/`

### `/src/pages/api/contact.ts`
```ts
import type { APIRoute } from 'astro';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_FILE = join(process.cwd(), 'src/data/contact.json');

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const entries = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  entries.push({ ...body, date: new Date().toISOString() });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  return new Response(JSON.stringify({ ok: true }));
};
```

### Stockage
- Fichier `src/data/contact.json` — tableau JSON
- Créer le fichier vide `[]` au démarrage

## Non-fonctionnel
- Police : monospace (`ui-monospace, monospace`)
- Background : `#0a0a0a`, texte : `#f0f0f0`
- Accent : `#00fff7`
- Responsive : la grille et le formulaire s'adaptent en mobile
