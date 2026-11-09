"use server";

import { redirect } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { steamMigrationMissing, unlinkOutcome, type SteamLinkOutcome } from "@/lib/steam/link";

/**
 * "Scollega Steam" della sezione #steam di /account (09/11/2026). Il collegamento lo scrive solo la rotta di ritorno da
 * Steam (/auth/steam/callback); per toglierlo basta la sessione: steam_link_remove (blocco STEAM di schema.sql) lo toglie
 * all'iscritto che chiama, tranne quando l'account è nato con Steam e non ha altri modi per entrare.
 */
export async function unlinkSteam(formData: FormData): Promise<void> {
  const raw = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const back = (outcome: SteamLinkOutcome) => redirect(`/${locale}/account?steam=${outcome}#steam`);
  const { supabase, user } = await currentUser();
  if (!supabase || !user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/account#steam`)}`);
  const { data, error } = await supabase.rpc("steam_link_remove");
  if (error) {
    console.error("[steam] steam_link_remove:", error.code, error.message);
    back(steamMigrationMissing(error) ? "missing" : "error");
  }
  back(unlinkOutcome(data));
}
