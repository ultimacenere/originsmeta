/**
 * Configurazione pubblica di Supabase (progetto "originsmeta", regione eu-west-1).
 *
 * URL e chiave "publishable" (anon) sono fatti per stare nel bundle del browser: l'accesso ai dati è
 * governato dalle policy RLS in supabase/schema.sql, non da questa chiave. Le variabili d'ambiente
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (vedi .env.example) hanno la precedenza
 * sui valori di default, così si può puntare a un altro progetto senza toccare il codice.
 * NEXT_PUBLIC_COMMUNITY=off spegne account, pubblicazione e voti (il resto del sito resta statico).
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://obpnprlzxrlbvncpqlpq.supabase.co";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_PyOOtrhxoQ05U6F5KQa1Lg_1vTnfjxK";
export const supabaseEnabled = process.env.NEXT_PUBLIC_COMMUNITY !== "off" && supabaseUrl.length > 0 && supabaseKey.length > 0;
