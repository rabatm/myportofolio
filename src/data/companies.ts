import type { Lang } from '../i18n/utils';

export interface Company {
  name: string;
  url: string;
  logo: string;
  /** Fond du cadre du logo, selon les couleurs du logo. */
  logoBg: 'white' | 'dark';
  /** Accroche courte, affichée sous le logo. */
  tagline: string;
  /** Description complète, injectée dans le prompt de Marvin. */
  desc: string;
}

const base = [
  { name: 'Amopi', url: 'https://amopi.fr', logo: '/amopi.png', logoBg: 'white' },
  { name: 'JurisPerform', url: 'https://www.juris-perform.fr/', logo: '/jurisperform.png', logoBg: 'white' },
  { name: 'Surikwat', url: 'https://surikwat.com', logo: '/surikwat.png', logoBg: 'dark' },
] as const;

const textes: Record<Lang, { tagline: string; desc: string }[]> = {
  fr: [
    {
      tagline: 'Transformation numérique & cloud',
      desc: "Le Groupe Amopi accompagne la transformation numérique des entreprises, particulièrement dans le secteur du commerce, en proposant une offre globale allant de l'intégration de logiciels de gestion et d'équipements de point de vente à l'hébergement cloud et l'infogérance.",
    },
    {
      tagline: 'Conseil & formation pour le droit',
      desc: "Cabinet de conseil et organisme de formation dédié aux professionnels du droit (avocats, notaires, commissaires de justice), spécialisé dans l'accompagnement stratégique, le management et le développement de la performance de leurs cabinets.",
    },
    {
      tagline: 'Studio créatif web & print',
      desc: 'Studio créatif de communication (web et print) basé dans les Pyrénées-Orientales, spécialisé dans la création de sites internet sur mesure, le design graphique et la production de contenus audiovisuels.',
    },
  ],
  en: [
    {
      tagline: 'Digital transformation & cloud',
      desc: "The Amopi Group supports businesses' digital transformation, particularly in retail, with a complete offering that ranges from management software and point-of-sale equipment integration to cloud hosting and managed IT services.",
    },
    {
      tagline: 'Consulting & training for legal professionals',
      desc: 'Consulting firm and training organization dedicated to legal professionals (lawyers, notaries, judicial officers), specializing in strategic support, management and performance development for their firms.',
    },
    {
      tagline: 'Creative web & print studio',
      desc: 'Creative communication studio (web and print) based in the Pyrénées-Orientales, France, specializing in custom websites, graphic design and audiovisual content production.',
    },
  ],
};

export const companies: Record<Lang, Company[]> = {
  fr: base.map((c, i) => ({ ...c, ...textes.fr[i] })),
  en: base.map((c, i) => ({ ...c, ...textes.en[i] })),
};
