/**
 * Garde-fous anti-spam du formulaire de contact.
 *
 * Le formulaire ne peut pas servir de relais (destinataire et expéditeur
 * fixes, visiteur en Reply-To seulement) : ces garde-fous protègent la boîte
 * de Martin et le quota du compte SMTP contre l'inondation.
 */

/** Délai minimal entre l'affichage du formulaire et l'envoi. */
export const MIN_ELAPSED_MS = 3000;

/** Liens tolérés dans un message ; aucun dans le nom. */
export const MAX_LINKS = 3;

/**
 * IP du visiteur. Derrière Apache/Passenger, Node ne voit que le proxy : la
 * vraie IP est la DERNIÈRE entrée de X-Forwarded-For, ajoutée par Apache. Les
 * précédentes viennent du client et peuvent être inventées.
 */
export function clientIp(request: Request, connectionIp: string | undefined): string {
  const entrees = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return entrees.at(-1) ?? connectionIp ?? 'unknown';
}

/**
 * Le formulaire mesure lui-même le temps passé dessus (une durée : pas besoin
 * que les horloges du navigateur et du serveur soient d'accord). Sans mesure,
 * la requête n'est pas passée par le formulaire.
 */
export function isTooFast(elapsedMs: unknown): boolean {
  const ms = Number(elapsedMs);
  return elapsedMs === undefined || elapsedMs === null || !Number.isFinite(ms) || ms < MIN_ELAPSED_MS;
}

const LIEN_RE = /\bhttps?:\/\/|\bwww\./gi;

export function countLinks(text: string): number {
  return text.match(LIEN_RE)?.length ?? 0;
}

export function hasTooManyLinks(m: { name: string; message: string }): boolean {
  return countLinks(m.name) > 0 || countLinks(m.message) > MAX_LINKS;
}

export interface RateLimits {
  perIp: number;
  perIpWindowMs: number;
  global: number;
  globalWindowMs: number;
}

export const DEFAULT_LIMITS: RateLimits = {
  perIp: 3,
  perIpWindowMs: 60 * 60 * 1000,
  global: 20,
  globalWindowMs: 24 * 60 * 60 * 1000,
};

export type RateVerdict = 'ok' | 'ip' | 'global';

export interface RateLimiter {
  /** Enregistre un envoi s'il est autorisé ; un refus ne consomme rien. */
  hit(ip: string): RateVerdict;
  /** Nombre d'IP suivies (pour vérifier que la mémoire ne grossit pas). */
  trackedIps(): number;
}

/**
 * Fenêtres glissantes en mémoire. Elles repartent de zéro au redémarrage du
 * processus : suffisant pour un portfolio, sans base de données.
 */
export function createRateLimiter(limits: RateLimits = DEFAULT_LIMITS, now: () => number = Date.now): RateLimiter {
  const parIp = new Map<string, number[]>();
  let tous: number[] = [];

  const recents = (horodatages: number[], fenetre: number, t: number) =>
    horodatages.filter((h) => h > t - fenetre);

  return {
    hit(ip) {
      const t = now();

      // Ménage à chaque appel : une IP sans envoi récent est oubliée.
      for (const [cle, liste] of parIp) {
        const gardes = recents(liste, limits.perIpWindowMs, t);
        if (gardes.length) parIp.set(cle, gardes);
        else parIp.delete(cle);
      }
      tous = recents(tous, limits.globalWindowMs, t);

      const deCetteIp = parIp.get(ip) ?? [];
      if (deCetteIp.length >= limits.perIp) return 'ip';
      if (tous.length >= limits.global) return 'global';

      parIp.set(ip, [...deCetteIp, t]);
      tous.push(t);
      return 'ok';
    },
    trackedIps: () => parIp.size,
  };
}
