import "server-only";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { steamAccountEmail } from "./account";
import { linkOutcome, steamMigrationMissing, type SteamLinkOutcome } from "./link";
import { decodeSteamPending, steamPendingCookieOptions, STEAM_PENDING_COOKIE, type SteamPending } from "./pending";
import { steamLinkedPath } from "./firstLogin";

/**
 * Pezzi del server comuni alle rotte di Steam (/auth/steam/callback, /auth/steam/create, /auth/steam/pending) e al ritorno
 * /auth/callback: account collegati, account nuovi nati con Steam, apertura della sessione, collegamento dello SteamID
 * all'iscritto della sessione. Tolti dalla rotta di ritorno il 18/11/2026, quando la creazione dell'account è passata a
 * /auth/steam/create (prima si sceglie: firstLogin.ts).
 */

export type AuthErr = { code?: string; message?: string; status?: number } | null | undefined;

/** L'email dell'account (serve al link di accesso), o null. */
export async function emailOf(admin: Db, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) console.error("[steam] getUserById:", error.code ?? "", error.message);
  return data?.user?.email ?? null;
}

/** L'account collegato a uno SteamID, o null; `error` se la lettura non riesce. */
export async function linkedUser(admin: Db, steamId: string): Promise<{ userId: string | null; error: AuthErr }> {
  const { data, error } = await admin.from("steam_links").select("user_id").eq("steam_id", steamId).maybeSingle();
  return { userId: (data as { user_id?: string } | null)?.user_id ?? null, error };
}

/**
 * Account nuovo nato con Steam: indirizzo tecnico, nomi (`names`, metadati da cui handle_new_user prende nome mostrato e
 * nome utente), collegamento subito. Se lo stesso account Steam è entrato due volte nello stesso istante, resta l'account
 * dell'altro giro e questo si toglie.
 */
export async function createSteamAccount(
  admin: Db,
  steamId: string,
  names: { full_name?: string; user_name: string },
): Promise<{ email: string; created: boolean } | { what: string; error: AuthErr }> {
  const address = steamAccountEmail(steamId);
  const made = await admin.auth.admin.createUser({ email: address, email_confirm: true, user_metadata: names });
  if (made.error || !made.data.user) return { what: "creazione dell'account", error: made.error };
  const newId = made.data.user.id;
  const ins = await admin.from("steam_links").insert({ user_id: newId, steam_id: steamId });
  if (!ins.error) return { email: address, created: true };
  const removed = await admin.auth.admin.deleteUser(newId);
  if (removed.error) console.error("[steam] account doppio non cancellato:", newId, removed.error.message);
  if (ins.error.code !== "23505") return { what: "collegamento dell'account nuovo", error: ins.error };
  const again = await linkedUser(admin, steamId);
  const email = again.userId ? await emailOf(admin, again.userId) : null;
  return email ? { email, created: false } : { what: "account dell'altro giro", error: again.error };
}

/** Apre la sessione dell'account `email` (link generato e verificato qui, nessuna email parte): cookie come /auth/callback. */
export async function openSession(admin: Db, supabase: Db, email: string): Promise<{ ok: true } | { ok: false; what: string; error: AuthErr }> {
  const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) return { ok: false, what: "link di accesso", error: generated.error };
  // il tipo da verificare lo dice Supabase (magiclink per un account confermato); "email" copre anche gli altri casi
  const type = (generated.data.properties.verification_type || "email") as EmailOtpType;
  const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (verified.error || !verified.data.user) return { ok: false, what: "apertura della sessione", error: verified.error };
  return { ok: true };
}

/**
 * Collega uno SteamID già confermato da Steam all'iscritto della sessione `supabase` (la sessione dell'utente e
 * CRON_SECRET, nessuna chiave segreta): steam_link_set e, se l'account Steam è di un altro profilo, steam_link_claim, che
 * lo sposta qui quando quel profilo è un account vuoto nato con Steam (17/11/2026). Senza il blocco "17/11/2026: STEAM,
 * ACCOUNT DOPPI" resta 'taken'.
 */
export async function linkSteamToSession(supabase: Db, steamId: string): Promise<SteamLinkOutcome> {
  const key = (process.env.CRON_SECRET ?? "").trim();
  if (key.length < 32) {
    console.error("[steam] CRON_SECRET assente: il collegamento non si può scrivere");
    return "error";
  }
  const { data, error } = await supabase.rpc("steam_link_set", { p_key: key, p_steam_id: steamId });
  if (error) {
    console.error("[steam] steam_link_set:", error.code, error.message);
    return steamMigrationMissing(error) ? "missing" : "error";
  }
  const outcome = linkOutcome(data);
  if (outcome !== "taken") return outcome;
  const claim = await supabase.rpc("steam_link_claim", { p_key: key, p_steam_id: steamId });
  if (claim.error) {
    if (!steamMigrationMissing(claim.error)) console.error("[steam] steam_link_claim:", claim.error.code, claim.error.message);
    return "taken";
  }
  const claimed = linkOutcome(claim.data);
  if (claimed === "merged") console.info("[steam] collegamento spostato da un account vuoto nato con Steam, che è stato cancellato");
  return claimed;
}

/** Lo Steam in sospeso del cookie del primo accesso, se il cookie è valido (firmato, meno di 10 minuti). */
export async function readSteamPending(): Promise<SteamPending | null> {
  const store = await cookies();
  return decodeSteamPending(store.get(STEAM_PENDING_COOKIE)?.value, process.env.CRON_SECRET);
}

/** Toglie il cookie del primo accesso (dopo la creazione dell'account o il collegamento). */
export async function clearSteamPending(secure: boolean): Promise<void> {
  const store = await cookies();
  store.set(STEAM_PENDING_COOKIE, "", steamPendingCookieOptions(secure, true));
}

/**
 * Dopo l'accesso con Discord o l'email scelto da "Ho già un account": collega lo Steam in sospeso all'iscritto della
 * sessione e restituisce la pagina del profilo con l'esito (o null, se il cookie non c'è più o non è valido).
 */
export async function applySteamPending(supabase: Db, locale: Locale, secure: boolean): Promise<{ outcome: SteamLinkOutcome; path: string } | null> {
  const pending = await readSteamPending();
  if (!pending) return null;
  const outcome = await linkSteamToSession(supabase, pending.id);
  await clearSteamPending(secure);
  return { outcome, path: steamLinkedPath(locale, outcome) };
}
