import type { GameCardInput } from "@/game-card/model";
import type { LabChange, LabPatch, LabTierOrNone } from "@/lib/tierLab/types";
import { wilson } from "@/lib/tracker/snapshot";
import { TIER_RULE } from "@/lib/tierRule";
import { fmtInt, frameWhen, tierWord, type Replay, type ReplayCard, type ReplayCell, type ReplayFrame } from "./frames";

/**
 * «Il replay delle patch» per le carte base (27/11/2026, branch claude/tierlist-lab, chiesto da Pierluigi dopo aver
 * scelto il replay: «riesci a farmi vedere anche la versione per le carte?»). Funzioni pure: i dati li legge
 * `loadLabCards` (src/lib/tierLab/cardsData.ts, solo server).
 *
 * Le carte base non hanno una tier list pubblicata e il Tracker le conta solo dal lato di chi registra (dell'avversario
 * si conoscono solo le carte giocate), che vince più della metà delle partite. Quindi la regola di prova è quella delle
 * Leggendarie con la riga del 50% spostata alla media di chi registra in quella patch: S se il bordo basso
 * dell'intervallo al 95% sta sopra la media, A dalla media, B fino a 5 punti sotto, C fino a 10 sotto, D sotto ancora;
 * niente fascia sotto le partite minime della regola.
 */

export type LabCardPatch = LabPatch & {
  /** win rate di tutte le partite registrate nella patch (chi registra); null se il Tracker non ha letto */
  baseline: number | null;
};

export type LabBaseCard = {
  slug: string;
  name: string;
  href: string;
  game: GameCardInput;
  changes: LabChange[];
  /** per patch, nell'ordine di `patches`: mazzi che la contengono (partite e vittorie) o null; `notYet` se non era nel gioco */
  stats: ({ games: number; wins: number } | null)[];
  notYet: boolean[];
  community?: { tier: string; avg: number };
  votes?: { tier?: string; avg: number };
};

export type LabCardsData = {
  locale: string;
  patches: LabCardPatch[];
  cards: LabBaseCard[];
  trackerMissing: boolean;
};

const RANK: Record<LabTierOrNone, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, unranked: 0 };

/** la regola di prova delle carte base: quella delle Leggendarie, con la media della patch al posto del 50% */
export function cardTier(games: number, wins: number, base: number): LabTierOrNone {
  if (games < TIER_RULE.minGames) return "unranked";
  const r = wins / games;
  const [lo] = wilson(wins, games);
  if (lo > base) return "S";
  if (r >= base + (TIER_RULE.a - 0.5)) return "A";
  if (r >= base + (TIER_RULE.b - 0.5)) return "B";
  if (r >= base + (TIER_RULE.c - 0.5)) return "C";
  return "D";
}

const dayMonth = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

export function buildCardReplay(data: LabCardsData): Replay {
  const { locale, patches } = data;
  const frames: ReplayFrame[] = patches.map((p, i) => {
    const day = dayMonth(p.date);
    return {
      key: p.id,
      label: `Patch del ${day}`,
      short: day,
      title: `Patch del ${day}`,
      published: false,
      patch: p.id,
      games: p.games,
      lead:
        i === 0
          ? `${fmtInt(locale, p.games)} partite registrate con la patch del ${day}.`
          : `${p.changeCount === 1 ? "Una modifica" : `${p.changeCount} modifiche`} alle carte e ${fmtInt(locale, p.games)} partite registrate.`,
      events: p.events.filter((e) => !e.legendary),
      news: p.news,
      newPatch: true,
      baseline: p.baseline ?? undefined,
    };
  });

  const cards: ReplayCard[] = data.cards.map((c) => {
    const cells: ReplayCell[] = patches.map((p, i): ReplayCell => {
      const s = c.stats[i];
      if (!s || s.games === 0 || p.baseline === null)
        return { tier: "unranked", r: null, lo: null, hi: null, games: 0, share: null, notYet: c.notYet[i] || undefined };
      const [lo, hi] = wilson(s.wins, s.games);
      return {
        tier: cardTier(s.games, s.wins, p.baseline),
        r: s.wins / s.games,
        lo,
        hi,
        games: s.games,
        share: p.games ? s.games / p.games : null,
      };
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

  // dalla migliore nell'ultima patch: fascia, bordo basso, partite
  const lastK = frames.length - 1;
  cards.sort(
    (a, b) =>
      RANK[b.cells[lastK].tier] - RANK[a.cells[lastK].tier] ||
      (b.cells[lastK].lo ?? -1) - (a.cells[lastK].lo ?? -1) ||
      b.cells[lastK].games - a.cells[lastK].games ||
      a.name.localeCompare(b.name),
  );

  // il salto più grosso fra due patch vicine (tutte e due con una fascia), a pari salto la carta più giocata
  let best: { card: ReplayCard; k: number; size: number; share: number } | null = null;
  for (const c of cards) {
    for (let k = 1; k < frames.length; k++) {
      const a = c.cells[k - 1].tier;
      const b = c.cells[k].tier;
      if (a === "unranked" || b === "unranked") continue;
      const size = Math.abs(RANK[a] - RANK[b]);
      const share = c.cells[k].share ?? 0;
      if (size > 0 && (!best || size > best.size || (size === best.size && share > best.share))) best = { card: c, k, size, share };
    }
  }
  let headline = "Nessuna carta ha cambiato fascia fra una patch e l'altra.";
  let headlineSlug = cards[0]?.slug ?? "";
  if (best) {
    const { card, k } = best;
    headline = `Il salto più grosso: ${card.name}, da ${tierWord(card.cells[k - 1].tier)} a ${tierWord(card.cells[k].tier)} con ${frameWhen(frames[k])}.`;
    headlineSlug = card.slug;
  }
  const alwaysS = cards.filter((c) => c.cells.every((x) => x.tier === "S"));
  const steady = alwaysS.length ? `Sempre in fascia S, in tutte le ${frames.length} patch: ${alwaysS.map((c) => c.name).join(", ")}.` : null;

  return {
    locale,
    kind: "card",
    frames,
    cards,
    headline,
    steady,
    headlineSlug,
    officialNews: "",
    officialReadLabel: "",
    officialGames: 0,
  };
}
