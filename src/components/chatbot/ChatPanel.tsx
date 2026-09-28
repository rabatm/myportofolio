import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n/ui';
import type { Lang } from '../../i18n/utils';
import { TypewriterText } from './TypewriterText';
import type { Message } from './useMarvinThread';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  typing: boolean;
  canRetry: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onFinishTyping: () => void;
  lang?: Lang;
}

/** Le préfixe de terminal est décoratif : il ne part jamais vers l'API. */
function prefixe(role: Message['role']): string {
  if (role === 'user') return '$';
  if (role === 'error') return '!';
  return '>';
}

function couleur(role: Message['role']): string {
  if (role === 'user') return 'var(--marvin-user)';
  if (role === 'error') return 'var(--marvin-pill-fg)';
  return 'var(--marvin-fg)';
}

export function ChatPanel({
  messages,
  isLoading,
  typing,
  canRetry,
  onSend,
  onRetry,
  onClose,
  onFinishTyping,
  lang = 'fr',
}: ChatPanelProps) {
  const d = t(lang);
  const [saisie, setSaisie] = useState('');
  const champRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    champRef.current?.focus();
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing]);

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const propre = saisie.trim();
    if (!propre) return;

    setSaisie('');
    onSend(propre);
  }

  return (
    <section
      id="marvin-panneau"
      role="dialog"
      aria-modal="false"
      aria-labelledby="marvin-titre"
      className="marvin-panneau"
    >
      <header className="marvin-panneau__titre">
        <span className="marvin-panneau__poignee" aria-hidden="true" />
        <span id="marvin-titre">MARVIN-42</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={d['marvin.closeChat']}
          className="marvin-panneau__fermer"
        >
          ✕
        </button>
      </header>

      <div
        data-testid="marvin-historique"
        className="marvin-panneau__historique"
        aria-live="polite"
        onClick={() => typing && onFinishTyping()}
      >
        {messages.map((msg, i) => {
          const enFrappe =
            typing && i === messages.length - 1 && msg.role === 'assistant';

          return (
            <p key={i} style={{ color: couleur(msg.role) }}>
              <span aria-hidden="true">{prefixe(msg.role)} </span>
              {enFrappe ? (
                <TypewriterText text={msg.content} onDone={onFinishTyping} />
              ) : (
                msg.content
              )}
            </p>
          );
        })}

        {isLoading && (
          <p aria-hidden="true" style={{ color: 'var(--marvin-fg)' }}>
            &gt; <span className="animate-pulse">_</span>
          </p>
        )}

        {canRetry && (
          <button type="button" onClick={onRetry} className="marvin-panneau__reessayer">
            {d['marvin.retry']}
          </button>
        )}

        <div ref={finRef} />
      </div>

      <form onSubmit={envoyer} className="marvin-panneau__saisie">
        <span aria-hidden="true" style={{ color: 'var(--marvin-fg)' }}>
          $
        </span>
        <input
          ref={champRef}
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={d['marvin.placeholder']}
          aria-label={d['marvin.inputAria']}
          disabled={isLoading}
        />
        <button type="submit" aria-label={d['marvin.send']} disabled={isLoading}>
          ⏎
        </button>
      </form>
    </section>
  );
}

export default ChatPanel;
