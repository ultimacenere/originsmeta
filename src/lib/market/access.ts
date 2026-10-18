import { cache } from "react";
import { currentUser } from "@/lib/supabase/server";
import { MARKET_PUBLIC, canSeeMarket } from "@/lib/community/badges";

/**
 * Chi apre il Mercato durante la prova riservata (18/10/2026, Pierluigi: "solo io e Davdas possiamo vederla"): con
 * `MARKET_PUBLIC` spento solo gli admin con l'accesso fatto (`canSeeMarket` di badges.ts). Una lettura per richiesta
 * (cache di React), condivisa da generateMetadata e dalla pagina. Leggere la sessione rende dinamiche le pagine /market
 * (nel matcher di src/proxy.ts, che rinnova la sessione); con `MARKET_PUBLIC` acceso non legge più nulla e tornano ISR.
 */
export const marketAccess = cache(async (): Promise<boolean> => {
  if (MARKET_PUBLIC) return true;
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return canSeeMarket((data as { role: string | null } | null)?.role);
});
