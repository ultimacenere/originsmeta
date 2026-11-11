import { supabaseUrl } from "@/lib/supabase/env";
import { isLocale } from "@/lib/i18n";
import { RULES } from "@/lib/deckrules";
import { newSlug } from "@/lib/community/util";
import type { TournamentInsert } from "@/lib/supabase/database";
import { NO_SHOW_RANGE } from "./rules";
import { TOP_CUTS } from "./stages";
import { FORMATS, GROUP_ADVANCE_RANGE, GROUP_SEEDINGS, GROUP_SIZE_RANGE, SIDEBOARD_RANGE, SWISS_ROUNDS_RANGE, type GroupSeeding, type TournamentFormat } from "./formats";
import { DE_ONLY_SIZES, DE_POOLS_RANGE, DE_QUALIFY_OPTIONS, deMinPlayers } from "./doubleElim";
import { BEST_OF_OPTIONS, CONQUEST_DECKS_RANGE, COVER_BUCKET, COVER_PRESETS, DECK_MODES, DEFAULT_COVER, TOURNAMENT_SIZES, VISIBILITIES, canListTournaments, type DeckMode, type Visibility } from "./types";

/** Validazione lato server del modulo "Organizza un torneo" (creazione e modifica). Solo testo semplice, niente HTML. */

