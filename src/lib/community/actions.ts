"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { suggestArchetype } from "@/lib/archetype";
import { MAX_PRIVATE_DECKS, deckTypes } from "@/lib/community/types";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { publishedDeckLimit } from "./queries";
import { announceDeck } from "./discordDeck";
import { translateDeckLater } from "./translate";
import { checkDeck, cleanDeckName, cleanVideo, isUuid, newSlug, parseGuide, type CheckedDeck } from "./util";

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
  const name = cleanDeckName(String(formData.get("name") ?? decoded.name));
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

/**
 * Pubblica un mazzo del deck builder con la sua guida. Porta alla scheda creata con `?new=1`: lì il
 * proprietario trova il pannello "il tuo mazzo è online" con il link da copiare (UX-10, `NewDeckBanner`).
 * Se il mazzo arrivava dai privati (campo `draft`, dal tasto "Pubblica" di /account), la copia privata
 * viene tolta: il mazzo ora vive nella sua versione pubblica.
 */
export async function publishDeck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await parseSubmission(formData);
  if ("error" in p) return { error: p.error };
  // Tetto ai mazzi pubblicati (Pierluigi, 23/09/2026): 5 per un utente normale, nessuno per Influencer, Pro,
  // Staff e admin. Il controllo vero sta nel trigger `enforce_deck_limit` dello schema; qui si guarda prima,
  // per dire di no con un messaggio chiaro invece di un errore del database.
  const limit = await publishedDeckLimit(p.supabase, p.user.id);
  if (limit.used >= limit.cap) return { error: "deckLimit" };
  const draftId = formData.get("draft");
  let slug = newSlug(p.row.name);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await p.supabase
      .from("community_decks")
      .insert({ ...p.row, slug, owner: p.user.id, status: "published" })
      .select("id, slug")
      .single();
    if (!error && data) {
      const { id, slug: s } = data as { id: string; slug: string };
      // solo una riga dell'utente e solo se è ancora privata: un id qualunque non cancella niente
      if (isUuid(draftId)) await p.supabase.from("community_decks").delete().eq("id", draftId).eq("owner", p.user.id).eq("status", "draft");
      revalidateDeckPaths(s);
      // in diretta nel canale #community-decks del nostro Discord, dopo la risposta (senza webhook non fa nulla)
      announceDeck(s);
      // la guida si traduce nelle altre lingue del sito, dopo la risposta (senza ANTHROPIC_API_KEY non fa nulla)
      translateDeckLater(p.supabase, id);
      return { ok: true, href: `/${p.locale}/decks/community/${s}?new=1` };
    }
    if (error?.code !== "23505") return { error: "db" };
    slug = newSlug(p.row.name);
  }
  return { error: "db" };
}

/** Nome di riserva per un mazzo privato salvato senza nome: quello della sua Leggendaria. */
function fallbackName(deck: CheckedDeck): string {
  return cleanDeckName(getCard(deck.legendary)?.name ?? deck.customCards.find((c) => c.slug === deck.legendary)?.name ?? "");
}

/**
 * "Salva privato" del deck builder (decisione di Pierluigi del 21/09/2026). Campi: `code` (OM1), `name`, `locale`
 * e, facoltativo, `draft` (id del mazzo privato da aggiornare).
 * Il mazzo finisce nel profilo dell'utente con stato 'draft', che nessun altro vede: la policy di select di
 * community_decks mostra i non pubblicati solo al proprietario (e agli admin), e tutte le letture pubbliche
 * filtrano comunque su status = 'published' (vedi queries.ts). Niente guida: si scrive quando lo si pubblica
 * da /account ("Pubblica" → /decks/publish?deck=…&draft=…). Nessuna migrazione: lo schema ammette già 'draft'.
 */
