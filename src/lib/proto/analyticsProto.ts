import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getCardByKey, patchLabel, patches, type Card, type PatchId } from "@/lib/data/cards";
import { parseBundle } from "@/lib/tracker/bundle";
import { isLegendaryKey } from "@/lib/tracker/enrich";
import {
  onlyLegendaries,
  parseArchetypeStats,
  parseCardStats,
  parseLegendaryStats,
  parseListStats,
  parseMatchupStats,
  parseOpponentStats,
  parseOverview,
} from "@/lib/tracker/stats";
import { bothSides, rated, wilson } from "@/lib/tracker/snapshot";
import { toGameCardInput } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";

/**
 * Prototipi del rework di Analytics (26/11/2026, Pierluigi: "Sì, 3 prototipi"). Modulo dati comune alle tre pagine di
 * /it/proto/analytics: legge `tracker_stats_bundle` con la chiave pubblica (solo aggregati, in sola lettura, come
 * /analytics) per le quattro patch con numeri e li porta in una forma semplice da passare ai componenti del browser:
 * slug delle carte al posto delle chiavi del gioco, win rate con l'intervallo di Wilson, Leggendarie e scontri contati a
 * due lati (`bothSides`). Il numero di giocatori del database non esce mai da qui.
 */

export const PROTO_PATCHES = ["0.7", "ea-1104", "ea-1117", "ea-1123"] as const satisfies readonly PatchId[];
export type ProtoPatch = (typeof PROTO_PATCHES)[number];

/** Partite e vittorie con il win rate e l'intervallo al 95%. */
export type Num = { games: number; wins: number; r: number; lo: number; hi: number };
const num = (wins: number, games: number): Num => {
  const [lo, hi] = wilson(wins, games);
  return { games, wins, r: games > 0 ? wins / games : 0.5, lo, hi };
};

export type ProtoLegendary = Num & { slug: string; share: number };
export type ProtoMatchup = Num & { a: string; b: string };
export type ProtoList = Num & { legendary: string; cards: string[] };
export type ProtoCard = {
  slug: string;
  /** partite col la carta nel mazzo di chi registra, e la quota sulle partite della patch */
  deck: Num | null;
  deckShare: number;
  /** partite in cui la carta è stata giocata (dalle carte giocate lette dall'app) e il round medio */
  played: Num | null;
  avgTurn: number | null;
};
export type ProtoArchetype = Num & { archetype: string };

export type ProtoPatchStats = {
  patch: ProtoPatch;
  label: string;
  date: string;
  /** partite della patch (lato di chi registra) */
  games: number;
  /** partite con la Leggendaria avversaria nota: la base di Leggendarie e scontri */
  matchedGames: number;
  legendaries: ProtoLegendary[];
  matchups: ProtoMatchup[];
  lists: ProtoList[];
  cards: ProtoCard[];
  archetypes: ProtoArchetype[];
};

function client() {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 300, tags: ["tracker-stats"] } }) },
  });
}

const slugOf = (key: string): string | null => getCardByKey(key.replace(/_V\d+$/, ""))?.slug ?? null;

const inflight = new Map<string, Promise<ProtoPatchStats | null>>();

