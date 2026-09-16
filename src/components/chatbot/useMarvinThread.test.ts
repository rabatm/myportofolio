import { describe, expect, it } from 'vitest';
import {
  capThread,
  CONTEXT_WINDOW,
  parseReply,
  readThread,
  THREAD_CAP,
  THREAD_KEY,
  toApiMessages,
  writeThread,
  type Message,
} from './useMarvinThread';

function messages(n: number): Message[] {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: `message ${i}`,
  }));
}

describe('capThread', () => {
  it('laisse un fil court intact', () => {
    const fil = messages(5);

    expect(capThread(fil)).toEqual(fil);
  });

  it('ne garde que les derniers messages au-delà du plafond', () => {
    const fil = messages(THREAD_CAP + 10);

    const coupe = capThread(fil);

    expect(coupe).toHaveLength(THREAD_CAP);
    expect(coupe[coupe.length - 1]).toEqual(fil[fil.length - 1]);
  });
});

describe('toApiMessages', () => {
  it("exclut les entrées d'erreur de la charge envoyée à l'API", () => {
    const fil: Message[] = [
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
      { role: 'assistant', content: 'bonjour' },
    ];

    expect(toApiMessages(fil)).toEqual([
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'bonjour' },
    ]);
  });

  it('ne retient que les six derniers messages', () => {
    expect(toApiMessages(messages(20))).toHaveLength(CONTEXT_WINDOW);
  });

  it('coupe après avoir retiré les erreurs, pas avant', () => {
    const fil: Message[] = [
      ...messages(CONTEXT_WINDOW),
      { role: 'error', content: 'connexion perdue' },
    ];

    expect(toApiMessages(fil)).toHaveLength(CONTEXT_WINDOW);
  });
});

describe('parseReply', () => {
  it("rend le texte tel quel quand il n'y a pas de marqueur", () => {
    expect(parseReply('Bonjour.')).toEqual({ content: 'Bonjour.', launchGame: false });
  });

  it('détecte le marqueur de jeu et le retire du texte affiché', () => {
    expect(parseReply('Jouons. [LANCER_JEU]')).toEqual({
      content: 'Jouons.',
      launchGame: true,
    });
  });

  it('retire le chevron que le modèle ajoute parfois', () => {
    expect(parseReply('> Bonjour.').content).toBe('Bonjour.');
  });

  it('retire plusieurs marqueurs sans laisser de trace', () => {
    expect(parseReply('[LANCER_JEU] Allez. [LANCER_JEU]').content).toBe('Allez.');
  });
});

describe('persistance du fil', () => {
  it("retourne null quand rien n'est stocké", () => {
    expect(readThread()).toBeNull();
  });

  it('relit ce que writeThread a écrit', () => {
    const fil: Message[] = [{ role: 'user', content: 'salut' }];

    writeThread(fil);

    expect(readThread()).toEqual(fil);
  });

  it("ne persiste pas les entrées d'erreur", () => {
    writeThread([
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
    ]);

    expect(readThread()).toEqual([{ role: 'user', content: 'salut' }]);
  });

  it('retourne null sur du JSON corrompu plutôt que de lever', () => {
    sessionStorage.setItem(THREAD_KEY, 'pas du json');

    expect(readThread()).toBeNull();
  });

  it('écarte les entrées mal formées', () => {
    sessionStorage.setItem(
      THREAD_KEY,
      JSON.stringify([{ role: 'user', content: 'ok' }, { role: 'pirate' }, null])
    );

    expect(readThread()).toEqual([{ role: 'user', content: 'ok' }]);
  });
});
