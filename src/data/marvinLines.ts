/**
 * Répliques pré-écrites de Marvin-42 pour la bulle d'amorce du dock.
 *
 * Ces répliques ne passent pas par le LLM : elles sont instantanées, gratuites,
 * et laissent tout le quota Groq au chat interactif (les vraies questions).
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
      "Bienvenue ! Si vous souhaitez en savoir plus sur Martin, je peux vous guider.",
      "Vous voulez découvrir son parcours, ses projets ou ses compétences ? Je peux vous renseigner.",
      "Il y a pas mal de choses à découvrir ici. Si vous cherchez une information précise, demandez-moi.",
    ],
    projects: [
      "Voici quelques-unes des applications et solutions développées par Martin.",
      "Applications métier, intégrations, reprise d'existant... Vous pouvez parcourir ses réalisations.",
      "Chaque projet raconte une partie de son expérience. N'hésitez pas à me demander plus de détails.",
    ],
    blog: [
      "Bienvenue sur le blog. Vous y trouverez des réflexions autour du développement et de son expérience.",
      "Quelques articles pour découvrir sa façon de travailler et sa vision du développement.",
    ],
  },
  en: {
    home: [
      "Welcome! If you'd like to know more about Martin, I can show you around.",
      'Want to explore his background, projects or skills? I can help with that.',
      "There's quite a bit to discover here. If you're looking for something specific, just ask.",
    ],
    projects: [
      'Here are some of the applications and solutions Martin has built.',
      'Business apps, integrations, legacy takeovers... Feel free to browse his work.',
      'Each project tells part of his story. Ask me if you want more details.',
    ],
    blog: [
      "Welcome to the blog. You'll find thoughts on software development and his experience.",
      'A few articles to get a feel for how he works and how he sees development.',
    ],
  },
};

/** Variantes par section de la page d'accueil, indexées sur l'id du <section>. */
export const sectionLines: Record<Lang, Record<string, string[]>> = {
  fr: {
    apropos: [
      "Martin privilégie les solutions adaptées au métier plutôt que les technologies à la mode.",
      "Son parcours combine développement, infrastructure et support. Une expérience utile quand il faut penser à l'après-développement.",
      "Avant de se consacrer au développement, Martin a travaillé près de 20 ans dans l'infrastructure et le support.",
    ],
    competences: [
      "Web, mobile, backend, DevOps... Martin travaille avec plusieurs technologies selon les besoins du projet.",
      "Django, React, Flutter, Rust, Docker... La technologie est choisie en fonction du projet, pas l'inverse.",
      "Son expérience couvre aussi bien les stacks modernes que la reprise d'applications existantes.",
    ],
    confiance: [
      "Ces entreprises ont fait appel à Martin pour des projets utilisés en conditions réelles.",
      "Des projets concrets, des systèmes en production et des collaborations qui se poursuivent dans le temps.",
    ],
    temoignages: [
      "Quelques retours de personnes ayant travaillé directement avec Martin.",
      "Ces témoignages donnent un autre aperçu de sa façon de travailler.",
      "Au-delà de la technique, ses clients parlent aussi de sa capacité à comprendre leurs besoins.",
    ],
    parcours: [
      "Avant le développement, Martin a construit son expérience dans l'infrastructure et le support critique.",
      "De l'infrastructure au développement d'applications : un parcours qui lui permet de voir un projet dans son ensemble.",
      "Après près de 20 ans dans l'infrastructure, Martin s'est spécialisé dans le développement d'applications.",
    ],
    projets: [
      "Voici une sélection de projets réalisés par Martin.",
      "Applications métier, web, mobile et intégrations : découvrez quelques-unes de ses réalisations.",
    ],
  },
  en: {
    apropos: [
      'Martin favors solutions that fit the business over whatever technology is trending.',
      'His background combines development, infrastructure and support. Handy when you need to think about what happens after launch.',
      'Before focusing on development, Martin spent nearly 20 years in infrastructure and support.',
    ],
    competences: [
      'Web, mobile, backend, DevOps... Martin picks his tools based on what the project needs.',
      'Django, React, Flutter, Rust, Docker... The technology is chosen for the project, not the other way around.',
      'His experience covers modern stacks as well as taking over existing applications.',
    ],
    confiance: [
      'These companies brought Martin in for projects running in real-world conditions.',
      'Real projects, systems in production, and working relationships that last.',
    ],
    temoignages: [
      'A few words from people who worked directly with Martin.',
      'These testimonials give another view of how he works.',
      'Beyond the technical side, his clients also mention how well he understands their needs.',
    ],
    parcours: [
      'Before development, Martin built his experience in infrastructure and critical support.',
      'From infrastructure to application development: a path that lets him see a project as a whole.',
      'After nearly 20 years in infrastructure, Martin specialized in application development.',
    ],
    projets: [
      "Here's a selection of projects Martin has delivered.",
      'Business, web and mobile apps, integrations: take a look at some of his work.',
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
