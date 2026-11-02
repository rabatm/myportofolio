import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findForbidden } from '../../lib/copyRules';

/** Ordre imposé des sections `##` d'une étude de cas client. */
const ORDRE = {
  fr: ['Contexte', 'Le besoin', 'La solution', 'Fonctionnalités', 'Côté technique'],
  en: ['Context', 'The need', 'The solution', 'Features', 'Under the hood'],
} as const;

/** Section facultative : seulement quand un résultat est documenté. */
const OPTIONNEL = { fr: 'Résultats', en: 'Results' } as const;

const ROOT = join(process.cwd(), 'src/content/projects');

function fichiersClients(lang: 'fr' | 'en') {
  return readdirSync(join(ROOT, lang))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ name: f, text: readFileSync(join(ROOT, lang, f), 'utf8') }))
    .filter(({ text }) => {
      const kind = /^kind:\s*['"]?(\w+)['"]?\s*$/m.exec(text.split(/^---\s*$/m)[1] ?? '');
      return kind?.[1] !== 'atelier';
    });
}

function titresH2(text: string): string[] {
  const corps = text.replace(/^---[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, '');
  return [...corps.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

for (const lang of ['fr', 'en'] as const) {
  describe(`études de cas ${lang}`, () => {
    for (const { name, text } of fichiersClients(lang)) {
      it(`${name} suit le plan imposé`, () => {
        const h2 = titresH2(text);
        const i = h2.indexOf(OPTIONNEL[lang]);
        if (i !== -1) expect(i).toBe(h2.length - 2);
        expect(h2.filter((t) => t !== OPTIONNEL[lang])).toEqual([...ORDRE[lang]]);
      });

      it(`${name} n'emploie aucune formule interdite`, () => {
        expect(findForbidden(text)).toEqual([]);
      });
    }
  });
}
