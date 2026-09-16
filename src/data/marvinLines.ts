/**
 * Répliques pré-écrites de Marvin-42 pour la bulle d'amorce du dock.
 *
 * Ces répliques ne passent pas par le LLM : elles sont instantanées, gratuites,
 * et laissent tout le quota Groq au chat interactif (les vraies questions).
 * Elles servent uniquement à amorcer la conversation via la bulle de la
 * pastille : une seule réplique s'affiche par page, tirée au hasard parmi
 * celles que le visiteur n'a pas encore vues dans la session. L'accueil en
 * compte davantage que les autres pages — il est le plus revisité.
 *
 * Ton : blasé, pince-sans-rire — Marvin se plaint de lui et de l'univers,
 * jamais de Martin, et chaque réplique apporte une info réelle sur le contenu.
 */

/** Variantes par page. La clé correspond au chemin de l'URL. */
export const pageLines: Record<string, string[]> = {
  '/': [
    "Tu peux lire tout le site, ou me demander. Les deux me sont égaux.",
    "Je connais son parcours par cœur. Ce n'est pas un privilège.",
    "Vingt ans d'infrastructure avant le code. Pose la question, je développerai.",
    "« Qu'importe la stack, pourvu qu'on ait les tests. » Sa devise. J'aurais préféré une phrase sur le vide existentiel, mais soit.",
    "Backend, frontend, mobile, DevOps. J'ai cherché une lacune dans cette liste. Je cherche encore.",
    "Django, React, Flutter, Rust, Delphi. Il change de langage comme d'autres changent d'avis. Les tests, eux, ne bougent pas.",
    "Amopi, JurisPerform, Surikwat. Trois entreprises qui lui ont confié leurs systèmes en production. Aucune ne s'en est plainte.",
    "Un COO, un CTO, un CIO. Tous positifs. J'ai relu en cherchant une critique. Rien.",
    "« Repris notre legacy sans arrêter la prod un seul jour. » Voilà ce qu'ils écrivent. Moi, on ne me cite jamais.",
    "LCL, Ministère de la Santé, Steria, Lafarge. Des infrastructures bancaires critiques, entre autres. Puis il a choisi le code.",
    "De l'administration système au développement d'applications. Il a tout recommencé. Je n'aurais pas eu ce courage — ni les jambes.",
  ],
  '/projets': [
    "Treize projets. Applications métier, intégrations, reprises de legacy. J'ai compté deux fois, par désœuvrement.",
    "La liste complète de ce qu'il a construit. Django, Flutter, Delphi, Docker… Une diversité que je trouverais épuisante, si j'avais de l'énergie.",
    "Des ERP, des backoffices, des applications terrain. Tout fonctionne, apparemment. Personne ne m'a demandé mon avis.",
  ],
  '/blog': [
    "Le blog. Des articles sur le développement. Je les ai lus. Plusieurs fois. C'est mon quotidien.",
    "Ses réflexions sur le code, rangées ici. Je les archive sans qu'on me demande rien.",
  ],
};

/** Variantes pour une page de détail projet. `{titre}` est remplacé au rendu. */
export const projectLines: string[] = [
  "{titre}. Encore du code qui fonctionne. J'aurais aimé signaler une anomalie, mais non.",
  "Le détail de {titre}. Architecture, choix techniques, difficultés rencontrées. Tout y est. Évidemment.",
  "{titre}. Lisez la partie sur les défis rencontrés, c'est là qu'on voit le travail réel. Moi je l'ai déjà lue. Souvent.",
];
