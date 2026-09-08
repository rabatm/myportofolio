# Refonte Actix Web + SQLite + React 19.2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruire le portfolio sur un binaire Rust unique (Actix Web + SQLite, SSR Askama) avec deux îlots React 19.2, dans un dépôt neuf, sans jamais casser le site Astro actuellement en production.

**Architecture:** Un binaire Actix sert le HTML rendu côté serveur par Askama depuis SQLite, plus les assets statiques et deux endpoints JSON (`/api/chat`, `/api/contact`). React 19.2 n'est monté que sur les îlots `ChatBot` et `WargamesGame`, bundlés séparément par Vite. Le contenu éditorial (14 `.md` + 4 fichiers `.ts`) est importé en base par un binaire `seed` qui lit l'ancien dépôt.

**Tech Stack:** Rust 1.98, Actix Web 4.15, SQLx 0.9 (SQLite), Askama 0.16, pulldown-cmark 0.13, reqwest, Tokio 1.53 · React 19.2, Vite, Tailwind 4, Bun 1.3.5 · Vitest + Testing Library

**Spec:** `myFolio/superior-star/docs/superpowers/specs/2026-09-07-refonte-actix-react-design.md`

## Global Constraints

- **Dépôt neuf** : tout est créé dans `/Users/martincelavie/DEV/martininfo/myFolioRS/`. Le dépôt Astro `myFolio/superior-star/` est en **lecture seule** — aucune tâche de ce plan ne le modifie.
- **Chemin source du contenu** : `/Users/martincelavie/DEV/martininfo/myFolio/superior-star/src/`
- **TDD strict** : test rouge → implémentation minimale → test vert → commit. Chaque tâche suit ce cycle.
- **`cargo fmt` avant chaque commit.** Les extraits de code de ce plan sont
  écrits à la main et ne respectent pas toujours la mise en page de rustfmt.
  Lancer `cargo fmt` avant de commiter, et vérifier que `cargo fmt --check` et
  `cargo clippy --all-targets` sont silencieux. Le projet est une vitrine
  technique : du code non formaté est ce qu'un lecteur remarque en premier.
- **Langue** : tout le contenu affiché est en français. Les identifiants de code sont en anglais.
- **Couleurs** (reprises de `retro.css`) : fond `#0a0a0a`, texte `#f0f0f0`, accent `#00fff7`, vert `#39ff14`
- **Police** : monospace partout
- **`askama_actix` est déprécié** — ne pas l'utiliser. Rendre via `template.render()?` puis `HttpResponse::Ok().content_type("text/html; charset=utf-8").body(html)`.
- **Modèle Groq** : `llama-3.3-70b-versatile`, `max_tokens: 250`, timeout 5 s
- **Marqueur de jeu** : la chaîne exacte `[LANCER_JEU]` est un contrat entre le prompt système et `ChatBot.tsx`. Ne jamais la modifier.
- **Ids de section — contrat avec le chatbot.** `ChatBot.tsx` observe les
  sections via `document.getElementById(id)` sur les clés de `sectionLines`.
  Les `<section>` de la page d'accueil doivent donc porter **exactement** ces
  six ids, à l'identique de l'ancien site : `apropos`, `competences`,
  `confiance`, `parcours`, `projets`, `temoignages`. Un id renommé ne produit
  aucune erreur : les répliques de Marvin cessent simplement de se déclencher,
  en silence. La clé `key` des lignes `scope='section'` en base doit utiliser
  ces mêmes valeurs. **Un test doit verrouiller ce contrat** en confrontant les
  ids du HTML aux clés `scope='section'` de la base : c'est leur désaccord qui
  casse le chatbot, et rien ne le signale à l'exécution.
- **Aucun secret en dur** : `GROQ_API_KEY` et `SESSION_KEY` viennent de l'environnement.
- **Port de vérification : 8090.** Le port 8080 est occupé par un tunnel SSH sur
  cette machine — un `curl` vers 8080 interrogerait le tunnel, pas le serveur,
  et renverrait un résultat trompeur au lieu d'une erreur. Toute vérification
  manuelle lance donc `BIND_ADDR=127.0.0.1:8090 cargo run` et interroge
  `http://127.0.0.1:8090`. La valeur par défaut dans le code reste `127.0.0.1:8080`.

## Écart par rapport à la spec

La spec omet une source de données découverte pendant la rédaction du plan :
`src/data/marvinLines.ts` (76 lignes) fournit les répliques pré-écrites de
Marvin, tirées au sort à chaque rendu, utilisées par 5 pages
(`index`, `projets`, `projets/[slug]`, `blog`, `contact`). Elles ne passent
pas par le LLM — c'est délibéré : instantané, gratuit, et le quota Groq reste
pour le chat interactif.

Le plan ajoute donc une table `marvin_lines` (Task 3) absente du §2 de la
spec. Traitée ici, pas reportée.

## Structure des fichiers

```
myFolioRS/
├── backend/
│   ├── Cargo.toml
│   ├── migrations/
│   │   └── 0001_initial.sql          # les 12 tables
│   ├── templates/                    # Askama (.html)
│   │   ├── base.html                 # <head>, OG, canonical, nav, footer
│   │   ├── index.html                # accueil + 7 partials de section
│   │   ├── sections/*.html           # hero, apropos, skills, …
│   │   ├── projets.html, projet_detail.html
│   │   ├── blog.html, post_detail.html
│   │   ├── contact.html, wargames.html
│   │   └── admin/*.html              # phase 4
│   ├── static/                       # produit par Vite, non versionné
│   └── src/
│       ├── main.rs                   # bootstrap Actix, AppState
│       ├── config.rs                 # variables d'environnement
│       ├── error.rs                  # AppError + ResponseError
│       ├── markdown.rs               # pulldown-cmark
│       ├── db/
│       │   ├── mod.rs                # pool, migrations
│       │   ├── models.rs             # structs FromRow
│       │   ├── content.rs            # requêtes projects/posts/tags
│       │   ├── personal.rs           # career/skills/testimonials/companies
│       │   ├── marvin.rs             # marvin_lines
│       │   └── contact.rs            # contact_messages
│       ├── routes/
│       │   ├── mod.rs                # configuration des routes
│       │   ├── pages.rs              # 7 pages publiques
│       │   ├── feeds.rs              # sitemap.xml, rss.xml
│       │   ├── api_contact.rs
│       │   └── api_chat.rs
│       ├── prompt.rs                 # construction + cache du prompt système
│       └── bin/
│           ├── seed.rs
│           └── create_admin.rs       # phase 4
└── frontend/
    ├── package.json, vite.config.ts, tsconfig.json
    └── src/islands/
        ├── chatbot/{main.tsx,ChatBot.tsx}
        └── wargames/{main.tsx,WargamesGame.tsx,MarvinShell.tsx,minimax.ts}
```

**Découpage** : `db/` est séparé par domaine plutôt qu'en un fichier unique — les requêtes de contenu et les requêtes personnelles changent pour des raisons différentes. `prompt.rs` est isolé parce qu'il consomme quatre modules `db/` et porte le cache.

---

## Phase 1 — Fondations

### Task 1: Squelette du dépôt et serveur Actix minimal

**Files:**
- Create: `myFolioRS/backend/Cargo.toml`
- Create: `myFolioRS/backend/src/main.rs`
- Create: `myFolioRS/backend/src/lib.rs`
- Create: `myFolioRS/backend/src/config.rs`
- Create: `myFolioRS/.gitignore`
- Create: `myFolioRS/README.md`

**Interfaces:**
- Produces: `Config::from_env() -> Result<Config, ConfigError>` avec les champs `database_url: String`, `bind_addr: String`, `groq_api_key: Option<String>`
- Produces: serveur Actix répondant `200 OK` sur `GET /health`

- [ ] **Step 1: Créer le dépôt et le .gitignore**

```bash
mkdir -p /Users/martincelavie/DEV/martininfo/myFolioRS/backend/src
cd /Users/martincelavie/DEV/martininfo/myFolioRS
git init
```

`myFolioRS/.gitignore` :

```gitignore
/backend/target/
/backend/static/
/backend/*.db
/backend/*.db-shm
/backend/*.db-wal
/frontend/node_modules/
/frontend/dist/
.env
.DS_Store
```

- [ ] **Step 2: Écrire Cargo.toml**

`myFolioRS/backend/Cargo.toml` :

```toml
[package]
name = "myfolio"
version = "0.1.0"
edition = "2021"
rust-version = "1.98"

[dependencies]
actix-web = "4.15"
actix-files = "0.6"
tokio = { version = "1.53", features = ["macros", "rt-multi-thread"] }
sqlx = { version = "0.9", features = ["runtime-tokio", "sqlite", "macros", "migrate"] }
askama = "0.16"
pulldown-cmark = "0.13"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["json"] }
thiserror = "2"
anyhow = "1"
dotenvy = "0.15"
env_logger = "0.11"
log = "0.4"
sha2 = "0.10"
chrono = "0.4"

[dev-dependencies]
actix-rt = "2"
```

- [ ] **Step 3: Écrire le test de config**

`myFolioRS/backend/src/config.rs` :

```rust
#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub bind_addr: String,
    pub groq_api_key: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("variable d'environnement manquante : {0}")]
    Missing(&'static str),
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn database_url_a_une_valeur_par_defaut() {
        let cfg = Config::from_env().expect("config valide");
        assert!(cfg.database_url.contains("myfolio.db"));
    }

    #[test]
    fn bind_addr_a_une_valeur_par_defaut() {
        let cfg = Config::from_env().expect("config valide");
        assert_eq!(cfg.bind_addr, "127.0.0.1:8080");
    }
}
```

- [ ] **Step 4: Lancer le test — il doit échouer**

Run: `cd myFolioRS/backend && cargo test config`
Expected: FAIL — panic sur `todo!()` (`not yet implemented`)

- [ ] **Step 5: Implémenter Config::from_env**

```rust
impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite://myfolio.db?mode=rwc".to_string()),
            bind_addr: std::env::var("BIND_ADDR")
                .unwrap_or_else(|_| "127.0.0.1:8080".to_string()),
            groq_api_key: std::env::var("GROQ_API_KEY").ok(),
        })
    }
}
```

- [ ] **Step 6: Lancer le test — il doit passer**

Run: `cargo test config`
Expected: PASS (2 tests)

- [ ] **Step 7: Écrire main.rs avec /health et son test**

Le crate expose une lib **dès maintenant** : le binaire `seed` (Task 4) et les
tests d'intégration en auront besoin, et l'ajouter après coup obligerait à
réécrire tous les `mod` en `use`.

`myFolioRS/backend/src/lib.rs` :

```rust
pub mod config;
```

`myFolioRS/backend/src/main.rs` :

```rust
use myfolio::config;

use actix_web::{get, App, HttpResponse, HttpServer, Responder};

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().body("ok")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init();

    let cfg = config::Config::from_env().expect("configuration invalide");
    let addr = cfg.bind_addr.clone();
    log::info!("écoute sur http://{addr}");

    HttpServer::new(|| App::new().service(health))
        .bind(&addr)?
        .run()
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;

    #[actix_web::test]
    async fn health_repond_200() {
        let app = test::init_service(App::new().service(health)).await;
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);
    }
}
```

- [ ] **Step 8: Vérifier que le serveur compile, tourne et répond**

