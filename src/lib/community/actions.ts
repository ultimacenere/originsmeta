"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archetypeLabels } from "@/lib/data/decks";
import { deckTypes } from "@/lib/community/types";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { checkDeck, cleanVideo, newSlug, parseGuide } from "./util";

export type ActionState = { error?: string; ok?: boolean; href?: string };

function revalidateDeckPaths(slug?: string) {
  for (const l of locales) {
    revalidatePath(`/${l}/decks`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/decks/community/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Legge e valida i campi del modulo di pubblicazione (usato sia per creare che per modificare). */
async function parseSubmission(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" } as const;
  if (!user) return { error: "notLoggedIn" } as const;
  const locale = localeOf(formData);
  const decoded = decodeOmCode(String(formData.get("code") ?? ""));
  if (!decoded) return { error: "invalidDeck" } as const;
  const checked = checkDeck(decoded);
  if (!checked.ok) return { error: checked.code } as const;
  const name = String(formData.get("name") ?? decoded.name)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (name.length < 3) return { error: "invalidName" } as const;
  const archetype = String(formData.get("archetype") ?? "");
  if (!Object.prototype.hasOwnProperty.call(archetypeLabels, archetype)) return { error: "archetype" } as const;
  const chosenTypes = Array.from(new Set(formData.getAll("deck_types").map(String))).filter((t) => (deckTypes as readonly string[]).includes(t));
  if (!chosenTypes.length) return { error: "deckType" } as const;
  const guide = parseGuide(formData, locale);
  if (!guide.ok) return { error: guide.code } as const;
  const video = cleanVideo(String(formData.get("video") ?? ""));
  if (!video.ok) return { error: "video" } as const;
  const state = { name, legendary: checked.deck.legendary, cards: checked.deck.cards, customCards: checked.deck.customCards };
  return {
    supabase,
    user,
    locale,
    row: {
      name,
      legendary: checked.deck.legendary,
      cards: checked.deck.cards,
      custom_cards: checked.deck.customCards,
      archetype,
      deck_types: chosenTypes,
      video_url: video.value,
      guide: guide.guide,
      code_om: encodeOmCode(state),
    },
  };
}

/** Pubblica un mazzo del deck builder con la sua guida. Restituisce il link della pagina creata. */
export async function publishDeck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await parseSubmission(formData);
  if ("error" in p) return { error: p.error };
  let slug = newSlug(p.row.name);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await p.supabase
      .from("community_decks")
      .insert({ ...p.row, slug, owner: p.user.id, status: "published" })
      .select("slug")
      .single();
    if (!error && data) {
      const s = (data as { slug: string }).slug;
      revalidateDeckPaths(s);
      return { ok: true, href: `/${p.locale}/decks/community/${s}` };
    }
    if (error?.code !== "23505") return { error: "db" };
    slug = newSlug(p.row.name);
  }
  return { error: "db" };
}

/** Aggiorna carte, nome e guida di un mazzo dell'utente (le policy RLS bloccano i mazzi altrui). */
export async function updateDeck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await parseSubmission(formData);
  if ("error" in p) return { error: p.error };
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "forbidden" };
  const { data, error } = await p.supabase.from("community_decks").update(p.row).eq("id", id).select("slug").maybeSingle();
  if (error) return { error: "db" };
  if (!data) return { error: "forbidden" };
  const s = (data as { slug: string }).slug;
  revalidateDeckPaths(s);
  return { ok: true, href: `/${p.locale}/decks/community/${s}` };
}

/** Nasconde o ripubblica un mazzo (form nel profilo o nella pagina del mazzo). */
export async function setDeckStatus(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "hidden" ? "hidden" : "published";
  const { data } = await supabase.from("community_decks").update({ status }).eq("id", id).select("slug").maybeSingle();
  revalidateDeckPaths((data as { slug: string } | null)?.slug);
  redirect(`/${locale}/account`);
}

/** Elimina un mazzo dell'utente con i suoi voti. */
export async function deleteDeck(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.from("community_decks").delete().eq("id", id).select("slug").maybeSingle();
  revalidateDeckPaths((data as { slug: string } | null)?.slug);
  redirect(`/${locale}/account`);
}

/** Voto da 1 a 5 stelle: uno per utente per mazzo (si può cambiare), mai sul proprio mazzo. */
export async function voteDeck(deckId: string, stars: number, path: string): Promise<{ error?: string; avg?: number; votes?: number }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const n = Math.round(Number(stars));
  if (!/^[0-9a-f-]{36}$/i.test(deckId) || n < 1 || n > 5) return { error: "invalid" };
  const { error } = await supabase.from("deck_votes").upsert({ deck_id: deckId, user_id: user.id, stars: n }, { onConflict: "deck_id,user_id" });
  if (error) return { error: error.code === "42501" ? "ownDeck" : "db" };
  const { data } = await supabase.from("deck_ratings").select("avg_stars, votes").eq("deck_id", deckId).maybeSingle();
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
  const r = data as { avg_stars: number | string; votes: number | string } | null;
  return { avg: r ? Number(r.avg_stars) : n, votes: r ? Number(r.votes) : 1 };
}
