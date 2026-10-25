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

/* ---------- le qualificazioni a confronto (22/10/2026) ---------- */

/** Una Leggendaria in una qualificazione. */
export type AcrossPoint = { banned: number; seen: number; banRate: number; submitted: number; share: number; banRank: number; submittedRank: number };

export type AcrossLegendary = {
  legendary: string;
  /** una voce per qualificazione con i numeri, nell'ordine del calendario; null dove la Leggendaria non è nella tabella */
  points: (AcrossPoint | null)[];
  /** tutte le qualificazioni insieme: ban e volte vista sommati */
  banned: number;
  seen: number;
  banRate: number;
  /** mazzi sommati, sulla somma dei mazzi delle tabelle */
  submitted: number;
  share: number;
  /** ultima qualificazione meno quella prima (null se la Leggendaria manca in una delle due) */
  banDelta: number | null;
  shareDelta: number | null;
};

/** Le Leggendarie di tutte le qualificazioni con i numeri, una colonna per qualificazione, dalla più bandita nell'insieme. */
export function acrossLegendaries(qualifiers: readonly CrimsonQualifier[]): AcrossLegendary[] {
  const list = withStats(qualifiers);
  const views = list.map((q) => new Map(legendaryViews(q.stats).map((v) => [v.legendary, v])));
  const allSubmitted = list.reduce((t, q) => t + submittedTotal(q.stats), 0);
  const slugs = [...new Set(list.flatMap((q) => q.stats.legendaries.map((r) => r.legendary)))];
  const delta = (pick: (p: AcrossPoint) => number, points: (AcrossPoint | null)[]) => {
    const [prev, last] = points.slice(-2);
    return points.length >= 2 && prev && last ? pick(last) - pick(prev) : null;
  };
  return slugs
    .map((legendary) => {
      const points = views.map((m): AcrossPoint | null => {
        const v = m.get(legendary);
        return v ? { banned: v.banned, seen: v.seen, banRate: v.banRate, submitted: v.submitted, share: v.share, banRank: v.banRank, submittedRank: v.submittedRank } : null;
      });
      const here = points.filter((p): p is AcrossPoint => p !== null);
      const banned = here.reduce((t, p) => t + p.banned, 0);
      const seen = here.reduce((t, p) => t + p.seen, 0);
      const submitted = here.reduce((t, p) => t + p.submitted, 0);
      return {
        legendary,
        points,
        banned,
        seen,
        banRate: seen > 0 ? banned / seen : 0,
        submitted,
        share: allSubmitted ? submitted / allSubmitted : 0,
        banDelta: delta((p) => p.banRate, points),
        shareDelta: delta((p) => p.share, points),
      };
    })
    .sort((a, b) => b.banRate - a.banRate || b.seen - a.seen || a.legendary.localeCompare(b.legendary));
}

export type AcrossCard = {
  card: string;
  /** una voce per qualificazione con i numeri; null dove la carta non è fra quelle pubblicate da Koin (non vuol dire zero) */
  points: ({ decks: number; share: number; rank: number } | null)[];
  /** in quante tabelle compare */
  inTop: number;
  /** quota media nelle tabelle in cui compare */
  avg: number;
  /** ultima qualificazione meno quella prima (null se la carta manca in una delle due) */
  delta: number | null;
};

/** Le carte pubblicate da Koin in almeno una qualificazione: prima quelle presenti in più tabelle, poi per quota media. */
export function acrossCards(qualifiers: readonly CrimsonQualifier[]): AcrossCard[] {
  const list = withStats(qualifiers);
  const slugs = [...new Set(list.flatMap((q) => q.stats.cards.map((c) => c.card)))];
  return slugs
    .map((card) => {
      const points = list.map((q) => {
        const i = q.stats.cards.findIndex((c) => c.card === card);
        return i >= 0 ? { decks: q.stats.cards[i].decks, share: q.stats.cards[i].share, rank: i + 1 } : null;
      });
      const here = points.filter((p) => p !== null);
      const [prev, last] = points.slice(-2);
      return {
        card,
        points,
        inTop: here.length,
        avg: here.length ? here.reduce((t, p) => t + p.share, 0) / here.length : 0,
        delta: points.length >= 2 && prev && last ? last.share - prev.share : null,
      };
    })
    .sort((a, b) => b.inTop - a.inTop || b.avg - a.avg || a.card.localeCompare(b.card));
}

