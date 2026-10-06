import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";
import { cardRatingsFrom, type CardRating, type CardRatingRow } from "@/lib/cardVotes";
import { CommunityReadError } from "./queries";

/**
 * Letture dei voti alle carte (06/10/2026, blocco VOTI ALLE CARTE di schema.sql): solo aggregati, dalle due funzioni
 * security definer `card_ratings` (media, voti e distribuzione per carta) e `card_vote_totals` (voti, votanti, carte
 * votate, ultimo voto). Chi ha votato che cosa non esce mai dal database.
 * - `readCardVotes`: per la sezione Tier list (`loadTierData`, pagine in ISR) e per la sitemap; `null` prima della
 *   migrazione (funzioni o tabella mancanti), così la pagina dice che i voti non sono ancora attivi; con un altro errore
 *   lancia (DECKS-12: la rigenerazione fallisce e resta la pagina di prima, non una tier list vuota).
 * - `loadCardRatings`: per le 690 schede carta, una lettura sola condivisa nella cache dei dati di Next (un'ora di
 *   riserva, come i mazzi delle schede in decksByCard.ts); `voteCard` la segna vecchia a ogni voto (`revalidateTag` con
 *   il profilo "max", dal 7/10/2026): le schede si rigenerano in background alla visita successiva, una per una, mai
 *   tutte insieme. Il widget mostra comunque subito media e voti dalla risposta della Server Action.
 */

/** Etichetta della cache dei voti alle carte nelle schede: la invalida `voteCard` a ogni voto; `CARD_VOTES_REVALIDATE` è la riserva. */
export const CARD_VOTES_TAG = "community-card-votes";
export const CARD_VOTES_REVALIDATE = 3600;
/** Da aggiornare (v2, v3…) se cambia la forma di `CardVotesData`: la cache dei dati di Vercel sopravvive ai deploy. */
const CACHE_KEY = "card-pages-card-votes-v2";

/** La migrazione non c'è: lo stato NON va in cache (la notte del 6/10 è rimasto un'ora sulle schede dopo la migrazione). */
class CardVotesUnavailable extends Error {}

const building = process.env.NEXT_PHASE === "phase-production-build";

export type CardVoteTotals = { votes: number; voters: number; cards: number; latest?: string };
export type CardVotesData = { ratings: Record<string, CardRating>; totals: CardVoteTotals };

/** L'errore dice che la migrazione non c'è ancora: tabella o funzioni mancanti. */
export function cardVotesMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (["42P01", "42883", "PGRST202"].includes(error.code ?? "")) return true;
  const msg = error.message ?? "";
  return /card_votes|card_ratings|card_vote_totals/.test(msg) && /does not exist|could not find/i.test(msg);
}

async function fetchCardVotes(): Promise<CardVotesData | null> {
  const client = supabasePublic();
  if (!client) return null;
  const [ratings, totals] = await Promise.all([client.rpc("card_ratings"), client.rpc("card_vote_totals")]);
  if (ratings.error) {
    if (cardVotesMissing(ratings.error)) return null;
    throw new CommunityReadError("card_ratings", ratings.error.message);
  }
  if (totals.error) {
    if (cardVotesMissing(totals.error)) return null;
    throw new CommunityReadError("card_vote_totals", totals.error.message);
  }
  const row = (totals.data ?? [])[0];
  return {
    ratings: cardRatingsFrom((ratings.data ?? []) as CardRatingRow[]),
    totals: { votes: Number(row?.votes ?? 0), voters: Number(row?.voters ?? 0), cards: Number(row?.cards ?? 0), latest: row?.latest ?? undefined },
  };
}

/** Voti alle carte per la sezione Tier list: `null` con la community spenta o prima della migrazione; errori lanciati. */
export async function readCardVotes(): Promise<CardVotesData | null> {
  return fetchCardVotes();
}

let buildVotes: Promise<CardVotesData | null> | undefined;

const cachedCardVotes = unstable_cache(
  async () => {
    // durante la build una lettura sola per processo, come i mazzi delle schede carta
    const data = building ? await (buildVotes ??= fetchCardVotes()) : await fetchCardVotes();
    // `null` (migrazione non applicata) non si mette in cache: un errore non viene conservato, e alla visita dopo si rilegge
    if (data === null) throw new CardVotesUnavailable();
    return data;
  },
  [CACHE_KEY],
  { tags: [CARD_VOTES_TAG], revalidate: CARD_VOTES_REVALIDATE },
);

/**
 * Voti alle carte per le schede carta, dalla cache condivisa. `null` con la community spenta o prima della migrazione
 * (senza metterlo in cache). Durante la build un errore diventa `null` (la scheda esce senza i numeri dei voti); a sito
 * acceso si rilancia, così l'ISR tiene l'ultima versione riuscita della pagina.
 */
export async function loadCardRatings(): Promise<CardVotesData | null> {
  try {
    return await cachedCardVotes();
  } catch (e) {
    if (e instanceof CardVotesUnavailable) return null;
    console.error(e instanceof Error ? e.message : e);
    if (!building) throw e;
    return null;
  }
}