Run: `cargo test` puis `BIND_ADDR=127.0.0.1:8090 cargo run` dans un terminal, et dans un autre :
```bash
curl -s http://127.0.0.1:8090/health
```
Expected: `cargo test` PASS (3 tests) ; `curl` affiche `ok`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: squelette Actix + configuration par environnement"
```

---

### Task 2: Schéma SQLite et migrations

**Files:**
- Create: `myFolioRS/backend/migrations/0001_initial.sql`
- Create: `myFolioRS/backend/src/db/mod.rs`
- Modify: `myFolioRS/backend/src/main.rs` (déclarer `mod db`, créer le pool)

**Interfaces:**
- Consumes: `Config::database_url` (Task 1)
- Produces: `db::init_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error>` — crée le fichier si absent, active WAL, applique les migrations
- Produces: les 12 tables du schéma

- [ ] **Step 1: Écrire la migration**

`myFolioRS/backend/migrations/0001_initial.sql` — le schéma complet du §2 de la spec, plus `marvin_lines` :

```sql
CREATE TABLE projects (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  description TEXT NOT NULL,
  body_md     TEXT NOT NULL,
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

-- `sort_order` préserve l'ordre des tags tel qu'écrit dans le frontmatter :
-- il reflète l'importance relative des technologies, ce n'est pas un détail.
-- Sans lui, `group_concat` renvoie l'ordre que le moteur décide.
CREATE TABLE project_tags (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE post_tags (
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE career (
  id          INTEGER PRIMARY KEY,
  periode     TEXT NOT NULL,
  titre       TEXT NOT NULL,
  entreprise  TEXT,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

CREATE TABLE skills (
  id         INTEGER PRIMARY KEY,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE testimonials (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  title      TEXT NOT NULL,
  company    TEXT NOT NULL,
  quote      TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE companies (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT NOT NULL,
  logo        TEXT,
  sort_order  INTEGER NOT NULL
);

-- Répliques pré-écrites de Marvin (hors LLM). scope='page' → key = chemin URL
-- ('/projets'), scope='section' → key = id du <section> ('apropos'),
-- scope='project' → répliques des pages de détail projet, avec un
-- placeholder {titre} substitué au rendu (key = 'detail').
CREATE TABLE marvin_lines (
  id    INTEGER PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('page', 'section', 'project')),
  key   TEXT NOT NULL,
  line  TEXT NOT NULL
);
CREATE INDEX idx_marvin_lines_scope_key ON marvin_lines(scope, key);

CREATE TABLE contact_messages (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at    TEXT,
  ip_hash    TEXT
);

CREATE TABLE admin_users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_projects_date     ON projects(date DESC);
CREATE INDEX idx_posts_date        ON posts(date DESC);
CREATE INDEX idx_projects_published ON projects(published);
CREATE INDEX idx_posts_published    ON posts(published);
```

- [ ] **Step 2: Écrire le test du pool**

`myFolioRS/backend/src/db/mod.rs` :

```rust
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

pub async fn init_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Pool de test en mémoire, migrations appliquées.
    pub async fn test_pool() -> SqlitePool {
        init_pool("sqlite::memory:").await.expect("pool de test")
    }

    #[tokio::test]
    async fn les_migrations_creent_les_tables() {
        let pool = test_pool().await;
        let noms: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        )
        .fetch_all(&pool)
        .await
        .expect("lecture du schéma");

        for attendue in [
            "projects", "posts", "tags", "project_tags", "post_tags",
            "career", "skills", "testimonials", "companies",
            "marvin_lines", "contact_messages", "admin_users",
        ] {
            assert!(noms.iter().any(|n| n == attendue), "table manquante : {attendue}");
        }
    }

    #[tokio::test]
    async fn le_scope_marvin_lines_est_contraint() {
        let pool = test_pool().await;
        let res = sqlx::query("INSERT INTO marvin_lines (scope, key, line) VALUES ('invalide', 'k', 'l')")
            .execute(&pool)
            .await;
        assert!(res.is_err(), "le CHECK sur scope doit rejeter une valeur inconnue");
    }
}
```

- [ ] **Step 3: Lancer les tests — ils doivent échouer**

Run: `cargo test db::`
Expected: FAIL — panic sur `todo!()`

- [ ] **Step 4: Implémenter init_pool**

```rust
pub async fn init_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;

    // WAL : lectures concurrentes pendant une écriture. Sans effet en mémoire.
    sqlx::query("PRAGMA journal_mode = WAL;").execute(&pool).await?;
    sqlx::query("PRAGMA foreign_keys = ON;").execute(&pool).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
```

- [ ] **Step 5: Lancer les tests — ils doivent passer**

Run: `cargo test db::`
Expected: PASS (2 tests)

- [ ] **Step 6: Brancher le pool dans main.rs**

Déclarer le module dans `lib.rs` (`pub mod db;`), puis dans `main.rs` :

```rust
use myfolio::{config, db};

// … dans main(), après Config::from_env() :
let pool = db::init_pool(&cfg.database_url).await.expect("base de données");

HttpServer::new(move || {
    App::new()
        .app_data(actix_web::web::Data::new(pool.clone()))
        .service(health)
})
.bind(&addr)?
.run()
.await
```

- [ ] **Step 7: Vérifier que la base réelle se crée**

Run: `BIND_ADDR=127.0.0.1:8090 cargo run` puis, dans un autre terminal :
```bash
sqlite3 myFolioRS/backend/myfolio.db ".tables"
```
Expected: les 12 tables listées

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: schéma SQLite, migrations et pool de connexions"
```

---

### Task 3: Modèles et requêtes de lecture

**Files:**
- Create: `myFolioRS/backend/src/db/models.rs`
- Create: `myFolioRS/backend/src/db/content.rs`
- Create: `myFolioRS/backend/src/db/personal.rs`
- Create: `myFolioRS/backend/src/db/marvin.rs`
- Modify: `myFolioRS/backend/src/db/mod.rs` (déclarer les sous-modules, exposer `test_pool`)

**Interfaces:**
- Consumes: `db::init_pool` (Task 2)
- Produces les structs : `Project { id, slug, title, date, description, body_md, image, url, github, tags: Vec<String> }`, `Post { id, slug, title, date, description, body_md, tags: Vec<String> }`, `CareerEntry { periode, titre, entreprise: Option<String>, description }`, `SkillGroup { category, items: Vec<String> }`, `Testimonial { name, title, company, quote }`, `Company { name, url, description, logo: Option<String> }`
- Produces les fonctions : `content::list_projects(&SqlitePool) -> Result<Vec<Project>>`, `content::get_project(&SqlitePool, slug: &str) -> Result<Option<Project>>`, `content::list_posts`, `content::get_post`, `personal::list_career`, `personal::list_skills`, `personal::list_testimonials`, `personal::list_companies`, `marvin::pick_page_line(&SqlitePool, path: &str) -> Result<Option<String>>`, `marvin::pick_section_lines(&SqlitePool) -> Result<HashMap<String, String>>`

- [ ] **Step 1: Exposer le pool de test hors du module tests**

Dans `db/mod.rs`, remplacer le `test_pool` privé par une version partagée :

```rust
pub mod content;
pub mod marvin;
pub mod models;
pub mod personal;

// … init_pool inchangé …

/// Pool en mémoire avec migrations, pour les tests de tout le crate.
#[cfg(test)]
pub async fn test_pool() -> SqlitePool {
    init_pool("sqlite::memory:").await.expect("pool de test")
}
```

Adapter les deux tests de Task 2 pour appeler `super::test_pool()`.

- [ ] **Step 2: Écrire models.rs**

```rust
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Project {
    pub id: i64,
    pub slug: String,
    pub title: String,
    pub date: String,
    pub description: String,
    pub body_md: String,
    pub image: Option<String>,
    pub url: Option<String>,
    pub github: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Post {
    pub id: i64,
    pub slug: String,
    pub title: String,
    pub date: String,
    pub description: String,
    pub body_md: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CareerEntry {
    pub periode: String,
    pub titre: String,
    pub entreprise: Option<String>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SkillGroup {
    pub category: String,
    pub items: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Testimonial {
    pub name: String,
    pub title: String,
    pub company: String,
    pub quote: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Company {
    pub name: String,
    pub url: String,
    pub description: String,
    pub logo: Option<String>,
}
```

- [ ] **Step 3: Écrire les tests de content.rs**

`myFolioRS/backend/src/db/content.rs` :

```rust
use super::models::{Post, Project};
use sqlx::SqlitePool;

pub async fn list_projects(pool: &SqlitePool) -> Result<Vec<Project>, sqlx::Error> {
    todo!()
}

pub async fn get_project(pool: &SqlitePool, slug: &str) -> Result<Option<Project>, sqlx::Error> {
    todo!()
}

pub async fn list_posts(pool: &SqlitePool) -> Result<Vec<Post>, sqlx::Error> {
    todo!()
}

pub async fn get_post(pool: &SqlitePool, slug: &str) -> Result<Option<Post>, sqlx::Error> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn insere_projet(pool: &SqlitePool, slug: &str, date: &str, published: i64, tags: &[&str]) {
        let id: i64 = sqlx::query_scalar(
            "INSERT INTO projects (slug, title, date, description, body_md, published)
             VALUES (?, ?, ?, 'desc', '# corps', ?) RETURNING id",
        )
        .bind(slug).bind(format!("Titre {slug}")).bind(date).bind(published)
        .fetch_one(pool).await.unwrap();

        for t in tags {
            let tag_id: i64 = sqlx::query_scalar(
                "INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id",
            ).bind(t).fetch_one(pool).await.unwrap();
            sqlx::query("INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)")
                .bind(id).bind(tag_id).execute(pool).await.unwrap();
        }
    }

    #[tokio::test]
    async fn list_projects_trie_du_plus_recent_au_plus_ancien() {
        let pool = crate::db::test_pool().await;
        insere_projet(&pool, "vieux", "2024-01-01", 1, &[]).await;
        insere_projet(&pool, "recent", "2026-07-30", 1, &[]).await;

        let projets = list_projects(&pool).await.unwrap();
        assert_eq!(projets.len(), 2);
        assert_eq!(projets[0].slug, "recent", "le plus récent doit être en tête");
        assert_eq!(projets[1].slug, "vieux");
    }

    #[tokio::test]
    async fn list_projects_exclut_les_non_publies() {
        let pool = crate::db::test_pool().await;
        insere_projet(&pool, "visible", "2026-01-01", 1, &[]).await;
        insere_projet(&pool, "brouillon", "2026-02-01", 0, &[]).await;

        let projets = list_projects(&pool).await.unwrap();
        assert_eq!(projets.len(), 1);
        assert_eq!(projets[0].slug, "visible");
    }

    #[tokio::test]
    async fn list_projects_remonte_les_tags() {
        let pool = crate::db::test_pool().await;
        insere_projet(&pool, "amiqo", "2026-07-30", 1, &["Flutter", "SQLite"]).await;

        let projets = list_projects(&pool).await.unwrap();
        let mut tags = projets[0].tags.clone();
        tags.sort();
        assert_eq!(tags, vec!["Flutter", "SQLite"]);
    }

    #[tokio::test]
    async fn get_project_renvoie_none_si_slug_inconnu() {
        let pool = crate::db::test_pool().await;
        assert!(get_project(&pool, "inexistant").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn get_project_renvoie_le_corps_markdown() {
        let pool = crate::db::test_pool().await;
        insere_projet(&pool, "bomiqo", "2026-07-30", 1, &["Django"]).await;

        let p = get_project(&pool, "bomiqo").await.unwrap().expect("projet trouvé");
        assert_eq!(p.body_md, "# corps");
        assert_eq!(p.tags, vec!["Django"]);
    }
}
```

- [ ] **Step 4: Lancer les tests — ils doivent échouer**

Run: `cargo test db::content`
Expected: FAIL — 5 panics sur `todo!()`

- [ ] **Step 5: Implémenter content.rs**

```rust
/// Ligne brute : les tags arrivent concaténés par group_concat.
#[derive(sqlx::FromRow)]
struct ProjectRow {
    id: i64,
    slug: String,
    title: String,
    date: String,
    description: String,
    body_md: String,
    image: Option<String>,
    url: Option<String>,
    github: Option<String>,
    tags: Option<String>,
}

impl From<ProjectRow> for Project {
    fn from(r: ProjectRow) -> Self {
        Project {
            id: r.id, slug: r.slug, title: r.title, date: r.date,
            description: r.description, body_md: r.body_md,
            image: r.image, url: r.url, github: r.github,
            tags: split_tags(r.tags),
        }
    }
}

fn split_tags(raw: Option<String>) -> Vec<String> {
    raw.filter(|s| !s.is_empty())
        .map(|s| s.split('\u{1f}').map(str::to_string).collect())
        .unwrap_or_default()
}

const PROJECT_SELECT: &str = r#"
    SELECT p.id, p.slug, p.title, p.date, p.description, p.body_md,
           p.image, p.url, p.github,
           group_concat(t.name, char(31)) AS tags
    FROM projects p
    LEFT JOIN project_tags pt ON pt.project_id = p.id
    LEFT JOIN tags t          ON t.id = pt.tag_id
"#;

pub async fn list_projects(pool: &SqlitePool) -> Result<Vec<Project>, sqlx::Error> {
    let rows: Vec<ProjectRow> = sqlx::query_as(&format!(
        "{PROJECT_SELECT} WHERE p.published = 1 GROUP BY p.id ORDER BY p.date DESC"
    ))
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(Into::into).collect())
}

pub async fn get_project(pool: &SqlitePool, slug: &str) -> Result<Option<Project>, sqlx::Error> {
    let row: Option<ProjectRow> = sqlx::query_as(&format!(
        "{PROJECT_SELECT} WHERE p.slug = ? AND p.published = 1 GROUP BY p.id"
    ))
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(Into::into))
}
```

Écrire `PostRow`, `POST_SELECT`, `list_posts` et `get_post` sur le même modèle,
sans les colonnes `image`, `url`, `github`, avec les tables `posts` et `post_tags`.

**Et écrire leurs tests en miroir des cinq tests projets ci-dessus** : tri
décroissant, exclusion des non publiés, remontée des tags, `None` sur slug
inconnu, corps Markdown renvoyé. Avec un helper `insere_article(...)` calqué
sur `insere_projet(...)`. Sans ces tests, `get_post` peut renvoyer `None` en
permanence — toutes les pages d'articles en 404 — sans qu'aucun test n'échoue.

Note : le séparateur est `char(31)` (unité ASCII), pas une virgule — un tag
peut contenir une virgule, pas un caractère de contrôle.

- [ ] **Step 6: Lancer les tests — ils doivent passer**

Run: `cargo test db::content`
Expected: PASS (5 tests)

- [ ] **Step 7: Écrire les tests de personal.rs**

```rust
use super::models::{CareerEntry, Company, SkillGroup, Testimonial};
use sqlx::SqlitePool;

pub async fn list_career(pool: &SqlitePool) -> Result<Vec<CareerEntry>, sqlx::Error> { todo!() }
pub async fn list_skills(pool: &SqlitePool) -> Result<Vec<SkillGroup>, sqlx::Error> { todo!() }
pub async fn list_testimonials(pool: &SqlitePool) -> Result<Vec<Testimonial>, sqlx::Error> { todo!() }
pub async fn list_companies(pool: &SqlitePool) -> Result<Vec<Company>, sqlx::Error> { todo!() }

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn list_career_respecte_sort_order() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO career (periode, titre, entreprise, description, sort_order) VALUES
            ('2021', 'Deuxième', NULL, 'd', 1),
            ('2026', 'Premier', 'AMOPI', 'd', 0)")
            .execute(&pool).await.unwrap();

        let entrees = list_career(&pool).await.unwrap();
        assert_eq!(entrees[0].titre, "Premier");
        assert_eq!(entrees[0].entreprise.as_deref(), Some("AMOPI"));
        assert_eq!(entrees[1].titre, "Deuxième");
        assert_eq!(entrees[1].entreprise, None, "entreprise vide reste None");
    }

    #[tokio::test]
    async fn list_skills_regroupe_par_categorie_en_conservant_l_ordre() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO skills (category, name, sort_order) VALUES
            ('Conception & qualité', 'Architecture hexagonale', 0),
            ('Conception & qualité', 'TDD', 1),
            ('Backend', 'Rust', 2)")
            .execute(&pool).await.unwrap();

        let groupes = list_skills(&pool).await.unwrap();
        assert_eq!(groupes.len(), 2, "deux catégories distinctes");
        assert_eq!(groupes[0].category, "Conception & qualité");
        assert_eq!(groupes[0].items, vec!["Architecture hexagonale", "TDD"]);
        assert_eq!(groupes[1].items, vec!["Rust"]);
    }

    #[tokio::test]
    async fn list_testimonials_et_companies_respectent_sort_order() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO testimonials (name, title, company, quote, sort_order)
            VALUES ('B', 't', 'c', 'q', 1), ('A', 't', 'c', 'q', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO companies (name, url, description, sort_order)
            VALUES ('Surikwat', 'https://surikwat.com', 'd', 2), ('Amopi', 'https://amopi.fr', 'd', 0)")
            .execute(&pool).await.unwrap();

        assert_eq!(list_testimonials(&pool).await.unwrap()[0].name, "A");
        assert_eq!(list_companies(&pool).await.unwrap()[0].name, "Amopi");
    }
}
```

- [ ] **Step 8: Lancer les tests — ils doivent échouer, puis implémenter**

Run: `cargo test db::personal`
Expected: FAIL sur `todo!()`

Implémentation :

```rust
pub async fn list_career(pool: &SqlitePool) -> Result<Vec<CareerEntry>, sqlx::Error> {
    sqlx::query_as::<_, (String, String, Option<String>, String)>(
        "SELECT periode, titre, entreprise, description FROM career ORDER BY sort_order",
    )
    .fetch_all(pool)
    .await
    .map(|rows| {
        rows.into_iter()
            .map(|(periode, titre, entreprise, description)| CareerEntry {
                periode, titre, entreprise, description,
            })
            .collect()
    })
}

pub async fn list_skills(pool: &SqlitePool) -> Result<Vec<SkillGroup>, sqlx::Error> {
    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT category, name FROM skills ORDER BY sort_order",
    )
    .fetch_all(pool)
    .await?;

    // Regroupement manuel : préserve l'ordre d'apparition des catégories,
    // ce qu'un HashMap ne garantirait pas.
    let mut groupes: Vec<SkillGroup> = Vec::new();
    for (category, name) in rows {
        match groupes.last_mut() {
            Some(g) if g.category == category => g.items.push(name),
            _ => groupes.push(SkillGroup { category, items: vec![name] }),
        }
    }
    Ok(groupes)
}

pub async fn list_testimonials(pool: &SqlitePool) -> Result<Vec<Testimonial>, sqlx::Error> {
    sqlx::query_as::<_, (String, String, String, String)>(
        "SELECT name, title, company, quote FROM testimonials ORDER BY sort_order",
    )
    .fetch_all(pool).await
    .map(|rows| rows.into_iter().map(|(name, title, company, quote)| {
        Testimonial { name, title, company, quote }
    }).collect())
}

pub async fn list_companies(pool: &SqlitePool) -> Result<Vec<Company>, sqlx::Error> {
    sqlx::query_as::<_, (String, String, String, Option<String>)>(
        "SELECT name, url, description, logo FROM companies ORDER BY sort_order",
    )
    .fetch_all(pool).await
    .map(|rows| rows.into_iter().map(|(name, url, description, logo)| {
        Company { name, url, description, logo }
    }).collect())
}
```

Attention : `list_skills` suppose que les lignes d'une même catégorie sont
contiguës une fois triées par `sort_order` — c'est ce que produit le seed
(Task 4), qui numérote en parcourant catégorie par catégorie.

- [ ] **Step 9: Lancer les tests — ils doivent passer**

Run: `cargo test db::personal`
Expected: PASS (3 tests)

- [ ] **Step 10: Écrire marvin.rs avec ses tests**

```rust
use sqlx::SqlitePool;
use std::collections::HashMap;

pub async fn pick_page_line(pool: &SqlitePool, path: &str) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT line FROM marvin_lines WHERE scope = 'page' AND key = ?
         ORDER BY RANDOM() LIMIT 1",
    )
    .bind(path)
    .fetch_optional(pool)
    .await
}

pub async fn pick_section_lines(pool: &SqlitePool) -> Result<HashMap<String, String>, sqlx::Error> {
    // Une réplique tirée au sort par section, en une seule requête.
    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT key, line FROM (
             SELECT key, line, ROW_NUMBER() OVER (PARTITION BY key ORDER BY RANDOM()) AS rn
             FROM marvin_lines WHERE scope = 'section'
         ) WHERE rn = 1",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn pick_page_line_renvoie_none_si_chemin_inconnu() {
        let pool = crate::db::test_pool().await;
        assert!(pick_page_line(&pool, "/inconnu").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn pick_page_line_ne_renvoie_que_les_lignes_du_chemin() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO marvin_lines (scope, key, line) VALUES
            ('page', '/blog', 'blog A'), ('page', '/blog', 'blog B'),
            ('page', '/contact', 'contact A')")
            .execute(&pool).await.unwrap();

        for _ in 0..10 {
            let l = pick_page_line(&pool, "/blog").await.unwrap().unwrap();
            assert!(l.starts_with("blog "), "ligne hors périmètre : {l}");
        }
    }

    #[tokio::test]
    async fn pick_section_lines_renvoie_une_ligne_par_section() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO marvin_lines (scope, key, line) VALUES
            ('section', 'apropos', 'a1'), ('section', 'apropos', 'a2'),
            ('section', 'competences', 'c1')")
            .execute(&pool).await.unwrap();

        let m = pick_section_lines(&pool).await.unwrap();
        assert_eq!(m.len(), 2);
        assert!(m["apropos"].starts_with('a'));
        assert_eq!(m["competences"], "c1");
    }
}
```

- [ ] **Step 11: Lancer toute la suite**

Run: `cargo test`
Expected: PASS (tous les tests db)

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: modèles et requêtes de lecture (contenu, données perso, répliques)"
```

---

### Task 4: Binaire de seed — import de l'ancien contenu

**Files:**
- Create: `myFolioRS/backend/src/bin/seed.rs`
- Modify: `myFolioRS/backend/Cargo.toml` (dépendances du seed)

**Interfaces:**
- Consumes: `db::init_pool` (Task 2)
- Produces: base peuplée depuis `../myFolio/superior-star/src/` — 14 projets/articles, parcours, compétences, témoignages, entreprises, répliques Marvin
- Produces: `SEED_SOURCE` — variable d'environnement pointant la racine `src/` de l'ancien dépôt, défaut `../../myFolio/superior-star/src`

Le seed lit deux formats : le frontmatter YAML des `.md`, et des fichiers `.ts`
qui ne sont pas parsables sans un moteur JS. Pour les `.ts`, on **transcrit les
données en TOML** une fois pour toutes plutôt que d'écrire un parseur
TypeScript — le contenu est figé et sera édité par l'admin ensuite.

- [ ] **Step 1: Ajouter les dépendances du seed**

Dans `[dependencies]` de `Cargo.toml` :

```toml
serde_yaml = "0.9"
toml = "0.8"
walkdir = "2"
```

- [ ] **Step 2: Transcrire les fichiers .ts en TOML**

Créer `myFolioRS/backend/seed-data/personal.toml` en recopiant fidèlement le
contenu de `parcours.ts`, `skills.ts`, `temoignages.ts`, `marvinLines.ts` et
la constante `companies` de `api/chat.ts`. Format :

```toml
[[career]]
periode = "2026"
titre = "Développeur backend & DevOps"
entreprise = "AMOPI"
description = "…"

[[skills]]
category = "Conception & qualité"
items = ["Architecture hexagonale", "DDD", "Ports & Adapters", "TDD", "Clean Code"]

[[testimonials]]
name = "…"
title = "…"
company = "…"
quote = "…"

[[companies]]
name = "Amopi"
url = "https://amopi.fr"
description = "Le Groupe Amopi accompagne la transformation numérique…"
logo = "/amopi.png"

[marvin.pages]
"/projets" = ["Treize projets. …", "La liste complète …"]
"/contact" = ["…"]

[marvin.sections]
apropos = ["« Qu'importe la stack, pourvu qu'on ait les tests. » …"]
competences = ["…"]
```

Vérifier l'exhaustivité — **attention, `grep -c` compte aussi les
déclarations d'interface TypeScript** (`quote: string;` en tête de fichier),
qui ne sont pas des données. Ne retenir que les lignes indentées de 4 espaces,
celles du tableau :

```bash
OLD=/Users/martincelavie/DEV/martininfo/myFolio/superior-star/src
python3 -c "
import re
for f, champ in [('$OLD/data/temoignages.ts','quote'), ('$OLD/data/parcours.ts','periode')]:
    s = open(f).read()
    print(f, len(re.findall(rf'^\s{4}{champ}:', s, re.M)))"
```

Comptes réels : **8** entrées de parcours, **3** témoignages, 37 compétences
en 6 catégories, 29 répliques Marvin (10 `page` + 16 `section` + 3 `project`), 3 entreprises,
13 projets, 1 article.

- [ ] **Step 3: Écrire le test du parseur de frontmatter**

`myFolioRS/backend/src/bin/seed.rs` :

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Frontmatter {
    title: String,
    date: toml::value::Datetime,
    tags: Vec<String>,
    description: String,
    #[serde(default)]
    image: Option<String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    github: Option<String>,
}

/// Sépare le frontmatter YAML du corps Markdown.
fn split_frontmatter(raw: &str) -> Option<(&str, &str)> {
    todo!()
}

fn main() { todo!() }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_frontmatter_separe_yaml_et_corps() {
        let raw = "---\ntitle: 'X'\ndate: 2026-07-30\n---\n\n# Corps\n\ntexte";
        let (fm, body) = split_frontmatter(raw).expect("frontmatter présent");
        assert!(fm.contains("title: 'X'"));
        assert!(body.trim_start().starts_with("# Corps"));
        assert!(!body.contains("---"), "les délimiteurs ne doivent pas rester");
    }

    #[test]
    fn split_frontmatter_renvoie_none_sans_delimiteur() {
        assert!(split_frontmatter("# Juste du markdown").is_none());
    }

    #[test]
    fn split_frontmatter_ne_coupe_pas_sur_un_tiret_du_corps() {
        let raw = "---\ntitle: 'X'\n---\n\ntexte\n\n---\n\nsuite";
        let (_, body) = split_frontmatter(raw).unwrap();
        assert!(body.contains("suite"), "le corps entier doit être conservé");
    }
}
```

- [ ] **Step 4: Lancer les tests — ils doivent échouer**

Run: `cargo test --bin seed`
Expected: FAIL sur `todo!()`

- [ ] **Step 5: Implémenter split_frontmatter**

```rust
fn split_frontmatter(raw: &str) -> Option<(&str, &str)> {
    let rest = raw.strip_prefix("---")?;
    // splitn(2) : seul le premier "\n---" ferme le frontmatter ; les tirets
    // du corps (séparateurs Markdown) sont préservés.
    let mut parts = rest.splitn(2, "\n---");
    let fm = parts.next()?;
    let body = parts.next()?;
    Some((fm, body.trim_start_matches(['-', '\n', '\r'])))
}
```

- [ ] **Step 6: Lancer les tests — ils doivent passer**

Run: `cargo test --bin seed`
Expected: PASS (3 tests)

- [ ] **Step 7: Implémenter le seed complet**

```rust
#[derive(Debug, Deserialize)]
struct PersonalData {
    career: Vec<CareerSeed>,
    skills: Vec<SkillSeed>,
    testimonials: Vec<TestimonialSeed>,
    companies: Vec<CompanySeed>,
    marvin: MarvinSeed,
}
// … structs de désérialisation correspondant au TOML de l'étape 2 …

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let src = std::env::var("SEED_SOURCE")
        .unwrap_or_else(|_| "../../myFolio/superior-star/src".to_string());
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://myfolio.db?mode=rwc".to_string());

    let pool = myfolio::db::init_pool(&db_url).await?;

    // TOUT le seed tient dans une transaction : sans elle, un .md malformé
    // rencontré après les DELETE laisserait la base VIDE. Vérifié : un seul
    // fichier sans frontmatter suffit à effacer 13 projets, 8 parcours,
    // 37 compétences et 26 répliques, alors que le message d'erreur, lui,
    // paraît anodin.
    let mut tx = pool.begin().await?;

    // Le seed est rejouable : on vide d'abord les tables de contenu.
    // contact_messages et admin_users sont épargnées — elles ne viennent pas des fichiers.
    for t in ["project_tags", "post_tags", "tags", "projects", "posts",
              "career", "skills", "testimonials", "companies", "marvin_lines"] {
        sqlx::query(&format!("DELETE FROM {t}")).execute(&mut *tx).await?;
    }

    let n_projets = seed_markdown(&pool, &format!("{src}/content/projects"), true).await?;
    let n_articles = seed_markdown(&pool, &format!("{src}/content/blog"), false).await?;
    let n_perso = seed_personal(&pool, "seed-data/personal.toml").await?;

    tx.commit().await?; // rien n'est visible avant ce point
    println!("{n_projets} projets, {n_articles} articles, {n_perso} entrées personnelles");
    Ok(())
}
```

`seed_markdown` et `seed_personal` reçoivent la transaction (`&mut *tx`), pas
le pool — sinon leurs écritures échapperaient au rollback.

`seed_markdown` parcourt les `.md` avec `walkdir`, dérive le slug du nom de
fichier, parse le frontmatter avec `serde_yaml`, insère le projet ou l'article,
puis insère les tags (`ON CONFLICT(name) DO UPDATE SET name=name RETURNING id`)
et les liaisons.

`seed_personal` lit le TOML et insère les cinq familles ; `sort_order` est
l'index d'itération, catégorie par catégorie pour `skills` (contrat de
`list_skills`, Task 3).

Le seed appelle `myfolio::db`, exposé par `lib.rs` depuis la Task 1.

- [ ] **Step 8: Exécuter le seed et vérifier les comptes**

Run:
```bash
cd myFolioRS/backend && cargo run --bin seed
sqlite3 myfolio.db "SELECT
  (SELECT count(*) FROM projects)  AS projets,
  (SELECT count(*) FROM posts)     AS articles,
  (SELECT count(*) FROM career)    AS parcours,
  (SELECT count(*) FROM skills)    AS competences,
  (SELECT count(*) FROM testimonials) AS temoignages,
  (SELECT count(*) FROM companies) AS entreprises,
  (SELECT count(*) FROM marvin_lines) AS repliques;"
```
Expected: 13 projets, 1 article, 8 career, 30 skills, 3 testimonials,
3 companies, 29 marvin_lines. Comparer avec :
```bash
ls /Users/martincelavie/DEV/martininfo/myFolio/superior-star/src/content/projects/*.md | wc -l
```

- [ ] **Step 9: Vérifier la rejouabilité**

Run: `cargo run --bin seed && cargo run --bin seed`
Expected: mêmes comptes après deux exécutions — aucun doublon, aucune erreur
de contrainte d'unicité

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: seed du contenu depuis l'ancien dépôt Astro"
```

**Fin de phase 1** : la base contient tout le contenu du site actuel.

---

## Phase 2 — Site public en SSR

### Task 5: Rendu Markdown et gestion d'erreurs

**Files:**
- Create: `myFolioRS/backend/src/markdown.rs`
- Create: `myFolioRS/backend/src/error.rs`
- Modify: `myFolioRS/backend/src/lib.rs`

**Interfaces:**
- Produces: `markdown::to_html(md: &str) -> String`
- Produces: `AppError` (variantes `NotFound`, `Database(sqlx::Error)`, `Template(askama::Error)`, `Internal(anyhow::Error)`) implémentant `actix_web::ResponseError` — 404 pour `NotFound`, 500 sinon

- [ ] **Step 1: Écrire les tests de markdown.rs**

```rust
use pulldown_cmark::{html, Options, Parser};

pub fn to_html(md: &str) -> String {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rend_les_titres_et_paragraphes() {
        let h = to_html("# Titre\n\nUn paragraphe.");
        assert!(h.contains("<h1>Titre</h1>"));
        assert!(h.contains("<p>Un paragraphe.</p>"));
    }

    #[test]
    fn rend_les_tableaux_gfm() {
        let h = to_html("| a | b |\n|---|---|\n| 1 | 2 |");
        assert!(h.contains("<table>"), "l'extension tables doit être activée");
    }

    #[test]
    fn rend_les_blocs_de_code_avec_langage() {
        let h = to_html("```rust\nfn main() {}\n```");
        assert!(h.contains("<code class=\"language-rust\">"));
    }

    #[test]
    fn echappe_le_html_dangereux_inline() {
        // Le contenu vient de la base, éditable via l'admin : on ne laisse pas
        // passer de <script> même si l'auteur est de confiance.
        let h = to_html("Texte <script>alert(1)</script>");
        assert!(!h.contains("<script>"), "le HTML brut ne doit pas être émis");
    }

    #[test]
    fn neutralise_les_schemas_d_url_dangereux() {
        for dangereux in [
            "[x](javascript:alert(1))",
            "[x](JaVaScRiPt:alert(1))",
            "[x](data:text/html,<script>alert(1)</script>)",
            "![x](javascript:alert(1))",
        ] {
            let h = to_html(dangereux);
            assert!(
                !h.contains("javascript:") && !h.to_lowercase().contains("data:"),
                "schéma dangereux non neutralisé dans {dangereux} → {h}"
            );
        }
    }

    #[test]
    fn preserve_les_urls_legitimes() {
        // Un filtre trop agressif serait une régression : ces liens doivent passer.
        for (md, attendu) in [
            ("[x](https://example.com)", "https://example.com"),
            ("[x](mailto:a@b.fr)", "mailto:a@b.fr"),
            ("[x](/projets/amiqo)", "/projets/amiqo"),
            ("[x](#section)", "#section"),
            ("[x](/page?q=a:b)", "/page?q=a:b"),
        ] {
            let h = to_html(md);
            assert!(h.contains(attendu), "URL légitime altérée : {md} → {h}");
        }
    }
}
```

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

Run: `cargo test markdown`
Expected: FAIL sur `todo!()`

- [ ] **Step 3: Implémenter to_html**

```rust
pub fn to_html(md: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_FOOTNOTES);
    opts.insert(Options::ENABLE_SMART_PUNCTUATION);

    // ATTENTION : il n'existe PAS d'option `ENABLE_HTML` dans pulldown-cmark
    // 0.13 — le HTML brut est TOUJOURS émis verbatim par `push_html`, quelles
    // que soient les options. Pour l'échapper, il faut filtrer les événements
    // `Event::Html` et `Event::InlineHtml` du flux avant le rendu.
    // De même, les liens Markdown passent par `Tag::Link` / `Tag::Image` et
    // échappent à ce filtre : `escape_href` échappe les caractères spéciaux
    // mais ne valide aucun schéma, donc `[x](javascript:alert(1))` est émis
    // tel quel. Filtrer les schémas par liste blanche (http, https, mailto,
    // URLs relatives) — voir les tests de cette tâche.
    let parser = Parser::new_ext(md, opts);
    let mut out = String::with_capacity(md.len() * 3 / 2);
    html::push_html(&mut out, parser);
    out
}
```

- [ ] **Step 4: Lancer les tests — ils doivent passer**

Run: `cargo test markdown`
Expected: PASS (4 tests)

- [ ] **Step 5: Écrire error.rs**

```rust
use actix_web::{http::StatusCode, HttpResponse, ResponseError};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("page introuvable")]
    NotFound,
    #[error("erreur de base de données")]
    Database(#[from] sqlx::Error),
    #[error("erreur de template")]
    Template(#[from] askama::Error),
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::NotFound => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        // Le détail part dans les logs, jamais au visiteur.
        if !matches!(self, AppError::NotFound) {
            log::error!("{self:?}");
        }
        HttpResponse::build(self.status_code())
            .content_type("text/html; charset=utf-8")
            .body(match self {
                AppError::NotFound => "<h1>404 — page introuvable</h1>",
                _ => "<h1>500 — erreur serveur</h1>",
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_found_donne_404() {
        assert_eq!(AppError::NotFound.status_code(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn erreur_db_donne_500() {
        let e = AppError::Database(sqlx::Error::RowNotFound);
        assert_eq!(e.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn le_message_ne_fuite_pas_le_detail_interne() {
        let e = AppError::Database(sqlx::Error::RowNotFound);
        let body = format!("{}", e);
        assert!(!body.contains("RowNotFound"), "détail interne exposé");
    }
}
```

- [ ] **Step 6: Lancer les tests et commiter**

Run: `cargo test`
Expected: PASS

```bash
git add -A
git commit -m "feat: rendu Markdown et gestion d'erreurs HTTP"
```

---

### Task 6: Layout de base et page d'accueil

**Files:**
- Create: `myFolioRS/backend/templates/base.html`
- Create: `myFolioRS/backend/templates/index.html`
- Create: `myFolioRS/backend/templates/sections/{hero,apropos,skills,confiance,temoignages,parcours,apercu_projets}.html`
- Create: `myFolioRS/backend/src/routes/mod.rs`
- Create: `myFolioRS/backend/src/routes/pages.rs`
- Create: `myFolioRS/backend/static/retro.css` (copié de l'ancien dépôt)
- Modify: `myFolioRS/backend/src/main.rs`

**Interfaces:**
- Consumes: `content::list_projects`, `personal::*`, `marvin::pick_section_lines` (Task 3), `AppError` (Task 5)
- Produces: `GET /` → 200, HTML complet contenant les sections
- Produces: `struct IndexTemplate` dérivant `askama::Template`, chemin `index.html`

Référence de traduction : `myFolio/superior-star/src/layouts/BaseLayout.astro`
(head, OG, canonical), `src/pages/index.astro` (ordre des sections), et les 7
fichiers de `src/components/sections/`. Le balisage et les classes Tailwind
sont repris tels quels.

- [ ] **Step 1: Copier le CSS, les images, et construire le CSS Tailwind**

```bash
mkdir -p myFolioRS/backend/static
OLD=/Users/martincelavie/DEV/martininfo/myFolio/superior-star
cp $OLD/src/styles/retro.css myFolioRS/backend/static/
cp -r $OLD/public/* myFolioRS/backend/static/
```

**Le CSS Tailwind doit être construit dès maintenant.** `retro.css` ne contient
que des variables et des styles personnalisés — aucune classe utilitaire. Dans
Astro, `<style>@import "tailwindcss";</style>` les générait à la compilation.
Sans build, les templates de cette tâche s'afficheraient sans aucune mise en
page, et la vérification visuelle de l'étape 8 (comparaison avec l'ancien site)
n'aurait plus de sens.

Créer `myFolioRS/frontend/` avec le minimum nécessaire — `package.json`
(dépendances `tailwindcss` et `@tailwindcss/cli` en 4.x), et `src/app.css`
contenant `@import "tailwindcss";` suivi du contenu de `retro.css` — puis :

```bash
cd myFolioRS/frontend && bun install
bun x @tailwindcss/cli -i src/app.css -o ../backend/static/app.css   --content '../backend/templates/**/*.html'
```

Le template charge `/static/app.css` (et non plus `retro.css` séparément).
La Task 9 reprendra ce dossier `frontend/` pour y ajouter Vite et les îlots ;
`emptyOutDir: false` y est déjà prévu pour ne pas effacer ce CSS.

Vérifier que le CSS produit contient bien les utilitaires employés par les
templates :

```bash
grep -c "min-h-screen\|flex\|px-4" myFolioRS/backend/static/app.css
```

- [ ] **Step 2: Écrire base.html**

Traduire le `<head>` de `BaseLayout.astro` en Askama. Les variables Astro
(`canonicalUrl`, `ogImageUrl`) deviennent des champs de template :

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
    <title>{{ title }}</title>
    <meta name="description" content="{{ description }}" />
    <meta name="author" content="Martin Rabat" />
    <link rel="canonical" href="{{ canonical_url }}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Martin Rabat — Martin Info" />
    <meta property="og:title" content="{{ title }}" />
    <meta property="og:description" content="{{ description }}" />
    <meta property="og:url" content="{{ canonical_url }}" />
    <meta property="og:image" content="{{ og_image_url }}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="fr_FR" />

    <link rel="stylesheet" href="/static/app.css" />
  </head>
  <body>
    {% block content %}{% endblock %}
    <div id="chatbot-root"
         data-page-line="{{ page_line|escape }}"
         data-section-lines='{{ section_lines_json|safe }}'></div>
    <script type="module" src="/static/chatbot.js"></script>
  </body>
</html>
```

Reprendre également la nav et le footer de `BaseLayout.astro`.

- [ ] **Step 3: Écrire le test de la route d'accueil**

`myFolioRS/backend/src/routes/pages.rs` :

```rust
use crate::{db, error::AppError};
use actix_web::{get, web, HttpResponse};
use askama::Template;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    pub title: String,
    pub description: String,
    pub canonical_url: String,
    pub og_image_url: String,
    pub page_line: String,
    pub section_lines_json: String,
    pub career: Vec<db::models::CareerEntry>,
    pub skills: Vec<db::models::SkillGroup>,
    pub testimonials: Vec<db::models::Testimonial>,
    pub companies: Vec<db::models::Company>,
    pub projects: Vec<db::models::Project>,
}

#[get("/")]
pub async fn index(pool: web::Data<sqlx::SqlitePool>) -> Result<HttpResponse, AppError> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    async fn app_de_test() -> (sqlx::SqlitePool, impl actix_web::dev::Service<
        actix_http::Request,
        Response = actix_web::dev::ServiceResponse,
        Error = actix_web::Error,
    >) {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO career (periode, titre, entreprise, description, sort_order)
            VALUES ('2026', 'Développeur backend & DevOps', 'AMOPI', 'desc', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO skills (category, name, sort_order) VALUES ('Backend', 'Rust', 0)")
            .execute(&pool).await.unwrap();

        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool.clone()))
                .service(index),
        ).await;
        (pool, app)
    }

    #[actix_web::test]
    async fn accueil_repond_200() {
        let (_pool, app) = app_de_test().await;
        let req = test::TestRequest::get().uri("/").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);
    }

    #[actix_web::test]
    async fn accueil_contient_le_contenu_de_la_base() {
        let (_pool, app) = app_de_test().await;
        let req = test::TestRequest::get().uri("/").to_request();
        let body = test::call_and_read_body(&app, req).await;
        let html = String::from_utf8(body.to_vec()).unwrap();

        assert!(html.contains("AMOPI"), "le parcours doit être rendu côté serveur");
        assert!(html.contains("Rust"), "les compétences doivent être rendues");
        assert!(html.contains("<meta property=\"og:title\""), "balises OG présentes");
        assert!(html.contains("rel=\"canonical\""), "canonical présent");
    }
}
```

- [ ] **Step 4: Lancer les tests — ils doivent échouer**

Run: `cargo test routes::pages`
Expected: FAIL sur `todo!()`

- [ ] **Step 5: Implémenter le handler**

```rust
const SITE_URL: &str = "https://martininfo.fr";

#[get("/")]
pub async fn index(pool: web::Data<sqlx::SqlitePool>) -> Result<HttpResponse, AppError> {
    let section_lines = db::marvin::pick_section_lines(&pool).await?;

    let tpl = IndexTemplate {
        title: "Martin Rabat — Développeur concepteur d'applications".into(),
        description: "Développeur fullstack & DevOps indépendant : applications métier, \
                      intégration de systèmes et reprise de legacy. Django, React, Flutter, \
                      Docker. 20 ans d'infrastructure derrière moi. Perpignan, full remote.".into(),
        canonical_url: format!("{SITE_URL}/"),
        og_image_url: format!("{SITE_URL}/static/og-image.jpg"),
        page_line: String::new(),
        section_lines_json: serde_json::to_string(&section_lines)
            .map_err(|e| AppError::Internal(e.into()))?,
        career: db::personal::list_career(&pool).await?,
        skills: db::personal::list_skills(&pool).await?,
        testimonials: db::personal::list_testimonials(&pool).await?,
        companies: db::personal::list_companies(&pool).await?,
        projects: db::content::list_projects(&pool).await?,
    };

    Ok(HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(tpl.render()?))
}
```

- [ ] **Step 6: Écrire les 7 partials de section**

Traduire chaque `src/components/sections/*.astro` en `templates/sections/*.html`.
Exemple pour `parcours.html` :

```html
<section id="parcours" class="max-w-3xl mx-auto px-4 py-16">
  <h2 class="text-2xl mb-8">Parcours</h2>
  {% for e in career %}
    <article class="mb-6">
      <span class="text-[#00fff7]">{{ e.periode }}</span>
      <h3>{{ e.titre }}{% if let Some(ent) = e.entreprise %} — {{ ent }}{% endif %}</h3>
      <p>{{ e.description }}</p>
    </article>
  {% endfor %}
</section>
```

`index.html` étend `base.html` et inclut les sections dans l'ordre de
`index.astro` : Hero, APropos, Skills, IlsMeFontConfiance, Temoignages,
Parcours, ApercuProjets.

- [ ] **Step 7: Lancer les tests — ils doivent passer**

Run: `cargo test routes::pages`
Expected: PASS (2 tests)

- [ ] **Step 8: Vérifier visuellement**

Run: `BIND_ADDR=127.0.0.1:8090 cargo run` puis ouvrir `http://127.0.0.1:8090/`
Expected: la page d'accueil s'affiche avec le thème rétro, toutes les sections
peuplées depuis la base. Comparer côte à côte avec l'ancien site
(`cd myFolio/superior-star && bun run dev`, port 4321).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: layout de base et page d'accueil en SSR"
```

---

### Task 7: Pages projets, blog, contact et wargames

**Files:**
- Create: `myFolioRS/backend/templates/{projets,projet_detail,blog,post_detail,contact,wargames}.html`
- Modify: `myFolioRS/backend/src/routes/pages.rs`
- Modify: `myFolioRS/backend/src/routes/mod.rs`

**Interfaces:**
- Consumes: `content::*`, `marvin::pick_page_line`, `markdown::to_html`
- Produces: `marvin::pick_project_line(&SqlitePool) -> Result<Option<String>, sqlx::Error>`
  — tire une réplique `scope='project'` au hasard. À écrire dans `db/marvin.rs`
  sur le modèle de `pick_page_line`, avec son test.
- Produces: `GET /projets`, `/projets/{slug}`, `/blog`, `/blog/{slug}`, `/contact`, `/wargames`
- Produces: 404 via `AppError::NotFound` sur slug inconnu

- [ ] **Step 1: Écrire les tests des six routes**

```rust
#[actix_web::test]
async fn liste_projets_affiche_les_projets_publies() {
    let pool = crate::db::test_pool().await;
    sqlx::query("INSERT INTO projects (slug, title, date, description, body_md, published)
        VALUES ('amiqo', 'amiqo — Scan', '2026-07-30', 'desc', '# corps', 1),
               ('cache', 'Caché', '2026-08-01', 'desc', 'x', 0)")
        .execute(&pool).await.unwrap();

    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(projets)).await;

    let req = test::TestRequest::get().uri("/projets").to_request();
    let html = String::from_utf8(test::call_and_read_body(&app, req).await.to_vec()).unwrap();

    assert!(html.contains("amiqo — Scan"));
    assert!(!html.contains("Caché"), "un projet non publié ne doit pas apparaître");
}

#[actix_web::test]
async fn detail_projet_rend_le_markdown_en_html() {
    let pool = crate::db::test_pool().await;
    sqlx::query("INSERT INTO projects (slug, title, date, description, body_md, published)
        VALUES ('amiqo', 'amiqo', '2026-07-30', 'desc', '## Sous-titre\n\nUn texte.', 1)")
        .execute(&pool).await.unwrap();

    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(projet_detail)).await;

    let req = test::TestRequest::get().uri("/projets/amiqo").to_request();
    let html = String::from_utf8(test::call_and_read_body(&app, req).await.to_vec()).unwrap();

    assert!(html.contains("<h2>Sous-titre</h2>"), "le Markdown doit être rendu");
    assert!(!html.contains("## Sous-titre"), "le Markdown brut ne doit pas fuiter");
}

#[actix_web::test]
async fn detail_projet_inconnu_donne_404() {
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(projet_detail)).await;

    let req = test::TestRequest::get().uri("/projets/inexistant").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 404);
}

#[actix_web::test]
async fn wargames_monte_l_ilot_de_jeu() {
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(wargames)).await;

    let req = test::TestRequest::get().uri("/wargames").to_request();
    let html = String::from_utf8(test::call_and_read_body(&app, req).await.to_vec()).unwrap();

    assert!(html.contains(r#"id="wargames-root""#));
    assert!(html.contains("/static/wargames.js"));
    assert!(!html.contains("/static/chatbot.js") || html.matches("chatbot.js").count() == 1,
        "le bundle chatbot ne doit pas être dupliqué");
}
```

Écrire les tests équivalents pour `/blog`, `/blog/{slug}` et `/contact`.

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

Run: `cargo test routes::pages`
Expected: FAIL — les handlers n'existent pas encore

**Images de projets — décision de l'utilisateur.**

Les images sont cassées sur le site source : les 12 `.jpg` référencés n'existent
pas, et `amiqo.md` pointe vers `/public/projects/amiqo.png` alors qu'Astro sert
`public/` à la racine (chemin correct : `/projects/amiqo.png`). S'y ajoute un
décalage propre à la nouvelle stack : le serveur sert ses assets sous `/static/`.

L'utilisateur a choisi une **image de remplacement** plutôt que de masquer le
bloc : la grille garde des cartes de hauteur uniforme.

Implémentation retenue, au plus près de l'existant : le conteneur
`aspect-video` de `ApercuProjets.astro` enveloppe déjà l'`<img>` dans un
`<span class="text-4xl">`, prévu pour un caractère de remplacement. On garde ce
conteneur et on y affiche **les initiales du projet** (deux lettres, tirées du
titre) quand l'image est absente ou introuvable :

```html
<div class="aspect-video mb-4 flex items-center justify-center"
     style="background: var(--accent-soft); border: 1px solid var(--border);">
  {% match image_url %}
    {% when Some with (url) %}
      <img src="{{ url }}" alt="{{ p.title }}" class="w-full h-full object-cover" />
    {% when None %}
      <span class="text-4xl font-mono" style="color: var(--ink-faint);">{{ initiales }}</span>
  {% endmatch %}
</div>
```

Le handler résout le chemin : il normalise `/public/projects/x.png` et
`/projects/x.png` vers `/static/projects/x.png`, puis vérifie que le fichier
existe sur disque. S'il n'existe pas, `None` — le fallback s'affiche. Cela
corrige au passage le chemin d'`amiqo`, dont l'image existe réellement.

Un test doit couvrir les trois cas : image présente, image déclarée mais
fichier absent, aucune image déclarée.

- [ ] **Step 3: Implémenter les six handlers**

Chaque handler suit le même schéma que `index`. Pour les pages de détail :

```rust
#[derive(Template)]
#[template(path = "projet_detail.html")]
pub struct ProjetDetailTemplate {
    pub title: String,
    pub description: String,
    pub canonical_url: String,
    pub og_image_url: String,
    pub page_line: String,
    pub section_lines_json: String,
    pub projet: db::models::Project,
    pub body_html: String,
}

#[get("/projets/{slug}")]
pub async fn projet_detail(
    pool: web::Data<sqlx::SqlitePool>,
    slug: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let projet = db::content::get_project(&pool, &slug)
        .await?
        .ok_or(AppError::NotFound)?;

    let body_html = crate::markdown::to_html(&projet.body_md);

    // Réplique de page projet : `scope='project'`, avec `{titre}` substitué —
    // c'est ce que faisait `projets/[slug].astro:17` dans l'ancien site.
    // Ne pas utiliser pick_page_line("/projets") ici : ce sont les répliques
    // de la LISTE des projets, pas celles d'une fiche.
    let page_line = db::marvin::pick_project_line(&pool)
        .await?
        .map(|l| l.replace("{titre}", &projet.title))
        .unwrap_or_default();

    let tpl = ProjetDetailTemplate {
        title: format!("{} — Martin Rabat", projet.title),
        description: projet.description.clone(),
        canonical_url: format!("{SITE_URL}/projets/{}", projet.slug),
        og_image_url: format!("{SITE_URL}/static/og-image.jpg"),
        page_line,
        section_lines_json: "{}".into(),
        projet,
        body_html,
    };
    Ok(HttpResponse::Ok().content_type("text/html; charset=utf-8").body(tpl.render()?))
}
```

Dans `projet_detail.html`, le corps rendu est inséré avec `{{ body_html|safe }}`
— c'est le seul endroit où `|safe` est légitime, puisque `to_html` échappe
déjà le HTML brut (Task 5).

`wargames.html` monte l'îlot de jeu :

```html
<div id="wargames-root"></div>
<script type="module" src="/static/wargames.js"></script>
```

- [ ] **Step 4: Enregistrer les routes**

`myFolioRS/backend/src/routes/mod.rs` :

```rust
pub mod pages;

use actix_web::web;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(pages::index)
       .service(pages::projets)
       .service(pages::projet_detail)
       .service(pages::blog)
       .service(pages::post_detail)
       .service(pages::contact)
       .service(pages::wargames)
       .service(actix_files::Files::new("/static", "./static"));
}
```

Dans `main.rs` : `App::new().app_data(...).configure(routes::configure)`.

- [ ] **Step 5: Lancer les tests — ils doivent passer**

Run: `cargo test`
Expected: PASS

- [ ] **Step 6: Vérifier les 14 fiches de contenu à l'œil**

C'est le point de vigilance « rendu Markdown » de la spec.

Run: `cargo run`, puis parcourir chaque projet :
```bash
sqlite3 myfolio.db "SELECT '/projets/' || slug FROM projects UNION ALL SELECT '/blog/' || slug FROM posts;"
```
Comparer chaque page avec l'équivalent sur l'ancien site (port 4321).
Vérifier : titres, listes, blocs de code, liens, apostrophes typographiques.
Noter les écarts et les corriger dans `markdown.rs` ou dans le contenu.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: pages projets, blog, contact et wargames en SSR"
```

---

### Task 8: sitemap.xml et flux RSS

**Files:**
- Create: `myFolioRS/backend/src/routes/feeds.rs`
- Modify: `myFolioRS/backend/src/routes/mod.rs`

**Interfaces:**
- Consumes: `content::list_projects`, `content::list_posts`
- Produces: `GET /sitemap.xml` (content-type `application/xml`), `GET /rss.xml` (content-type `application/rss+xml`)

- [ ] **Step 1: Écrire les tests**

```rust
#[actix_web::test]
async fn sitemap_liste_les_pages_statiques_et_le_contenu() {
    let pool = crate::db::test_pool().await;
    sqlx::query("INSERT INTO projects (slug, title, date, description, body_md, published)
        VALUES ('amiqo', 'amiqo', '2026-07-30', 'd', 'x', 1)")
        .execute(&pool).await.unwrap();

    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone())).service(sitemap)).await;
    let req = test::TestRequest::get().uri("/sitemap.xml").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.headers().get("content-type").unwrap(), "application/xml");

    let xml = String::from_utf8(test::read_body(resp).await.to_vec()).unwrap();
    assert!(xml.contains("<loc>https://martininfo.fr/</loc>"));
    assert!(xml.contains("<loc>https://martininfo.fr/projets/amiqo</loc>"));
    assert!(xml.starts_with("<?xml"));
}

#[actix_web::test]
async fn sitemap_exclut_le_contenu_non_publie() {
    let pool = crate::db::test_pool().await;
    sqlx::query("INSERT INTO projects (slug, title, date, description, body_md, published)
        VALUES ('brouillon', 'B', '2026-07-30', 'd', 'x', 0)")
        .execute(&pool).await.unwrap();

    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone())).service(sitemap)).await;
    let req = test::TestRequest::get().uri("/sitemap.xml").to_request();
    let xml = String::from_utf8(test::call_and_read_body(&app, req).await.to_vec()).unwrap();
    assert!(!xml.contains("brouillon"));
}

#[actix_web::test]
async fn rss_echappe_les_caracteres_xml() {
    let pool = crate::db::test_pool().await;
    sqlx::query("INSERT INTO posts (slug, title, date, description, body_md, published)
        VALUES ('a', 'Titre & <balise>', '2026-07-29', 'desc', 'x', 1)")
        .execute(&pool).await.unwrap();

    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone())).service(rss)).await;
    let req = test::TestRequest::get().uri("/rss.xml").to_request();
    let xml = String::from_utf8(test::call_and_read_body(&app, req).await.to_vec()).unwrap();

    assert!(xml.contains("Titre &amp; &lt;balise&gt;"), "XML mal échappé");
    assert!(!xml.contains("<balise>"));
}
```

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

Run: `cargo test routes::feeds`
Expected: FAIL

- [ ] **Step 3: Implémenter**

```rust
fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
     .replace('<', "&lt;")
     .replace('>', "&gt;")
     .replace('"', "&quot;")
}

#[get("/sitemap.xml")]
pub async fn sitemap(pool: web::Data<sqlx::SqlitePool>) -> Result<HttpResponse, AppError> {
    let projets = db::content::list_projects(&pool).await?;
    let articles = db::content::list_posts(&pool).await?;

    let mut xml = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\
         <urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n",
    );
    for path in ["/", "/projets", "/blog", "/contact"] {
        xml.push_str(&format!("  <url><loc>{SITE_URL}{path}</loc></url>\n"));
    }
    for p in &projets {
        xml.push_str(&format!(
            "  <url><loc>{SITE_URL}/projets/{}</loc><lastmod>{}</lastmod></url>\n",
            escape_xml(&p.slug), escape_xml(&p.date)
        ));
    }
    for a in &articles {
        xml.push_str(&format!(
            "  <url><loc>{SITE_URL}/blog/{}</loc><lastmod>{}</lastmod></url>\n",
            escape_xml(&a.slug), escape_xml(&a.date)
        ));
    }
    xml.push_str("</urlset>\n");

    Ok(HttpResponse::Ok().content_type("application/xml").body(xml))
}
```

`rss` suit la même forme, avec `<rss version="2.0"><channel>` et un `<item>`
par article (`title`, `link`, `description`, `pubDate`, `guid`), tous passés
par `escape_xml`. Note : `/wargames` est volontairement absent du sitemap —
c'est un easter egg.

- [ ] **Step 4: Lancer les tests et vérifier la validité XML**

Run: `cargo test routes::feeds` puis
```bash
BIND_ADDR=127.0.0.1:8090 cargo run &
curl -s http://127.0.0.1:8090/sitemap.xml | xmllint --noout - && echo "sitemap valide"
curl -s http://127.0.0.1:8090/rss.xml | xmllint --noout - && echo "rss valide"
```
Expected: PASS (3 tests), et les deux flux validés par `xmllint`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: sitemap.xml et flux RSS générés depuis la base"
```

**Fin de phase 2** : le site est consultable en entier, sans les îlots.

---

## Phase 3 — Îlots React

### Task 9: Chaîne de build Vite et îlot WarGames

**Files:**
- Create: `myFolioRS/frontend/package.json`, `vite.config.ts`, `tsconfig.json`
- Create: `myFolioRS/frontend/src/islands/wargames/main.tsx`
- Copy: `WargamesGame.tsx`, `MarvinShell.tsx`, `minimax.ts` depuis l'ancien dépôt
- Create: `myFolioRS/frontend/src/islands/wargames/minimax.test.ts`

**Interfaces:**
- Produces: `bun run build` dans `frontend/` → `backend/static/{chatbot,wargames}.js`
- Consumes: `<div id="wargames-root">` du template `wargames.html` (Task 7)

WarGames avant ChatBot : il est purement client, sans dépendance à une API.
C'est la validation la plus simple de la chaîne de build.

- [ ] **Step 1: Créer le projet frontend**

```bash
mkdir -p myFolioRS/frontend/src/islands/{wargames,chatbot}
cd myFolioRS/frontend
```

`package.json` :

```json
{
  "name": "myfolio-islands",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

`vite.config.ts` :

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Sortie directe dans le dossier servi par Actix.
    outDir: resolve(__dirname, '../backend/static'),
    emptyOutDir: false, // retro.css et les images y vivent aussi
    rollupOptions: {
      input: {
        chatbot: resolve(__dirname, 'src/islands/chatbot/main.tsx'),
        wargames: resolve(__dirname, 'src/islands/wargames/main.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: { environment: 'jsdom', globals: true },
});
```

- [ ] **Step 2: Copier les composants WarGames**

```bash
OLD=/Users/martincelavie/DEV/martininfo/myFolio/superior-star
cp $OLD/src/components/wargames/{WargamesGame.tsx,MarvinShell.tsx,minimax.ts} \
   myFolioRS/frontend/src/islands/wargames/
```

- [ ] **Step 3: Écrire le test de minimax**

`minimax.test.ts` — l'invariant central : l'IA est imbattable.

```ts
import { describe, it, expect } from 'vitest';
import { getBestMove, checkWinner, isBoardFull } from './minimax';

const VIDE = Array(9).fill('');

/** Joue une partie complète, l'humain choisissant la première case libre. */
function partieComplete(humanFirst: boolean): string | null {
  const board = [...VIDE];
  let tourHumain = humanFirst;
  while (!checkWinner(board) && !isBoardFull(board)) {
    if (tourHumain) {
      board[board.findIndex((c) => c === '')] = 'X';
    } else {
      board[getBestMove(board, 'O', 'X')] = 'O';
    }
    tourHumain = !tourHumain;
  }
  return checkWinner(board);
}

describe('minimax', () => {
  it("l'IA ne perd jamais, quel que soit qui commence", () => {
    expect(partieComplete(true)).not.toBe('X');
    expect(partieComplete(false)).not.toBe('X');
  });

  it('bloque une victoire humaine imminente', () => {
    // X menace sur la ligne du haut : O doit jouer en 2.
    const board = ['X', 'X', '', '', 'O', '', '', '', ''];
    expect(getBestMove(board, 'O', 'X')).toBe(2);
  });

  it('saisit sa propre victoire immédiate', () => {
    const board = ['O', 'O', '', 'X', 'X', '', '', '', ''];
    expect(getBestMove(board, 'O', 'X')).toBe(2);
  });

  it('checkWinner reconnaît les trois orientations', () => {
    expect(checkWinner(['X','X','X','','','','','',''])).toBe('X');
    expect(checkWinner(['O','','','O','','','O','',''])).toBe('O');
    expect(checkWinner(['X','','','','X','','','','X'])).toBe('X');
    expect(checkWinner(VIDE)).toBeNull();
  });
});
```

- [ ] **Step 4: Lancer les tests**

Run: `cd myFolioRS/frontend && bun install && bun run test`
Expected: PASS (4 tests). Si `getBestMove` a une signature différente,
l'adapter au code copié — ne pas modifier `minimax.ts`.

- [ ] **Step 5: Écrire le point de montage**

`src/islands/wargames/main.tsx` :

```tsx
import { createRoot } from 'react-dom/client';
import WargamesGame from './WargamesGame';

const el = document.getElementById('wargames-root');
if (el) createRoot(el).render(<WargamesGame />);
```

- [ ] **Step 6: Construire et vérifier les bundles**

Run: `bun run build && ls -la ../backend/static/`
Expected: `wargames.js` et `chatbot.js` présents (chatbot vide pour l'instant),
`retro.css` et les images toujours là (grâce à `emptyOutDir: false`)

- [ ] **Step 7: Vérifier le jeu dans le navigateur**

Run: `cd ../backend && BIND_ADDR=127.0.0.1:8090 cargo run`, ouvrir `http://127.0.0.1:8090/wargames`
Expected: le terminal WOPR s'affiche, une partie se joue, l'IA ne perd pas.
Vérifier dans l'onglet Réseau que `chatbot.js` n'est pas chargé par cette page.

- [ ] **Step 8: Commit**

```bash
cd myFolioRS && git add -A
git commit -m "feat: chaîne de build Vite et îlot WarGames"
```

---

### Task 10: API contact et îlot du formulaire

**Files:**
- Create: `myFolioRS/backend/src/routes/api_contact.rs`
- Create: `myFolioRS/backend/src/db/contact.rs`
- Modify: `myFolioRS/backend/src/routes/mod.rs`, `templates/contact.html`

**Interfaces:**
- Produces: `POST /api/contact` acceptant `{ name, email, message }` → `200 {"ok":true}` ou `400 {"error":"…"}`
- Produces: `contact::insert_message(&SqlitePool, name, email, message, ip_hash) -> Result<i64>`
- Produces: `validate(name, email, message) -> Result<(), &'static str>`

Corrige le défaut de concurrence de l'ancien `api/contact.ts` (lecture-modification-écriture
d'un fichier JSON). Ajoute la validation serveur et le rate-limit, absents aujourd'hui.

- [ ] **Step 1: Écrire les tests de validation**

```rust
#[derive(serde::Deserialize)]
pub struct ContactForm {
    pub name: String,
    pub email: String,
    pub message: String,
}

fn validate(f: &ContactForm) -> Result<(), &'static str> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn form(name: &str, email: &str, message: &str) -> ContactForm {
        ContactForm { name: name.into(), email: email.into(), message: message.into() }
    }

    #[test]
    fn accepte_un_formulaire_valide() {
        assert!(validate(&form("Martin", "martin@example.com", "Bonjour")).is_ok());
    }

    #[test]
    fn refuse_un_champ_vide() {
        assert!(validate(&form("", "a@b.fr", "msg")).is_err());
        assert!(validate(&form("Martin", "a@b.fr", "   ")).is_err(), "espaces seuls = vide");
    }

    #[test]
    fn refuse_un_email_malforme() {
        // L'ancien endpoint acceptait "moi@am" : contact.json en garde la trace.
        for mauvais in ["moi@am", "sans-arobase.fr", "@example.com", "a@b"] {
            assert!(validate(&form("M", mauvais, "msg")).is_err(), "accepté à tort : {mauvais}");
        }
    }

    #[test]
    fn refuse_les_champs_trop_longs() {
        assert!(validate(&form(&"x".repeat(101), "a@b.fr", "msg")).is_err());
        assert!(validate(&form("M", "a@b.fr", &"x".repeat(5001))).is_err());
    }
}
```

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

Run: `cargo test api_contact`
Expected: FAIL sur `todo!()`

- [ ] **Step 3: Implémenter la validation**

```rust
fn validate(f: &ContactForm) -> Result<(), &'static str> {
    let name = f.name.trim();
    let email = f.email.trim();
    let message = f.message.trim();

    if name.is_empty() || email.is_empty() || message.is_empty() {
        return Err("Tous les champs sont requis.");
    }
    if name.chars().count() > 100 { return Err("Le nom est trop long."); }
    if email.chars().count() > 200 { return Err("L'adresse est trop longue."); }
    if message.chars().count() > 5000 { return Err("Le message est trop long."); }

    // Validation volontairement simple : une arobase, un point après elle,
    // et au moins deux caractères de TLD. Suffisant pour écarter les fautes
    // de frappe sans rejeter d'adresse légitime.
    let Some((local, domain)) = email.split_once('@') else {
        return Err("Adresse email invalide.");
    };
    if local.is_empty() || !domain.contains('.') { return Err("Adresse email invalide."); }
    let tld = domain.rsplit('.').next().unwrap_or("");
    if tld.chars().count() < 2 { return Err("Adresse email invalide."); }

    Ok(())
}
```

- [ ] **Step 4: Lancer les tests — ils doivent passer**

Run: `cargo test api_contact`
Expected: PASS (4 tests)

- [ ] **Step 5: Écrire les tests du endpoint**

```rust
#[actix_web::test]
async fn post_contact_enregistre_le_message() {
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(post_contact)).await;

    let req = test::TestRequest::post().uri("/api/contact")
        .set_json(serde_json::json!({
            "name": "Martin", "email": "martin@example.com", "message": "Bonjour"
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 200);

    let n: i64 = sqlx::query_scalar("SELECT count(*) FROM contact_messages")
        .fetch_one(&pool).await.unwrap();
    assert_eq!(n, 1);
}

#[actix_web::test]
async fn post_contact_refuse_un_email_invalide_sans_rien_ecrire() {
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .service(post_contact)).await;

    let req = test::TestRequest::post().uri("/api/contact")
        .set_json(serde_json::json!({ "name": "M", "email": "invalide", "message": "x" }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);

    let n: i64 = sqlx::query_scalar("SELECT count(*) FROM contact_messages")
        .fetch_one(&pool).await.unwrap();
    assert_eq!(n, 0, "aucune ligne ne doit être écrite si la validation échoue");
}

#[actix_web::test]
async fn deux_envois_simultanes_sont_tous_deux_conserves() {
    // Le défaut corrigé : l'ancien endpoint réécrivait un fichier JSON entier.
    let pool = crate::db::test_pool().await;
    let a = crate::db::contact::insert_message(&pool, "A", "a@ex.fr", "1", None);
    let b = crate::db::contact::insert_message(&pool, "B", "b@ex.fr", "2", None);
    let (ra, rb) = tokio::join!(a, b);
    assert!(ra.is_ok() && rb.is_ok());

    let n: i64 = sqlx::query_scalar("SELECT count(*) FROM contact_messages")
        .fetch_one(&pool).await.unwrap();
    assert_eq!(n, 2);
}
```

- [ ] **Step 6: Implémenter le endpoint et l'insertion**

`db/contact.rs` :

```rust
pub async fn insert_message(
    pool: &sqlx::SqlitePool,
    name: &str, email: &str, message: &str, ip_hash: Option<&str>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        "INSERT INTO contact_messages (name, email, message, ip_hash)
         VALUES (?, ?, ?, ?) RETURNING id",
    )
    .bind(name).bind(email).bind(message).bind(ip_hash)
    .fetch_one(pool).await
}
```

`routes/api_contact.rs` :

```rust
#[post("/api/contact")]
pub async fn post_contact(
    pool: web::Data<sqlx::SqlitePool>,
    req: actix_web::HttpRequest,
    form: web::Json<ContactForm>,
) -> HttpResponse {
    if let Err(msg) = validate(&form) {
        return HttpResponse::BadRequest().json(serde_json::json!({ "error": msg }));
    }

    // IP hachée : permet de repérer un envoi massif sans stocker l'adresse.
    let ip_hash = req.peer_addr().map(|a| {
        use sha2::{Digest, Sha256};
        let d = Sha256::digest(a.ip().to_string().as_bytes());
        format!("{:x}", d)[..16].to_string()
    });

    match crate::db::contact::insert_message(
        &pool, form.name.trim(), form.email.trim(), form.message.trim(), ip_hash.as_deref(),
    ).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("[api/contact] {e}");
            HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": "Envoi impossible. Réessayez plus tard." }))
        }
    }
}
```

- [ ] **Step 7: Lancer les tests**

Run: `cargo test`
Expected: PASS (7 tests pour ce module)

- [ ] **Step 8: Câbler le formulaire dans contact.html**

Traduire le formulaire de `contact.astro` en HTML, avec un `<script>` inline
(pas d'îlot React : c'est un simple `fetch`) qui POST vers `/api/contact` et
affiche le retour. Reprendre le balisage et les classes de l'original.

- [ ] **Step 9: Vérifier de bout en bout**

Run: `BIND_ADDR=127.0.0.1:8090 cargo run`, ouvrir `/contact`, envoyer un message, puis :
```bash
sqlite3 myfolio.db "SELECT name, email, created_at FROM contact_messages ORDER BY id DESC LIMIT 1;"
```
Expected: le message apparaît. Tester aussi un email invalide → message
d'erreur affiché, rien en base.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: API contact en base, avec validation serveur"
```

---

### Task 11: API chat et îlot ChatBot — parité fonctionnelle

**Files:**
- Create: `myFolioRS/backend/src/prompt.rs`
- Create: `myFolioRS/backend/src/routes/api_chat.rs`
- Copy: `ChatBot.tsx` depuis l'ancien dépôt
- Create: `myFolioRS/frontend/src/islands/chatbot/main.tsx`
- Create: `myFolioRS/frontend/src/islands/chatbot/ChatBot.test.tsx`
- Modify: `myFolioRS/backend/src/main.rs` (AppState avec le cache)

**Interfaces:**
- Consumes: `personal::*`, `content::list_projects` (Task 3)
- Produces: `prompt::build_system_prompt(&SqlitePool) -> Result<String, sqlx::Error>`
- Produces: `PromptCache { inner: RwLock<Option<String>> }` avec `get_or_build(&SqlitePool)` et `invalidate()`
- Produces: `GroqClient` — enveloppe `reqwest::Client` + clé optionnelle, avec
  `GroqClient::new(key: Option<String>)`, `GroqClient::sans_cle()` (constructeur
  de test) et `complete(&self, system: &str, messages: &[ChatMessage]) -> Result<String, GroqError>`
- Produces: `POST /api/chat` acceptant `{ messages: [{role, content}] }` → `{ content: String }`

C'est le jalon de parité. Deux points de vigilance de la spec convergent ici :
le marqueur `[LANCER_JEU]` et l'invalidation du cache.

- [ ] **Step 1: Écrire les tests du prompt**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    async fn pool_peuple() -> sqlx::SqlitePool {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO career (periode, titre, entreprise, description, sort_order)
            VALUES ('2026', 'Développeur backend & DevOps', 'AMOPI', 'd', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO skills (category, name, sort_order) VALUES ('Backend', 'Rust', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO testimonials (name, title, company, quote, sort_order)
            VALUES ('Hugo', 'CTO', 'Acme', 'Excellent travail. Vraiment.', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO companies (name, url, description, sort_order)
            VALUES ('Amopi', 'https://amopi.fr', 'desc', 0)")
            .execute(&pool).await.unwrap();
        sqlx::query("INSERT INTO projects (slug, title, date, description, body_md, published)
            VALUES ('amiqo', 'amiqo', '2026-07-30', 'd', 'x', 1)")
            .execute(&pool).await.unwrap();
        pool
    }

    #[tokio::test]
    async fn le_prompt_injecte_les_donnees_de_la_base() {
        let pool = pool_peuple().await;
        let p = build_system_prompt(&pool).await.unwrap();
        assert!(p.contains("AMOPI"));
        assert!(p.contains("Rust"));
        assert!(p.contains("Hugo"));
        assert!(p.contains("amopi.fr"));
        assert!(p.contains("amiqo"));
    }

    #[tokio::test]
    async fn le_prompt_conserve_le_marqueur_de_jeu() {
        // Contrat avec ChatBot.tsx : la chaîne exacte déclenche le jeu.
        let pool = pool_peuple().await;
        let p = build_system_prompt(&pool).await.unwrap();
        assert!(p.contains("[LANCER_JEU]"), "marqueur de lancement absent du prompt");
    }

    #[tokio::test]
    async fn le_prompt_ne_nomme_jamais_le_jeu() {
        let pool = pool_peuple().await;
        let p = build_system_prompt(&pool).await.unwrap();
        let bas = p.to_lowercase();
        // La consigne « ne révèle jamais sa nature » doit rester dans le prompt.
        assert!(bas.contains("ne révèle jamais"), "consigne de discrétion absente");
    }

    #[tokio::test]
    async fn les_citations_sont_tronquees_a_la_premiere_phrase() {
        let pool = crate::db::test_pool().await;
        sqlx::query("INSERT INTO testimonials (name, title, company, quote, sort_order)
            VALUES ('X', 't', 'c', 'Première phrase. Deuxième phrase qui doit disparaître.', 0)")
            .execute(&pool).await.unwrap();
        let p = build_system_prompt(&pool).await.unwrap();
        assert!(p.contains("Première phrase."));
        assert!(!p.contains("Deuxième phrase"), "la citation doit être tronquée");
    }

    #[tokio::test]
    async fn le_cache_evite_de_reconstruire_et_l_invalidation_le_vide() {
        let pool = pool_peuple().await;
        let cache = PromptCache::default();

        let p1 = cache.get_or_build(&pool).await.unwrap();
        sqlx::query("INSERT INTO skills (category, name, sort_order) VALUES ('Backend', 'Actix', 1)")
            .execute(&pool).await.unwrap();

        let p2 = cache.get_or_build(&pool).await.unwrap();
        assert_eq!(p1, p2, "sans invalidation, le cache doit servir la version d'origine");

        cache.invalidate().await;
        let p3 = cache.get_or_build(&pool).await.unwrap();
        assert!(p3.contains("Actix"), "après invalidation, le prompt doit être reconstruit");
    }
}
```

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

Run: `cargo test prompt`
Expected: FAIL

- [ ] **Step 3: Implémenter prompt.rs**

Porter `buildSystemPrompt` de `api/chat.ts` **mot pour mot** pour le texte
français, en remplaçant les sources TS par des requêtes SQL. Reprendre
`firstSentence` :

```rust
/// Tronque une citation à sa première phrase, pour alléger le prompt.
fn first_sentence(text: &str, max: usize) -> String {
    let clean = text.split_whitespace().collect::<Vec<_>>().join(" ");
    let cut = match clean.find(". ") {
        Some(end) if end < max => &clean[..end + 1],
        _ => {
            let bound = clean.char_indices().nth(max).map_or(clean.len(), |(i, _)| i);
            &clean[..bound]
        }
    };
    let cut = cut.trim();
    if cut.len() < clean.len() { format!("{cut}…") } else { cut.to_string() }
}

#[derive(Default)]
pub struct PromptCache {
    inner: tokio::sync::RwLock<Option<String>>,
}

impl PromptCache {
    pub async fn get_or_build(&self, pool: &sqlx::SqlitePool) -> Result<String, sqlx::Error> {
        if let Some(p) = self.inner.read().await.as_ref() {
            return Ok(p.clone());
        }
        let p = build_system_prompt(pool).await?;
        *self.inner.write().await = Some(p.clone());
        Ok(p)
    }

    /// Appelé après toute écriture admin sur career/skills/testimonials/companies.
    pub async fn invalidate(&self) {
        *self.inner.write().await = None;
    }
}
```

Copier le texte du prompt depuis `myFolio/superior-star/src/pages/api/chat.ts`
(lignes 47-115) sans le reformuler — c'est du contenu éditorial validé.

- [ ] **Step 4: Lancer les tests — ils doivent passer**

Run: `cargo test prompt`
Expected: PASS (5 tests)

- [ ] **Step 5: Écrire GroqClient**

Le client est isolé pour que le endpoint soit testable sans appel réseau :
`sans_cle()` produit un client qui échoue immédiatement, ce qui exerce le
chemin d'erreur.

```rust
#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, thiserror::Error)]
pub enum GroqError {
    #[error("clé API absente")]
    MissingKey,
    #[error("quota atteint")]
    RateLimited,
    #[error("appel Groq échoué : {0}")]
    Request(String),
}

pub struct GroqClient {
    http: reqwest::Client,
    api_key: Option<String>,
}

impl GroqClient {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(5)) // identique à l'ancien AbortController
                .build()
                .expect("client HTTP"),
            api_key,
        }
    }

    /// Client sans clé : tout appel échoue par MissingKey. Réservé aux tests.
    pub fn sans_cle() -> Self {
        Self::new(None)
    }

    pub async fn complete(
        &self,
        system: &str,
        messages: &[ChatMessage],
    ) -> Result<String, GroqError> {
        let key = self.api_key.as_ref().ok_or(GroqError::MissingKey)?;

        let mut all = vec![ChatMessage { role: "system".into(), content: system.into() }];
        all.extend_from_slice(messages);

        let resp = self.http
            .post("https://api.groq.com/openai/v1/chat/completions")
            .bearer_auth(key)
            .json(&serde_json::json!({
                "model": "llama-3.3-70b-versatile",
                "messages": all,
                "max_tokens": 250,
            }))
            .send()
            .await
            .map_err(|e| GroqError::Request(e.to_string()))?;

        if resp.status().as_u16() == 429 {
            return Err(GroqError::RateLimited);
        }

        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| GroqError::Request(e.to_string()))?;

        Ok(body["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or_default()
            .to_string())
    }
}
```

- [ ] **Step 6: Écrire les tests du endpoint chat**

```rust
#[actix_web::test]
async fn post_chat_refuse_un_corps_sans_messages() {
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .app_data(web::Data::new(PromptCache::default()))
        .app_data(web::Data::new(GroqClient::sans_cle()))
        .service(post_chat)).await;

    let req = test::TestRequest::post().uri("/api/chat")
        .set_json(serde_json::json!({ "autre": 1 })).to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
}

#[actix_web::test]
async fn post_chat_renvoie_un_message_lisible_quand_groq_est_indisponible() {
    // Sans clé API, le visiteur doit recevoir un texte en français, pas une 500 brute.
    let pool = crate::db::test_pool().await;
    let app = test::init_service(App::new()
        .app_data(web::Data::new(pool.clone()))
        .app_data(web::Data::new(PromptCache::default()))
        .app_data(web::Data::new(GroqClient::sans_cle()))
        .service(post_chat)).await;

    let req = test::TestRequest::post().uri("/api/chat")
        .set_json(serde_json::json!({ "messages": [{"role":"user","content":"salut"}] }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 200, "l'erreur est portée par le corps, pas par le statut");

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["content"].as_str().unwrap().len() > 10);
}
```

- [ ] **Step 7: Implémenter api_chat.rs**

Porter la logique de `api/chat.ts` : timeout 5 s, `max_tokens: 250`, modèle
`llama-3.3-70b-versatile`, message dédié sur 429, log serveur des erreurs.

```rust
const RATE_LIMIT_MESSAGE: &str =
    "Mes circuits saturent. Évidemment. Laisse-moi quelques minutes pour souffrir en silence, puis réessaie.";
const ERREUR_MESSAGE: &str =
    "ERREUR: connexion au serveur perdue. Réessaie plus tard.";
```

- [ ] **Step 8: Câbler l'AppState dans main.rs**

```rust
let prompt_cache = web::Data::new(prompt::PromptCache::default());
let groq = web::Data::new(routes::api_chat::GroqClient::new(cfg.groq_api_key.clone()));

HttpServer::new(move || {
    App::new()
        .app_data(web::Data::new(pool.clone()))
        .app_data(prompt_cache.clone())
        .app_data(groq.clone())
        .configure(routes::configure)
})
```

- [ ] **Step 9: Copier ChatBot.tsx et écrire son test**

```bash
cp $OLD/src/components/chatbot/ChatBot.tsx myFolioRS/frontend/src/islands/chatbot/
```

`ChatBot.test.tsx` — le contrat du marqueur, côté client cette fois :

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from './ChatBot';

describe('ChatBot', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('affiche la réponse du serveur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Une réponse blasée.' }),
    }));

    render(<ChatBot />);
    await userEvent.type(screen.getByRole('textbox'), 'bonjour{Enter}');
    await waitFor(() => expect(screen.getByText(/Une réponse blasée/)).toBeInTheDocument());
  });

  it("retire le marqueur [LANCER_JEU] du texte affiché", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Très bien. Suis-moi.\n[LANCER_JEU]' }),
    }));

    render(<ChatBot />);
    await userEvent.type(screen.getByRole('textbox'), 'je veux jouer{Enter}');
    await waitFor(() => expect(screen.getByText(/Suis-moi/)).toBeInTheDocument());
    expect(screen.queryByText(/LANCER_JEU/)).toBeNull();
  });

  it('affiche un message quand le réseau échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    render(<ChatBot />);
    await userEvent.type(screen.getByRole('textbox'), 'test{Enter}');
    await waitFor(() => expect(screen.getByText(/ERREUR|erreur/i)).toBeInTheDocument());
  });
});
```

Ajouter `@testing-library/user-event` aux devDependencies.

- [ ] **Step 10: Écrire main.tsx du chatbot**

```tsx
import { createRoot } from 'react-dom/client';
import ChatBot from './ChatBot';

