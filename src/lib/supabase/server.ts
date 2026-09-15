import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database";
import type { Db } from "./public";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "./env";

/**
 * Client Supabase per Server Component, Server Action e Route Handler: legge la sessione dai cookie.
 * In un Server Component i cookie non si possono scrivere: il refresh del token lo fa src/proxy.ts.
 */
export async function supabaseServer(): Promise<Db | null> {
  if (!supabaseEnabled) return null;
  const store = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* Server Component: ignorato, vedi sopra */
        }
      },
    },
  });
}

/** Utente autenticato (verificato con Supabase) oppure null. */
export async function currentUser() {
  const supabase = await supabaseServer();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
