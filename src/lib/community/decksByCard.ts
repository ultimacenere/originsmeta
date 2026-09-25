import { revalidateTag, unstable_cache, updateTag } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";
import { locales } from "@/lib/i18n";
import { aggregateLists, type Tier } from "@/lib/tierstats";
import type { TierKind } from "@/lib/tiercode";
import type { DeckRef } from "@/lib/cardSynergy";
import { guideLocales, type DeckTranslations } from "./deckTranslation";
import { authorName } from "./util";
import type { Guide, Profile } from "./types";

/**
 * Mazzi pubblicati e tier list della community per le schede carta (Ondata 2 del piano SEO/GEO: SCHEDE-02, DECKS-04,
 * COMP-03, SCHEDE-11).
 *
 * Il problema: le schede carta sono 690 pagine (230 carte × 3 lingue). Una lettura di Supabase per pagina farebbe
 * 690 query a ogni build e a ogni giro di rigenerazione. Qui la lettura è una sola, condivisa fra tutte le schede:
 * - `unstable_cache` la tiene nella cache dei dati di Next, con un'etichetta (`COMMUNITY_DECKS_TAG`) e un'ora di
 *   validità come riserva. È l'API di questa versione di Next per chi non usa Cache Components (next.config.ts non
 *   li attiva): node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md;
 * - la pagina che la usa riceve la stessa etichetta, quindi `refreshCardDecks` (chiamata dalle Server Action dei
 *   mazzi: pubblica, modifica, nascondi, ripubblica, elimina) rende vecchie in un colpo solo la lettura e tutte le
 *   schede, che si rigenerano alla visita successiva;
 * - durante `next build` le pagine si generano in parallelo e la prima lettura non è ancora nella cache quando
 *   partono le altre: per la sola build ogni processo tiene la lettura in corso in una variabile del modulo, così le
 *   schede generate da quel processo ne fanno una sola. Anche un errore resta quello per tutta la build: se Supabase
 *   non risponde, le altre schede non riprovano una per una (690 attese). A sito acceso la variabile non si usa, per
 *   non servire una lettura vecchia dopo `updateTag`.
 * Dentro `unstable_cache` le fetch di Supabase non passano dalla cache (`force-no-store`, patch-fetch di Next) e non
 * abbassano la rigenerazione della pagina: vale solo quella dichiarata qui.
 *
 * Gli errori non si mettono in cache: la funzione interna lancia, `loadDeckRefs` risponde `null` e la scheda non dice
 * niente sui mazzi (mai "nessun mazzo la usa" per un errore di rete). Con la community spenta la risposta è `null`
 * per lo stesso motivo.
 */

/** Etichetta della cache dei mazzi pubblicati: la usano le schede carta e la invalidano le Server Action dei mazzi. */
export const COMMUNITY_DECKS_TAG = "community-decks";
/** Etichetta della cache delle tier list salvate (punteggio della community sulla scheda carta). */
export const COMMUNITY_TIER_LISTS_TAG = "community-tier-lists";
/** Secondi di validità delle due letture, come riserva se una rigenerazione su richiesta non arriva. */
export const CARD_DATA_REVALIDATE = 3600;

const building = process.env.NEXT_PHASE === "phase-production-build";

/** Colonne che servono alle schede carta: niente guida intera né codici, solo quello che decide la lingua. */
const DECK_COLUMNS =
  "id, slug, name, legendary, cards, archetype, guide, created_at, updated_at, profile:profiles!community_decks_owner_fkey(username, display_name, badge)";

type Row = {
  id: string;
  slug: string;
  name: string;
  legendary: string | null;
  cards: string[] | null;
  archetype: string;
  guide: Guide;
  translations?: DeckTranslations | null;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
};

