import type { Lang } from '../i18n/utils';

export interface ParcoursEntry {
  periode: string;
  titre: string;
  entreprise: string;
  desc: string;
}

export const parcours: Record<Lang, ParcoursEntry[]> = {
  fr: [
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
      desc: 'Tronc commun validé : algorithmique et programmation système en C (Minishell, Philosophers), C++ et réseau (modules C++, webserv, NetPractice), raycasting (cub3D), Docker (Inception) et web temps réel (ft_transcendence). Actuellement en spécialisation, sur la Piscine Python for Data Science. Apprentissage approfondi de Rust en parallèle et participation à la Piscine Cyber.',
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
  ],
  en: [
    {
      periode: 'July—August 2026',
      titre: 'Tutor — École 42 Perpignan Piscine',
      entreprise: 'École 42 Perpignan',
      desc: "Supported candidates during the Piscine (42's month-long admission bootcamp): helping them get unstuck on bugs and compilation errors, encouraging a self-reliant method (search, test, debug on your own) without handing out solutions, tracking their progress and giving constructive feedback.",
    },
    {
      periode: '2025—2026',
      titre: 'Trainer — Retail management software (Shop & Co)',
      entreprise: 'AMOPI',
      desc: 'Two-day on-site training sessions for owners and staff of client stores: back office, purchasing/receiving/supplier returns, stock management and inventory counts, product records and advanced search, pricing, labels and customer management, sales statistics.',
    },
    {
      periode: 'Jan 2026—Jun 2026',
      titre: 'Backend & DevOps Developer',
      entreprise: 'AMOPI',
      desc: 'Hardened and migrated a critical data infrastructure: moved PHP gateways to Python, built Grafana/Prometheus dashboards for real-time monitoring of multi-store stock flows, set up Jenkins pipelines and Docker pre-production environments.',
    },
    {
      periode: '2021—2026',
      titre: 'Freelance Full-Stack Developer & Consultant',
      entreprise: 'Freelance',
      desc: 'Designing custom business solutions: migrating a legacy Django codebase to a hexagonal architecture, field mobile apps (Flutter, Zebra scanners), React/Django web portals, ETL pipelines. Writing user guides and training clients.',
    },
    {
      periode: '2023—2026',
      titre: 'École 42 Perpignan',
      entreprise: '',
      desc: 'Core curriculum completed: algorithms and systems programming in C (Minishell, Philosophers), C++ and networking (C++ modules, webserv, NetPractice), raycasting (cub3D), Docker (Inception) and real-time web (ft_transcendence). Currently in the specialization track, working through the Python for Data Science Piscine. Learning Rust in depth on the side, and took part in the Cyber Piscine.',
    },
    {
      periode: '2006—2022',
      titre: 'IT Support & Systems Administration',
      entreprise: 'Lafarge, Steria, Ministère de la Santé, LCL, AMOPI',
      desc: 'Systems administration and support, from day-to-day operations up to level 3 support: securing sensitive systems, automation scripting (PowerShell/Bash) and large-scale migrations (Active Directory, MS Exchange), industrializing deployments, network administration, troubleshooting complex failures.',
    },
    {
      periode: '2000',
      titre: 'BTS in Business Computing (2-year technical degree)',
      entreprise: 'Lycée Jean Lurçat, Perpignan',
      desc: 'Software development track.',
    },
  ],
};
