# Nav mobile — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser
> `superpowers:subagent-driven-development` (recommandé) ou
> `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les
> étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**But :** rendre la navigation atteignable au téléphone — un bouton hamburger
biseauté sous 767 px, ouvrant un panneau plein écran opaque — et rendre la
pastille de MARVIN explicite au doigt.

**Architecture :** un composant React `MenuMobile.tsx` monté dans la barre de nav
en `client:idle`. Il rend le bouton en place et le panneau via
`createPortal(…, document.body)` : la nav porte `backdrop-filter`, ce qui en fait
un bloc conteneur, donc un descendant `position: fixed` serait contenu par elle
au lieu de couvrir l'écran. Le panneau est en `z-45`, sous la barre (`z-50`), donc
le bouton reste visible et il n'y a aucune bagarre de `z-index`.

**Pile :** Astro 7, React 19, Tailwind 4, Bun.

**Spec :** `docs/superpowers/specs/2026-09-17-nav-mobile-design.md`

## ⚠️ AUCUN TEST N'EST À ÉCRIRE DANS CE PLAN

**Martin écrit les tests lui-même.** Aucune tâche ne crée ni ne modifie de
fichier de test. Les 110 tests existants doivent continuer à passer **sans
modification**.

Si un changement fait échouer un test existant : **s'arrêter et le signaler**,
ne pas ajuster le test pour accommoder le code. Le §10 de la spec liste ce que
Martin couvrira ; ce n'est pas une liste de travail pour l'exécutant.

La vérification de chaque tâche passe donc par `bun run test` (inchangé à 110),
`bun run build`, et l'inspection du HTML et du CSS produits.

## Contraintes globales

- Tout le code, les commentaires et les libellés d'interface sont **en
  français** (convention du dépôt).
- Gestionnaire de paquets : **Bun**. Jamais `npm` ni `yarn`.
- **Aucun accès à `window`, `document`, `sessionStorage` ou `matchMedia` pendant
  le rendu.** Uniquement dans `useEffect` ou dans un gestionnaire d'événement :
  `client:idle` rend le composant côté serveur, où ces objets n'existent pas.
- Couleurs : uniquement via les variables CSS existantes (`--bg`, `--ink`,
  `--accent`, `--blue`, `--border`, `--font-mono`, `--marvin-*`). **Aucune valeur
  hexadécimale en dur.**
- Cibles tactiles : **44 px minimum**.
- Point de rupture : **767 px** pour la nav (`md` de Tailwind), **639 px** pour
  le dock. Les deux sont volontairement différents (voir N2 de la spec).
- `src/pages/api/chat.ts` n'est **jamais** modifié.
- Commit après chaque tâche, message en français, préfixe `feat:` / `fix:` /
  `refactor:` / `chore:`.

---

### Tâche 1 : Le composant `MenuMobile`, sans le brancher

**Fichiers :**
- Créer : `src/components/nav/MenuMobile.tsx`
- Modifier : `src/styles/retro.css` (ajout en fin de fichier)

**Interfaces :**
- Consomme : rien.
- Produit : `export default function MenuMobile()` — sans prop. La tâche 2 le
  monte dans `BaseLayout`.
- Produit les classes CSS `.menu-burger`, `.menu-panneau`, `.menu-lien`,
  `.menu-lien--actif`, `.menu-contact`, l'animation `menu-apparition`, et la
  variable `--nav-h` (84 px), que la tâche 2 replie à 70 px sous 767 px.

Cette tâche ne change **rien** au site : le composant existe mais n'est monté
nulle part. C'est volontaire — elle concentre toute la logique, et se relit
isolément.

- [ ] **Étape 1 : Écrire le composant**

`src/components/nav/MenuMobile.tsx` :

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Les destinations, dans l'ordre de la nav de bureau. Contact est à part : il
 *  garde sa pilule et se place en bas de liste. */
const LIENS = [
  { href: '/', libelle: 'Accueil' },
  { href: '/projets', libelle: 'Projets' },
  { href: '/#parcours', libelle: 'Parcours' },
  { href: '/#confiance', libelle: 'Partenaires' },
  { href: '/blog', libelle: 'Blog' },
];

export default function MenuMobile() {
  const [ouvert, setOuvert] = useState(false);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const panneauRef = useRef<HTMLDivElement>(null);

  // Le chemin n'est lisible qu'après hydratation : `client:idle` rend ce
  // composant côté serveur, où `window` n'existe pas. Aucun lien n'est donc
  // marqué actif dans le HTML servi ; le marquage apparaît à l'hydratation.
  const [chemin, setChemin] = useState('');
  useEffect(() => setChemin(window.location.pathname), []);

  // Contrairement à la pastille de MARVIN, le bouton n'est jamais masqué quand
  // le panneau est ouvert — celui-ci est en z-45, sous la barre en z-50. Le
  // focus peut donc revenir dans la même passe, sans attendre le commit.
  const fermer = useCallback(() => {
    setOuvert(false);
    boutonRef.current?.focus();
  }, []);

  // Focus sur le premier lien à l'ouverture.
  useEffect(() => {
    if (!ouvert) return;
    panneauRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
  }, [ouvert]);

  // Verrou de scroll. On restaure la valeur précédente, pas la chaîne vide :
  // une autre feuille de style pourrait avoir posé la sienne.
  useEffect(() => {
    if (!ouvert) return;

    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = precedent;
    };
  }, [ouvert]);

  // Échap et piège à focus.
  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fermer();
        return;
      }
      if (e.key !== 'Tab') return;

      // Le piège enjambe deux sous-arbres : le bouton est dans la nav, le
      // panneau dans document.body via le portail. On compose donc la liste à
      // la main — interroger un conteneur unique laisserait le bouton dehors.
      const focusables = [
        boutonRef.current,
        ...Array.from(panneauRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? []),
      ].filter((el): el is HTMLElement => el !== null);
      if (focusables.length === 0) return;

      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    document.addEventListener('keydown', surTouche);

    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, fermer]);

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        className="menu-burger"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => (ouvert ? fermer() : setOuvert(true))}
      >
        <span aria-hidden="true">{ouvert ? '✕' : '≡'}</span>
      </button>

      {ouvert &&
        createPortal(
          <div
            ref={panneauRef}
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="menu-panneau"
          >
            {LIENS.map(({ href, libelle }) => (
              <a
                key={href}
                href={href}
                className={chemin === href ? 'menu-lien menu-lien--actif' : 'menu-lien'}
                onClick={fermer}
              >
                <span aria-hidden="true">&gt;</span>
                {libelle}
              </a>
            ))}

            <a href="/contact" className="menu-contact btn-retro" onClick={fermer}>
              Contact
            </a>
          </div>,
          document.body
        )}
    </>
  );
}
```

