import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { LANG_CHOICE_KEY } from '../../i18n/utils';
import LangSuggest, { SUGGEST_DISMISSED_KEY, suggestTarget } from './LangSuggest';

const rien = { choice: null, dismissed: null };

describe('suggestTarget', () => {
  it("propose l'anglais sur une page FR à un navigateur sans français", () => {
    expect(suggestTarget('fr', ['en-US', 'de'], rien)).toBe('en');
  });

  it('ne propose rien à un navigateur qui parle français', () => {
    expect(suggestTarget('fr', ['de', 'fr-CA'], rien)).toBeNull();
    expect(suggestTarget('fr', ['FR'], rien)).toBeNull();
  });

  it('propose le français sur une page EN à un navigateur francophone', () => {
    expect(suggestTarget('en', ['fr-FR', 'en'], rien)).toBe('fr');
  });

  it('ne propose rien sur une page EN à un navigateur non francophone', () => {
    expect(suggestTarget('en', ['en-GB'], rien)).toBeNull();
  });

  it('se tait après un choix explicite ou un refus', () => {
    expect(suggestTarget('fr', ['en'], { choice: 'fr', dismissed: null })).toBeNull();
    expect(suggestTarget('fr', ['en'], { choice: null, dismissed: '1' })).toBeNull();
  });

  it('se tait sans information sur la langue du navigateur', () => {
    expect(suggestTarget('fr', [], rien)).toBeNull();
  });
});

function langues(valeur: string[]) {
  // jsdom définit le getter sur le prototype, pas sur l'instance.
  vi.spyOn(Navigator.prototype, 'languages', 'get').mockReturnValue(valeur);
}

describe('LangSuggest', () => {
  it('parle dans la langue proposée et pointe vers la page équivalente', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/projects" />);

    expect(screen.getByText('This site is also available in English.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View in English/ })).toHaveAttribute('href', '/en/projects');
  });

  it("n'affiche rien à un visiteur francophone", () => {
    langues(['fr-FR']);
    const { container } = render(<LangSuggest lang="fr" altHref="/en/" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('mémorise le refus et disparaît', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/" />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });

    expect(localStorage.getItem(SUGGEST_DISMISSED_KEY)).toBe('1');
    expect(screen.queryByText(/also available/)).not.toBeInTheDocument();
  });

  it('mémorise le choix au clic sur le lien', () => {
    langues(['en-US']);
    render(<LangSuggest lang="fr" altHref="/en/" />);

    const bloque = (e: Event) => e.preventDefault();
    document.addEventListener('click', bloque);
    onTestFinished(() => document.removeEventListener('click', bloque));

    fireEvent.click(screen.getByRole('link', { name: /View in English/ }));

    expect(localStorage.getItem(LANG_CHOICE_KEY)).toBe('en');
  });

  it('ne plante pas quand localStorage est inaccessible', () => {
    langues(['en-US']);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    render(<LangSuggest lang="fr" altHref="/en/" />);
    expect(screen.getByText('This site is also available in English.')).toBeInTheDocument();

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    ).not.toThrow();
  });
});
