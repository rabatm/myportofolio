import { useCallback, useEffect, useRef, useState } from 'react';
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
}

/** Référence stable : un littéral par défaut relancerait l'effet à chaque rendu. */
const SANS_REPLIQUE: string[] = [];

export default function MarvinDock({
  peekLines = SANS_REPLIQUE,
  sectionLines,
}: MarvinDockProps) {
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
  const fil = useMarvinThread();

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
        aria-label={ouvert ? 'Fermer le chat MARVIN-42' : 'Ouvrir le chat MARVIN-42'}
        onClick={() => (ouvert ? fermer() : ouvrir('pill'))}
      >
        <span aria-hidden="true">$_</span>
        {/* Doublon visuel de l'aria-label : masqué aux lecteurs d'écran pour
            ne pas faire annoncer deux fois la même chose. */}
        <span className="marvin-pastille__libelle" aria-hidden="true">
          Parler à MARVIN-42
        </span>
      </button>
    </div>
  );
}
