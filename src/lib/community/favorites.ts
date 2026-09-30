/*
 * Mazzi salvati ("Salva") e ordine "Di tendenza" (30/09/2026, dal confronto con i siti concorrenti: un rivale ha
 * "Favorite" e "Trending" sui mazzi). Chi decide è il database (supabase/schema.sql, blocco PREFERITI E TENDENZA):
 * qui le costanti che il test confronta con l'SQL e le regole pure dell'ordinamento. Nessun import a runtime: lo
 * esegue anche Node nei test.
 */

/** Mazzi salvati al massimo per utente (trigger guard_deck_favorite), come FOLLOW_MAX dei "Segui". */
export const FAVORITE_MAX = 500;

/** Finestra e pesi del punteggio "Di tendenza" (funzione deck_trending): uguali all'SQL, il test li confronta. */
export const TRENDING_DAYS = 7;
export const TRENDING_WEIGHTS = { views: 1, code_copies: 3, link_clicks: 1, video_plays: 2, votes: 4, favorites: 5 } as const;

/** Popolarità di un mazzo letta dal database: punteggio della settimana e numero di salvataggi (0 se nessuno). */
export type DeckPopularity = { trend: number; favorites: number };

/** Righe delle due funzioni del database → una mappa per mazzo. Righe senza id o con numeri non validi si scartano. */
export function popularityMap(
  trending: readonly { deck_id: string; score: number | string }[],
  favorites: readonly { deck_id: string; favorites: number | string }[],
): Map<string, DeckPopularity> {
  const out = new Map<string, DeckPopularity>();
  const at = (id: string) => out.get(id) ?? { trend: 0, favorites: 0 };
  for (const r of trending) {
    const n = Number(r.score);
    if (r.deck_id && Number.isFinite(n) && n > 0) out.set(r.deck_id, { ...at(r.deck_id), trend: n });
  }
  for (const r of favorites) {
    const n = Number(r.favorites);
    if (r.deck_id && Number.isInteger(n) && n > 0) out.set(r.deck_id, { ...at(r.deck_id), favorites: n });
  }
  return out;
}

type Sortable = { trend?: number; favorites?: number; created?: string; updated: string };

/**
 * Ordine "Di tendenza": punteggio della settimana, poi salvataggi, poi il più recente (i mazzi senza movimento nella
 * settimana restano in fondo dal più nuovo, così la lista non si mescola a caso). "Più salvati": salvataggi, poi
 * punteggio, poi il più recente.
 */
export function compareTrending(a: Sortable, b: Sortable): number {
  return (b.trend ?? 0) - (a.trend ?? 0) || (b.favorites ?? 0) - (a.favorites ?? 0) || (b.created ?? b.updated).localeCompare(a.created ?? a.updated);
}

export function compareSaved(a: Sortable, b: Sortable): number {
  return (b.favorites ?? 0) - (a.favorites ?? 0) || (b.trend ?? 0) - (a.trend ?? 0) || (b.created ?? b.updated).localeCompare(a.created ?? a.updated);
}

/** Funzione del database che non c'è ancora (blocco PREFERITI E TENDENZA non applicato): si fa senza. */
export function popularityMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01" || error.code === "PGRST205") return true;
  return /deck_trending|deck_favorite|deck_favorites/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "");
}
