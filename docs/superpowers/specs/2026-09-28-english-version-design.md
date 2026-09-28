# Version anglaise du portfolio — Design

Date : 2026-09-28
Branche : `feat/english-version`

## Objectif

Proposer une version anglaise complète et équivalente à la version française, destinée aux recruteurs et clients étrangers. Tout est traduit : pages et sections, fiches projets, blog, chatbot Marvin (réponses et répliques), easter egg WarGames, formulaire de contact.

**Critères de succès**
- Toutes les URLs françaises actuelles restent inchangées (aucun lien existant cassé).
- Chaque page FR a son équivalent EN sous `/en/...`, reliées par `hreflang`.
- Un visiteur non francophone se voit proposer la version EN, sans redirection forcée.
- Marvin répond en anglais sur la version EN, à partir des mêmes données (traduites) que l'UI.
- Ajouter du contenu reste simple : un article de blog FR seul reste publiable (fallback).

**Rédaction** : Claude traduit tout en adaptant le ton (pas de mot à mot), Martin relit.

## 1. Routing et structure

Approche retenue : i18n natif d'Astro + dictionnaire maison. Aucune dépendance ajoutée.

`astro.config.mjs` :
```js
i18n: {
  defaultLocale: 'fr',
  locales: ['fr', 'en'],
  routing: { prefixDefaultLocale: false },
}
```

Table des routes (définie dans `src/i18n/routes.ts`) :

| id        | FR                            | EN                                    |
|-----------|-------------------------------|---------------------------------------|
| home      | `/`                           | `/en/`                                |
| projects  | `/projets`, `/projets/[slug]` | `/en/projects`, `/en/projects/[slug]` |
| blog      | `/blog`, `/blog/[slug]`       | `/en/blog`, `/en/blog/[slug]`         |
| contact   | `/contact`                    | `/en/contact`                         |
| wargames  | `/wargames`                   | `/en/wargames`                        |

**Pages** : le contenu de chaque page actuelle migre vers un composant `src/components/pages/<Nom>Page.astro` qui prend `lang` en prop. Les fichiers de `src/pages/` (FR) et `src/pages/en/` (EN) deviennent des coquilles minimales qui rendent ce composant. Pour les pages `[slug]`, `getStaticPaths` est fourni par un helper partagé paramétré par la langue.

**Module `src/i18n/`**
- `ui.ts` : dictionnaire `{ fr: {...}, en: {...} }` des chaînes d'interface. Le type de `en` est dérivé de `fr` (`Record<keyof typeof ui.fr, string>`) : une clé manquante est une erreur TypeScript. TS pur, importable côté Astro et React.
- `utils.ts` :
  - `type Lang = 'fr' | 'en'`
  - `getLang(Astro)` → `Astro.currentLocale` normalisé
  - `t(lang)` → accès typé au dictionnaire
  - `localizePath(path, lang)` → traduit un chemin FR canonique vers la langue cible (gère slug et ancre)
  - `alternatePath(pathname)` → chemin équivalent dans l'autre langue
- `routes.ts` : la table ci-dessus.

**BaseLayout**
- Prop `lang` → `<html lang>`, `og:locale` (`fr_FR` / `en_US`) + `og:locale:alternate`, description par défaut localisée.
- `<link rel="alternate" hreflang="fr">`, `hreflang="en"`, `hreflang="x-default"` (→ FR).
- Nav desktop : libellés et liens localisés. `MenuMobile` reçoit `lang` en prop.

**API** : `/api/chat` et `/api/contact` restent uniques, non préfixées.

## 2. Contenu

### Data files

Chaque fichier exporte un `Record<Lang, T>` en conservant ses interfaces actuelles :

```ts
export const parcours: Record<Lang, ParcoursEntry[]> = { fr: [...], en: [...] };
```

- `parcours` : périodes, intitulés, descriptions traduits. Noms d'entreprises et d'écoles inchangés. Diplômes explicités pour un lecteur étranger (ex. « BTS (2-year degree) in Business Computing »).
- `skills` : noms de catégories traduits, noms de technos inchangés.
- `temoignages` : citations traduites, avec la mention « *Translated from French* » affichée sur la version EN.
- `companies` : extrait de `chat.ts` vers `src/data/companies.ts` (bilingue), pour garder les data files comme source unique de vérité.
- Test de parité : pour chaque data file, `fr` et `en` ont même longueur / mêmes clés.

### Collections

- Arborescence : `src/content/projects/{fr,en}/*.md` et `src/content/blog/{fr,en}/*.md`, même nom de fichier dans les deux langues. Schéma zod inchangé.
- Helper `getLocalizedCollection(name, lang)` : filtre sur le préfixe d'id `fr/` ou `en/` et expose un `slug` sans préfixe (utilisé par `getStaticPaths` et le switch de langue).
- **Fallback** : une entrée qui n'existe qu'en FR apparaît quand même côté EN, avec un badge « 🇫🇷 French only ».
- Dates formatées selon la langue (`toLocaleDateString(lang)`).
- Tags : traduits dans le frontmatter EN quand ce sont des mots courants (« Périculture » → « Childcare retail »), noms de technos inchangés.
- Chemins d'images inchangés.