- [ ] **Étape 2 : Ajouter les styles**

À la fin de `src/styles/retro.css` :

```css
/* ---- Menu mobile ------------------------------------------------- */

/* Le biseau `retro-border` du site, repris tel quel. L'état ouvert bascule au
   bleu, comme le fait déjà `retro-border:hover` — on lit l'état directement
   depuis l'attribut ARIA plutôt que d'ajouter une classe. */
.menu-burger {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--bg);
  color: var(--ink);
  border: 2px solid var(--accent);
  box-shadow: inset -2px -2px 0 0 var(--accent), 2px 2px 0 0 var(--accent);
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.menu-burger[aria-expanded='true'] {
  border-color: var(--blue);
  color: var(--blue);
  box-shadow: inset 2px 2px 0 0 var(--blue), -2px -2px 0 0 var(--blue);
}

/* Hauteur réelle de la barre de nav : le logo plus deux fois le retrait
   vertical de `py-4`. Déclarée ici parce que c'est `.menu-panneau` qui la
   consomme ; la tâche 2 la redéfinit sous le point de rupture, en même temps
   que la taille du logo, pour que les deux ne puissent pas diverger. */
:root {
  --nav-h: 84px;
}

/* Opaque, pas translucide : illisible par-dessus les sections colorées. */
.menu-panneau {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  padding: calc(var(--nav-h) + 8px) 24px 24px;
  background: var(--bg);
  overflow-y: auto;
  animation: menu-apparition 200ms ease-out;
}

@keyframes menu-apparition {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.menu-lien {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 2px;
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 15px;
  text-decoration: none;
}

.menu-lien span { color: var(--accent); }

.menu-lien--actif { color: var(--accent); }

.menu-contact {
  margin-top: 18px;
  text-align: center;
  font-size: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .menu-panneau { animation: none; }
}
```

- [ ] **Étape 3 : Vérifier que rien n'a bougé**

```bash
bun run test
bun run build
```

Attendu : **110 tests au vert, inchangés**, et build réussi. Le composant n'est
monté nulle part, donc le site est identique — c'est le résultat voulu à ce
stade.

Vérifier ensuite que les styles sont bien dans le livrable :

```bash
grep -c "menu-burger" dist/client/_astro/BaseLayout*.css
grep -c "menu-apparition" dist/client/_astro/BaseLayout*.css
```

