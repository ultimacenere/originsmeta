import type { Db } from "@/lib/supabase/public";
import { normalizeComicStatRow, rankComics, type ComicStatRow, type RankedComic } from "./comicStats";
import { shiftDay } from "./deckStats";
import { readPages } from "./deckStatsQueries";
import type { ComicAuthor, ComicStatus } from "./comics";

/*
 * Letture delle statistiche dei fumetti (02/11/2026) per il pannello privato di /account, che è dinamico: tutte con il
 * client della sessione dell'utente, così la policy di `comic_stats_daily` fa vedere a chi disegna i suoi fumetti e allo
 * staff (admin o tag Staff) tutti. Un errore non rompe /account: il pannello dice che le statistiche non sono disponibili
 * (per esempio prima della migrazione del blocco STATISTICHE DEI FUMETTI). Letture a pagine come i mazzi (`readPages`).
 */

const STAT_SELECT = "comic_id, day, lang, views, reads";

const toRows = (raw: unknown[]): ComicStatRow[] => raw.flatMap((r) => normalizeComicStatRow(r) ?? []);

/** Contatori dei fumetti dell'autore (tutti i giorni e tutte le lingue). `available: false` se la tabella non si legge. */
export async function readOwnComicStats(client: Db, comicIds: readonly string[]): Promise<{ available: boolean; rows: ComicStatRow[] }> {
  if (!comicIds.length) return { available: true, rows: [] };
  const stats = await readPages((from, to) => client.from("comic_stats_daily").select(STAT_SELECT).in("comic_id", [...comicIds]).order("comic_id").order("day").range(from, to));
  if (stats.error) console.error("[comic stats] comic_stats_daily:", stats.error);
  return { available: !stats.error, rows: stats.error ? [] : toRows(stats.rows) };
}

/** Un fumetto della classifica dello staff; `comic` null se chi guarda non lo può leggere. */
export type RankedComicInfo = RankedComic & { comic: { slug: string; title: string; status: ComicStatus; profile: ComicAuthor | null } | null };

/**
 * Classifica dello staff: i fumetti più visti negli ultimi 30 giorni (`rankComics`), con titolo, slug e autore. Le righe
 * di tutti i fumetti le vede solo lo staff (policy SQL): per un altro utente conterrebbe i soli suoi fumetti, e il
 * pannello non la chiede. `complete: false` se le righe erano più di quelle lette (il pannello lo dice).
 */
export async function readComicStaffRanking(client: Db, today: string, limit = 20): Promise<{ available: boolean; complete: boolean; ranked: RankedComicInfo[] }> {
  const since = shiftDay(today, -29);
  const stats = await readPages((from, to) => client.from("comic_stats_daily").select(STAT_SELECT).gte("day", since).order("comic_id").order("day").range(from, to));
  if (stats.error) {
    console.error("[comic stats] classifica:", stats.error);
    return { available: false, complete: false, ranked: [] };
  }
  const ranked = rankComics(toRows(stats.rows), today, limit);
  if (!ranked.length) return { available: true, complete: stats.complete, ranked: [] };
  const { data, error } = await client
    .from("community_comics")
    .select("id, slug, title, status, profile:profiles!community_comics_owner_fkey(username, display_name, avatar_url, badge)")
    .in(
      "id",
      ranked.map((r) => r.comic_id),
    );
  if (error) console.error("[comic stats] fumetti della classifica:", error.message);
  type InfoRow = { id: string; slug: string; title: string; status: ComicStatus; profile: ComicAuthor | null };
  const info = new Map(((data ?? []) as unknown as InfoRow[]).map((c) => [c.id, c]));
  return {
    available: true,
    complete: stats.complete,
    ranked: ranked.map((r) => {
      const c = info.get(r.comic_id);
      return { ...r, comic: c ? { slug: c.slug, title: c.title, status: c.status, profile: c.profile } : null };
    }),
  };
}
