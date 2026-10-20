import type { CrimsonCardRow, CrimsonLegendaryRow, CrimsonQualifier, CrimsonStats } from "./data/crimsonCup";

/**
 * Crimson Cup: i numeri derivati dalle tabelle ufficiali di Koin (src/lib/data/crimsonCup.ts), per la pagina
 * /analytics/crimson-cup, le schede carta e la fascia di /analytics (20/10/2026). Funzioni pure, senza import a runtime
 * (`node --test src/lib/crimsonCup.test.ts`): i dati si passano come argomenti.
 *
 * Regole:
 * - il ban rate è banned / seen, come lo calcola Koin; la quota di una Leggendaria è sui mazzi consegnati contati nella
 *   tabella delle Leggendarie (`submittedTotal`), mai su un totale che Koin non ha scritto;
 * - le quote delle carte sono quelle pubblicate da Koin, a un decimale, senza ricalcoli;
 * - il confronto con il ladder usa i dati del Tracker come li legge /analytics: per le Leggendarie la quota delle presenze
 *   in campo contando i due lati (`bothSides` di tracker/snapshot.ts), per le carte la quota delle partite registrate con
 *   la carta nel mazzo di chi registra. Sono misure diverse da quelle del torneo (mazzi consegnati) e la pagina lo dice.
 */

export type QualifierWithStats = CrimsonQualifier & { stats: CrimsonStats };

/** Sotto quante volte "vista" al ban una Leggendaria non fa notizia come "la meno bandita" (Wicked Stepmother: 1 su 9). */
export const MIN_SEEN_FOR_STORY = 30;

export const banRate = (row: Pick<CrimsonLegendaryRow, "banned" | "seen">): number => (row.seen > 0 ? row.banned / row.seen : 0);

/** I mazzi consegnati contati nella tabella delle Leggendarie (la base delle quote). */
export const submittedTotal = (stats: Pick<CrimsonStats, "legendaries">): number => stats.legendaries.reduce((s, r) => s + r.submitted, 0);

/** Le qualificazioni con i numeri, nell'ordine del calendario. */
export const withStats = (qualifiers: readonly CrimsonQualifier[]): QualifierWithStats[] => qualifiers.filter((q): q is QualifierWithStats => Boolean(q.stats));

/** L'ultima qualificazione con i numeri: quella che la pagina apre per prima. */
export function latestWithStats(qualifiers: readonly CrimsonQualifier[]): QualifierWithStats | undefined {
  const list = withStats(qualifiers);
  return list[list.length - 1];
}

export type LegendaryView = CrimsonLegendaryRow & {
  banRate: number;
  /** quota dei mazzi consegnati */
  share: number;
  /** posizione per ban rate (1 = la più bandita) */
  banRank: number;
  /** posizione per mazzi consegnati (1 = la più portata) */
  submittedRank: number;
};

/** Ordine per ban rate: a pari valore conta chi è stata vista più volte, poi il nome. */
const byBan = (a: CrimsonLegendaryRow, b: CrimsonLegendaryRow) => banRate(b) - banRate(a) || b.seen - a.seen || a.legendary.localeCompare(b.legendary);
const bySubmitted = (a: CrimsonLegendaryRow, b: CrimsonLegendaryRow) => b.submitted - a.submitted || b.seen - a.seen || a.legendary.localeCompare(b.legendary);

/** Le Leggendarie di una qualificazione con ban rate, quota e posizioni, dalla più bandita. */
export function legendaryViews(stats: Pick<CrimsonStats, "legendaries">): LegendaryView[] {
  const total = submittedTotal(stats);
  const banOrder = [...stats.legendaries].sort(byBan).map((r) => r.legendary);
  const subOrder = [...stats.legendaries].sort(bySubmitted).map((r) => r.legendary);
  return [...stats.legendaries].sort(byBan).map((r) => ({
    ...r,
    banRate: banRate(r),
    share: total ? r.submitted / total : 0,
    banRank: banOrder.indexOf(r.legendary) + 1,
    submittedRank: subOrder.indexOf(r.legendary) + 1,
  }));
}

export type Headlines = {
  mostBanned?: LegendaryView;
  mostSubmitted?: LegendaryView;
  /** la meno bandita fra quelle viste almeno MIN_SEEN_FOR_STORY volte */
  leastBanned?: LegendaryView;
  topCard?: CrimsonCardRow;
  /** quante Leggendarie hanno almeno un mazzo arrivato al turno dei qualificati */
  reachedQualify: number;
  legendaries: number;
};

export function headlines(stats: CrimsonStats): Headlines {
  const views = legendaryViews(stats);
  const sure = views.filter((v) => v.seen >= MIN_SEEN_FOR_STORY);
  return {
    mostBanned: views[0],
    mostSubmitted: [...views].sort(bySubmitted)[0],
    leastBanned: sure.length > 1 ? sure[sure.length - 1] : undefined,
    topCard: stats.cards[0],
    reachedQualify: views.filter((v) => v.deepest >= stats.qualifyRound).length,
    legendaries: views.length,
  };
}

