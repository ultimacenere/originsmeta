"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { suggestArchetype } from "@/lib/archetype";
import { MAX_PRIVATE_DECKS, deckTypes } from "@/lib/community/types";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { publishedDeckLimit } from "./queries";
import { announceDeck } from "./discordDeck";
import { notifyFollowers } from "./notify";
import { translateDeckLater } from "./translate";
import { refreshCardDecks } from "./decksByCard";
import { deckIndexable } from "./deckQuality";
import { checkDeck, cleanDeckName, isUuid, newSlug, parseGuide, type CheckedDeck } from "./util";
import { mediaErrorField, mediaNeedsColumns, readDeckMedia } from "@/lib/videos";
import { PROFILE_MEDIA_BUCKET } from "./profileMedia";
import { deckArtErrorCode, deckArtPathOk, missingArtColumn, readDeckArtField } from "./deckArt";

/**
 * Esito delle azioni dei mazzi. `created` lo mette solo `saveDeckPrivate` quando inserisce un mazzo privato nuovo:
 * aggiornare il mazzo privato riaperto (?draft=<id>) o risalvare lo stesso mazzo sono `ok` ma non `created`, e il
 * browser manda l'evento chiave deck_created solo nel primo caso (revisione dell'integrazione dell'Ondata 2).
 */
export type ActionState = {
  error?: string;
  ok?: boolean;
  href?: string;
  created?: boolean;
  /** campo del modulo da correggere (errori di video e link, pacchetto VIDEO): il modulo lo apre e gli dà il fuoco */
  field?: string;
};

/**
 * Pagine da rigenerare quando cambia un mazzo pubblicato. Dall'Ondata 2 (25/09/2026) anche le schede carta, che
 * mostrano "Mazzi con questa carta", le carte spesso nello stesso mazzo e il conto dei mazzi: `refreshCardDecks`
 * invalida la lettura condivisa dei mazzi e con lei tutte le schede che la usano (circa 430 pagine). `gone` quando il
 * mazzo sparisce (nascosto o eliminato): allora le schede non devono servirlo neanche una volta di più (`updateTag`).
 * `cardPages = false` quando le schede non cambiano: nessuna riga toccata (id altrui o inesistente), oppure modifica o
 * eliminazione di un mazzo privato o nascosto, che le schede non mostrano (leggono solo `status = 'published'`). Così
 * una Server Action a vuoto non fa scadere la cache di tutte le schede. Limite accettato: nascondere un mazzo già
 * nascosto le rigenera lo stesso (lo stato di prima non si legge). I voti non passano di qui: vedi `refreshCardDecks`.
 */
