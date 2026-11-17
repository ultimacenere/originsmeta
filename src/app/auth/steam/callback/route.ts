import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuthSignal } from "@/lib/analytics";
import {
  checkAssertion,
  confirmWithSteam,
  decodeSteamState,
  steamReturnTo,
  STEAM_STATE_COOKIE,
  STEAM_STATE_COOKIE_PATH,
  STEAM_STATE_PARAM,
  withQueryParam,
  type SteamState,
} from "@/lib/steam/openid";
import { fetchSteamPersona } from "@/lib/steam/account";
import { steamMigrationMissing, type SteamLinkOutcome } from "@/lib/steam/link";
import { encodeSteamPending, pendingSecretOk, steamPendingCookieOptions, STEAM_PENDING_COOKIE } from "@/lib/steam/pending";
import { steamChoicePath } from "@/lib/steam/firstLogin";
import { emailOf, linkedUser, linkSteamToSession, openSession, type AuthErr } from "@/lib/steam/session";
import { browserLocale, localeFromPath, loginErrorPath, requestOrigin } from "@/lib/steam/routes";

/** Steam, la lettura del nome del profilo e Supabase Auth: qualche secondo in tutto, con margine. */
export const maxDuration = 30;

type Go = (path: string) => NextResponse;

/**
 * Ritorno da Steam (09/11/2026, src/lib/steam/openid.ts). Il cookie del giro vale una volta sola e si cancella subito.
 * Poi: lo stato dell'indirizzo deve essere quello del cookie, l'asserzione deve passare i controlli e Steam deve
 * confermarla. Con lo SteamID confermato:
 * - collegamento (`link`): steam_link_set con la sessione dell'utente e il segreto del server (e, se l'account Steam è
 *   di un account vuoto nato con Steam, steam_link_claim, dal 17/11/2026), poi il profilo con `?steam=<esito>#steam`
 *   (src/lib/steam/link.ts, linkSteamToSession in session.ts);
 * - accesso (`login`): con la chiave segreta (src/lib/supabase/admin.ts) il profilo collegato a quello SteamID, e un link
 *   di accesso generato e verificato qui, che scrive i cookie della sessione come il ritorno /auth/callback (nessuna email
 *   parte); si torna a `next` con il segnale della misura (?om_auth=login&om_method=steam). Se lo SteamID non è collegato
 *   a nessun account, dal 18/11/2026 l'account non si crea più da solo: il cookie firmato del primo accesso (pending.ts)
 *   e la pagina di accesso con la scelta fra "Crea l'account con Steam" e "Ho già un account" (firstLogin.ts).
 * Gli errori tornano alla pagina di accesso con ?error=steam…&via=steam (loginLabels.ts), o al profilo per il collegamento.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const secure = origin.startsWith("https:");
  const store = await cookies();
  const state = decodeSteamState(store.get(STEAM_STATE_COOKIE)?.value);
  store.set(STEAM_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure, path: STEAM_STATE_COOKIE_PATH, maxAge: 0 });
  const go: Go = (path) => NextResponse.redirect(`${origin}${path}`, 303);
  const locale = localeFromPath(state?.n) ?? browserLocale(request);

  // cookie scaduto (più di 10 minuti su Steam), ritorno aperto in un altro browser o non partito da questo sito
  if (!state || url.searchParams.get(STEAM_STATE_PARAM) !== state.s) return go(loginErrorPath(locale, "steamExpired", state?.n ?? `/${locale}/account`));

  const toProfile = (outcome: SteamLinkOutcome) => go(`${withQueryParam(state.n.split("#")[0], "steam", outcome)}#steam`);
  const params = url.searchParams;
  const check = checkAssertion(params, steamReturnTo(origin, state.s));
  if (!check.ok) {
    if (check.reason !== "cancel") console.warn(`[steam] asserzione rifiutata (${check.reason})`);
    if (state.m === "link") return toProfile(check.reason === "cancel" ? "cancelled" : "error");
    return go(loginErrorPath(locale, check.reason === "cancel" ? "steamCancelled" : "steam", state.n));
  }
  if (!(await confirmWithSteam(params))) {
    console.warn("[steam] Steam non ha confermato l'asserzione (o non ha risposto)");
    return state.m === "link" ? toProfile("error") : go(loginErrorPath(locale, "steam", state.n));
  }
  if (state.m === "link") return link(state, check.steamId, toProfile, go, locale);
  return login(state, check.steamId, go, locale, secure);
}

/** Collegamento al profilo della sessione (nessuna chiave segreta: la sessione dell'utente e CRON_SECRET). */
async function link(state: SteamState, steamId: string, toProfile: (o: SteamLinkOutcome) => NextResponse, go: Go, locale: Locale) {
  const { supabase, user } = await currentUser();
  if (!supabase) return go(`/${locale}`);
  if (!user) return go(loginErrorPath(locale, "steamExpired", state.n));
  if (state.u && state.u !== user.id) return toProfile("mismatch");
  return toProfile(await linkSteamToSession(supabase, steamId));
}

/** Accesso con Steam (con la chiave segreta); per uno SteamID senza account, la scelta del primo accesso. */
async function login(state: SteamState, steamId: string, go: Go, locale: Locale, secure: boolean) {
  const admin = supabaseAdmin();
  const supabase = await supabaseServer();
  if (!admin || !supabase) return go(loginErrorPath(locale, "steamUnavailable", state.n));
  const fail = (what: string, e?: AuthErr) => {
    console.error(`[steam] accesso, ${what}:`, e?.code ?? "", e?.message ?? "");
    return go(loginErrorPath(locale, steamMigrationMissing(e) ? "steamUnavailable" : "steam", state.n));
  };

  const found = await linkedUser(admin, steamId);
  if (found.error) return fail("lettura del collegamento", found.error);
  if (found.userId) {
    const email = await emailOf(admin, found.userId);
    if (!email) return go(loginErrorPath(locale, "steamNoEmail", state.n));
    const opened = await openSession(admin, supabase, email);
    if (!opened.ok) return fail(opened.what, opened.error);
    return go(withAuthSignal(state.n, "login", "steam"));
  }

  // Nessun account collegato (18/11/2026): prima si sceglie fra un account nuovo e l'account di sempre (firstLogin.ts).
  // Il nome del profilo Steam, se Steam risponde, va nel cookie per proporlo come nome sul sito.
  const secret = process.env.CRON_SECRET;
  if (!pendingSecretOk(secret)) {
    console.error("[steam] CRON_SECRET assente: il primo accesso con Steam non può continuare");
    return go(loginErrorPath(locale, "steamUnavailable", state.n));
  }
  const persona = await fetchSteamPersona(steamId);
  const store = await cookies();
  store.set(STEAM_PENDING_COOKIE, encodeSteamPending({ id: steamId, name: persona, t: Date.now() }, secret), steamPendingCookieOptions(secure));
  return go(steamChoicePath(locale, state.n));
}
