import { cache } from "react";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { ANALYTICS_PUBLIC, canSeeAnalytics } from "./badges";

/**
 * Chi vede OriginsMeta Analytics durante la prova (10/10/2026, Pierluigi: "la pagina deve essere visibile solo ai
 * creators e top players, lo facciamo testare prima di renderlo pubblico"): con `ANALYTICS_PUBLIC` spento, solo chi ha
 * fatto l'accesso e ha il ruolo Creator, Pro o Staff, o è admin (`canSeeAnalytics` di badges.ts). Una lettura per
 * richiesta (cache di React), condivisa da generateMetadata e dalla pagina.
 *
 * Leggere la sessione rende dinamiche le pagine che la chiamano (/analytics, /tier-list/win-rate): quando
 * `ANALYTICS_PUBLIC` si accende la funzione non legge più nulla e le pagine tornano statiche e ISR da sole.
 */
export const analyticsAccess = cache(async (): Promise<boolean> => {
  if (ANALYTICS_PUBLIC) return true;
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return false;
  const { data } = await supabase.from("profiles").select("role, badge").eq("id", user.id).maybeSingle();
  const profile = data as { role: string | null; badge: string | null } | null;
  return canSeeAnalytics(profile?.badge, profile?.role);
});

/** 404 per chi non può vedere le pagine di Analytics: nessun indizio che esistano. */
export async function requireAnalyticsAccess(): Promise<void> {
  if (!(await analyticsAccess())) notFound();
}
