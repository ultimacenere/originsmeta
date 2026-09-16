import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Rinfresca la sessione Supabase (cookie) sulle sole pagine renderizzate sul server che leggono
 * l'utente: i Server Component non possono scrivere cookie, quindi il refresh del token avviene qui.
 * Le altre pagine restano statiche e il client nel browser si aggiorna da solo.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseEnabled) return response;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/:locale(en|it)/account",
    "/:locale(en|it)/decks/community/:slug/edit",
    // Tournament Organizer: pagine renderizzate sul server (la scheda è dinamica dal 16/09: i tornei privati dipendono dalla sessione)
    "/:locale(en|it)/tournaments/new",
    "/:locale(en|it)/tournaments/:slug",
    "/:locale(en|it)/tournaments/:slug/manage",
    "/:locale(en|it)/tournaments/:slug/deck",
    "/:locale(en|it)/tournaments/:slug/match/:id",
  ],
};
