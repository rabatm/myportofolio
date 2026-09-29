export function initials(title: string): string {
  const words = title.split(/[\s—-]+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
