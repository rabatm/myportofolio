/**
 * Émission des événements d'usage du dock.
 *
 * Aucun outil de mesure n'est installé dans ce dépôt. Plutôt que d'en
 * imposer un, on émet un CustomEvent sur window : brancher Plausible ou GA
 * un jour ne demandera qu'un écouteur de trois lignes dans BaseLayout, et
 * les tests n'ont aucune requête réseau à simuler.
 */

export const ANALYTICS_EVENT = 'marvin:analytics';

export type MarvinEventName =
  | 'marvin_peek_shown'
  | 'marvin_peek_dismissed'
  | 'marvin_open'
  | 'marvin_message_sent';

export function track(
  name: MarvinEventName,
  detail: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_EVENT, { detail: { name, ...detail } })
  );
}
