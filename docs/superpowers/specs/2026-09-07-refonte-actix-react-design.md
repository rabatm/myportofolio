# Refonte de la stack : Actix Web + SQLite + React 19.2

**Date** : 2026-09-07
**Statut** : validé, prêt pour le plan d'implémentation

## Objectif

Remplacer la stack actuelle (Astro 7 statique + fichiers Markdown/TypeScript)
par un backend Rust/Actix Web, une base SQLite et des îlots React 19.2.

Le moteur de cette refonte est la **vitrine technique** : le portfolio doit
démontrer la stack qu'il annonce. Martin se positionne sur Rust et
l'architecture hexagonale ; le site doit en être la preuve exécutable, pas
une ligne dans une liste de compétences.

Ce critère tranche les arbitrages du document : à chaque choix, on retient
l'option dont la qualité est **observable par un visiteur** — vitesse,
robustesse, exactitude — plutôt que celle qui est seulement élégante dans le
code. Un portfolio Rust lent dessert son propre argument.

## État actuel

| Élément | Implémentation | Volume |
|---|---|---|
| Pages | 7 pages `.astro`, SSG | 372 lignes |
| Sections | Composants `.astro` | 565 lignes |
| Contenu | 14 fichiers `.md` + collections zod | — |
| Données perso | `parcours.ts`, `skills.ts`, `temoignages.ts` | 203 lignes |
| Chatbot | `api/chat.ts` (Groq `llama-3.3-70b-versatile`) + `ChatBot.tsx` | 273 lignes |
| WarGames | `WargamesGame.tsx`, `MarvinShell.tsx`, `minimax.ts` | 629 lignes |
| Contact | `api/contact.ts` → lecture/écriture de `contact.json` | — |
| Styles | `retro.css` + Tailwind 4 | 134 lignes |
| Tests | aucun | — |

## Décisions structurantes

Quatre décisions ont été prises lors du brainstorming ; elles conditionnent
tout le reste.

### 1. Rendu : SSR Rust + îlots React

Astro applique aujourd'hui une architecture en îlots. On la réimplémente en
Rust plutôt que de passer à une SPA.

**Écarté — SPA React + API JSON** : plus simple, mais le HTML initial serait
vide. Sur un portfolio dont la fonction est d'être trouvé et lu par des
recruteurs, la perte de SEO et de temps de premier rendu attaque directement
l'objectif du site.

**Écarté — SSR React via un process Node** : exploiterait pleinement React
19.2, mais réintroduirait Node en production aux côtés d'Actix, qui ne serait
plus qu'un proxy. Cela viderait de sa substance l'argument « vitrine Rust ».

**Retenu** : Askama rend le HTML côté serveur ; React n'est monté que sur les
îlots réellement interactifs. Le SEO et la vitesse sont préservés, Rust est
sur le chemin critique, et les ~900 lignes de React existantes sont
réutilisées presque telles quelles.

### 2. Périmètre SQLite : tout, contenu éditorial compris

Projets, articles, parcours, compétences, témoignages, entreprises, messages
de contact et compte admin vivent en base.

**Alternative écartée — SQLite pour les seules données d'exécution** : aurait
gardé le contenu en Markdown versionné dans Git.

**Coûts assumés de la décision retenue**, à traiter et non à ignorer :

- Le contenu éditorial quitte Git : plus d'historique `git log` ni de
  relecture par PR sur les textes. Le plan de sauvegarde (§7) est ce qui
  compense cette perte.
- Le fichier `.db` n'est plus reconstructible depuis le dépôt : il *est* le
  contenu. Sa persistance et sa sauvegarde deviennent des exigences de
  production, pas des améliorations.
- Éditer le contenu exige une interface : c'est ce qui rend la décision 3
  nécessaire plutôt qu'optionnelle.

### 3. Édition : admin web protégée, livrée après le seeding

Le seeding importe l'existant et met le site debout rapidement ; l'admin suit
et rend la base éditable. Un unique éditeur (Martin), donc pas de rôles, pas
d'inscription, pas de récupération de mot de passe.

### 4. Chatbot : aucune persistance des conversations

