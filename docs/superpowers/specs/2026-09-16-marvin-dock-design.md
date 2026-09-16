# MARVIN-42 — dock flottant à réplique spontanée

Date : 2026-09-16
Statut : validé, prêt pour plan d'implémentation
Origine : brief « Variante 2a » de Martin

## 1. Objectif

Faire de MARVIN-42 un assistant disponible sur tout le site sans qu'il
occupe en permanence le bas de l'écran. Le levier d'usage n'est pas un
bouton « Discuter » : c'est le ton de MARVIN. Une réplique s'échappe de
la pastille après quelques secondes et donne envie de répondre.

## 2. État actuel du dépôt

Le brief décrit un terminal pleine largeur placé dans le flux de la page
d'accueil, sous le hero. Ce n'est pas l'état du code. Aujourd'hui :

- `ChatBot.tsx:173` rend une barre fixe en bas d'écran, pleine largeur,
  `z-50`, toujours ouverte ;
- `BaseLayout.astro:76` la monte déjà sur toutes les pages qui utilisent
  le layout ;
- `index.astro` ne contient aucune section terminal — il n'y a rien à
  retirer du flux de la page d'accueil.

Les critères d'acceptation §9.1 et §9.3 du brief sont donc déjà
satisfaits. Le travail réel est le passage **barre permanente ouverte →
pastille repliée + bulle + panneau**, plus la persistance,
l'accessibilité et la variante mobile.

Un second système existe et n'est pas couvert par le brief :
`src/data/marvinLines.ts` fournit environ 25 répliques contextuelles,
jouées automatiquement à l'arrivée sur une page (`pageLine`) et au
défilement des sections (`IntersectionObserver`, `ChatBot.tsx:83-104`).
Ce mécanisme suppose un terminal visible en permanence.

## 3. Décisions

| # | Décision | Motif |
|---|---|---|
| D1 | La bulle est la surface d'affichage de `marvinLines` | Source unique pour les répliques ; pas de seconde liste à maintenir |
| D2 | La palette du §5 remplace le cyan-néon actuel | Sobriété : le néon saturé fatigue sur un panneau qu'on garde ouvert. Contraste : les deux palettes passent AAA (§7.1) |
| D3 | L'effet de frappe est conservé mais borné | Identité de MARVIN, sans pénaliser la lecture des réponses longues |
| D4 | Le panneau s'ouvre toujours sur la phrase de présentation | Comportement constant et prévisible, indépendant du chemin d'ouverture |
| D5 | Analytics via `CustomEvent`, pas de tiers | Zéro dépendance ; un listener de trois lignes suffira le jour venu |
| D6 | Une bulle par page, plafond de 3 par session | Le contextuel vit sans harceler |
| D7 | `sectionLines` et l'`IntersectionObserver` sont supprimés | Une règle unique — une bulle par page — sans exception à tester |
| D8 | La bulle est `aria-hidden`, sa croix `tabIndex={-1}` | Lecture littérale du §7 ; la bulle est une sollicitation, pas un contrôle |
| D9 | Vitest sur `usePeek` et `useMarvinThread`, en TDD | Les règles de session se vérifient mal à la main |

## 4. Périmètre

**Inclus** : refonte de la couche d'interface du chatbot en dock
(pastille, bulle, panneau), persistance du fil et des préférences,
accessibilité, variante mobile, événements analytics, première base de
tests du projet.

**Exclu** : le moteur de réponse et `src/pages/api/chat.ts` restent
inchangés. Aucune refonte du hero. Aucun changement sur `/wargames`.

**Exclusions assumées** :

- `/wargames` déclare son propre `<html>` (`wargames.astro:5`) et
  n'utilise pas `BaseLayout`. Le dock y est absent et le reste : sur
  cette page MARVIN *est* l'interface plein écran. Le critère §9.3
  « toutes les pages » se lit donc « toutes les pages du layout ».
  Corollaire : `pageLines['/wargames']` n'est lu par personne — code
  mort, à supprimer.
- `/contact` n'aura jamais de bulle (§4 du brief : ne pas concurrencer le
  formulaire). `contact.astro` cesse donc de passer `peekLines`, et
  `pageLines['/contact']` rejoint le code mort à supprimer. La condition
  correspondante de §6.2 est conservée comme garde-fou, au cas où la page
  repasserait des répliques un jour.
- `/blog/[slug]` ne passe aucune réplique (`blog/[slug].astro:17`). Les
  articles n'auront pas de bulle. Le mécanisme les acceptera sans
  modification de code : il suffira d'ajouter des lignes dans
  `marvinLines.ts`.

