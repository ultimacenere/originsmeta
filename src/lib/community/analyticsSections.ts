import "server-only";
import { cache } from "react";
import { getCard, getCardByKey, patchLabel, patchOrder, type PatchId } from "@/lib/data/cards";
import { href, type Locale } from "@/lib/i18n";
import { listPublishedDecks } from "@/lib/community/queries";
import { authorName } from "@/lib/community/util";
import { officialDecks } from "@/lib/theoryCraft";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import { readTrackerPatch } from "@/lib/community/trackerStatsQueries";
import { listKeyOf, num, toSecPatch, type SecPatch } from "@/lib/tracker/sections";
import { archetypeStats, type ArchetypeRef } from "@/lib/tracker/snapshot";
import { archetypeOfKeys } from "@/lib/tracker/enrich";
import { deckCardsDate } from "@/lib/community/deckVersions";

/**
 * Analytics a sezioni (27/11/2026, Pierluigi: "Sì, portala"): le letture comuni alle pagine di /analytics. La patch si
 * sceglie con `?patch=` (altrimenti l'ultima con numeri) e si confronta con la precedente; le patch sono quelle del Tracker,
 * dalla 0.7 in poi (una patch nuova di `patchOrder` entra da sola appena ha partite). Le letture del database sono quelle
 * di trackerStatsQueries.ts (cache di 5 minuti condivisa); qui si condividono anche dentro la stessa richiesta (`cache`).
 */

export const SECTION_PATCHES: PatchId[] = patchOrder.slice(patchOrder.indexOf("0.7"));

const slugOf = (key: string) => getCardByKey(key.replace(/_V\d+$/, ""))?.slug ?? null;

/**
 * Archetipi dalle liste esatte (01/11/2026, come /analytics prima delle sezioni): quello del mazzo pubblicato più vicino
 * (`archetypeStats` di snapshot.ts), altrimenti la regola del modulo di pubblicazione. La colonna archetype delle partite
 * (la regola all'invio) non si usa.
 */
const loadArchetypeRefs = cache(async (): Promise<ArchetypeRef[]> => {
  try {
    return officialDecks(await listPublishedDecks()).flatMap((deck) => {
      const legendary = deck.legendary ? getCard(deck.legendary)?.key : undefined;
      const cards = deck.cards.map((slug) => getCard(slug)?.key);
      return legendary && cards.length === 12 && cards.every(Boolean) ? [{ legendary, cards: cards as string[], archetype: deck.archetype, at: deckCardsDate(deck) }] : [];
    });
  } catch {
    return [];
  }
});

export const loadAllPatches = cache(async (): Promise<SecPatch[]> => {
  const [read, refs] = await Promise.all([Promise.all(SECTION_PATCHES.map((p) => readTrackerPatch(p))), loadArchetypeRefs()]);
  return read.flatMap((d, i) => {
    if (!d || d.overview.games <= 0) return [];
    const sec = toSecPatch(SECTION_PATCHES[i], d, slugOf);
    const archetypes = archetypeStats(d.lists, refs, archetypeOfKeys)
      .map((a) => ({ archetype: a.archetype, ...num(a.wins, a.games) }))
      .sort((x, y) => y.games - x.games);
    return [{ ...sec, archetypes }];
  });
});

export type Sections = { all: SecPatch[]; cur: SecPatch; prev: SecPatch | null; latest: boolean };
export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** La patch scelta e la precedente; null se il Tracker non risponde. */
export async function loadSections(searchParams: SearchParams): Promise<Sections | null> {
  const sp = await searchParams;
  const want = typeof sp.patch === "string" ? sp.patch : null;
  const all = await loadAllPatches();
  if (!all.length) return null;
  const found = want ? all.findIndex((p) => p.patch === want) : -1;
  const idx = found >= 0 ? found : all.length - 1;
  return { all, cur: all[idx], prev: idx > 0 ? all[idx - 1] : null, latest: idx === all.length - 1 };
}

/** Link a una sezione che tiene la patch scelta (solo se non è l'ultima). */
export function sectionHref(locale: Locale, path: string, s: Pick<Sections, "latest" | "cur">): string {
  const base = href(locale, `/analytics${path}`);
  return s.latest ? base : `${base}?patch=${s.cur.patch}`;
}

export const patchName = (patch: string, locale: Locale) => patchLabel(patch as PatchId, locale);

/** Il codice del gioco e il link al deck builder di una lista (Leggendaria + 12 carte). */
export async function deckLinks(locale: Locale, legendary: string, cards: readonly string[], name: string): Promise<{ code: string | null; builder: string }> {
  const keys = [legendary, ...cards].map((s) => getCard(s)?.key);
  const code = keys.every(Boolean) ? await encodeGameCode(keys as string[]) : null;
  const builder = `${href(locale, "/deck-builder")}#${encodeOmCode({ name, legendary, cards: [...cards], customCards: [] })}`;
  return { code, builder };
}

export type PublishedRef = { slug: string; name: string; author: string | null };

/** I mazzi pubblicati sul sito con la stessa lista esatta, per dare un nome e un autore a una lista. */
export const publishedByList = cache(async (): Promise<Map<string, PublishedRef[]>> => {
  let decks: Awaited<ReturnType<typeof listPublishedDecks>> = [];
  try {
    decks = officialDecks(await listPublishedDecks());
  } catch {
    return new Map();
  }
  const out = new Map<string, PublishedRef[]>();
  for (const d of decks) {
    if (!d.legendary || d.cards.length !== 12) continue;
    const key = listKeyOf(d.legendary, d.cards);
    out.set(key, [...(out.get(key) ?? []), { slug: d.slug, name: d.name, author: d.profile ? authorName(d.profile) : null }]);
  }
  return out;
});
