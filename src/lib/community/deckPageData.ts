import { unstable_cache } from "next/cache";
import { getCommunityDeck, listDeckPopularity, listDeckVersions, listPublishedDecks } from "./queries";
import { readListWinrates } from "./trackerStatsQueries";
import { deckIndexable } from "./deckQuality";
import { authorName } from "./util";
import { isTheoryDeck } from "@/lib/theoryCraft";
import type { ListStat } from "@/lib/tracker/stats";
import type { PatchId } from "@/lib/data/cards";

/**
 * Letture delle schede dei mazzi della community (/decks/community/<slug>) con una scadenza lunga (piano di riduzione
 * dei costi dell'08/11/2026, intervento 1, fatto il 14/11/2026).
 *
 * Il problema: la scheda dichiarava `revalidate = 60`, ma anche alzandola non sarebbe cambiato niente, perché ogni lettura
 * di `supabasePublic()` porta `next: { revalidate: 60 }` e Next usa per la pagina la scadenza più bassa fra quelle delle
 * sue fetch (docs/01-app/02-guides/incremental-static-regeneration.md, "Caveats"). Così ogni scheda visitata si
 * rigenerava ogni minuto: era la route con più ISR Writes in Observability (100.000 unità su 472.000 in 12 ore, 8/11).
 *
 * Qui le letture passano da `unstable_cache`, come le schede carta in decksByCard.ts: dentro la cache le fetch di
 * Supabase non abbassano la rigenerazione della pagina, vale solo `DECK_PAGE_REVALIDATE`. La freschezza la danno le
 * rigenerazioni su richiesta, che ci sono già: `revalidatePath` della scheda in tutte le lingue a ogni pubblicazione,
 * modifica, cambio di stato, eliminazione e traduzione (actions.ts, translate.ts), a ogni voto (`voteDeck`) e a ogni
 * salvataggio (favoriteActions.ts). `revalidatePath` fa scadere anche le voci di questa cache lette dalla pagina (i tag
 * impliciti della pagina, `softTags` nell'IncrementalCache di Next), quindi la scheda rifatta legge i dati nuovi.
 *
 * Cosa resta indietro fino a `DECK_PAGE_REVALIDATE`, accettato: i mazzi collegati in fondo alla scheda e i loro voti, il
 * win rate del Tracker (che cambia con le partite caricate, non con un'azione del sito), il nome e il badge dell'autore
 * se li cambia nel profilo. I commenti non contano: li carica il browser da /api/deck-comments.
 *
 * Tre voci:
 * - `deckData(slug)`: il mazzo con voti e versioni, una voce per mazzo;
 * - `relatedPool()`: i mazzi pubblicati ridotti a quello che serve a "Altri mazzi" e all'autore editoriale, una voce per
 *   tutte le schede (le guide intere di 200 mazzi non vanno tenute nella cache);
 * - `deckSideData()`: i salvataggi di ogni mazzo e i win rate delle liste giocate, una voce ciascuno per tutte le schede,
 *   perché sono funzioni del database che leggono tutto (`tracker_stats_bundle` è la lettura più pesante del sito).
 * Gli errori non si mettono in cache (`unstable_cache` non salva un'eccezione): l'ISR tiene la scheda di prima.
 */

/** Secondi di validità delle letture e della scheda: 12 ore (la scheda dichiara lo stesso numero, scritto per esteso). */
export const DECK_PAGE_REVALIDATE = 43_200;

/** Un mazzo pubblicato ridotto per i collegamenti della scheda. */
export type RelatedDeck = {
  slug: string;
  name: string;
  legendary: string | null;
  created_at: string;
  owner: string;
  theory: boolean;
  /** la guida supera la soglia di parole (`deckIndexable`), calcolato prima di salvare */
  indexable: boolean;
  rating?: { avg: number; votes: number };
  author: string;
};

export type DeckSideData = {
  /** salvataggi per id del mazzo; null quando la migrazione dei preferiti manca (allora niente tasto) */
  favorites: Record<string, number> | null;
  /** win rate per chiave della lista esatta (`deckListKey`); null prima della migrazione, sotto soglia o con un errore */
  winrates: { patch: PatchId; lists: Record<string, ListStat> } | null;
};

/**
 * Chiavi delle voci. La chiave di `unstable_cache` dipende dal testo della funzione e dagli argomenti, non dalla forma
 * dei dati: DA AGGIORNARE (v2, v3…) quando cambia la forma di quello che le funzioni restituiscono.
 */
const DECK_KEY = "deck-page-deck-v1";
const POOL_KEY = "deck-page-related-v1";
const FAVORITES_KEY = "deck-page-favorites-v1";
const WINRATES_KEY = "deck-page-winrates-v1";

const cachedDeck = unstable_cache(
  async (slug: string) => {
    const deck = await getCommunityDeck(slug);
    if (!deck) return null;
    const versions = typeof deck.version === "number" && deck.version > 1 ? await listDeckVersions(deck.id) : [];
    return { deck, versions };
  },
  [DECK_KEY],
  { revalidate: DECK_PAGE_REVALIDATE },
);

const cachedPool = unstable_cache(
  async (): Promise<RelatedDeck[]> =>
    (await listPublishedDecks()).map((d) => ({
      slug: d.slug,
      name: d.name,
      legendary: d.legendary,
      created_at: d.created_at,
      owner: d.owner,
      theory: isTheoryDeck(d),
      indexable: deckIndexable(d),
      rating: d.rating,
      author: authorName(d.profile),
    })),
  [POOL_KEY],
  { revalidate: DECK_PAGE_REVALIDATE },
);

const cachedFavorites = unstable_cache(
  async (): Promise<DeckSideData["favorites"]> => {
    const popularity = await listDeckPopularity();
    return popularity ? Object.fromEntries([...popularity].map(([id, p]) => [id, p.favorites])) : null;
  },
  [FAVORITES_KEY],
  { revalidate: DECK_PAGE_REVALIDATE },
);

const cachedWinrates = unstable_cache(
  async (): Promise<DeckSideData["winrates"]> => {
    const winrates = await readListWinrates({ throwOnError: true });
    return winrates ? { patch: winrates.patch, lists: Object.fromEntries(winrates.lists) } : null;
  },
  [WINRATES_KEY],
  { revalidate: DECK_PAGE_REVALIDATE },
);

/** Il mazzo pubblicato con le versioni precedenti delle carte; null se non c'è (404 vera). Con un errore lancia. */
export function deckData(slug: string) {
  return cachedDeck(slug);
}

/** I mazzi pubblicati, ridotti, per "Altri mazzi" e per l'autore editoriale. Con un errore lancia. */
export function relatedPool(): Promise<RelatedDeck[]> {
  return cachedPool();
}

/**
 * Salvataggi e win rate di tutti i mazzi, per la scheda. Un errore dei salvataggi lancia, come prima (l'ISR tiene la
 * scheda di prima); un errore dei win rate vale "nessun win rate" solo per questa rigenerazione: non entra nella cache,
 * e il riquadro è facoltativo (prima del 14/11 era lo stesso, ma per 5 minuti).
 */
export async function deckSideData(): Promise<DeckSideData> {
  const [favorites, winrates] = await Promise.all([
    cachedFavorites(),
    cachedWinrates().catch((error: unknown) => {
      console.error("[community] win rate delle schede dei mazzi:", error instanceof Error ? error.message : error);
      return null;
    }),
  ]);
  return { favorites, winrates };
}
