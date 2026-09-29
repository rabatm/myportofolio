import { describe, expect, it } from 'vitest';
import {
  clientIp,
  countLinks,
  createRateLimiter,
  hasTooManyLinks,
  isTooFast,
  MIN_ELAPSED_MS,
} from './spamGuard';

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/contact', { method: 'POST', headers });
}

describe('clientIp', () => {
  it("prend la dernière entrée de X-Forwarded-For, celle ajoutée par le proxy", () => {
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }), '127.0.0.1')).toBe('203.0.113.9');
  });

  it("ignore les entrées ajoutées par le client pour se faire passer pour un autre", () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 203.0.113.9' }), '127.0.0.1')).toBe('203.0.113.9');
  });

  it("retombe sur l'adresse de la connexion sans en-tête", () => {
    expect(clientIp(req(), '198.51.100.7')).toBe('198.51.100.7');
    expect(clientIp(req({ 'x-forwarded-for': '  ' }), '198.51.100.7')).toBe('198.51.100.7');
  });

  it("renvoie 'unknown' sans aucune information", () => {
    expect(clientIp(req(), undefined)).toBe('unknown');
  });
});

describe('isTooFast', () => {
  it("laisse passer un envoi après le délai minimal", () => {
    expect(isTooFast(MIN_ELAPSED_MS)).toBe(false);
    expect(isTooFast(String(MIN_ELAPSED_MS + 1000))).toBe(false);
  });

  it('bloque un envoi trop rapide', () => {
    expect(isTooFast(MIN_ELAPSED_MS - 1)).toBe(true);
    expect(isTooFast(0)).toBe(true);
  });

  it("bloque l'absence de mesure : seul un robot poste sans passer par le formulaire", () => {
    expect(isTooFast(undefined)).toBe(true);
    expect(isTooFast('abc')).toBe(true);
    expect(isTooFast(-5000)).toBe(true);
  });
});

describe('liens', () => {
  it('compte les liens http(s) et www', () => {
    expect(countLinks('voir https://a.fr et http://b.fr ou www.c.fr')).toBe(3);
    expect(countLinks('aucun lien ici')).toBe(0);
  });

  it('tolère quelques liens dans le message, pas davantage', () => {
    const trois = 'https://a.fr https://b.fr https://c.fr';
    expect(hasTooManyLinks({ name: 'Ada', message: trois })).toBe(false);
    expect(hasTooManyLinks({ name: 'Ada', message: `${trois} https://d.fr` })).toBe(true);
  });

  it('refuse tout lien dans le nom', () => {
    expect(hasTooManyLinks({ name: 'Ada www.promo.example', message: 'Bonjour' })).toBe(true);
  });
});

describe('createRateLimiter', () => {
  const HEURE = 60 * 60 * 1000;

  function limiteur(debut = 0) {
    let maintenant = debut;
    const limiter = createRateLimiter({ perIp: 3, perIpWindowMs: HEURE, global: 5, globalWindowMs: 24 * HEURE }, () => maintenant);
    return { limiter, avancer: (ms: number) => (maintenant += ms) };
  }

  it("accepte jusqu'à la limite par IP puis refuse", () => {
    const { limiter } = limiteur();
    expect(limiter.hit('a')).toBe('ok');
    expect(limiter.hit('a')).toBe('ok');
    expect(limiter.hit('a')).toBe('ok');
    expect(limiter.hit('a')).toBe('ip');
  });

  it('ne pénalise pas une autre IP', () => {
    const { limiter } = limiteur();
    for (let i = 0; i < 3; i++) limiter.hit('a');
    expect(limiter.hit('b')).toBe('ok');
  });

  it('libère une IP une fois la fenêtre écoulée', () => {
    const { limiter, avancer } = limiteur();
    for (let i = 0; i < 3; i++) limiter.hit('a');
    avancer(HEURE);
    expect(limiter.hit('a')).toBe('ok');
  });

  it('applique le plafond global toutes IP confondues', () => {
    const { limiter } = limiteur();
    for (const ip of ['a', 'b', 'c', 'd', 'e']) expect(limiter.hit(ip)).toBe('ok');
    expect(limiter.hit('f')).toBe('global');
  });

  it("ne consomme pas de quota quand l'envoi est refusé", () => {
    const { limiter, avancer } = limiteur();
    for (let i = 0; i < 3; i++) limiter.hit('a');
    limiter.hit('a'); // refusé : ne doit pas repousser la fenêtre
    avancer(HEURE);
    expect(limiter.hit('a')).toBe('ok');
  });

  it('oublie les IP inactives pour ne pas grossir indéfiniment', () => {
    const { limiter, avancer } = limiteur();
    limiter.hit('a');
    avancer(HEURE + 1);
    limiter.hit('b');
    expect(limiter.trackedIps()).toBe(1);
  });
});
