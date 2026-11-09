import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/supabase/server";
import { steamLoginOn } from "@/lib/supabase/admin";
import {
  encodeSteamState,
  newStateToken,
  safeNextPath,
  steamLoginUrl,
  STEAM_STATE_COOKIE,
  STEAM_STATE_COOKIE_PATH,
  STEAM_STATE_MAX_AGE_S,
  type SteamMode,
} from "@/lib/steam/openid";
import { browserLocale, localeFromPath, loginErrorPath, requestOrigin } from "@/lib/steam/routes";

/**
 * Partenza verso Steam (09/11/2026, src/lib/steam/openid.ts):
 * - `?mode=login` ("Continua con Steam" del pannello di accesso): entrare o iscriversi con Steam. Serve la chiave segreta
 *   sul server (src/lib/supabase/admin.ts): senza, si torna all'accesso con l'errore "non disponibile".
 * - `?mode=link` (/account#steam, "Il mio profilo"): collegare Steam al profilo con cui si è già entrati; senza accesso
 *   si va prima all'accesso, che poi riporta al profilo.
 * `next` = la pagina a cui tornare (solo percorsi interni). Il cookie tecnico tiene stato, modo, pagina e utente per 10
 * minuti, solo per le rotte /auth/steam; lo stato va anche nell'indirizzo di ritorno, che Steam firma.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const mode: SteamMode = url.searchParams.get("mode") === "link" ? "link" : "login";
  const rawNext = url.searchParams.get("next");
  const locale = localeFromPath(rawNext) ?? browserLocale(request);
  const next = safeNextPath(rawNext, `/${locale}/account`);

  let userId: string | undefined;
  if (mode === "login") {
    if (!steamLoginOn()) return NextResponse.redirect(`${origin}${loginErrorPath(locale, "steamUnavailable", next)}`, 303);
  } else {
    const { supabase, user } = await currentUser();
    if (!supabase) return NextResponse.redirect(`${origin}/${locale}`, 303);
    if (!user) return NextResponse.redirect(`${origin}/${locale}/login?next=${encodeURIComponent(`/${locale}/account#steam`)}`, 303);
    userId = user.id;
  }

  const state = newStateToken();
  const store = await cookies();
  store.set(STEAM_STATE_COOKIE, encodeSteamState({ s: state, m: mode, n: next, ...(userId ? { u: userId } : {}), t: Date.now() }), {
    httpOnly: true,
    // il ritorno da Steam è una navigazione da un altro sito: con "lax" il cookie arriva (GET in primo piano)
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: STEAM_STATE_COOKIE_PATH,
    maxAge: STEAM_STATE_MAX_AGE_S,
  });
  return NextResponse.redirect(steamLoginUrl(origin, state), 303);
}
