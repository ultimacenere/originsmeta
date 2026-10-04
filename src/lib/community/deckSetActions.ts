"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { suggestArchetype } from "@/lib/archetype";
import { encodeOmCode } from "@/lib/deckcode";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { mediaErrorField, readDeckMedia } from "@/lib/videos";
import { checkDeck, cleanDeckName, isUuid, newSlug } from "./util";
import { notifyFollowers } from "./notify";
import { deckSetLimit } from "./deckSetQueries";
import { announceDeckSet } from "./deckSetDiscord";
import { translateDeckSetLater } from "./deckSetTranslate";
import { DECK_SET_SIZE, deckSetErrorCode, deckSetIndexableLocales, deckSetIssue, decodeSetCodes, readDeckSetGuide, type DeckSetDeck, type DeckSetGuide } from "./deckSets";

/**
 * Server Action dei Mazzi torneo (04/10/2026): pubblica, modifica, nascondi o rimetti online, elimina, vota. Le regole
 * stanno in deckSets.ts (pure, con test) e nel database (trigger guard_deck_set, tetto enforce_deck_set_limit, RLS):
 * qui si controllano prima, per rispondere con un messaggio chiaro invece di un errore del database.
 */
export type DeckSetActionState = { error?: string; ok?: boolean; href?: string; field?: string; created?: boolean };

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Pagine da rigenerare quando cambia un mazzo torneo (elenco, scheda, pannello privato e sitemap). */
function revalidateSetPaths(slug?: string) {
  for (const l of locales) {
    revalidatePath(`/${l}/decks/tournament`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/decks/tournament/${slug}`);
  }
  revalidateSitemaps();
}

/** IndexNow (Bing) per le versioni indicizzabili della scheda, dopo la risposta al browser (solo in produzione). */
function pingIndexNow(paths: string[]): void {
  if (!indexNowEnabled() || !paths.length) return;
  const job = async () => {
    await submitIndexNow(paths);
  };
  try {
    after(job);
  } catch {
    void job();
  }
}

/** Nome di riserva di un mazzo del trio senza nome: quello della sua Leggendaria. */
function legendaryName(slug: string, customs: { slug: string; name: string }[]): string {
  return getCard(slug)?.name ?? customs.find((c) => c.slug === slug)?.name ?? slug;
}

/** Legge e controlla il modulo (pubblicazione e modifica): i tre mazzi, le regole Conquest, nome, guida, video e link. */
async function parseSubmission(fd: FormData) {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" } as const;
  if (!user) return { error: "notLoggedIn" } as const;
  const locale = localeOf(fd);
  const decoded = decodeSetCodes(String(fd.get("codes") ?? ""));
  if (!decoded) return { error: "invalidDeck" } as const;
  const decks: DeckSetDeck[] = [];
  for (let i = 0; i < DECK_SET_SIZE; i++) {
    const checked = checkDeck(decoded[i]);
    if (!checked.ok) return { error: "invalidDeck" } as const;
    const d = checked.deck;
    const typed = cleanDeckName(String(fd.get(`deck_name_${i}`) ?? decoded[i].name ?? ""));
    const name = typed.length >= 3 ? typed : cleanDeckName(decoded[i].name).length >= 3 ? cleanDeckName(decoded[i].name) : cleanDeckName(legendaryName(d.legendary, d.customCards));
    const state = { name, legendary: d.legendary, cards: d.cards, customCards: d.customCards };
    const chosen = String(fd.get(`archetype_${i}`) ?? "");
    const archetype = Object.prototype.hasOwnProperty.call(archetypeLabels, chosen) ? chosen : suggestArchetype(state);
    decks.push({ name, legendary: d.legendary, cards: d.cards, custom_cards: d.customCards, archetype, code_om: encodeOmCode(state) });
  }
  const issue = deckSetIssue(decks.map((d) => ({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: d.custom_cards })));
  if (issue) return { error: issue.code === "count" ? "invalidDeck" : issue.code } as const;
  const name = cleanDeckName(String(fd.get("name") ?? ""));
  if (name.length < 3) return { error: "invalidName", field: "name" } as const;
  const guide = readDeckSetGuide((k) => fd.get(k), locales, locale);
  if (!guide) return { error: "summary", field: "summary" } as const;
  const media = readDeckMedia((k) => fd.get(k));
  if (!media.ok) return { error: media.code, field: mediaErrorField(media.code, media.index) } as const;
  return { supabase, user, locale, row: { name, decks, guide, videos: media.videos, links: media.links } };
}

/** Pubblica un mazzo torneo e porta alla sua scheda con `?new=1` (il riquadro "è online" per il proprietario). */
export async function publishDeckSet(_prev: DeckSetActionState, fd: FormData): Promise<DeckSetActionState> {
  const p = await parseSubmission(fd);
  if ("error" in p) return { error: p.error, ...("field" in p ? { field: p.field } : {}) };
  const limit = await deckSetLimit(p.supabase, p.user.id);
  if (limit.used >= limit.cap) return { error: limit.badge === "author" ? "limitAuthor" : "limit" };
  let slug = newSlug(p.row.name);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await p.supabase
      .from("community_deck_sets")
      .insert({ ...p.row, slug, owner: p.user.id, status: "published" })
      .select("id, slug")
      .single();
    if (!error && data) {
      const { id, slug: s } = data as { id: string; slug: string };
      revalidateSetPaths(s);
      announceDeckSet(s);
      notifyFollowers(p.user.id, "deck_set_published", s, p.supabase);
      if (deckSetIndexableLocales({ guide: p.row.guide }, [p.row.guide.lang]).length) pingIndexNow([`/${p.row.guide.lang}/decks/tournament/${s}`]);
      translateDeckSetLater(p.supabase, id);
      return { ok: true, created: true, href: `/${p.locale}/decks/tournament/${s}?new=1` };
    }
    if (error?.code !== "23505") {
      console.error("[deck-sets] pubblicazione non riuscita:", error?.code ?? "", error?.message ?? "");
      return { error: deckSetErrorCode(error) };
    }
    slug = newSlug(p.row.name);
  }
  return { error: "db" };
}

/** Salva le modifiche di un mazzo torneo dell'utente (le policy RLS bloccano quelli altrui; lo staff può). */
export async function updateDeckSet(_prev: DeckSetActionState, fd: FormData): Promise<DeckSetActionState> {
  const p = await parseSubmission(fd);
  if ("error" in p) return { error: p.error, ...("field" in p ? { field: p.field } : {}) };
  const id = fd.get("id");
  if (!isUuid(id)) return { error: "forbidden" };
  const { data, error } = await p.supabase.from("community_deck_sets").update(p.row).eq("id", id).select("slug, status").maybeSingle();
  if (error) {
    console.error("[deck-sets] modifica non riuscita:", error.code ?? "", error.message);
    return { error: deckSetErrorCode(error) };
  }
  if (!data) return { error: "forbidden" };
  const { slug, status } = data as { slug: string; status: string };
  revalidateSetPaths(slug);
  if (status === "published" && deckSetIndexableLocales({ guide: p.row.guide as DeckSetGuide }, [p.row.guide.lang]).length) pingIndexNow([`/${p.row.guide.lang}/decks/tournament/${slug}`]);
  // guida cambiata: le traduzioni fatte sul testo vecchio non valgono più e si rifanno (solo le lingue rimaste indietro)
  translateDeckSetLater(p.supabase, id);
  return { ok: true, href: `/${p.locale}/decks/tournament/${slug}` };
}

/** Nasconde o rimette online un mazzo torneo (profilo o scheda), poi torna a /account. */
export async function setDeckSetStatus(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(fd.get("id") ?? "");
  const status = fd.get("status") === "hidden" ? "hidden" : "published";
  if (isUuid(id)) {
    const { data } = await supabase.from("community_deck_sets").update({ status }).eq("id", id).select("slug").maybeSingle();
    revalidateSetPaths((data as { slug: string } | null)?.slug);
    if (data && status === "published") translateDeckSetLater(supabase, id);
  }
  redirect(`/${locale}/account#tournament-decks`);
}

/** Elimina un mazzo torneo dell'utente con i suoi voti e le sue statistiche (cascade). */
export async function deleteDeckSet(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(fd.get("id") ?? "");
  if (isUuid(id)) {
    const { data } = await supabase.from("community_deck_sets").delete().eq("id", id).select("slug").maybeSingle();
    revalidateSetPaths((data as { slug: string } | null)?.slug);
  }
  redirect(`/${locale}/account#tournament-decks`);
}

/** Voto da 1 a 5 stelle: uno per utente per trio (si può cambiare), mai sul proprio. */
export async function voteDeckSet(setId: string, stars: number, path: string): Promise<{ error?: string; avg?: number; votes?: number }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const n = Math.round(Number(stars));
  if (!isUuid(setId) || n < 1 || n > 5) return { error: "invalid" };
  const { error } = await supabase.from("deck_set_votes").upsert({ set_id: setId, user_id: user.id, stars: n }, { onConflict: "set_id,user_id" });
  if (error) return { error: error.code === "42501" ? "ownDeck" : "db" };
  const { data } = await supabase.from("deck_set_ratings").select("avg_stars, votes").eq("set_id", setId).maybeSingle();
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
  const r = data as { avg_stars: number | string; votes: number | string } | null;
  return { avg: r ? Number(r.avg_stars) : n, votes: r ? Number(r.votes) : 1 };
}
