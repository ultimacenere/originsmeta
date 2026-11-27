import { getCard, patchLabel, type Card, type Change, type PatchId, type Stats } from "@/lib/data/cards";
import type { Locale } from "@/lib/i18n";
import { protoPatches, type ProtoData, type ProtoDeck } from "@/lib/profileProto/load";

/*
  Prototipo 3, «Le patch» (27/11/2026): la storia di un iscritto raccontata patch per patch, intrecciata con il
  bilanciamento. Funzioni pure: dai dati di `loadProto` ai capitoli, uno per patch vissuta, dalla più recente.
  Una patch va dal suo `at` (o dall'inizio del suo giorno) fino all'inizio della patch dopo.
*/

const DAY = 86_400_000;

export type PatchWindow = { id: PatchId; label: string; start: number; end: number | null; startDay: string; current: boolean };

export type Published = { deck: ProtoDeck; at: string };
export type Updated = {
  deck: ProtoDeck;
  at: string;
  from: number;
  to: number;
  added: Card[];
  removed: Card[];
  legendary: { from: Card | null; to: Card | null } | null;
};
export type DeckFate = { deck: ProtoDeck; days: number | null };
export type Touched = { card: Card; change: Change; decks: DeckFate[] };
export type Milestone = { key: string; kind: "achievement" | "tierlist" | "guide" | "joined"; at: string; title: string; detail?: string; href?: string; achievement?: string };

export type Chapter = {
  patch: PatchWindow;
  published: Published[];
  updated: Updated[];
  touched: Touched[];
  milestones: Milestone[];
  /** ha fatto qualcosa in questa patch: timbro pieno («Dalla Demo 2.0» no: lo si prende solo iscrivendosi) */
  stamped: boolean;
  empty: boolean;
};

const startOf = (p: (typeof protoPatches)[number]) => Date.parse(p.at ?? `${p.date}T00:00:00Z`);

/** Le finestre delle patch, dalla prima alla più recente. */
export function patchWindows(locale: Locale): PatchWindow[] {
  return protoPatches.map((p, i) => {
    const next = protoPatches[i + 1];
    return { id: p.id, label: patchLabel(p.id, locale), start: startOf(p), end: next ? startOf(next) : null, startDay: p.date, current: !next };
  });
}

function windowOf(windows: PatchWindow[], iso: string): PatchWindow | null {
  const t = Date.parse(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (!Number.isFinite(t)) return null;
  let found: PatchWindow | null = null;
  for (const w of windows) if (w.start <= t) found = w;
  return found;
}

/** Conta le copie di ogni slug (le carte create a mano sono già escluse dai dati). */
function counts(slugs: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of slugs) m.set(s, (m.get(s) ?? 0) + 1);
  return m;
}

function diff(before: readonly string[], after: readonly string[]) {
  const a = counts(before);
  const b = counts(after);
  const added: Card[] = [];
  const removed: Card[] = [];
  for (const [s, n] of b) for (let i = 0; i < n - (a.get(s) ?? 0); i++) { const c = getCard(s); if (c) added.push(c); }
  for (const [s, n] of a) for (let i = 0; i < n - (b.get(s) ?? 0); i++) { const c = getCard(s); if (c) removed.push(c); }
  return { added, removed };
}

/** Le versioni di un mazzo in ordine, l'ultima è quella di oggi: carte, Leggendaria, inizio e fine. */
function timeline(deck: ProtoDeck) {
  const closed = [...deck.versions].sort((x, y) => x.version - y.version);
  const rows = closed.map((v) => ({ version: v.version, start: Date.parse(v.startedAt), end: Date.parse(v.endedAt), legendary: v.legendary, cards: v.cards }));
  rows.push({
    version: deck.version,
    start: closed.length ? Date.parse(closed[closed.length - 1].endedAt) : Date.parse(deck.createdAt),
    end: Number.POSITIVE_INFINITY,
    legendary: deck.legendary?.slug ?? null,
    cards: deck.cards.map((c) => c.slug),
  });
  return rows;
}

/** Il primo cambio di carte del mazzo dopo un istante, o null. */
function nextUpdateAfter(deck: ProtoDeck, t: number): number | null {
  const ends = deck.versions.map((v) => Date.parse(v.endedAt)).filter((e) => e > t);
  return ends.length ? Math.min(...ends) : null;
}

const changed = (from?: Stats, to?: Stats) => ({
  mana: from?.mana !== to?.mana ? [from?.mana, to?.mana] : null,
  power: from?.power !== to?.power ? [from?.power, to?.power] : null,
  health: from?.health !== to?.health ? [from?.health, to?.health] : null,
});
export const statDiff = changed;

export type PatchStory = {
  chapters: Chapter[];
  lived: number;
  stamps: number;
  /** ha aggiornato ogni mazzo colpito prima della patch successiva, a ogni patch che li ha toccati (provvisorio) */
  inStep: boolean;
  /** almeno una patch ha toccato i suoi mazzi */
  touchedAny: boolean;
};

