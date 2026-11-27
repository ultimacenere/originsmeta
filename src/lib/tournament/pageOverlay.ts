/**
 * La parte personale della scheda torneo sopra la copia in cache (27/11/2026, pageData.ts). La cache tiene iscritti e
 * partite uguali per tutti fino a 15 secondi; la riga di chi guarda e le sue partite si leggono invece con la sua
 * sessione a ogni visita e prendono il posto delle loro copie. Così chi si iscrive, fa il check-in o riceve un referto
 * vede subito il suo stato (tasto, banner, "la tua partita"), e gli altri lo vedono entro 15 secondi.
 * Funzioni pure: test in pageOverlay.test.ts.
 */

type PlayerLike = { user_id: string; created_at: string };
type MatchLike = { id: string; round: number; position: number };

/**
 * Gli iscritti con la riga fresca di chi guarda. `mine`: la riga letta con la sua sessione, `null` se non è iscritto,
 * `undefined` se la lettura non c'è stata o è fallita (si lascia la copia in cache). L'ordine resta quello della
 * lettura (`created_at` crescente), che decide anche il posto in lista d'attesa.
 */
export function overlayPlayers<T extends PlayerLike>(list: T[], viewer: string | null, mine: T | null | undefined): T[] {
  if (!viewer || mine === undefined) return list;
  const rest = list.filter((p) => p.user_id !== viewer);
  if (!mine) return rest;
  const at = rest.findIndex((p) => p.created_at > mine.created_at);
  return at < 0 ? [...rest, mine] : [...rest.slice(0, at), mine, ...rest.slice(at)];
}

/**
 * Le partite con quelle fresche di chi guarda: le sue sostituiscono le copie in cache con lo stesso id, quelle che la
 * cache non ha ancora (un turno appena generato) si aggiungono, nell'ordine della lettura (turno, posizione).
 */
export function overlayMatches<T extends MatchLike>(list: T[], mine: T[]): T[] {
  if (!mine.length) return list;
  const fresh = new Map(mine.map((m) => [m.id, m]));
  const merged = list.map((m) => fresh.get(m.id) ?? m);
  const known = new Set(list.map((m) => m.id));
  const added = mine.filter((m) => !known.has(m.id));
  if (!added.length) return merged;
  return [...merged, ...added].sort((a, b) => a.round - b.round || a.position - b.position);
}
