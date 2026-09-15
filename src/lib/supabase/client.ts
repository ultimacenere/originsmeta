import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database";
import type { Db } from "./public";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "./env";

let client: Db | null = null;

/** Client Supabase per i componenti client (singleton). Restituisce null se la community è spenta o sul server. */
export function supabaseBrowser(): Db | null {
  if (!supabaseEnabled || typeof window === "undefined") return null;
  if (!client) client = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return client;
}
