import type { Lang } from '../i18n/utils';

export interface Temoignage {
  quote: string;
  name: string;
  title: string;
  company: string;
}

export const temoignages: Record<Lang, Temoignage[]> = {
  fr: [
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
      title: "CIO",
      company: "Surikwat",
      quote: "Martin a su à plusieurs reprises répondre à mes attentes, avec des projets fidèles aux exigences imposées. De plus, les délais ont toujours été respectés, ce qui n'est pas forcément habituel dans ce domaine.",
    },
  ],
  en: [
    {
      name: 'Hugo Aguado',
      title: 'COO',
      company: 'AMOPI RETAIL SAS',
      quote: 'I had the pleasure of working with Martin on several strategic projects at AMOPI. He rewrote import/export flows in Python with Jenkins, redeveloped an Android application in Flutter, and took over and maintained a legacy application built in Delphi. Martin showed great professionalism throughout his assignments. His technical expertise, his ability to adapt to varied environments and technologies, and his autonomy allowed him to deliver high-quality work. Beyond his technical skills, I particularly appreciated his good humor and excellent interpersonal skills, which make him a very pleasant partner day to day. I recommend Martin without the slightest hesitation.',
    },
    {
      name: 'Yassine Hniche',
      title: 'CTO',
      company: 'AMOPI',
      quote: 'I had the pleasure of working with Martin on several development projects for AMOPI. Martin has always been very professional, committed and reliable. He quickly understood our business needs and proposed suitable technical solutions, while meeting the agreed deadlines. The quality of his work is there, with clean code, stable releases and an excellent ability to solve the problems that came up. Beyond his technical skills, Martin is pleasant to work with, responsive and a good listener. I recommend Martin without hesitation.',
    },
    {
      name: 'Nicolas Cudel',
      title: 'CIO',
      company: 'Surikwat',
      quote: 'Martin has repeatedly met my expectations, delivering projects that stayed true to the requirements. What is more, deadlines were always met, which is not necessarily the norm in this field.',
    },
  ],
};