Attendu : `1` ou plus pour chacun. Si c'est `0`, Tailwind n'a pas repris le
fichier — vérifier que l'ajout est bien dans `retro.css` et non dans un bloc
`@layer`.

- [ ] **Étape 4 : Commit**

```bash
git add src/components/nav/MenuMobile.tsx src/styles/retro.css
git commit -m "feat: composant du menu mobile, pas encore branche"
```

---

### Tâche 2 : Brancher le menu et replier la nav de bureau

**Fichiers :**
- Modifier : `src/layouts/BaseLayout.astro:57-70` (la barre de nav)
- Modifier : `src/styles/retro.css` (repli de `--nav-h`, classes `.nav-logo` et `.nav-barre`)

**Interfaces :**
- Consomme : `MenuMobile` (tâche 1), défaut, sans prop.
- Produit : la nav mobile fonctionnelle. Aucune interface pour les tâches
  suivantes.

C'est la tâche de bascule : après elle, le site change pour de vrai.

- [ ] **Étape 1 : Sortir la taille du logo du style en ligne, et replier `--nav-h`**

Le logo porte aujourd'hui `style="height: 52px"` en ligne, ce qu'une media query
ne peut pas surcharger sans `!important`. Il faut donc passer par une classe.

`--nav-h` est déjà déclarée à 84 px par la tâche 1 ; il reste à la replier sous
le point de rupture. À la fin de `src/styles/retro.css` :

```css
.nav-logo {
  height: 52px;
  width: auto;
  display: block;
}

.nav-barre {
  min-height: var(--nav-h);
}

@media (max-width: 767px) {
  :root { --nav-h: 70px; }
  .nav-logo { height: 38px; }
}
```

- [ ] **Étape 2 : Modifier la barre de nav**

Dans `src/layouts/BaseLayout.astro`, importer le composant en tête du
frontmatter, à côté de l'import de `MarvinDock` :

```astro
import MenuMobile from '../components/nav/MenuMobile.tsx';
```

Puis remplacer la barre (lignes 57-70) par :

```astro
    <nav class="nav-barre fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);">
      <a href="/" class="flex items-center">
        <img src="/martininfologo.jpeg" alt="Martin Info" class="nav-logo" />
      </a>

      <div class="hidden md:flex items-center gap-6 text-sm">
        <a href="/" class="nav-link" style="color: var(--ink-soft);">Accueil</a>
        <a href="/projets" class="nav-link" style="color: var(--ink-soft);">Projets</a>
        <a href="/#parcours" class="nav-link" style="color: var(--ink-soft);">Parcours</a>
        <a href="/#confiance" class="nav-link" style="color: var(--ink-soft);">Partenaires</a>
        <a href="/blog" class="nav-link" style="color: var(--ink-soft);">Blog</a>
        <span style="color: var(--border);">│</span>
        <a href="/contact" class="btn-retro" style="padding: 8px 20px; font-size: 0.875rem;">Contact</a>
      </div>

      <div class="md:hidden">
        <MenuMobile client:idle />
      </div>
    </nav>
```

Trois points sur ce remplacement :

1. **`class="nav-barre"` est ajouté** pour que `min-height: var(--nav-h)` porte,
   sans toucher aux utilitaires Tailwind existants.
2. **Le style en ligne du logo devient `class="nav-logo"`.** Ne pas laisser les
   deux : le style en ligne gagnerait sur la media query.
3. **L'île est enveloppée dans `<div class="md:hidden">`** et non masquée depuis
   le composant. Astro ne transmet pas `class` à l'élément `<astro-island>`, donc
   une classe posée sur le bouton laisserait l'île elle-même comme troisième
   enfant flex de la barre — visuellement inoffensif, mais fragile. L'enveloppe
   la fait disparaître proprement au-dessus du point de rupture.

- [ ] **Étape 3 : Vérifier**

```bash
bun run test
bun run build
```

Attendu : 110 tests inchangés, build réussi. **Si le build échoue avec une erreur
du genre « window is not defined », c'est une régression réelle** — le composant
touche un objet du navigateur pendant le rendu. Le signaler, ne pas basculer sur
`client:only` pour contourner.

Puis, dans le HTML produit :

```bash
grep -c 'class="menu-burger"' dist/client/index.html
grep -c 'md:hidden' dist/client/index.html
grep -c 'nav-logo' dist/client/index.html
grep -c 'menu-panneau' dist/client/index.html
```

Attendu : `1` pour les trois premiers, **`0` pour le dernier** — le panneau n'est
monté qu'à l'ouverture, donc il ne doit pas apparaître dans le HTML servi.

