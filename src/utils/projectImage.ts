/**
 * Nom court d'un projet, affiché à la place de la capture quand elle manque :
 * la partie du titre avant « — » (« CKM66 — Le club… » → « CKM66 »).
 * Les initiales donnaient « CL » à la fois pour CKM66 et pour Cleo.
 */
export function shortName(title: string): string {
  const tete = title.split(' — ')[0].trim();
  return tete || title.trim();
}
