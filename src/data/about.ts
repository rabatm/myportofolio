import type { Lang } from '../i18n/utils';

/**
 * Page À propos : l'approche de Martin et son parcours en trois temps forts
 * (pas une chronologie de CV). Chaque fait vient de `parcours.ts`, de
 * `temoignages.ts` ou de la spec ; rien d'autre. Marvin ne lit pas ce
 * fichier : les mêmes faits lui parviennent déjà par `parcours.ts`.
 */
export interface Approche {
  title: string;
  text: string;
}

export interface TempsFort {
  periode: string;
  title: string;
  text: string;
}

export const approche: Record<Lang, Approche[]> = {
  fr: [
    {
      title: 'Comprendre votre métier d’abord',
      text: 'Avant de parler technique, je cherche à comprendre comment vous travaillez et ce qui vous fait perdre du temps. Une application ne vaut que si elle est pensée pour et avec les personnes qui s’en servent.',
    },
    {
      title: 'Une expérience technique large',
      text: 'Applications web, applications mobiles, passerelles entre logiciels, automatisation : je choisis les outils en fonction de votre besoin, pas l’inverse.',
    },
    {
      title: 'À l’aise avec les systèmes complexes',
      text: 'Une quinzaine d’années à faire tourner des systèmes critiques et à diagnostiquer des pannes difficiles. Reprendre un logiciel existant ou le connecter à vos autres outils ne me fait pas peur.',
    },
    {
      title: 'Une relation directe',
      text: 'Pas d’intermédiaire : vous parlez à celui qui conçoit et développe votre outil, du premier échange à la mise en ligne.',
    },
    {
      title: 'De la conception à la mise en production',
      text: 'Je ne m’arrête pas au code : mise en production, guides utilisateurs, formation de vos équipes, puis les évolutions font partie du travail.',
    },
  ],
  en: [
    {
      title: 'Understanding your business first',
      text: 'Before talking tech, I try to understand how you work and what is costing you time. An application is only worth something if it is designed for, and with, the people who use it.',
    },
    {
      title: 'Broad technical experience',
      text: 'Web applications, mobile apps, bridges between software, automation: I pick the tools to fit your need, not the other way around.',
    },
    {
      title: 'Comfortable with complex systems',
      text: 'Some fifteen years keeping critical systems running and troubleshooting hard failures. Taking over existing software or connecting it to your other tools does not scare me.',
    },
    {
      title: 'A direct relationship',
      text: 'No middleman: you talk to the person who designs and builds your tool, from the first conversation to going live.',
    },
    {
      title: 'From design to production',
      text: 'I do not stop at the code: going live, user guides, training for your teams, then the updates are part of the job.',
    },
  ],
};

export const tempsForts: Record<Lang, TempsFort[]> = {
  fr: [
    {
      periode: '2006—2022',
      title: 'Une quinzaine d’années dans les systèmes critiques',
      text: 'Administration système et support jusqu’au niveau 3 pour de grandes organisations (Lafarge, Steria, Ministère de la Santé, LCL…) : sécurisation de systèmes sensibles, migrations à grande échelle, diagnostic de pannes complexes. J’y ai appris ce que coûte un outil qui tombe en panne.',
    },
    {
      periode: 'Depuis 2021',
      title: 'Indépendant, sous le nom Martin Info',
      text: 'Je conçois des solutions métier sur mesure : applications mobiles de terrain, portails web, reprise de logiciels existants, flux de données entre outils. Avec, à chaque fois, les guides utilisateurs et la formation des clients.',
    },
    {
      periode: 'Aujourd’hui',
      title: 'Formateur logiciel et étudiant à l’École 42 Perpignan',
      text: 'Je forme les dirigeants et employés de magasins à un logiciel de gestion commerciale pour Amopi. En parallèle, j’ai validé le tronc commun de l’École 42 Perpignan et j’y suis en spécialisation.',
    },
  ],
  en: [
    {
      periode: '2006—2022',
      title: 'Some fifteen years in critical systems',
      text: 'Systems administration and support up to level 3 for large organizations (Lafarge, Steria, the French Ministry of Health, LCL…): securing sensitive systems, large-scale migrations, troubleshooting complex failures. It taught me what a broken tool costs.',
    },
    {
      periode: 'Since 2021',
      title: 'Independent, as Martin Info',
      text: 'I design custom business solutions: field mobile apps, web portals, taking over existing software, data flows between tools. Each time with user guides and training for the client.',
    },
    {
      periode: 'Today',
      title: 'Software trainer and student at École 42 Perpignan',
      text: 'I train store owners and staff on a retail management software for Amopi. Alongside, I have completed the core curriculum of École 42 Perpignan (a peer-to-peer, project-based coding school) and I am now in its specialization track.',
    },
  ],
};