const el = document.getElementById('chatbot-root');
if (el) {
  // Les répliques pré-écrites sont rendues côté serveur dans les data-attributes.
  const pageLine = el.dataset.pageLine || '';
  const sectionLines = JSON.parse(el.dataset.sectionLines || '{}');
  createRoot(el).render(<ChatBot pageLine={pageLine} sectionLines={sectionLines} />);
}
```

Signature vérifiée dans l'ancien dépôt, aucune adaptation nécessaire :
`export default function ChatBot({ pageLine, sectionLines }: ChatBotProps)`
avec `pageLine?: string` et `sectionLines?: Record<string, string>`. Le
montage ci-dessus correspond déjà au contrat.

Note : dans Astro le composant était monté en `client:only="react"`, donc
jamais rendu côté serveur. L'îlot reproduit ce comportement — le `<div>` est
vide dans le HTML et React le remplit au chargement. Ne pas chercher à le
pré-rendre.

- [ ] **Step 11: Lancer toute la suite, des deux côtés**

Run:
```bash
cd myFolioRS/frontend && bun run test && bun run build
cd ../backend && cargo test
```
Expected: PASS partout

- [ ] **Step 12: Vérifier la parité de bout en bout**

Run: `BIND_ADDR=127.0.0.1:8090 cargo run`, puis, avec `GROQ_API_KEY` renseignée :

1. Ouvrir `/` → le chatbot répond
2. Demander « je veux jouer » → redirection vers le jeu (marqueur fonctionnel)
3. Vérifier que le bot cite un vrai témoignage et un vrai projet
4. Naviguer sur `/projets`, `/blog`, `/contact` → répliques de Marvin présentes
5. Envoyer un message de contact → présent en base

Expected: comportement identique à l'ancien site sur les cinq points.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: API chat et îlot ChatBot — parité fonctionnelle atteinte"
```

