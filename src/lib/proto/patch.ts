import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getCard, patchChanges, type ChangeKind, type Stats } from "@/lib/data/cards";
import { parseBundle } from "@/lib/tracker/bundle";
import { parseOverview } from "@/lib/tracker/stats";
import { wilson } from "@/lib/tracker/snapshot";
import { cardsOfLegendary, gameInput, readProtoAll, type ProtoPatchStats } from "@/lib/proto/analyticsProto";
import type { GameCardInput } from "@/game-card/model";

/**
 * Prototipo C del rework di Analytics, «Le patch alla prova» (26/11/2026): MetaShifting (le modifiche di Koin in
 * card-history.ts) accanto ai numeri del Tracker della patch prima e di quella dopo. Qui si prepara tutto sul server e
 * al browser va solo quello che la pagina mostra.
 *
 * - Leggendarie: win rate contato a due lati (50% per costruzione) e quota di gioco sulle presenze in campo.
 * - Carte base: quota delle partite in cui sono nel mazzo di chi registra e win rate nel mazzo, confrontato con la media
 *   della patch (chi registra non vince il 50%, e la sua media cambia da una patch all'altra: 0.7 circa 60%, ea-1117
 *   circa 50%), così il prima e il dopo non mescolano il cambio della media con l'effetto della carta.
 * - Verdetto solo quando gli intervalli al 95% non si toccano; altrimenti "effetto non chiaro".
 */

export type Band = { v: number; lo: number; hi: number };
export type Side = {
  /** win rate (Leggendarie) o scarto dalla media della patch (carte base), con l'intervallo */
  wr: Band;
  /** partite su cui è calcolato il win rate */
  games: number;
  /** quota di gioco con l'intervallo */
  share: Band;
  /** media della patch per chi registra (solo carte base) */
  base?: number;
};
export type Verdict = { dir: "up" | "down" | "flat"; text: string };
export type ChangeItem = {
  id: string;
  slug: string;
  name: string;
  legendary: boolean;
  kind: ChangeKind;
  fix: boolean;
  from?: Stats;
  to?: Stats;
  note: string;
  card: GameCardInput;
  before: Side | null;
  after: Side | null;
  verdict: Verdict | null;
  /** Leggendarie che la portavano di più prima della patch (carte base) */
  legs: { slug: string; name: string }[];
};
export type PatchHead = { patch: string; label: string; date: string; games: number };
export type Step = { id: string; from: PatchHead | null; to: PatchHead; fresh: boolean; items: ChangeItem[] };

export type LegPoint = { r: number; lo: number; hi: number; games: number; share: number };
export type LegMark = { self: boolean; kinds: ChangeKind[]; cards: string[] };
export type TimelineLeg = { slug: string; name: string; points: (LegPoint | null)[]; marks: (LegMark | null)[] };

export type PatchProofData = {
  patches: PatchHead[];
  timeline: TimelineLeg[];
  steps: Step[];
  /** la patch più recente ha pochi giorni di dati */
  freshDays: number | null;
};

