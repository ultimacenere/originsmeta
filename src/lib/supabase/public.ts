import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "./env";

export type Db = ReturnType<typeof createClient<Database>>;

/**
 * Client anonimo senza cookie: per le letture pubbliche nelle pagine statiche/ISR
 * (mazzi pubblicati, medie dei voti). Non vede mai la sessione di un utente.
 */
export function supabasePublic(): Db | null {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Le risposte restano nella data cache di Next al massimo 60 s (anche tra una build e l'altra);
    // "no-store" renderebbe dinamiche le pagine ISR che le usano.
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
  });
}
