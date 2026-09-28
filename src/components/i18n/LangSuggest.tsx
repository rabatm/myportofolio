import { useEffect, useState } from 'react';
import { t } from '../../i18n/ui';
import { LANG_CHOICE_KEY, type Lang } from '../../i18n/utils';

export const SUGGEST_DISMISSED_KEY = 'lang-suggest-dismissed';

/**
 * Langue à proposer, ou null. On ne propose l'anglais qu'aux navigateurs
 * sans aucune langue française, et le français qu'aux francophones égarés
 * sur /en. Un choix explicite (switch, bandeau) ou un refus fait taire le
 * bandeau pour de bon. Jamais de redirection : les liens partagés et les
 * robots voient toujours la page demandée.
 */
export function suggestTarget(
  pageLang: Lang,
  browserLangs: readonly string[],
  stored: { choice: string | null; dismissed: string | null }
): Lang | null {
  if (stored.choice || stored.dismissed) return null;
  if (browserLangs.length === 0) return null;

  const francophone = browserLangs.some((l) => l.toLowerCase().startsWith('fr'));
  if (pageLang === 'fr' && !francophone) return 'en';
  if (pageLang === 'en' && francophone) return 'fr';
  return null;
}

// Safari en navigation privée lève sur localStorage : le bandeau doit
// survivre, quitte à réapparaître à la page suivante.
function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* voir lire() */
  }
}

interface LangSuggestProps {
  lang: Lang;
  /** Page équivalente dans l'autre langue. */
  altHref: string;
}

export default function LangSuggest({ lang, altHref }: LangSuggestProps) {
  // Décidé après hydratation seulement : ni navigator ni localStorage côté serveur.
  const [cible, setCible] = useState<Lang | null>(null);

  useEffect(() => {
    const navigateur = navigator.languages?.length ? navigator.languages : [navigator.language];
    setCible(
      suggestTarget(lang, navigateur.filter(Boolean), {
        choice: lire(LANG_CHOICE_KEY),
        dismissed: lire(SUGGEST_DISMISSED_KEY),
      })
    );
  }, [lang]);

  if (!cible) return null;

  // Le bandeau parle la langue qu'il propose : c'est la seule que le visiteur lit à coup sûr.
  const d = t(cible);

  return (
    <div className="lang-suggest" role="region" aria-label={d['suggest.text']} lang={cible}>
      <span>
        <span aria-hidden="true">&gt; </span>
        {d['suggest.text']}
      </span>
      <a
        href={altHref}
        hrefLang={cible}
        data-lang-switch={cible}
        onClick={() => ecrire(LANG_CHOICE_KEY, cible)}
      >
        [{d['suggest.action']}]
      </a>
      <button
        type="button"
        aria-label={d['suggest.dismiss']}
        onClick={() => {
          ecrire(SUGGEST_DISMISSED_KEY, '1');
          setCible(null);
        }}
      >
        ×
      </button>
    </div>
  );
}
