import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { Tournament } from "@/lib/tournament/types";
import { TOURNAMENT_SELECT } from "@/lib/tournament/queries";
import {
  FINISHED_FETCH,
  STALE_OPEN_DAYS,
  UPCOMING_FETCH,
  featuredTournaments,
  finalWinners,
  isMissing,
  isSeedBot,
  parsePublicStats,
  parseRemoteFacts,
  type FinalRow,
  type PublicStats,
  type RemoteFacts,
} from "./achievements";
import { CommunityReadError } from "./queries";
import { authorName } from "./util";

/**
 * Letture del pacchetto TRAGUARDI (27/09/2026): fatti dei traguardi e numeri pubblici della vetrina (funzioni SQL di
 * supabase/wave2-TRAGUARDI.sql), tornei in evidenza con i loro vincitori, impostazione `show_stats` in /account.
 *
 * Errori come nel resto della community (queries.ts, DECKS-12; `getProfileShowcase` in creators.ts): nella pagina /u,
 * ISR, una lettura pubblica fallita LANCIA `CommunityReadError`, così Next tiene la pagina di prima invece di metterne
 * in cache una senza tornei vinti, senza "In numeri" o senza la riga "Ha vinto". Unica eccezione, voluta: una funzione o
 * una colonna che non c'è ancora (codice online prima della migrazione: 404 / PGRST202, 42883, 42703) vale "non
 * disponibile", la sezione non compare e non si richiede per `MISSING_RETRY_MS`, poi si riprova da sola, senza un nuovo
 * deploy (stesso schema di `missingUntil` in creators.ts).
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
 * invoker: col client anonimo vede solo i dati pubblici). null se la community è spenta o se la funzione non c'è ancora:
 * allora quei traguardi non compaiono. Un altro errore lancia (vedi in testa al file). Richiesta GET, così passa dalla
 * cache dei dati di Next come le altre letture pubbliche (60 s).
 */
export async function readAchievementFacts(profileId: string): Promise<RemoteFacts | null> {
  const client = supabasePublic();
  if (!client || !open(gates.facts)) return null;
  const res = await client.rpc("profile_achievement_facts", { pid: profileId }, { get: true });
  if (markMissing(gates.facts, res, "la funzione profile_achievement_facts")) return null;
  if (res.error) throw new CommunityReadError("profile_achievement_facts", res.error.message);
  return parseRemoteFacts(res.data);
}

/**
 * I numeri pubblici di un profilo con vetrina (`profile_public_stats`): solo se lui ha acceso `show_stats`, altrimenti
 * null (la funzione non restituisce righe). null anche con la funzione mancante; un altro errore lancia.
 */
export async function readPublicStats(profileId: string): Promise<PublicStats | null> {
  const client = supabasePublic();
  if (!client || !open(gates.stats)) return null;
  const res = await client.rpc("profile_public_stats", { pid: profileId }, { get: true });
  if (markMissing(gates.stats, res, "la funzione profile_public_stats")) return null;
  if (res.error) throw new CommunityReadError("profile_public_stats", res.error.message);
  return parsePublicStats(res.data);
}

/** Chi ha vinto un torneo, per la riga sotto la sua scheda: nome da mostrare e nome utente (link al profilo). */
export type TournamentWinner = { name: string; username: string | null };

type RawTournament = Omit<Tournament, "players"> & { players?: { count: number }[] | number | null };

function shape(r: RawTournament): Tournament {
  const p = r.players;
  return { ...r, players: Array.isArray(p) ? Number(p[0]?.count ?? 0) : typeof p === "number" ? p : 0 };
}

/**
 * I tornei pubblici organizzati da un profilo, già divisi per la vetrina su /u (`featuredTournaments`): in corso, aperti
 * (i più vicini) e, con una lettura a parte, i finiti più recenti, così un organizzatore con molti tornei in arrivo non
 * fa sparire i conclusi. Mai i privati (filtro esplicito, oltre alla policy `can_view_tournament`), mai gli annullati.
 * Più i vincitori dei finiti (`readTournamentWinners`): la vetrina mostra solo i finiti che ne hanno uno. Gli errori
 * lanciano.
 */
