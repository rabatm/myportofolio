import type { Lang } from '../i18n/utils';

export type ServiceId = 'web' | 'mobile' | 'automation' | 'integration' | 'maintenance';
export const SERVICE_IDS: readonly ServiceId[] = ['web', 'mobile', 'automation', 'integration', 'maintenance'];

export interface Service {
  id: ServiceId;
  name: string;
  /** Le problème du visiteur, sous forme de question. */
  hook: string;
  /** Le besoin auquel le service répond. */
  need: string;
  /** Ce que Martin peut construire : types de réalisations possibles, pas des références client. */
  builds: string[];
  /** Le bénéfice concret. */
  benefit: string;
  /** Libellé du bouton de contact, propre à chaque service. */
  cta: string;
  /** Automatisation uniquement : ce qui prouve le service aujourd'hui. */
  proofNote?: string;
}

export interface Step {
  title: string;
  text: string;
}

export const services: Record<Lang, Service[]> = {
  fr: [
    {
      id: 'web',
      name: 'Applications web',
      hook: 'Vous gérez tout dans des tableurs ?',
      need: "Vos dossiers, vos clients et vos suivis vivent dans des fichiers dispersés, et chacun a sa propre version. Une application web sur mesure rassemble tout au même endroit, avec les règles de votre métier.",
      builds: [
        'Applications de gestion',
        'Tableaux de bord',
        'Portails clients',
        'Back-offices',
        'Outils métier',
        'Gestion de dossiers et de données',
      ],
      benefit: "Une information unique et à jour, accessible à toute l'équipe depuis un navigateur, sans ressaisie ni fichier à renvoyer.",
      cta: 'Imaginer votre outil',
    },
    {
      id: 'mobile',
      name: 'Applications mobiles',
      hook: 'Vos équipes travaillent sur le terrain ?',
      need: "Vos collaborateurs ont besoin de l'information là où ils travaillent, pas seulement au bureau. Une application Android et iOS leur met l'essentiel dans la poche.",
      builds: [
        'Applications métier',
        'Outils pour collaborateurs',
        'Applications terrain',
        'Gestion des interventions',
        "Suivi d'activité",
        'Applications connectées aux systèmes existants',
      ],
      benefit: "Moins de papier et d'allers-retours : l'information est saisie une fois, sur place, et remonte directement dans vos outils.",
      cta: 'Parler de votre application',
    },
    {
      id: 'automation',
      name: 'Automatisation & IA',
      hook: 'Vous refaites les mêmes tâches chaque semaine ?',
      need: "Les tâches répétitives mangent du temps et laissent passer des erreurs. Voyons ce qui peut être automatisé, avec ou sans intelligence artificielle.",
      builds: [
        'Automatisation administrative',
        'Traitement de documents',
        "Classification et extraction d'informations",
        'Assistants IA',
        'Génération de rapports',
        'Automatisation des échanges entre logiciels',
        'Intégration de modèles IA dans les applications métier',
      ],
      benefit: "Moins de tâches répétitives, moins de ressaisies, et une information qui circule mieux entre vos outils et vos équipes.",
      cta: "Discuter d'une automatisation",
      proofNote:
        "Je n'ai pas d'étude de cas à vous montrer ici, mais deux preuves concrètes : Marvin, l'assistant IA en service sur ce site, et la réécriture des flux d'import et d'export chez Amopi, attestée par le témoignage d'Hugo Aguado.",
    },
    {
      id: 'integration',
      name: 'Intégration logicielle',
      hook: 'Vos logiciels ne se parlent pas ?',
      need: "Chaque outil fonctionne dans son coin, et vous recopiez les données de l'un à l'autre. Je peux créer la passerelle qui leur manque.",
      builds: [
        'Synchronisation de données',
        'Connexion ERP / CRM',
        "Développement d'API",
        'Passerelles entre logiciels',
        'Interconnexion de bases de données',
        'Modernisation de systèmes existants',
      ],
      benefit: "Vos données circulent d'un outil à l'autre sans intervention, et vos logiciels actuels continuent de servir.",
      cta: 'Relier vos logiciels',
    },
    {
      id: 'maintenance',
      name: 'Maintenance & évolution',
      hook: 'Un logiciel existant à reprendre ?',
      need: "Votre logiciel fonctionne, mais plus personne ne le maîtrise, ou il ne suit plus l'évolution de votre activité. Je le reprends, le fiabilise et le fais évoluer.",
      builds: [
        'Accompagnement technique',
        'Reprise de projets',
        'Maintenance applicative',
        'Évolution de logiciels existants',
      ],
      benefit: "Un interlocuteur qui connaît votre outil, le garde en état de marche et l'adapte quand votre activité change.",
      cta: "Voir si je peux vous aider",
    },
  ],
  en: [
    {
      id: 'web',
      name: 'Web applications',
      hook: 'Running everything in spreadsheets?',
      need: 'Your files, clients and follow-ups live in scattered documents, and everyone has their own version. A custom web application brings it all together, with the rules of your trade built in.',
      builds: [
        'Management applications',
        'Dashboards',
        'Client portals',
        'Back-offices',
        'Business tools',
        'Case and data management',
      ],
      benefit: 'One up-to-date source of truth, available to the whole team from a browser, with no re-typing and no files to send around.',
      cta: 'Picture your tool',
    },
    {
      id: 'mobile',
      name: 'Mobile applications',
      hook: 'Do your teams work in the field?',
      need: 'Your people need information where they work, not only at the office. An Android and iOS application puts the essentials in their pocket.',
      builds: [
        'Business applications',
        'Tools for employees',
        'Field applications',
        'Intervention management',
        'Activity tracking',
        'Applications connected to existing systems',
      ],
      benefit: 'Less paper and fewer round trips: information is entered once, on site, and flows straight into your tools.',
      cta: 'Talk about your application',
    },
    {
      id: 'automation',
      name: 'Automation & AI',
      hook: 'Redoing the same tasks every week?',
      need: 'Repetitive tasks eat time and let mistakes through. Let us see what can be automated, with or without artificial intelligence.',
      builds: [
        'Administrative automation',
        'Document processing',
        'Information classification and extraction',
        'AI assistants',
        'Report generation',
        'Automated exchanges between software',
        'AI models integrated into business applications',
      ],
      benefit: 'Fewer repetitive tasks, less re-keying, and information that moves better between your tools and your teams.',
      cta: 'Discuss an automation',
      proofNote:
        'I have no case study to show here, but two concrete proofs: Marvin, the AI assistant live on this site, and the rewrite of the import and export flows at Amopi, attested by Hugo Aguado’s testimonial.',
    },
    {
      id: 'integration',
      name: 'Software integration',
      hook: "Software that doesn't talk to each other?",
      need: 'Each tool works in its own corner, and you copy data from one to the next. I can build the bridge they are missing.',
      builds: [
        'Data synchronization',
        'ERP / CRM connection',
        'API development',
        'Bridges between software',
        'Database interconnection',
        'Modernization of existing systems',
      ],
      benefit: 'Your data moves from one tool to another without manual work, and your current software keeps earning its place.',
      cta: 'Connect your software',
    },
    {
      id: 'maintenance',
      name: 'Maintenance & evolution',
      hook: 'An existing piece of software to take over?',
      need: 'Your software works, but nobody masters it any more, or it no longer keeps up with your business. I take it over, make it reliable and keep it evolving.',
      builds: [
        'Technical support',
        'Project takeover',
        'Application maintenance',
        'Evolution of existing software',
      ],
      benefit: 'One contact who knows your tool, keeps it running and adapts it when your business changes.',
      cta: 'See if I can help',
    },
  ],
};

export const methode: Record<Lang, Step[]> = {
  fr: [
    { title: 'Comprendre', text: 'On parle de votre métier, pas de technique.' },
    { title: 'Proposer', text: 'Une solution claire, à votre échelle.' },
    { title: 'Construire', text: 'Des versions testables au fil de l’eau.' },
    { title: 'Accompagner', text: 'Mise en production, formation, évolutions.' },
  ],
  en: [
    { title: 'Understand', text: 'We talk about your business, not about technology.' },
    { title: 'Propose', text: 'A clear solution, sized to you.' },
    { title: 'Build', text: 'Testable versions along the way.' },
    { title: 'Support', text: 'Going live, training, and later changes.' },
  ],
};
