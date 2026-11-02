import { describe, expect, it } from 'vitest';
import type { ServiceId } from '../data/services';
import {
  atelierProjects,
  clientProjects,
  featuredProjects,
  projectsForService,
  type SelectableData,
} from './projectSelect';

let n = 0;
function p(
  services: ServiceId[],
  kind: SelectableData['kind'] = 'client',
  featured?: number,
  isFallback = false,
) {
  return { id: ++n, isFallback, entry: { data: { services, kind, featured } } };
}

describe('featuredProjects', () => {
  it('renvoie les rangs 1, 2, 3 dans l’ordre', () => {
    const c = p([], 'client', 3);
    const a = p([], 'client', 1);
    const b = p([], 'client', 2);
    expect(featuredProjects([c, p([]), a, b])).toEqual([a, b, c]);
  });

  it('ignore un projet atelier même avec featured: 1', () => {
    const atelier = p([], 'atelier', 1);
    const client = p([], 'client', 2);
    expect(featuredProjects([atelier, client])).toEqual([client]);
  });

  it('respecte max', () => {
    const items = [p([], 'client', 1), p([], 'client', 2), p([], 'client', 3)];
    expect(featuredProjects(items, 2)).toEqual(items.slice(0, 2));
  });
});

describe('projectsForService', () => {
  it('ne garde que les projets client du service, dans l’ordre d’entrée, repli de langue compris', () => {
    const a = p(['integration']);
    const b = p(['web']);
    const c = p(['web', 'integration'], 'client', undefined, true);
    const d = p(['integration'], 'atelier');
    expect(projectsForService([a, b, c, d], 'integration')).toEqual([a, c]);
  });
});

describe('clientProjects / atelierProjects', () => {
  it('partitionnent la liste', () => {
    const a = p([]);
    const b = p([], 'atelier');
    const c = p([]);
    expect(clientProjects([a, b, c])).toEqual([a, c]);
    expect(atelierProjects([a, b, c])).toEqual([b]);
  });
});
