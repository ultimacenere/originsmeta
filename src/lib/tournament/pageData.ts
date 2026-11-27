import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabasePublic, type Db } from "@/lib/supabase/public";
import { currentUser, type SessionUser } from "@/lib/supabase/server";
import { isStagedFormat } from "./formats";
import {
  FORMAT_COLUMNS,
  PLAYER_SELECT,
  STAGE_COLUMNS,
  TOURNAMENT_SELECT,
  formatOptionsOf,
  getFormatOptions,
  getInviteCode,
  getStageOptions,
  getTournament,
  listBanStats,
  listJudges,
  listListedTournaments,
  listMatches,
  listMatchesWithStages,
  listPlayers,
  listVisibleDecks,
  matchSelectFor,
  shapeTournament,
  stageOptionsOf,
  withMatchStages,
  type FormatOptions,
  type RawTournament,
  type StageOptions,
} from "./queries";
import { listAnnouncements, type AnnouncementsResult } from "./announcementQueries";
import { overlayMatches, overlayPlayers } from "./pageOverlay";
import { LISTED_TOURNAMENTS_TAG, LISTED_TOURNAMENTS_TTL, TOURNAMENT_PAGE_TTL, tournamentTag } from "./pageCache";
import type { BanTally } from "./stages";
import type { Tournament, TournamentJudge, TournamentMatch, TournamentPlayer } from "./types";

/**
 * Letture della scheda torneo (27/11/2026; regole della cache e delle rigenerazioni in pageCache.ts).
 *
 * Prima ogni visita faceva circa 13 letture a Supabase, due volte il torneo (anche generateMetadata), e la pagina era
 * sempre ricostruita da zero: 979 KB di HTML e 1,2–1,4 s per il Qualifier 2 con 747 righe di iscritti e nessuna
 * partita. Ora, per un torneo pubblico:
 * - torneo (con le opzioni di fase e di formato nella stessa riga), arbitri, annunci, liste visibili e ban stanno in una
 *   voce della cache; iscritti e partite in due voci a parte (con 928 partite una voce sola si avvicinerebbe ai 2 MB
 *   oltre i quali Next non salva). Le letture sono anonime, come per chiunque guardi un torneo pubblico: le policy
 *   danno all'anonimo esattamente quello che la scheda mostra a tutti (anche le liste: tutte a torneo finito, la top 4
 *   con le liste segrete; i ban a torneo finito);
 * - con la sessione restano solo le cose di chi guarda: la sua riga di iscritto, le sue partite e il codice d'invito
 *   (che la policy dà solo a organizzatore e admin). Le prime due prendono il posto delle copie in cache
 *   (pageOverlay.ts). Chi non ha fatto l'accesso non fa nessuna lettura personale;
 * - `loadTournamentView` è in `cache()` di React: generateMetadata e la pagina la fanno una volta sola per richiesta.
 * I tornei privati non entrano mai in cache (l'anonimo non li vede: la voce dice solo "nessun torneo pubblico") e
 * seguono la strada di sempre con la sessione, come ogni errore della cache.
 *
 * Errori: dentro la cache le letture lanciano (`strict`), così una risposta vuota per un guasto non resta 15 secondi
 * per tutti; fuori si ripiega sulle letture di sempre con la sessione, che rispondono vuote come prima.
 */

/**
 * Prefisso delle chiavi. Su Vercel la cache dei dati sopravvive ai deploy e la chiave dipende dal testo della funzione
 * passata a `unstable_cache` (qui sempre una freccia che chiama per nome): DA AGGIORNARE (v2, v3…) quando cambia la
 * forma di `TournamentCore` o le colonne di iscritti e partite, altrimenti un deploy leggerebbe la forma vecchia.
 */
const KEY = "tournament-page-v1";

type DeckRow = { user_id: string; codes: string[] };

/** La parte uguale per tutti di un torneo pubblico, una voce della cache. */
export type TournamentCore = {
  t: Tournament;
  stages: StageOptions;
  /** opzioni dei formati per ogni torneo (la stanza partita le usa sempre, la scheda solo fuori dall'eliminazione diretta) */
  formatOptions: FormatOptions;
  judges: TournamentJudge[];
  announcements: AnnouncementsResult;
  decks: DeckRow[];
  banStats: BanTally[];
};

