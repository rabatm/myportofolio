import type { Lang } from './utils';

/**
 * Chaînes d'interface. Le français fait référence : le type de `en` en est
 * dérivé, donc une clé oubliée en anglais est une erreur de compilation.
 *
 * TS pur, sans dépendance Astro : importable par les composants React et par
 * les routes d'API.
 */
const fr = {
  'layout.defaultDescription':
    "Martin Info : développeur indépendant à Perpignan. Applications web et mobiles sur mesure, automatisation et intégrations pour les PME des Pyrénées-Orientales.",
  'layout.footer': '© 2026 Martin Info — Développement sur mesure · Perpignan',
  'layout.lightboxClose': 'Fermer',

  'nav.services': 'Services',
  'nav.projects': 'Réalisations',
  'nav.about': 'À propos',
  'nav.blog': 'Blog',
  'nav.cta': 'Parler de votre projet',
  'nav.switchAria': 'Lire cette page en anglais',
  'nav.otherLangName': 'English',
  'nav.menuOpen': 'Ouvrir le menu',
  'nav.menuClose': 'Fermer le menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'Ce site existe aussi en français.',
  'suggest.action': 'Voir en français',
  'suggest.dismiss': 'Fermer',

  'content.onlyIn': '🇬🇧 En anglais uniquement',

  'about.title': 'À propos — Développeur informatique PME à Perpignan',
  'about.description':
    "Martin Rabat, développeur informatique pour PME dans les Pyrénées-Orientales : une quinzaine d'années dans les systèmes critiques, indépendant depuis 2021.",
  'about.kicker': 'À propos',
  'about.heading': 'Martin Rabat, développeur indépendant à Perpignan',
  'about.intro': 'Je conçois des applications et des automatisations qui simplifient le quotidien des entreprises.',
  'about.approachKicker': 'Approche',
  'about.approachTitle': 'Ma façon de travailler',
  'about.pathKicker': 'Parcours',
  'about.pathTitle': 'Trois temps forts',
  'about.funKicker': 'Côté atelier',
  'about.fun': "Ce qui m'anime",
  'about.funText':
    "Construire des outils, y compris pour le plaisir. Cleo en est un : un chat qui court dans la barre de menu du Mac, d'autant plus vite que l'ordinateur travaille, et qui affiche d'un coup d'œil la mémoire et les quotas des assistants IA.",
  'about.funCleoLink': 'Faire connaissance avec Cleo',
  'about.funGame': "Et quelque part sur ce site, un jeu attend qu'on le trouve. Marvin en sait peut-être plus qu'il ne le dit.",
  'about.ctaTitle': "Un besoin, un outil qui coince, une idée à concrétiser ?",
  'about.cta': 'Voir si je peux vous aider',

  'testimonials.title': 'Témoignages',
  'testimonials.prev': 'Précédent',
  'testimonials.next': 'Suivant',
  'testimonials.more': 'Lire la suite',
  'testimonials.less': 'Voir moins',
  'testimonials.moreAria': 'Voir plus',
  'testimonials.translated': '',

  'home.title': 'Développeur indépendant à Perpignan — Martin Info',
  'home.description':
    "Applications web et mobiles, automatisation et intégration logicielle sur mesure pour les entreprises. Développeur indépendant à Perpignan, Pyrénées-Orientales.",
  'home.heroKicker': 'Développeur indépendant · Perpignan',
  'home.heroTitle': "Vos idées méritent mieux qu'un logiciel standard.",
  'home.heroSub':
    'Je conçois des applications web et mobiles, des automatisations IA et des outils métier adaptés à votre façon de travailler.',
  'home.heroCta': 'Parler de votre projet',
  'home.heroCta2': 'Découvrir mes réalisations',
  'home.heroWhere': 'Perpignan · Pyrénées-Orientales · partout en France à distance',
  'home.heroIllustrationLabel':
    'Schéma : une caisse, un site web, une application mobile et une base de données reliés entre eux par une passerelle',
  'home.clientsTitle': "Ils m'ont confié leurs outils",
  'home.servicesKicker': 'Services',
  'home.servicesTitle': 'Ce que je peux faire pour vous',
  'home.servicesIntro': 'Chaque projet part d’un problème concret. Vous reconnaissez le vôtre ?',
  'home.servicesAll': 'Tous les services en détail',
  'home.workKicker': 'Réalisations',
  'home.workTitle': 'Réalisations à la une',
  'home.workIntro': 'Trois projets récents, racontés côté client : le besoin de départ et ce qui a changé.',
  'home.workAll': 'Voir toutes les réalisations',
  'home.methodKicker': 'Méthode',
  'home.methodTitle': 'Comment on travaille ensemble',
  'home.testimonialsTitle': "Ce qu'en disent mes clients",
  'home.humanKicker': 'Qui suis-je',
  'home.humanTitle': 'Un interlocuteur, du premier café à la mise en ligne',
  'home.human1': 'Développeur indépendant depuis 2021.',
  'home.human2':
    "Avant cela, une quinzaine d'années à faire tourner des systèmes critiques pour de grandes organisations : je sais ce que coûte un outil qui tombe en panne.",
  'home.human3': 'Basé à Perpignan, je travaille pour des entreprises des Pyrénées-Orientales, et partout en France à distance.',
  'home.human4': "Pas d'intermédiaire : vous parlez directement à celui qui conçoit et développe votre outil.",
  'home.humanAbout': 'En savoir plus sur moi',
  'home.humanCleo':
    "Côté atelier, il y a aussi Cleo : un chat qui court dans la barre de menu du Mac, d'autant plus vite que l'ordinateur travaille.",
  'home.humanCleoLink': 'Faire connaissance avec Cleo',
  'home.contactTitle': 'Vous avez une idée, un problème à résoudre ou un outil à créer ? Parlons-en.',
  'home.contactMarvin': "Ou posez la question à Marvin : son terminal vous attend en bas de l'écran.",

  'projects.title': 'Réalisations : applications web et mobiles — Martin Info',
  'projects.description':
    'Applications métier, mobiles et intégrations livrées pour des entreprises : ERP retail, backoffice de franchises, applications terrain.',
  'projects.heading': 'Réalisations',
  'projects.filterAll': 'Tout',
  'projects.filterLabel': 'Filtrer par service',
  'projects.atelierTitle': 'Côté atelier',
  'projects.atelierIntro': 'Ce que je construis pour le plaisir, et qui finit souvent par servir.',
  'project.back': '← Toutes les réalisations',
  'project.ctaClient': 'Un besoin qui ressemble à celui-ci ? Parlons-en.',
  'project.ctaAtelier': 'Une idée un peu folle ? Écrivez-moi.',
  'project.ctaAtelierButton': "M'écrire",
  'project.visit': 'Voir le projet',

  'blog.title': 'Blog — Martin Info, développeur à Perpignan',
  'blog.description':
    "Retours d'expérience d'un développeur indépendant : logiciel métier, automatisation et applications web et mobiles pour les PME.",
  'blog.heading': 'Blog',
  'post.titleSuffix': '— Blog Martin Info',
  'post.back': '< Retour au blog',

  'contact.title': 'Contact — Martin Info, développeur à Perpignan',
  'contact.description':
    'Parlez de votre projet à Martin Rabat, développeur indépendant à Perpignan : application web ou mobile, automatisation, intégration. Réponse rapide.',
  'contact.kicker': 'Contact',
  'contact.heading': 'Vous avez une idée, un problème à résoudre ou un outil à créer ? Parlons-en.',
  'contact.intro': 'Décrivez votre besoin en quelques lignes, je vous réponds rapidement.',
  'services.title': 'Logiciel métier sur mesure et automatisation — Martin Info',
  'services.description':
    'Applications web et mobiles sur mesure, automatisation, intégration logicielle : ce que Martin Info peut construire pour votre entreprise.',
  'services.kicker': 'Services',
  'services.heading': 'Ce que je peux construire pour vous',
  'services.intro': 'Cinq façons de travailler ensemble, chacune partant d’un problème concret.',
  'services.builds': 'Ce que je peux construire',
  'services.benefit': 'Ce que vous y gagnez',
  'services.proofs': 'Déjà réalisé',
  'contact.direct': 'Vous préférez écrire directement ?',
  'contact.name': 'Nom',
  'contact.company': 'Entreprise',
  'contact.email': 'Email',
  'contact.projectType': 'Type de projet',
  'contact.projectTypeChoose': 'Choisir…',
  'contact.projectTypeOther': 'Autre / je ne sais pas encore',
  'contact.message': 'Votre besoin',
  'contact.optional': 'facultatif',
  'contact.submit': 'Envoyer',
  'contact.sending': 'Envoi…',
  'contact.done.connect': 'connexion au relais SMTP',
  'contact.done.tls': 'chiffrement TLS',
  'contact.done.progress': 'transmission',
  'contact.done.sent': 'MESSAGE TRANSMIS ✓',
  'contact.done.thanks': 'Merci {name} ! Je vous réponds rapidement.',
  'contact.done.again': '[ ENVOYER UN AUTRE MESSAGE ]',
  'contact.error': 'Envoi impossible. Écrivez-moi directement à {email}',

  'marvin.greeting':
    'Bonjour ! Décrivez-moi votre besoin : je peux vous dire si Martin peut vous aider, et vous montrer ce qu’il a déjà construit dans le même genre.',
  'marvin.longSession': 'SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.',
  'marvin.connectionLost': 'connexion perdue',
  'marvin.retry': 'Réessayer',
  'marvin.placeholder': 'Écrivez un message…',
  'marvin.inputAria': 'Votre message pour MARVIN-42',
  'marvin.send': 'Envoyer le message',
  'marvin.closeChat': 'Fermer la conversation',
  'marvin.pillOpen': 'Ouvrir le chat MARVIN-42',
  'marvin.pillClose': 'Fermer le chat MARVIN-42',
  'marvin.pillLong': 'Parler à MARVIN-42',

  'chat.rateLimit':
    'Le service est momentanément indisponible en raison d’un nombre élevé de demandes. Merci de réessayer dans quelques instants.',
  'chat.error': 'ERREUR: connexion au serveur perdue. Réessayez plus tard.',

  'wargames.intro': 'BIENVENUE AU JEU.\n\nTROIS ROUNDS.\n\nQUE LE MEILLEUR GAGNE.',
  'wargames.start': 'COMMENCER',
  'wargames.back': '> Retour au portfolio',
  'wargames.backChat': '> Revenir au chat',
  'wargames.finalScore': 'SCORE FINAL',
  'wargames.visitor': 'VISITEUR',
  'wargames.you': 'VOUS',
  'wargames.endWin': "ANOMALIE STATISTIQUE CONFIRMÉE. BRAVO, TU AS GAGNÉ LE DROIT D'EMBAUCHER MARTIN.",
  'wargames.endDraw': "ÉGALITÉ FINALE. J'AURAIS PU T'ÉCRASER. J'AI CHOISI LA CLÉMENCE.",
  'wargames.endLose': '...TU REVIENDRAIS PAS SUR TERRE ?',
  'wargames.contactPrompt': 'UN PROJET PASSIONNANT ? ÉCRIS-MOI.',
  'wargames.contactSent': 'MESSAGE TRANSMIS.',
  'wargames.contactError': 'ERREUR: message non envoyé.',
  'wargames.name': 'NOM',
  'wargames.submit': '> ENVOYER',
  'wargames.sending': 'ENVOI...',
  'wargames.statusDraw': 'ÉGALITÉ.',
  'wargames.statusVisitorWins': 'VISITEUR GAGNE !',
  'wargames.statusMarvinWins': 'MARVIN-42 GAGNE.',
  'wargames.statusYourTurn': 'À TOI DE JOUER.',
  'wargames.statusThinking': 'MARVIN-42 RÉFLÉCHIT...',
};

