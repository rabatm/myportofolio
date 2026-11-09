import type { Lang } from '../i18n/utils';

export interface FormationModule {
  title: string;
  text: string;
}

/**
 * Offre de formation (section de la page Services, aussi lue par Marvin).
 * Source de la preuve : parcours.ts (formateur AMOPI, guides utilisateurs).
 * Pas de durée, de tarif ni de certification annoncés : rien n'est décidé.
 */
export interface Formation {
  name: string;
  hook: string;
  need: string;
  modules: FormationModule[];
  benefit: string;
  proof: string;
  cta: string;
}

export const formation: Record<Lang, Formation> = {
  fr: {
    name: 'Formation',
    hook: 'Vos équipes veulent utiliser l’IA, sans savoir par où commencer ?',
    need: 'Un bon outil ne sert à rien si personne ne sait s’en servir. Je forme vos équipes sur leurs vraies tâches et leurs vrais documents, pas sur des exemples de démonstration.',
    modules: [
      {
        title: 'Prendre en main l’IA au quotidien',
        text: 'Ce qu’un assistant IA sait faire, et ce qu’il ne sait pas faire. Comment lui confier la rédaction, le résumé, le tri de documents ou l’extraction d’informations, relire ses réponses et protéger les données de l’entreprise.',
      },
      {
        title: 'Optimiser votre façon de travailler (workflow)',
        text: 'On regarde comment l’information circule chez vous : ressaisies, tâches répétées, outils qui ne se parlent pas. On simplifie ce qui peut l’être et on repère ce qui mérite d’être automatisé. Vous repartez avec des changements concrets à mettre en place.',
      },
    ],
    benefit:
      'Des équipes plus autonomes avec l’IA, et une idée claire des automatisations qui valent la peine avant d’investir.',
    proof:
      'J’ai formé des dirigeants et des employés de magasins clients d’AMOPI à leur logiciel de gestion, lors de formations de deux jours en entreprise. Je rédige aussi les guides utilisateurs de mes projets et je forme mes clients à leurs outils.',
    cta: 'Parler d’une formation',
  },
  en: {
    name: 'Training',
    hook: 'Your team wants to use AI but doesn’t know where to start?',
    need: 'A good tool is useless if nobody knows how to use it. I train your team on their real tasks and their real documents, not on demo examples.',
    modules: [
      {
        title: 'Getting started with AI day to day',
        text: 'What an AI assistant can do, and what it can’t. How to hand it writing, summaries, document sorting or information extraction, how to check its answers, and how to protect your company’s data.',
      },
      {
        title: 'Streamlining the way you work (workflow)',
        text: 'We look at how information flows through your business: re-keying, repeated tasks, tools that don’t talk to each other. We simplify what can be simplified and spot what is worth automating. You leave with concrete changes to put in place.',
      },
    ],
    benefit:
      'Teams that are more independent with AI, and a clear idea of which automations are worth it before you invest.',
    proof:
      'I have trained business owners and employees of AMOPI client stores on their management software, in two-day in-company sessions. I also write the user guides for my projects and train my clients on their tools.',
    cta: 'Talk about training',
  },
};
