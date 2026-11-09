import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Db } from "@/lib/supabase/public";
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
import { fetchSteamPersona, steamAccountEmail, steamSignupNames } from "@/lib/steam/account";
import { linkOutcome, steamMigrationMissing, type SteamLinkOutcome } from "@/lib/steam/link";
import { browserLocale, localeFromPath, loginErrorPath, requestOrigin } from "@/lib/steam/routes";

/** Steam, la lettura del nome del profilo e Supabase Auth: qualche secondo in tutto, con margine. */
export const maxDuration = 30;

type Go = (path: string) => NextResponse;
type AuthErr = { code?: string; message?: string; status?: number } | null | undefined;

/**
 * Ritorno da Steam (09/11/2026, src/lib/steam/openid.ts). Il cookie del giro vale una volta sola e si cancella subito.
 * Poi: lo stato dell'indirizzo deve essere quello del cookie, l'asserzione deve passare i controlli e Steam deve
 * confermarla. Con lo SteamID confermato:
 * - collegamento (`link`): steam_link_set con la sessione dell'utente e il segreto del server, poi il profilo con
 *   `?steam=<esito>#steam` (src/lib/steam/link.ts);
 * - accesso (`login`): con la chiave segreta (src/lib/supabase/admin.ts) il profilo collegato a quello SteamID, oppure
 *   un account nuovo (indirizzo tecnico, nomi dal profilo Steam, collegamento scritto subito); poi un link di accesso
 *   generato e verificato qui, che scrive i cookie della sessione come il ritorno /auth/callback. Nessuna email parte.
 *   Si torna a `next` con il segnale della misura (?om_auth=sign_up|login&om_method=steam).
 * Gli errori tornano alla pagina di accesso con ?error=steam…&via=steam (loginLabels.ts), o al profilo per il collegamento.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const store = await cookies();
  const state = decodeSteamState(store.get(STEAM_STATE_COOKIE)?.value);
  store.set(STEAM_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: STEAM_STATE_COOKIE_PATH, maxAge: 0 });
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
  return state.m === "link" ? link(state, check.steamId, toProfile, go, locale) : login(state, check.steamId, go, locale);
}

/** Collegamento al profilo della sessione (nessuna chiave segreta: la sessione dell'utente e CRON_SECRET). */
async function link(state: SteamState, steamId: string, toProfile: (o: SteamLinkOutcome) => NextResponse, go: Go, locale: Locale) {
  const { supabase, user } = await currentUser();
  if (!supabase) return go(`/${locale}`);
  if (!user) return go(loginErrorPath(locale, "steamExpired", state.n));
  if (state.u && state.u !== user.id) return toProfile("mismatch");
  const key = (process.env.CRON_SECRET ?? "").trim();
  if (key.length < 32) {
    console.error("[steam] CRON_SECRET assente: il collegamento non si può scrivere");
    return toProfile("error");
  }
  const { data, error } = await supabase.rpc("steam_link_set", { p_key: key, p_steam_id: steamId });
  if (error) {
    console.error("[steam] steam_link_set:", error.code, error.message);
    return toProfile(steamMigrationMissing(error) ? "missing" : "error");
  }
  return toProfile(linkOutcome(data));
}

/** L'email dell'account (serve al link di accesso), o null. */
async function emailOf(admin: Db, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) console.error("[steam] getUserById:", error.code ?? "", error.message);
  return data?.user?.email ?? null;
}

/** L'account collegato a uno SteamID, o null; `error` se la lettura non riesce. */
async function linkedUser(admin: Db, steamId: string): Promise<{ userId: string | null; error: AuthErr }> {
  const { data, error } = await admin.from("steam_links").select("user_id").eq("steam_id", steamId).maybeSingle();
  return { userId: (data as { user_id?: string } | null)?.user_id ?? null, error };
}

/** Accesso o iscrizione con Steam (con la chiave segreta). */
async function login(state: SteamState, steamId: string, go: Go, locale: Locale) {
  const admin = supabaseAdmin();
  const supabase = await supabaseServer();
  if (!admin || !supabase) return go(loginErrorPath(locale, "steamUnavailable", state.n));
  const fail = (what: string, e?: AuthErr) => {
    console.error(`[steam] accesso, ${what}:`, e?.code ?? "", e?.message ?? "");
    return go(loginErrorPath(locale, steamMigrationMissing(e) ? "steamUnavailable" : "steam", state.n));
  };

  let email: string | null = null;
  let created = false;
  const found = await linkedUser(admin, steamId);
  if (found.error) return fail("lettura del collegamento", found.error);
  if (found.userId) {
    email = await emailOf(admin, found.userId);
    if (!email) return go(loginErrorPath(locale, "steamNoEmail", state.n));
  } else {
    // account nuovo: nomi dal profilo Steam (se vanno bene), indirizzo tecnico, collegamento subito
    const persona = await fetchSteamPersona(steamId);
    const address = steamAccountEmail(steamId);
    const made = await admin.auth.admin.createUser({ email: address, email_confirm: true, user_metadata: steamSignupNames(persona) });
    if (made.error || !made.data.user) return fail("creazione dell'account", made.error);
    const newId = made.data.user.id;
    const ins = await admin.from("steam_links").insert({ user_id: newId, steam_id: steamId });
    if (!ins.error) {
      email = address;
      created = true;
    } else {
      // lo stesso account Steam entrato due volte nello stesso istante: resta l'account dell'altro giro, questo si toglie
      const removed = await admin.auth.admin.deleteUser(newId);
      if (removed.error) console.error("[steam] account doppio non cancellato:", newId, removed.error.message);
      if (ins.error.code !== "23505") return fail("collegamento dell'account nuovo", ins.error);
      const again = await linkedUser(admin, steamId);
      email = again.userId ? await emailOf(admin, again.userId) : null;
      if (!email) return fail("account dell'altro giro", again.error);
    }
  }

  const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) return fail("link di accesso", generated.error);
  // il tipo da verificare lo dice Supabase (magiclink per un account confermato); "email" copre anche gli altri casi
  const type = (generated.data.properties.verification_type || "email") as EmailOtpType;
  const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (verified.error || !verified.data.user) return fail("apertura della sessione", verified.error);
  return go(withAuthSignal(state.n, created ? "sign_up" : "login", "steam"));
}