export function buildStory(data: ProtoData, locale: Locale, labels: { achievement: (id: string) => string; months: (m: string) => string }): PatchStory {
  const all = patchWindows(locale);
  const joined = windowOf(all, data.createdAt);
  const firstIdx = joined ? all.indexOf(joined) : 0;
  const windows = all.slice(firstIdx);
  const chapters = new Map<PatchId, Chapter>(windows.map((w) => [w.id, { patch: w, published: [], updated: [], touched: [], milestones: [], stamped: false, empty: true }]));
  const at = (iso: string) => {
    const w = windowOf(windows, iso) ?? windows[0];
    return w ? chapters.get(w.id) ?? null : null;
  };

  const decks = data.decks.filter((d) => !d.theory);

  for (const deck of data.decks) {
    at(deck.createdAt)?.published.push({ deck, at: deck.createdAt });
    const rows = timeline(deck);
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const next = rows[i];
      const when = new Date(next.start).toISOString();
      const { added, removed } = diff(prev.cards, next.cards);
      const legendary = prev.legendary !== next.legendary ? { from: prev.legendary ? getCard(prev.legendary) ?? null : null, to: next.legendary ? getCard(next.legendary) ?? null : null } : null;
      at(when)?.updated.push({ deck, at: when, from: prev.version, to: next.version, added, removed, legendary });
    }
  }

  for (const t of data.tierLists) {
    const title = t.title || (t.kind === "legendaries" ? "Tier list delle Leggendarie" : "Tier list delle carte");
    at(t.createdAt)?.milestones.push({ key: `tl-${t.id}`, kind: "tierlist", at: t.createdAt, title, detail: `${t.ranked} carte in fila`, href: `/tier-list/create#${t.code}` });
    const upd = windowOf(windows, t.updatedAt);
    const made = windowOf(windows, t.createdAt);
    if (upd && made && upd.id !== made.id) at(t.updatedAt)?.milestones.push({ key: `tlu-${t.id}`, kind: "tierlist", at: t.updatedAt, title, detail: "Aggiornata", href: `/tier-list/create#${t.code}` });
  }
  for (const g of data.guides) at(g.createdAt)?.milestones.push({ key: `g-${g.slug}`, kind: "guide", at: g.createdAt, title: g.title, detail: "Guida pubblicata", href: `/guides/community/${g.slug}` });
  for (const e of data.earned) {
    if (e.date) at(e.date)?.milestones.push({ key: `a-${e.id}`, kind: "achievement", at: e.date, title: labels.achievement(e.id), achievement: e.id });
    // il mazzo del mese vale a mese chiuso: si mette nella patch in vigore l'ultimo giorno di quel mese
    for (const m of e.months) {
      const [y, mo] = m.split("-").map(Number);
      const last = new Date(Date.UTC(y, mo, 0, 23, 59)).toISOString();
      at(last)?.milestones.push({ key: `a-${e.id}-${m}`, kind: "achievement", at: last, title: labels.achievement(e.id), detail: labels.months(m), achievement: e.id });
    }
  }

  // la patch nei suoi mazzi: le carte, nella versione in vigore all'inizio della patch, che la patch ha cambiato
  let touchedAny = false;
  let inStep = true;
  for (const w of windows) {
    const ch = chapters.get(w.id)!;
    const byCard = new Map<string, Touched>();
    for (const deck of decks) {
      if (Date.parse(deck.createdAt) >= w.start) continue;
      const version = timeline(deck).find((r) => r.start <= w.start && w.start < r.end);
      if (!version) continue;
      const slugs = new Set([...(version.legendary ? [version.legendary] : []), ...version.cards]);
      let hit = false;
      for (const slug of slugs) {
        const card = getCard(slug);
        const change = card?.history.find((h) => h.patch === w.id && h.kind !== "deck");
        if (!card || !change) continue;
        hit = true;
        const next = nextUpdateAfter(deck, w.start);
        const days = next === null ? null : Math.max(0, Math.floor((next - w.start) / DAY));
        const row = byCard.get(slug) ?? { card, change, decks: [] };
        row.decks.push({ deck, days });
        byCard.set(slug, row);
      }
      if (hit) {
        touchedAny = true;
        const next = nextUpdateAfter(deck, w.start);
        const inTime = next !== null && (w.end === null || next < w.end);
        // nella patch in corso chi non ha ancora aggiornato non perde il segno: c'è tempo
        if (!inTime && !w.current) inStep = false;
      }
    }
    ch.touched = [...byCard.values()].sort((a, b) => b.decks.length - a.decks.length || (a.card.legendary ? -1 : 0) - (b.card.legendary ? -1 : 0));
  }

  const joinedCh = at(data.createdAt);
  if (joinedCh) joinedCh.milestones.push({ key: "joined", kind: "joined", at: data.createdAt, title: "Iscrizione a OriginsMeta" });

  for (const ch of chapters.values()) {
    ch.published.sort((a, b) => b.at.localeCompare(a.at));
    ch.updated.sort((a, b) => b.at.localeCompare(a.at));
    ch.milestones.sort((a, b) => b.at.localeCompare(a.at));
    ch.stamped = ch.published.length > 0 || ch.updated.length > 0 || ch.milestones.some((m) => m.kind !== "joined" && m.achievement !== "demo2");
    ch.empty = !ch.stamped && ch.touched.length === 0 && ch.milestones.length === 0;
  }

  const list = [...chapters.values()].reverse();
  return { chapters: list, lived: list.length, stamps: list.filter((c) => c.stamped).length, inStep: touchedAny && inStep, touchedAny };
}
