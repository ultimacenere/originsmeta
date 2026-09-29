/**
 * Statistiche personali del tracker per /account/tracker (30/09/2026): le partite dell'utente, lette con la sua
 * sessione (RLS: solo le proprie), riassunte qui. Sono dati suoi: niente soglie, a differenza delle statistiche anonime
 * (stats.ts). Funzioni pure, con i test in `upload.test.ts`.
 *
 * La coda (classificata o normale) non si mostra partita per partita, per la regola del tracker su bot e persone
 * (queue.ts): le righe lette dalla pagina non la chiedono nemmeno.
 */

/** Le colonne di tracked_matches che la pagina legge. */
export const OWN_MATCH_COLUMNS = "id, ended_at, created_at, result, patch, deck_name, deck_legendary, deck_list, opponent_legendary, turns";

export type OwnMatch = {
  id: string;
  ended_at: string | null;
  created_at: string;
  result: "W" | "L" | null;
  patch: string | null;
  deck_name: string | null;
  deck_legendary: string | null;
  deck_list: string | null;
  opponent_legendary: string | null;
  turns: number | null;
};

export type Record3 = { games: number; wins: number; losses: number };
export type DeckLine = Record3 & { key: string; name: string | null; legendary: string | null; lastAt: string | null };
export type OpponentLine = Record3 & { legendary: string };

export type PersonalStats = Record3 & {
  /** partite senza esito certo (contate a parte) */
  unknown: number;
  decks: DeckLine[];
  opponents: OpponentLine[];
  lastAt: string | null;
  /** patch delle partite, dalla più recente */
  patches: string[];
};

const when = (m: OwnMatch) => m.ended_at ?? m.created_at;
const tally = (list: OwnMatch[]): Record3 => ({
  games: list.filter((m) => m.result === "W" || m.result === "L").length,
  wins: list.filter((m) => m.result === "W").length,
  losses: list.filter((m) => m.result === "L").length,
});
const byMostGames = <T extends Record3>(a: T, b: T) => b.games - a.games || b.wins - a.wins;

export function personalStats(matches: readonly OwnMatch[]): PersonalStats {
  const sorted = [...matches].sort((a, b) => when(b).localeCompare(when(a)));
  const total = tally(sorted);

  // un mazzo = la lista esatta delle 13 carte; senza lista (partita senza replay) la Leggendaria
  const decks = new Map<string, OwnMatch[]>();
  for (const m of sorted) {
    const k = m.deck_list ?? (m.deck_legendary ? `legendary:${m.deck_legendary}` : "unknown");
    decks.set(k, [...(decks.get(k) ?? []), m]);
  }
  const opponents = new Map<string, OwnMatch[]>();
  for (const m of sorted) if (m.opponent_legendary) opponents.set(m.opponent_legendary, [...(opponents.get(m.opponent_legendary) ?? []), m]);

  return {
    ...total,
    unknown: sorted.length - total.games,
    decks: [...decks.entries()]
      .map(([key, list]) => ({
        key,
        // il nome più recente che il giocatore ha dato a quella lista
        name: list.find((m) => m.deck_name)?.deck_name ?? null,
        legendary: list.find((m) => m.deck_legendary)?.deck_legendary ?? null,
        lastAt: list[0] ? when(list[0]) : null,
        ...tally(list),
      }))
      .filter((d) => d.games > 0)
      .sort(byMostGames),
    opponents: [...opponents.entries()].map(([legendary, list]) => ({ legendary, ...tally(list) })).filter((o) => o.games > 0).sort(byMostGames),
    lastAt: sorted[0] ? when(sorted[0]) : null,
    patches: [...new Set(sorted.map((m) => m.patch).filter((p): p is string => Boolean(p)))],
  };
}

/** Le ultime partite, dalla più recente. */
export function recentMatches(matches: readonly OwnMatch[], n = 20): OwnMatch[] {
  return [...matches].sort((a, b) => when(b).localeCompare(when(a))).slice(0, n);
}
