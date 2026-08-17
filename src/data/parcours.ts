export interface ParcoursEntry {
  periode: string;
  titre: string;
  entreprise: string;
  desc: string;
}

export const parcours: ParcoursEntry[] = [
  {
    periode: '2026',
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
    periode: '2015—2023',
    titre: 'Administrateur systèmes',
    entreprise: 'LCL',
    desc: "Administration système et fiabilisation d'infrastructures bancaires critiques. Support niveau 3 et diagnostic de pannes complexes.",
  },
  {
    periode: '2008—2015',
    titre: 'Administrateur systèmes',
    entreprise: 'Ministère de la Santé',
    desc: "Exploitation et sécurisation de systèmes d'information sensibles. Scripting avancé (PowerShell/Bash) pour l'automatisation et les migrations massives (Active Directory, MS Exchange).",
  },
  {
    periode: '2000—2008',
    titre: 'Ingénieur systèmes',
    entreprise: 'Steria',
    desc: 'Infrastructure et support pour de grands comptes en environnement multi-clients. Industrialisation des déploiements (masters, WDS/MDT) et administration réseau (routeurs, NAT, pare-feu).',
  },
  {
    periode: '1996—2000',
    titre: 'Administrateur systèmes',
    entreprise: 'Lafarge',
    desc: "Débuts en infrastructure : premiers pas dans l'exploitation et l'administration système.",
  },
  {
    periode: '2000',
    titre: 'BTS Informatique de Gestion',
    entreprise: 'Lycée Jean Lurçat, Perpignan',
    desc: "Option développement d'applications.",
  },
];
