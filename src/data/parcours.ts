export interface ParcoursEntry {
  periode: string;
  titre: string;
  entreprise: string;
  desc: string;
}

export const parcours: ParcoursEntry[] = [
  {
    periode: "2024—",
    titre: "Développeur backend & DevOps indépendant",
    entreprise: "Freelance",
    desc: "Applications métier Python/Django, migrations de legacy, DevOps et monitoring pour des clients dans le retail, la santé et la logistique.",
  },
  {
    periode: "2023—2024",
    titre: "École 42 Perpignan",
    entreprise: "",
    desc: "Tronc commun validé, spécialisation en cours. Formation intensive par projets, peer-learning. Apprentissage approfondi de Rust en parallèle.",
  },
  {
    periode: "2015—2023",
    titre: "Administrateur systèmes",
    entreprise: "LCL",
    desc: "Administration système et fiabilisation d'infrastructures bancaires critiques.",
  },
  {
    periode: "2008—2015",
    titre: "Administrateur systèmes",
    entreprise: "Ministère de la Santé",
    desc: "Exploitation et sécurisation de systèmes d'information sensibles.",
  },
  {
    periode: "2000—2008",
    titre: "Ingénieur systèmes",
    entreprise: "Steria",
    desc: "Infrastructure et support pour de grands comptes, environnements multi-clients.",
  },
  {
    periode: "1996—2000",
    titre: "Administrateur systèmes",
    entreprise: "Lafarge",
    desc: "Débuts en infrastructure : premiers pas dans l'exploitation et l'administration système.",
  },
];
