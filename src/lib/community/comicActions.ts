"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import type { Db } from "@/lib/supabase/public";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { isUuid, slugify } from "./util";
import { comicRoleOf, editionsColumnMissing } from "./comicQueries";
import { SAVE_MIN_INTERVAL_MS } from "./profileLinks";
import { retryAfterSeconds } from "./showcase";
import { PROFILE_MEDIA_BUCKET } from "./profileMedia";
import { comicErrorCode, comicErrorField, comicFiles, comicHash, comicPath, readComicForm, storedEditions, storedPages, type ComicEditions, type ComicIntent } from "./comics";
import { announceComic, notifyComicFollowers } from "./comicNotify";
import { translateComicLater } from "./comicTranslate";

/**
 * Server Action dei fumetti (pacchetto FUMETTI, 29/09/2026): salvataggio (bozza o pubblicazione, creazione o modifica),
 * stato (il proprietario lo riporta tra le bozze o lo ripubblica; lo staff lo nasconde e lo rimette online), eliminazione.
 *
 * Il controllo vero sta nel database (blocco FUMETTI di supabase/schema.sql): policy con `can_publish_comics`, grant per
 * colonna, vincoli di testo e tavole, trigger con i tetti e lo stato riservato allo staff, trigger dei file. Qui si
 * controlla prima, con le stesse regole (`readComicForm`), per rispondere con un messaggio chiaro. Niente file attraverso
 * le Server Action (limite 1 MB): tavole e copertina le carica il browser nello Storage (`<id>/comic/<file>`), qui
 * arrivano solo i percorsi. Solo il proprietario modifica tavole e testi: lo staff nasconde o rimette online.
 */

