"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import {
  checkDisplayName,
  checkUsername,
  cleanDisplayName,
  cleanUsername,
  namesMigrationMissing,
  parseSetNamesResult,
  type DisplayNameStatus,
  type UsernameStatus,
} from "./profileNames";
import { usernamePinned } from "./pinnedUsernames";
import { isShowcaseBadge } from "./badges";

/**
 * Salvataggio di nome mostrato e nome utente dalla sezione #name di /account/profile (23/10/2026). Il server ripete i
 * controlli del modulo (profileNames.ts) per rispondere subito, poi chiama `profile_set_names` con la sessione
 * dell'utente: è il database a decidere (forma, nomi riservati, nomi presi, 30 giorni) e a scrivere, tutto o niente.
 * Un nome utente scritto nel codice del sito (`usernamePinned`) non si cambia da qui.
 * Dopo un cambio rigenera le pagine che mostrano il nome; quella del vecchio indirizzo diventa un 308 verso la nuova.
 */

export type NameActionState = {
  ok?: boolean;
  /** è cambiato il nome utente: il modulo mostra il nuovo indirizzo */
  usernameChanged?: boolean;
  error?: "notLoggedIn" | "disabled" | "db" | "missing" | "locked";
  /** esito di ogni campo quando non va */
  display?: Exclude<DisplayNameStatus, "same" | "ok">;
  username?: Exclude<UsernameStatus, "same" | "ok">;
  /** da quando si potrà cambiare di nuovo il nome utente (ISO), se c'è un'attesa */
  nextChange?: string | null;
  /** i valori salvati, come li ha scritti il database */
  value?: { displayName: string; username: string };
};

type Row = { username: string | null; display_name: string | null; badge: string | null; role: string | null };

function revalidateNames(usernames: (string | null)[], showcase: boolean) {
  for (const l of locales) {
    revalidatePath(`/${l}/account`);
    revalidatePath(`/${l}/account/profile`);
    for (const u of usernames) if (u) revalidatePath(`/${l}/u/${u}`);
    revalidatePath(`/${l}/decks`);
    revalidatePath(`/${l}/guides`);
    if (showcase) {
      revalidatePath(`/${l}/creators`);
      revalidatePath(`/${l}/live`);
    }
  }
  // /u/<nome> nella sitemap: il nome nuovo al posto di quello vecchio
  revalidateSitemaps();
}

const fieldError = <T extends string>(s: T): Exclude<T, "same" | "ok"> | undefined => (s === "same" || s === "ok" ? undefined : (s as Exclude<T, "same" | "ok">));

export async function saveNames(_prev: NameActionState, formData: FormData): Promise<NameActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };

  const current = await supabase.from("profiles").select("username, display_name, badge, role").eq("id", user.id).maybeSingle();
  if (current.error || !current.data) {
    console.error("[community] saveNames (lettura):", current.error?.message ?? "profilo assente");
    return { error: "db" };
  }
  const row = current.data as Row;
  const staff = row.role === "admin" || row.badge === "staff";
  const displayName = cleanDisplayName(formData.get("display_name"));
  const username = cleanUsername(formData.get("username"));
  const wantDisplay = displayName !== (row.display_name ?? "") ? displayName : null;
  const wantUsername = username !== (row.username ?? "") ? username : null;
  const saved = { displayName: row.display_name ?? "", username: row.username ?? "" };
  if (wantDisplay === null && wantUsername === null) return { ok: true, value: saved };

  if (wantUsername !== null && usernamePinned(row.username)) return { error: "locked" };
  const d = wantDisplay === null ? "ok" : checkDisplayName(wantDisplay, staff);
  const u = wantUsername === null ? "ok" : checkUsername(wantUsername, staff);
  if (d !== "ok" || u !== "ok") return { display: fieldError(d), username: fieldError(u) };

  const res = await supabase.rpc("profile_set_names", { p_display: wantDisplay, p_username: wantUsername });
  if (res.error) {
    if (namesMigrationMissing(res.error)) return { error: "missing" };
    console.error("[community] saveNames:", res.error.message);
    return { error: "db" };
  }
  const out = parseSetNamesResult(res.data);
  if (!out.ok) {
    if ("display" in out) return { display: fieldError(out.display), username: fieldError(out.username), nextChange: out.nextChange };
    if (out.error === "not_logged_in") return { error: "notLoggedIn" };
    console.error("[community] saveNames: risposta", out.error);
    return { error: "db" };
  }
  const value = {
    displayName: out.display === "ok" && wantDisplay !== null ? wantDisplay : saved.displayName,
    username: out.username === "ok" && wantUsername !== null ? wantUsername : saved.username,
  };
  if (out.changed) revalidateNames([row.username, out.username === "ok" ? value.username : null], isShowcaseBadge(row.badge));
  return { ok: true, usernameChanged: out.username === "ok", nextChange: out.nextChange, value };
}
