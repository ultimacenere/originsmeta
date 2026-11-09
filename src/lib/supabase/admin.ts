import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";
import type { Db } from "./public";
import { supabaseEnabled, supabaseUrl } from "./env";

/**
 * Client di Supabase con la chiave SEGRETA (09/11/2026), per una cosa sola: l'accesso con Steam
 * (src/app/auth/steam/callback/route.ts). Steam non è un provider di Supabase Auth (usa OpenID 2.0, non OAuth), quindi la
 * sessione la apre il server: trova il profilo collegato allo SteamID o crea l'account nuovo, genera un link di accesso
 * e lo verifica subito (nessuna email parte). Queste operazioni di Supabase Auth richiedono la chiave segreta.
 *
 * Regole:
 * - la chiave sta solo nella variabile SUPABASE_SECRET_KEY del server su Vercel (mai `NEXT_PUBLIC_`, mai nel codice): una
 *   chiave segreta creata apposta nella dashboard di Supabase (Project Settings → API Keys → Secret keys), che si revoca
 *   da sola senza toccare le altre;
 * - `import "server-only"`: un componente del browser che importasse questo file fa fallire la build;
 * - la usa solo la rotta di ritorno di Steam; il resto del sito continua con la chiave pubblica e la sessione dell'utente;
 * - senza la variabile "Continua con Steam" non compare (`steamLoginOn`) e la rotta si ferma con un errore; il
 *   collegamento di Steam al profilo funziona comunque (usa la sessione e CRON_SECRET, blocco STEAM di schema.sql).
 */
const secretKey = (process.env.SUPABASE_SECRET_KEY ?? "").trim();

/** L'accesso con Steam è disponibile? (Letta dalle pagine, sul server: al browser arriva solo il sì o il no.) */
export function steamLoginOn(): boolean {
  return supabaseEnabled && secretKey.length > 0;
}

export function supabaseAdmin(): Db | null {
  if (!steamLoginOn()) return null;
  return createClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