export type ComicActionState = {
  error?: string;
  ok?: boolean;
  href?: string;
  /** campo del modulo da correggere e numero della tavola (da 0) */
  field?: string;
  index?: number;
  /** il fumetto è appena uscito per la prima volta (evento comic_published nel browser) */
  firstPublish?: boolean;
  /** lingua dei testi, per l'evento */
  lang?: string;
  /** con `tooFast`: secondi da aspettare prima di salvare di nuovo */
  retryIn?: number;
  /** con un errore in una versione disegnata: la sua lingua */
  edition?: string;
};

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Slug leggibile dal titolo più 4 caratteri casuali, come le guide ("comic" di riserva). */
function newComicSlug(title: string): string {
  const base = slugify(title).slice(0, 40).replace(/-+$/, "") || "comic";
  return `${base}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
}

/**
 * Pagine da rigenerare quando cambia un fumetto: la sua pagina, le news e la home (che dal 29/09/2026 mostrano i fumetti,
 * in ISR), l'elenco /news/comics, il profilo del proprietario, /account, e la sitemap.
 */
function revalidateComic(slug: string | undefined, username: string | null): void {
  for (const l of locales) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}/news`);
    revalidatePath(`/${l}/news/comics`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}${comicPath(slug)}`);
    if (username) revalidatePath(`/${l}/u/${username}`);
  }
  revalidateSitemaps();
}

/** IndexNow (Bing), dopo la risposta al browser e solo in produzione. */
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

/** Cancella dallo Storage i file che il fumetto non usa più (tavole tolte o sostituite, copertina cambiata), dopo la risposta. */
function removeFilesLater(supabase: Db, paths: string[]): void {
  if (!paths.length) return;
  const job = async () => {
    const { error } = await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove(paths);
    if (error) console.error("[comics] file non cancellati:", error.message);
  };
  try {
    after(job);
  } catch {
    void job();
  }
}

const SAVED_COLUMNS = "id, slug, status, published_at, owner, updated_at, lang, profile:profiles!community_comics_owner_fkey(username)";
type Saved = { id: string; slug: string; status: string; published_at: string | null; owner: string; updated_at?: string; lang?: string; profile?: { username: string | null } | null };
const ownerName = (s: { profile?: { username: string | null } | null } | null) => s?.profile?.username ?? null;

/**
 * Dopo un salvataggio: pagine, e per un fumetto pubblicato annuncio, avviso ai follower, IndexNow (la lingua dei testi e
 * quelle delle versioni disegnate, `langs`) e traduzione.
 */
function afterSave(supabase: Db, c: { id: string; slug: string; status: string; first: boolean; ownerId: string; langs: Locale[]; changed: boolean; textChanged: boolean }, username: string | null): void {
  if (c.changed) revalidateComic(c.slug, username);
  if (c.status !== "published") return;
  if (c.first) {
    announceComic(c.slug);
    notifyComicFollowers(c.ownerId, c.slug, supabase);
  }
  if (c.first || c.textChanged) pingIndexNow(c.langs.map((l) => `/${l}${comicPath(c.slug)}`));
  translateComicLater(supabase, c.id);
}

/** Le lingue con un testo scritto dall'autore: quella del fumetto e quelle delle versioni disegnate. */
const authoredLangs = (lang: Locale, editions: ComicEditions): Locale[] => [lang, ...locales.filter((l) => l !== lang && editions[l])];

/** Le versioni disegnate sono le stesse (lingua per lingua: l'ordine delle chiavi del JSON non conta)? */
const sameEditions = (a: ComicEditions, b: ComicEditions): boolean => locales.every((l) => JSON.stringify(a[l] ?? null) === JSON.stringify(b[l] ?? null));

/**
 * Salva un fumetto dal modulo di /news/comics/new o /news/comics/[slug]/edit. Campi: `intent` ("draft" o "publish"),
 * `locale`, `id` (in modifica), `lang`, `title`, `summary`, `pages` (JSON), `cover_path` ed `editions` (JSON, le versioni
 * disegnate nelle altre lingue). Un fumetto pubblicato porta alla
 * sua pagina (con `?new=1` la prima volta); una bozza alla sua pagina di modifica. Due salvataggi dello stesso fumetto a
 * meno di 10 secondi non passano (`tooFast`), come le guide.
 */
export async function saveComic(_prev: ComicActionState, fd: FormData): Promise<ComicActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(fd);
  const intent: ComicIntent = fd.get("intent") === "publish" ? "publish" : "draft";
  const role = await comicRoleOf(supabase, user.id);
  if (!role.canPublish) return { error: "forbidden" };

  const parsed = readComicForm(fd, intent, user.id);
  if (!parsed.ok) return { error: parsed.error.code, field: comicErrorField(parsed.error), index: parsed.error.index, edition: parsed.error.edition };
  const value = parsed.value;
  const status = intent === "publish" ? "published" : "draft";
  const { editions, ...fields } = value;
  const hasEditions = Object.keys(editions).length > 0;
  // le versioni disegnate si scrivono solo quando ci sono o c'erano: prima della migrazione del 30/09/2026 la colonna
  // non c'è, e un fumetto senza versioni si salva come prima (`writeRow` ripete la scrittura senza la colonna)
  const row = { ...fields, text_hash: comicHash(value) };
  const writeRow = async <R extends { error: { code?: string; message: string } | null }>(run: (r: typeof row & { editions?: ComicEditions }) => PromiseLike<R>): Promise<R> => {
    const res = await run({ ...row, editions });
    return !hasEditions && editionsColumnMissing(res.error) ? run(row) : res;
  };

  const id = fd.get("id");
  let saved: Saved | null = null;
  let first = false;
  let changed = true;
  let textChanged = true;
  let unused: string[] = [];
  if (isUuid(id)) {
    const read = (columns: string) => supabase.from("community_comics").select(columns).eq("id", id).maybeSingle();
    const PREV = "id, slug, status, published_at, owner, updated_at, text_hash, pages, cover_path, lang";
    let before = await read(`${PREV}, editions`);
    if (editionsColumnMissing(before.error)) before = await read(PREV);
    if (before.error) return { error: comicErrorCode(before.error) };
    const prev = before.data as unknown as (Saved & { text_hash: string | null; pages: unknown; cover_path: string | null; lang: string; editions?: unknown }) | null;
    // solo il proprietario modifica tavole e testi (lo staff nasconde o rimette online dalla pagina)
    if (!prev || prev.owner !== user.id) return { error: "forbidden" };
    if (prev.status === "hidden") return { error: "comic_hidden" };
    const wait = retryAfterSeconds(prev.updated_at, SAVE_MIN_INTERVAL_MS, Date.now());
    if (wait) return { error: "tooFast", retryIn: wait };
    const res = await writeRow((r) => supabase.from("community_comics").update({ ...r, status }).eq("id", id).select(SAVED_COLUMNS).maybeSingle());
    if (res.error) return { error: comicErrorCode(res.error) };
    saved = res.data as unknown as Saved | null;
    if (!saved) return { error: "forbidden" };
    first = !prev.published_at && Boolean(saved.published_at);
    changed = saved.updated_at !== prev.updated_at || saved.status !== prev.status;
    const prevEditions = storedEditions(prev.editions, prev.owner, isLocale(prev.lang) ? prev.lang : value.lang);
    textChanged = prev.text_hash !== row.text_hash || !sameEditions(prevEditions, editions);
    // i file che il fumetto non usa più: tavole tolte o sostituite, copertine cambiate, versioni disegnate tolte
    const keep = new Set(comicFiles({ ...value, owner: prev.owner }));
    const old = comicFiles({ owner: prev.owner, pages: storedPages(prev.pages, prev.owner), cover_path: prev.cover_path, editions: prevEditions });
    unused = old.filter((p) => !keep.has(p));
  } else {
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      const slug = newComicSlug(value.title);
      const res = await writeRow((r) => supabase.from("community_comics").insert({ ...r, status, slug, owner: user.id }).select(SAVED_COLUMNS).single());
      if (!res.error) {
        saved = res.data as unknown as Saved;
        first = Boolean(saved.published_at);
        break;
      }
      const code = comicErrorCode(res.error);
      if (code !== "duplicate") return { error: code };
    }
    if (!saved) return { error: "duplicate" };
  }

  removeFilesLater(supabase, unused);
  afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, ownerId: saved.owner, langs: authoredLangs(value.lang, editions), changed, textChanged }, ownerName(saved));
  const href = saved.status === "published" ? `/${locale}${comicPath(saved.slug)}${first ? "?new=1" : ""}` : `/${locale}${comicPath(saved.slug)}/edit?saved=1`;
  return { ok: true, href, firstPublish: first, lang: value.lang };
}

/** Un indirizzo di ritorno del sito nella lingua della pagina, altrimenti null (niente redirect verso altri siti). */
function safeBack(raw: FormDataEntryValue | null, locale: Locale): string | null {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith(`/${locale}/`) && !s.startsWith("//") && !/[\\\s]/.test(s) ? s : null;
}

/**
 * Cambia lo stato di un fumetto: il proprietario lo riporta tra le bozze (`draft`) o lo ripubblica (`published`, se ha
 * titolo, presentazione, tavole e copertina: lo controlla il database); lo staff lo nasconde (`hidden`) o lo rimette
 * online. Il database decide chi può fare che cosa: una richiesta non ammessa non cambia nulla. Come il salvataggio, per
 * il proprietario un cambio a meno di 10 secondi dall'ultima modifica non passa.
 */
export async function setComicStatus(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = fd.get("id");
  const raw = String(fd.get("status") ?? "");
  const status = raw === "hidden" ? "hidden" : raw === "published" ? "published" : "draft";
  const back = safeBack(fd.get("back"), locale);
  if (!isUuid(id)) redirect(back ?? `/${locale}/account#comics`);
  const read = async () => {
    const PREV = "published_at, updated_at, status, lang, owner";
    const res = await supabase.from("community_comics").select(`${PREV}, editions`).eq("id", id).maybeSingle();
    return editionsColumnMissing(res.error) ? supabase.from("community_comics").select(PREV).eq("id", id).maybeSingle() : res;
  };
  const [before, role] = await Promise.all([read(), comicRoleOf(supabase, user.id)]);
  const prev = before.data as unknown as { published_at: string | null; updated_at: string; status: string; lang: string; owner: string; editions?: unknown } | null;
  if (prev && !role.staff && prev.status !== status && retryAfterSeconds(prev.updated_at, SAVE_MIN_INTERVAL_MS, Date.now())) {
    redirect(back ?? `/${locale}/account#comics`);
  }
  const res = await supabase.from("community_comics").update({ status }).eq("id", id).select(SAVED_COLUMNS).maybeSingle();
  const saved = res.data as unknown as Saved | null;
  if (saved && prev) {
    const first = !prev.published_at && Boolean(saved.published_at);
    const lang = isLocale(prev.lang) ? prev.lang : "en";
    const langs = authoredLangs(lang, storedEditions(prev.editions, prev.owner, lang));
    afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, ownerId: saved.owner, langs, changed: saved.status !== prev.status, textChanged: false }, ownerName(saved));
  } else if (res.error) {
    console.error("[comics] cambio di stato non riuscito:", res.error.message);
  }
  redirect(back ?? (saved?.status === "published" ? `/${locale}${comicPath(saved.slug)}` : `/${locale}/account#comics`));
}