/** Le statistiche di una patch, o null se il database non risponde (i prototipi lo dicono e non cadono). */
export function readProtoPatch(patch: ProtoPatch): Promise<ProtoPatchStats | null> {
  const hit = inflight.get(patch);
  if (hit) return hit;
  const run = (async () => {
    const db = client();
    if (!db) return null;
    try {
      let res = await db.rpc("tracker_stats_bundle", { p_patch: patch });
      if (res.error) res = await db.rpc("tracker_stats_bundle", { p_patch: patch });
      if (res.error) throw new Error(res.error.message);
      const rows = parseBundle(res.data);
      if (!rows) return null;
      const overview = parseOverview(rows.overview);
      if (!overview) return null;
      const data = onlyLegendaries(
        {
          legendaries: parseLegendaryStats(rows.legendaries),
          matchups: parseMatchupStats(rows.matchups),
          opponents: parseOpponentStats(rows.opponents),
        },
        isLegendaryKey,
      );
      const both = bothSides(data.matchups);
      const legendaries: ProtoLegendary[] = both.legendaries
        .map((l) => ({ slug: slugOf(l.legendary), ...num(l.wins, l.games), share: both.games > 0 ? l.games / (2 * both.games) : 0 }))
        .filter((l): l is ProtoLegendary => !!l.slug);
      const matchups: ProtoMatchup[] = both.matchups
        .map((m) => ({ a: slugOf(m.legendary), b: slugOf(m.opponent), ...num(m.wins, m.games) }))
        .filter((m): m is ProtoMatchup => !!m.a && !!m.b);
      const lists: ProtoList[] = parseListStats(rows.lists)
        .map((l) => {
          const slugs = l.list.split(",").map(slugOf);
          if (slugs.some((s) => !s)) return null;
          const legendary = l.legendary ? slugOf(l.legendary) : null;
          if (!legendary) return null;
          return { legendary, cards: (slugs as string[]).filter((s) => s !== legendary).sort(), ...num(l.wins, l.games) };
        })
        .filter((l): l is ProtoList => !!l);
      const cards: ProtoCard[] = parseCardStats(rows.cards)
        .map((c) => {
          const slug = slugOf(c.card);
          if (!slug) return null;
          return {
            slug,
            deck: c.deck ? num(c.deck.wins, c.deck.games) : null,
            deckShare: c.deck && overview.games > 0 ? c.deck.games / overview.games : 0,
            played: c.played ? num(c.played.wins, c.played.games) : null,
            avgTurn: c.played?.avgTurn ?? null,
          };
        })
        .filter((c): c is ProtoCard => !!c);
      const archetypes: ProtoArchetype[] = parseArchetypeStats(rows.archetypes).map((a) => ({ archetype: a.archetype, ...num(a.wins, a.games) }));
      return {
        patch,
        label: patchLabel(patch, "it"),
        date: patches[patch].date,
        games: overview.games,
        matchedGames: both.games,
        legendaries: legendaries.sort((x, y) => y.games - x.games),
        matchups,
        lists: lists.sort((x, y) => y.games - x.games),
        cards: cards.sort((x, y) => (y.deck?.games ?? 0) - (x.deck?.games ?? 0)),
        archetypes: archetypes.sort((x, y) => y.games - x.games),
      };
    } catch (error) {
      console.warn(`[proto] statistiche della patch ${patch} non disponibili: ${error instanceof Error ? error.message : error}`);
      inflight.delete(patch);
      return null;
    }
  })();
  inflight.set(patch, run);
  return run;
}

/** Tutte e quattro le patch, nell'ordine di uscita; quelle che non rispondono restano fuori. */
export async function readProtoAll(): Promise<ProtoPatchStats[]> {
  const all = await Promise.all(PROTO_PATCHES.map((p) => readProtoPatch(p)));
  return all.filter((p): p is ProtoPatchStats => !!p);
}

/**
 * Le carte che una Leggendaria porta, dalle liste esatte registrate: per carta la quota delle partite di quella
 * Leggendaria in cui c'era, e il win rate con e senza (lato di chi registra). Solo dati veri: niente stime.
 */
export type CardWith = { slug: string; share: number; with: Num; without: Num | null };
export function cardsOfLegendary(lists: readonly ProtoList[], legendary: string): { games: number; cards: CardWith[] } {
  const mine = lists.filter((l) => l.legendary === legendary);
  const games = mine.reduce((s, l) => s + l.games, 0);
  const wins = mine.reduce((s, l) => s + l.wins, 0);
  const acc = new Map<string, { games: number; wins: number }>();
  for (const l of mine)
    for (const c of l.cards) {
      const a = acc.get(c) ?? { games: 0, wins: 0 };
      acc.set(c, { games: a.games + l.games, wins: a.wins + l.wins });
    }
  const cards = [...acc].map(([slug, a]) => ({
    slug,
    share: games > 0 ? a.games / games : 0,
    with: num(a.wins, a.games),
    without: games - a.games > 0 ? num(wins - a.wins, games - a.games) : null,
  }));
  return { games, cards: cards.sort((x, y) => y.share - x.share || y.with.games - x.with.games) };
}

/** La carta come la disegna il gioco, pronta per un componente del browser (GameCardFace). */
export function gameInput(card: Card): GameCardInput {
  return toGameCardInput(card, "it");
}

export const protoNum = num;
export { rated };