export type TournamentFormError = "name" | "startsAt" | "size" | "deckMode" | "conquestDecks" | "conquestMin" | "bestOf" | "finalBestOf" | "noShow" | "lang" | "discord" | "cover" | "listing" | "visibility" | "topCut" | "deckBan" | "format" | "swissRounds" | "groups" | "sideboard" | "doubleElim";

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
 * Accetta una copertina del media kit (tutti) oppure, per Creator/Pro/Staff e admin, una copertina
 * caricata dal browser nella propria cartella dello Storage. Qualsiasi altro valore è rifiutato.
 * `keep` è la copertina che il torneo ha già (solo nella modifica): resta valida anche per chi nel frattempo non può
 * più caricarne (27/09/2026: un Creator che diventa Autore modifica un suo torneo senza l'errore "copertina").
 */
export function checkCover(raw: string, userId: string, canUpload: boolean, keep?: string | null): string | null {
  const v = raw.trim();
  if (!v) return DEFAULT_COVER;
  if ((COVER_PRESETS as readonly string[]).includes(v)) return v;
  if (keep && v === keep) return v;
  if (!canUpload) return null;
  const prefix = coverPublicUrl(`${userId}/`);
  if (v.startsWith(prefix) && /^[A-Za-z0-9._-]{1,80}$/.test(v.slice(prefix.length))) return v;
  return null;
}

export type ParsedTournament = { ok: true; row: Omit<TournamentInsert, "organizer" | "slug"> } | { ok: false; error: TournamentFormError };

/**
 * Legge e valida i campi del modulo; `starts_at` arriva già in ISO (il browser converte l'ora locale). Nella modifica
 * `currentCover` è la copertina già salvata sul torneo (vedi `checkCover`).
 */
export function parseTournamentForm(
  fd: FormData,
  ctx: { userId: string; profile: { badge?: string | null; role?: string | null } | null; allowPast?: boolean; currentCover?: string | null },
): ParsedTournament {
  const name = String(fd.get("name") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.nameMax);
  if (name.length < LIMITS.nameMin) return { ok: false, error: "name" };

  const startsAt = new Date(String(fd.get("starts_at") ?? ""));
  const now = Date.now();
  const tooEarly = !ctx.allowPast && startsAt.getTime() < now - 3_600_000;
  if (Number.isNaN(startsAt.getTime()) || tooEarly || startsAt.getTime() > now + 366 * 86_400_000) return { ok: false, error: "startsAt" };

  const size = Number(fd.get("size"));
  // 512 e 1024 solo per la doppia eliminazione (10/11/2026): il controllo con il formato è più sotto
  if (!(TOURNAMENT_SIZES as readonly number[]).includes(size) && !(DE_ONLY_SIZES as readonly number[]).includes(size)) return { ok: false, error: "size" };

  const deckMode = String(fd.get("deck_mode") ?? "");
  if (!(DECK_MODES as readonly string[]).includes(deckMode)) return { ok: false, error: "deckMode" };
  const conquest = deckMode === "conquest";
  const conquestDecks = conquest ? Number(fd.get("conquest_decks")) : CONQUEST_DECKS_RANGE.default;
  if (!Number.isInteger(conquestDecks) || conquestDecks < CONQUEST_DECKS_RANGE.min || conquestDecks > CONQUEST_DECKS_RANGE.max) return { ok: false, error: "conquestDecks" };
  // carte uniche fra due mazzi: un mazzo ne ha 13, quindi più di 13 non avrebbe senso
  const conquestMin = conquest ? Number(fd.get("conquest_min_different")) : RULES.conquestMinDifferent;
  if (!Number.isInteger(conquestMin) || conquestMin < 0 || conquestMin > 13) return { ok: false, error: "conquestMin" };

  const bestOf = Number(fd.get("best_of"));
  if (!(BEST_OF_OPTIONS as readonly number[]).includes(bestOf)) return { ok: false, error: "bestOf" };
  // 05/10/2026 (regole della Crimson Cup): finale con una lunghezza sua, check-in e lista d'attesa, liste segrete,
  // vittoria a tavolino dopo N minuti di assenza. Vuoto = spento.
  const finalRaw = String(fd.get("final_best_of") ?? "").trim();
  const finalBestOf = finalRaw ? Number(finalRaw) : null;
  if (finalBestOf !== null && !(BEST_OF_OPTIONS as readonly number[]).includes(finalBestOf)) return { ok: false, error: "finalBestOf" };
  const noShowRaw = String(fd.get("no_show_minutes") ?? "").trim();
  const noShow = noShowRaw ? Number(noShowRaw) : null;
  if (noShow !== null && (!Number.isInteger(noShow) || noShow < NO_SHOW_RANGE.min || noShow > NO_SHOW_RANGE.max)) return { ok: false, error: "noShow" };
  const on = (key: string) => {
    const v = fd.get(key);
    return v === "on" || v === "true";
  };
  // 08/11/2026 (blocco BRACKET E TOP CUT): fase finale a bracket, pausa prima della fase finale, ban di un mazzo
  // 09/11/2026 (blocco SVIZZERA, GIRONI E SIDEBOARD): formato, turni svizzeri, gironi, sideboard. Senza il campo il
  // torneo è a eliminazione diretta, come prima.
  const formatRaw = String(fd.get("format") ?? "single_elim").trim() || "single_elim";
  if (!(FORMATS as readonly string[]).includes(formatRaw)) return { ok: false, error: "format" };
  const format = formatRaw as TournamentFormat;
  const int = (key: string) => {
    const raw = String(fd.get(key) ?? "").trim();
    return raw ? Number(raw) : null;
  };
  const swissRounds = format === "swiss" ? int("swiss_rounds") : null;
  if (swissRounds !== null && (!Number.isInteger(swissRounds) || swissRounds < SWISS_ROUNDS_RANGE.min || swissRounds > SWISS_ROUNDS_RANGE.max)) return { ok: false, error: "swissRounds" };
  const groupSize = format === "groups" ? int("group_size") : null;
  const groupAdvance = format === "groups" ? int("group_advance") : null;
  const seedingRaw = String(fd.get("group_seeding") ?? "snake");
  if (
    format === "groups" &&
    (groupSize === null || groupAdvance === null || !Number.isInteger(groupSize) || !Number.isInteger(groupAdvance) || groupSize < GROUP_SIZE_RANGE.min || groupSize > GROUP_SIZE_RANGE.max || groupAdvance < GROUP_ADVANCE_RANGE.min || groupAdvance > GROUP_ADVANCE_RANGE.max || groupAdvance >= groupSize || !(GROUP_SEEDINGS as readonly string[]).includes(seedingRaw))
  )
    return { ok: false, error: "groups" };
  // 10/11/2026 (blocco DOPPIA ELIMINAZIONE): tabelloni e qualificati per lato; 512 e 1024 posti solo qui
  if (format !== "double_elim" && !(TOURNAMENT_SIZES as readonly number[]).includes(size)) return { ok: false, error: "size" };
  const dePools = format === "double_elim" ? int("de_pools") : null;
  const deQualify = format === "double_elim" ? int("de_qualify") : null;
  if (
    format === "double_elim" &&
    (dePools === null || deQualify === null || !Number.isInteger(dePools) || dePools < DE_POOLS_RANGE.min || dePools > DE_POOLS_RANGE.max || !(DE_QUALIFY_OPTIONS as readonly number[]).includes(deQualify) || size < deMinPlayers(dePools, deQualify))
  )
    return { ok: false, error: "doubleElim" };
  // 11/11/2026 (blocco QUALIFICAZIONE SENZA FASE FINALE): la doppia eliminazione che finisce con i suoi qualificati
  const deQualifier = format === "double_elim" && on("de_qualifier");
  const sideboard = int("sideboard");
  if (sideboard !== null && (!Number.isInteger(sideboard) || sideboard < SIDEBOARD_RANGE.min || sideboard > SIDEBOARD_RANGE.max)) return { ok: false, error: "sideboard" };

  const topCutRaw = format === "groups" || format === "double_elim" ? "" : String(fd.get("top_cut") ?? "").trim();
  const topCut = topCutRaw ? Number(topCutRaw) : null;
  if (topCut !== null && (!(TOP_CUTS as readonly number[]).includes(topCut) || topCut >= size)) return { ok: false, error: "topCut" };
  const deckBan = on("deck_ban");
  if (deckBan && !conquest) return { ok: false, error: "deckBan" };

  const lang = String(fd.get("lang") ?? "");
  if (!isLocale(lang)) return { ok: false, error: "lang" };

  const description = text(fd, "description", LIMITS.textMax);
  const rules = text(fd, "rules", LIMITS.textMax);
  const discord = cleanDiscord(String(fd.get("discord_url") ?? ""));
  if (!discord.ok) return { ok: false, error: "discord" };

  const canList = canListTournaments(ctx.profile);
  const cover = checkCover(String(fd.get("cover_url") ?? ""), ctx.userId, canList, ctx.currentCover);
  if (!cover) return { ok: false, error: "cover" };
  const visibilityRaw = String(fd.get("visibility") ?? "public");
  if (!(VISIBILITIES as readonly string[]).includes(visibilityRaw)) return { ok: false, error: "visibility" };
  const visibility = visibilityRaw as Visibility;
  const listedRaw = fd.get("listed");
  // un torneo privato non va mai in calendario
  const listed = visibility === "public" && (listedRaw === "on" || listedRaw === "true");
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
      final_best_of: finalBestOf === bestOf ? null : finalBestOf,
      checkin: on("checkin"),
      hidden_decklists: on("hidden_decklists"),
      no_show_minutes: noShow,
      top_cut: topCut,
      // nei gironi e nella doppia eliminazione la pausa vale per la fase finale, che c'è sempre, tranne in una
      // qualificazione senza fase finale (11/11/2026)
      top_cut_hold: (topCut !== null || format === "groups" || format === "double_elim") && !deQualifier && on("top_cut_hold"),
      deck_ban: deckBan,
      format,
      swiss_rounds: swissRounds,
      group_size: groupSize,
      group_advance: groupAdvance,
      group_seeding: format === "groups" ? (seedingRaw as GroupSeeding) : null,
      de_pools: dePools,
      de_qualify: deQualify,
      // solo per la doppia eliminazione: gli altri formati non scrivono la colonna (vale il default del database)
      ...(format === "double_elim" ? { de_qualifier: deQualifier } : {}),
      sideboard,
      discord_url: discord.value,
      listed,
      visibility,
    },
  };
}

