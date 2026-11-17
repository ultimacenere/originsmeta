import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withAuthSignal } from "@/lib/analytics";
import { checkDisplayName, cleanDisplayName } from "@/lib/community/profileNames";
import { safeNextPath } from "@/lib/steam/openid";
import { steamSignupNames } from "@/lib/steam/account";
import { steamMigrationMissing } from "@/lib/steam/link";
import { steamChoicePath } from "@/lib/steam/firstLogin";
import { clearSteamPending, createSteamAccount, emailOf, linkedUser, openSession, readSteamPending, type AuthErr } from "@/lib/steam/session";
import { browserLocale, localeFromPath, loginErrorPath, requestOrigin } from "@/lib/steam/routes";

/** Supabase Auth: qualche secondo in tutto, con margine. */
export const maxDuration = 30;

/**
 * "Crea l'account con Steam" (18/11/2026, firstLogin.ts): il modulo della pagina di accesso manda qui il nome scelto e la
 * pagina a cui tornare. Lo SteamID non arriva dal modulo ma dal cookie firmato del primo accesso (pending.ts), scritto dal
 * ritorno da Steam dopo la conferma di Steam: il browser non può sceglierlo. Il nome segue le regole dei nomi del sito
 * (profileNames.ts); se non va bene si torna alla scelta con l'errore. Poi, come faceva il ritorno da Steam prima del
 * 18/11: account nuovo con l'indirizzo tecnico, collegamento, sessione aperta qui, ritorno a `next` con ?om_auth=sign_up.
 * Se nel frattempo lo stesso Steam è stato collegato a un account (un'altra scheda), si entra in quello.
 * Solo POST, dalla stessa origine: un modulo di un altro sito non porta il cookie (SameSite=Lax) e qui si rifiuta comunque.
 */
export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const secure = origin.startsWith("https:");
  const form = await request.formData().catch(() => null);
  const rawNext = form?.get("next");
  const nextIn = typeof rawNext === "string" ? rawNext : null;
  const locale = localeFromPath(nextIn) ?? browserLocale(request);
  const next = safeNextPath(nextIn, `/${locale}/account`);
  const go = (path: string) => NextResponse.redirect(`${origin}${path}`, 303);

  const from = request.headers.get("origin");
  if (from && from !== origin) return go(loginErrorPath(locale, "steam", next));

  const pending = await readSteamPending();
  if (!pending) return go(loginErrorPath(locale, "steamExpired", next));
  const admin = supabaseAdmin();
  const supabase = await supabaseServer();
  if (!admin || !supabase) return go(loginErrorPath(locale, "steamUnavailable", next));
  const fail = (what: string, e?: AuthErr) => {
    console.error(`[steam] account nuovo, ${what}:`, e?.code ?? "", e?.message ?? "");
    return go(loginErrorPath(locale, steamMigrationMissing(e) ? "steamUnavailable" : "steam", next));
  };

  const name = cleanDisplayName(form?.get("name"));
  const nameCheck = checkDisplayName(name);
  if (nameCheck !== "ok") return go(steamChoicePath(locale, next, nameCheck === "reserved" ? "reserved" : "invalid"));

  let email: string | null;
  let created = false;
  const found = await linkedUser(admin, pending.id);
  if (found.error) return fail("lettura del collegamento", found.error);
  if (found.userId) {
    email = await emailOf(admin, found.userId);
    if (!email) return go(loginErrorPath(locale, "steamNoEmail", next));
  } else {
    const made = await createSteamAccount(admin, pending.id, steamSignupNames(name));
    if ("what" in made) return fail(made.what, made.error);
    email = made.email;
    created = made.created;
  }
  const opened = await openSession(admin, supabase, email);
  if (!opened.ok) return fail(opened.what, opened.error);
  await clearSteamPending(secure);
  return go(withAuthSignal(next, created ? "sign_up" : "login", "steam"));
}
