"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { isMissing } from "./achievements";
import { isShowcaseBadge } from "./badges";

/**
 * "Mostra i numeri sulla vetrina" in /account (pacchetto TRAGUARDI, 27/09/2026): accende o spegne `profiles.show_stats`
 * del proprio profilo, con la sessione dell'utente. Il database lascia cambiare solo questa colonna della propria riga
 * (grant per colonna + policy "users edit own profile") e un trigger rifiuta l'accensione a chi non ha un ruolo con
 * vetrina (supabase/wave2-TRAGUARDI.sql): qui lo stesso controllo arriva prima, con un messaggio chiaro. Spegnere è
 * sempre permesso. Un salvataggio identico a quello che c'è non scrive e non rigenera nulla.
 */

export type ShowStatsState = {
  ok?: boolean;
  /** il valore salvato */
  value?: boolean;
  error?: "disabled" | "notLoggedIn" | "notAllowed" | "missing" | "db";
};

export async function saveShowStats(_prev: ShowStatsState, formData: FormData): Promise<ShowStatsState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const want = formData.get("show_stats") === "on";
  const current = await supabase.from("profiles").select("username, badge, show_stats").eq("id", user.id).maybeSingle();
  if (current.error || !current.data) {
    if (current.error && isMissing(current)) return { error: "missing" };
    console.error("[achievements] saveShowStats (lettura):", current.error?.message ?? "profilo assente");
    return { error: "db" };
  }
  const row = current.data as { username: string | null; badge: string | null; show_stats: boolean | null };
  if (want && !isShowcaseBadge(row.badge)) return { error: "notAllowed" };
  if ((row.show_stats === true) === want) return { ok: true, value: want };
  const { error } = await supabase.from("profiles").update({ show_stats: want }).eq("id", user.id);
  if (error) {
    if (/show_stats_not_allowed/.test(error.message)) return { error: "notAllowed" };
    console.error("[achievements] saveShowStats:", error.message);
    return { error: "db" };
  }
  // la pagina pubblica mostra o toglie i numeri subito, senza aspettare la rigenerazione
  for (const l of locales) {
    revalidatePath(`/${l}/account`);
    if (row.username) revalidatePath(`/${l}/u/${row.username}`);
  }
  return { ok: true, value: want };
}