Pas de table de conversations. Aucune donnée de visiteur n'est stockée, donc
aucune mention de confidentialité à rédiger. Ajoutable plus tard par une
simple migration si le besoin de statistiques apparaît.

## 1. Architecture

Un binaire Rust unique sert l'ensemble.

```
GET  /, /projets, /projets/:slug, /blog, /blog/:slug, /contact, /wargames
     → SSR Askama depuis SQLite
GET  /static/*, /assets/*   → fichiers statiques (bundles d'îlots, images, CSS)
GET  /sitemap.xml, /rss.xml → générés depuis la base
POST /api/contact           → insertion en base
POST /api/chat              → proxy Groq, prompt construit depuis SQLite
GET|POST /admin/*           → CRUD protégé par session
```

**Justification** : un seul process à déployer et superviser, pas de CORS, pas
de proxy. « Ce site tourne sur un binaire Rust » est un argument court et
vérifiable.

### Structure du dépôt

Le projet Astro est remplacé en place, dans `superior-star/`.

```
superior-star/
├── backend/
│   ├── src/
│   │   ├── main.rs           # bootstrap Actix, état applicatif
│   │   ├── routes/           # handlers par domaine
│   │   ├── db/               # requêtes SQLx + modèles
│   │   ├── templates/        # structs Askama
│   │   └── bin/
│   │       ├── seed.rs           # import du contenu existant
│   │       └── create_admin.rs   # création du compte admin
│   ├── templates/*.html      # templates Askama
│   ├── migrations/           # migrations SQLx versionnées
│   └── Cargo.toml
├── frontend/
│   ├── src/islands/{chatbot,wargames}/
│   └── vite.config.ts        # build multi-entrées → backend/static/
└── content-archive/          # .md et .ts d'origine, versionnés (filet de secours)
```

### Versions

Vérifiées sur crates.io au 2026-09-07 : Actix Web 4.15, SQLx 0.9, Askama
0.16, argon2 0.6, actix-session 0.11, pulldown-cmark 0.13, Tokio 1.53,
reqwest. Front : React 19.2, Vite, Tailwind 4. Toolchain locale disponible :
rustc 1.89.0, Bun 1.3.5.

### Limite assumée

Tailwind 4 et le bundling des îlots imposent de garder Bun dans la **chaîne de
build**. Rust ne couvre pas la production d'assets de bout en bout. En
revanche, **à l'exécution il n'y a que le binaire Rust** : Node n'intervient
qu'à la compilation. La distinction est nette et défendable.

## 2. Schéma SQLite

### Contenu éditorial