export type TournamentView = Omit<TournamentCore, "formatOptions"> & {
  /** solo per svizzera, gironi e doppia eliminazione (come prima: null per l'eliminazione diretta) */
  fo: FormatOptions | null;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  others: Tournament[];
  inviteCode: string | null;
  client: Db;
  user: SessionUser | null;
  /** "cache": parte comune dalla cache più la parte personale; "session": tutte le letture con la sessione, come prima */
  source: "cache" | "session";
};

/** Le liste si leggono a torneo finito e, con le liste segrete, a torneo in corso (la top 4): come prima. */
function readsDecks(t: Pick<Tournament, "status" | "hidden_decklists">): boolean {
  return t.status === "finished" || (t.status === "running" && t.hidden_decklists);
}

async function readCore(slug: string): Promise<TournamentCore | null> {
  const c = supabasePublic();
  if (!c) return null;
  const res = await c.from("tournaments").select(`${TOURNAMENT_SELECT}, ${STAGE_COLUMNS}, ${FORMAT_COLUMNS}`).eq("slug", slug).maybeSingle();
  if (res.error) throw new Error(`[tournaments] core: ${res.error.message}`);
  if (!res.data) return null;
  const row = res.data as unknown as RawTournament & Partial<StageOptions> & Partial<FormatOptions>;
  // un privato l'anonimo non lo vede; il controllo resta, così niente di privato finisce mai in cache
  if (row.visibility !== "public") return null;
  const { top_cut, top_cut_hold, top_cut_released_at, deck_ban, swiss_rounds, group_size, group_advance, group_seeding, sideboard, de_pools, de_qualify, de_pool_size, de_qualifier, ...base } = row;
  const t = shapeTournament(base);
  const stages = stageOptionsOf({ top_cut, top_cut_hold, top_cut_released_at, deck_ban });
  const formatOptions = formatOptionsOf({ swiss_rounds, group_size, group_advance, group_seeding, sideboard, de_pools, de_qualify, de_pool_size, de_qualifier });
  const [judges, announcements, decks, banStats] = await Promise.all([
    listJudges(t.id, c, true),
    listAnnouncements(c, [t.id]),
    readsDecks(t) ? listVisibleDecks(t.id, c, true) : Promise.resolve([]),
    t.status === "finished" ? listBanStats(c, t.id, true) : Promise.resolve([]),
  ]);
  // "unavailable" (tabella non ancora migrata) è una risposta vera e resta; un errore qualsiasi no
  if (!announcements.ok && announcements.error === "generic") throw new Error("[tournaments] core: announcements");
  return { t, stages, formatOptions, judges, announcements, decks, banStats };
}

function cachedCore(slug: string, tag: string): Promise<TournamentCore | null> {
  return unstable_cache(() => readCore(slug), [KEY, "core", slug], { revalidate: TOURNAMENT_PAGE_TTL, tags: [tag] })();
}

function cachedPlayers(tid: string, tag: string): Promise<TournamentPlayer[]> {
  return unstable_cache(() => listPlayers(tid, supabasePublic(), true), [KEY, "players", tid], { revalidate: TOURNAMENT_PAGE_TTL, tags: [tag] })();
}

function cachedMatches(tid: string, format: string, tag: string): Promise<TournamentMatch[]> {
  return unstable_cache(() => listMatchesWithStages(tid, format), [KEY, "matches", tid, format], { revalidate: TOURNAMENT_PAGE_TTL, tags: [tag] })();
}

const cachedListed = unstable_cache(() => listListedTournaments(30, true), [KEY, "listed", "30"], { revalidate: LISTED_TOURNAMENTS_TTL, tags: [LISTED_TOURNAMENTS_TAG] });

/** I 30 tornei del calendario: dalla cache (60 s), e se la lettura fallisce quella di sempre. */
function listedTournaments(): Promise<Tournament[]> {
  return cachedListed().catch(() => listListedTournaments(30));
}

type Personal = { player: TournamentPlayer | null | undefined; matches: TournamentMatch[]; inviteCode: string | null };

/** Le letture di chi guarda, con la sua sessione; senza accesso nessuna. Una lettura fallita lascia la copia in cache. */
async function readPersonal(client: Db, user: SessionUser | null, t: Tournament): Promise<Personal> {
  if (!user) return { player: undefined, matches: [], inviteCode: null };
  const [p, m, inviteCode] = await Promise.all([
    client.from("tournament_players").select(PLAYER_SELECT).eq("tournament_id", t.id).eq("user_id", user.id).maybeSingle(),
    // prima dell'avvio non ci sono partite
    t.status === "open" ? Promise.resolve(null) : client.from("tournament_matches").select(matchSelectFor(t.format)).eq("tournament_id", t.id).or(`player_a.eq.${user.id},player_b.eq.${user.id}`),
    getInviteCode(client, t.id),
  ]);
  if (p.error) console.error("[tournaments] riga di chi guarda:", p.error.message);
  if (m?.error) console.error("[tournaments] partite di chi guarda:", m.error.message);
  return {
    player: p.error ? undefined : ((p.data as unknown as TournamentPlayer | null) ?? null),
    matches: m && !m.error ? ((m.data ?? []) as unknown as TournamentMatch[]) : [],
    inviteCode,
  };
}

