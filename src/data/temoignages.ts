export interface Temoignage {
  quote: string;
  name: string;
  title: string;
  company: string;
}

export const temoignages: Temoignage[] = [
  {
    name: "Hugo Aguado",
    title: "COO",
    company: "AMOPI RETAIL SAS",
    quote: "J'ai eu le plaisir de collaborer avec Martin sur plusieurs projets stratégiques au sein d'AMOPI. Il est intervenu sur la réécriture de flux d'import/export en Python avec Jenkins, le redéveloppement d'une application Android sous Flutter, ainsi que sur la reprise en main et la maintenance d'une application legacy développée en Delphi. Martin a fait preuve d'un très grand professionnalisme tout au long de ses missions. Son expertise technique, sa capacité d'adaptation à des environnements et technologies variés, ainsi que son autonomie lui ont permis de délivrer un travail de grande qualité. Au-delà de ses compétences techniques, j'ai particulièrement apprécié sa bonne humeur et son excellent relationnel, qui en font un partenaire très agréable au quotidien. Je recommande Martin sans la moindre hésitation.",
  },
  {
    name: "Yassine Hniche",
    title: "CTO",
    company: "AMOPI",
    quote: "J'ai eu le plaisir de collaborer avec Martin sur plusieurs projets de développement réalisés pour AMOPI. Martin s'est toujours montré très professionnel, impliqué et fiable. Il a su comprendre rapidement nos besoins métier et proposer des solutions techniques adaptées, tout en respectant les délais convenus. La qualité de son développement est au rendez-vous, avec un code propre, des livraisons stables et une excellente capacité à résoudre les problématiques rencontrées. Au-delà de ses compétences techniques, Martin est un interlocuteur agréable, réactif et à l'écoute. Je recommande Martin sans hésitation.",
  },
  {
    name: "Nicolas Cudel",
    title: "Gérant",
    company: "Freelance Malt",
    quote: "Martin a su à plusieurs reprises répondre à mes attentes, avec des projets fidèles aux exigences imposées. De plus, les délais ont toujours été respectés, ce qui n'est pas forcément habituel dans ce domaine.",
  },
];
