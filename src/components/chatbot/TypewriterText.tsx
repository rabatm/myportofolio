import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './usePeek';

/** Durée totale de la frappe, quelle que soit la longueur du texte. */
export const TYPE_BUDGET_MS = 2_000;

/** Un battement par image environ : plus fin ne se voit pas. */
const BATTEMENT_MS = 16;

interface TypewriterTextProps {
  text: string;
  onDone?: () => void;
}

/**
 * Frappe caractère par caractère, à budget constant.
 *
 * L'ancien composant avançait de 15 ms par caractère : une réponse de 400
 * signes mettait six secondes, illisible en diagonale dans un panneau
 * étroit. Ici c'est le nombre de caractères par battement qui s'adapte au
 * texte, pas la durée.
 */
export function TypewriterText({ text, onDone }: TypewriterTextProps) {
  const reduit = prefersReducedMotion();
  const [affiche, setAffiche] = useState(reduit ? text : '');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduit) {
      setAffiche(text);
      onDoneRef.current?.();
      return;
    }

    setAffiche('');

    const battements = Math.max(1, Math.round(TYPE_BUDGET_MS / BATTEMENT_MS));
    const pas = Math.max(1, Math.ceil(text.length / battements));
    let i = 0;

    const minuterie = setInterval(() => {
      i = Math.min(i + pas, text.length);
      setAffiche(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(minuterie);
        onDoneRef.current?.();
      }
    }, BATTEMENT_MS);

    return () => clearInterval(minuterie);
  }, [text, reduit]);

  const fini = affiche.length >= text.length;

  return (
    <>
      {/* Masqué aux lecteurs d'écran : sans ça, la région aria-live du
          panneau annoncerait le texte par fragments à chaque battement. */}
      <span aria-hidden="true">{affiche}</span>
      {/* Dans ChatPanel, la fin de frappe et l'arrêt de l'état `typing`
          arrivent dans le même rendu (callback d'intervalle batché par
          React) : ce composant est alors démonté et remplacé par le texte
          brut, non `aria-hidden`, qui porte l'annonce à la région aria-live.
          Ce jumeau `sr-only` ne joue donc aucun rôle dans ce parcours-là ;
          il reste le repli correct pour tout appelant qui garde ce
          composant monté une fois la frappe terminée, et c'est lui que
          couvrent les tests d'isolation. */}
      {fini && <span className="sr-only">{text}</span>}
    </>
  );
}

export default TypewriterText;