/** Tutte le letture con la sessione, come la scheda le faceva fino al 27/11/2026: tornei privati ed errori della cache. */
async function sessionView(slug: string, client: Db, user: SessionUser | null): Promise<TournamentView | null> {
  const t = await getTournament(slug, client);
  if (!t) return null;
  const staged = isStagedFormat(t.format);
  const [players, matches, others, decks, inviteCode, judges, stages, banStats, fo, announcements] = await Promise.all([
    listPlayers(t.id, client),
    // 09/11/2026: per svizzera e gironi anche fase e girone di ogni partita
    listMatches(t.id, client).then((ms) => withMatchStages(client, t.id, t.format, ms)),
    listedTournaments(),
    // a torneo finito tutte le liste; con le liste segrete, a torneo in corso, quelle della top 4 (policy)
    readsDecks(t) ? listVisibleDecks(t.id, client) : Promise.resolve([]),
    // il codice del link d'invito lo leggono solo organizzatore e admin (policy): per gli altri è null
    getInviteCode(client, t.id),
    listJudges(t.id, client),
    // 08/11/2026: fase finale a bracket, pausa e ban (lettura a parte: regge il database non ancora migrato)
    getStageOptions(client, t.id),
    t.status === "finished" ? listBanStats(client, t.id) : Promise.resolve([]),
    staged ? getFormatOptions(client, t.id) : Promise.resolve(null),
    listAnnouncements(client, [t.id]),
  ]);
  return { t, players, matches, others, decks, inviteCode, judges, stages, banStats, fo, announcements, client, user, source: "session" };
}

/**
 * La parte comune di un torneo pubblico per le altre pagine del torneo (27/11/2026: la stanza partita, che a ogni apertura
 * e a ogni cambio di stato rileggeva tutti gli iscritti e tutte le partite per nomi e struttura del tabellone). `null`
 * per un torneo privato, inesistente o se la cache non risponde: la pagina legge come prima con la sessione.
 */
export async function loadPublicTournament(slug: string): Promise<{ core: TournamentCore; players: TournamentPlayer[]; matches: TournamentMatch[] } | null> {
  const tag = tournamentTag(slug);
  if (!tag) return null;
  try {
    const core = await cachedCore(slug, tag);
    if (!core) return null;
    const [players, matches] = await Promise.all([cachedPlayers(core.t.id, tag), cachedMatches(core.t.id, core.t.format, tag)]);
    return { core, players, matches };
  } catch (e) {
    console.error("[tournaments] cache del torneo:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Tutto quello che serve alla scheda `/tournaments/<slug>`, una volta per richiesta. `null`: niente client Supabase o
 * nessun torneo visibile a chi guarda (404).
 */
export const loadTournamentView = cache(async (slug: string): Promise<TournamentView | null> => {
  const { supabase: client, user } = await currentUser();
  if (!client) return null;
  const tag = tournamentTag(slug);
  if (!tag) return null;
  let core: TournamentCore | null = null;
  try {
    core = await cachedCore(slug, tag);
  } catch (e) {
    console.error("[tournaments] cache della scheda:", e instanceof Error ? e.message : e);
  }
  if (core) {
    const { formatOptions, ...shared } = core;
    const t = core.t;
    try {
      const [players, matches, others, mine] = await Promise.all([cachedPlayers(t.id, tag), cachedMatches(t.id, t.format, tag), listedTournaments(), readPersonal(client, user, t)]);
      const viewer = user?.id ?? null;
      return {
        ...shared,
        fo: isStagedFormat(t.format) ? formatOptions : null,
        players: overlayPlayers(players, viewer, mine.player),
        matches: overlayMatches(matches, mine.matches),
        others,
        inviteCode: mine.inviteCode,
        client,
        user,
        source: "cache",
      };
    } catch (e) {
      console.error("[tournaments] cache di iscritti e partite:", e instanceof Error ? e.message : e);
    }
  }
  return sessionView(slug, client, user);
});
