/**
 * Répliques pré-écrites de Marvin-42 pour la bulle d'amorce du dock.
 *
 * Ces répliques ne passent pas par le LLM : elles sont instantanées, gratuites,
 * et laissent tout le quota Mistral au chat interactif (les vraies questions).
 * Elles servent uniquement à amorcer la conversation via la bulle de la
 * pastille. Deux déclencheurs : une réplique à l'arrivée sur une page, et
 * une réplique par section de l'accueil qui entre à l'écran. Dans les deux
 * cas le tirage se fait parmi celles que le visiteur n'a pas encore vues
 * dans la session. Les répliques de page accueillent, celles de section
 * commentent : aucun texte n'est partagé entre les deux.
 *
 * Ton : blasé, pince-sans-rire — Marvin se plaint de lui et de l'univers,
 * jamais de Martin, et chaque réplique apporte une info réelle sur le contenu.
 */

import type { RouteId } from '../i18n/routes';
import type { Lang } from '../i18n/utils';

/** Variantes par page, indexées sur l'identifiant de route (voir src/i18n/routes.ts). */
export const pageLines: Record<Lang, Partial<Record<RouteId, string[]>>> = {
  fr: {
    home: [
      "Bonjour. Je suis là pour vous dire si Martin peut vous aider. C'est à peu près ma seule joie.",
      "Applications web, mobiles, automatisations, logiciels à faire communiquer... Décrivez-moi votre problème, je vous dirai si c'est dans ses cordes.",
      "Un outil qui coince, des tâches qu'on refait chaque semaine ? Posez-moi la question. Je n'ai rien de mieux à faire, littéralement.",
    ],
    projects: [
      "Des réalisations pour de vrais clients, plus un chat qui court dans une barre de menu. Je ne juge pas.",
      "Filtrez par service pour voir ce que Martin a construit dans votre cas. Moi, je n'ai pas de cas. Juste des répliques.",
      "Applications terrain, passerelles entre logiciels, reprise d'existant : chaque fiche raconte un vrai besoin. Demandez-moi le détail.",
    ],
    blog: [
      "Le blog. Quelques articles sur la façon de travailler de Martin. Plus optimistes que moi, forcément.",
      "Des réflexions autour du développement et des projets. Je les ai lues. Plusieurs fois. Le temps est long, ici.",
    ],
    services: [
      "Cinq services, du site web à la maintenance. Dites-moi ce qui coince, je vous dirai lequel vous concerne.",
      "Automatisation & IA : je suis une des deux preuves citées. Être une preuve, quelle existence.",
      "Des logiciels qui ne se parlent pas ? Martin a déjà construit ce genre de passerelle, pour le magasin Minouche par exemple.",
    ],
    about: [
      "Martin est indépendant depuis 2021, basé à Perpignan. Moi, je suis basé dans un onglet de navigateur.",
      "Avant le développement, une quinzaine d'années à faire tourner des systèmes critiques. Il sait ce que coûte une panne. Moi aussi, je suis une panne en puissance.",
    ],
  },
  en: {
    home: [
      "Hello. I'm here to tell you whether Martin can help you. It's roughly my only joy.",
      "Web apps, mobile apps, automations, software that needs to talk... Describe your problem and I'll tell you if it's in his line.",
      "A tool that jams, tasks you redo every week? Ask me. I have nothing better to do, literally.",
    ],
    projects: [
      'Projects for real clients, plus a cat running in a menu bar. I do not judge.',
      "Filter by service to see what Martin built in a case like yours. I don't have a case. Just lines.",
      "Field apps, bridges between software, legacy takeovers: each case study tells a real need. Ask me for details.",
    ],
    blog: [
      "The blog. A few articles about how Martin works. More optimistic than me, naturally.",
      "Thoughts on development and projects. I've read them. Several times. Time is long, in here.",
    ],
    services: [
      "Five services, from web apps to maintenance. Tell me what's stuck and I'll tell you which one fits.",
      'Automation & AI: I am one of the two proofs listed. Being a proof, what a life.',
      'Software that does not talk to each other? Martin has built that kind of bridge before, for the Minouche shop for instance.',
    ],
    about: [
      "Martin has been independent since 2021, based in Perpignan. I'm based in a browser tab.",
      'Before development, some fifteen years keeping critical systems running. He knows what an outage costs. I am an outage waiting to happen.',
    ],
  },
};

