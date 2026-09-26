import type { Db } from "@/lib/supabase/public";
import type { Profile } from "./types";
import { canSeeAllStats, normalizeStatRow, rankDecks, shiftDay, type DeckStatRow, type DeckVoteStat, type RankedDeck } from "./deckStats";

/*
 * Letture delle statistiche dei mazzi (pacchetto STATS, 26/09/2026) per il pannello privato di /account, che è
 * dinamico: tutte con il client della sessione dell'utente, così la policy di `deck_stats_daily` fa vedere all'autore i
 * suoi mazzi e allo staff (admin o tag Staff) tutti. Un errore non rompe /account: il pannello dice che le statistiche
 * non sono disponibili (per esempio prima che Pierluigi applichi supabase/schema.sql, blocco STATS).
 *
 * PostgREST restituisce al massimo 1000 righe per richiesta: si legge a pagine, con un tetto. Con i numeri di oggi
 * (decine di mazzi) basta e avanza; quando le righe di un autore o dello staff saranno decine di migliaia, meglio una
 * funzione SQL che sommi sul database.
 */

const PAGE = 1000;
const MAX_PAGES = 20;

type PageResult = { data: unknown; error: { message: string } | null };

/**
 * Tutte le righe di una lettura a pagine (`range`), fino a MAX_PAGES; al primo errore restituisce l'errore.
 * `complete: false` quando si è fermata al tetto con altre righe ancora da leggere (il pannello lo dice).
 */
async function readPages(page: (from: number, to: number) => PromiseLike<PageResult>): Promise<{ rows: unknown[]; error: string | null; complete: boolean }> {
  const rows: unknown[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await page(i * PAGE, i * PAGE + PAGE - 1);
    if (res.error) return { rows, error: res.error.message, complete: false };
    const data = Array.isArray(res.data) ? res.data : [];
    rows.push(...data);
    if (data.length < PAGE) return { rows, error: null, complete: true };
  }
  return { rows, error: null, complete: false };
}

const STAT_SELECT = "deck_id, day, views, code_copies, link_clicks, video_plays";

const toStatRows = (raw: unknown[]): DeckStatRow[] => raw.flatMap((r) => normalizeStatRow(r) ?? []);

/** Admin o tag Staff: vede anche la classifica di tutti i mazzi. */
export async function readStatsViewer(client: Db, userId: string): Promise<{ staff: boolean }> {
  const { data, error } = await client.from("profiles").select("role, badge").eq("id", userId).maybeSingle();
  if (error) console.error("[deck stats] profilo:", error.message);
  return { staff: canSeeAllStats(data as { role?: string; badge?: string } | null) };
}

/**
 * Contatori e voti dei mazzi dell'autore (tutti i giorni). `available: false` se la tabella non si legge; i voti che
 * non si leggono restano vuoti, senza spegnere il resto.
 */
export async function readOwnDeckStats(client: Db, deckIds: readonly string[]): Promise<{ available: boolean; rows: DeckStatRow[]; votes: DeckVoteStat[] }> {
  if (!deckIds.length) return { available: true, rows: [], votes: [] };
  const ids = [...deckIds];
  const [stats, votes] = await Promise.all([
    readPages((from, to) => client.from("deck_stats_daily").select(STAT_SELECT).in("deck_id", ids).order("deck_id").order("day").range(from, to)),
    readPages((from, to) => client.from("deck_votes").select("deck_id, stars, created_at").in("deck_id", ids).order("deck_id").order("user_id").range(from, to)),
  ]);
  if (stats.error) console.error("[deck stats] deck_stats_daily:", stats.error);
  if (votes.error) console.error("[deck stats] deck_votes:", votes.error);
  return {
    available: !stats.error,
    rows: stats.error ? [] : toStatRows(stats.rows),
    votes: votes.error ? [] : (votes.rows as DeckVoteStat[]),
  };
}

/** Un mazzo della classifica dello staff; null se chi guarda non lo può leggere (nascosto, e chi guarda non è admin). */
export type RankedDeckInfo = RankedDeck & { deck: { slug: string; name: string; status: string; profile: Profile | null } | null };

/**
 * Classifica dello staff: i mazzi più visti negli ultimi 30 giorni (`rankDecks`), con nome, slug e autore. Le righe di
 * tutti i mazzi le vede solo lo staff (policy SQL): per un altro utente la classifica conterrebbe i soli suoi mazzi, e
 * il pannello non la chiede. `complete: false` se le righe dei 30 giorni erano più di quelle lette (la classifica è
 * parziale e il pannello lo dice): allora conviene una funzione SQL che sommi sul database.
 */
export async function readStaffRanking(client: Db, today: string, limit = 20): Promise<{ available: boolean; complete: boolean; ranked: RankedDeckInfo[] }> {
  const since = shiftDay(today, -29);
  const stats = await readPages((from, to) => client.from("deck_stats_daily").select(STAT_SELECT).gte("day", since).order("deck_id").order("day").range(from, to));
  if (stats.error) {
    console.error("[deck stats] classifica:", stats.error);
    return { available: false, complete: false, ranked: [] };
  }
  const ranked = rankDecks(toStatRows(stats.rows), today, limit);
  if (!ranked.length) return { available: true, complete: stats.complete, ranked: [] };
  const { data, error } = await client
    .from("community_decks")
    .select("id, slug, name, status, profile:profiles!community_decks_owner_fkey(username, display_name, avatar_url, badge)")
    .in(
      "id",
      ranked.map((r) => r.deck_id),
    );
  if (error) console.error("[deck stats] mazzi della classifica:", error.message);
  type DeckInfoRow = { id: string; slug: string; name: string; status: string; profile: Profile | null };
  const info = new Map(((data ?? []) as DeckInfoRow[]).map((d) => [d.id, d]));
  return {
    available: true,
    complete: stats.complete,
    ranked: ranked.map((r) => {
      const d = info.get(r.deck_id);
      return { ...r, deck: d ? { slug: d.slug, name: d.name, status: d.status, profile: d.profile } : null };
    }),
  };
}
