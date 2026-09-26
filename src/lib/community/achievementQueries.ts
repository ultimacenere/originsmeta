import { supabasePublic, type Db } from "@/lib/supabase/public";
import { finalWinners, isMissing, parsePublicStats, parseRemoteFacts, type FinalRow, type PublicStats, type RemoteFacts } from "./achievements";
import { authorName } from "./util";

/**
 * Letture del pacchetto TRAGUARDI (27/09/2026): fatti dei traguardi e numeri pubblici della vetrina (funzioni SQL di
 * supabase/wave2-TRAGUARDI.sql), vincitori dei tornei in evidenza, impostazione `show_stats` in /account.
 *
 * Errori. Sono aggiunte alla pagina /u, non la sua sostanza: una lettura fallita non la ferma (a differenza di mazzi e
 * tier list, queries.ts, DECKS-12), si scrive nei log e la sezione non compare fino alla rigenerazione successiva (ISR,
 * al massimo 5 minuti). Una funzione o una colonna che non c'è ancora (codice online prima della migrazione: 404 /
 * PGRST202, 42883, 42703) vale "non disponibile" e non si richiede per `MISSING_RETRY_MS`, poi si riprova da sola, senza
 * un nuovo deploy (stesso schema di `missingUntil` in creators.ts).
 */

/** Per quanto tempo, dopo una risposta "non esiste", non si interroga più il database (poi si riprova). */
const MISSING_RETRY_MS = 5 * 60_000;

type Gate = { missingUntil: number; logged: boolean };
const gates: Record<"facts" | "stats", Gate> = {
  facts: { missingUntil: 0, logged: false },
  stats: { missingUntil: 0, logged: false },
};

const open = (gate: Gate) => Date.now() >= gate.missingUntil;

/** Segna la funzione come mancante (una riga nei log la prima volta) e dice se lo era. */
function markMissing(gate: Gate, res: Parameters<typeof isMissing>[0], what: string): boolean {
  if (!isMissing(res)) return false;
  gate.missingUntil = Date.now() + MISSING_RETRY_MS;
  if (!gate.logged) {
    gate.logged = true;
    console.error(`[achievements] manca ${what}: va applicato supabase/wave2-TRAGUARDI.sql (pacchetto TRAGUARDI)`);
  }
  return true;
}

/**
 * Tornei giocati, organizzati e vinti e mesi da "mazzo del mese" di un profilo (`profile_achievement_facts`, security
 * invoker: col client anonimo vede solo i dati pubblici). null se la community è spenta, se la funzione non c'è ancora
 * o se la lettura fallisce: allora quei traguardi non compaiono. Richiesta GET, così passa dalla cache dei dati di Next
 * come le altre letture pubbliche (60 s).
 */
export async function readAchievementFacts(profileId: string): Promise<RemoteFacts | null> {
  const client = supabasePublic();
  if (!client || !open(gates.facts)) return null;
  const res = await client.rpc("profile_achievement_facts", { pid: profileId }, { get: true });
  if (markMissing(gates.facts, res, "la funzione profile_achievement_facts")) return null;
  if (res.error) {
    console.error("[achievements] profile_achievement_facts:", res.error.message);
    return null;
  }
  return parseRemoteFacts(res.data);
}

/**
 * I numeri pubblici di un profilo con vetrina (`profile_public_stats`): solo se lui ha acceso `show_stats`, altrimenti
 * null (la funzione non restituisce righe). null anche con la funzione mancante o un errore.
 */
export async function readPublicStats(profileId: string): Promise<PublicStats | null> {
  const client = supabasePublic();
  if (!client || !open(gates.stats)) return null;
  const res = await client.rpc("profile_public_stats", { pid: profileId }, { get: true });
  if (markMissing(gates.stats, res, "la funzione profile_public_stats")) return null;
  if (res.error) {
    console.error("[achievements] profile_public_stats:", res.error.message);
    return null;
  }
  return parsePublicStats(res.data);
}

/** Chi ha vinto un torneo, per la riga sotto la sua scheda: nome da mostrare e nome utente (link al profilo). */
export type TournamentWinner = { name: string; username: string | null };

/**
 * I vincitori dei tornei finiti (tornei in evidenza sulla vetrina): le partite in posizione 0 del tabellone, una per
 * turno, e l'ultima è la finale (`finalWinners`); poi i nomi dei vincitori. Le policy (`can_view_tournament`) fanno
 * vedere al client anonimo solo i tornei pubblici, e la vetrina chiede solo quelli. Con un errore: nessun vincitore.
 */
export async function readTournamentWinners(tournamentIds: readonly string[]): Promise<Map<string, TournamentWinner>> {
  const out = new Map<string, TournamentWinner>();
  const client = supabasePublic();
  if (!client || !tournamentIds.length) return out;
  const matches = await client.from("tournament_matches").select("tournament_id, round, position, winner, status").in("tournament_id", [...tournamentIds]).eq("position", 0);
  if (matches.error) {
    console.error("[achievements] vincitori dei tornei:", matches.error.message);
    return out;
  }
  const winners = finalWinners((matches.data ?? []) as FinalRow[]);
  const ids = [...new Set(winners.values())];
  if (!ids.length) return out;
  const profiles = await client.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  if (profiles.error) {
    console.error("[achievements] nomi dei vincitori:", profiles.error.message);
    return out;
  }
  const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  for (const [tid, uid] of winners) {
    const p = byId.get(uid);
    // un vincitore che ha cancellato l'account non ha più un profilo: niente riga
    if (p) out.set(tid, { name: authorName(p), username: p.username });
  }
  return out;
}

/**
 * La propria impostazione "Mostra i numeri sulla vetrina" per /account (client con la sessione, pagina dinamica):
 * `missing` se la colonna non c'è ancora (la casella lo dice e non si salva), `error` se la lettura è fallita.
 * Legge sempre: in una pagina dinamica una query in più non costa, e appena la migrazione c'è la casella compare.
 */
export async function readOwnShowStats(client: Db, userId: string): Promise<{ status: "ok" | "missing" | "error"; showStats: boolean; badge: string | null }> {
  const res = await client.from("profiles").select("badge, show_stats").eq("id", userId).maybeSingle();
  if (res.error) {
    const missing = isMissing(res);
    if (!missing) console.error("[achievements] show_stats:", res.error.message);
    const base = await client.from("profiles").select("badge").eq("id", userId).maybeSingle();
    return { status: missing ? "missing" : "error", showStats: false, badge: (base.data as { badge: string | null } | null)?.badge ?? null };
  }
  const row = res.data as { badge: string | null; show_stats: boolean | null } | null;
  return { status: "ok", showStats: row?.show_stats === true, badge: row?.badge ?? null };
}
