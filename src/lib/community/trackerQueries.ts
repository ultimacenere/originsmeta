import type { Db } from "@/lib/supabase/public";
import type { TrackerDeviceRow } from "@/lib/supabase/database";
import { OWN_MATCH_COLUMNS, type OwnMatch } from "@/lib/tracker/personal";
import { isMissing } from "./achievements";

/**
 * Letture di /account/tracker (tracker/overlay, Fase 3, 30/09/2026), con la sessione dell'utente: le policy del blocco
 * TRACKER di supabase/schema.sql gli lasciano leggere solo i suoi PC (senza l'impronta del token) e le sue partite.
 * Prima della migrazione (tabelle che mancano) `missing`: la pagina lo dice invece di rompersi.
 */

export type TrackerRead<T> = { status: "ok"; data: T } | { status: "missing" } | { status: "error" };

/** Quante partite al massimo legge la pagina per le statistiche personali (le più recenti). */
export const OWN_MATCHES_MAX = 3000;

export type TrackerDevice = Pick<TrackerDeviceRow, "id" | "name" | "created_at" | "last_seen_at">;

/**
 * I PC collegati e non scollegati. Niente filtro su `owner`: authenticated legge solo alcune colonne dei PC (grant per
 * colonna, `owner` escluso) e un filtro su quella colonna darebbe "permission denied"; le righe sono già solo le sue
 * (policy "tracker devices: owner reads").
 */
export async function readTrackerDevices(supabase: Db): Promise<TrackerRead<TrackerDevice[]>> {
  const res = await supabase.from("tracker_devices").select("id, name, created_at, last_seen_at").is("revoked_at", null).order("created_at", { ascending: false });
  if (res.error) {
    if (isMissing(res)) return { status: "missing" };
    console.error("[tracker] PC collegati:", res.error.message);
    return { status: "error" };
  }
  return { status: "ok", data: (res.data ?? []) as TrackerDevice[] };
}

export async function readOwnMatches(supabase: Db, userId: string): Promise<TrackerRead<OwnMatch[]>> {
  const res = await supabase.from("tracked_matches").select(OWN_MATCH_COLUMNS).eq("owner", userId).order("created_at", { ascending: false }).limit(OWN_MATCHES_MAX);
  if (res.error) {
    if (isMissing(res)) return { status: "missing" };
    console.error("[tracker] partite:", res.error.message);
    return { status: "error" };
  }
  return { status: "ok", data: (res.data ?? []) as unknown as OwnMatch[] };
}