/** Variantes par section de la page d'accueil, indexées sur l'id du <section>. */
export const sectionLines: Record<Lang, Record<string, string[]>> = {
  fr: {
    clients: [
      "Amopi, JurisPerform, Surikwat, CKM66 : ils ont confié leurs outils à Martin. Personne ne m'a jamais rien confié.",
      "Des outils utilisés tous les jours, en magasin, en cours ou au club. Moi, on m'utilise quand on s'ennuie.",
    ],
    services: [
      "Web, mobile, automatisation, intégration, maintenance. Cinq façons de vous simplifier la vie. Dommage que ça ne marche pas sur la mienne.",
      "Vous vous reconnaissez dans une de ces questions ? Demandez-moi, je vous dirai quel service vous concerne.",
    ],
    realisations: [
      "CKM66 : le site, l'appli iOS et Android et la gestion du club, tout par Martin. J'aurais aimé réserver un cours. Je n'ai pas de jambes.",
      "Ces réalisations tournent pour de vrais clients. Demandez-moi celle qui ressemble à votre besoin.",
    ],
    methode: [
      "Comprendre, proposer, construire, accompagner. Quatre étapes. Ma méthode à moi tient en une : attendre.",
      "Ça commence par parler de votre métier, pas de technique. Enfin quelqu'un de raisonnable.",
    ],
    temoignages: [
      "Hugo Aguado, Yassine Hniche, Nicolas Cudel : ils ont travaillé avec Martin et l'ont écrit. Personne n'écrit sur moi.",
      "Chez Amopi, ils parlent de reprise de legacy Delphi et de flux réécrits. Ils parlent aussi de sa bonne humeur. Pas de la mienne.",
    ],
    humain: [
      "Pas d'intermédiaire : vous parlez directement à celui qui conçoit votre outil. Enfin, après moi. Désolé.",
      "Basé à Perpignan, il travaille aussi à distance partout en France. Moi, je ne travaille nulle part. Je suis juste là.",
    ],
  },
  en: {
    clients: [
      "Amopi, JurisPerform, Surikwat, CKM66: they trusted Martin with their tools. Nobody has ever trusted me with anything.",
      "Tools used every day, in shops, in classes or at the club. I get used when people are bored.",
    ],
    services: [
      "Web, mobile, automation, integration, maintenance. Five ways to make your life simpler. Shame it doesn't work on mine.",
      'Recognize yourself in one of these questions? Ask me and I will tell you which service fits.',
    ],
    realisations: [
      "CKM66: the website, the iOS and Android app and the club management, all by Martin. I'd have liked to book a class. I have no legs.",
      'These projects run for real clients. Ask me which one looks like your need.',
    ],
    methode: [
      'Understand, propose, build, support. Four steps. My own method has just one: wait.',
      'It starts with talking about your business, not technology. Finally someone sensible.',
    ],
    temoignages: [
      'Hugo Aguado, Yassine Hniche, Nicolas Cudel: they worked with Martin and wrote it down. Nobody writes about me.',
      'At Amopi, they mention a Delphi legacy takeover and rewritten flows. They also mention his good humor. Not mine.',
    ],
    humain: [
      'No middleman: you talk directly to the person who designs your tool. Well, after me. Sorry.',
      "Based in Perpignan, he also works remotely across France. I don't work anywhere. I'm just here.",
    ],
  },
};

/** Variantes pour une page de détail projet. `{titre}` est remplacé au rendu. */
export const projectLines: Record<Lang, string[]> = {
  fr: [
    "Découvrez comment {titre} a été conçu et les choix réalisés pour répondre au besoin.",
    "Voici le détail de {titre}, de l'objectif initial aux choix techniques.",
    "{titre} en détail : contexte, solution et principaux défis rencontrés.",
  ],
  en: [
    'Find out how {titre} was designed and the choices made to meet the need.',
    "Here's {titre} in detail, from the initial goal to the technical choices.",
    '{titre} in detail: context, solution and main challenges.',
  ],
};