**Fin de phase 3 — jalon de parité.** Le nouveau site fait tout ce que fait
l'ancien. Les phases suivantes ajoutent, elles ne rattrapent plus.

---

## Phase 4 — Admin (à détailler après la parité)

Les tâches ci-dessous sont volontairement décrites au niveau de leurs
interfaces et de leurs tests, pas au niveau du code. Elles seront développées
en étapes bite-sized une fois la phase 3 terminée : le schéma et les
conventions auront alors été éprouvés par trois phases d'usage réel, et
détailler maintenant 800 lignes de CRUD reviendrait à figer des choix contre
une base non validée.

**Ne pas commencer la phase 4 avant que la phase 3 ne soit vérifiée.**

### Task 12: Authentification
- `create_admin.rs` : lecture interactive du mot de passe (`rpassword`), hash Argon2id, insertion
- `POST /admin/login`, `POST /admin/logout`, middleware de session
- `actix-session` 0.11 + `CookieSessionStore`, clé 64 octets depuis `SESSION_KEY`
- Cookie : `HttpOnly`, `Secure`, `SameSite=Lax`, 7 jours
- Tests : bon mot de passe → 302 + cookie ; mauvais → 401 sans cookie ; `/admin` sans session → 302 vers login ; le message d'erreur ne distingue pas utilisateur inconnu et mot de passe faux

