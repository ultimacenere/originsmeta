import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { Tournament } from "@/lib/tournament/types";
import { TOURNAMENT_SELECT } from "@/lib/tournament/queries";
import { CommunityReadError } from "./queries";
import { CREATOR_BADGES, cleanBio, cleanContentLangs, isCreatorBadge, mainChannels, parseStoredLinks, twitchLogin, type ContentLang, type ProfileLink } from "./profileLinks";

/**
 * Letture del profilo pubblico e dei creator (pacchetto CREATOR, 26/09/2026): bio, canali e lingue dei contenuti di un
 * iscritto (colonne di supabase/schema.sql, blocco CREATOR), l'elenco dei profili con un tag autore (directory /creators,
 * icone accanto al nome in /decks, rotta /api/live) e i tornei pubblici che un creator organizza (vetrina su /u).
 *
 * Errori come nel resto della community (queries.ts, DECKS-12): nelle pagine ISR una lettura fallita lancia, così
 * Next tiene la pagina di prima invece di metterne in cache una senza canali. Unica eccezione, voluta: le colonne
 * nuove che ancora non esistono (codice online prima della migrazione, errore 42703 di Postgres). Allora si risponde
 * "nessun dato" e il sito resta com'era: /creators vuota e noindex, niente icone accanto ai nomi, profili senza bio.
 * Lo stato "colonne mancanti" vale `MISSING_RETRY_MS` e poi si riprova: dopo la migrazione un'istanza rimasta accesa
 * torna a leggere i dati da sola, senza un nuovo deploy.
 */

export type Showcase = { bio: string | null; links: ProfileLink[]; contentLangs: ContentLang[]; updatedAt: string | null };

export type CreatorProfile = Showcase & {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  badge: string;
  created_at: string;
};

const SHOWCASE_COLUMNS = "bio, links, content_langs, showcase_updated_at";

type ShowcaseRow = { bio: string | null; links: unknown; content_langs: unknown; showcase_updated_at: string | null };
type ReadError = { code?: string; message: string } | null;

/** Per quanto tempo, dopo un 42703, non si interroga più il database (poi si riprova). */
const MISSING_RETRY_MS = 5 * 60_000;
/** Fino a quando le colonne si considerano mancanti (0: si legge); `logged`: il messaggio nei log una volta sola. */
const columnsState = { missingUntil: 0, logged: false };

/** Le colonne vanno lette adesso? No se un 42703 recente dice che mancano ancora. */
function showcaseReadable(): boolean {
  return Date.now() >= columnsState.missingUntil;
}

/** Le colonne del profilo pubblico mancano ancora (migrazione non applicata)? Lo si scrive nei log una volta sola. */
function missingColumns(error: ReadError): boolean {
  if (!error) return false;
  const missing = error.code === "42703" || /(bio|links|content_langs|showcase_updated_at).*does not exist/.test(error.message);
  if (missing) {
    columnsState.missingUntil = Date.now() + MISSING_RETRY_MS;
    if (!columnsState.logged) {
      columnsState.logged = true;
      console.error("[community] mancano le colonne del profilo pubblico (bio, links, content_langs): va applicata la migrazione del pacchetto CREATOR");
    }
  }
  return missing;
}

/**
 * Dalla riga del database ai dati mostrati: canali, lingue e bio ricontrollati (difesa in lettura). La bio passa da
 * `cleanBio` come nel modulo di /account: una riga scritta via API saltando il sito (segni di direzione, caratteri a
 * larghezza zero, righe vuote a catena) si mostra ripulita, anche prima che il vincolo del database la rifiuti; una bio
 * che nemmeno così rientra nei limiti non si mostra.
 */
export function toShowcase(row: ShowcaseRow): Showcase {
  const bio = typeof row.bio === "string" ? cleanBio(row.bio) : null;
  return {
    bio: bio && bio.ok ? bio.value : null,
    links: parseStoredLinks(row.links),
    contentLangs: cleanContentLangs(row.content_langs),
    updatedAt: row.showcase_updated_at ?? null,
  };
}

/** Bio, canali e lingue di un iscritto (pagina /u, scheda del mazzo). null se il profilo non c'è o le colonne mancano. */
export async function getProfileShowcase(profileId: string): Promise<Showcase | null> {
  const client = supabasePublic();
  if (!client || !showcaseReadable()) return null;
  const res = await client.from("profiles").select(SHOWCASE_COLUMNS).eq("id", profileId).maybeSingle();
  if (missingColumns(res.error)) return null;
  if (res.error) throw new CommunityReadError("getProfileShowcase", res.error.message);
  return res.data ? toShowcase(res.data as ShowcaseRow) : null;
}

