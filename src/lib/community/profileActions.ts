"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { isCreatorBadge, parseProfileForm, sameShowcase, SAVE_MIN_INTERVAL_MS, type ProfileFormErrors, type ProfileFormValue } from "./profileLinks";

/**
 * Salvataggio del profilo pubblico dal modulo di /account (pacchetto CREATOR, 26/09/2026): bio, canali e lingue dei
 * contenuti, per ogni iscritto. Il server non si fida del modulo: rilegge e riscrive tutto con `parseProfileForm`
 * (forme canoniche, https, host ammessi, niente accorciatori né redirector, al massimo 8 canali, bio in testo
 * semplice) e salva con la sessione dell'utente. Il database ripete le stesse regole (vincoli di
 * supabase/schema.sql, blocco CREATOR) e lascia cambiare solo queste tre colonne della propria riga (grant per colonna +
 * policy "users edit own profile").
 *
 * Ogni salvataggio rigenera fino a nove pagine e la sitemap: un salvataggio identico a quello che c'è non scrive e non
 * rigenera nulla, e due salvataggi a meno di `SAVE_MIN_INTERVAL_MS` l'uno dall'altro non passano (uno script non può
 * tenere in rigenerazione le pagine).
 */

export type ProfileActionState = {
  ok?: boolean;
  error?: "notLoggedIn" | "disabled" | "db" | "invalid" | "tooFast";
  /** errori del modulo, campo per campo (riga dei canali per indice) */
  fields?: ProfileFormErrors;
  /** i valori salvati, nella forma canonica: il modulo li mostra al posto di quelli scritti */
  value?: ProfileFormValue;
};

/** Pagine che mostrano il profilo: la sua pagina /u e, per chi ha un tag autore, la directory e l'elenco dei mazzi. */
function revalidateProfile(username: string | null, creator: boolean) {
  for (const l of locales) {
    revalidatePath(`/${l}/account`);
    if (username) revalidatePath(`/${l}/u/${username}`);
    if (creator) {
      revalidatePath(`/${l}/creators`);
      revalidatePath(`/${l}/decks`);
    }
  }
  // il lastmod di /u/<nome> e di /creators segue la modifica (showcase_updated_at)
  revalidateSitemaps();
}

type CurrentRow = {
  username: string | null;
  badge: string | null;
  bio: string | null;
  links: unknown;
  content_langs: unknown;
  showcase_updated_at: string | null;
};

export async function saveProfile(_prev: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const parsed = parseProfileForm({
    bio: String(formData.get("bio") ?? ""),
    langs: formData.getAll("lang").map(String),
    kinds: formData.getAll("link_kind").map(String),
    urls: formData.getAll("link_url").map(String),
  });
  if (!parsed.ok) return { error: "invalid", fields: parsed.errors };
  const current = await supabase.from("profiles").select("username, badge, bio, links, content_langs, showcase_updated_at").eq("id", user.id).maybeSingle();
  if (current.error || !current.data) {
    console.error("[community] saveProfile (lettura):", current.error?.message ?? "profilo assente");
    return { error: "db" };
  }
  const row = current.data as CurrentRow;
  // niente da cambiare: nessuna scrittura, nessuna pagina da rigenerare
  if (sameShowcase(row, parsed.value)) return { ok: true, value: parsed.value };
  const last = row.showcase_updated_at ? Date.parse(row.showcase_updated_at) : NaN;
  if (Number.isFinite(last) && Date.now() - last < SAVE_MIN_INTERVAL_MS) return { error: "tooFast" };
  const { bio, links, content_langs } = parsed.value;
  const { error } = await supabase.from("profiles").update({ bio, links, content_langs }).eq("id", user.id);
  if (error) {
    console.error("[community] saveProfile:", error.message);
    return { error: "db" };
  }
  revalidateProfile(row.username, isCreatorBadge(row.badge));
  return { ok: true, value: parsed.value };
}