### Task 13: Protections du login
- Rate-limit : 5 tentatives par IP par 15 minutes, en mémoire
- Jeton CSRF sur tous les POST
- Tests : 6ᵉ tentative → 429 ; POST sans jeton CSRF → 403

### Task 14: CRUD projets et articles
- `/admin/projects`, `/new`, `/{id}/edit`, `POST /{id}/delete` ; idem articles
- Gestion des tags (création à la volée, purge des orphelins)
- Tests : création → visible sur `/projets` ; `published=0` → absent du site public et du sitemap ; suppression → 404 sur le détail

### Task 15: CRUD données personnelles + invalidation du cache
- `/admin/career`, `/skills`, `/testimonials`, `/companies` avec boutons ↑/↓ sur `sort_order`
- **Chaque écriture appelle `PromptCache::invalidate()`**
- Tests : réordonner change l'ordre sur la page publique ; modifier un témoignage change le prompt au message suivant (le test le plus important de la phase)

### Task 16: Messages de contact
- `/admin/messages` : liste, marquage lu/non-lu, suppression
- Tests : un message envoyé via l'API apparaît ; le marquage persiste

### Task 17: Upload d'images
- `POST /admin/upload` multipart, validation MIME (png/jpeg/webp/svg), plafond 5 Mo, nom de fichier assaini
- Tests : un fichier valide est stocké et servi ; un `.exe` renommé `.png` est refusé ; un fichier de 6 Mo est refusé

