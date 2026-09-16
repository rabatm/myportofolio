import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeekBubble } from './PeekBubble';

const LIGNE = 'Je connais son parcours par cœur.';

function poser() {
  const props = { line: LIGNE, onOpen: vi.fn(), onDismiss: vi.fn() };
  return { ...render(<PeekBubble {...props} />), props };
}

describe('PeekBubble', () => {
  it('affiche la réplique', () => {
    const { container } = poser();

    expect(container.textContent).toContain(LIGNE);
  });

  it("est invisible aux lecteurs d'écran (décision D8)", () => {
    const { container } = poser();

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('ouvre le panneau au clic sur le corps de la bulle', () => {
    const { props } = poser();

    fireEvent.click(screen.getByTestId('peek-corps'));

    expect(props.onOpen).toHaveBeenCalledOnce();
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('ferme au clic sur la croix, sans ouvrir le panneau', () => {
    const { props } = poser();

    fireEvent.click(screen.getByTestId('peek-fermer'));

    expect(props.onDismiss).toHaveBeenCalledOnce();
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it('retire ses boutons du parcours de tabulation (décision D8)', () => {
    poser();

    expect(screen.getByTestId('peek-corps')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('peek-fermer')).toHaveAttribute('tabindex', '-1');
  });
});
