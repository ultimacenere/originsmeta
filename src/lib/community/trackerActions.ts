"use server";

import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { LINK } from "@/lib/tracker/upload";
import { dbErrorCode } from "@/lib/tracker/http";

/**
 * Le azioni di /account/tracker (tracker/overlay, Fase 3, 30/09/2026): codice di collegamento dell'app, scollegamento
 * di un PC, cancellazione delle partite. Tutte con la sessione dell'utente e le funzioni del blocco TRACKER di
 * supabase/schema.sql (tracker_link_code, tracker_revoke, tracker_forget), che controllano da sé chi chiama.
 */

export type TrackerCodeState = {
  code?: string;
  /** ISO: il codice vale 10 minuti dalla creazione */
  expiresAt?: string;
  error?: "too_many_codes" | "unavailable" | "not_authenticated" | "error";
};

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const trackerPath = (locale: Locale, query: string, anchor: string) => `/${locale}/account/tracker?${query}#${anchor}`;

/** Per `useActionState`: lo stato di prima non serve, ogni clic crea un codice nuovo. */
export async function createTrackerCode(): Promise<TrackerCodeState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" };
  if (!user) return { error: "not_authenticated" };
  const { data, error } = await supabase.rpc("tracker_link_code");
  if (error || typeof data !== "string") {
    const reason = error ? dbErrorCode(error) : "error";
    if (reason === "too_many_codes" || reason === "unavailable" || reason === "not_authenticated") return { error: reason };
    console.error("[tracker] codice:", error?.message ?? "risposta vuota");
    return { error: "error" };
  }
  return { code: data, expiresAt: new Date(Date.now() + LINK.minutes * 60_000).toISOString() };
}

/** Scollega un proprio PC: il suo token smette di valere subito. */
export async function revokeTrackerDevice(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  const { supabase, user } = await currentUser();
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const { data, error } = UUID_RE.test(id) ? await supabase.rpc("tracker_revoke", { p_device: id }) : { data: false, error: null };
  if (error) console.error("[tracker] scollegamento:", error.message);
  redirect(trackerPath(locale, error || data !== true ? "error=revoke" : "done=revoke", "devices"));
}

/** Cancella tutte le proprie partite arrivate dall'app (i PC restano collegati). */
export async function forgetTrackerMatches(formData: FormData): Promise<void> {
  const locale = localeOf(formData);
  const { supabase, user } = await currentUser();
  if (!supabase || !user) redirect(`/${locale}/login`);
  const { data, error } = await supabase.rpc("tracker_forget");
  if (error) console.error("[tracker] cancellazione:", error.message);
  redirect(trackerPath(locale, error ? "error=forget" : `forgot=${typeof data === "number" ? data : 0}`, "data"));
}
