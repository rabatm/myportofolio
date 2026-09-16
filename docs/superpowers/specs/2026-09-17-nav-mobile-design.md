# Nav mobile — conception

Date : 2026-09-17
Statut : validé, prêt pour plan d'implémentation
Origine : « on va travailler la version mobile », Martin

## 1. Objectif

Rendre le site utilisable au téléphone. La navigation est aujourd'hui
inatteignable sous 651 px : c'est le premier obstacle, et il passe avant tout
le reste.

## 2. État constaté

**La nav casse à 651 px de large** (mesuré par Martin dans les outils de
développement). Elle aligne six liens plus un bouton Contact dans une rangée
flex, sans hamburger, avec un logo de 52 px de haut — aucun repli prévu.

Le reste du site est à peine adapté : **six utilitaires responsives au total**
sur l'ensemble des pages (trois `md:grid-cols-2`, un `md:text-xl`, un
`md:text-7xl`, un `md:flex-row`) et **une seule media query** dans une section
sur sept.

Le dock MARVIN-42 est la partie la mieux préparée — feuille pleine largeur,
`80dvh`, bulle bridée, poignée de fermeture — mais il lui manque une affordance
au doigt : son libellé ne sort qu'au survol, qui n'existe pas sur écran tactile.

## 3. Décomposition du chantier mobile

Quatre sous-chantiers indépendants, chacun son cycle spec → plan →
implémentation :

1. **la nav** — objet de cette spec, la plus bloquante ;
2. le hero ;
3. les sections ;
4. le dock.

Cette spec traite la nav, et **inclut en annexe (§7) la pastille mobile du
dock** : la décision a été prise dans la même conversation, elle tient en une
poignée de lignes de CSS, et lui consacrer un cycle complet serait
disproportionné. Le reste du sous-chantier dock garde le sien.

## 4. Décisions

| # | Décision | Motif |
|---|---|---|
| N1 | Hamburger biseauté + panneau plein écran opaque | Retenu contre une fenêtre Win95 (trop pastiche si ratée) et contre une rangée réduite (règle le problème en supprimant de la navigation) |
| N2 | Bascule à **767 px** (`md` de Tailwind) | Au-dessus des 651 px mesurés avec marge, et réutilise le point de rupture déjà présent dans le site plutôt qu'un troisième nombre. Le dock garde 639 px |
| N3 | Composant React hydraté, pas un `<script>` classique | Le menu porte quatre comportements d'accessibilité non triviaux qui cassent en silence ; React les rend testables avec le Vitest en place |
| N4 | Panneau rendu via `createPortal` vers `document.body` | La nav porte `backdrop-filter`, ce qui en fait un bloc conteneur : un descendant `position: fixed` serait contenu par elle au lieu de couvrir l'écran |
| N5 | Panneau sous la barre de nav, pas par-dessus | Le bouton reste visible et atteignable, et il n'y a aucune bagarre de `z-index` à arbitrer |
| N6 | Libellé permanent sur mobile, « MARVIN » seul | Choix de Martin : le nom sans explication amorce la curiosité, là où « Parler à MARVIN-42 » occuperait la moitié de la largeur en permanence |
| N7 | Battement supprimé sous 639 px | Il servait à attirer l'œil sur un cercle muet ; une gélule libellée n'a plus cette ambiguïté, et battre en plus serait une sollicitation de trop |

## 5. Architecture

Un composant `src/components/nav/MenuMobile.tsx`, monté dans la barre de nav de
`BaseLayout.astro` en `client:idle` — même directive que le dock, même
contrainte : **aucun accès à `window`, `document` ou au stockage pendant le
rendu**, sinon le rendu serveur casse.

Le composant rend deux choses depuis un seul point de montage :

- le **bouton** `≡`, en place dans la barre ;
- le **panneau**, via `createPortal(…, document.body)` (voir N4). Le portail
  n'est monté que lorsque le menu est ouvert, donc après un clic : aucun accès
  à `document` au premier rendu, le contrat `client:idle` tient.

**Empilement.** Panneau en `z-45`, commençant sous la barre de nav (`z-50`) qui
reste donc visible. Le dock est en `z-40`, donc le menu le couvre — ce que le
brief du dock demandait en écrivant « sous la nav mobile ouverte », alors
qu'aucune nav mobile n'existait.

`BaseLayout` conserve le logo et les liens de bureau, masqués sous 767 px par
`hidden md:flex`. **La nav de bureau ne devient pas du React.**

## 6. Comportement et accessibilité

Le panneau est modal de fait : il en assume le contrat complet.

| Comportement | Détail |
|---|---|
| Ouverture | Focus sur le premier lien |
| Tabulation | Piégée sur `[bouton, …liens]`. Le bouton est le premier arrêt, donc Maj+Tab depuis le premier lien y revient. **Le piège enjambe deux sous-arbres** — le bouton est dans la nav, le panneau dans `document.body` via le portail — donc il ne peut pas se réduire à « les éléments focusables d'un conteneur » : il faut composer la liste à partir de la ref du bouton et de celle du panneau |
| Échap | Ferme, focus rendu au bouton |
| Clic sur un lien | Ferme. Indispensable pour les ancres `/#parcours` et `/#confiance` : sinon on navigue derrière un panneau resté ouvert |
| Scroll de la page | Bloqué à l'ouverture ; **la valeur précédente de `overflow` est restaurée** à la fermeture, pas remise à la chaîne vide |
| `aria` | Bouton : `aria-expanded`, `aria-controls`. Panneau : `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation"` |

### 6.1 Limites assumées

