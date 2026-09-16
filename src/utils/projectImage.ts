import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function hasImage(image: string | undefined): boolean {
  if (!image) return false;
  return existsSync(join(process.cwd(), 'public', image));
}

export function initials(title: string): string {
  const words = title.split(/[\s—-]+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
