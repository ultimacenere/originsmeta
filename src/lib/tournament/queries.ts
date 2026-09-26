import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { Locale } from "@/lib/i18n";
import { LISTING_BADGES, type Tournament, type TournamentInvite, type TournamentMatch, type TournamentMessage, type TournamentPlayer } from "./types";

/**
 * Letture dei tornei. Con il client anonimo (`supabasePublic`, pagine ISR) si vede quello che le policy
 * concedono a tutti: tornei, iscritti, partite; le liste consegnate solo a torneo finito. Con il client
 * dell'utente (pagine dinamiche) si vedono anche i propri mazzi e quelli degli avversari.
 */

const ORGANIZER = "profile:profiles!tournaments_organizer_fkey(username, display_name, avatar_url, badge, role)";
/** Colonne di una scheda torneo (`TournamentCard`); esportata per la vetrina dei creator (src/lib/community/creators.ts). */
export const TOURNAMENT_SELECT = `id, slug, tag, organizer, name, cover_url, description, rules, lang, starts_at, size, format, deck_mode, conquest_decks, conquest_min_different, best_of, discord_url, status, listed, report, visibility, created_at, updated_at, ${ORGANIZER}, players:tournament_players(count)`;
const PLAYER_SELECT = "tournament_id, user_id, status, decks_submitted, created_at, updated_at, profile:profiles!tournament_players_user_id_fkey(username, display_name, avatar_url, badge)";
const MATCH_SELECT = "id, tournament_id, round, position, player_a, player_b, winner, score_a, score_b, status, reported_by, forfeit, note, created_at, updated_at";

type RawTournament = Omit<Tournament, "players"> & { players?: { count: number }[] | number | null };

function shape(r: RawTournament): Tournament {
  const p = r.players;
  const players = Array.isArray(p) ? Number(p[0]?.count ?? 0) : typeof p === "number" ? p : 0;
  return { ...r, players };
}

/** Sul calendario e nella lista pubblica solo i tornei `listed` di Influencer/Pro/Staff o admin (doppio controllo, oltre al trigger). */
function listable(t: Tournament): boolean {
  return t.profile?.role === "admin" || (LISTING_BADGES as readonly string[]).includes(t.profile?.badge ?? "");
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
