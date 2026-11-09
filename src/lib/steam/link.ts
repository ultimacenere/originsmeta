/**
 * Esiti del collegamento con Steam (09/11/2026), condivisi fra la rotta di ritorno, la Server Action che scollega e la
 * sezione #steam di /account, che li mostra (`?steam=<esito>` nell'indirizzo). Funzioni pure: test in
 * steam.test.ts. Le risposte delle funzioni SQL sono quelle del blocco "09/11/2026: STEAM" di supabase/schema.sql.
 */
import { isSteamId } from "./openid";

export const STEAM_LINK_OUTCOMES = [
  /** collegato ora */
  "linked",
  /** era già collegato questo account Steam */
  "already",
  /** il profilo ha già un altro account Steam: prima si scollega */
  "other",
  /** l'account Steam è di un altro profilo del sito */
  "taken",
  /** annullato su Steam */
  "cancelled",
  /** Steam non ha confermato, oppure un errore del sito */
  "error",
  /** il database non ha ancora il blocco STEAM */
  "missing",
  /** il giro è partito con un altro account del sito */
  "mismatch",
  /** scollegato */
  "unlinked",
  /** account nato con Steam: il collegamento resta */
  "steamOnly",
] as const;
export type SteamLinkOutcome = (typeof STEAM_LINK_OUTCOMES)[number];

/** Risposta di steam_link_set → esito mostrato nel profilo. */
export function linkOutcome(rpc: unknown): SteamLinkOutcome {
  if (rpc === "ok") return "linked";
  if (rpc === "same") return "already";
  if (rpc === "other") return "other";
  if (rpc === "taken") return "taken";
  return "error";
}

/** Risposta di steam_link_remove → esito mostrato nel profilo ("none": non c'era più niente da scollegare). */
export function unlinkOutcome(rpc: unknown): SteamLinkOutcome {
  if (rpc === "ok" || rpc === "none") return "unlinked";
  if (rpc === "steam_only") return "steamOnly";
  return "error";
}

/** L'esito scritto nell'indirizzo (`?steam=`), se è uno di quelli che la pagina sa spiegare. */
export function parseSteamOutcome(raw: string | string[] | undefined | null): SteamLinkOutcome | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (STEAM_LINK_OUTCOMES as readonly string[]).includes(v ?? "") ? (v as SteamLinkOutcome) : null;
}

/** Il blocco STEAM non c'è ancora: funzione (PGRST202, 42883) o tabella (PGRST205, 42P01) sconosciute. */
export function steamMigrationMissing(error: { code?: string | null } | null | undefined): boolean {
  return ["PGRST202", "PGRST205", "42883", "42P01"].includes(error?.code ?? "");
}

export type SteamLinkStatus = { steamId: string; linkedAt: string | null; steamOnly: boolean };

/** La riga di steam_link_status (o nessuna): null se non c'è un collegamento valido. */
export function parseSteamLinkStatus(rows: unknown): SteamLinkStatus | null {
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || typeof row !== "object") return null;
  const r = row as { steam_id?: unknown; linked_at?: unknown; steam_only?: unknown };
  if (!isSteamId(r.steam_id)) return null;
  return { steamId: r.steam_id, linkedAt: typeof r.linked_at === "string" ? r.linked_at : null, steamOnly: r.steam_only === true };
}
