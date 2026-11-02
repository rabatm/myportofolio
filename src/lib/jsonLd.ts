import { BUSINESS, CONTACT_EMAIL } from '../data/site';
import { services } from '../data/services';
import { buildPath, type Lang } from '../i18n/utils';

/** Données structurées schema.org de l'entreprise. Jamais de rue, téléphone ni identifiant légal. */
export function professionalServiceJsonLd(lang: Lang, site: URL): Record<string, unknown> {
  const names = services[lang].map((s) => s.name);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: BUSINESS.name,
    founder: { '@type': 'Person', name: BUSINESS.founder },
    url: new URL(buildPath('home', lang), site).href,
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.city,
      postalCode: BUSINESS.postalCode,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: BUSINESS.region },
      { '@type': 'Country', name: 'France' },
    ],
    knowsAbout: names,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: names.map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
    inLanguage: lang,
  };
}

/** Sérialise pour un `<script>` : `<` échappé, aucune chaîne ne peut fermer la balise. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
