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
  // getClaims e non getUser (17/10/2026): rinnova il token scaduto come prima, ma la firma la controlla qui con la chiave
  // pubblica ES256 invece di chiedere a Supabase a ogni pagina (vedi `currentUser` in src/lib/supabase/server.ts)
  const { data } = await supabase.auth.getClaims();
  // Pagine private senza accesso: al login con un 307 da qui (17/10/2026). Dentro le pagine il `redirect()` non basta più:
  // il loading.tsx di /account fa partire la risposta prima, e il rimando diventerebbe un 200 con un refresh nella pagina.
  const account = /^\/(en|it|es|fr)\/account(?:\/|$)/.exec(pathname);
  if (account && !data?.claims?.sub) {
    const login = new URL(`/${account[1]}/login`, request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login, 307);
  }
  return response;
}

// Il matcher deve restare scritto per esteso (Next lo legge alla build, non può venire da `locales`): con una lingua
// nuova va aggiunta a mano su ogni riga, come lo spagnolo il 25/09/2026 (ES-06).
export const config = {
  matcher: [
    // Mercato in prova riservata (18/10/2026, MARKET_PUBLIC spento): le pagine leggono la sessione per sapere se chi guarda
    // è admin; quando il Mercato si apre a tutti queste due righe si possono togliere
    "/:locale(en|it|es|fr)/market",
    "/:locale(en|it|es|fr)/market/:path*",
    "/:locale(en|it|es|fr)/account",
    // "Modifica la mia pagina pubblica" (01/10/2026): profilo pubblico, foto e vetrina, pagina renderizzata sul server
    "/:locale(en|it|es|fr)/account/profile",
    // casella messaggi (26/09/2026, pacchetto INBOX): elenco e conversazione dell'utente, area staff, pagine renderizzate sul server
    "/:locale(en|it|es|fr)/account/messages",
    "/:locale(en|it|es|fr)/account/messages/:id",
    "/:locale(en|it|es|fr)/account/staff/messages",
    "/:locale(en|it|es|fr)/account/staff/messages/:id",
    // tracker/overlay (30/09/2026): collegamento dell'app, PC e partite, pagina renderizzata sul server
    "/:locale(en|it|es|fr)/account/tracker",
    // OriginsMeta Tracker in prova (10–11/10/2026) aveva qui la pagina dell'app e quella dei win rate, che leggevano la
    // sessione per decidere chi le vedeva; aperte a tutti il 12/10/2026 (ANALYTICS_PUBLIC acceso), sono di nuovo statiche e
    // ISR. Per richiudere: ANALYTICS_PUBLIC = false e due righe per le pagine di oggi, "/:locale(en|it|es|fr)/analytics"
    // (le statistiche) e "/:locale(en|it|es|fr)/tracker" (l'app).
    "/:locale(en|it|es|fr)/decks/community/:slug/edit",
    // mazzi torneo (04/10/2026): modifica, pagina renderizzata sul server
    "/:locale(en|it|es|fr)/decks/tournament/:slug/edit",
    // guide della community (pacchetto GUIDE, 27/09/2026): scrittura e modifica, pagine renderizzate sul server
    "/:locale(en|it|es|fr)/guides/new",
    "/:locale(en|it|es|fr)/guides/community/:slug/edit",
    // fumetti dei creator (pacchetto FUMETTI, 29/09/2026): pubblicazione e modifica, pagine renderizzate sul server
    "/:locale(en|it|es|fr)/news/comics/new",
    "/:locale(en|it|es|fr)/news/comics/:slug/edit",
    // Tournament Organizer: pagine renderizzate sul server (la scheda è dinamica dal 16/09: i tornei privati dipendono dalla sessione)
    "/:locale(en|it|es|fr)/tournaments/new",
    "/:locale(en|it|es|fr)/tournaments/:slug",
    "/:locale(en|it|es|fr)/tournaments/:slug/manage",
    "/:locale(en|it|es|fr)/tournaments/:slug/deck",
    "/:locale(en|it|es|fr)/tournaments/:slug/match/:id",
    // draft online (02/10/2026): stanza fra due giocatori, pagina renderizzata sul server, mosse con la sessione
    "/:locale(en|it|es|fr)/draft/r/:code",
    // Link breve dei creator: /@<nome> (una cartella di src/app non può chiamarsi "@…", sono le rotte parallele)
    "/@:name",
    // URL di spam sulla radice: solo con entrambi i parametri (la home e le pagine statiche non passano di qui)
    { source: "/", has: [{ type: "query", key: "r" }, { type: "query", key: "channel" }] },
  ],
};
