/** Formules creuses bannies des textes commerciaux (minuscules). */
export const FORBIDDEN_PHRASES: readonly string[] = [
  'transformation digitale',
  'propulser',
  'propulse',
  'libérer le potentiel',
  'libérez le potentiel',
  'adn',
  'demander un devis',
  'audit gratuit',
  'consultation gratuite',
  'digital transformation',
  'propel',
  'unlock the potential',
  'in your dna',
  'free audit',
  'free consultation',
  'request a quote',
];

/** « adn » ne compte que comme mot entier (pas dans « cadnas »). */
const WHOLE_WORD = new Set(['adn']);

function contains(text: string, phrase: string): boolean {
  if (!WHOLE_WORD.has(phrase)) return text.includes(phrase);
  return new RegExp(`(?<!\\p{L})${phrase}(?!\\p{L})`, 'u').test(text);
}

/** Renvoie les formules interdites présentes dans le texte, sans tenir compte de la casse. */
export function findForbidden(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_PHRASES.filter((p) => contains(lower, p));
}