export async function saveDeckPrivate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(formData);
  const decoded = decodeOmCode(String(formData.get("code") ?? ""));
  if (!decoded) return { error: "invalidDeck" };
  const checked = checkDeck(decoded);
  if (!checked.ok) return { error: checked.code };
  const typed = cleanDeckName(String(formData.get("name") ?? ""));
  const name = typed.length >= 3 ? typed : cleanDeckName(decoded.name).length >= 3 ? cleanDeckName(decoded.name) : fallbackName(checked.deck);
  if (name.length < 3) return { error: "invalidName" };
  const state = { name, legendary: checked.deck.legendary, cards: checked.deck.cards, customCards: checked.deck.customCards };
  const codeOm = encodeOmCode(state);
  const done: ActionState = { ok: true, href: `/${locale}/account#private` };

  // Mazzo privato riaperto da /account ("Apri nel builder" porta ?draft=<id>): si aggiorna quella riga invece di
  // crearne un'altra a ogni ritocco. Solo una riga dell'utente e solo se è ancora privata; se nel frattempo è
  // stata pubblicata o eliminata, l'update non tocca niente e si salva come mazzo nuovo.
  const draftId = formData.get("draft");
  if (isUuid(draftId)) {
    const { data: updated, error } = await supabase
      .from("community_decks")
      .update({
        name,
        legendary: checked.deck.legendary,
        cards: checked.deck.cards,
        custom_cards: checked.deck.customCards,
        code_om: codeOm,
        archetype: suggestArchetype(state),
      })
      .eq("id", draftId)
      .eq("owner", user.id)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (error) return { error: "db" };
    if (updated) {
      revalidateAccount();
      return done;
    }
  }

  // Lo stesso mazzo salvato due volte (doppio clic, o di nuovo dopo l'accesso) non crea un doppione:
  // si aggiorna la riga che c'è già, e il trigger touch_updated_at la porta in cima alla lista.
  const { data: same } = await supabase.from("community_decks").select("id").eq("owner", user.id).eq("status", "draft").eq("code_om", codeOm).limit(1).maybeSingle();
  if (same) {
    const { error } = await supabase
      .from("community_decks")
      .update({ name })
      .eq("id", (same as { id: string }).id);
    if (error) return { error: "db" };
    revalidateAccount();
    return done;
  }

  const { count } = await supabase.from("community_decks").select("id", { count: "exact", head: true }).eq("owner", user.id).eq("status", "draft");
  if ((count ?? 0) >= MAX_PRIVATE_DECKS) return { error: "draftLimit" };

  const row = {
    name,
    legendary: checked.deck.legendary,
    cards: checked.deck.cards,
    custom_cards: checked.deck.customCards,
    archetype: suggestArchetype(state),
    guide: { lang: locale, summary: "" },
    code_om: codeOm,
  };
  let slug = newSlug(name);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("community_decks").insert({ ...row, slug, owner: user.id, status: "draft" });
    if (!error) {
      revalidateAccount();
      return done;
    }
    if (error.code !== "23505") return { error: "db" };
    slug = newSlug(name);
  }
  return { error: "db" };
}

/** I mazzi privati compaiono solo nel profilo: non serve rigenerare /decks né la sitemap. */
function revalidateAccount() {
  for (const l of locales) revalidatePath(`/${l}/account`);
}

/** Aggiorna carte, nome e guida di un mazzo dell'utente (le policy RLS bloccano i mazzi altrui). */
export async function updateDeck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await parseSubmission(formData);
  if ("error" in p) return { error: p.error };
  const id = formData.get("id");
  if (!isUuid(id)) return { error: "forbidden" };
  const { data, error } = await p.supabase.from("community_decks").update(p.row).eq("id", id).select("slug").maybeSingle();
  if (error) return { error: "db" };
  if (!data) return { error: "forbidden" };
  const s = (data as { slug: string }).slug;
  revalidateDeckPaths(s);
  // guida cambiata: le traduzioni fatte sul testo vecchio non valgono più e si rifanno (solo le lingue rimaste indietro)
  translateDeckLater(p.supabase, id);
  return { ok: true, href: `/${p.locale}/decks/community/${s}` };
}

/**
 * Nasconde o ripubblica un mazzo (form nel profilo o nella pagina del mazzo). Mai su un mazzo privato:
 * un 'draft' non ha la guida, e renderlo pubblico da qui salterebbe il modulo di pubblicazione.
 */
export async function setDeckStatus(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "hidden" ? "hidden" : "published";
  const { data } = await supabase.from("community_decks").update({ status }).eq("id", id).neq("status", "draft").select("slug").maybeSingle();
  revalidateDeckPaths((data as { slug: string } | null)?.slug);
  // un mazzo rimesso online recupera le traduzioni che gli mancano (per esempio se era nascosto prima del 25/09/2026)
  if (data && status === "published" && isUuid(id)) translateDeckLater(supabase, id);
  redirect(`/${locale}/account`);
}

/** Elimina un mazzo dell'utente con i suoi voti. `back=private` riporta alla sezione dei mazzi privati. */
export async function deleteDeck(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.from("community_decks").delete().eq("id", id).select("slug").maybeSingle();
  revalidateDeckPaths((data as { slug: string } | null)?.slug);
  redirect(`/${locale}/account${formData.get("back") === "private" ? "#private" : ""}`);
}

/** Voto da 1 a 5 stelle: uno per utente per mazzo (si può cambiare), mai sul proprio mazzo. */
export async function voteDeck(deckId: string, stars: number, path: string): Promise<{ error?: string; avg?: number; votes?: number }> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const n = Math.round(Number(stars));
  if (!isUuid(deckId) || n < 1 || n > 5) return { error: "invalid" };
  const { error } = await supabase.from("deck_votes").upsert({ deck_id: deckId, user_id: user.id, stars: n }, { onConflict: "deck_id,user_id" });
  if (error) return { error: error.code === "42501" ? "ownDeck" : "db" };
  const { data } = await supabase.from("deck_ratings").select("avg_stars, votes").eq("deck_id", deckId).maybeSingle();
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
  const r = data as { avg_stars: number | string; votes: number | string } | null;
  return { avg: r ? Number(r.avg_stars) : n, votes: r ? Number(r.votes) : 1 };
}
