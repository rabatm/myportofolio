import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WargamesGame from './WargamesGame';

beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Laisse l'intro s'écrire en entier (30 ms par caractère). */
function finirIntro() {
  act(() => {
    vi.advanceTimersByTime(5_000);
  });
}

describe('WargamesGame', () => {
  it("présente le jeu en français par défaut", () => {
    render(<WargamesGame />);
    finirIntro();

    expect(screen.getByText(/BIENVENUE AU JEU/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COMMENCER/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retour au portfolio/ })).toHaveAttribute('href', '/');
  });

  it("présente le jeu en anglais sur la version anglaise", () => {
    render(<WargamesGame lang="en" />);
    finirIntro();

    expect(screen.getByText(/WELCOME TO THE GAME/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /START/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to portfolio/ })).toHaveAttribute('href', '/en/');
  });

  it("lance la partie avec les répliques de la langue", () => {
    render(<WargamesGame lang="en" />);
    finirIntro();

    act(() => {
      screen.getByRole('button', { name: /START/ }).click();
    });

    expect(screen.getByText(/YOU PLAY X/)).toBeInTheDocument();
    expect(screen.getByText(/YOUR MOVE\./)).toBeInTheDocument();
  });
});