```sql
CREATE TABLE projects (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,            -- ISO-8601, tri décroissant
  description TEXT NOT NULL,
  body_md     TEXT NOT NULL,            -- source Markdown, rendue au vol
  image       TEXT,
  url         TEXT,
  github      TEXT,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE posts (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  description TEXT NOT NULL,
  body_md     TEXT NOT NULL,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE project_tags (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

Les tags sont une table dédiée et non une colonne JSON : cela permet le
filtrage par tag en SQL et justifie concrètement l'usage d'une vraie base.

### Données personnelles

```sql
CREATE TABLE career (          -- ex-parcours.ts
  id          INTEGER PRIMARY KEY,
  periode     TEXT NOT NULL,
  titre       TEXT NOT NULL,
  entreprise  TEXT,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

CREATE TABLE skills (          -- ex-skills.ts : Record<catégorie, string[]>
  id         INTEGER PRIMARY KEY,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE testimonials (    -- ex-temoignages.ts
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  title      TEXT NOT NULL,
  company    TEXT NOT NULL,
  quote      TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE companies (       -- aujourd'hui codées en dur dans api/chat.ts
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT NOT NULL,
  logo        TEXT,
  sort_order  INTEGER NOT NULL
);
```

`companies` est aujourd'hui dupliquée entre `IlsMeFontConfiance.astro` et le
prompt de `chat.ts`. La mise en base supprime cette duplication : la page et
le chatbot lisent la même ligne.

L'ordre des entrées est signifiant à l'affichage — d'où `sort_order` sur les
quatre tables.

### Données d'exécution

```sql
CREATE TABLE contact_messages (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at    TEXT,                    -- marquage lu/non-lu dans l'admin
  ip_hash    TEXT                     -- SHA-256 tronqué, anti-spam
);

CREATE TABLE admin_users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,        -- Argon2id
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Choix de schéma

**Markdown stocké brut, rendu à la volée.** `body_md` conserve la source ;
pulldown-cmark produit le HTML à chaque requête (quelques centaines de
microsecondes à cette taille). On évite ainsi de stocker un HTML qu'on ne
saurait plus rééditer. Un cache mémoire s'ajouterait sans changer le schéma
si le coût devenait mesurable.

**Colonne `published`.** Permet de rédiger sans publier — minimum attendu
d'une admin, pour le prix d'une colonne.

## 3. Rendu SSR

Chaque page suit le même trajet : le handler Actix interroge SQLite via SQLx,
remplit une struct Askama, renvoie le HTML complet.

Askama compile les templates **à la compilation** : une variable erronée
casse le build, pas la page en production. C'est un avantage direct sur les
moteurs interprétés.

La découpe actuelle est reprise à l'identique : `base.html` remplace
`BaseLayout.astro` (métadonnées OG, canonical, styles), et les sections de la
page d'accueil (`Hero`, `APropos`, `Parcours`, `Skills`, `Temoignages`,
`IlsMeFontConfiance`, `ApercuProjets`) deviennent des partials. La traduction
des 565 lignes de `sections/` est mécanique : du HTML avec des boucles dans
les deux cas.

### SEO

Préservé et étendu : HTML complet côté serveur, balises OG et canonical
portées par `base.html`, plus **`sitemap.xml` et flux RSS générés depuis la
base** — deux ajouts triviaux une fois le contenu en SQL, absents de la
version Astro actuelle.

### Risque identifié

Le rendu de pulldown-cmark **ne sera pas strictement identique** à celui
d'Astro (sauts de ligne, liens, smartypants). Les 14 fiches de contenu
devront être vérifiées visuellement en phase 2. Ce n'est pas un risque
technique mais du travail réel, budgété comme tel.

## 4. Îlots React

Deux îlots, quasiment inchangés.

| Îlot | Lignes | Page | Modification |
|---|---|---|---|
| `ChatBot` | 273 | toutes | URL de l'API uniquement |
| `WargamesGame` + `MarvinShell` + `minimax` | 629 | `/wargames` | aucune (100 % client) |

La directive `client:load` d'Astro est remplacée par un montage explicite :

```html
<div id="chatbot-root"></div>
<script type="module" src="/static/chatbot.js"></script>
```

```ts
// frontend/src/islands/chatbot/main.tsx
createRoot(document.getElementById('chatbot-root')!).render(<ChatBot />);
```

Vite produit deux bundles séparés (`build.rollupOptions.input` multi-entrées)
vers `backend/static/`. Conséquence : `/wargames` ne charge pas le code du
chatbot, et réciproquement — les 481 lignes de logique de jeu ne pèsent que
sur la page concernée.

## 5. Chatbot

Portage le plus délicat : le prompt système est aujourd'hui construit à partir
de quatre fichiers TypeScript. En Rust, il est construit depuis la base.

```rust
async fn build_system_prompt(pool: &SqlitePool) -> Result<String> {
    // career + skills + testimonials + companies + titres de projets
    // une requête par table, formatage identique à l'actuel
}
```

**Invalidation du cache.** La version actuelle mémoïse le prompt dans une
variable de module (`cachedPrompt`). Le contenu pouvant désormais changer via
l'admin, le cache devient un `RwLock<Option<String>>` dans l'état applicatif,
**invalidé à chaque écriture admin** sur `career`, `skills`, `testimonials` ou
`companies`. Sans cela, une modification de contenu ne serait jamais reflétée
par le chatbot, et l'admin donnerait l'illusion de le mettre à jour.

**Marqueur `[LANCER_JEU]`.** Le prompt demande au modèle d'émettre ce marqueur,
que `ChatBot.tsx` détecte pour lancer le jeu. Ce contrat entre le prompt et le
composant doit être préservé mot pour mot : c'est le type de détail qui se
perd dans une migration et casse une fonctionnalité **sans erreur visible**.
Point de vérification explicite en phase 3.

**Repris à l'identique** : timeout de 5 s (via `reqwest`), message dédié sur
rate-limit 429, journalisation des erreurs côté serveur. Ces comportements
sont bien conçus dans la version actuelle.

## 6. Formulaire de contact

L'implémentation actuelle lit `contact.json`, ajoute une entrée et réécrit le
fichier entier. **Deux envois simultanés font perdre un message** — un bug
latent aujourd'hui. Un `INSERT` SQLite est atomique : le défaut disparaît par
construction.

Ajouts par rapport à l'existant, tous deux absents aujourd'hui :

- validation serveur (format d'email, longueurs bornées) ;
- rate-limit par IP hachée.

## 7. Admin et authentification

Représente environ 40 % du travail backend. Livrée en phase 4, une fois le
site public déjà fonctionnel.

### Authentification

```
POST /admin/login    → vérification Argon2id, ouverture de session
POST /admin/logout   → destruction de la session
GET  /admin/*        → middleware : sans session valide → 302 /admin/login
```

`actix-session` + `CookieSessionStore`, cookie signé par une clé de 64 octets
issue de l'environnement. Attributs : `HttpOnly`, `Secure`, `SameSite=Lax`,
expiration 7 jours.

Le compte est créé par `cargo run --bin create-admin`, qui demande le mot de
passe en interactif et stocke un hash Argon2id. **Aucun mot de passe dans le
code, ni dans une migration, ni dans un `.env`.**

**Hors périmètre** (éditeur unique) : inscription, rôles, réinitialisation par
email, 2FA. Un mot de passe perdu se règle en relançant `create-admin`.

**Protections non négociables** sur un formulaire de login public :

- rate-limit sur `/admin/login` : 5 tentatives par IP par 15 minutes ;
- jeton CSRF sur tous les POST (les sessions par cookie y sont vulnérables
  par défaut) ;
- comparaison à temps constant et message d'erreur unique
  (« identifiants invalides »), sans distinguer utilisateur inconnu et mot de
  passe erroné.

### Écrans

Sept pages en Askama — pas de React. L'admin est un CRUD à formulaires : le
SSR classique lui convient mieux qu'une SPA et évite de construire une API
JSON en doublon des vues.

| Route | Rôle |
|---|---|
| `/admin` | tableau de bord : compteurs, derniers messages |
| `/admin/projects` + `/new` + `/:id/edit` | CRUD projets |
| `/admin/posts` + `/new` + `/:id/edit` | CRUD articles |
| `/admin/career`, `/skills`, `/testimonials`, `/companies` | listes éditables et réordonnables |
| `/admin/messages` | messages de contact, lu/non-lu, suppression |

L'éditeur Markdown est un `<textarea>` avec aperçu rendu côté serveur à
l'enregistrement. Pas d'éditeur riche : puits de complexité injustifié pour
un contenu modifié quelques fois par an.

### Trois détails d'ergonomie

**Réordonnancement** : boutons ↑/↓ en POST sur les tables à `sort_order`. Pas
de drag-and-drop, qui exigerait du JS et une API dédiée.

**Upload d'images** : les projets référencent des images dans
`public/projects/`. Sans upload, créer un projet depuis l'admin imposerait un
dépôt de fichier en SSH, ce qui viderait l'admin de son intérêt. Upload
multipart vers un dossier persistant, validation du type MIME, plafond 5 Mo.

**Invalidation du cache du prompt** : toute écriture sur `career`, `skills`,
`testimonials` ou `companies` vide le cache décrit en §5. C'est le lien entre
l'admin et le chatbot.

## 8. Tests

Le dépôt actuel n'a aucun test. La devise affichée sur le site étant
« Qu'importe la stack, pourvu qu'on ait les tests », une vitrine sans suite de
tests serait une contradiction visible. Les tests sont donc dans le périmètre,
pas en option.

| Niveau | Outil | Couverture |
|---|---|---|
| Unitaire | `#[test]` | construction du prompt, validation contact, rendu Markdown, hash/vérification Argon2 |
| Intégration | `actix_web::test` + SQLite en mémoire | chaque route : statuts, redirections d'auth, CRUD complet |
| Composants | Vitest + Testing Library | `ChatBot` (détection `[LANCER_JEU]`, gestion d'erreur), `minimax` (invariant : l'IA est imbattable) |

Les tests d'intégration tournent sur `sqlite::memory:` avec migrations
appliquées : rapides, isolés, sans état partagé. `minimax` est le cas idéal du
test unitaire — fonction pure, invariant vérifiable exhaustivement.

**Méthode** : TDD sur le backend (rouge, vert, refactor), conformément à la
méthode annoncée sur le site.

## 9. Déploiement

`Dockerfile` multi-stage :

```
stage 1 (rust:1.89)   → cargo build --release
stage 2 (oven/bun)    → vite build + tailwind → assets statiques
stage 3 (debian-slim) → binaire + assets + migrations
```

L'image finale ne contient ni Rust ni Node : un binaire, des assets, quelques
dizaines de mégaoctets. C'est l'argument vitrine sous sa forme la plus
concrète.

### Persistance — exigences, pas améliorations

Le fichier `.db` **est** le contenu du site (conséquence de la décision 2) :

- monté sur un **volume persistant**, jamais dans l'image ni dans Git ;
- mode **WAL** activé (concurrence lecture/écriture) ;
- **sauvegarde quotidienne** par `VACUUM INTO` vers un fichier daté,
  rétention 30 jours ;
- migrations versionnées dans le dépôt, appliquées au démarrage.

Sans ces quatre points, un redéploiement malheureux efface le portfolio. Avec
eux, le risque est comparable à celui d'un dépôt Git.

### Filet de secours

Les `.md` et `.ts` d'origine sont conservés et versionnés dans
`content-archive/`. Coût nul, et le seed reste rejouable si la base est perdue
avant que les sauvegardes ne soient en place.

## 10. Phases

Chaque phase se termine sur un état fonctionnel.

1. **Fondations** — crate Actix, schéma, migrations, `seed` important les 14
   `.md` et les 3 fichiers TS.
   *Fin de phase : la base contient tout le contenu actuel.*

2. **Site public SSR** — templates Askama, 7 pages, assets, sitemap, RSS.
   *Fin de phase : site consultable, sans îlots.*

3. **Îlots React** — build Vite, montage `ChatBot` et `WargamesGame`,
   `/api/chat` et `/api/contact` en Rust.
   *Fin de phase : **parité fonctionnelle** avec l'existant.*

4. **Admin** — auth, CRUD, upload, invalidation du cache.
   *Fin de phase : contenu éditable sans SQL.*

5. **Déploiement** — Docker, sauvegardes, bascule.

La phase 3 est le jalon de parité : le nouveau site fait alors tout ce que
fait l'ancien, et l'admin s'ajoute ensuite sans blocage.

## Points de vigilance

Récapitulatif des risques identifiés, à vérifier explicitement pendant
l'implémentation :

| Risque | Phase | Traitement |
|---|---|---|
| Marqueur `[LANCER_JEU]` : rupture silencieuse du contrat prompt ↔ composant | 3 | test d'intégration dédié |
| Rendu Markdown différent d'Astro sur les 14 fiches | 2 | vérification visuelle fiche par fiche |
| Cache du prompt non invalidé → chatbot obsolète après édition | 4 | invalidation à chaque écriture admin + test |
| Perte du `.db` (contenu non reconstructible depuis Git) | 5 | volume persistant + `VACUUM INTO` quotidien |
| Login admin exposé à la force brute | 4 | rate-limit + CSRF + erreur générique |

## Hors périmètre

- Persistance des conversations du chatbot (décision 4).
- Multi-utilisateurs, rôles, inscription, réinitialisation de mot de passe.
- Éditeur Markdown riche (WYSIWYG).
- Drag-and-drop pour le réordonnancement.
- Migration du thème visuel : `retro.css` et les classes Tailwind sont repris
  tels quels.
