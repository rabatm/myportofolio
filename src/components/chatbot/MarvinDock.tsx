import { useCallback, useEffect, useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import PeekBubble from './PeekBubble';
import { track } from './track';
import { useMarvinThread } from './useMarvinThread';
import { usePeek } from './usePeek';

interface MarvinDockProps {
  /** Répliques d'amorce de la page courante. Absent = pas de bulle. */
  peekLines?: string[];
}

/** Référence stable : un littéral par défaut relancerait l'effet à chaque rendu. */
const SANS_REPLIQUE: string[] = [];

export default function MarvinDock({ peekLines = SANS_REPLIQUE }: MarvinDockProps) {
  const [ouvert, setOuvert] = useState(false);
  const pastilleRef = useRef<HTMLButtonElement>(null);

  // Pas de `window` au rendu : ce composant est rendu côté serveur par
  // `client:idle`. Le chemin n'est connu qu'après hydratation.
  const [chemin, setChemin] = useState('');
  useEffect(() => setChemin(window.location.pathname), []);

  const { peek, dismissPeek, suppressPeek } = usePeek(chemin, peekLines);
  const fil = useMarvinThread();

  const ouvrir = useCallback(
    (source: 'pill' | 'bubble') => {
      suppressPeek();
      setOuvert(true);
      track('marvin_open', { source, path: chemin });
    },
    [chemin, suppressPeek]
  );

  const fermer = useCallback(() => {
    setOuvert(false);
    pastilleRef.current?.focus();
  }, []);

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
        className="marvin-pastille"
        aria-expanded={ouvert}
        aria-controls="marvin-panneau"
        aria-label={ouvert ? 'Fermer le chat MARVIN-42' : 'Ouvrir le chat MARVIN-42'}
        onClick={() => (ouvert ? fermer() : ouvrir('pill'))}
      >
        <span aria-hidden="true">$_</span>
      </button>
    </div>
  );
}
