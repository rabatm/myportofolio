import { describe, expect, it } from 'vitest';
import { shortName } from './projectImage';

describe('shortName', () => {
  it('garde la partie du titre avant le tiret cadratin', () => {
    expect(shortName('CKM66 — Le club de Krav Maga de Perpignan')).toBe('CKM66');
    expect(shortName('Cleo — Le chat de la barre de menu')).toBe('Cleo');
    expect(shortName('Jurisperform Licence — Le système')).toBe('Jurisperform Licence');
  });

  it('rend le titre entier quand il n’y a pas de tiret cadratin', () => {
    expect(shortName('BOMIQO')).toBe('BOMIQO');
    expect(shortName('Passerelle BBSoft - legacy')).toBe('Passerelle BBSoft - legacy');
  });

  it('ne rend jamais une chaîne vide', () => {
    expect(shortName(' — Sous-titre seul')).toBe('— Sous-titre seul');
  });
});