- [ ] **Étape 4 : Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/retro.css
git commit -m "feat: branche le menu mobile et replie la nav de bureau sous 767px"
```

---

### Tâche 3 : La pastille mobile de MARVIN

**Fichiers :**
- Modifier : `src/components/chatbot/MarvinDock.tsx:115-120` (le span de libellé)
- Modifier : `src/styles/retro.css` (ajout en fin de fichier)

**Interfaces :**
- Consomme : rien des tâches 1 et 2.
- Produit : rien pour les tâches suivantes.

Indépendante des tâches 1 et 2 — c'est l'annexe §8 de la spec. Elle traite un
manque distinct : au doigt il n'y a pas de survol, donc le libellé de la pastille
n'apparaît jamais.

- [ ] **Étape 1 : Dédoubler le libellé**

Dans `src/components/chatbot/MarvinDock.tsx`, remplacer le span de libellé
actuel par deux spans :

```tsx
        <span aria-hidden="true">$_</span>
        {/* Deux libellés, un par point de rupture : le texte diffère et le CSS
            ne peut pas changer le contenu d'un élément existant. Tous deux
            masqués aux lecteurs d'écran — l'aria-label du bouton porte déjà le
            nom accessible, et l'annoncer deux fois serait du bruit. */}
        <span
          className="marvin-pastille__libelle marvin-pastille__libelle--long"
          aria-hidden="true"
        >
          Parler à MARVIN-42
        </span>
        <span
          className="marvin-pastille__libelle marvin-pastille__libelle--court"
          aria-hidden="true"
        >
          MARVIN
        </span>
```

- [ ] **Étape 2 : Ajouter les styles**

À la fin de `src/styles/retro.css` :

```css
/* ---- Pastille MARVIN au doigt ------------------------------------ */

/* Par défaut, sur bureau, seul le libellé long existe : il sort au survol. */
.marvin-pastille__libelle--court { display: none; }

@media (max-width: 639px) {
  /* Pas de survol au doigt, donc le libellé ne peut pas être révélé à la
     demande : la pastille devient une gélule qui se nomme en permanence. Le
     nom seul, choisi contre « Parler à MARVIN-42 » qui occuperait la moitié
     de la largeur — le nom sans explication amorce la curiosité. */
  .marvin-pastille {
    width: auto;
    grid-auto-flow: column;
    gap: 9px;
    padding: 0 16px;
    border-radius: 24px;
  }

  .marvin-pastille__libelle--long { display: none; }

  .marvin-pastille__libelle--court {
    display: inline;
    max-width: none;
    opacity: 1;
  }

  /* Une gélule libellée n'a plus l'ambiguïté que le battement corrigeait ;
     battre en plus serait une sollicitation de trop. */
  .marvin-pastille--appel { animation: none; }
}
```

Note de cascade : `.marvin-pastille__libelle--court` a la même spécificité que
`.marvin-pastille__libelle`, donc c'est l'ordre dans le fichier qui décide. Ce
bloc doit être **après** celui de la tâche précédente qui déclare
`max-width: 0; opacity: 0`. En l'ajoutant en fin de fichier, c'est acquis.

- [ ] **Étape 3 : Vérifier**

```bash
bun run test
bun run build
```

Attendu : 110 tests inchangés, build réussi.

```bash
grep -c "Parler à MARVIN-42" dist/client/index.html
grep -c ">MARVIN<" dist/client/index.html
grep -o "marvin-pastille__libelle--court{[^}]*}" dist/client/_astro/BaseLayout*.css
```

Attendu : `1` pour les deux premiers (les deux spans sont dans le HTML, c'est le
CSS qui en masque un), et la troisième commande doit afficher la règle.

- [ ] **Étape 4 : Commit**

```bash
git add src/components/chatbot/MarvinDock.tsx src/styles/retro.css
git commit -m "feat: la pastille se nomme en permanence au doigt, sans battement"
```

---

### Tâche 4 : Vérification finale

**Fichiers :** aucun, sauf correctif éventuel.

Cette tâche n'introduit pas de code. Elle confronte le résultat aux huit
critères du §11 de la spec. **Ne pas la déclarer terminée sans avoir exécuté
chaque vérification et constaté son résultat.** Rapporter une vérification non
faite comme réussie est le seul résultat inacceptable ici.

- [ ] **Étape 1 : Vérifier la chaîne automatisée**

```bash
bun run test
bun run build
```

Attendu : 110 tests, build vert. Noter les chiffres.

- [ ] **Étape 2 : Vérifier le HTML servi sur toutes les pages**

```bash
for f in index projets/index blog/index contact/index; do
  printf "%s : burger=%s panneau=%s\n" "$f" \
    "$(grep -c 'class=\"menu-burger\"' dist/client/$f.html)" \
    "$(grep -c 'menu-panneau' dist/client/$f.html)"