## 5. Architecture

### 5.1 Découpage

`ChatBot.tsx` (232 lignes mêlant minuteries, réseau, rendu et machine à
états) disparaît au profit de modules à responsabilité unique :

```
src/components/chatbot/
  MarvinDock.tsx      orchestrateur : états, montage, clavier, focus
  PeekBubble.tsx      la bulle et sa croix
  ChatPanel.tsx       barre de titre, historique, saisie, erreur/réessai
  TypewriterText.tsx  frappe à durée plafonnée
  useMarvinThread.ts  messages, sessionStorage, fetch, erreur/réessai
  usePeek.ts          règles de déclenchement de la bulle
  track.ts            émission des quatre événements analytics
```

`usePeek` et `useMarvinThread` sont testables sans DOM — c'est ce qui
rend D9 praticable.

### 5.2 Montage différé

`client:only="react"` devient **`client:idle`**. `client:only` télécharge
et hydrate immédiatement, à l'inverse du §8 ; `client:idle` rend la
pastille côté serveur — elle est dans le HTML, donc aucun décalage de
mise en page (§9.5) — et n'hydrate qu'à l'inactivité.

Contrainte imposée : le premier rendu ne touche ni `window` ni
`sessionStorage`. Tout accès au stockage et toute minuterie vivent dans
un `useEffect`. C'est tenable parce que l'état initial est toujours
`collapsed`.

### 5.3 Machine à états

Le §3 liste quatre états, mais `collapsed` et `dismissed` rendent la même
chose — une pastille seule. Les distinguer obligerait à dupliquer chaque
transition. Modélisation retenue :

```ts
panelOpen: boolean   // `open` vs. le reste
peek: string | null  // la réplique affichée, ou aucune
peekOff: boolean     // ce que le §3 nomme `dismissed`
```

Les quatre états du brief restent observables — `dismissed` vaut
`!panelOpen && peekOff` — mais chaque transition n'a qu'un chemin.

### 5.4 Contrat avec les pages

`BaseLayout` perd la prop `sectionLines` et voit `pageLine?: string`
devenir **`peekLines?: string[]`** : le tableau complet des répliques de
la page, et non une réplique déjà tirée.

Motif : aujourd'hui le tirage a lieu côté serveur (`pickLine` dans chaque
`.astro`). Si le sort tombe sur une réplique déjà vue, on ne peut plus en
choisir une autre — il faudrait renoncer à la bulle. En passant le
tableau, le client tire parmi les répliques non vues, ce qui rend le
« jamais deux fois la même dans la session » du §4 réellement tenable.
Effet de bord bienvenu : les pages redeviennent déterministes côté
serveur, donc mieux cachables.

`index.astro` passe `peekLines={pageLines['/']}`, nouvelle entrée
contenant les trois répliques de départ du §4. Les autres pages passent
`pageLines['/projets']`, `['/blog']`, `['/contact']`, ou `projectLines`
avec `{titre}` substitué.

## 6. Comportement

### 6.1 Persistance

| Clé | Stockage | Contenu |
|---|---|---|
| `marvin.thread` | session | les messages, plafonnés à 40, hors erreurs |
| `marvin.peek` | session | `{ pages: string[], lines: string[], count: number, off: boolean }` |
| `marvin.peek.optout` | local | horodatage d'expiration (+30 jours) |

Un seul objet JSON pour l'état de la bulle plutôt que quatre clés : une
lecture, une écriture, aucune désynchronisation possible entre le
compteur et les listes.

À la restauration, si `marvin.thread` est non vide, la phrase de
présentation n'est pas réinjectée — elle est déjà dans le fil.

### 6.2 Règles de la bulle

Conditions évaluées dans cet ordre à l'hydratation ; la bulle n'est
programmée que si toutes passent :

1. la page fournit des répliques ;
2. le chemin n'est pas `/contact` (§4) ;
3. `prefers-reduced-motion` est inactif (§4, §7) ;
4. `marvin.peek.optout` est absent ou expiré ;
5. `peek.off` est faux ;
6. `peek.count < 3` ;
7. ce chemin n'a pas déjà eu sa bulle ;
8. il reste au moins une réplique non vue.

Puis : minuterie de **6 s**, **réévaluation des conditions au
déclenchement** — le visiteur a pu ouvrir le panneau entre-temps —
affichage **12 s**, repli.

Transitions sortantes :

- croix de la bulle → `off: true` **et** opt-out local de 30 jours ;
- ouverture du panneau → `off: true` pour la session seule. Qui a ouvert
  le dock n'a plus besoin d'être sollicité.