- **iOS verrouille mal le scroll** avec `overflow: hidden` sur `body`. La parade
  complète (`position: fixed` sur `body`) fait perdre la position de défilement
  au retour : remède pire que le mal. On reste sur `overflow: hidden`.
- **Menu et chat peuvent se superposer.** Si la feuille de MARVIN est ouverte et
  qu'on tape le bouton menu, le panneau la recouvre. Coordonner les deux
  exigerait de remonter leur état dans un parent commun — disproportionné pour
  un cas de bord, et la situation est récupérable : le bouton reste atteignable
  et Échap ferme.

## 7. Visuel

**Bouton** : 44×44 (cible tactile du site), biseau `retro-border` repris tel
quel — vert `--accent` au repos, bleu `--blue` une fois ouvert, comme le fait
déjà `retro-border:hover`. Glyphe `≡` puis `✕`, JetBrains Mono.

**Panneau** : fond `var(--bg)` **opaque** — translucide serait illisible
par-dessus les sections colorées. Il couvre `inset: 0` avec un
`padding-top` égal à la hauteur de la barre.

Cette hauteur n'est pas une constante : elle vaut le logo plus deux fois le
retrait vertical, et le logo change de taille au point de rupture. On déclare
donc **`--nav-h`** dans `:root`, on l'applique à la `min-height` de la barre et
au `padding-top` du panneau, et on la redéfinit dans la media query en même
temps que la taille du logo. Une seule valeur à changer, jamais deux à tenir
d'accord. Liens en
JetBrains Mono 15 px, 44 px de haut minimum, séparés par
`1px solid var(--border)`, chevron `>` en `--accent` — écho au terminal de
MARVIN, et distinction visuelle entre navigation et contenu. Lien de la page courante en
`--accent`.

**Attention** : déterminer la page courante suppose de lire
`window.location.pathname`, ce que le contrat `client:idle` interdit pendant le
rendu. Le chemin se lit dans un effet de montage et vaut `''` au premier
rendu — donc aucun lien n'est marqué actif côté serveur, et le marquage
apparaît après hydratation. `MarvinDock` applique déjà exactement ce motif pour
son `chemin` : le reprendre tel quel. Contact garde sa pilule `.btn-retro`, en bas de liste.

**Animation** : fondu et translation de 8 px sur 200 ms, le vocabulaire déjà
employé par la bulle du dock. Supprimée sous `prefers-reduced-motion`.

**Logo : 52 → 38 px** sous le point de rupture. À 52 px la barre mange 84 px de
hauteur sur un écran de 667. **C'est le seul choix de cette spec dont la valeur
reste à confirmer à l'œil** une fois en place.

## 8. Annexe : la pastille mobile du dock

Sous **639 px** (le dock garde son point de rupture, voir N2) :

- la pastille devient une gélule : `width: auto`, `padding: 0 16px`,
  `border-radius: 24px`, hauteur 48 px inchangée ;
- le libellé est visible en permanence au lieu du survol ;
- le battement est supprimé (N7).

**Deux `<span>`, un par point de rupture.** Le libellé diffère selon la taille —
« Parler à MARVIN-42 » au survol sur bureau, « MARVIN » en permanence sur mobile
— et le CSS ne peut pas changer le texte d'un élément existant. Les deux sont
`aria-hidden` : l'`aria-label` du bouton porte déjà le nom accessible. Passer
par `content` en CSS serait moins lisible pour le même résultat.

## 9. Fichiers

**Créer** : `src/components/nav/MenuMobile.tsx`

**Modifier** :
- `src/layouts/BaseLayout.astro` — montage du composant, liens de bureau en
  `hidden md:flex`, taille du logo
- `src/components/chatbot/MarvinDock.tsx` — le second `<span>` de libellé
- `src/styles/retro.css` — styles du menu, gélule mobile, suppression du
  battement

**Hors périmètre** : le hero, les sections, et les autres points ouverts du
dock (clavier logiciel iOS, retour de focus sous 640 px). Chacun son cycle.

## 10. Tests

**Couvert par Vitest** — c'est la raison d'être de N3 :

- `aria-expanded` bascule à l'ouverture et à la fermeture ;
- Échap ferme et rend le focus au bouton ;
- un clic sur un lien ferme le panneau ;
- la tabulation boucle sur `[bouton, …liens]` sans en sortir ;
- le verrou de scroll est posé à l'ouverture **et restauré à sa valeur
  précédente** à la fermeture — pas à la chaîne vide ;
- le panneau expose `role="dialog"` avec son libellé ;
- les deux `<span>` de libellé de la pastille existent et sont `aria-hidden`.

**Non couvert**, jsdom n'évaluant aucune feuille de style : quel libellé est
visible à quelle largeur, la suppression du battement, la position du panneau,
le verrou de scroll sur iOS. Vérification à l'œil, comme pour le scroll du dock.

Martin écrit les tests.

## 11. Critères d'acceptation

1. À 375 px, les six destinations sont atteignables en deux gestes au plus.
2. À 651 px — la largeur mesurée — plus aucun chevauchement ni débordement.
3. Au-dessus de 767 px, la nav de bureau est inchangée.
4. Navigation clavier complète : ouverture, parcours des liens, activation,
   Échap, retour du focus au bouton.
5. Sous `prefers-reduced-motion`, le panneau apparaît sans animation.
6. La page ne défile pas derrière le panneau ouvert, et retrouve sa position
   à la fermeture.
7. Sous 639 px, la pastille affiche « MARVIN » en permanence et ne bat pas.
8. `bun run test` passe.
