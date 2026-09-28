import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';
import ChatPanel from './ChatPanel';
import PeekBubble from './PeekBubble';
import { track } from './track';
import { useMarvinThread } from './useMarvinThread';
import { usePeek } from './usePeek';

interface MarvinDockProps {
  /** Répliques d'amorce de la page courante. Absent = pas de bulle. */
  peekLines?: string[];
  /**
   * Répliques par section observable, indexées sur l'id du `<section>`.
   * Seule la page d'accueil en fournit : elle seule a des sections.
   */
  sectionLines?: Record<string, string[]>;
  /** Langue de la page : textes du dock et langue demandée à l'API. */
  lang?: Lang;
}

/** Référence stable : un littéral par défaut relancerait l'effet à chaque rendu. */
const SANS_REPLIQUE: string[] = [];

export default function MarvinDock({
  peekLines = SANS_REPLIQUE,
  sectionLines,
  lang = 'fr',
}: MarvinDockProps) {
  const d = t(lang);
  const [ouvert, setOuvert] = useState(false);
  const pastilleRef = useRef<HTMLButtonElement>(null);

  // Le battement n'appelle que ceux qui n'ont pas encore répondu : un dock qui
  // bat encore après qu'on a parlé à Marvin serait insistant pour rien.
  const [dejaOuvert, setDejaOuvert] = useState(false);

  // Pas de `window` au rendu : ce composant est rendu côté serveur par
  // `client:idle`. Le chemin n'est connu qu'après hydratation.
  const [chemin, setChemin] = useState('');
  useEffect(() => setChemin(window.location.pathname), []);

  const { peek, dismissPeek, suppressPeek } = usePeek(
    chemin,
    peekLines,
    sectionLines,
    ouvert
  );
  const fil = useMarvinThread(lang);

  const ouvrir = useCallback(
    (source: 'pill' | 'bubble') => {
      suppressPeek();
      setOuvert(true);
      setDejaOuvert(true);
      track('marvin_open', { source, path: chemin });
    },
    [chemin, suppressPeek]
  );

  // Le focus ne peut pas revenir dans la même passe que la fermeture : React
  // n'a pas encore committé, le panneau est toujours monté, et sous 640 px la
  // règle `.marvin-dock:has(.marvin-panneau) .marvin-pastille { display: none }`
  // s'applique donc encore. focus() sur un élément display:none ne fait rien et
  // ne se rejoue pas. On attend le commit.
  const focusARendre = useRef(false);

  const fermer = useCallback(() => {
    focusARendre.current = true;
    setOuvert(false);
  }, []);

  useEffect(() => {
    if (ouvert || !focusARendre.current) return;
    focusARendre.current = false;
    pastilleRef.current?.focus();
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    document.addEventListener('keydown', surTouche);

    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, fermer]);

  return (
    <div className="marvin-dock">
      {ouvert && (
        <ChatPanel
          messages={fil.messages}
          isLoading={fil.isLoading}
          typing={fil.typing}
          canRetry={fil.canRetry}
          onSend={fil.send}
          onRetry={fil.retry}
          onClose={fermer}
          onFinishTyping={fil.finishTyping}
          lang={lang}
        />
      )}

      {!ouvert && peek && (
        <PeekBubble line={peek} onOpen={() => ouvrir('bubble')} onDismiss={dismissPeek} />
      )}

      <button
        ref={pastilleRef}
        type="button"
        className={
          ouvert || dejaOuvert ? 'marvin-pastille' : 'marvin-pastille marvin-pastille--appel'
        }
        aria-expanded={ouvert}
        aria-controls="marvin-panneau"
        aria-label={ouvert ? d['marvin.pillClose'] : d['marvin.pillOpen']}
        onClick={() => (ouvert ? fermer() : ouvrir('pill'))}
      >
        <span aria-hidden="true">$_</span>
        {/* Deux libellés, un par point de rupture : le texte diffère et le CSS
            ne peut pas changer le contenu d'un élément existant. Tous deux
            masqués aux lecteurs d'écran — l'aria-label du bouton porte déjà le
            nom accessible, et l'annoncer deux fois serait du bruit. */}
        <span
          className="marvin-pastille__libelle marvin-pastille__libelle--long"
          aria-hidden="true"
        >
          {d['marvin.pillLong']}
        </span>
        <span
          className="marvin-pastille__libelle marvin-pastille__libelle--court"
          aria-hidden="true"
        >
          MARVIN
        </span>
      </button>
    </div>
  );
}