const band = (wins: number, games: number): Band => {
  const [lo, hi] = wilson(wins, games);
  return { v: games > 0 ? wins / games : 0, lo, hi };
};
const apart = (a: Band, b: Band) => a.lo > b.hi || a.hi < b.lo;
const pts = (d: number) => {
  const n = Math.round(d * 100);
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n)} ${Math.abs(n) === 1 ? "punto" : "punti"}`;
};

/** Media della patch per chi registra: vittorie e partite della panoramica (la stessa lettura in cache di analyticsProto). */
async function baselines(patches: readonly string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!supabaseEnabled) return out;
  const db = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 300, tags: ["tracker-stats"] } }) },
  });
  await Promise.all(
    patches.map(async (p) => {
      try {
        const res = await db.rpc("tracker_stats_bundle", { p_patch: p });
        const rows = res.error ? null : parseBundle(res.data);
        const ov = rows ? parseOverview(rows.overview) : null;
        if (ov && ov.games > 0) out.set(p, ov.wins / ov.games);
      } catch {
        /* senza media il prima e dopo delle carte base non si mostra */
      }
    }),
  );
  return out;
}

const KIND_WORD: Record<ChangeKind, string> = { buff: "buff", nerf: "nerf", rework: "rework", deck: "cambio" };

function verdictOf(kind: ChangeKind, before: Side | null, after: Side | null): Verdict | null {
  if (!before || !after) return null;
  const wrMoved = apart(before.wr, after.wr);
  const shMoved = apart(before.share, after.share);
  const d = after.wr.v - before.wr.v;
  const ratio = before.share.v > 0 ? after.share.v / before.share.v : 1;
  const parts: string[] = [];
  let dir: Verdict["dir"] = "flat";
  if (wrMoved) {
    dir = d > 0 ? "up" : "down";
    const w = KIND_WORD[kind];
    if (kind === "nerf") parts.push(d < 0 ? `Il nerf ha colpito: ${pts(d)}` : `Dopo il nerf vince di più: ${pts(d)}`);
    else if (kind === "buff") parts.push(d > 0 ? `Il buff ha funzionato: ${pts(d)}` : `Dopo il buff vince meno: ${pts(d)}`);
    else parts.push(`Dopo il ${w}: ${pts(d)}`);
  }
  if (shMoved) {
    if (!wrMoved) dir = ratio > 1 ? "up" : "down";
    const play =
      ratio <= 0.4 ? "giocata molto meno" : ratio <= 0.6 ? "giocata la metà" : ratio < 1 ? "giocata meno" : ratio >= 3 ? "giocata molto di più" : ratio >= 1.8 ? "giocata il doppio" : "giocata di più";
    parts.push(parts.length ? play : play.charAt(0).toUpperCase() + play.slice(1));
  }
  if (!parts.length) return { dir: "flat", text: "Effetto non chiaro" };
  return { dir, text: parts.join(", ") };
}

function legSide(ps: ProtoPatchStats | undefined, slug: string): Side | null {
  const l = ps?.legendaries.find((x) => x.slug === slug);
  if (!ps || !l || l.games <= 0) return null;
  return { wr: { v: l.r, lo: l.lo, hi: l.hi }, games: l.games, share: band(l.games, 2 * ps.matchedGames) };
}

function cardSide(ps: ProtoPatchStats | undefined, slug: string, base: number | undefined): Side | null {
  const c = ps?.cards.find((x) => x.slug === slug);
  if (!ps || !c?.deck || c.deck.games <= 0 || base === undefined) return null;
  return {
    wr: { v: c.deck.r - base, lo: c.deck.lo - base, hi: c.deck.hi - base },
    games: c.deck.games,
    share: band(c.deck.games, ps.games),
    base,
  };
}

/** Le stats che la carta aveva subito dopo la patch: la carta del gioco si disegna così, non con quelle di oggi. */
function cardAt(slug: string, to?: Stats): GameCardInput | null {
  const card = getCard(slug);
  if (!card) return null;
  const input = gameInput(card);
  if (to?.mana !== undefined) input.cost = to.mana;
  if (to?.power !== undefined) input.power = to.power;
  if (to?.health !== undefined) input.health = to.health;
  return input;
}

const head = (ps: ProtoPatchStats): PatchHead => ({ patch: ps.patch, label: ps.label, date: ps.date, games: ps.games });

export async function readPatchProof(): Promise<PatchProofData | null> {
  const all = await readProtoAll();
  if (all.length < 2) return null;
  const base = await baselines(all.map((p) => p.patch));
  const byPatch = new Map(all.map((p) => [p.patch as string, p]));
  const order = all.map((p) => p.patch as string);
  const groups = new Map(patchChanges().map((g) => [g.patch as string, g.items]));

  const steps: Step[] = [];
  for (let i = order.length - 1; i >= 0; i--) {
    const to = byPatch.get(order[i])!;
    const from = i > 0 ? byPatch.get(order[i - 1])! : null;
    const items: ChangeItem[] = [];
    for (const m of groups.get(to.patch) ?? []) {
      const card = cardAt(m.card.slug, m.change.to);
      if (!card) continue;
      const legendary = !!m.card.legendary;
      const before = from ? (legendary ? legSide(from, m.card.slug) : cardSide(from, m.card.slug, base.get(from.patch))) : null;
      const after = legendary ? legSide(to, m.card.slug) : cardSide(to, m.card.slug, base.get(to.patch));
      const legs = !legendary && from
        ? from.legendaries
            .map((l) => ({ slug: l.slug, share: cardsOfLegendary(from.lists, l.slug).cards.find((c) => c.slug === m.card.slug)?.share ?? 0 }))
            .filter((l) => l.share >= 0.4)
            .sort((a, b) => b.share - a.share)
            .slice(0, 3)
            .map((l) => ({ slug: l.slug, name: getCard(l.slug)?.name ?? l.slug }))
        : [];
      items.push({
        id: `${to.patch}-${m.card.slug}`,
        slug: m.card.slug,
        name: m.card.name,
        legendary,
        kind: m.change.kind,
        fix: !!m.change.fix,
        from: m.change.from,
        to: m.change.to,
        note: m.change.note.it ?? m.change.note.en,
        card,
        before,
        after,
        verdict: verdictOf(m.change.kind, before, after),
        legs,
      });
    }
    if (!items.length) continue;
    steps.push({ id: `p-${to.patch.replace(/\./g, "-")}`, from: from ? head(from) : null, to: head(to), fresh: i === order.length - 1 && daysSince(to.date) < 14, items });
  }

  // linea del tempo: le Leggendarie che compaiono in almeno una patch
  const slugs = new Set(all.flatMap((p) => p.legendaries.map((l) => l.slug)));
  const timeline: TimelineLeg[] = [...slugs].map((slug) => {
    const points = all.map((ps) => {
      const l = ps.legendaries.find((x) => x.slug === slug);
      return l ? { r: l.r, lo: l.lo, hi: l.hi, games: l.games, share: l.share } : null;
    });
    const marks = all.map((ps, i) => {
      const items = groups.get(ps.patch) ?? [];
      const self = items.filter((m) => m.card.slug === slug);
      const prev = i > 0 ? all[i - 1] : ps;
      const core = new Set(cardsOfLegendary(prev.lists, slug).cards.filter((c) => c.share >= 0.5).map((c) => c.slug));
      const touched = items.filter((m) => !m.card.legendary && core.has(m.card.slug));
      if (!self.length && !touched.length) return null;
      return { self: self.length > 0, kinds: [...self, ...touched].map((m) => m.change.kind), cards: touched.map((m) => m.card.name) };
    });
    return { slug, name: getCard(slug)?.name ?? slug, points, marks };
  });
  const last = all.at(-1)!;
  timeline.sort((a, b) => (b.points.at(-1)?.share ?? 0) - (a.points.at(-1)?.share ?? 0));

  const lastDays = daysSince(last.date);
  return { patches: all.map(head), timeline, steps, freshDays: lastDays < 14 ? Math.max(1, lastDays) : null };
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}
