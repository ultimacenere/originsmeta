/**
 * Annunci dei tornei (19/11/2026, Harvest Bowl; Pierluigi: "mettiamoci una lavagna annunci per apix, a quanto pare vuole
 * fare annunci a tutti i partecipanti al torneo"). Regole in funzioni pure, senza import, così si provano con
 * `node --test src/lib/tournament/announcements.test.ts`. Il database sta nel blocco `-- ===== 19/11/2026: ANNUNCI DEI
 * TORNEI =====` di supabase/schema.sql (il test confronta i limiti), le letture in `announcementQueries.ts`, le Server
 * Action in `announcementActions.ts`, la bacheca in src/components/announcements/.
 *
 * Chi scrive: organizzatore, arbitri e admin del sito (is_tournament_staff) di TUTTI i tornei a cui l'annuncio è rivolto.
 * Chi legge: chiunque veda almeno uno di quei tornei (un torneo pubblico lo vedono tutti). Chi riceve l'avviso nella busta:
 * gli iscritti, anche in lista d'attesa, una volta sola per annuncio.
 */

export const ANNOUNCEMENT_TITLE_MIN = 3;
export const ANNOUNCEMENT_TITLE_MAX = 120;
export const ANNOUNCEMENT_BODY_MAX = 2000;
export const ANNOUNCEMENT_LINK_MAX = 300;
/** Tornei a cui può essere rivolto un annuncio. */
export const ANNOUNCEMENT_TOURNAMENTS_MAX = 8;
/** Annunci all'ora per autore (too_many oltre). */
export const ANNOUNCEMENT_HOURLY_MAX = 20;
/** Quanti annunci mostrano la scheda del torneo e la pagina dell'evento (i più recenti, quelli in evidenza prima). */
export const ANNOUNCEMENTS_SHOWN = 30;
/** Ancora della bacheca sulla scheda del torneo e sulla pagina dell'evento. */
export const ANNOUNCEMENTS_ANCHOR = "announcements";

/** Uguale al vincolo `link_url` della tabella. */
export const ANNOUNCEMENT_LINK_PATTERN = /^https:\/\/[^\s<>"]+$/;

export type Announcement = {
  id: number;
  tournament_ids: string[];
  author: string | null;
  title: string;
  body: string;
  link_url: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

/** Le colonne leggibili (fuori `recipients`, come la grant del blocco). */
export const ANNOUNCEMENT_COLUMNS = "id, tournament_ids, author, title, body, link_url, pinned, created_at, updated_at, edited_at";

/** Gli errori che le funzioni del database alzano con `raise exception`, più quelli del sito. */
export const ANNOUNCEMENT_ERRORS = ["not_logged_in", "invalid", "not_found", "forbidden", "too_many", "unavailable", "generic"] as const;
export type AnnouncementError = (typeof ANNOUNCEMENT_ERRORS)[number];

/** Come `ta_clean` nel database: niente \r, spazi e a capo tolti in testa e in coda. */
export function cleanText(v: unknown): string {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/^[ \t\n]+|[ \t\n]+$/g, "");
}

export type AnnouncementInput = { title: string; body: string; link: string | null; pinned: boolean; tournamentIds: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Controlla e pulisce quello che arriva dal modulo, con le stesse regole del database (che ricontrolla tutto): titolo 3-120
 * caratteri, testo fino a 2000, link https facoltativo, 1-8 tornei distinti. null se qualcosa non va.
 */
export function parseAnnouncementInput(raw: { title?: unknown; body?: unknown; link?: unknown; pinned?: unknown; tournamentIds?: unknown }): AnnouncementInput | null {
  const title = cleanText(raw.title);
  const body = cleanText(raw.body);
  const linkRaw = cleanText(raw.link);
  const link = linkRaw === "" ? null : linkRaw;
  const ids = Array.isArray(raw.tournamentIds) ? raw.tournamentIds : [];
  const tournamentIds = [...new Set(ids.map((x) => String(x ?? "").toLowerCase()).filter((x) => UUID.test(x)))];
  if ([...title].length < ANNOUNCEMENT_TITLE_MIN || [...title].length > ANNOUNCEMENT_TITLE_MAX) return null;
  if ([...body].length > ANNOUNCEMENT_BODY_MAX) return null;
  if (link !== null && (link.length > ANNOUNCEMENT_LINK_MAX || !ANNOUNCEMENT_LINK_PATTERN.test(link))) return null;
  if (tournamentIds.length < 1 || tournamentIds.length > ANNOUNCEMENT_TOURNAMENTS_MAX) return null;
  return { title, body, link, pinned: raw.pinned === true || raw.pinned === "on" || raw.pinned === "true", tournamentIds };
}

/** Il codice d'errore di una risposta del database: quelli di `raise exception`, "unavailable" se il blocco non è migrato. */
export function announcementErrorCode(error: { message?: string; code?: string } | null | undefined): AnnouncementError {
  if (!error) return "generic";
  const msg = String(error.message ?? "");
  // tabella o funzione che non c'è ancora (prima della migrazione)
  if (error.code === "42P01" || error.code === "42883" || error.code === "PGRST202" || error.code === "PGRST205" || /does not exist|Could not find the (function|table)/i.test(msg)) return "unavailable";
  for (const k of ANNOUNCEMENT_ERRORS) if (new RegExp(`\\b${k}\\b`).test(msg)) return k;
  return "generic";
}

/** In evidenza prima, poi dal più recente. */
export function sortAnnouncements<T extends Pick<Announcement, "pinned" | "created_at" | "id">>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at) || b.id - a.id);
}

/** Forma sicura di una riga letta dal database (le righe strane si scartano). */
export function toAnnouncement(r: unknown): Announcement | null {
  if (!r || typeof r !== "object") return null;
  const x = r as Record<string, unknown>;
  const id = Number(x.id);
  if (!Number.isSafeInteger(id) || typeof x.title !== "string" || typeof x.created_at !== "string") return null;
  const tids = Array.isArray(x.tournament_ids) ? x.tournament_ids.filter((t): t is string => typeof t === "string") : [];
  const link = typeof x.link_url === "string" && ANNOUNCEMENT_LINK_PATTERN.test(x.link_url) ? x.link_url : null;
  return {
    id,
    tournament_ids: tids,
    author: typeof x.author === "string" ? x.author : null,
    title: x.title,
    body: typeof x.body === "string" ? x.body : "",
    link_url: link,
    pinned: x.pinned === true,
    created_at: x.created_at,
    updated_at: typeof x.updated_at === "string" ? x.updated_at : x.created_at,
    edited_at: typeof x.edited_at === "string" ? x.edited_at : null,
  };
}
