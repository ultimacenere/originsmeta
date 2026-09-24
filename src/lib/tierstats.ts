/**
 * Numeri della sezione Tier list, in funzioni pure (niente import: `node --test` le esegue senza il resto del sito).
 * Riprogettazione del 24/09/2026 (§1 punto 32 della KB, decisioni di Pierluigi):
 * - la tier list della community è la media delle tier list salvate dagli iscritti (S=5 … D=1), con il numero di
 *   voti e la distribuzione per fascia di ogni carta; si chiama "della community" solo da `COMMUNITY_MIN_LISTS`
 *   liste in su, sotto è un'anteprima;
 * - "Le più giocate" conta in quanti mazzi pubblicati compare ogni carta (non è un win rate);
 * - i mazzi si ordinano per voto pesato sul numero di voti, mai per media semplice (con un voto solo un 5 stelle
 *   passerebbe davanti a un 4,3 con tre voti: Baymard, "Use Both Ratings Average and Number of Ratings").
 */

export type Tier = "S" | "A" | "B" | "C" | "D";
export const TIER_ORDER: readonly Tier[] = ["S", "A", "B", "C", "D"];

/** Punti di ogni fascia nella media della community. */
export const TIER_POINTS: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

/** Da quante tier list salvate la classifica si chiama "della community" (Pierluigi, 24/09/2026). Sotto è un'anteprima. */
export const COMMUNITY_MIN_LISTS = 5;

export type CardScore = { slug: string; avg: number; votes: number; dist: Record<Tier, number>; tier: Tier };

/** La fascia di una media: 4,5 e oltre è S, sotto 1,5 è D (le stesse soglie della vista SQL `tier_card_scores`). */
export function tierFromAverage(avg: number): Tier {
  if (avg >= 4.5) return "S";
  if (avg >= 3.5) return "A";
  if (avg >= 2.5) return "B";
  if (avg >= 1.5) return "C";
  return "D";
}

const emptyDist = (): Record<Tier, number> => ({ S: 0, A: 0, B: 0, C: 0, D: 0 });

/**
 * Media, voti e distribuzione per carta a partire dalle fasce salvate (`tier_lists.entries`, es. {"S":["dorothy"]}).
 * Si leggono solo le cinque fasce e solo stringhe; se in una lista la stessa carta compare due volte conta la
 * fascia più alta, una volta sola. Le carte lasciate fra le non classificate non ci sono, quindi non votano
 * (le classifiche a trascinamento non devono contare come classificato ciò che nessuno ha toccato).
 */
export function aggregateLists(lists: readonly { entries: unknown }[]): CardScore[] {
  const acc = new Map<string, { sum: number; votes: number; dist: Record<Tier, number> }>();
  for (const list of lists) {
    const entries = list.entries;
    if (!entries || typeof entries !== "object") continue;
    const seen = new Set<string>();
    for (const tier of TIER_ORDER) {
      const slugs = (entries as Record<string, unknown>)[tier];
      if (!Array.isArray(slugs)) continue;
      for (const slug of slugs) {
        if (typeof slug !== "string" || !slug || seen.has(slug)) continue;
        seen.add(slug);
        const row = acc.get(slug) ?? { sum: 0, votes: 0, dist: emptyDist() };
        row.sum += TIER_POINTS[tier];
        row.votes += 1;
        row.dist[tier] += 1;
        acc.set(slug, row);
      }
    }
  }
  return Array.from(acc, ([slug, r]) => {
    const avg = Math.round((r.sum / r.votes) * 100) / 100;
    return { slug, avg, votes: r.votes, dist: r.dist, tier: tierFromAverage(avg) };
  }).sort((a, b) => b.avg - a.avg || b.votes - a.votes || a.slug.localeCompare(b.slug));
}

/**
 * In quanti mazzi compare ogni carta: la Leggendaria a parte, le carte base una volta per mazzo anche se il mazzo
 * ne ha due copie. È la misura di "Le più giocate": popolarità fra i mazzi pubblicati, non forza.
 */
export function usageCounts(decks: readonly { legendary: string | null; cards: readonly string[] }[]): {
  legendaries: Record<string, number>;
  cards: Record<string, number>;
} {
  const legendaries: Record<string, number> = {};
  const cards: Record<string, number> = {};
  for (const deck of decks) {
    if (deck.legendary) legendaries[deck.legendary] = (legendaries[deck.legendary] ?? 0) + 1;
    for (const slug of new Set(deck.cards)) {
      if (slug === deck.legendary) continue;
      cards[slug] = (cards[slug] ?? 0) + 1;
    }
  }
  return { legendaries, cards };
}

/**
 * Voto pesato sul numero di voti (media bayesiana): parte da `prior` con il peso di `weight` voti immaginari, così
 * un solo 5 stelle non vale più di tre 4,3. Con zero voti restituisce `prior`: chi ordina mette in fondo i mazzi
 * senza voti prima di guardare questo numero.
 */
export function weightedRating(avg: number, votes: number, prior = 3, weight = 2): number {
  if (votes <= 0) return prior;
  return (prior * weight + avg * votes) / (weight + votes);
}
