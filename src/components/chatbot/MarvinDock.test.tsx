import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import MarvinDock from './MarvinDock';
import { ANALYTICS_EVENT } from './track';
import { PEEK_DELAY_MS, readPeekState } from './usePeek';

const LIGNES = ['Tu peux lire tout le site, ou me demander.'];

// jsdom n'implémente pas scrollIntoView, appelé par ChatPanel (tâche 10) :
// stub local, comme dans ChatPanel.test.tsx — voir la tâche 10.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: 'Soit.' }) })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function avancer(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function pastille() {
  return screen.getByRole('button', { name: /ouvrir le chat marvin-42/i });
}

/** Capte les événements analytics du test, et se désabonne à sa fin. */
function capterAnalytics(): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  onTestFinished(() => window.removeEventListener(ANALYTICS_EVENT, ecouteur));

  return recus;
}


describe('MarvinDock', () => {
  it("ne montre qu'une pastille au repos", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    expect(pastille()).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("décrit l'état du panneau via aria-expanded", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    expect(pastille()).toHaveAttribute('aria-expanded', 'false');
    expect(pastille()).toHaveAttribute('aria-controls', 'marvin-panneau');

    fireEvent.click(pastille());

    expect(
      screen.getByRole('button', { name: /fermer le chat marvin-42/i })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('ouvre le panneau au clic sur la pastille', () => {
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('émet marvin_open avec la source du clic', () => {
    const recus = capterAnalytics();
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());

    expect(recus.at(-1)?.detail).toMatchObject({ name: 'marvin_open', source: 'pill' });
  });

  it("affiche la bulle au bout de 6 s, puis l'ouvre au clic", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    avancer(PEEK_DELAY_MS);
    expect(screen.getByText(LIGNES[0])).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('peek-corps'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
  });

  it('coupe définitivement la bulle au clic sur la croix', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    avancer(PEEK_DELAY_MS);

    fireEvent.click(screen.getByTestId('peek-fermer'));

    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
    expect(readPeekState().off).toBe(true);
    expect(localStorage.getItem('marvin.peek.optout')).not.toBeNull();
  });

  it('ferme le panneau sur Échap et rend le focus à la pastille', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    fireEvent.click(pastille());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pastille()).toHaveFocus();
  });

  it('rend le focus à la pastille après fermeture par la croix du panneau', () => {
    render(<MarvinDock peekLines={LIGNES} />);
    fireEvent.click(pastille());

    fireEvent.click(screen.getByRole('button', { name: /fermer la conversation/i }));

    expect(pastille()).toHaveFocus();
  });

  it("n'affiche plus de bulle une fois le panneau ouvert", () => {
    render(<MarvinDock peekLines={LIGNES} />);

    fireEvent.click(pastille());
    fireEvent.click(screen.getByRole('button', { name: /fermer la conversation/i }));
    avancer(PEEK_DELAY_MS * 2);

    expect(screen.queryByText(LIGNES[0])).not.toBeInTheDocument();
  });

  it('fonctionne sans répliques (page sans amorce)', () => {
    render(<MarvinDock />);

    avancer(PEEK_DELAY_MS * 2);

    expect(pastille()).toBeInTheDocument();
    expect(screen.queryByTestId('peek-corps')).not.toBeInTheDocument();
  });
});