/** Esito di una lettura: `null` quando la community è spenta (nessun dato da dire). */
async function fetchDeckRefs(): Promise<DeckRef[] | null> {
  const client = supabasePublic();
  if (!client) return null;
  const read = (columns: string) =>
    client.from("community_decks").select(columns).eq("status", "published").order("created_at", { ascending: false }).limit(1000);
  // Come in queries.ts: se la colonna delle traduzioni non c'è ancora (migrazione non applicata) si rilegge senza.
  let res = await read(`${DECK_COLUMNS}, translations`);
  if (res.error && (res.error.code === "42703" || res.error.message.includes("translations"))) res = await read(DECK_COLUMNS);
  if (res.error) throw new Error(`[community] decksByCard: ${res.error.message}`);
  const rows = (res.data ?? []) as unknown as Row[];
  const ratings = new Map<string, { avg: number; votes: number }>();
  if (rows.length) {
    const { data, error } = await client
      .from("deck_ratings")
      .select("deck_id, avg_stars, votes")
      .in(
        "deck_id",
        rows.map((r) => r.id),
      );
    if (error) throw new Error(`[community] decksByCard, voti: ${error.message}`);
    for (const r of (data ?? []) as { deck_id: string; avg_stars: number | string; votes: number | string }[])
      ratings.set(r.deck_id, { avg: Number(r.avg_stars), votes: Number(r.votes) });
  }
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    legendary: r.legendary,
    cards: r.cards ?? [],
    archetype: r.archetype,
    rating: ratings.get(r.id) ?? { avg: 0, votes: 0 },
    created: r.created_at,
    updated: r.updated_at,
    author: authorName(r.profile),
    badge: r.profile?.badge ?? "community",
    locales: guideLocales(r, locales),
  }));
}

let buildDecks: Promise<DeckRef[] | null> | undefined;

const cachedDeckRefs = unstable_cache(
  async () => {
    if (!building) return fetchDeckRefs();
    buildDecks ??= fetchDeckRefs();
    return buildDecks;
  },
  ["card-pages-decks-v1"],
  { tags: [COMMUNITY_DECKS_TAG], revalidate: CARD_DATA_REVALIDATE },
);

/**
 * I mazzi pubblicati, ridotti a `DeckRef`, dalla cache condivisa. `null` se la lettura non è riuscita o la community è
 * spenta: chi la usa non deve trattarlo come "nessun mazzo".
 */
export async function loadDeckRefs(): Promise<DeckRef[] | null> {
  try {
    return await cachedDeckRefs();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return null;
  }
}

/** Punteggi della tier list della community, per tipo di lista: quante liste ci sono e la media di ogni carta. */
export type CommunityScores = Record<TierKind, { lists: number; scores: Record<string, { tier: Tier; avg: number; votes: number }> }>;

async function fetchCommunityScores(): Promise<CommunityScores | null> {
  const client = supabasePublic();
  if (!client) return null;
  const { data, error } = await client.from("tier_lists").select("kind, entries").eq("status", "published").limit(5000);
  if (error) throw new Error(`[community] tier list per le schede carta: ${error.message}`);
  const lists = (data ?? []) as { kind: TierKind; entries: unknown }[];
  const out = {} as CommunityScores;
  for (const kind of ["legendaries", "cards"] as const) {
    const ofKind = lists.filter((l) => l.kind === kind);
    const scores: CommunityScores[TierKind]["scores"] = {};
    for (const s of aggregateLists(ofKind)) scores[s.slug] = { tier: s.tier, avg: s.avg, votes: s.votes };
    out[kind] = { lists: ofKind.length, scores };
  }
  return out;
}

let buildScores: Promise<CommunityScores | null> | undefined;

const cachedScores = unstable_cache(
  async () => {
    if (!building) return fetchCommunityScores();
    buildScores ??= fetchCommunityScores();
    return buildScores;
  },
  ["card-pages-tier-lists-v1"],
  { tags: [COMMUNITY_TIER_LISTS_TAG], revalidate: CARD_DATA_REVALIDATE },
);

/** La tier list della community ridotta ai punteggi, dalla cache condivisa; `null` se la lettura non è riuscita. */
export async function loadCommunityScores(): Promise<CommunityScores | null> {
  try {
    return await cachedScores();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Rigenera le schede carta dopo un cambio nei mazzi pubblicati (da chiamare SOLO dentro una Server Action).
 * - `gone = false` (pubblicazione, modifica, ripubblicazione): `revalidateTag` con il profilo "max", come consiglia la
 *   documentazione di Next 16: la prossima visita di ogni scheda riceve ancora la versione vecchia e ne fa partire
 *   una nuova in background.
 * - `gone = true` (mazzo nascosto o eliminato): `updateTag`, che scade subito lettura e schede: la visita successiva
 *   aspetta i dati nuovi, così nessuna scheda continua a linkare un mazzo che non c'è più.
 */
export function refreshCardDecks(gone = false): void {
  if (gone) updateTag(COMMUNITY_DECKS_TAG);
  else revalidateTag(COMMUNITY_DECKS_TAG, "max");
}
