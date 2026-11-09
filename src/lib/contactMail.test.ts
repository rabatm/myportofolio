import { describe, expect, it } from 'vitest';
import { buildContactMail, validateContact } from './contactMail';

const valide = { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Bonjour Martin', lang: 'en' };

describe('validateContact', () => {
  it('accepte un message complet et nettoie les espaces', () => {
    expect(validateContact({ ...valide, name: '  Ada Lovelace ', message: ' Bonjour Martin \n' })).toEqual({
      ok: true,
      data: { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Bonjour Martin', lang: 'en' },
    });
  });

  it('retombe sur le français pour une langue absente ou inconnue', () => {
    const r = validateContact({ ...valide, lang: 'de' });
    expect(r.ok && r.data.lang).toBe('fr');
  });

  it('refuse un champ manquant ou vide', () => {
    expect(validateContact({ ...valide, name: '   ' }).ok).toBe(false);
    expect(validateContact({ email: 'ada@example.com', message: 'x' }).ok).toBe(false);
    expect(validateContact({ ...valide, message: '' }).ok).toBe(false);
  });

  it('refuse un email mal formé', () => {
    expect(validateContact({ ...valide, email: 'ada@' }).ok).toBe(false);
    expect(validateContact({ ...valide, email: 'pas un email' }).ok).toBe(false);
  });

  it('refuse les valeurs trop longues', () => {
    expect(validateContact({ ...valide, name: 'a'.repeat(101) }).ok).toBe(false);
    expect(validateContact({ ...valide, email: `${'a'.repeat(195)}@x.com` }).ok).toBe(false);
    expect(validateContact({ ...valide, message: 'a'.repeat(5001) }).ok).toBe(false);
  });

  it('refuse un corps qui n\'est pas un objet', () => {
    expect(validateContact(null).ok).toBe(false);
    expect(validateContact('texte').ok).toBe(false);
  });

  it('refuse les champs qui ne sont pas des chaînes', () => {
    expect(validateContact({ ...valide, name: 42 }).ok).toBe(false);
  });

  it("empêche l'injection d'en-têtes par un retour à la ligne dans le nom ou l'email", () => {
    expect(validateContact({ ...valide, name: 'Ada\nBcc: x@y.z' }).ok).toBe(false);
    expect(validateContact({ ...valide, email: 'ada@example.com\nBcc: x@y.z' }).ok).toBe(false);
  });
});

describe('buildContactMail', () => {
  const mail = buildContactMail({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Bonjour Martin',
    lang: 'en',
  });

  it('met la langue et le nom dans le sujet', () => {
    expect(mail.subject).toBe('[Martin Info] Ada Lovelace (EN)');
  });

  it("permet de répondre directement au visiteur", () => {
    expect(mail.replyTo).toBe('"Ada Lovelace" <ada@example.com>');
  });

  it('reprend toutes les informations dans le corps', () => {
    expect(mail.text).toContain('Nom : Ada Lovelace');
    expect(mail.text).toContain('Email : ada@example.com');
    expect(mail.text).toContain('Langue : EN');
    expect(mail.text).toContain('Bonjour Martin');
  });

  it('échappe les guillemets du nom dans le Reply-To', () => {
    const m = buildContactMail({ name: 'Ada "la" L.', email: 'ada@example.com', message: 'x', lang: 'fr' });
    expect(m.replyTo).toBe('"Ada \\"la\\" L." <ada@example.com>');
  });
});

describe('entreprise et type de projet', () => {
  it('accepte entreprise et type de projet', () => {
    const r = validateContact({ ...valide, company: ' ACME ', projectType: 'automation' });
    expect(r.ok && r.data).toMatchObject({ company: 'ACME', projectType: 'automation' });
  });
  it('reste valide sans entreprise ni type (formulaire WarGames)', () => {
    const r = validateContact(valide);
    expect(r.ok && 'company' in r.data).toBe(false);
    expect(r.ok && 'projectType' in r.data).toBe(false);
  });
  it('omet les champs vides', () => {
    const r = validateContact({ ...valide, company: '  ', projectType: '' });
    expect(r.ok && 'company' in r.data).toBe(false);
    expect(r.ok && 'projectType' in r.data).toBe(false);
  });
  it('refuse une entreprise avec retour à la ligne ou trop longue, un type inconnu', () => {
    expect(validateContact({ ...valide, company: 'A\nBcc: x@y.z' }).ok).toBe(false);
    expect(validateContact({ ...valide, company: 'a'.repeat(101) }).ok).toBe(false);
    expect(validateContact({ ...valide, company: 42 }).ok).toBe(false);
    expect(validateContact({ ...valide, projectType: 'hack' }).ok).toBe(false);
  });
  it('met entreprise et type dans le mail, pas dans Reply-To', () => {
    const m = buildContactMail({ name: 'Ada', email: 'ada@example.com', message: 'x', lang: 'fr', company: 'ACME', projectType: 'integration' });
    expect(m.subject).toBe('[Martin Info] Ada — ACME (FR)');
    expect(m.text).toContain('Entreprise : ACME');
    expect(m.text).toContain('Type de projet : Intégration logicielle');
    expect(m.replyTo).not.toContain('ACME');
  });
  it('libellé pour « autre » et lignes absentes sans les champs', () => {
    const m = buildContactMail({ name: 'Ada', email: 'ada@example.com', message: 'x', lang: 'fr', projectType: 'other' });
    expect(m.text).toContain('Type de projet : Autre / je ne sais pas encore');
    expect(m.text).not.toContain('Entreprise');
  });
});

describe('buildContactMail — message suspect', () => {
  const m = { name: 'Ada', email: 'ada@example.com', message: 'x', lang: 'fr' as const };

  it('préfixe l’objet pour permettre un filtre dans la boîte mail', () => {
    expect(buildContactMail(m, { suspect: true }).subject).toBe('[Spam probable] [Martin Info] Ada (FR)');
  });

  it('laisse l’objet inchangé sinon', () => {
    expect(buildContactMail(m).subject).toBe('[Martin Info] Ada (FR)');
    expect(buildContactMail(m, { suspect: false }).subject).toBe('[Martin Info] Ada (FR)');
  });
});
