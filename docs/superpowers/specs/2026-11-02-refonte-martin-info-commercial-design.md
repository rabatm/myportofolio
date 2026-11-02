# Refonte « Martin Info » : du portfolio de développeur au site de prospection

Date : 2026-11-02
Statut : en attente de validation par Martin

## 1. Intention

Martin veut utiliser le site (martininfo.fr, ce dépôt) pour **trouver de nouveaux clients dans la région** (Perpignan, Pyrénées-Orientales), et à distance partout en France. Aujourd'hui le site parle surtout à des développeurs : compétences et technologies en avant, parcours chronologique au centre, fiches projets ouvertes par des listes de technos.

Le nouveau site doit faire qu'un dirigeant de TPE/PME (cabinet comptable, artisan, commerce, industrie, organisme de formation, services…) comprenne en quelques secondes **ce que Martin peut régler pour lui**, voie des preuves réelles, et ait envie d'écrire. Il vend des solutions, pas des technologies.

Martin tient à garder **le côté rétro et Marvin** : « un peu de folie dans ce monde trop classique, mais pas trop, on reste pro ». Le rétro devient une signature, plus un thème.

Le brief de Martin (extraits utiles en **annexe A**) est la référence de fond ; ce document en fixe les décisions concrètes. Points clés du brief repris ici : ton direct et concret, pas de jargon, pas de formules creuses (« transformation digitale », « propulser »…), appels à l'action variés (pas systématiquement « Demander un devis »), **jamais** de faux témoignages, faux logos, chiffres ou résultats inventés, pas de promesse d'audit ou de consultation gratuite.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Proposition de valeur comprise immédiatement depuis l'accueil.
- Chaque page mène naturellement au contact.
- Cinq services présentés par le besoin, la solution, le bénéfice.
- Réalisations racontées comme des études de cas (contexte → besoin → solution → fonctionnalités → résultats connus → technique en dernier).
- Bon référencement local (développeur indépendant Perpignan, application web Pyrénées-Orientales, logiciel métier sur mesure, automatisation IA entreprise, intégration logicielle…).
- Site complet en **français et en anglais** (décision de Martin : on garde l'anglais intégralement).

**Non-objectifs**
- Pas de nouvelle dépendance, pas de CMS, pas de changement de stack (Astro 7 + Tailwind 4 + React 19, Bun).
- Pas de tarifs, pas de prise de rendez-vous en ligne.
- Pas de refonte de WarGames (reste tel quel, caché).

**Anti-objectifs** (échec même si « ça marche »)
- Le site ressemble encore à un portfolio de dev générique, ou affiche des listes de technologies en accueil.
- Le rétro nuit à la lisibilité ou fait « pas sérieux » pour un comptable ou un artisan.
- Un fait, un client, un chiffre ou un résultat inventé, sur une page ou dans la bouche de Marvin.
- Animations voyantes, dégradés violets, robots IA, icônes décoratives sans fonction.

## 3. Décisions prises avec Martin

### 3.1 Direction visuelle : « A — clair et éditorial, rétro en accents »
Choisie parmi trois maquettes (A clair/éditorial, B phosphore sombre, C papier + fenêtres 90s).
- Fond crème clair, encre sombre, grosse typographie moderne, espaces généreux, compositions asymétriques maîtrisées.
- Le rétro passe par des **accents** : libellés en monospace, invites `>`, curseur `_`, et surtout **Marvin affiché comme un petit terminal vert phosphore** dans le hero, qui « répond » à un vrai problème de client (ex. : « ? mes logiciels ne se parlent pas » → « Martin a déjà relié une caisse BBSoft à un site e-commerce. On en parle ? »).
- La palette et les polices actuelles (`src/styles/retro.css` : fond `oklch(98% 0.01 95)`, encre, vert `--accent`, Space Grotesk + JetBrains Mono, variables `--marvin-*`) correspondent déjà à cette direction : on les garde et on les affine, on ne repart pas de zéro.
- Ce qui disparaît des pages commerciales : décorations ASCII (`✦ . * . ☉`, `─── ✦ ───`), marquee défilant, effets `retro-border` au survol trop appuyés. Ils peuvent survivre dans les zones « perso » (Côté atelier, WarGames).
- Animations discrètes uniquement, respect de `prefers-reduced-motion`.

### 3.2 Page d'accueil : déroulé validé (8 blocs, dans cet ordre)
1. **Hero** — titre « Vos idées méritent mieux qu'un logiciel standard. », sous-titre « Je conçois des applications web et mobiles, des automatisations IA et des outils métier adaptés à votre façon de travailler. », CTA principal « Parler de votre projet » (→ contact), CTA secondaire « Découvrir mes réalisations ». Terminal Marvin à droite (sur mobile : en dessous ou masqué). Ligne discrète : « Perpignan · Pyrénées-Orientales · partout en France à distance ».
2. **Bandeau clients** « Ils m'ont confié leurs outils » — logos réels : Amopi, JurisPerform, Surikwat, CKM66 (accord de CKM66 : voir §7).
3. **« Ce que je peux faire pour vous »** — 5 cartes, chacune ouverte par un problème du visiteur (« Vous gérez tout dans des tableurs ? », « Vos équipes travaillent sur le terrain ? », « Vous refaites les mêmes tâches chaque semaine ? », « Vos logiciels ne se parlent pas ? », « Un logiciel existant à reprendre ? ») → page Services (ancre du service).
4. **Réalisations à la une** — 3 cartes : CKM66, amiqo, Minouche, formulées en avant/après.
5. **« Comment on travaille ensemble »** — 4 étapes : Comprendre (on parle de votre métier, pas de technique) / Proposer (une solution claire, à votre échelle) / Construire (des versions testables au fil de l'eau) / Accompagner (mise en production, formation, évolutions). Validé par Martin.
6. **Témoignages** — les 3 réels (`src/data/temoignages.ts`), version courte + « lire la suite ».
7. **Bloc humain** « Un interlocuteur, du premier café à la mise en ligne » — photo, 4 lignes, lien À propos, clin d'œil à Cleo.
8. **Contact** sur fond sombre — titre « Vous avez une idée, un problème à résoudre ou un outil à créer ? Parlons-en. », formulaire court + email direct + invitation à « poser la question à Marvin ».

Retirés de l'accueil : Skills, Parcours chronologique (déplacés en version allégée sur À propos), `ApercuProjets` actuel (remplacé par le bloc 4).

### 3.3 Autres pages
- **Services** (nouvelle) — 5 blocs (Applications web, Applications mobiles, Automatisation & IA, Intégration logicielle & API, Maintenance & évolution). Chaque bloc : le besoin, ce que Martin peut développer (exemples du brief), le bénéfice concret, **le ou les projets réels qui le prouvent**, un CTA à formulation propre. Correspondances : web → Jurisperform Licence, BOMIQO, CKM66 ; mobile → amiqo, Jurisperform Professeur, CKM66 ; intégration → Minouche, Passerelle BBSoft ; maintenance → Passerelle BBSoft (reprise de legacy Delphi). **Automatisation & IA** n'a pas d'étude de cas : on cite Marvin (IA en service sur le site même) et la réécriture de flux d'import/export chez Amopi (attestée par le témoignage d'Hugo Aguado), rien d'autre.
- **Réalisations** (page Projets refondue, URL inchangée) — 8 fiches : les 6 existantes + **CKM66** (nouvelle) + **Cleo** (nouvelle, catégorie à part). Filtre par service. Fiche détail réordonnée : contexte, besoin, solution, fonctionnalités, résultats (seulement s'ils sont connus), puis un encart « Côté technique » en bas avec les technos.
- **Côté atelier** — *(choix du rédacteur)* section en bas de la page `/projets`, séparée visuellement des réalisations clients, pas de nouvelle route. Cleo y est seul pour l'instant, avec son ton décalé. Il a une page détail normale `/projets/<slug>`, n'apparaît ni dans le filtre par service ni dans les réalisations à la une, et Marvin le présente comme un projet perso, pas comme une référence client.
- **À propos** (nouvelle) — approche (compréhension métier, relation directe, de la conception à la mise en production, systèmes complexes) ; parcours en 3 temps forts, pas en chronologie : ~15 ans d'administration système et support niveau 3 en grands groupes (Lafarge, Steria, Ministère de la Santé, LCL…), indépendant depuis 2021, formateur logiciel + École 42 ; une rubrique « ce qui m'anime » (Cleo, WarGames en clin d'œil sans en révéler la nature).
- **Contact** — formulaire : Nom, Entreprise, Email, Type de projet, Description du besoin. Email direct affiché. Anti-spam actuel conservé tel quel (`spamGuard.ts`).
- **Blog** — conservé, dans la navigation.
- **WarGames** — inchangé, toujours caché.

### 3.4 Navigation
Logo texte `martin_info>_` (ou équivalent mono) → accueil. Liens : Services · Réalisations · À propos · Blog · FR|EN, + bouton « Parler de votre projet ». Menu mobile existant (`MenuMobile.tsx`) adapté.

### 3.5 Marvin
Garde son look de terminal et son nom. Devient **un assistant d'accueil commercial** : connaît les services, les réalisations (titre + description + services, plus seulement les tags), les témoignages et clients ; oriente vers le contact. Les règles de vérité du prompt actuel restent (n'invente rien, ni tarif, ni délai, ni résultat). La partie technique (technos, École 42) reste disponible s'il est questionné, mais n'est plus mise en avant. Les bulles d'accroche (`src/data/marvinLines.ts`) sont réécrites dans ce sens, par page et par section, FR et EN. Le comportement `[LANCER_JEU]` est inchangé.

## 4. Contenu nouveau, faits vérifiés

### CKM66 (client, réalisation phare)
Source : https://ckm66.vercel.app/ (pages accueil, `/marketing`, `/articles`). Martin a réalisé **les trois parties** : le site, l'application mobile iOS/Android et la partie gestion du club.
- Client : Commando Krav Maga Perpignan (CKM66), club au centre Les 5 Éléments, Perpignan ; instructeur Jérôme Luque, Level 4.
- Avant (formulé par le club lui-même) : appeler pour réserver ses cours, rater des cours par oubli, ne pas suivre sa progression, perdre du temps avec les formalités.
- Site : vitrine avec horaires, tarifs, journal d'articles, référencement local (données structurées).
- App (gratuite, iOS & Android) : réservation en temps réel, liste d'attente automatique, annulation, rappels avant chaque cours et actualités du club, plus de 20 badges d'assiduité/progression, classement entre membres, suivi de progression, mode hors ligne avec synchronisation, comptes fournis par le club.
- Résultats chiffrés : **aucun connu → aucun affiché.**

### Cleo (projet perso, « Côté atelier »)
Source : le texte fourni par Martin, reproduit en **annexe B** (à reprendre presque tel quel, ton compris). App macOS de barre de menu : un chat animé (19 frames dessinées main) qui court à une vitesse proportionnelle au CPU ; affiche mémoire, quotas Claude (5 h / 7 j) et Kimi (5 h + mensuel) en anneaux avec compte à rebours ; masquage par fournisseur, démarrage au login, accessoire de menu léger. Phrase de lien commercial unique et discrète : aller chercher l'information là où elle est et la rendre lisible d'un coup d'œil.

## 5. Contraintes techniques

- Architecture existante respectée (voir `CLAUDE.md`) : pages = composants `lang`-paramétrés dans `src/components/pages/` + deux shells FR/EN + une ligne dans `ROUTES` ; chaînes UI dans `src/i18n/ui.ts` ; collections lues via `getLocalizedCollection`.
- **Nouvelles routes** : `services` (`/services`, `/en/services`) et `about` (`/a-propos`, `/en/about`). Les URL existantes ne changent pas (`/projets` reste l'URL de « Réalisations ») : liens partagés et référencement.
- **Les faits sur les services sont des données**, pas du texte en dur : nouveau fichier `src/data/services.ts` en `Record<Lang, …>`, utilisé par l'accueil, la page Services et `chatPrompt.ts`, couvert par `src/data/parity.test.ts`. Idem pour les 4 étapes de travail si Marvin doit pouvoir en parler.
- **Schéma `projects`** (`src/content.config.ts`) étendu pour porter au minimum : les services illustrés par le projet, la nature client / atelier, et la mise à la une sur l'accueil. Les champs existants restent valides.
- **Formulaire de contact** : `company` et `projectType` ajoutés comme champs **optionnels** côté API (`contactMail.ts` : validation + inclusion dans le mail), pour que le formulaire de WarGames, qui poste aussi sur `/api/contact`, continue de fonctionner sans modification. `projectType` = un des 5 services ou « Autre / je ne sais pas encore ». Tests unitaires mis à jour.
- **SEO** : title et meta description propres à chaque page et langue ; données structurées `ProfessionalService` *(choix du rédacteur : nom Martin Info, fondateur Martin Rabat, ville Perpignan, région Pyrénées-Orientales, zone servie France, email public, voir §7 ; pas d'adresse postale, de téléphone ni de SIRET)* ; sitemap et canoniques à jour avec les nouvelles pages (cf. commit 584d20e) ; un seul `h1` par page, hiérarchie de titres propre.
- **Performance / accessibilité** : images via `astro:assets` comme aujourd'hui ; contrastes WCAG AA (attention au vert sur crème) ; navigation clavier, focus visibles ; `prefers-reduced-motion`.
- Tests Vitest existants verts ; nouveaux tests pour la logique ajoutée (parité des données, contact, prompt).

## 6. Laissé au builder

- Rédaction finale des textes (FR et EN) dans le ton du brief, à partir des faits ci-dessus et des fiches existantes. La réécriture des 6 fiches projets existantes au format étude de cas, sans ajouter de faits.
- Noms exacts des champs de schéma et du fichier de données, découpage en composants.
- Ajustements fins de palette, tailles, espacements, dans la direction A.
- Comportement responsive du terminal Marvin du hero.
- Sort des composants retirés (`Skills.astro`, `Parcours.astro`, `ApercuProjets.astro`, `Marquee.astro`) : réutilisés sur À propos, adaptés ou supprimés.

## 7. Accords et coordonnées (confirmés par Martin le 2026-11-02)

- **CKM66** a donné son accord : il apparaît comme client (ajout dans `companies.ts`, donc connu de Marvin), avec son logo dans le bandeau, et Jérôme Luque peut être nommé dans l'étude de cas.
- **Email public** : `martin.rabat@gmail.com`, comme aujourd'hui. Il est défini à un seul endroit (constante partagée) pour pouvoir passer plus tard à une adresse pro sans chercher dans tout le code.

## 8. Matière à fournir par Martin (bloque seulement l'élément concerné)


- Captures de l'app CKM66 et logo CKM66 (en attendant le logo : le nom du club en texte dans le bandeau). À défaut, captures du site public CKM66.
- Capture ou GIF de Cleo dans la barre de menu + menu ouvert ; lien GitHub s'il est public.
- Tant que ces visuels manquent, les fiches s'affichent avec une vignette sobre de remplacement ; le build ne doit pas dépendre de leur présence pour le reste du site.

## Annexe A — Extraits du brief de Martin

**Positionnement** : « Je conçois des applications et des automatisations qui simplifient le quotidien des entreprises. » Professionnel, accessible, moderne, légèrement audacieux. Pas une agence de com, pas une ESN, pas un développeur WordPress : un interlocuteur technique direct qui comprend un besoin métier et construit la solution.

**Exemples par service** (seuls exemples autorisés dans `services.ts` ; ce sont des types de réalisations possibles, pas des références client) :
- Applications web sur mesure : applications de gestion, tableaux de bord, portails clients, back-offices, outils métier, gestion de dossiers et de données.
- Applications mobiles (Android et iOS) : applications métier, outils pour collaborateurs, applications terrain, gestion des interventions, suivi d'activité, applications connectées aux systèmes existants.
- Automatisation et workflows IA : automatisation administrative, traitement de documents, classification et extraction d'informations, assistants IA, génération de rapports, automatisation des échanges entre logiciels, intégration de modèles IA dans les applications métier. Valeur à souligner : moins de tâches répétitives, moins de ressaisies, meilleure circulation de l'information.
- Intégration logicielle et API : synchronisation de données, connexion ERP / CRM, développement d'API, passerelles entre logiciels, interconnexion de bases de données, modernisation de systèmes existants.
- Maintenance et évolution : accompagnement technique, reprise de projets, maintenance applicative, évolution de logiciels existants.

**Cibles** : TPE et PME, cabinets comptables et professions libérales, artisans et bâtiment, commerces et distributeurs, industrie, organismes de formation, entreprises de services, structures aux besoins métier spécifiques.

**Ton** : direct, professionnel, accessible, humain, confiant sans prétention, orienté solutions. Exemples donnés : « Vos logiciels ne communiquent pas entre eux ? Je peux créer la passerelle qui leur manque. » ; « Vous passez du temps à répéter les mêmes opérations ? Voyons ce qui peut être automatisé. » Interdits : « Réinventer votre transformation digitale », « Propulser votre entreprise vers le futur », « Libérer le potentiel de votre business », « L'innovation au cœur de votre ADN ».

**CTA possibles** : Parlons de votre projet · Décrivons votre besoin · Imaginer une solution · Discuter d'une automatisation · Voir si je peux vous aider.

**Requêtes SEO visées** : développeur indépendant Perpignan · développement application web Pyrénées-Orientales · développement application mobile · logiciel métier sur mesure · automatisation IA entreprise · intégration logicielle · développement informatique PME. Référencement naturel, pas de bourrage de mots-clés.

**Règle fondamentale** : le visiteur ne doit pas retenir React, Flutter ou PostgreSQL, mais qu'il peut confier à Martin un logiciel à créer, une application à développer, un processus à automatiser, des outils à connecter, un projet numérique à concrétiser.

## Annexe B — Texte de Cleo fourni par Martin (verbatim)

> Le chat de ta barre de menu. Qui court..
>
> Version Chat dans la barre de menu N'a jamais raté une sieste
>
> **L'épopée**
> Il était une fois une barre de menu. Froide. Grise. Désespérément dépourvue de félin.
>
> Puis Cleo arriva. Un chat animé qui fait du parkour dans votre barre de menu à une vitesse proportionnelle à votre CPU. Plus vous compilez, plus il sprinte. Plus vous compilez mal, plus il sprinte vite.
>
> Cleo ne se contente pas de courir. Cleo sait. Il connaît vos quotas Claude (5 h / 7 j) et vos quotas Kimi (5 h + mensuel). Il les affiche en jolis anneaux, avec un compte à rebours de la remise à zéro, pour que vous sachiez exactement combien de temps il vous reste avant le drame.
>
> Et quand le quota tombe à zéro… Cleo vous regarde faire. Il a tout vu venir.
>
> **Ce que Cleo surveille**
>
> | Indicateur | Source | Rendu |
> |---|---|---|
> | 🏃 CPU | API Mach (host_processor_info) | Vitesse du chat (lissée, il ne fait pas de sprint paniqué pour un pic de 50 ms) |
> | 🧠 Mémoire | host_statistics64 + pression système | Pression (normal / warning / critical) + Go utilisés + swap |
> | 🟠 Quota Claude | Endpoint officieux /api/oauth/usage, jeton lu dans le trousseau macOS | Anneau double : fenêtre 5 h (intérieur) et 7 j (extérieur) |
> | 🌙 Quota Kimi | api.kimi.ai/coding/v1/usages, jeton rafraîchi depuis ~/.kimi-code/credentials/ | Anneau double : fenêtre 5 h + mensuel |
>
> Les compteurs de quota affichent le temps restant avant remise à zéro (3h12, 47m, 2j14h) — histoire de savourer l'attente.
>
> **Fonctionnalités**
> - 🐱 Chat animé (19 frames dessinées main, parce que Cleo mérite mieux qu'un emoji)
> - 📊 Menu détaillé : CPU, mémoire, quotas, compte à rebours
> - 🔄 Rafraîchissement automatique des quotas
> - 🙈 Masquage au choix : « Afficher Claude Code » et « Afficher Kimi Code » dans le menu. Un fournisseur masqué disparaît de la barre et du panneau, et n'est plus interrogé. Cleo s'en souvient.
> - 🚀 Démarrage au login via LaunchAgent (avec toggle dans le menu, et Cleo détecte tout seul s'il tourne déjà — il n'aime pas les sosies)
> - 🪶 Léger : accessoire de menu (LSUIElement), zéro Dock, zéro fenêtre inutile
>
> **Installation** : construisez avec Xcode (target Cleo), glissez l'app dans /Applications, lancez. Activez le démarrage au login depuis le menu. Cleo fait le reste.
>
> **Exigences** : macOS récent (AppKit + SwiftUI) ; CLI Claude Code installé (pour le quota Claude — Cleo lit le jeton via /usr/bin/security, comme le CLI : aucune invite trousseau) ; CLI Kimi Code installé (pour le quota Kimi).
>
> **Philosophie** : « Je ne cours pas parce que ton CPU est à 90 %. Je cours parce que toi, tu cours. » — Cleo, probablement, pendant que vous attendiez votre build.
>
> Aucun chat n'a été stressé pendant le dév