export type AcrossHeadlines = {
  /** qualificazioni con i numeri */
  qualifiers: number;
  /** la Leggendaria prima per ban rate più volte (almeno due), con il suo ban rate più basso e più alto */
  topBanned?: { legendary: string; times: number; min: number; max: number };
  /** il cambio di ban rate più grande fra le ultime due qualificazioni, fra le Leggendarie viste almeno MIN_SEEN_FOR_STORY volte in tutte e due */
  mover?: { legendary: string; from: number; to: number; delta: number; prev: string; last: string };
  /** la carta prima nella tabella più volte (almeno due) */
  topCard?: { card: string; times: number };
  /** quante carte sono in tutte le tabelle, e quante carte ha la tabella più corta */
  alwaysCards: number;
  top: number;
};

const mostOften = (ids: string[]) => {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const best = [...counts].sort((a, b) => b[1] - a[1] || ids.indexOf(a[0]) - ids.indexOf(b[0]))[0];
  return best && best[1] >= 2 ? { id: best[0], times: best[1] } : undefined;
};

/** I fatti che legano le qualificazioni fra loro; vuoto con meno di due qualificazioni con i numeri. */
export function acrossHeadlines(qualifiers: readonly CrimsonQualifier[]): AcrossHeadlines {
  const list = withStats(qualifiers);
  const top = list.length ? Math.min(...list.map((q) => q.stats.cards.length)) : 0;
  if (list.length < 2) return { qualifiers: list.length, alwaysCards: 0, top };
  const legs = acrossLegendaries(list);
  const cards = acrossCards(list);

  const banned = mostOften(list.map((q) => legendaryViews(q.stats)[0]?.legendary).filter((s): s is string => Boolean(s)));
  const bannedRow = banned && legs.find((l) => l.legendary === banned.id);
  const rates = bannedRow ? bannedRow.points.filter((p) => p !== null).map((p) => p.banRate) : [];

  const movers = legs
    .map((l) => ({ l, prev: l.points[l.points.length - 2], last: l.points[l.points.length - 1] }))
    .filter((m) => m.prev && m.last && m.prev.seen >= MIN_SEEN_FOR_STORY && m.last.seen >= MIN_SEEN_FOR_STORY)
    .sort((a, b) => Math.abs(b.last!.banRate - b.prev!.banRate) - Math.abs(a.last!.banRate - a.prev!.banRate));
  const m = movers[0];

  const topCard = mostOften(list.map((q) => q.stats.cards[0]?.card).filter((s): s is string => Boolean(s)));

  return {
    qualifiers: list.length,
    topBanned: bannedRow ? { legendary: bannedRow.legendary, times: banned.times, min: Math.min(...rates), max: Math.max(...rates) } : undefined,
    mover:
      m && m.prev && m.last && m.last.banRate !== m.prev.banRate
        ? { legendary: m.l.legendary, from: m.prev.banRate, to: m.last.banRate, delta: m.last.banRate - m.prev.banRate, prev: list[list.length - 2].name, last: list[list.length - 1].name }
        : undefined,
    topCard: topCard ? { card: topCard.id, times: topCard.times } : undefined,
    alwaysCards: cards.filter((c) => c.inTop === list.length).length,
    top,
  };
}

/** Sostituisce i segnaposto {nome} di un testo. */
export const fillCrimson = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

/* ---------- le finali (25/10/2026): conteggi dalle liste dei quattro finalisti ---------- */

type FinalistLike = { decks: readonly { legendary: string; cards: readonly string[] }[] };

/** In quante terne dei finalisti c'è ogni Leggendaria, dalla più presente (a parità, nell'ordine in cui compare). */
export function finalsLegendaries(finalists: readonly FinalistLike[]): { legendary: string; players: number }[] {
  const seen = new Map<string, number>();
  for (const f of finalists) for (const l of new Set(f.decks.map((d) => d.legendary))) seen.set(l, (seen.get(l) ?? 0) + 1);
  return [...seen].map(([legendary, players]) => ({ legendary, players })).sort((a, b) => b.players - a.players);
}

/** In quanti mazzi delle finali c'è ogni carta (Leggendarie escluse), dalle più presenti; solo quelle in almeno `min` mazzi. */
export function finalsCards(finalists: readonly FinalistLike[], min = 1): { card: string; decks: number }[] {
  const seen = new Map<string, number>();
  for (const f of finalists) for (const d of f.decks) for (const c of new Set(d.cards)) seen.set(c, (seen.get(c) ?? 0) + 1);
  return [...seen]
    .map(([card, decks]) => ({ card, decks }))
    .filter((c) => c.decks >= min)
    .sort((a, b) => b.decks - a.decks || a.card.localeCompare(b.card));
}

/** I mazzi delle finali (tre per finalista). */
export const finalsDeckCount = (finalists: readonly FinalistLike[]): number => finalists.reduce((s, f) => s + f.decks.length, 0);