export async function readFeaturedTournaments(
  organizerId: string,
): Promise<{ upcoming: Tournament[]; finished: Tournament[]; winners: Map<string, TournamentWinner> }> {
  const client = supabasePublic();
  if (!client) return { upcoming: [], finished: [], winners: new Map() };
  const now = Date.now();
  const base = () => client.from("tournaments").select(TOURNAMENT_SELECT).eq("organizer", organizerId).eq("visibility", "public");
  const [running, open, finished] = await Promise.all([
    // in corso: anche con la data d'inizio lontana (il tabellone parte quando il torneo è al completo)
    base().eq("status", "running").order("starts_at", { ascending: true }).limit(UPCOMING_FETCH),
    // aperti: non quelli rimasti indietro di settimane (STALE_OPEN_DAYS), che occuperebbero i primi posti
    base().eq("status", "open").gte("starts_at", new Date(now - STALE_OPEN_DAYS * 86_400_000).toISOString()).order("starts_at", { ascending: true }).limit(UPCOMING_FETCH),
    base().eq("status", "finished").order("starts_at", { ascending: false }).limit(FINISHED_FETCH),
  ]);
  for (const [what, res] of [["in corso", running], ["aperti", open], ["conclusi", finished]] as const) {
    if (res.error) throw new CommunityReadError(`tornei in evidenza (${what})`, res.error.message);
  }
  const rows = (res: { data: unknown }) => ((res.data ?? []) as RawTournament[]).map(shape);
  const done = rows(finished);
  const winners = await readTournamentWinners(done.map((t) => t.id));
  return { ...featuredTournaments([...rows(running), ...rows(open), ...done], { now, hasWinner: (id) => winners.has(id) }), winners };
}

/**
 * I vincitori dei tornei finiti (tornei in evidenza sulla vetrina): le partite in posizione 0 del tabellone, una per
 * turno, e l'ultima è la finale (`finalWinners`); poi i nomi dei vincitori. Restano fuori i tornei di prova con i bot di
 * scripts/seed-bots.mjs (`isSeedBot`: un iscritto bot basta), come in `profile_achievement_facts`. Le policy
 * (`can_view_tournament`) fanno vedere al client anonimo solo i tornei pubblici, e la vetrina chiede solo quelli.
 */
export async function readTournamentWinners(tournamentIds: readonly string[]): Promise<Map<string, TournamentWinner>> {
  const out = new Map<string, TournamentWinner>();
  const client = supabasePublic();
  if (!client || !tournamentIds.length) return out;
  const ids = [...tournamentIds];
  const [matches, players] = await Promise.all([
    client.from("tournament_matches").select("tournament_id, round, position, winner, status").in("tournament_id", ids).eq("position", 0),
    client.from("tournament_players").select("tournament_id, profile:profiles!tournament_players_user_id_fkey(username)").in("tournament_id", ids),
  ]);
  if (matches.error) throw new CommunityReadError("vincitori dei tornei", matches.error.message);
  if (players.error) throw new CommunityReadError("iscritti dei tornei conclusi", players.error.message);
  type PlayerRow = { tournament_id: string; profile: { username: string | null } | { username: string | null }[] | null };
  const withBots = new Set(
    ((players.data ?? []) as unknown as PlayerRow[])
      .filter((p) => (Array.isArray(p.profile) ? p.profile : [p.profile]).some((x) => isSeedBot(x?.username)))
      .map((p) => p.tournament_id),
  );
  const winners = finalWinners((matches.data ?? []) as FinalRow[]);
  for (const id of withBots) winners.delete(id);
  const winnerIds = [...new Set(winners.values())];
  if (!winnerIds.length) return out;
  const profiles = await client.from("profiles").select("id, username, display_name, avatar_url").in("id", winnerIds);
  if (profiles.error) throw new CommunityReadError("nomi dei vincitori", profiles.error.message);
  const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  for (const [tid, uid] of winners) {
    const p = byId.get(uid);
    // un vincitore che ha cancellato l'account non ha più un profilo: niente riga (e il torneo non compare)
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
