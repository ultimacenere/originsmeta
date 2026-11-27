import type { GameCardInput } from "@/game-card/model";
import type { ReplayChange, ReplayPatch, ReplayTierOrNone } from "@/lib/tierReplay/types";
import { wilson } from "@/lib/tracker/snapshot";
import { TIER_RULE } from "@/lib/tierRule";
import { fill, type ReplayLabels } from "@/lib/tierReplayLabels";
import { RANK, biggestJump, changesText, dayMonth, fmtInt, jumpText, type Replay, type ReplayCard, type ReplayCell, type ReplayFrame } from "./frames";

/**
 * Il replay delle carte base (27/11/2026; Pierluigi ha approvato la regola lo stesso giorno: «Sì, va bene»). Funzioni
 * pure: i dati li legge `loadCardReplay` (src/lib/tierReplay/cards.ts, solo server).
 *
 * Il Tracker conta le carte solo dal lato di chi registra (dell'avversario vede soltanto le carte giocate), e chi
 * registra vince più della metà delle partite. Quindi la regola è quella delle Leggendarie con la riga del 50% spostata
 * alla media di tutte le partite registrate nella patch: S se il bordo basso dell'intervallo al 95% sta sopra la media,
 * A dalla media, B fino a 5 punti sotto, C fino a 10 sotto, D più in basso; niente fascia sotto le partite minime.
 */

export type ReplayCardPatch = ReplayPatch & {
  /** win rate di tutte le partite registrate nella patch (chi registra); null se il Tracker non ha letto */
  baseline: number | null;
};

export type ReplayBaseCard = {
  slug: string;
  name: string;
  href: string;
  game: GameCardInput;
  changes: ReplayChange[];
  /** per patch, nell'ordine di `patches`: mazzi che la contengono (partite e vittorie) o null */
  stats: ({ games: number; wins: number } | null)[];
  /** per patch: la carta non era ancora nel gioco */
  notYet: boolean[];
  community?: { tier: string; avg: number };
  votes?: { tier?: string; avg: number };
};

export type ReplayCardsData = {
  locale: string;
  patches: ReplayCardPatch[];
  cards: ReplayBaseCard[];
  trackerMissing: boolean;
};

/** la regola delle carte base: quella delle Leggendarie, con la media della patch al posto del 50% */
export function cardTier(games: number, wins: number, base: number): ReplayTierOrNone {
  if (games < TIER_RULE.minGames) return "unranked";
  const r = wins / games;
  const [lo] = wilson(wins, games);
  if (lo > base) return "S";
  if (r >= base + (TIER_RULE.a - 0.5)) return "A";
  if (r >= base + (TIER_RULE.b - 0.5)) return "B";
  if (r >= base + (TIER_RULE.c - 0.5)) return "C";
  return "D";
}

export function buildCardReplay(data: ReplayCardsData, l: ReplayLabels): Replay {
  const { locale } = data;
  // una patch senza partite (Tracker che non risponde, patch appena uscita) non diventa un fotogramma vuoto
  const keep = data.patches.flatMap((p, i) => (p.games > 0 && p.baseline !== null ? [i] : []));
  const patches = keep.map((i) => data.patches[i]);
  const frames: ReplayFrame[] = patches.map((p, i) => {
    const day = dayMonth(locale, p.date);
    return {
      key: p.id,
      label: fill(l.frame.patch, { day }),
      short: day,
      title: fill(l.frame.patch, { day }),
      when: fill(l.when.patch, { day }),
      published: false,
      patch: p.id,
      day,
      games: p.games,
      lead:
        i === 0
          ? fill(l.frame.leadFirst, { n: fmtInt(locale, p.games), day })
          : fill(l.frame.leadPatch, { changes: changesText(l, p.changeCount), n: fmtInt(locale, p.games) }),
      events: p.events.filter((e) => !e.legendary),
      news: p.news,
      newPatch: true,
      baseline: p.baseline ?? undefined,
    };
  });

  const cards: ReplayCard[] = data.cards.map((c) => {
    const cells: ReplayCell[] = patches.map((p, j): ReplayCell => {
      const i = keep[j];
      const s = c.stats[i];
      if (!s || s.games === 0 || p.baseline === null)
        return { tier: "unranked", r: null, lo: null, hi: null, games: 0, share: null, notYet: c.notYet[i] || undefined };
      const [lo, hi] = wilson(s.wins, s.games);
      return { tier: cardTier(s.games, s.wins, p.baseline), r: s.wins / s.games, lo, hi, games: s.games, share: p.games ? s.games / p.games : null };
    });
    return {
      slug: c.slug,
      name: c.name,
      href: c.href,
      game: c.game,
      cells,
      changes: c.changes,
      boosted: false,
      ladderTier: cells[0]?.tier ?? "unranked",
      crimson: null,
      community: c.community,
      votes: c.votes,
    };
  });

  // dalla migliore nell'ultima patch: fascia, bordo basso, partite, nome
  const last = frames.length - 1;
  cards.sort(
    (a, b) =>
      RANK[b.cells[last].tier] - RANK[a.cells[last].tier] ||
      (b.cells[last].lo ?? -1) - (a.cells[last].lo ?? -1) ||
      b.cells[last].games - a.cells[last].games ||
      a.name.localeCompare(b.name),
  );

  const best = biggestJump(cards, frames);
  const alwaysS = cards.filter((c) => c.cells.length > 0 && c.cells.every((x) => x.tier === "S"));
  return {
    locale,
    kind: "card",
    l,
    frames,
    cards,
    headline: best ? jumpText(l, frames, best.card, best.k) : l.headline.noneCard,
    steady: alwaysS.length ? fill(l.headline.steadyS, { n: frames.length, list: alwaysS.map((c) => c.name).join(l.listSep) }) : null,
    headlineSlug: best?.card.slug ?? cards[0]?.slug ?? "",
    officialNews: "",
    officialReadLabel: "",
    officialGames: 0,
  };
}
