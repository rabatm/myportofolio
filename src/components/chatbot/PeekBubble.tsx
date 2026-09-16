interface PeekBubbleProps {
  line: string;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * Bulle d'amorce : la réplique qui s'échappe de la pastille.
 *
 * `aria-hidden` et `tabIndex={-1}` viennent du §7 du brief — la bulle ne
 * doit jamais être annoncée ni prendre le focus. C'est une sollicitation,
 * pas un contrôle : la pastille, elle, est pleinement accessible.
 */
export function PeekBubble({ line, onOpen, onDismiss }: PeekBubbleProps) {
  return (
    <div aria-hidden="true" className="marvin-peek">
      <button
        type="button"
        data-testid="peek-corps"
        tabIndex={-1}
        onClick={onOpen}
        className="marvin-peek__corps"
      >
        {line}
      </button>

      <button
        type="button"
        data-testid="peek-fermer"
        tabIndex={-1}
        onClick={onDismiss}
        className="marvin-peek__fermer"
      >
        ✕
      </button>
    </div>
  );
}

export default PeekBubble;
