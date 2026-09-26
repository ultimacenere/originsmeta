"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { isCreatorBadge, parseProfileForm, type ProfileFormErrors, type ProfileFormValue } from "./profileLinks";

/**
 * Salvataggio del profilo pubblico dal modulo di /account (pacchetto CREATOR, 26/09/2026): bio, canali e lingue dei
 * contenuti, per ogni iscritto. Il server non si fida del modulo: rilegge e riscrive tutto con `parseProfileForm`
 * (forme canoniche, https, host ammessi, niente accorciatori, al massimo 8 canali, bio in testo semplice) e salva con
 * la sessione dell'utente. Il database ripete le stesse regole (vincoli di supabase/creator-CREATOR.sql) e lascia
 * cambiare solo queste tre colonne della propria riga (grant per colonna + policy "users edit own profile").
 */

export type ProfileActionState = {
  ok?: boolean;
  error?: "notLoggedIn" | "disabled" | "db" | "invalid";
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
  const { bio, links, content_langs } = parsed.value;
  const { error } = await supabase.from("profiles").update({ bio, links, content_langs }).eq("id", user.id);
  if (error) {
    console.error("[community] saveProfile:", error.message);
    return { error: "db" };
  }
  const { data } = await supabase.from("profiles").select("username, badge").eq("id", user.id).maybeSingle();
  const row = data as { username: string | null; badge: string | null } | null;
  revalidateProfile(row?.username ?? null, isCreatorBadge(row?.badge));
  return { ok: true, value: parsed.value };
}
