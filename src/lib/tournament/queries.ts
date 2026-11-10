import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { Locale } from "@/lib/i18n";
import { canListTournaments, type Tournament, type TournamentInvite, type TournamentJudge, type TournamentMatch, type TournamentMessage, type TournamentPlayer } from "./types";
import type { BanTally, MatchBan } from "./stages";

/**
 * Letture dei tornei. Con il client anonimo (`supabasePublic`, pagine ISR) si vede quello che le policy
 * concedono a tutti: tornei, iscritti, partite; le liste consegnate solo a torneo finito. Con il client
 * dell'utente (pagine dinamiche) si vedono anche i propri mazzi e quelli degli avversari.
 */

const ORGANIZER = "profile:profiles!tournaments_organizer_fkey(username, display_name, avatar_url, badge, role)";
/** Colonne di una scheda torneo (`TournamentCard`); esportata per la vetrina dei creator (src/lib/community/creators.ts). */
export const TOURNAMENT_SELECT = `id, slug, tag, organizer, name, cover_url, description, rules, lang, starts_at, size, format, deck_mode, conquest_decks, conquest_min_different, best_of, final_best_of, checkin, hidden_decklists, no_show_minutes, discord_url, status, listed, report, visibility, created_at, updated_at, ${ORGANIZER}, players:tournament_players(count)`;
const PLAYER_SELECT = "tournament_id, user_id, status, decks_submitted, checked_in_at, created_at, updated_at, profile:profiles!tournament_players_user_id_fkey(username, display_name, avatar_url, badge)";
const MATCH_SELECT = "id, tournament_id, round, position, player_a, player_b, winner, score_a, score_b, status, reported_by, forfeit, note, ready_at, seen_a, seen_b, reported_at, created_at, updated_at";

type RawTournament = Omit<Tournament, "players"> & { players?: { count: number }[] | number | null };

function shape(r: RawTournament): Tournament {
  const p = r.players;
  const players = Array.isArray(p) ? Number(p[0]?.count ?? 0) : typeof p === "number" ? p : 0;
  return { ...r, players };
}

/** Sul calendario e nella lista pubblica solo i tornei `listed` di Creator/Pro/Staff o admin (doppio controllo, oltre al trigger). */
function listable(t: Tournament): boolean {
  return canListTournaments(t.profile);
}

