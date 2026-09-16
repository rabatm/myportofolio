import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENT, track } from './track';

function capturer(action: () => void): CustomEvent[] {
  const recus: CustomEvent[] = [];
  const ecouteur = (e: Event) => recus.push(e as CustomEvent);

  window.addEventListener(ANALYTICS_EVENT, ecouteur);
  action();
  window.removeEventListener(ANALYTICS_EVENT, ecouteur);

  return recus;
}

describe('track', () => {
  it('émet un CustomEvent portant le nom et le détail', () => {
    const recus = capturer(() => track('marvin_open', { source: 'pill', path: '/' }));

    expect(recus).toHaveLength(1);
    expect(recus[0].detail).toEqual({ name: 'marvin_open', source: 'pill', path: '/' });
  });

  it('accepte un événement sans détail', () => {
    const recus = capturer(() => track('marvin_peek_dismissed'));

    expect(recus[0].detail).toEqual({ name: 'marvin_peek_dismissed' });
  });

  it('émet un événement par appel, sans en perdre', () => {
    const recus = capturer(() => {
      track('marvin_peek_shown', { line: 'a' });
      track('marvin_message_sent', { length: 3 });
    });

    expect(recus.map((e) => e.detail.name)).toEqual([
      'marvin_peek_shown',
      'marvin_message_sent',
    ]);
  });
});