/**
 * Il proprio profilo, per il modulo di /account (client con la sessione, pagina dinamica): come le altre letture del
 * pannello privato un errore non rompe la pagina. `status`: `ok`; `missing` se le colonne non ci sono ancora (il
 * modulo lo dice e non si può salvare); `error` se la lettura è fallita (il modulo non si mostra: salvarlo vuoto
 * cancellerebbe canali che ci sono). Legge sempre, anche dopo un 42703: è una pagina dinamica, una query in più non
 * costa, e appena la migrazione è applicata il modulo compare.
 */
export async function getOwnShowcase(
  client: Db,
  userId: string,
): Promise<{ status: "ok" | "missing" | "error"; showcase: Showcase; username: string | null; badge: string | null }> {
  const empty: Showcase = { bio: null, links: [], contentLangs: [], updatedAt: null };
  const res = await client.from("profiles").select(`username, badge, ${SHOWCASE_COLUMNS}`).eq("id", userId).maybeSingle();
  if (res.error) {
    const missing = missingColumns(res.error);
    if (!missing) console.error("[community] getOwnShowcase:", res.error.message);
    const base = await client.from("profiles").select("username, badge").eq("id", userId).maybeSingle();
    const row = base.data as { username: string | null; badge: string | null } | null;
    return { status: missing ? "missing" : "error", showcase: empty, username: row?.username ?? null, badge: row?.badge ?? null };
  }
  const row = res.data as (ShowcaseRow & { username: string | null; badge: string | null }) | null;
  return { status: "ok", showcase: row ? toShowcase(row) : empty, username: row?.username ?? null, badge: row?.badge ?? null };
}

/**
 * I profili con un tag autore (Autore, Influencer, Pro, Staff): la directory /creators, le icone accanto ai nomi in
 * /decks e i canali Twitch da controllare per lo stato in diretta. Vuoto con la community spenta o le colonne mancanti.
 */
export async function listCreators(): Promise<CreatorProfile[]> {
  const client = supabasePublic();
  if (!client || !showcaseReadable()) return [];
  const res = await client
    .from("profiles")
    .select(`id, username, display_name, avatar_url, badge, created_at, ${SHOWCASE_COLUMNS}`)
    .in("badge", [...CREATOR_BADGES])
    .order("created_at", { ascending: true })
    .limit(500);
  if (missingColumns(res.error)) return [];
  if (res.error) throw new CommunityReadError("listCreators", res.error.message);
  type Row = ShowcaseRow & { id: string; username: string | null; display_name: string | null; avatar_url: string | null; badge: string; created_at: string };
  return ((res.data ?? []) as Row[])
    .filter((r): r is Row & { username: string } => Boolean(r.username))
    .map((r) => ({ id: r.id, username: r.username, display_name: r.display_name, avatar_url: r.avatar_url, badge: r.badge, created_at: r.created_at, ...toShowcase(r) }));
}

/** I creator per id del profilo, per trovare in fretta quelli degli autori di una lista di mazzi. */
export function creatorIndex(creators: readonly CreatorProfile[]): ReadonlyMap<string, CreatorProfile> {
  return new Map(creators.map((c) => [c.id, c]));
}

/**
 * Quello che l'elenco /decks mostra accanto al nome di un autore con un tag (`ExplorerDeck.channels` e `liveUser`):
 * i canali principali e, se ha un canale Twitch, il nome utente per il badge LIVE. Niente per gli altri autori.
 */
export function creatorExtras(index: ReadonlyMap<string, CreatorProfile>, ownerId: string): { channels?: ProfileLink[]; liveUser?: string } {
  const c = index.get(ownerId);
  if (!c || !isCreatorBadge(c.badge)) return {};
  const channels = mainChannels(c.links);
  return { ...(channels.length ? { channels } : {}), ...(twitchLogin(c.links) ? { liveUser: c.username } : {}) };
}

/**
 * I tornei PUBBLICI organizzati da un iscritto, dal più recente (vetrina del creator su /u), con le colonne delle altre
 * schede torneo (`TOURNAMENT_SELECT` di tournament/queries.ts). Mai i privati: il filtro è esplicito, anche se la
 * policy `can_view_tournament` li nasconderebbe comunque al client anonimo. Niente annullati.
 */
export async function listOrganizedTournaments(organizerId: string, limit = 12): Promise<Tournament[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await client
    .from("tournaments")
    .select(TOURNAMENT_SELECT)
    .eq("organizer", organizerId)
    .eq("visibility", "public")
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (res.error) throw new CommunityReadError("listOrganizedTournaments", res.error.message);
  type Raw = Omit<Tournament, "players"> & { players?: { count: number }[] | number | null };
  return ((res.data ?? []) as unknown as Raw[]).map((r) => {
    const p = r.players;
    return { ...r, players: Array.isArray(p) ? Number(p[0]?.count ?? 0) : typeof p === "number" ? p : 0 };
  });
}