export async function listListedTournaments(limit = 60): Promise<Tournament[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client.from("tournaments").select(TOURNAMENT_SELECT).eq("listed", true).eq("visibility", "public").neq("status", "cancelled").order("starts_at", { ascending: true }).limit(limit);
  if (error) {
    console.error("[tournaments] listListedTournaments:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as RawTournament[]).map(shape).filter(listable);
}

export async function getTournament(slug: string, client: Db | null = supabasePublic()): Promise<Tournament | null> {
  if (!client) return null;
  const { data, error } = await client.from("tournaments").select(TOURNAMENT_SELECT).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return shape(data as unknown as RawTournament);
}

/** Cerca un torneo dal tag; con il client di sessione (route /t/[tag]) la lettura non passa dalla data cache di Next. */
export async function getTournamentByTag(tag: string, client: Db | null = supabasePublic()): Promise<Pick<Tournament, "slug" | "lang"> | null> {
  if (!client) return null;
  const { data } = await client.from("tournaments").select("slug, lang").eq("tag", tag).maybeSingle();
  return (data as { slug: string; lang: Locale } | null) ?? null;
}

/** Liste consegnate visibili al client passato (per l'anonimo: solo a torneo finito, per policy). */
export async function listVisibleDecks(tid: string, client: Db | null = supabasePublic()): Promise<{ user_id: string; codes: string[] }[]> {
  if (!client) return [];
  const { data, error } = await client.from("tournament_decks").select("user_id, codes").eq("tournament_id", tid);
  if (error) console.error("[tournaments] listVisibleDecks:", error.message);
  return ((data ?? []) as { user_id: string; codes: unknown }[]).map((r) => ({ user_id: r.user_id, codes: Array.isArray(r.codes) ? r.codes.filter((c): c is string => typeof c === "string") : [] }));
}

/**
 * Le Leggendarie dei mazzi consegnati (05/10/2026): quelle che il client può vedere, cioè di chi può leggere le liste
 * e degli avversari (con le liste segrete l'avversario vede solo queste). Mappa utente → Leggendarie nell'ordine dei mazzi.
 */
export async function listLegendaries(tid: string, client: Db | null): Promise<Map<string, string[]>> {
  if (!client) return new Map();
  const { data, error } = await client.rpc("tournament_legendaries", { tid });
  if (error) console.error("[tournaments] listLegendaries:", error.message);
  const rows = (Array.isArray(data) ? data : []) as { user_id: string; legendaries: unknown }[];
  return new Map(rows.map((r) => [r.user_id, Array.isArray(r.legendaries) ? r.legendaries.filter((s): s is string => typeof s === "string" && s.length > 0) : []]));
}

/** Arbitri del torneo con il profilo (pubblici come il torneo). */
export async function listJudges(tid: string, client: Db | null = supabasePublic()): Promise<TournamentJudge[]> {
  if (!client) return [];
  const { data, error } = await client.from("tournament_judges").select("tournament_id, user_id, added_by, created_at, profile:profiles!tournament_judges_user_id_fkey(username, display_name, avatar_url, badge)").eq("tournament_id", tid).order("created_at", { ascending: true });
  if (error) console.error("[tournaments] listJudges:", error.message);
  return ((data ?? []) as unknown as TournamentJudge[]) ?? [];
}

export async function listPlayers(tid: string, client: Db | null = supabasePublic()): Promise<TournamentPlayer[]> {
  if (!client) return [];
  const { data, error } = await client.from("tournament_players").select(PLAYER_SELECT).eq("tournament_id", tid).order("created_at", { ascending: true });
  if (error) console.error("[tournaments] listPlayers:", error.message);
  return ((data ?? []) as unknown as TournamentPlayer[]) ?? [];
}

export async function listMatches(tid: string, client: Db | null = supabasePublic()): Promise<TournamentMatch[]> {
  if (!client) return [];
  const { data, error } = await client.from("tournament_matches").select(MATCH_SELECT).eq("tournament_id", tid).order("round", { ascending: true }).order("position", { ascending: true });
  if (error) console.error("[tournaments] listMatches:", error.message);
  return ((data ?? []) as unknown as TournamentMatch[]) ?? [];
}

/** Una partita (client con la sessione: la stanza partita è riservata alle parti). */
export async function getMatch(matchId: string, client: Db | null): Promise<TournamentMatch | null> {
  if (!client) return null;
  const { data } = await client.from("tournament_matches").select(MATCH_SELECT).eq("id", matchId).maybeSingle();
  return (data as unknown as TournamentMatch | null) ?? null;
}

/** Messaggi della chat di una partita, dal più vecchio; la policy li mostra solo alle parti. */
export async function listMessages(matchId: string, client: Db | null, afterId = 0, limit = 200): Promise<TournamentMessage[]> {
  if (!client) return [];
  const { data, error } = await client.from("tournament_messages").select("id, match_id, user_id, body, created_at").eq("match_id", matchId).gt("id", afterId).order("id", { ascending: true }).limit(limit);
  if (error) console.error("[tournaments] listMessages:", error.message);
  return ((data ?? []) as unknown as TournamentMessage[]) ?? [];
}

/** Codici consegnati dall'utente per un torneo (client con la sua sessione), oppure null. */
export async function getMyDecks(client: Db, tid: string, userId: string): Promise<string[] | null> {
  const { data } = await client.from("tournament_decks").select("codes").eq("tournament_id", tid).eq("user_id", userId).maybeSingle();
  const codes = (data as { codes: unknown } | null)?.codes;
  return Array.isArray(codes) ? codes.filter((c): c is string => typeof c === "string") : null;
}

/** Tornei dell'utente: organizzati, giocati e quelli privati a cui è stato invitato (client con la sua sessione). */
export async function listUserTournaments(client: Db, userId: string): Promise<{ organized: Tournament[]; playing: Tournament[]; invited: Tournament[] }> {
  const [org, mine, inv] = await Promise.all([
    client.from("tournaments").select(TOURNAMENT_SELECT).eq("organizer", userId).order("starts_at", { ascending: false }).limit(50),
    client.from("tournament_players").select("tournament_id").eq("user_id", userId).limit(100),
    client.from("tournament_invites").select("tournament_id").eq("user_id", userId).limit(100),
  ]);
  const organized = ((org.data ?? []) as unknown as RawTournament[]).map(shape);
  const playingIds = ((mine.data ?? []) as { tournament_id: string }[]).map((r) => r.tournament_id).filter((id) => !organized.some((t) => t.id === id));
  const invitedIds = ((inv.data ?? []) as { tournament_id: string }[]).map((r) => r.tournament_id).filter((id) => !organized.some((t) => t.id === id) && !playingIds.includes(id));
  const fetchByIds = async (ids: string[]): Promise<Tournament[]> => {
    if (!ids.length) return [];
    const { data } = await client.from("tournaments").select(TOURNAMENT_SELECT).in("id", ids).order("starts_at", { ascending: false });
    return ((data ?? []) as unknown as RawTournament[]).map(shape);
  };
  const [playing, invited] = await Promise.all([fetchByIds(playingIds), fetchByIds(invitedIds)]);
  return { organized, playing, invited: invited.filter((t) => t.status === "open" || t.status === "running") };
}

/* ---------- 08/11/2026: fase finale a bracket, pausa e ban (blocco BRACKET E TOP CUT di schema.sql) ---------- */

export type StageOptions = { top_cut: number | null; top_cut_hold: boolean; top_cut_released_at: string | null; deck_ban: boolean };
export const NO_STAGES: StageOptions = { top_cut: null, top_cut_hold: false, top_cut_released_at: null, deck_ban: false };

/**
 * Opzioni del blocco BRACKET E TOP CUT di un torneo. Sono una lettura a parte (non in TOURNAMENT_SELECT) così le pagine
 * reggono il database non ancora migrato: colonne mancanti = torneo senza fase finale, senza pausa e senza ban.
 */
export async function getStageOptions(client: Db | null, tid: string): Promise<StageOptions> {
  if (!client) return NO_STAGES;
  const { data, error } = await client.from("tournaments").select("top_cut, top_cut_hold, top_cut_released_at, deck_ban").eq("id", tid).maybeSingle();
  if (error || !data) return NO_STAGES;
  const r = data as Partial<StageOptions>;
  return { top_cut: r.top_cut ?? null, top_cut_hold: Boolean(r.top_cut_hold), top_cut_released_at: r.top_cut_released_at ?? null, deck_ban: Boolean(r.deck_ban) };
}

/** Ban di una partita come li lascia vedere match_bans (il ban dell'avversario senza mazzo finché non hanno bannato tutti e due). */
export async function listMatchBans(client: Db | null, mid: string): Promise<MatchBan[]> {
  if (!client) return [];
  const { data, error } = await client.rpc("match_bans", { mid });
  if (error) {
    if (!/match_bans/.test(error.message ?? "")) console.error("[tournaments] listMatchBans:", error.message);
    return [];
  }
  return (Array.isArray(data) ? data : []) as MatchBan[];
}

/** Leggendarie bannate nel torneo (allo staff sempre, a tutti a torneo finito), dalla più bannata. */
export async function listBanStats(client: Db | null, tid: string): Promise<BanTally[]> {
  if (!client) return [];
  const { data, error } = await client.rpc("tournament_ban_stats", { tid });
  if (error) return [];
  return ((Array.isArray(data) ? data : []) as BanTally[]).filter((r) => r.legendary);
}

/** Ban fatti per partita (solo lo staff, tournament_ban_progress): partita → numero di ban (0, 1 o 2). */
export async function listBanProgress(client: Db | null, tid: string): Promise<Map<string, number>> {
  if (!client) return new Map();
  const { data, error } = await client.rpc("tournament_ban_progress", { tid });
  if (error) return new Map();
  return new Map(((Array.isArray(data) ? data : []) as { match_id: string; bans: number }[]).map((r) => [r.match_id, Number(r.bans)]));
}

/** Codice del link d'invito (solo organizzatore e admin, per policy), oppure null. */
export async function getInviteCode(client: Db, tid: string): Promise<string | null> {
  const { data } = await client.from("tournament_secrets").select("invite_code").eq("tournament_id", tid).maybeSingle();
  return (data as { invite_code: string } | null)?.invite_code ?? null;
}

/** Invitati a un torneo privato con il profilo (organizzatore e admin). */
export async function listInvites(client: Db, tid: string): Promise<TournamentInvite[]> {
  const { data, error } = await client.from("tournament_invites").select("tournament_id, user_id, invited_by, created_at, profile:profiles!tournament_invites_user_id_fkey(username, display_name, avatar_url, badge)").eq("tournament_id", tid).order("created_at", { ascending: true });
  if (error) console.error("[tournaments] listInvites:", error.message);
  return ((data ?? []) as unknown as TournamentInvite[]) ?? [];
}

/* ---------- 09/11/2026: svizzera, gironi e sideboard (blocco SVIZZERA, GIRONI E SIDEBOARD di schema.sql) ---------- */

export type FormatOptions = { swiss_rounds: number | null; group_size: number | null; group_advance: number | null; group_seeding: "snake" | "random" | null; sideboard: number | null };
export const NO_FORMAT_OPTIONS: FormatOptions = { swiss_rounds: null, group_size: null, group_advance: null, group_seeding: null, sideboard: null };

/** Opzioni dei formati nuovi, lette a parte come getStageOptions: colonne mancanti = nessuna opzione (database non migrato). */
export async function getFormatOptions(client: Db | null, tid: string): Promise<FormatOptions> {
  if (!client) return NO_FORMAT_OPTIONS;
  const { data, error } = await client.from("tournaments").select("swiss_rounds, group_size, group_advance, group_seeding, sideboard").eq("id", tid).maybeSingle();
  if (error || !data) return NO_FORMAT_OPTIONS;
  const r = data as Partial<FormatOptions>;
  return { swiss_rounds: r.swiss_rounds ?? null, group_size: r.group_size ?? null, group_advance: r.group_advance ?? null, group_seeding: r.group_seeding ?? null, sideboard: r.sideboard ?? null };
}

/**
 * Le partite con fase e girone: per svizzera e gironi (che esistono solo a migrazione fatta) si leggono `stage` e `grp`
 * e si uniscono alle partite di listMatches. Per gli altri tornei le partite restano come sono (stage assente = tabellone).
 */
export async function withMatchStages(client: Db | null, tid: string, format: string, matches: TournamentMatch[]): Promise<TournamentMatch[]> {
  if (!client || format === "single_elim" || !matches.length) return matches;
  const { data, error } = await client.from("tournament_matches").select("id, stage, grp").eq("tournament_id", tid);
  if (error) {
    console.error("[tournaments] withMatchStages:", error.message);
    return matches;
  }
  const by = new Map(((data ?? []) as { id: string; stage: TournamentMatch["stage"]; grp: number | null }[]).map((r) => [r.id, r]));
  return matches.map((m) => ({ ...m, stage: by.get(m.id)?.stage ?? null, grp: by.get(m.id)?.grp ?? null }));
}

/** Sideboard consegnate che il client può leggere (stesse regole delle liste): utente → slug delle carte. */
export async function listSideboards(client: Db | null, tid: string): Promise<Map<string, string[]>> {
  if (!client) return new Map();
  const { data, error } = await client.from("tournament_decks").select("user_id, sideboard").eq("tournament_id", tid);
  if (error) return new Map();
  return new Map(((data ?? []) as { user_id: string; sideboard: unknown }[]).map((r) => [r.user_id, Array.isArray(r.sideboard) ? r.sideboard.filter((s): s is string => typeof s === "string") : []]));
}

export type SideSwapRow = { user_id: string; game: number; deck: number; swaps: { out: string; in: string }[]; created_at: string };

/** Scambi con la sideboard di una partita che il client può vedere (match_side_swaps). */
export async function listMatchSideSwaps(client: Db | null, mid: string): Promise<SideSwapRow[]> {
  if (!client) return [];
  const { data, error } = await client.rpc("match_side_swaps", { mid });
  if (error) return [];
  return (Array.isArray(data) ? data : []) as SideSwapRow[];
}