/** Quello che una scheda carta può dire della Crimson Cup, per ogni qualificazione con i numeri (dalla più recente). */
export type CardCrimsonFact =
  | ({ kind: "legendary"; qualifier: string; count: number; qualifyRound: number } & Omit<LegendaryView, "legendary" | "played">)
  | { kind: "card"; qualifier: string; decks: number; share: number; rank: number; count: number };

export function cardCrimsonFacts(slug: string, qualifiers: readonly CrimsonQualifier[]): CardCrimsonFact[] {
  const out: CardCrimsonFact[] = [];
  for (const q of withStats(qualifiers).reverse()) {
    const views = legendaryViews(q.stats);
    const leg = views.find((v) => v.legendary === slug);
    if (leg) {
      const { banned, seen, submitted, deepest, banRate: rate, share, banRank, submittedRank } = leg;
      out.push({ kind: "legendary", qualifier: q.name, count: views.length, qualifyRound: q.stats.qualifyRound, banned, seen, submitted, deepest, banRate: rate, share, banRank, submittedRank });
      continue;
    }
    const i = q.stats.cards.findIndex((c) => c.card === slug);
    if (i >= 0) out.push({ kind: "card", qualifier: q.name, decks: q.stats.cards[i].decks, share: q.stats.cards[i].share, rank: i + 1, count: q.stats.cards.length });
  }
  return out;
}

/** Le carte (Leggendarie comprese) di cui la Crimson Cup ha numeri: le schede che li mostrano. */
export function crimsonCardSlugs(qualifiers: readonly CrimsonQualifier[]): Set<string> {
  const out = new Set<string>();
  for (const q of withStats(qualifiers)) {
    for (const r of q.stats.legendaries) out.add(r.legendary);
    for (const c of q.stats.cards) out.add(c.card);
  }
  return out;
}

/** Il giorno più recente in cui abbiamo letto numeri che riguardano una carta (per le date delle schede). */
export function crimsonCardDay(slug: string, qualifiers: readonly CrimsonQualifier[]): string | undefined {
  const days = withStats(qualifiers)
    .filter((q) => q.stats.legendaries.some((r) => r.legendary === slug) || q.stats.cards.some((c) => c.card === slug))
    .map((q) => q.stats.read)
    .sort();
  return days[days.length - 1];
}

/* ---------- torneo contro ladder ---------- */

/** Una Leggendaria nel ladder (Tracker): quota delle presenze in campo, win rate e partite, contando i due lati. */
export type LadderLegendary = { share: number; r: number; games: number };

export type VersusLegendary = {
  legendary: string;
  /** quota dei mazzi consegnati nel torneo */
  crimson: number;
  /** quota delle presenze in campo nel ladder; null se il Tracker non ne ha */
  ladder: number | null;
  /** crimson − ladder (positivo: più portata nel torneo che giocata nel ladder) */
  diff: number | null;
  banRate: number;
  ladderR: number | null;
  ladderGames: number;
};

/** Le Leggendarie del torneo accanto al ladder, dalla più "sovrarappresentata" nel torneo; senza dati del ladder in fondo. */
export function versusLegendaries(views: readonly LegendaryView[], ladder: ReadonlyMap<string, LadderLegendary>): VersusLegendary[] {
  return views
    .map((v) => {
      const l = ladder.get(v.legendary);
      return {
        legendary: v.legendary,
        crimson: v.share,
        ladder: l ? l.share : null,
        diff: l ? v.share - l.share : null,
        banRate: v.banRate,
        ladderR: l ? l.r : null,
        ladderGames: l?.games ?? 0,
      };
    })
    .sort((a, b) => (a.diff === null ? 1 : 0) - (b.diff === null ? 1 : 0) || (b.diff ?? 0) - (a.diff ?? 0) || b.crimson - a.crimson);
}

export type VersusCard = { card: string; crimson: number; ladder: number | null; diff: number | null };

/** Le carte più giocate del torneo, nell'ordine di Koin, con la quota nel ladder accanto (null se il Tracker non la vede). */
export function versusCards(cards: readonly CrimsonCardRow[], ladder: ReadonlyMap<string, number>): VersusCard[] {
  return cards.map((c) => {
    const l = ladder.get(c.card);
    return { card: c.card, crimson: c.share, ladder: l ?? null, diff: l === undefined ? null : c.share - l };
  });
}

/** Le due differenze più grandi (più portata nel torneo, meno portata), per le frasi della sezione; solo con il ladder. */
export function biggestGaps<T extends { diff: number | null }>(rows: readonly T[]): { up?: T; down?: T } {
  const known = rows.filter((r) => r.diff !== null);
  if (known.length < 2) return {};
  const sorted = [...known].sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0));
  const up = sorted[0];
  const down = sorted[sorted.length - 1];
  return { up: (up.diff ?? 0) > 0 ? up : undefined, down: (down.diff ?? 0) < 0 ? down : undefined };
}

/** Sostituisce i segnaposto {nome} di un testo. */
export const fillCrimson = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
