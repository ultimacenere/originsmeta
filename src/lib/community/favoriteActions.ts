"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n";
import { isUuid } from "./util";
import { popularityMissing } from "./favorites";

/** Esito di "Salva": stato finale e numero di salvataggi del mazzo (se si legge), oppure un codice d'errore. */
export type FavoriteResult = { saved?: boolean; count?: number; error?: "notLoggedIn" | "disabled" | "invalid" | "limit" | "unavailable" | "db" };

/**
 * Salva o toglie un mazzo dai propri salvati (blocco PREFERITI E TENDENZA, 30/09/2026). RLS e trigger decidono: solo le
 * proprie righe, solo mazzi pubblicati, al massimo 500. `slug` serve solo a rinfrescare la scheda del mazzo e /decks.
 */
export async function toggleFavorite(deckId: string, save: boolean, slug: string): Promise<FavoriteResult> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (!isUuid(deckId)) return { error: "invalid" };
  const { error } = save
    ? await supabase.from("deck_favorites").upsert({ user_id: user.id, deck_id: deckId }, { onConflict: "user_id,deck_id", ignoreDuplicates: true })
    : await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId);
  if (error) {
    if (popularityMissing(error)) return { error: "unavailable" };
    if (error.code === "23514") return { error: "limit" };
    if (error.code === "42501") return { error: "invalid" };
    console.error("[community] toggleFavorite:", error.message);
    return { error: "db" };
  }
  const counts = await supabase.rpc("deck_favorite_counts");
  const row = (counts.data ?? []).find((r) => r.deck_id === deckId);
  if (typeof slug === "string" && /^[a-z0-9-]{1,120}$/.test(slug)) for (const l of locales) revalidatePath(`/${l}/decks/community/${slug}`);
  for (const l of locales) revalidatePath(`/${l}/account`);
  return { saved: save, count: counts.error ? undefined : Number(row?.favorites ?? 0) };
}

/** "Togli" dalla sezione "Mazzi salvati" di /account (form): toglie il salvataggio e torna alla sezione. */
export async function removeFavorite(formData: FormData): Promise<void> {
  const deckId = String(formData.get("deck") ?? "");
  const raw = String(formData.get("locale") ?? "");
  const locale = (locales as readonly string[]).includes(raw) ? raw : "en";
  const { supabase, user } = await currentUser();
  if (supabase && user && isUuid(deckId)) {
    const { error } = await supabase.from("deck_favorites").delete().eq("user_id", user.id).eq("deck_id", deckId);
    if (error) console.error("[community] removeFavorite:", error.message);
    for (const l of locales) revalidatePath(`/${l}/account`);
  }
  redirect(`/${locale}/account#saved`);
}
