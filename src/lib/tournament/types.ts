import type { Profile } from "@/lib/community/types";
import type { TournamentDecksRow, TournamentInviteRow, TournamentMatchRow, TournamentMessageRow, TournamentPlayerRow, TournamentRow } from "@/lib/supabase/database";

/**
 * Tournament Organizer (16/09/2026, richiesta del coach e di Davdas): tipi e costanti condivisi tra
 * schema (supabase/schema.sql), Server Action, query e componenti. I valori ammessi rispecchiano i
 * vincoli `check` delle tabelle: se cambiano lì, vanno cambiati anche qui.
 */

export const TOURNAMENT_SIZES = [4, 8, 16, 32, 64, 128] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

export const BEST_OF_OPTIONS = [1, 3, 5] as const;
export type BestOf = (typeof BEST_OF_OPTIONS)[number];

export const DECK_MODES = ["free", "conquest"] as const;
export type DeckMode = (typeof DECK_MODES)[number];

export const CONQUEST_DECKS_RANGE = { min: 2, max: 4, default: 3 } as const;

export type TournamentStatus = TournamentRow["status"];

/** Pubblico: lo trovano e vi si iscrivono tutti. Privato: solo organizzatore, admin, iscritti e invitati (link segreto o nome utente). */
export const VISIBILITIES = ["public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export type TournamentInvite = TournamentInviteRow & { profile?: Profile | null };

/** Link d'invito di un torneo privato: /t/<tag>/<codice>. Per i tornei pubblici il codice è ignorato. */
export function tournamentInviteLink(siteUrl: string, tag: string, code: string): string {
  return `${siteUrl}/t/${tag}/${code}`;
}
export type PlayerStatus = TournamentPlayerRow["status"];
export type MatchStatus = TournamentMatchRow["status"];

/** Profilo come lo restituiscono le query dei tornei (il ruolo serve per il calendario: gli admin pubblicano sempre). */
export type OrganizerProfile = Profile & { role?: string | null };

/** Torneo con organizzatore e numero di iscritti (conteggio PostgREST). */
export type Tournament = TournamentRow & { profile?: OrganizerProfile | null; players?: number };
export type TournamentPlayer = TournamentPlayerRow & { profile?: Profile | null };
export type TournamentDecks = TournamentDecksRow;
export type TournamentMatch = TournamentMatchRow;
export type TournamentMessage = TournamentMessageRow;

/** Bucket Storage privato degli screenshot dei referti: percorso `<match_id>/<user_id>/<1|2|3>.webp`, letto solo dalle parti. */
export const SCREENSHOT_BUCKET = "tournament-screenshots";
export const SCREENSHOTS_PER_PLAYER = 3;

/** Copertine dal materiale ufficiale Koin (public/media): tutti possono sceglierle. Le keyart delle Leggendarie
 *  stanno in cima perché sono quelle che distinguono di più un torneo dall'altro. */
export const COVER_PRESETS = [
  "/media/keyart-king-arthur.webp",
  "/media/keyart-mulan.webp",
  "/media/keyart-queen-of-hearts.webp",
  "/media/keyart-robin-hood.webp",
  "/media/keyart-winnie-the-pooh.webp",
  "/media/keyart-puss-in-boots.webp",
  "/media/keyart-goldi.webp",
  "/media/keyart-queen-of-hearts-cyber.webp",
  "/media/keyart-red-wide.webp",
  "/media/ss-versus.webp",
  "/media/ss-board-locations.webp",
  "/media/ss-board-clash.webp",
  "/media/hero-1920.webp",
  "/media/capsule-header.webp",
  "/media/banner-rapunzel.webp",
  "/media/ls-two-ways.webp",
  "/media/ls-zero-pay-to-win.webp",
  "/media/ls-real-collecting.webp",
  "/media/ls-collect-them-all.webp",
  "/media/ls-collector-pack.webp",
] as const;
export const DEFAULT_COVER: string = COVER_PRESETS[0];

/** Bucket Storage delle copertine caricate (solo Influencer, Pro, Staff o admin; percorso `<user_id>/<file>`). */
export const COVER_BUCKET = "tournament-covers";

/** Tag autore che possono pubblicare un torneo sul calendario e caricare una copertina propria (decisione di Pierluigi, 16/09/2026). */
export const LISTING_BADGES = ["influencer", "pro", "staff"] as const;

export function canListTournaments(profile: { badge?: string | null; role?: string | null } | null | undefined): boolean {
  if (!profile) return false;
  return profile.role === "admin" || (LISTING_BADGES as readonly string[]).includes(profile.badge ?? "");
}

/** Tag del torneo: OM- più 4 caratteri di un alfabeto senza 0/O e 1/I (vedi gen_tournament_tag in schema.sql). */
export const TAG_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const TAG_RE = new RegExp(`^OM-[${TAG_ALPHABET}]{4}$`);

/** Normalizza quello che l'utente digita ("om-7kq2", "7KQ2", "#OM-7KQ2") nel tag canonico, oppure null. */
export function normalizeTag(raw: string): string | null {
  const s = raw.trim().replace(/^#/, "").toUpperCase().replace(/^OM[-_ ]?/, "");
  const tag = `OM-${s}`;
  return TAG_RE.test(tag) ? tag : null;
}

/** Quanti mazzi deve consegnare ogni giocatore. */
export function decksRequired(t: Pick<Tournament, "deck_mode" | "conquest_decks">): number {
  return t.deck_mode === "conquest" ? t.conquest_decks : 1;
}

/** Chiave localStorage del deck builder dedicato a un torneo (non sovrascrive il builder libero). */
export function tournamentBuilderKey(tag: string): string {
  return `originsmeta.tournament.${tag}`;
}

/** Sostituisce i segnaposto `{n}` nelle etichette dei dizionari. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Link breve del torneo da condividere (route /t/[tag]). */
export function tournamentShortLink(siteUrl: string, tag: string): string {
  return `${siteUrl}/t/${tag}`;
}