/** Elimina un fumetto (il proprietario o lo staff; le policy bloccano gli altri) e poi i suoi file. */
export async function deleteComic(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = fd.get("id");
  if (isUuid(id)) {
    const GONE = "slug, owner, lang, pages, cover_path, profile:profiles!community_comics_owner_fkey(username)";
    const remove = (columns: string) => supabase.from("community_comics").delete().eq("id", id).select(columns).maybeSingle();
    let res = await remove(`${GONE}, editions`);
    // prima della migrazione del 30/09/2026 la colonna non c'è: la richiesta non ha cancellato nulla, si ripete senza
    if (editionsColumnMissing(res.error)) res = await remove(GONE);
    if (res.error) console.error("[comics] eliminazione non riuscita:", res.error.message);
    const gone = res.data as unknown as { slug: string; owner: string; lang: string; pages: unknown; cover_path: string | null; editions?: unknown; profile?: { username: string | null } | null } | null;
    if (gone) {
      revalidateComic(gone.slug, ownerName(gone));
      // i file non sono più in uso: li toglie chi ha eliminato il fumetto, se la policy del bucket glielo lascia fare (il
      // proprietario, un admin); altrimenti restano a scripts/clear-profile-media.mjs --orphans
      const lang = isLocale(gone.lang) ? gone.lang : "en";
      removeFilesLater(supabase, comicFiles({ owner: gone.owner, pages: storedPages(gone.pages, gone.owner), cover_path: gone.cover_path, editions: storedEditions(gone.editions, gone.owner, lang) }));
    }
  }
  redirect(`/${locale}/account#comics`);
}
