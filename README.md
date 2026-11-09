# Portfolio Rétro 90s — Martin

```
╔══════════════════════════════════════════════╗
║  C:\MARTIN\PORTFOLIO> _                       ║
║  Chargement du CV... [########--] 90s STYLE   ║
╚══════════════════════════════════════════════╝
```

![Aperçu du site](img/rabatmartin.png)

Bienvenue dans le dépôt de mon portfolio perso, thème 90s assumé. C'est du code
public : copie-le, forke-le, pique ce qui te plaît, améliore ce qui te semble
moche. Aucune obligation de me créditer, mais un petit mot fait toujours
plaisir si tu t'en sers.

Un détail qui sort du lot : le site embarque un agent conversationnel façon
Marvin-42 (voir `src/pages/api/chat.ts`), branché sur Mistral, qui répond aux
questions des visiteurs à partir des vraies données du portfolio (parcours,
compétences, témoignages) — pas d'improvisation, il ne répond que sur ce qui
est réellement dans le repo.

Et pour les curieux qui fouillent : il y a aussi un easter egg planqué sur
`/wargames`, un morpion contre une IA imbattable (minimax), dans un terminal
façon WOPR/WarGames. Shall we play a game?

Portfolio développé avec [Astro](https://astro.build) 7, Tailwind CSS 4, React 19 et Bun.

## Ajouter du contenu

### Parcours (timeline carrière)

Fichier : `src/data/parcours.ts`

```ts
{
  periode: "2024—2025",
  titre: "Ton poste",
  entreprise: "Nom de l'entreprise",
  desc: "Description de ce que tu as fait.",
}
```

Les entrées s'affichent dans l'ordre du tableau (de la plus récente à la plus ancienne).

Le fichier exporte un `Record<Lang, ...>` : un bloc `fr` et un bloc `en`, à tenir
alignés (mêmes entrées, même ordre). `bun run test` (`src/data/parity.test.ts`)
vérifie cette parité et échoue si les deux langues divergent.

### Compétences

Fichier : `src/data/skills.ts`

```ts
export const skills: Record<Lang, Record<string, string[]>> = {
  fr: {
    Frontend: ["HTML", "CSS", "JavaScript"],
    Backend: ["Node.js", "Python"],
    Design: ["Figma"],
    Outils: ["Git", "VS Code"],
  },
  en: {
    Frontend: ["HTML", "CSS", "JavaScript"],
    Backend: ["Node.js", "Python"],
    Design: ["Figma"],
    Tools: ["Git", "VS Code"],
  },
};
```

Ajoute/modifie des catégories et des listes de compétences librement, en gardant
le bloc `en` aligné sur le bloc `fr` (même vérifié par `bun run test`).

### Projets

Crée un fichier `.md` dans `src/content/projects/fr/` puis, sa traduction, sous le
même nom dans `src/content/projects/en/` — le plus simple est de copier le
template complet `docs/templates/projet.md` (sections prêtes à remplir) :

```md
---
title: "Nom du projet"
date: 2026-07-20
tags: ["React", "Node.js"]
description: "Courte description du projet."
image: "../images/nom-du-projet/thumbnail.jpg"   # optionnel, chemin relatif au .md
url: "https://exemple.com"      # optionnel
github: "https://github.com/..." # optionnel
services: [web, integration]    # web | mobile | automation | integration | maintenance
kind: client                    # client (défaut) | atelier (projet perso)
featured: 1                     # optionnel : rang sur l'accueil (1 = premier)
---

## Contexte
…
```

- `services` alimente le filtre de `/projets` (un bouton n'apparaît que si un
  projet client au moins le porte) et les « preuves » de `/services`.
- `kind: client` impose le plan `Contexte` / `Le besoin` / `La solution` /
  `Fonctionnalités` / (`Résultats`, seulement si un résultat est documenté) /
  `Côté technique` (EN : `Context`, `The need`, `The solution`, `Features`,
  `Results`, `Under the hood`) ; `bun run test` le vérifie. Un projet
  `kind: atelier` (projet perso) a un plan libre et apparaît dans la section
  « Atelier » de `/projets`.
- `featured` choisit les réalisations mises en avant sur l'accueil (3 au maximum).

Les projets s'affichent du plus récent au plus ancien. Sans version anglaise
(même nom de fichier absent de `en/`), la page EN affiche le texte français
avec un badge signalant qu'il n'est pas encore traduit.

#### Images

Convention de rangement : un sous-dossier par projet dans
`src/content/projects/images/<slug>/` (où `<slug>` = nom du fichier `.md`, sans
l'extension). Les fiches `fr/` et `en/` partagent les mêmes images et les
référencent **en chemin relatif** : `../images/<slug>/…`.

La vignette utilisée sur l'accueil et la liste des projets va dans `image`
(ex. `image: "../images/nom-du-projet/thumbnail.jpg"`). Pas encore d'image ?
Retire simplement le champ `image` : les initiales du projet s'affichent à la
place. Un chemin vers un fichier inexistant, lui, fait échouer le build — c'est
voulu, pour ne jamais publier une image cassée.

Pour des captures dans le corps de l'article (section "Visuels" par exemple),
utilise la syntaxe Markdown, toujours en relatif :

```md
![Description de la capture](../images/nom-du-projet/capture.jpg)
```

Pas besoin de redimensionner ni de convertir : au build, Astro génère des
versions WebP/AVIF à plusieurs tailles et le navigateur choisit la bonne. Les
images restent agrandies au clic (lightbox). Dépose tes originaux tels quels
(PNG ou JPEG).

Seuls `public/og-image.jpg` et `public/favicon.ico` restent dans `public/` :
ils doivent garder une URL fixe.

### Services, à propos, coordonnées

- Catalogue des 5 services (FR + EN) : `src/data/services.ts`.
- Page À propos : `src/data/about.ts` (les faits viennent de `parcours.ts`).
- Email public, ville, etc. : `src/data/site.ts` (`CONTACT_EMAIL`, une seule fois).

### Articles de blog

Crée un fichier `.md` dans `src/content/blog/fr/` puis, sa traduction, sous le
même nom dans `src/content/blog/en/` :

```md
---
title: "Titre de l'article"
date: 2026-07-29
tags: ["dev", "rétro"]
description: "Accroche de l'article."
---

## Contenu

Ton article en Markdown…
```

Même règle de repli que pour les projets : sans traduction, la page EN affiche
le texte français avec un badge.

## Développement

```bash
bun install
bun run dev        # serveur local sur localhost:4321
bun run build      # build de production dans dist/
bun run preview    # prévisualisation du build
```

Le mode dev se lance en arrière-plan avec `astro dev --background`.
