/*
  I numeri della pagina pubblica di un iscritto, /u/<nome>, nella grafica «In onda» (27/11/2026, scelta di Pierluigi fra
  i tre prototipi). Funzioni pure, senza import del sito (solo tipi), provate da profileOnda.test.ts.

  Il win rate di un mazzo è quello della sua lista esatta (13 carte) dal Tracker: le partite registrate da chiunque
  giochi le stesse carte, nella patch delle statistiche (aggregato pubblico, lo stesso del riquadro della scheda del
  mazzo e della pastiglia di /decks). Mai il numero di giocatori.

  «Contro il meta» confronta le sue liste con le ALTRE liste della stessa Leggendaria, tutte e due dal lato di chi
  registra (tracker_stats_legendaries meno le sue liste): stesso sbilanciamento da tutte e due le parti, quindi un
  confronto equo senza migrazioni. Nel prototipo il meta contava i due lati e favoriva le liste.
*/

export type Count = { games: number; wins: number };

/** Il minimo di partite per parte perché il confronto dia un verdetto: uguale a THIN_GAMES di snapshot.ts (il test lo controlla). */
export const VS_MIN_GAMES = 20;
/** Scarto in punti percentuali sotto il quale le due parti sono "in linea". */
export const VS_EVEN_POINTS = 2;

export type ListDeck = {
  legendary: string | null;
  /** le 12 carte base, con le copie */
  cards: readonly string[];
  winrate: Count | null;
};

/** La firma di una lista (Leggendaria + carte in ordine alfabetico): due mazzi con la stessa lista contano una volta. */
export const listSig = (d: Pick<ListDeck, "legendary" | "cards">) => `${d.legendary ?? "-"}|${[...d.cards].sort().join(",")}`;

/** I mazzi con partite registrate, ogni lista una volta sola (vince il primo dell'elenco). */
export function playedLists<T extends ListDeck>(decks: readonly T[]): (T & { winrate: Count })[] {
  const seen = new Set<string>();
  const out: (T & { winrate: Count })[] = [];
  for (const d of decks) {
    if (!d.winrate || d.winrate.games <= 0) continue;
    const sig = listSig(d);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(d as T & { winrate: Count });
  }
  return out;
}

/** Partite e vittorie di tutte le sue liste (ognuna una volta), per il tabellone in testa. */
export function listTotals(decks: readonly ListDeck[]): Count {
  return playedLists(decks).reduce((s, d) => ({ games: s.games + d.winrate.games, wins: s.wins + d.winrate.wins }), { games: 0, wins: 0 });
}

const rate = (c: Count) => (c.games > 0 ? c.wins / c.games : 0);

export type VsRow = { legendary: string; mine: Count; others: Count; diff: number; verdict: "better" | "worse" | "even" | "thin" };

/**
 * Per ogni Leggendaria delle sue liste con partite: le sue liste contro le altre liste della stessa Leggendaria nella
 * patch (`legendaries` = partite dal lato di chi registra, per Leggendaria). Senza altre partite la riga non c'è (le sue
 * liste sarebbero tutto il meta). `diff` in punti percentuali, con un decimale.
 */
export function vsMeta(decks: readonly ListDeck[], legendaries: readonly ({ legendary: string } & Count)[]): VsRow[] {
  const mine = new Map<string, Count>();
  for (const d of playedLists(decks)) {
    if (!d.legendary) continue;
    const c = mine.get(d.legendary) ?? { games: 0, wins: 0 };
    mine.set(d.legendary, { games: c.games + d.winrate.games, wins: c.wins + d.winrate.wins });
  }
  const out: VsRow[] = [];
  for (const [legendary, m] of mine) {
    const all = legendaries.find((l) => l.legendary === legendary);
    if (!all) continue;
    const others = { games: Math.max(0, all.games - m.games), wins: Math.max(0, Math.min(all.wins - m.wins, all.games - m.games)) };
    if (others.games <= 0) continue;
    const diff = Math.round((rate(m) - rate(others)) * 1000) / 10;
    const thin = m.games < VS_MIN_GAMES || others.games < VS_MIN_GAMES;
    const verdict = thin ? "thin" : diff >= VS_EVEN_POINTS ? "better" : diff <= -VS_EVEN_POINTS ? "worse" : "even";
    out.push({ legendary, mine: m, others, diff, verdict });
  }
  return out.sort((a, b) => b.mine.games - a.mine.games || a.legendary.localeCompare(b.legendary));
}

/** La Leggendaria più presente nei suoi mazzi (a pari merito quella del mazzo più recente, il primo dell'elenco). */
export function mostUsedLegendary(decks: readonly Pick<ListDeck, "legendary">[]): string | null {
  const count = new Map<string, number>();
  for (const d of decks) if (d.legendary) count.set(d.legendary, (count.get(d.legendary) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [slug, c] of count) {
    if (c > n) {
      best = slug;
      n = c;
    }
  }
  return best;
}
