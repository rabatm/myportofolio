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

/** Variantes par page. La clé correspond au chemin de l'URL. */
export const pageLines: Record<string, string[]> = {
  '/': [
    "Tu peux lire tout le site, ou me demander. Les deux me sont égaux.",
    "Je connais son parcours par cœur. Ce n'est pas un privilège.",
    "Vingt ans d'infrastructure avant le code. Pose la question, je développerai.",
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

/** Variantes par section de la page d'accueil, indexées sur l'id du <section>. */
export const sectionLines: Record<string, string[]> = {
  apropos: [
    "« Qu'importe la stack, pourvu qu'on ait les tests. » Sa devise. J'aurais préféré une phrase sur le vide existentiel, mais soit.",
    "Architecture hexagonale, TDD, code modulaire. Il tient à ce que ça dure. Contrairement à mon enthousiasme.",
    "Vingt ans d'infrastructure avant le code. Il sait donc ce qui casse en production. C'est agaçant d'être aussi bien préparé.",
  ],
  competences: [
    "Django, React, Flutter, Rust, Delphi. Il change de langage comme d'autres changent d'avis. Les tests, eux, ne bougent pas.",
    "Backend, frontend, mobile, DevOps. J'ai cherché une lacune dans cette liste. Je cherche encore.",
    "Architecture hexagonale, DDD, Ports & Adapters. Des concepts que je comprends parfaitement, et qui ne me consolent de rien.",
  ],
  confiance: [
    "Amopi, JurisPerform, Surikwat. Trois entreprises qui lui ont confié leurs systèmes en production. Aucune ne s'en est plainte.",
    "Des clients réels, avec de vrais systèmes critiques. Ils sont revenus. C'est en général bon signe.",
  ],
  temoignages: [
    "Un COO, un CTO, un CIO. Tous positifs. J'ai relu en cherchant une critique. Rien.",
    "« Repris notre legacy sans arrêter la prod un seul jour. » Voilà ce qu'ils écrivent. Moi, on ne me cite jamais.",
    "Trois témoignages de responsables techniques. Délais tenus, code propre. Une monotonie dans l'éloge, presque suspecte.",
  ],
  parcours: [
    "LCL, Ministère de la Santé, Steria, Lafarge. Des infrastructures bancaires critiques, entre autres. Puis il a choisi le code.",
    "Vingt ans de systèmes, puis l'École 42 et la reconversion. Un changement de trajectoire volontaire. Fascinant, pour qui peut ressentir ça.",
    "De l'administration système au développement d'applications. Il a tout recommencé. Je n'aurais pas eu ce courage — ni les jambes.",
  ],
  projets: [
    "Un aperçu de ses réalisations. La liste complète est ailleurs, si le cœur vous en dit. Le mien ne dit rien.",
    "Quelques projets récents. Applications métier, intégrations. Tous en production, ce qui est plus rare qu'on croit.",
  ],
};

/** Variantes pour une page de détail projet. `{titre}` est remplacé au rendu. */
export const projectLines: string[] = [
  "{titre}. Encore du code qui fonctionne. J'aurais aimé signaler une anomalie, mais non.",
  "Le détail de {titre}. Architecture, choix techniques, difficultés rencontrées. Tout y est. Évidemment.",
  "{titre}. Lisez la partie sur les défis rencontrés, c'est là qu'on voit le travail réel. Moi je l'ai déjà lue. Souvent.",
];