### 6.3 Erreurs

Le fil accepte une troisième nature de message, `error`, rendue
« connexion perdue » avec un bouton **Réessayer** qui renvoie le dernier
message du visiteur. L'historique n'est jamais vidé. Les entrées `error`
sont exclues du contexte envoyé à Groq, comme le sont déjà les entrées
`auto` (`ChatBot.tsx:132`).

### 6.4 Analytics

`track(name, detail)` émet
`window.dispatchEvent(new CustomEvent('marvin:analytics', { detail }))`
et journalise en développement. Quatre points d'émission :

| Événement | Déclenchement | `detail` |
|---|---|---|
| `marvin_peek_shown` | la bulle s'affiche | `{ line, path }` |
| `marvin_peek_dismissed` | clic sur la croix | `{ path }` |
| `marvin_open` | ouverture du panneau | `{ source: 'pill' \| 'bubble', path }` |
| `marvin_message_sent` | envoi d'un message | `{ length, index }` |

## 7. Visuel

Valeurs du §5, déclarées en variables CSS dans `retro.css` plutôt qu'en
styles inline comme aujourd'hui.

| Élément | Valeur |
|---|---|
| Position | `fixed`, 24 px du bord droit et du bas |
| Empilement | `z-40` pour tout le dock, feuille mobile comprise |
| Pastille | 48 px, fond `#0F1C17`, glyphe `$_` en `#B9F6CE`, 15 px |
| Bulle / panneau | fond `#05120C`, bordure `#1E3A2A`, rayon 12 px, ombre basse et large |
| Texte MARVIN | `#35D97A` — saisie visiteur `#6FE3FF` — placeholder `#5C8F71` (voir §7.1) |
| Typographie | JetBrains Mono 13 px, interligne 1,7 — jamais sous 13 px |
| Cibles tactiles | pastille, croix, bouton d'envoi : 44 px minimum |
| Panneau | 360 × 480 px |

### 7.1 Contrastes mesurés

| Paire | Ratio | Verdict |
|---|---|---|
| `#B9F6CE` sur `#0F1C17` (glyphe de la pastille) | 14,3:1 | AAA |
| `#35D97A` sur `#05120C` (texte MARVIN) | 10,3:1 | AAA |
| `#6FE3FF` sur `#05120C` (saisie visiteur) | 12,8:1 | AAA |
| `#2A4C38` sur `#05120C` (placeholder) | **2,0:1** | **échoue AA** |

Le placeholder du §5 est inutilisable tel quel : à 2,0:1 il est quasiment
invisible, et WCAG 1.4.3 exige 4,5:1 dès lors qu'un texte porte de
l'information — ce qui est le cas de « Écris un message… ». Correction
retenue : **`#5C8F71`**, soit 4,6:1 sur `#05120C`, qui conserve la teinte
vert sourd voulue par le brief tout en restant lisible. À signaler à
Martin comme unique écart assumé aux valeurs du §5.

Pour mémoire, la palette actuelle passait elle aussi largement : `#39ff14`
sur `#0a0a0a` vaut 14,6:1. Le changement de D2 se justifie par la
sobriété, pas par l'accessibilité.

La nav est en `z-50` ; le dock est en bas à droite et ne la croise
jamais. Le brief mentionne « sous la nav mobile ouverte » : il n'y a pas
de menu mobile dans ce dépôt — la nav est une rangée flex sans
hamburger — donc rien à arbitrer.

**Police.** JetBrains Mono n'est pas chargée : `retro.css:1` n'importe
que Space Grotesk, et tout le « monospace » du site tombe sur la police
système. On ajoute `JetBrains+Mono:wght@400;700` à l'`@import` existant
— même requête, pas de connexion supplémentaire — et on déclare
`--font-mono: 'JetBrains Mono', ui-monospace, monospace` pour que le
repli reste propre pendant le `swap`.

**Animations.** Bulle : fondu et translation de 8 px, 240 ms. Panneau :
échelle 0,96 → 1 depuis le coin bas droit, 200 ms. Les deux sont
supprimées sous `prefers-reduced-motion`.

**Effet de frappe (D3).** Durée totale plafonnée à environ 2 s quelle que
soit la longueur — l'intervalle s'adapte au texte au lieu des 15 ms fixes
actuels. Un clic dans l'historique termine la frappe immédiatement.
Désactivé sous `prefers-reduced-motion` : le texte apparaît d'un bloc.

## 8. Mobile (moins de 640 px)

Pastille inchangée, bulle limitée à `calc(100vw - 96px)`.

