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

/** L'utente della sessione: le sole cose che il sito ne usa (id e email). */
export type SessionUser = { id: string; email: string | undefined };

/**
 * Utente autenticato oppure null. Il token si verifica con `getClaims` (17/10/2026, "fastidioso delay" di /account):
 * il progetto firma i token con chiavi ES256, quindi la firma si controlla qui con la chiave pubblica (scaricata una
 * volta ogni 10 minuti) invece di chiedere a Supabase a ogni pagina, come faceva `getUser`. Prima /account aspettava
 * due giri sul server di Supabase, uno nel proxy e uno qui. Un token scaduto si rinnova come prima (getSession). Con
 * chiavi simmetriche getClaims ripiega da solo su getUser. Il database controlla comunque lo stesso token (RLS).
 */
export async function currentUser(): Promise<{ supabase: Db; user: SessionUser | null } | { supabase: null; user: null }> {
  const supabase = await supabaseServer();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined } : null;
  return { supabase, user };
}
