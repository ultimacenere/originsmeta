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

/**
 * Client anonimo senza cookie e senza cache (tracker/overlay, 30/09/2026): per le rotte che chiamano una funzione del
 * database con un segreto nella richiesta (il token dell'app in /api/tracker/*). Ogni chiamata va al database: niente
 * data cache di Next, che per una scrittura con un token sarebbe sbagliata.
 */
export function supabaseAnon(): Db | null {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
