# HAL Shell — Terminal Commentary

## Objectif
Ajouter un panneau terminal à gauche de la grille de morpion sur `/wargames` où HAL-9000 commente la partie en temps réel, style rétro 90s geek.

## Architecture
- **`src/components/wargames/HalShell.tsx`** — nouveau composant : panneau terminal scrollable
- **`WargamesGame.tsx`** — ajout d'un state `halMessages: string[]` + fonction `say(msg)` déclenchée sur chaque événement du jeu

## Messages HAL
Déclenchés sur :
- Début de round : "ROUND N. INITIALISATION."
- Tour visiteur : phrase aléatoire parmi un pool (5-6 variantes)
- Tour HAL : "ANALYSE EN COURS..." puis après coup : phrase aléatoire
- Victoire/défaite/égalité : messages dédiés
- UnderRound : "SÉQUENCE ALÉATOIRE... J'AI MAL AU PROCESSEUR."
- Entre rounds : références Wargames / 2001 / retro tech

## Style
- Panneau gauche : 40% largeur, fond `#0d0d0d`, texte `#39ff14`
- Scrollable, chaque message préfixé `> `, délai 300ms entre apparitions
- Police monospace, grille occupe les 60% restants

## Non-fonctionnel
- Mêmes couleurs que le reste du projet (`#0a0a0a`, `#00fff7`, `#39ff14`)
- Responsive : en mobile, le shell passe au-dessus de la grille