function revalidateDeckPaths(slug?: string, gone = false, cardPages = true) {
  for (const l of locales) {
    revalidatePath(`/${l}/decks`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/decks/community/${slug}`);
  }
  // l'indice e tutte le sitemap divise (Ondata 2): revalidatePath("/sitemap.xml") rinfrescava solo l'indice
  revalidateSitemaps();
  if (cardPages) refreshCardDecks(gone);
}

/** IndexNow (Bing): le versioni indicizzabili della scheda di un mazzo, dopo la risposta al browser (solo in produzione). */
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
  // fino a 3 video (YouTube, Twitch) e 5 risorse, con le stesse regole dei vincoli SQL (src/lib/videos.ts)
  const media = readDeckMedia((k) => formData.get(k));
  if (!media.ok) return { error: media.code, field: mediaErrorField(media.code, media.index) } as const;
  // artwork della Leggendaria (Creator e Staff, 29/09/2026): il campo c'è solo nel modulo di chi può usarlo; senza campo
  // la colonna non si tocca. Ruolo, cartella del proprietario e file li controlla il database (blocco IMMAGINI).
  const art = readDeckArtField(formData.get("art_path"));
  if (art === false) return { error: "artFile", field: "art" } as const;
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
      // la colonna storica tiene il primo video: una versione del sito di prima lo mostra ancora
      video_url: media.videos[0]?.url ?? null,
      videos: media.videos,
      links: media.links,
      guide: guide.guide,
      code_om: encodeOmCode(state),
      ...(art === undefined ? {} : { art_path: art }),
    },
  };
}

/**
 * Colonne `videos` e `links` non ancora nel database (supabase/schema.sql, blocco VIDEO non applicato): PostgREST risponde
 * PGRST204 ("Could not find the 'links' column…") o 42703. Allora si salva senza, con il solo primo video in
 * `video_url` come prima, ma SOLO se non si perde nulla (`mediaNeedsColumns`: un video semplice, senza minuto, titolo
 * né risorse); altrimenti la Server Action risponde `mediaUnavailable` e il modulo spiega che cosa togliere. La
 * migrazione va comunque applicata prima di mandare online il pacchetto.
 */
function missingMediaColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === "PGRST204" || error.code === "42703") && /\b(?:videos|links)\b/.test(error.message ?? ""));
}

function withoutMedia<T extends Record<string, unknown>>(row: T): Omit<T, "videos" | "links"> {
  return Object.fromEntries(Object.entries(row).filter(([k]) => k !== "videos" && k !== "links")) as Omit<T, "videos" | "links">;
}

/**
 * Colonna `art_path` non ancora nel database (blocco IMMAGINI di schema.sql non applicato, 29/09/2026): si salva senza,
 * ma solo se il modulo non chiedeva un artwork (`null`: resta la carta ufficiale, com'era); con un artwork la Server
 * Action risponde `artUnavailable`. Prima della migrazione il bucket non accetta comunque i file della cartella deck.
 */
function withoutArt<T extends Record<string, unknown>>(row: T): Omit<T, "art_path"> {
  return Object.fromEntries(Object.entries(row).filter(([k]) => k !== "art_path")) as Omit<T, "art_path">;
}

/** Errore di scrittura di un mazzo → esito del modulo: i controlli dell'artwork (trigger guard_deck_art), poi "db". */
function deckWriteError(error: { code?: string; message?: string } | null): ActionState {
  const art = deckArtErrorCode(error);
  return art ? { error: art, field: "art" } : { error: "db" };
}

/**
 * Pubblica un mazzo del deck builder con la sua guida. Porta alla scheda creata con `?new=1`: lì il
 * proprietario trova il pannello "il tuo mazzo è online" con il link da copiare (UX-10, `NewDeckBanner`).
 * Se il mazzo arrivava dai privati (campo `draft`, dal tasto "Pubblica" di /account), la copia privata
 * viene tolta: il mazzo ora vive nella sua versione pubblica.
 */
export async function publishDeck(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const p = await parseSubmission(formData);
  if ("error" in p) return { error: p.error, ...("field" in p ? { field: p.field } : {}) };
  // Tetto ai mazzi pubblicati (Pierluigi, 23/09/2026; ruoli del 27/09/2026): 5 per la community, 20 per l'Autore,
  // nessuno per Creator, Pro, Staff e admin. Il controllo vero sta nel trigger `enforce_deck_limit` dello schema; qui
  // si guarda prima, per dire di no con un messaggio chiaro (quello dell'Autore dice il suo tetto) invece di un errore
  // del database.
  const limit = await publishedDeckLimit(p.supabase, p.user.id);
  if (limit.used >= limit.cap) return { error: limit.badge === "author" ? "deckLimitAuthor" : "deckLimit" };
  const draftId = formData.get("draft");
  let slug = newSlug(p.row.name);
  let row: Record<string, unknown> = p.row;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await p.supabase
      .from("community_decks")
      .insert({ ...(row as typeof p.row), slug, owner: p.user.id, status: "published" })
      .select("id, slug")
      .single();
    // colonne dei pacchetti VIDEO e IMMAGINI non ancora nel database: si riprova senza (una volta per gruppo)
    if (missingMediaColumn(error) && "videos" in row) {
      if (mediaNeedsColumns(p.row)) return { error: "mediaUnavailable" };
      row = withoutMedia(row);
      continue;
    }
    if (missingArtColumn(error) && "art_path" in row) {
      if (row.art_path) return { error: "artUnavailable", field: "art" };
      row = withoutArt(row);
      continue;
    }
    if (!error && data) {
      const { id, slug: s } = data as { id: string; slug: string };
      // solo una riga dell'utente e solo se è ancora privata: un id qualunque non cancella niente
      if (isUuid(draftId)) await p.supabase.from("community_decks").delete().eq("id", draftId).eq("owner", p.user.id).eq("status", "draft");
      revalidateDeckPaths(s);
      // in diretta nel canale #community-decks del nostro Discord, dopo la risposta (senza webhook non fa nulla)
      announceDeck(s);
      // un avviso a chi segue l'autore (pacchetto SEGUI, 27/09/2026), dopo la risposta: solo i profili vetrina hanno follower
      notifyFollowers(p.user.id, "deck_published", s, p.supabase);
      // la scheda nella lingua della guida, l'unica indicizzabile finché la traduzione non c'è; sotto la soglia di DECKS è noindex
      if (deckIndexable(p.row)) pingIndexNow([`/${p.row.guide.lang}/decks/community/${s}`]);
      // la guida si traduce nelle altre lingue del sito, dopo la risposta (senza ANTHROPIC_API_KEY non fa nulla)
      translateDeckLater(p.supabase, id);
      return { ok: true, href: `/${p.locale}/decks/community/${s}?new=1` };
    }
    if (error?.code !== "23505") return deckWriteError(error);
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
      // l'unico ramo che crea un mazzo: gli aggiornamenti qui sopra restituiscono `done` senza `created`
      return { ...done, created: true };
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
  if ("error" in p) return { error: p.error, ...("field" in p ? { field: p.field } : {}) };
  const id = formData.get("id");
  if (!isUuid(id)) return { error: "forbidden" };
  let row: Record<string, unknown> = p.row;
  let res = await p.supabase.from("community_decks").update(row as typeof p.row).eq("id", id).select("slug, status").maybeSingle();
  // colonne dei pacchetti VIDEO e IMMAGINI non ancora nel database: si riprova senza (una volta per gruppo)
  for (let i = 0; i < 2 && res.error; i++) {
    if (missingMediaColumn(res.error) && "videos" in row) {
      if (mediaNeedsColumns(p.row)) return { error: "mediaUnavailable" };
      row = withoutMedia(row);
    } else if (missingArtColumn(res.error) && "art_path" in row) {
      if (row.art_path) return { error: "artUnavailable", field: "art" };
      row = withoutArt(row);
    } else break;
    res = await p.supabase.from("community_decks").update(row as typeof p.row).eq("id", id).select("slug, status").maybeSingle();
  }
  const { data, error } = res;
  if (error) return deckWriteError(error);
  if (!data) return { error: "forbidden" };
  const { slug: s, status } = data as { slug: string; status: string };
  revalidateDeckPaths(s, false, status === "published");
  // come in publishDeck: solo un mazzo pubblicato e sopra la soglia di parole ha una scheda da segnalare
  if (status === "published" && deckIndexable(p.row)) pingIndexNow([`/${p.row.guide.lang}/decks/community/${s}`]);
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
  // schede carta solo se una riga è cambiata davvero (un id altrui o inesistente non tocca niente)
  revalidateDeckPaths((data as { slug: string } | null)?.slug, status === "hidden", Boolean(data));
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
  // l'artwork del mazzo (29/09/2026), letto a parte: la colonna può non esserci ancora e la delete non deve dipenderne
  const art = isUuid(id) ? await supabase.from("community_decks").select("art_path").eq("id", id).maybeSingle() : null;
  const artPath = (art?.data as { art_path?: string | null } | null)?.art_path;
  const { data } = await supabase.from("community_decks").delete().eq("id", id).select("slug, status").maybeSingle();
  const deleted = data as { slug: string; status: string } | null;
  // il file non è più in uso: lo toglie chi ha eliminato il mazzo (la policy del bucket lo lascia fare al proprietario e
  // a un admin); se non riesce, resta a scripts/clear-profile-media.mjs --orphans
  if (deleted && deckArtPathOk(artPath)) {
    const { error } = await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([artPath]);
    if (error) console.error("[community] artwork del mazzo non cancellato:", error.message);
  }
  // un mazzo privato o nascosto non era su nessuna scheda carta: solo l'eliminazione di un mazzo pubblicato le tocca
  revalidateDeckPaths(deleted?.slug, true, deleted?.status === "published");
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
