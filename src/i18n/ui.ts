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
    "Développeur concepteur d'applications web, mobile et DevOps. Architecture hexagonale, TDD, Django, React, Flutter. Basé à Perpignan, disponible en full remote.",
  'layout.footer': '© 2026 Martin Info — Portfolio rétro 90s',
  'layout.lightboxClose': 'Fermer',

  'nav.home': 'Accueil',
  'nav.projects': 'Projets',
  'nav.parcours': 'Parcours',
  'nav.partners': 'Partenaires',
  'nav.blog': 'Blog',
  'nav.contact': 'Contact',
  'nav.switchAria': 'Lire cette page en anglais',
  'nav.otherLangName': 'English',
  'nav.menuOpen': 'Ouvrir le menu',
  'nav.menuClose': 'Fermer le menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'Ce site existe aussi en français.',
  'suggest.action': 'Voir en français',
  'suggest.dismiss': 'Fermer',

  'content.onlyIn': '🇬🇧 En anglais uniquement',

  'hero.badge': "Développeur concepteur d'applications — Web, mobile & DevOps",
  'hero.tagline': "Je crée des applications qui s'adaptent à votre métier.",
  'hero.sub':
    'Applications web et mobiles sur mesure, conçues pour répondre à vos besoins réels et accompagner votre activité dans la durée.',
  'hero.location': 'Basé à Perpignan, disponible en full remote',
  'hero.ctaProjects': 'Voir les projets',
  'hero.ctaContact': 'Discutons de votre besoin',

  'about.title': 'À propos',
  'about.quote': '« Des outils au service de votre activité. »',
  'about.p1':
    "Je crée des applications sur mesure pour les entreprises : simples à utiliser, fiables au quotidien et capables d'évoluer avec vous. Nouveau projet ou outil existant à améliorer et à connecter à vos autres logiciels, c'est souvent là que tout se joue.",
  'about.p2':
    "Avant de devenir développeur, j'ai passé près de 20 ans à maintenir des systèmes informatiques critiques et à former des équipes à leurs outils. J'en ai retenu l'essentiel : une application ne vaut que si elle est pensée pour et avec ses utilisateurs.",
  'about.p3':
    "Aujourd'hui en spécialisation à l'École 42 Perpignan, je développe des applications web et mobiles.",

  'skills.title': 'Compétences',
  'skills.subtitle': "« Qu'importe la stack, pourvu qu'on ait les tests. »",

  'trust.title': 'Ils me font confiance',
  'trust.subtitle': "Des entreprises qui m'ont confié leurs systèmes en production.",

  'testimonials.title': 'Témoignages',
  'testimonials.prev': 'Précédent',
  'testimonials.next': 'Suivant',
  'testimonials.more': 'Lire la suite',
  'testimonials.less': 'Voir moins',
  'testimonials.moreAria': 'Voir plus',
  'testimonials.translated': '',

  'parcours.title': 'Parcours',
  'parcours.subtitle': "20 ans d'infrastructure, puis le code.",

  'projectsPreview.title': 'Projets récents',
  'projectsPreview.subtitle': 'Applications métier, intégrations et reprises de legacy.',
  'projectsPreview.all': 'Voir tous les projets',

  'home.title': "Martin Rabat — Développeur concepteur d'applications",
  'home.description':
    'Développeur fullstack & DevOps indépendant : applications métier, intégration de systèmes et reprise de legacy. Django, React, Flutter, Docker. 20 ans d\'infrastructure derrière moi. Perpignan, full remote.',

  'projects.title': 'Projets — Martin Rabat, développeur fullstack',
  'projects.description':
    'Applications métier, intégrations entre systèmes et reprises de legacy : ERP retail, backoffice de franchises, applications mobiles terrain, passerelles de synchronisation et infrastructure Docker.',
  'projects.heading': 'Projets',
  'project.back': '< Retour aux projets',
  'project.visit': 'Voir le projet',

  'blog.title': 'Blog — Martin Rabat, développeur fullstack',
  'blog.description':
    "Articles et retours d'expérience de Martin Rabat sur le développement web, mobile et l'architecture logicielle.",
  'blog.heading': 'Blog',
  'post.titleSuffix': '— Blog de Martin Rabat',
  'post.back': '< Retour au blog',

  'contact.title': 'Contact — Martin Rabat, développeur fullstack',
  'contact.description':
    'Un projet, un poste à pourvoir, une question ? Martin Rabat, développeur fullstack & DevOps à Perpignan, disponible en full remote. Réponse sous 24h.',
  'contact.heading': 'Contact',
  'contact.intro': 'Un projet, un poste à pourvoir, une question ? Je réponds sous 24h.',
  'contact.command': '$ ./envoyer-message',
  'contact.name': '$ nom:',
  'contact.email': '$ email:',
  'contact.message': '$ message:',
  'contact.submit': '[ ENVOYER > ]',
  'contact.sending': '[ ENVOI... ]',
  'contact.success': '> Message transmis. Réponse sous 24h.',
  'contact.error': '> ERREUR : envoi impossible. Écris-moi directement à martin.rabat@gmail.com',

  'marvin.greeting':
    'Bonjour ! Je peux vous présenter le parcours de Martin, ses projets et ses compétences. N’hésitez pas à me poser votre question',
  'marvin.longSession': 'SESSION LONGUE DÉTECTÉE. MÉMOIRE À COURT TERME UNIQUEMENT.',
  'marvin.connectionLost': 'connexion perdue',
  'marvin.retry': 'Réessayer',
  'marvin.placeholder': 'Écris un message…',
  'marvin.inputAria': 'Votre message pour MARVIN-42',
  'marvin.send': 'Envoyer le message',
  'marvin.closeChat': 'Fermer la conversation',
  'marvin.pillOpen': 'Ouvrir le chat MARVIN-42',
  'marvin.pillClose': 'Fermer le chat MARVIN-42',
  'marvin.pillLong': 'Parler à MARVIN-42',

  'chat.rateLimit':
    'Le service est momentanément indisponible en raison d’un nombre élevé de demandes. Merci de réessayer dans quelques instants.',
  'chat.error': 'ERREUR: connexion au serveur perdue. Réessaie plus tard.',

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
    'Application developer for web, mobile and DevOps. Hexagonal architecture, TDD, Django, React, Flutter. Based in Perpignan, France, available for fully remote work.',
  'layout.footer': '© 2026 Martin Info — 90s retro portfolio',
  'layout.lightboxClose': 'Close',

  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.parcours': 'Experience',
  'nav.partners': 'Clients',
  'nav.blog': 'Blog',
  'nav.contact': 'Contact',
  'nav.switchAria': 'Read this page in French',
  'nav.otherLangName': 'Français',
  'nav.menuOpen': 'Open menu',
  'nav.menuClose': 'Close menu',
  'nav.menuLabel': 'Navigation',

  'suggest.text': 'This site is also available in English.',
  'suggest.action': 'View in English',
  'suggest.dismiss': 'Dismiss',

  'content.onlyIn': '🇫🇷 French only',

  'hero.badge': 'Application Developer — Web, Mobile & DevOps',
  'hero.tagline': 'I build applications that fit the way your business works.',
  'hero.sub':
    'Custom web and mobile applications, designed around your real needs and built to support your business for the long run.',
  'hero.location': 'Based in Perpignan, France — available for fully remote work',
  'hero.ctaProjects': 'See my projects',
  'hero.ctaContact': "Let's talk about your project",

  'about.title': 'About',
  'about.quote': '“Tools that work for your business.”',
  'about.p1':
    "I build custom applications for businesses: easy to use, reliable day to day, and able to grow with you. Whether it's a new project or an existing tool that needs improving and connecting to your other software, that's often where it all happens.",
  'about.p2':
    "Before becoming a developer, I spent nearly 20 years maintaining critical IT systems and training teams on their tools. The lesson I kept: an application is only worth something if it's designed for, and with, the people who use it.",
  'about.p3':
    'Currently in the specialization track at École 42 Perpignan (a peer-to-peer, project-based coding school), I build web and mobile applications.',

  'skills.title': 'Skills',
  'skills.subtitle': '“Never mind the stack, as long as there are tests.”',

  'trust.title': 'Trusted by',
  'trust.subtitle': 'Companies that have trusted me with their production systems.',

  'testimonials.title': 'Testimonials',
  'testimonials.prev': 'Previous',
  'testimonials.next': 'Next',
  'testimonials.more': 'Read more',
  'testimonials.less': 'Show less',
  'testimonials.moreAria': 'Show more',
  'testimonials.translated': 'Translated from French',

  'parcours.title': 'Experience',
  'parcours.subtitle': '20 years of infrastructure, then code.',

  'projectsPreview.title': 'Recent projects',
  'projectsPreview.subtitle': 'Business applications, integrations and legacy takeovers.',
  'projectsPreview.all': 'See all projects',

  'home.title': 'Martin Rabat — Application Developer',
  'home.description':
    'Independent full-stack & DevOps developer: business applications, systems integration and legacy takeovers. Django, React, Flutter, Docker. 20 years of infrastructure experience. Based in Perpignan, France, fully remote.',

  'projects.title': 'Projects — Martin Rabat, full-stack developer',
  'projects.description':
    'Business applications, system integrations and legacy takeovers: retail ERP, franchise back offices, field mobile apps, synchronization gateways and Docker infrastructure.',
  'projects.heading': 'Projects',
  'project.back': '< Back to projects',
  'project.visit': 'View project',

  'blog.title': 'Blog — Martin Rabat, full-stack developer',
  'blog.description':
    'Articles and lessons learned by Martin Rabat on web and mobile development and software architecture.',
  'blog.heading': 'Blog',
  'post.titleSuffix': "— Martin Rabat's blog",
  'post.back': '< Back to blog',

  'contact.title': 'Contact — Martin Rabat, full-stack developer',
  'contact.description':
    'A project, a job opening, a question? Martin Rabat, full-stack & DevOps developer based in Perpignan, France, available for fully remote work. Reply within 24 hours.',
  'contact.heading': 'Contact',
  'contact.intro': 'A project, a job opening, a question? I reply within 24 hours.',
  'contact.command': '$ ./send-message',
  'contact.name': '$ name:',
  'contact.email': '$ email:',
  'contact.message': '$ message:',
  'contact.submit': '[ SEND > ]',
  'contact.sending': '[ SENDING... ]',
  'contact.success': "> Message sent. I'll reply within 24 hours.",
  'contact.error': "> ERROR: couldn't send your message. Email me directly at martin.rabat@gmail.com",

  'marvin.greeting':
    "Hello! I can walk you through Martin's background, projects and skills. Feel free to ask me anything.",
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