À l'ouverture, le panneau devient une feuille ancrée en bas, pleine
largeur, hauteur **`80dvh` et non `80vh`** : c'est ce qui fait que la
feuille se réduit quand le clavier logiciel monte, au lieu de passer sous
lui. L'historique est en `flex-1 overflow-y-auto`, la saisie dans un pied
fixe avec `env(safe-area-inset-bottom)` — elle reste visible quoi qu'il
arrive. Poignée de fermeture en haut.

Le dialogue étant non modal, il n'y a pas de voile : on ferme par la
poignée ou par Échap.

## 9. Accessibilité

- Pastille : `<button>` avec `aria-expanded`, `aria-controls`, libellé
  « Ouvrir le chat MARVIN-42 » / « Fermer le chat MARVIN-42 ».
- Panneau : `role="dialog"`, `aria-modal="false"`, `aria-labelledby` sur
  la barre de titre. Focus sur la saisie à l'ouverture ; Échap ferme et
  rend le focus à la pastille.
- Historique : `aria-live="polite"`. Couplé au typewriter, il annoncerait
  le texte par fragments à chaque caractère — le span typographié est
  donc `aria-hidden`, doublé d'un jumeau visuellement masqué qui porte la
  phrase entière et n'apparaît qu'une fois la frappe terminée. Une
  annonce propre, une seule fois.
- Bulle (D8) : `aria-hidden="true"`, croix en `tabIndex={-1}`. **Un
  visiteur au clavier ou au lecteur d'écran ne perçoit jamais la bulle et
  ne peut pas la fermer.** C'est cohérent — on ne ferme pas ce qu'on ne
  perçoit pas — et la tabulation atteint directement la pastille, qui
  porte toute la fonction.
- `prefers-reduced-motion` : pas de bulle, pas d'animation d'ouverture,
  pas d'effet de frappe.

## 10. Contenu

Nouvelle entrée `pageLines['/']`, reprenant les répliques de départ du
§4 :

> Tu peux lire tout le site, ou me demander. Les deux me sont égaux.

> Je connais son parcours par cœur. Ce n'est pas un privilège.

> Vingt ans d'infrastructure avant le code. Pose la question, je
> développerai.

Suppressions dans `marvinLines.ts` : `sectionLines` (18 répliques, elles
commentaient des sections que le visiteur a déjà sous les yeux) et
`pageLines['/wargames']` (code mort). `projectLines` est conservé.

Premier message du panneau (D4), constant :

> Assistant portfolio. Pose-moi des questions, ou pas. Ça ne changera pas
> grand-chose à mon état.

## 11. Tests

Premier dispositif de test du projet : `vitest` et
`@testing-library/react` en dépendances de développement, script
`bun run test`. Développement en TDD.

`usePeek` :

- chacune des huit conditions du §6.2 bloque isolément la bulle ;
- l'opt-out de 30 jours bloque, et cesse de bloquer une fois expiré ;
- le plafond de 3 bulles par session ;
- une réplique déjà vue n'est jamais retirée au sort ;
- une page déjà servie n'a pas de seconde bulle ;
- l'ouverture du panneau pendant les 6 s annule le déclenchement ;
- la croix pose bien les deux marqueurs, session et local.

`useMarvinThread` :

- restauration depuis `marvin.thread`, sans réinjection de la phrase de
  présentation ;
- plafond de 40 messages ;
- une erreur réseau ajoute une entrée `error` sans vider l'historique ;
- « Réessayer » renvoie le dernier message du visiteur ;
- les entrées `error` et `auto` sont exclues de la charge envoyée à
  l'API.

Les composants de rendu restent vérifiés à l'œil.

## 12. Critères d'acceptation

1. Aucun bloc noir permanent : au repos, le dock se réduit à une pastille
   de 48 px en bas à droite.
2. La bulle paraît au plus une fois par page, trois fois par session, et
   jamais deux fois la même réplique. La croix la coupe définitivement
   pour 30 jours, y compris après rechargement.
3. Le dock est présent et fonctionnel sur toutes les pages du layout,
   avec l'historique conservé d'une page à l'autre.
4. Navigation clavier complète : ouverture, saisie, envoi, fermeture,
   retour du focus à la pastille.
5. Aucun décalage de mise en page sur la page d'accueil ; la pastille est
   présente dans le HTML servi.
6. Sous `prefers-reduced-motion` : aucune bulle, aucune animation, aucun
   effet de frappe.
7. Sous 640 px, la saisie reste visible clavier logiciel ouvert.
8. `bun run test` passe.
