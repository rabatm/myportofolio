import type { ServiceId } from '../data/services';

export interface SelectableData {
  services: ServiceId[];
  kind: 'client' | 'atelier';
  /** Rang sur l'accueil, 1 = premier. */
  featured?: number;
}

type Item = { entry: { data: SelectableData } };

export function clientProjects<T extends Item>(items: T[]): T[] {
  return items.filter((i) => i.entry.data.kind === 'client');
}

export function atelierProjects<T extends Item>(items: T[]): T[] {
  return items.filter((i) => i.entry.data.kind === 'atelier');
}

export function featuredProjects<T extends Item>(items: T[], max = 3): T[] {
  return clientProjects(items)
    .filter((i) => i.entry.data.featured !== undefined)
    .sort((a, b) => a.entry.data.featured! - b.entry.data.featured!)
    .slice(0, max);
}

export function projectsForService<T extends Item>(items: T[], id: ServiceId): T[] {
  return clientProjects(items).filter((i) => i.entry.data.services.includes(id));
}
