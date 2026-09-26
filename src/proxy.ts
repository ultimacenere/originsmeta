import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { SHORT_LINK_LOCALES, profileShortLinkTarget } from "@/lib/community/shortLink";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Rinfresca la sessione Supabase (cookie) sulle sole pagine renderizzate sul server che leggono
 * l'utente: i Server Component non possono scrivere cookie, quindi il refresh del token avviene qui.
 * Le altre pagine restano statiche e il client nel browser si aggiorna da solo.
 *
 * In più chiude gli URL di spam di aprile 2026 sulla radice (/?r=…&channel=…, TECH-10) con un 410: il matcher fa
 * entrare qui la radice solo quando ha tutti e due i parametri, quindi nessun'altra richiesta passa dal proxy.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // Link breve dei creator (26/09/2026): /@coachcrono → /<lingua del browser>/u/coachcrono con gli UTM (shortLink.ts)
  if (pathname.startsWith("/@")) {
    const locale = preferredLocale(request.headers.get("accept-language"), SHORT_LINK_LOCALES, "en", LANGUAGE_ALIASES);
    return NextResponse.redirect(new URL(profileShortLinkTarget(pathname.slice(2), locale, searchParams), request.url), 302);
  }
  if (pathname === "/" && searchParams.has("r") && searchParams.has("channel")) {
    return new NextResponse("410 Gone", { status: 410, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" } });
  }
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

// Il matcher deve restare scritto per esteso (Next lo legge alla build, non può venire da `locales`): con una lingua
// nuova va aggiunta a mano su ogni riga, come lo spagnolo il 25/09/2026 (ES-06).
export const config = {
  matcher: [
    "/:locale(en|it|es)/account",
    // casella messaggi (26/09/2026, pacchetto INBOX): elenco e conversazione dell'utente, area staff, pagine renderizzate sul server
    "/:locale(en|it|es)/account/messages",
    "/:locale(en|it|es)/account/messages/:id",
    "/:locale(en|it|es)/account/staff/messages",
    "/:locale(en|it|es)/account/staff/messages/:id",
    "/:locale(en|it|es)/decks/community/:slug/edit",
    // Tournament Organizer: pagine renderizzate sul server (la scheda è dinamica dal 16/09: i tornei privati dipendono dalla sessione)
    "/:locale(en|it|es)/tournaments/new",
    "/:locale(en|it|es)/tournaments/:slug",
    "/:locale(en|it|es)/tournaments/:slug/manage",
    "/:locale(en|it|es)/tournaments/:slug/deck",
    "/:locale(en|it|es)/tournaments/:slug/match/:id",
    // Link breve dei creator: /@<nome> (una cartella di src/app non può chiamarsi "@…", sono le rotte parallele)
    "/@:name",
    // URL di spam sulla radice: solo con entrambi i parametri (la home e le pagine statiche non passano di qui)
    { source: "/", has: [{ type: "query", key: "r" }, { type: "query", key: "channel" }] },
  ],
};
