import "server-only";
import { cache } from "react";
import { getCard, type Card } from "@/lib/data/cards";
import { listPublishedDecks } from "@/lib/community/queries";
import { officialDecks } from "@/lib/theoryCraft";
import { authorName } from "@/lib/community/util";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import { PROTO_PATCHES, readProtoAll, type Num, type ProtoPatch, type ProtoPatchStats } from "@/lib/proto/analyticsProto";

/**
 * Prototipo «Analytics a sezioni» (27/11/2026, Pierluigi: "Pagina di oggi, ma meglio", "sotto analytics diverse sezioni,
 * in cui inseriamo le analisi", con chi sale e chi scende, i mazzi migliori da copiare, le carte di ogni Leggendaria,
 * quando si gioca ogni carta e tutti i dati del Tracker 2.0). Dati comuni alle pagine di /it/proto/analytics/sezioni:
 * la patch scelta (?patch=), la precedente per i confronti, tutte e quattro per le linee nel tempo, i mazzi pubblicati.
 */

export const SEZ_BASE = "/it/proto/analytics/sezioni";

export const loadAll = cache(readProtoAll);
const loadPublished = cache(async () => {
  try {
    return officialDecks(await listPublishedDecks());
  } catch {
    return [];
  }
});

export type Sez = {
  all: ProtoPatchStats[];
  cur: ProtoPatchStats;
  prev: ProtoPatchStats | null;
};

/** La patch da `?patch=` (altrimenti l'ultima con numeri) e la precedente; null se il Tracker non risponde. */
export async function loadSez(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<Sez | null> {
  const sp = await searchParams;
  const want = typeof sp.patch === "string" ? sp.patch : null;
  const all = await loadAll();
  if (!all.length) return null;
  const found = want ? all.findIndex((p) => p.patch === want) : -1;
  const idx = found >= 0 ? found : all.length - 1;
  return { all, cur: all[idx], prev: idx > 0 ? all[idx - 1] : null };
}

/** Link interno che tiene la patch scelta (solo se non è l'ultima). */
export function sezHref(path: string, sez: Pick<Sez, "all" | "cur">): string {
  const last = sez.all.at(-1)?.patch;
  return sez.cur.patch === last ? `${SEZ_BASE}${path}` : `${SEZ_BASE}${path}?patch=${sez.cur.patch}`;
}

/** Spostamento fra due patch, in punti; `sure` quando gli intervalli al 95% non si toccano. */
export type Move = { points: number; sure: boolean; before: Num; after: Num };
export function moveOf(before: Num | null | undefined, after: Num | null | undefined): Move | null {
  if (!before || !after || !before.games || !after.games) return null;
  return { points: Math.round((after.r - before.r) * 1000) / 10, sure: after.lo > before.hi || after.hi < before.lo, before, after };
}

/** Win rate di una Leggendaria nelle quattro patch (null dove non c'è). */
export function legendaryLine(all: readonly ProtoPatchStats[], slug: string): ({ patch: ProtoPatch; label: string } & Num & { share: number })[] {
  return all.flatMap((p) => {
    const l = p.legendaries.find((x) => x.slug === slug);
    return l ? [{ patch: p.patch, label: p.label, ...l }] : [];
  });
}

/** Il codice del gioco e il link al deck builder di una lista (13 slug: Leggendaria + 12). */
export async function deckLinks(legendary: string, cards: readonly string[], name: string): Promise<{ code: string | null; builder: string }> {
  const keys = [legendary, ...cards].map((s) => getCard(s)?.key);
  const code = keys.every(Boolean) ? await encodeGameCode(keys as string[]) : null;
  const builder = `/it/deck-builder#${encodeOmCode({ name, legendary, cards: [...cards], customCards: [] })}`;
  return { code, builder };
}

/** I mazzi pubblicati sul sito con la stessa lista esatta, per dare un nome e un autore alla lista. */
export async function publishedByList(): Promise<Map<string, { slug: string; name: string; author: string | null }[]>> {
  const decks = await loadPublished();
  const out = new Map<string, { slug: string; name: string; author: string | null }[]>();
  for (const d of decks) {
    if (!d.legendary || d.cards.length !== 12) continue;
    const key = `${d.legendary}|${[...d.cards].sort().join(",")}`;
    const row = { slug: d.slug, name: d.name, author: d.profile ? authorName(d.profile) : null };
    out.set(key, [...(out.get(key) ?? []), row]);
  }
  return out;
}
export const listKeyOf = (legendary: string, cards: readonly string[]) => `${legendary}|${[...cards].sort().join(",")}`;

export const cardOf = (slug: string): Card | undefined => getCard(slug);
export const pctText = (r: number, digits = 0) => `${(r * 100).toLocaleString("it-IT", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
export const gamesText = (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`;
export const pointsText = (p: number) => `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p).toLocaleString("it-IT", { maximumFractionDigits: 1 })} punti`;
export { PROTO_PATCHES };