done
```

Attendu : `burger=1` et `panneau=0` partout. Le panneau ne doit jamais être dans
le HTML servi — il n'existe qu'après un clic.

- [ ] **Étape 3 : Vérifier la cohérence de `--nav-h`**

```bash
grep -o "\-\-nav-h:[^;]*" dist/client/_astro/BaseLayout*.css
```

Attendu : deux valeurs, `84px` puis `70px`. Vérifier ensuite à la main que
`70px` correspond bien au logo mobile plus deux fois le retrait : `38 + 2×16 =
70`. Si la valeur du logo a été changée sans celle de `--nav-h`, le panneau
recouvrira la barre ou laissera un blanc.

- [ ] **Étape 4 : Parcours manuel dans le navigateur**

Lancer `astro dev --background`, puis vérifier une à une. Si une vérification ne
peut pas être faite dans cet environnement, **le dire** plutôt que la supposer.

| Critère | Vérification |
|---|---|
| §11.1 | À 375 px, les six destinations sont atteignables en deux gestes : taper `≡`, taper le lien. |
| §11.2 | À **651 px** — la largeur mesurée où la nav cassait — plus aucun chevauchement ni débordement. |
| §11.3 | Au-dessus de 767 px, la nav de bureau est identique à avant : six liens, le séparateur `│`, la pilule Contact, logo à 52 px. |
| §11.4 | Au clavier seul : Tab jusqu'au `≡`, Entrée, le focus atterrit sur « Accueil », Tab parcourt les liens, Tab depuis « Contact » revient sur le bouton, Maj+Tab depuis « Accueil » va sur le bouton, Échap ferme et le focus revient sur le bouton. |
| §11.5 | Activer « Réduire les animations » dans les réglages système : le panneau apparaît sans fondu ni translation. |
| §11.6 | Panneau ouvert, tenter de faire défiler la page derrière : elle ne bouge pas. Fermer : la position de défilement est celle d'avant l'ouverture. |
| §11.7 | Sous 639 px, la pastille affiche « MARVIN » en permanence et **ne bat pas** au chargement. |
| Lien actif | Sur `/projets`, ouvrir le menu : « Projets » est en vert. Sur `/`, c'est « Accueil ». |
| Ancres | Taper « Parcours » : le menu se ferme **et** la page défile jusqu'à la section. Si le menu reste ouvert, on navigue derrière lui. |
| Logo | Juger si 38 px est la bonne taille — c'est la seule valeur de la spec choisie sans avoir pu la voir. |
| Superposition | Ouvrir le chat de MARVIN, puis taper `≡` : le panneau recouvre la feuille. Vérifier qu'Échap ferme le menu et qu'on retrouve un état utilisable. C'est une limite assumée (§6.1), pas un défaut. |

- [ ] **Étape 5 : Arrêter le serveur et rendre compte**

```bash
astro dev stop
```

Rendre compte critère par critère, en distinguant ce qui a été vérifié de ce qui
n'a pas pu l'être. Tout écart est signalé, jamais passé sous silence.

- [ ] **Étape 6 : Commit du correctif éventuel**

S'il a fallu corriger quelque chose :

```bash
git add -A
git commit -m "fix: <ce qui a ete corrige lors de la verification>"
```

---

## Notes pour l'exécutant

**Pourquoi un portail et pas un simple `position: fixed`.** La barre de nav porte
`backdrop-filter: blur(8px)`. Une propriété de filtre fait de l'élément un bloc
conteneur pour ses descendants positionnés, y compris en `fixed` : un panneau
enfant de la nav serait contenu par la barre — soit une bande de 70 px de haut au
lieu de l'écran entier. Le portail vers `document.body` est la seule façon de
sortir de ce confinement sans démonter la nav.

**Pourquoi le focus peut revenir de façon synchrone ici.** Le dock a dû différer
son retour de focus dans un effet, parce qu'une règle `:has()` masque sa pastille
tant que le panneau est monté, et `focus()` sur un élément `display: none` est
sans effet. Ici, rien ne masque le bouton : le panneau est en `z-45`, la barre en
`z-50`. L'appel direct dans `fermer()` suffit — ne pas recopier le mécanisme
différé du dock par mimétisme.

**Les deux points de rupture sont voulus.** 767 px pour la nav, 639 px pour le
dock. Ce n'est pas une incohérence à corriger : la nav casse à 651 px mesurés et
767 est le `md` que le site utilise déjà, tandis que le dock a son propre seuil
depuis sa conception. Voir N2 de la spec.
