import { describe, expect, it } from 'vitest';
import { companies } from '../data/companies';
import { parcours } from '../data/parcours';
import { methode, services } from '../data/services';
import { skills } from '../data/skills';
import { temoignages } from '../data/temoignages';
import type { Lang } from '../i18n/utils';
import { buildSystemPrompt, firstSentence, type PromptData } from './chatPrompt';

function donnees(lang: Lang) {
  return {
    parcours: parcours[lang],
    skills: skills[lang],
    companies: companies[lang],
    temoignages: temoignages[lang],
    services: services[lang],
    methode: methode[lang],
    projects: [
      { title: 'amiqo', description: 'Appli magasin', services: ['mobile'], kind: 'client' },
      { title: 'Cleo', description: 'Chat', services: [], kind: 'atelier' },
    ] as PromptData['projects'],
  };
}

describe('buildSystemPrompt', () => {
  it('écrit le prompt français en français', () => {
    const p = buildSystemPrompt('fr', donnees('fr'));
    expect(p).toContain("Tu es Marvin-42, l'assistant du site de Martin Info.");
    expect(p).toContain('Réponds en français sauf si le visiteur utilise clairement une autre langue.');
    expect(p).toContain(parcours.fr[1].titre);
    expect(p).toContain('/contact');
  });

  it('écrit le prompt anglais entièrement en anglais', () => {
    const p = buildSystemPrompt('en', donnees('en'));
    expect(p).toContain("You are Marvin-42, the assistant on Martin Info's website.");
    expect(p).toContain('Answer in English unless the visitor clearly uses another language.');
    expect(p).toContain(parcours.en[1].titre);
    expect(p).toContain('/en/contact');
    expect(p).toContain('/en/wargames');
    expect(p).not.toContain('Tu es');
    expect(p).not.toContain(parcours.fr[1].titre);
  });

  it('garde le marqueur de jeu tel quel dans les deux langues', () => {
    expect(buildSystemPrompt('fr', donnees('fr'))).toContain('[LANCER_JEU]');
    expect(buildSystemPrompt('en', donnees('en'))).toContain('[LANCER_JEU]');
  });

  it('injecte clients, compétences et projets', () => {
    const p = buildSystemPrompt('en', donnees('en'));
    expect(p).toContain('- JurisPerform (https://www.juris-perform.fr/)');
    expect(p).toContain('- Design & quality: Hexagonal architecture');
  });

  it('présente les services, la méthode et les projets avec leurs services', () => {
    const p = buildSystemPrompt('fr', donnees('fr'));
    expect(p).toContain(services.fr[3].name);
    expect(p).toContain(methode.fr[0].title);
    expect(p).toContain('- amiqo [mobile]');
    const perso = p.indexOf('Projets perso');
    expect(perso).toBeGreaterThan(-1);
    expect(p.indexOf('Cleo', perso)).toBeGreaterThan(perso);
    expect(p).toContain('/contact');
    expect(p).toContain('[LANCER_JEU]');
  });

  it('présente les services anglais dans le prompt anglais', () => {
    const p = buildSystemPrompt('en', donnees('en'));
    expect(p).toContain(services.en[0].name);
    if (services.en[0].name !== services.fr[0].name) {
      expect(p).not.toContain(services.fr[0].name);
    }
    expect(p).toContain('- amiqo [mobile]');
  });

  it('interdit de promettre tarif, délai, audit ou consultation gratuits', () => {
    expect(buildSystemPrompt('fr', donnees('fr'))).toMatch(/audit gratuit/);
    expect(buildSystemPrompt('en', donnees('en'))).toMatch(/free audit/);
  });

  it('précise que les témoignages anglais sont traduits', () => {
    expect(buildSystemPrompt('en', donnees('en'))).toContain('Testimonials (translated from French):');
  });
});

describe('firstSentence', () => {
  it('coupe à la première phrase', () => {
    // Une ellipse est ajoutée car du texte a été coupé après le point : ce
    // comportement (voulu, pas un bug) reproduit exactement l'actuel
    // chat.ts, condition de fidélité critique de cette tâche.
    expect(firstSentence('Une phrase. Une autre.')).toBe('Une phrase.…');
  });

  it('tronque une phrase trop longue avec une ellipse', () => {
    expect(firstSentence('a'.repeat(200), 10)).toBe(`${'a'.repeat(10)}…`);
  });
});
