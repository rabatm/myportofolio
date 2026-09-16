import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { ANALYTICS_EVENT } from './track';
import {
  GREETING,
  LONG_SESSION_NOTICE,
  useMarvinThread,
  writeThread,
  type Message,
} from './useMarvinThread';

/** Simule une réponse de /api/chat. */
function repond(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ content }),
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', repond('Réponse.'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Capte les événements analytics du test, et se désabonne à sa fin. */
function capterAnalytics(): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  onTestFinished(() => window.removeEventListener(ANALYTICS_EVENT, ecouteur));

  return recus;
}

describe('useMarvinThread', () => {
  it('démarre sur la phrase de présentation', () => {
    const { result } = renderHook(() => useMarvinThread());

    expect(result.current.messages).toEqual([GREETING]);
  });

  it('restaure le fil stocké, sans réinjecter la présentation', async () => {
    const fil: Message[] = [
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'bonjour' },
    ];
    writeThread(fil);

    const { result } = renderHook(() => useMarvinThread());

    await waitFor(() => expect(result.current.messages).toEqual(fil));
  });

  it('ajoute le message du visiteur puis la réponse', async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('Qui est Martin ?'));

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'Qui est Martin ?' },
      { role: 'assistant', content: 'Réponse.' },
    ]);
  });

  it("typographie la réponse à l'arrivée, jusqu'à finishTyping", async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));
    expect(result.current.typing).toBe(true);

    act(() => result.current.finishTyping());

    expect(result.current.typing).toBe(false);
  });

  it("n'envoie ni les préfixes ni les entrées d'erreur à l'API", async () => {
    const appel = repond('Réponse.');
    vi.stubGlobal('fetch', appel);
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    const corps = JSON.parse((appel.mock.calls[0][1] as RequestInit).body as string);
    expect(corps.messages).toEqual([
      { role: 'assistant', content: GREETING.content },
      { role: 'user', content: 'salut' },
    ]);
  });

  it("ignore un message vide ou uniquement composé d'espaces", async () => {
    const appel = repond('Réponse.');
    vi.stubGlobal('fetch', appel);
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('   '));

    expect(appel).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([GREETING]);
  });

  it('émet marvin_message_sent avec la longueur et le rang', async () => {
    const recus = capterAnalytics();
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(recus[0].detail).toEqual({
      name: 'marvin_message_sent',
      length: 5,
      index: 1,
    });
  });

  it("ajoute une entrée d'erreur sans vider l'historique", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'salut' },
      { role: 'error', content: 'connexion perdue' },
    ]);
    expect(result.current.canRetry).toBe(true);
  });

  it('traite une réponse HTTP en échec comme une erreur réseau', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
    );
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    expect(result.current.messages.at(-1)).toEqual({
      role: 'error',
      content: 'connexion perdue',
    });
  });

  it('réessaie sans dupliquer le message du visiteur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const { result } = renderHook(() => useMarvinThread());
    await act(() => result.current.send('salut'));

    vi.stubGlobal('fetch', repond('Enfin.'));
    await act(() => result.current.retry());

    expect(result.current.messages).toEqual([
      GREETING,
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'Enfin.' },
    ]);
    expect(result.current.canRetry).toBe(false);
  });

  it('redirige vers /wargames quand le modèle demande le jeu', async () => {
    vi.useFakeTimers();
    // window.location est en lecture seule sous jsdom : on le redéfinit, et
    // on le restaure ensuite — sinon les tests suivants héritent du faux.
    const vraieLocation = window.location;
    const destination = { href: '' };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: destination,
    });
    vi.stubGlobal('fetch', repond('Jouons. [LANCER_JEU]'));
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('on joue ?'));
    expect(result.current.messages.at(-1)?.content).toBe('Jouons.');

    act(() => vi.advanceTimersByTime(2200));

    expect(destination.href).toBe('/wargames');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: vraieLocation,
    });
    vi.useRealTimers();
  });

  it('signale une session longue tous les quinze messages', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMarvinThread());

    for (let i = 0; i < 15; i++) {
      await act(() => result.current.send(`message ${i}`));
      act(() => result.current.finishTyping());
    }
    act(() => vi.advanceTimersByTime(2500));

    expect(result.current.messages.at(-1)?.content).toBe(LONG_SESSION_NOTICE);
    vi.useRealTimers();
  });

  it('persiste le fil après une réponse', async () => {
    const { result } = renderHook(() => useMarvinThread());

    await act(() => result.current.send('salut'));

    const stocke = JSON.parse(sessionStorage.getItem('marvin.thread')!);
    expect(stocke.at(-1)).toEqual({ role: 'assistant', content: 'Réponse.' });
  });

  it("n'écrase pas le fil stocké au montage", async () => {
    const fil: Message[] = [{ role: 'user', content: 'salut' }];
    writeThread(fil);

    renderHook(() => useMarvinThread());

    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem('marvin.thread')!)).toEqual(fil)
    );
  });
});
