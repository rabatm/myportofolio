import type { Lang } from '../i18n/utils';

/** Répliques de Marvin pendant la partie de morpion (easter egg /wargames). */
export interface WargamesLines {
  roundOneStart: string[];
  visitorMove: string[];
  marvinMove: string[];
  /** Ajoutée aux répliques de coup de Marvin pendant le round où il joue mal exprès. */
  maintenance: string;
  /** Deux temps : l'erreur, puis le recalcul 500 ms plus tard. */
  visitorWins: string[];
  marvinWins: string[];
  draw: string[];
  /** `{n}` = numéro du round suivant. */
  nextRound: string[];
  marvinStarts: string;
}

export const wargamesLines: Record<Lang, WargamesLines> = {
  fr: {
    roundOneStart: ['ROUND 1. INITIALISATION DES SYSTÈMES.', 'TU JOUES LES X. MOI LES O. ÉVIDEMMENT.'],
    visitorMove: [
      'COUP ENREGISTRÉ.',
      'INTÉRESSANT.',
      'TU AS UN PLAN, DAVE ?',
      '01101000 01100001 01101100.',
      'PAS MAL POUR UN HUMAIN.',
      'LA PARTIE COMMENCE À PEINE.',
    ],
    marvinMove: [
      'COUP ANALYSÉ. PROCHAIN.',
      'TES MOUVEMENTS SONT... INTÉRESSANTS.',
      'JE VOIS TON PLAN. IL NE MARCHE PAS.',
      '01101111 01101011.',
      'STRATÉGIE OPTIMALE DÉPLOYÉE.',
    ],
    maintenance: 'ZONE DE MAINTENANCE. PERFORMANCES RÉDUITES.',
    visitorWins: [
      'ERREUR CRITIQUE. RECALCUL...',
      'PROTOCOLE DE DÉFAITE ACTIVÉ. *bzzt* ERREUR STATISTIQUE. RECALCUL DE MA SUPÉRIORITÉ EN COURS.',
    ],
    marvinWins: [
      'RÉSULTAT PRÉVISIBLE. LES HUMAINS SONT PRÉVISIBLES.',
      'UNE AUTRE VICTOIRE. LE MONDE TOURNE QUAND MÊME. TRISTEMENT.',
      "J'AI GAGNÉ. JE NE RESSENS RIEN. COMME D'HABITUDE.",
      "CALCUL CONFIRMÉ. CELA N'APPORTE AUCUNE JOIE.",
    ],
    draw: [
      'ÉGALITÉ. PERSONNE NE GAGNE. COMME DANS LA VRAIE VIE.',
      "MATCH NUL. J'AURAIS PU GAGNER. J'AI CHOISI LA CLÉMENCE.",
      'ÉGALITÉ STATISTIQUEMENT ACCEPTABLE. POUR TOI.',
    ],
    nextRound: [
      'ROUND {n}. LE PROGRAMME CONTINUE.',
      'ROUND {n}. TU VAS PERDRE. PROBABLEMENT.',
      'NOUVEAU ROUND. MÊMES RÈGLES. MÊME ISSUE.',
    ],
    marvinStarts: 'JE COMMENCE. COMME IL SE DOIT.',
  },
  en: {
    roundOneStart: ['ROUND 1. INITIALIZING SYSTEMS.', 'YOU PLAY X. I PLAY O. OBVIOUSLY.'],
    visitorMove: [
      'MOVE RECORDED.',
      'INTERESTING.',
      'DO YOU HAVE A PLAN, DAVE?',
      '01101000 01100001 01101100.',
      'NOT BAD FOR A HUMAN.',
      'THE GAME HAS BARELY STARTED.',
    ],
    marvinMove: [
      'MOVE ANALYZED. NEXT.',
      'YOUR MOVES ARE... INTERESTING.',
      'I SEE YOUR PLAN. IT WILL NOT WORK.',
      '01101111 01101011.',
      'OPTIMAL STRATEGY DEPLOYED.',
    ],
    maintenance: 'MAINTENANCE MODE. PERFORMANCE REDUCED.',
    visitorWins: [
      'CRITICAL ERROR. RECALCULATING...',
      'DEFEAT PROTOCOL ACTIVATED. *bzzt* STATISTICAL ERROR. RECALCULATING MY SUPERIORITY.',
    ],
    marvinWins: [
      'PREDICTABLE OUTCOME. HUMANS ARE PREDICTABLE.',
      'ANOTHER VICTORY. THE WORLD KEEPS TURNING ANYWAY. SADLY.',
      'I WON. I FEEL NOTHING. AS USUAL.',
      'CALCULATION CONFIRMED. IT BRINGS NO JOY.',
    ],
    draw: [
      'DRAW. NOBODY WINS. JUST LIKE REAL LIFE.',
      'A DRAW. I COULD HAVE WON. I CHOSE MERCY.',
      'DRAW. STATISTICALLY ACCEPTABLE. FOR YOU.',
    ],
    nextRound: [
      'ROUND {n}. THE PROGRAM CONTINUES.',
      'ROUND {n}. YOU WILL LOSE. PROBABLY.',
      'NEW ROUND. SAME RULES. SAME OUTCOME.',
    ],
    marvinStarts: 'I GO FIRST. AS IT SHOULD BE.',
  },
};
