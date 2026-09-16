import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import type { Message } from './useMarvinThread';

// jsdom n'implémente pas scrollIntoView : le panneau l'appelle pour garder
// le bas de l'historique visible à chaque nouveau message. Sans ce stub,
// chaque rendu lève un TypeError avant même d'atteindre les assertions.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const FIL: Message[] = [
  { role: 'assistant', content: 'Assistant portfolio.' },
  { role: 'user', content: 'Qui est Martin ?' },
];

function poser(surcharge: Partial<Parameters<typeof ChatPanel>[0]> = {}) {
  const props = {
    messages: FIL,
    isLoading: false,
    typing: false,
    canRetry: false,
    onSend: vi.fn(),
    onRetry: vi.fn(),
    onClose: vi.fn(),
    onFinishTyping: vi.fn(),
    ...surcharge,
  };
  return { ...render(<ChatPanel {...props} />), props };
}

describe('ChatPanel', () => {
  it('est un dialogue non modal nommé', () => {
    poser();

    const dialogue = screen.getByRole('dialog');
    expect(dialogue).toHaveAttribute('aria-modal', 'false');
    expect(dialogue).toHaveAccessibleName(/MARVIN-42/);
  });

  it("place le focus sur la saisie à l'ouverture", () => {
    poser();

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('affiche tout le fil', () => {
    const { container } = poser();

    expect(container.textContent).toContain('Assistant portfolio.');
    expect(container.textContent).toContain('Qui est Martin ?');
  });

  it('annonce poliment les nouveaux messages', () => {
    poser();

    expect(screen.getByTestId('marvin-historique')).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });

  it('envoie la saisie et vide le champ', () => {
    const { props } = poser();
    const champ = screen.getByRole('textbox');

    fireEvent.change(champ, { target: { value: 'Bonjour' } });
    fireEvent.submit(champ.closest('form')!);

    expect(props.onSend).toHaveBeenCalledWith('Bonjour');
    expect(champ).toHaveValue('');
  });

  it("n'envoie rien quand le champ est vide", () => {
    const { props } = poser();

    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('ferme à la demande', () => {
    const { props } = poser();

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('propose de réessayer après une erreur, sans vider le fil', () => {
    const avecErreur: Message[] = [
      ...FIL,
      { role: 'error', content: 'connexion perdue' },
    ];
    const { props, container } = poser({ messages: avecErreur, canRetry: true });

    expect(container.textContent).toContain('connexion perdue');
    expect(container.textContent).toContain('Qui est Martin ?');

    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('ne propose pas de réessayer quand tout va bien', () => {
    poser();

    expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument();
  });

  it("termine la frappe au clic dans l'historique", () => {
    const { props } = poser({ typing: true });

    fireEvent.click(screen.getByTestId('marvin-historique'));

    expect(props.onFinishTyping).toHaveBeenCalledOnce();
  });

  it('désactive la saisie pendant le chargement', () => {
    poser({ isLoading: true });

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
