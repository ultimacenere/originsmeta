"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { getCard } from "@/lib/data/cards";
import { SAVE_MIN_INTERVAL_MS } from "./profileLinks";
import { isShowcaseBadge } from "./badges";
import { VETRINA_COLUMNS, mediaPathOk, parseShowcaseForm, sameShowcaseValue, type ShowcaseFormErrors, type ShowcaseValue, type VetrinaRow } from "./showcase";
import { vetrinaMissing } from "./showcaseQueries";

/**
 * Salvataggi della vetrina dei profili (pacchetto VETRINA, 27/09/2026). Il server non si fida del modulo: rilegge tutto
 * con `parseShowcaseForm` (showcase.ts) e scrive con la sessione dell'utente; il database ripete le regole (vincoli,
 * trigger `guard_profile_vetrina`, grant solo sulle colonne della vetrina). Le immagini NON passano di qui: il browser le
 * carica nello Storage (bucket profile-media, limite delle Server Action 1 MB) e qui arriva solo il percorso, che deve
 * stare nella cartella dell'utente e, lo controlla il trigger, esistere davvero.
 *
 * Un salvataggio identico a quello che c'è non scrive e non rigenera nulla; due salvataggi che cambiano qualcosa a meno
 * di `SAVE_MIN_INTERVAL_MS` non passano (stessa regola del profilo pubblico: ogni salvataggio rigenera pagine e sitemap).
 */

export type ShowcaseActionState = {
  ok?: boolean;
  error?: "notLoggedIn" | "disabled" | "db" | "invalid" | "tooFast" | "missing" | "notAllowed";
  fields?: ShowcaseFormErrors;
  /** i valori salvati, nella forma canonica (il modulo li mostra al posto di quelli scritti) */
  value?: ShowcaseValue;
};

export type AvatarActionState = {
  ok?: boolean;
  error?: "notLoggedIn" | "disabled" | "db" | "invalid" | "tooFast" | "missing";
  /** percorso salvato (null: foto tolta) e foto mostrata adesso */
  path?: string | null;
  avatarUrl?: string | null;
};

/** Pagine che mostrano la vetrina o la foto: la pagina /u, /account e, per un ruolo vetrina, la directory. */
function revalidateProfile(username: string | null, showcase: boolean) {
  for (const l of locales) {
    revalidatePath(`/${l}/account`);
    if (username) revalidatePath(`/${l}/u/${username}`);
    if (showcase) revalidatePath(`/${l}/creators`);
  }
  // il lastmod di /u/<nome> segue la modifica (showcase_updated_at, scritto dal trigger)
  revalidateSitemaps();
}

const tooSoon = (updatedAt: string | null | undefined) => {
  const last = updatedAt ? Date.parse(updatedAt) : NaN;
  return Number.isFinite(last) && Date.now() - last < SAVE_MIN_INTERVAL_MS;
};

/** La carta è una Leggendaria attiva del database (non rimossa, non creata)? */
function isActiveLegendary(slug: string): boolean {
  const card = getCard(slug);
  return Boolean(card && card.legendary && card.status === "active" && card.type !== "token");
}

type CurrentRow = Partial<VetrinaRow> & { username: string | null; badge: string | null; showcase_updated_at: string | null };

export async function saveShowcase(_prev: ShowcaseActionState, formData: FormData): Promise<ShowcaseActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const current = await supabase.from("profiles").select(`username, badge, showcase_updated_at, ${VETRINA_COLUMNS}`).eq("id", user.id).maybeSingle();
  if (vetrinaMissing(current.error)) return { error: "missing" };
  if (current.error || !current.data) {
    console.error("[community] saveShowcase (lettura):", current.error?.message ?? "profilo assente");
    return { error: "db" };
  }
  const row = current.data as unknown as CurrentRow;
  // solo Creator, Autore, Pro e Staff (il trigger del database lo ripete)
  if (!isShowcaseBadge(row.badge)) return { error: "notAllowed" };
  const decks = await supabase.from("community_decks").select("id").eq("owner", user.id).eq("status", "published").limit(500);
  if (decks.error) {
    console.error("[community] saveShowcase (mazzi):", decks.error.message);
    return { error: "db" };
  }
  const text = (name: string) => String(formData.get(name) ?? "");
  const parsed = parseShowcaseForm(
    {
      cover: text("cover"),
      coverPath: text("cover_path"),
      accent: text("accent"),
      tagline: text("tagline"),
      favoriteLegendary: text("favorite_legendary"),
      featuredDeck: text("featured_deck"),
      featuredVideo: text("featured_video"),
      days: formData.getAll("slot_day").map(String),
      times: formData.getAll("slot_time").map(String),
      durations: formData.getAll("slot_minutes").map(String),
      timezone: text("timezone"),
    },
    { userId: user.id, isLegendary: isActiveLegendary, deckIds: new Set((decks.data ?? []).map((d) => d.id)) },
  );
  if (!parsed.ok) return { error: "invalid", fields: parsed.errors };
  if (sameShowcaseValue(row, parsed.value)) return { ok: true, value: parsed.value };
  if (tooSoon(row.showcase_updated_at)) return { error: "tooFast" };
  const { error } = await supabase.from("profiles").update(parsed.value).eq("id", user.id);
  if (error) {
    console.error("[community] saveShowcase:", error.message);
    return { error: "db" };
  }
  revalidateProfile(row.username, true);
  return { ok: true, value: parsed.value };
}

/**
 * Foto profilo caricata dal sito, per TUTTI gli iscritti: `path` è il file appena caricato dal browser nella propria
 * cartella (`<id>/avatar/<file>`), null per toglierla. Il trigger del database controlla che il file esista (tipo e peso)
 * e aggiorna `avatar_url`, che si rilegge e si restituisce: con la foto tolta torna quella di Discord, o nessuna.
 */
export async function saveAvatar(path: string | null): Promise<AvatarActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  if (path !== null && !mediaPathOk(user.id, "avatar", path)) return { error: "invalid" };
  const current = await supabase.from("profiles").select("username, badge, avatar_url, avatar_path, showcase_updated_at").eq("id", user.id).maybeSingle();
  if (vetrinaMissing(current.error)) return { error: "missing" };
  if (current.error || !current.data) {
    console.error("[community] saveAvatar (lettura):", current.error?.message ?? "profilo assente");
    return { error: "db" };
  }
  const row = current.data as { username: string | null; badge: string | null; avatar_url: string | null; avatar_path?: string | null; showcase_updated_at: string | null };
  if ((row.avatar_path ?? null) === path) return { ok: true, path, avatarUrl: row.avatar_url };
  if (tooSoon(row.showcase_updated_at)) return { error: "tooFast" };
  const res = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id).select("avatar_url").maybeSingle();
  if (res.error) {
    console.error("[community] saveAvatar:", res.error.message);
    return { error: "db" };
  }
  revalidateProfile(row.username, isShowcaseBadge(row.badge));
  return { ok: true, path, avatarUrl: (res.data as { avatar_url: string | null } | null)?.avatar_url ?? null };
}
