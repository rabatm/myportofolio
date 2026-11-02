import { describe, expect, it } from 'vitest';
import { jsonLdScript, professionalServiceJsonLd } from './jsonLd';
import { CONTACT_EMAIL } from '../data/site';
import { services } from '../data/services';

const site = new URL('https://martin-info.example');

describe('jsonLdScript', () => {
  it('échappe < pour que </script> ne ferme pas la balise', () => {
    const out = jsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});

describe('professionalServiceJsonLd', () => {
  const fr = professionalServiceJsonLd('fr', site) as any;

  it('décrit l’entreprise', () => {
    expect(fr['@type']).toBe('ProfessionalService');
    expect(fr.name).toBe('Martin Info');
    expect(fr.founder).toEqual({ '@type': 'Person', name: 'Martin Rabat' });
    expect(fr.address.addressLocality).toBe('Perpignan');
    expect(fr.email).toBe(CONTACT_EMAIL);
    expect(fr.inLanguage).toBe('fr');
  });

  it('liste les 5 services du catalogue', () => {
    const offers = fr.hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(5);
    expect(offers.map((o: any) => o.itemOffered.name)).toEqual(services.fr.map((s) => s.name));
  });

  it('ne publie ni rue, ni téléphone, ni identifiant légal', () => {
    const json = JSON.stringify(fr);
    expect(json).not.toContain('streetAddress');
    expect(json).not.toContain('telephone');
    expect(json).not.toMatch(/vatID|taxID|siret/i);
  });

  it('pointe vers l’accueil de la langue', () => {
    expect((professionalServiceJsonLd('en', site) as any).url.endsWith('/en/')).toBe(true);
    expect(fr.url).toBe('https://martin-info.example/');
  });
});