## 3. Marvin (chatbot) et WarGames

### API `/api/chat`

- Body : `{ messages, lang }`. `lang` validé (`'fr' | 'en'`), `fr` par défaut (rétrocompatible).
- Le prompt système EN est rédigé entièrement en anglais (meilleure fiabilité de la langue de réponse).
- Blocs construits depuis `parcours[lang]`, `skills[lang]`, `temoignages[lang]`, `companies[lang]`, `getLocalizedCollection('projects', lang)`.
- Cache : `Map<Lang, string>`.
- Règle de langue : « Answer in English unless the visitor clearly uses another language » (et l'inverse en FR).
- Section École 42 traduite, avec une précision pour les non-initiés : école de code en peer-learning fondée par Xavier Niel, sans professeurs, basée sur des projets.
- Messages d'erreur serveur (rate limit, connexion perdue) localisés.

### Client

- `MarvinDock`, `ChatPanel`, `useMarvinThread`, `MarvinShell`, `WargamesGame` reçoivent `lang` en prop, transmise par le layout ou la page.
- Toutes leurs chaînes (placeholder, boutons, textes du terminal WOPR…) viennent de `src/i18n/ui.ts`.
- La redirection déclenchée par `[LANCER_JEU]` utilise `localizePath('/wargames', lang)`.
- `useMarvinThread` envoie `lang` à `/api/chat`.
- `WargamesGame` contient son propre formulaire de contact : il envoie `lang` à `/api/contact`, comme le formulaire principal.
- L'historique (sessionStorage) est partagé entre les langues : la conversation survit à un changement de langue.

### `marvinLines`

- Les clés passent des chemins aux identifiants de route logiques : `pageLines[lang][routeId]`, `sectionLines[lang][sectionId]`, `projectLines[lang]`.
- Répliques EN réécrites dans le ton de Marvin (blasé, pince-sans-rire, façon *Hitchhiker's Guide*), pas de mot à mot. Elles gardent la règle existante : chaque réplique apporte une information réelle sur le contenu.
- `MarvinDock` / `usePeek` résolvent la route courante vers son id via `routes.ts`.
- Tests existants (`marvinLines.test.ts`, `usePeek*.test.ts`, `MarvinDock.test.tsx`…) adaptés à la nouvelle structure.

## 4. Switch, suggestion, contact, SEO

### Switch FR | EN

- Dans la nav desktop (entre Blog et le séparateur), style `nav-link`, langue active en gras. Aussi dans `MenuMobile`.
- Lien vers `alternatePath(Astro.url.pathname)` : `/projets/amiqo` ↔ `/en/projects/amiqo`, `/#parcours` ↔ `/en/#parcours`.
- Page sans équivalent (article FR seul) → lien vers la liste du blog de l'autre langue.
- Au clic : `localStorage['lang-choice'] = lang`.

### Bandeau `LangSuggest.tsx` (`client:idle`)

- Petit bandeau rétro en bas d'écran (bordure, font mono).
- Affiché si :
  - la page est en FR, **et** aucune entrée de `navigator.languages` ne commence par `fr`, **et** `lang-choice` et `lang-suggest-dismissed` sont absents de `localStorage` ;
  - ou, symétriquement, la page est en EN et `navigator.languages` contient `fr*`.
- Texte : « > This site is also available in English. [View in English] [×] » (et l'équivalent FR).
- Un clic sur l'action ou sur × est mémorisé, et le bandeau ne revient plus.
- Pas de redirection automatique.

### Contact

- Formulaire et messages (validation, succès, erreur) localisés.
- `/api/contact` : champ `lang` ajouté à l'entrée enregistrée dans `contact.json`. Rien d'autre ne change.

### SEO

- `hreflang` + `og:locale` / `og:locale:alternate` sur chaque page.
- `<title>` et `description` localisés.
- Image OG commune.

## Tests

Vitest :
- `localizePath` / `alternatePath` : toutes les entrées de la table des routes, avec slug, avec ancre, et le fallback d'un article sans équivalent.
- Parité des clés de `ui.ts` (en complément du typage).
- Parité des data files (`parcours`, `skills`, `temoignages`, `companies`, `marvinLines`).
- `LangSuggest` : chaque condition d'affichage et de masquage.
- `/api/chat` : validation de `lang`, sélection et mise en cache du prompt par langue.
- Adaptation des tests existants.

Vérification finale : `bun run test`, `bun run build` (les deux arborescences doivent être générées), puis un parcours manuel en dev (switch sur chaque type de page, bandeau, Marvin en EN, WarGames EN, envoi du formulaire EN).

## Hors périmètre

- Troisième langue (la structure le permet, mais rien n'est prévu).
- Traduction automatique à la volée.
- Sitemap (inexistant aujourd'hui).
- Redirection automatique selon la langue du navigateur.
