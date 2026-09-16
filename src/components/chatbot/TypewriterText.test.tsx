import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setReducedMotion } from '../../../vitest.setup';
import { TYPE_BUDGET_MS, TypewriterText } from './TypewriterText';

const COURT = 'Bonjour.';
const LONG = 'a'.repeat(1000);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('TypewriterText', () => {
  it('commence vide puis se remplit', () => {
    const { container } = render(<TypewriterText text={COURT} />);

    expect(container.textContent).toBe('');

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    expect(container.textContent).toContain(COURT);
  });

  it('termine un texte long dans le budget de 2 s', () => {
    const fini = vi.fn();
    render(<TypewriterText text={LONG} onDone={fini} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    expect(fini).toHaveBeenCalled();
  });

  it('appelle onDone une seule fois', () => {
    const fini = vi.fn();
    render(<TypewriterText text={COURT} onDone={fini} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS * 3));

    expect(fini).toHaveBeenCalledTimes(1);
  });

  it("affiche tout d'un bloc sous prefers-reduced-motion", () => {
    setReducedMotion(true);
    const fini = vi.fn();

    const { container } = render(<TypewriterText text={COURT} onDone={fini} />);

    expect(container.textContent).toContain(COURT);
    expect(fini).toHaveBeenCalled();
  });

  it("masque le texte en cours de frappe aux lecteurs d'écran", () => {
    const { container } = render(<TypewriterText text={COURT} />);

    act(() => vi.advanceTimersByTime(30));

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByText(COURT)).not.toBeInTheDocument();
  });

  it("expose la phrase entière aux lecteurs d'écran une fois la frappe finie", () => {
    render(<TypewriterText text={COURT} />);

    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    // Sélecteur nécessaire : une fois la frappe finie, le span aria-hidden
    // affiche aussi la phrase entière (le texte visuel reste affiché), donc
    // `getByText(COURT)` seul est ambigu — deux nœuds portent le même texte.
    expect(screen.getByText(COURT, { selector: '.sr-only' })).toHaveClass('sr-only');
  });

  it('repart de zéro quand le texte change', () => {
    const { container, rerender } = render(<TypewriterText text={COURT} />);
    act(() => vi.advanceTimersByTime(TYPE_BUDGET_MS));

    rerender(<TypewriterText text="Autre chose." />);

    expect(container.textContent).toBe('');
  });
});