---

## Phase 5 — Déploiement (à détailler après la phase 4)

### Task 18: Dockerfile multi-stage
- Stage 1 `rust:1.98` → `cargo build --release` ; stage 2 `oven/bun` → `vite build` ; stage 3 `debian:bookworm-slim`
- Vérification : l'image finale ne contient ni `cargo` ni `node` ; `docker run` sert le site

### Task 19: Persistance et sauvegardes
- Volume pour `myfolio.db`, WAL vérifié en production
- Script de sauvegarde `VACUUM INTO` daté, rétention 30 jours, planifié quotidiennement
- Vérification : restaurer une sauvegarde dans un conteneur neuf redonne le site complet

### Task 20: Bascule
- Déploiement en parallèle de l'ancien site, vérification sur une URL de préproduction
- Bascule DNS, surveillance
- **Ne pas supprimer `myFolio/superior-star/` avant plusieurs sauvegardes réussies** (filet de secours du seed)

---

## Auto-relecture

**Couverture de la spec** — chaque section a sa tâche :

| Section de la spec | Tâche(s) |
|---|---|
| §1 Architecture (dépôt, routes) | 1, 7 |
| §2 Schéma SQLite (12 tables) | 2 |
| §3 Rendu SSR, SEO, sitemap/RSS | 6, 7, 8 |
| §4 Îlots React, bundles séparés | 9, 11 |
| §5 Chatbot, cache, `[LANCER_JEU]` | 11, 15 |
| §6 Contact, concurrence, validation | 10 |
| §7 Admin, auth, upload | 12–17 |
| §8 Tests (3 niveaux) | intégrés à chaque tâche |
| §9 Déploiement, sauvegardes | 18–20 |
| §10 Phases | structure du plan |