export type UiKey = keyof typeof fr;

/** Clés qui peuvent légitimement être vides dans une langue. */
export const OPTIONAL_KEYS: readonly UiKey[] = ['testimonials.translated'];

const en: Record<UiKey, string> = {
  'layout.defaultDescription':
    'Martin Info: independent developer in Perpignan, France. Custom web and mobile applications, automation and integrations for small and mid-sized businesses.',
  'layout.footer': '© 2026 Martin Info — Custom software · Perpignan, France',
  'layout.lightboxClose': 'Close',

  'nav.services': 'Services',
  'nav.projects': 'Work',
  'nav.about': 'About',
  'nav.blog': 'Blog',
  'nav.cta': "Let's talk about your project",
  'nav.switchAria': 'Read this page in French',
  'nav.otherLangName': 'Français',
  'nav.menuOpen': 'Open menu',
  'nav.menuClose': 'Close menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'This site is also available in English.',
  'suggest.action': 'View in English',
  'suggest.dismiss': 'Dismiss',

  'content.onlyIn': '🇫🇷 French only',

  'about.title': 'About — IT developer for SMEs in Perpignan, France',
  'about.description':
    'Martin Rabat, IT developer for small businesses in the Pyrénées-Orientales: some fifteen years in critical systems, independent since 2021.',
  'about.kicker': 'About',
  'about.heading': 'Martin Rabat, independent developer in Perpignan',
  'about.intro': 'I build applications and automations that make day-to-day work simpler for businesses.',
  'about.approachKicker': 'Approach',
  'about.approachTitle': 'How I work',
  'about.pathKicker': 'Background',
  'about.pathTitle': 'Three milestones',
  'about.funKicker': 'Workshop side',
  'about.fun': 'What drives me',
  'about.funText':
    'Building tools, sometimes just for fun. Cleo is one of them: a cat that runs in the Mac menu bar, faster the harder the computer works, and shows memory and AI assistant quotas at a glance.',
  'about.funCleoLink': 'Meet Cleo',
  'about.funGame': 'And somewhere on this site, a game is waiting to be found. Marvin may know more than he lets on.',
  'about.ctaTitle': 'A need, a tool that gets in the way, an idea to bring to life?',
  'about.cta': 'See if I can help',

  'testimonials.title': 'Testimonials',
  'testimonials.prev': 'Previous',
  'testimonials.next': 'Next',
  'testimonials.more': 'Read more',
  'testimonials.less': 'Show less',
  'testimonials.moreAria': 'Show more',
  'testimonials.translated': 'Translated from French',

  'home.title': 'Independent developer in Perpignan — Martin Info',
  'home.description':
    'Custom web and mobile applications, automation and software integration for businesses. Independent developer in Perpignan, France.',
  'home.heroKicker': 'Independent developer · Perpignan, France',
  'home.heroTitle': 'Your ideas deserve better than off-the-shelf software.',
  'home.heroSub':
    'I build web and mobile applications, AI automations and business tools shaped around the way you work.',
  'home.heroCta': "Let's talk about your project",
  'home.heroCta2': 'Explore my work',
  'home.heroWhere': 'Perpignan · Pyrénées-Orientales · anywhere in France, remotely',
  'home.heroIllustrationLabel':
    'Diagram: a till system, a website, a mobile app and a database connected to each other through a bridge',
  'home.clientsTitle': 'They trusted me with their tools',
  'home.servicesKicker': 'Services',
  'home.servicesTitle': 'What I can do for you',
  'home.servicesIntro': 'Every project starts from a real problem. Do you recognize yours?',
  'home.servicesAll': 'All services in detail',
  'home.workKicker': 'Work',
  'home.workTitle': 'Featured work',
  'home.workIntro': "Three recent projects, told from the client's side: where they started and what changed.",
  'home.workAll': 'See all work',
  'home.methodKicker': 'Method',
  'home.methodTitle': 'How we work together',
  'home.testimonialsTitle': 'What clients say',
  'home.humanKicker': 'Who I am',
  'home.humanTitle': 'One contact, from the first coffee to going live',
  'home.human1': 'Independent developer since 2021.',
  'home.human2':
    'Before that, some fifteen years keeping critical systems running for large organizations: I know what a broken tool costs.',
  'home.human3': 'Based in Perpignan, I work for businesses in the Pyrénées-Orientales, and anywhere in France remotely.',
  'home.human4': 'No middleman: you talk directly to the person who designs and builds your tool.',
  'home.humanAbout': 'More about me',
  'home.humanCleo':
    'On the workshop side, there is also Cleo: a cat that runs in the Mac menu bar, faster the harder the computer works.',
  'home.humanCleoLink': 'Meet Cleo',
  'home.contactTitle': "Have an idea, a problem to solve or a tool to build? Let's talk.",
  'home.contactMarvin': 'Or ask Marvin: his terminal is waiting at the bottom of the screen.',

  'projects.title': 'Work: web and mobile applications — Martin Info',
  'projects.description':
    'Business web and mobile applications and integrations delivered for companies: retail ERP, franchise back offices, field apps.',
  'projects.heading': 'Work',
  'projects.filterAll': 'All',
  'projects.filterLabel': 'Filter by service',
  'projects.atelierTitle': 'Workshop side',
  'projects.atelierIntro': 'What I build for fun, and which often ends up being useful.',
  'project.back': '← All work',
  'project.ctaClient': 'A need that looks like this one? Let us talk.',
  'project.ctaAtelier': 'A slightly crazy idea? Write to me.',
  'project.ctaAtelierButton': 'Write to me',
  'project.visit': 'View project',

  'blog.title': 'Blog — Martin Info, developer in Perpignan',
  'blog.description':
    'Lessons learned by an independent developer: custom business software, automation, and web and mobile applications for small businesses.',
  'blog.heading': 'Blog',
  'post.titleSuffix': '— Martin Info blog',
  'post.back': '< Back to blog',

  'contact.title': 'Contact — Martin Info, developer in Perpignan',
  'contact.description':
    'Tell Martin Rabat, an independent developer in Perpignan, France, about your project: web or mobile app, automation, integration. Quick reply.',
  'contact.kicker': 'Contact',
  'contact.heading': "Have an idea, a problem to solve or a tool to build? Let's talk.",
  'contact.intro': "Describe what you need in a few lines, and I'll get back to you quickly.",
  'services.title': 'Custom business software and automation — Martin Info',
  'services.description':
    'Custom web and mobile applications, automation, software integration: what Martin Info can build for your business, backed by real projects.',
  'services.kicker': 'Services',
  'services.heading': 'What I can build for you',
  'services.intro': 'Five ways of working together, each starting from a real problem.',
  'services.builds': 'What I can build',
  'services.benefit': 'What you get out of it',
  'services.proofs': 'Already delivered',
  'contact.direct': 'Rather write directly?',
  'contact.name': 'Name',
  'contact.company': 'Company',
  'contact.email': 'Email',
  'contact.projectType': 'Project type',
  'contact.projectTypeChoose': 'Choose…',
  'contact.projectTypeOther': 'Other / not sure yet',
  'contact.message': 'What you need',
  'contact.optional': 'optional',
  'contact.submit': 'Send',
  'contact.sending': 'Sending…',
  'contact.done.connect': 'connecting to SMTP relay',
  'contact.done.tls': 'TLS encryption',
  'contact.done.progress': 'transmitting',
  'contact.done.sent': 'MESSAGE SENT ✓',
  'contact.done.thanks': "Thanks {name}! I'll get back to you shortly.",
  'contact.done.again': '[ SEND ANOTHER MESSAGE ]',
  'contact.error': "Couldn't send your message. Email me directly at {email}",

  'marvin.greeting':
    "Hello! Describe your need: I can tell you whether Martin can help you, and show you what he has already built along the same lines.",
  'marvin.longSession': 'LONG SESSION DETECTED. SHORT-TERM MEMORY ONLY.',
  'marvin.connectionLost': 'connection lost',
  'marvin.retry': 'Retry',
  'marvin.placeholder': 'Type a message…',
  'marvin.inputAria': 'Your message to MARVIN-42',
  'marvin.send': 'Send message',
  'marvin.closeChat': 'Close conversation',
  'marvin.pillOpen': 'Open MARVIN-42 chat',
  'marvin.pillClose': 'Close MARVIN-42 chat',
  'marvin.pillLong': 'Talk to MARVIN-42',

  'chat.rateLimit':
    'The service is temporarily unavailable due to a high number of requests. Please try again in a few moments.',
  'chat.error': 'ERROR: lost connection to the server. Try again later.',

  'wargames.intro': 'WELCOME TO THE GAME.\n\nTHREE ROUNDS.\n\nMAY THE BEST PLAYER WIN.',
  'wargames.start': 'START',
  'wargames.back': '> Back to portfolio',
  'wargames.backChat': '> Back to the chat',
  'wargames.finalScore': 'FINAL SCORE',
  'wargames.visitor': 'VISITOR',
  'wargames.you': 'YOU',
  'wargames.endWin': 'STATISTICAL ANOMALY CONFIRMED. CONGRATULATIONS, YOU HAVE EARNED THE RIGHT TO HIRE MARTIN.',
  'wargames.endDraw': 'FINAL DRAW. I COULD HAVE CRUSHED YOU. I CHOSE MERCY.',
  'wargames.endLose': '...CARE TO COME BACK DOWN TO EARTH?',
  'wargames.contactPrompt': 'GOT AN EXCITING PROJECT? WRITE TO ME.',
  'wargames.contactSent': 'MESSAGE SENT.',
  'wargames.contactError': 'ERROR: message not sent.',
  'wargames.name': 'NAME',
  'wargames.submit': '> SEND',
  'wargames.sending': 'SENDING...',
  'wargames.statusDraw': 'DRAW.',
  'wargames.statusVisitorWins': 'VISITOR WINS!',
  'wargames.statusMarvinWins': 'MARVIN-42 WINS.',
  'wargames.statusYourTurn': 'YOUR MOVE.',
  'wargames.statusThinking': 'MARVIN-42 IS THINKING...',
};

export const ui: Record<Lang, Record<UiKey, string>> = { fr, en };

export function t(lang: Lang): Record<UiKey, string> {
  return ui[lang];
}
