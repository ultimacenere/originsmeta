import { supabaseUrl } from "@/lib/supabase/env";
import { newSlug } from "@/lib/community/util";
import type { TournamentInsert } from "@/lib/supabase/database";
import { BEST_OF_OPTIONS, CONQUEST_DECKS_RANGE, COVER_BUCKET, COVER_PRESETS, DECK_MODES, DEFAULT_COVER, TOURNAMENT_SIZES, canListTournaments, type DeckMode } from "./types";

/** Validazione lato server del modulo "Organizza un torneo" (creazione e modifica). Solo testo semplice, niente HTML. */

export type TournamentFormError = "name" | "startsAt" | "size" | "deckMode" | "conquestDecks" | "conquestMin" | "bestOf" | "lang" | "discord" | "cover" | "listing";

const LIMITS = { nameMin: 3, nameMax: 60, textMax: 2000 };
const DISCORD_HOSTS = ["discord.gg", "discord.com", "discordapp.com"];

function text(fd: FormData, key: string, max: number): string {
  return String(fd.get(key) ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

/** Link Discord del torneo: solo https verso discord.gg / discord.com. Vuoto = nessun link. */
export function cleanDiscord(raw: string): { ok: true; value: string | null } | { ok: false } {
  const v = raw.trim().slice(0, 200);
  if (!v) return { ok: true, value: null };
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    const host = u.hostname.replace(/^www\./, "");
    if (u.protocol !== "https:" || !DISCORD_HOSTS.includes(host)) return { ok: false };
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false };
  }
}

/** URL pubblico di una copertina caricata nello Storage (`<user_id>/<file>` nel bucket delle copertine). */
export function coverPublicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${COVER_BUCKET}/${path}`;
}

/**
 * Accetta una copertina del media kit (tutti) oppure, per Influencer/Pro/Staff e admin, una copertina
 * caricata dal browser nella propria cartella dello Storage. Qualsiasi altro valore è rifiutato.
 */
export function checkCover(raw: string, userId: string, canUpload: boolean): string | null {
  const v = raw.trim();
  if (!v) return DEFAULT_COVER;
  if ((COVER_PRESETS as readonly string[]).includes(v)) return v;
  if (!canUpload) return null;
  const prefix = coverPublicUrl(`${userId}/`);
  if (v.startsWith(prefix) && /^[A-Za-z0-9._-]{1,80}$/.test(v.slice(prefix.length))) return v;
  return null;
}

export type ParsedTournament = { ok: true; row: Omit<TournamentInsert, "organizer" | "slug"> } | { ok: false; error: TournamentFormError };

/** Legge e valida i campi del modulo; `starts_at` arriva già in ISO (il browser converte l'ora locale). */
export function parseTournamentForm(fd: FormData, ctx: { userId: string; profile: { badge?: string | null; role?: string | null } | null }): ParsedTournament {
  const name = String(fd.get("name") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.nameMax);
  if (name.length < LIMITS.nameMin) return { ok: false, error: "name" };

  const startsAt = new Date(String(fd.get("starts_at") ?? ""));
  const now = Date.now();
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now - 3_600_000 || startsAt.getTime() > now + 366 * 86_400_000) return { ok: false, error: "startsAt" };

  const size = Number(fd.get("size"));
  if (!(TOURNAMENT_SIZES as readonly number[]).includes(size)) return { ok: false, error: "size" };

  const deckMode = String(fd.get("deck_mode") ?? "");
  if (!(DECK_MODES as readonly string[]).includes(deckMode)) return { ok: false, error: "deckMode" };
  const conquest = deckMode === "conquest";
  const conquestDecks = conquest ? Number(fd.get("conquest_decks")) : CONQUEST_DECKS_RANGE.default;
  if (!Number.isInteger(conquestDecks) || conquestDecks < CONQUEST_DECKS_RANGE.min || conquestDecks > CONQUEST_DECKS_RANGE.max) return { ok: false, error: "conquestDecks" };
  const conquestMin = conquest ? Number(fd.get("conquest_min_different")) : 9;
  if (!Number.isInteger(conquestMin) || conquestMin < 0 || conquestMin > 25) return { ok: false, error: "conquestMin" };

  const bestOf = Number(fd.get("best_of"));
  if (!(BEST_OF_OPTIONS as readonly number[]).includes(bestOf)) return { ok: false, error: "bestOf" };

  const lang = String(fd.get("lang") ?? "");
  if (lang !== "en" && lang !== "it") return { ok: false, error: "lang" };

  const description = text(fd, "description", LIMITS.textMax);
  const rules = text(fd, "rules", LIMITS.textMax);
  const discord = cleanDiscord(String(fd.get("discord_url") ?? ""));
  if (!discord.ok) return { ok: false, error: "discord" };

  const canList = canListTournaments(ctx.profile);
  const cover = checkCover(String(fd.get("cover_url") ?? ""), ctx.userId, canList);
  if (!cover) return { ok: false, error: "cover" };
  const listedRaw = fd.get("listed");
  const listed = listedRaw === "on" || listedRaw === "true";
  if (listed && !canList) return { ok: false, error: "listing" };

  return {
    ok: true,
    row: {
      name,
      cover_url: cover,
      description,
      rules,
      lang,
      starts_at: startsAt.toISOString(),
      size,
      deck_mode: deckMode as DeckMode,
      conquest_decks: conquestDecks,
      conquest_min_different: conquestMin,
      best_of: bestOf,
      discord_url: discord.value,
      listed,
    },
  };
}

/** Codici mazzo incollati in un'area di testo: uno per riga, vuoti e spazi ignorati. */
export function splitCodes(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export { newSlug };