/**
 * Campi dei blocchi BRACKET E TOP CUT (08/11/2026) e SVIZZERA, GIRONI E SIDEBOARD (09/11/2026) nella riga del torneo.
 * `format` c'è da sempre, ma 'swiss' e 'groups' li accetta solo il database migrato: si toglie solo se è 'single_elim'.
 */
const STAGE_KEYS = ["top_cut", "top_cut_hold", "deck_ban", "swiss_rounds", "group_size", "group_advance", "group_seeding", "sideboard", "de_pools", "de_qualify", "de_qualifier"] as const;

/** La riga usa almeno una delle opzioni dei blocchi BRACKET E TOP CUT o SVIZZERA, GIRONI E SIDEBOARD. */
export function usesStageOptions(row: object): boolean {
  const r = row as { top_cut?: number | null; top_cut_hold?: boolean; deck_ban?: boolean; format?: string; sideboard?: number | null };
  return r.top_cut != null || Boolean(r.top_cut_hold) || Boolean(r.deck_ban) || (r.format !== undefined && r.format !== "single_elim") || r.sideboard != null;
}

/** La riga senza i campi del blocco BRACKET E TOP CUT: per scrivere su un database non ancora migrato. */
export function withoutStageOptions<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const k of STAGE_KEYS) delete out[k];
  return out as T;
}

/**
 * La riga senza `de_qualifier` quando è spenta (11/11/2026): un database senza il blocco QUALIFICAZIONE SENZA FASE
 * FINALE accetta lo stesso una doppia eliminazione con la fase finale. Con l'opzione accesa restituisce null: senza la
 * colonna quel torneo non si può scrivere.
 */
export function withoutQualifierOff<T extends Record<string, unknown>>(row: T): T | null {
  if (!("de_qualifier" in row) || row.de_qualifier) return null;
  const out: Record<string, unknown> = { ...row };
  delete out.de_qualifier;
  return out as T;
}

/** Errore di PostgREST o di Postgres per una colonna che il database non ha ancora (migrazione non fatta). */
export function isMissingColumn(e: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(e && (e.code === "PGRST204" || e.code === "42703" || /column .* does not exist|Could not find the '.*' column/i.test(e.message ?? "")));
}

/** Codici mazzo incollati in un'area di testo: uno per riga, vuoti e spazi ignorati. */
export function splitCodes(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export { newSlug };
