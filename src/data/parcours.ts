export interface ParcoursEntry {
  periode: string;
  titre: string;
  entreprise: string;
  desc: string;
}

export const parcours: ParcoursEntry[] = [
  {
    periode: 'Juillet—Août 2026',
    titre: 'Tuteur — Piscine École 42 Perpignan',
    entreprise: 'École 42 Perpignan',
    desc: "Accompagnement des candidats de la Piscine (test d'admission) : aide au déblocage sur les bugs et erreurs de compilation, encouragement à la méthode (chercher, tester, déboguer soi-même) sans donner la solution, suivi de la progression et retours constructifs.",
  },
  {
    periode: '2025—2026',
    titre: 'Formateur logiciel de gestion commerciale (Shop & Co)',
    entreprise: 'AMOPI',
    desc: "Formations intra-entreprise (2 jours) pour les dirigeants et employés de magasins clients : back-office, achats/réceptions/retours fournisseurs, gestion des stocks et inventaires, fiches produits et recherche avancée, gestion des prix, étiquettes et gestion clients, statistiques de vente.",
  },
  {
    periode: '01/2026—06/2026',
    titre: 'Développeur backend & DevOps',
    entreprise: 'AMOPI',
    desc: "Fiabilisation et migration d'une infrastructure de données critique : migration de passerelles PHP vers Python, dashboards Grafana/Prometheus pour le monitoring temps réel des flux de stocks multi-magasins, pipelines Jenkins et environnements Docker de pré-production.",
  },
  {
    periode: '2021—2026',
    titre: 'Développeur fullstack & consultant indépendant',
    entreprise: 'Freelance',
    desc: 'Conception de solutions métier sur mesure : reprise de legacy Django vers une architecture hexagonale, applications mobiles terrain (Flutter, scanners Zebra), portails web React/Django, pipelines ETL. Rédaction des guides utilisateurs et formation des clients.',
  },
  {
    periode: '2023—2026',
    titre: 'École 42 Perpignan',
    entreprise: '',
    desc: 'Tronc commun validé, actuellement en spécialisation. Algorithmique en C, gestion bas niveau (mémoire, threads) : Minishell, Philosophers. Apprentissage approfondi de Rust en parallèle et participation à la Piscine Cyber.',
  },
  {
    periode: '2006—2022',
    titre: 'Support et administration système',
    entreprise: 'Lafarge, Steria, Ministère de la Santé, LCL, AMOPI',
    desc: "Administration systèmes et support, de l'exploitation quotidienne jusqu'au support niveau 3 : sécurisation de systèmes sensibles, scripting d'automatisation (PowerShell/Bash) et migrations massives (Active Directory, MS Exchange), industrialisation des déploiements et administration réseau, diagnostic de pannes complexes.",
  },
  {
    periode: '2000',
    titre: 'BTS Informatique de Gestion',
    entreprise: 'Lycée Jean Lurçat, Perpignan',
    desc: "Option développement d'applications.",
  },
];