**Points de vigilance de la spec** — chacun a un test nommé :

| Risque | Où il est traité |
|---|---|
| `[LANCER_JEU]` | Task 11 : `le_prompt_conserve_le_marqueur_de_jeu` (Rust) + `retire le marqueur du texte affiché` (Vitest) |
| Rendu Markdown différent | Task 7 étape 6 : vérification visuelle des 14 fiches |
| Cache du prompt obsolète | Task 11 : `le_cache_evite_de_reconstruire_et_l_invalidation_le_vide` ; Task 15 |
| Perte du `.db` | Task 19 ; filet de secours en Task 20 |
| Force brute sur le login | Task 13 |

**Cohérence des types** — vérifiée : `Project`/`Post`/`CareerEntry`/`SkillGroup`/
`Testimonial`/`Company` définis en Task 3, consommés tels quels en 6, 7, 8, 11.
`AppError` défini en Task 5, utilisé dans tous les handlers. `PromptCache`
défini en Task 11, réutilisé en Task 15. `test_pool()` défini en Task 3,
utilisé par toutes les tâches suivantes.

**Écart assumé** : les phases 4 et 5 sont au niveau interface plutôt que
bite-sized, pour la raison donnée en tête de phase 4. Toutes les tâches des
phases 1 à 3 — celles qui mènent à la parité — sont complètes et exécutables.
