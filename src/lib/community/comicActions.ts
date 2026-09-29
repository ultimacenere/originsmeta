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
import { comicRoleOf } from "./comicQueries";
import { SAVE_MIN_INTERVAL_MS } from "./profileLinks";
import { retryAfterSeconds } from "./showcase";
import { PROFILE_MEDIA_BUCKET } from "./profileMedia";
import { comicErrorCode, comicErrorField, comicHash, comicPath, comicPathOk, readComicForm, storedPages, type ComicIntent } from "./comics";
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

/** Dopo un salvataggio: pagine, e per un fumetto pubblicato annuncio, avviso ai follower, IndexNow e traduzione. */
function afterSave(supabase: Db, c: { id: string; slug: string; status: string; first: boolean; ownerId: string; lang: Locale; changed: boolean; textChanged: boolean }, username: string | null): void {
  if (c.changed) revalidateComic(c.slug, username);
  if (c.status !== "published") return;
  if (c.first) {
    announceComic(c.slug);
    notifyComicFollowers(c.ownerId, c.slug, supabase);
  }
  if (c.first || c.textChanged) pingIndexNow([`/${c.lang}${comicPath(c.slug)}`]);
  translateComicLater(supabase, c.id);
}

/**
 * Salva un fumetto dal modulo di /news/comics/new o /news/comics/[slug]/edit. Campi: `intent` ("draft" o "publish"),
 * `locale`, `id` (in modifica), `lang`, `title`, `summary`, `pages` (JSON), `cover_path`. Un fumetto pubblicato porta alla
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
  if (!parsed.ok) return { error: parsed.error.code, field: comicErrorField(parsed.error), index: parsed.error.index };
  const value = parsed.value;
  const status = intent === "publish" ? "published" : "draft";
  const row = { ...value, text_hash: comicHash(value) };

  const id = fd.get("id");
  let saved: Saved | null = null;
  let first = false;
  let changed = true;
  let textChanged = true;
  let unused: string[] = [];
  if (isUuid(id)) {
    const before = await supabase.from("community_comics").select("id, slug, status, published_at, owner, updated_at, text_hash, pages, cover_path").eq("id", id).maybeSingle();
    if (before.error) return { error: comicErrorCode(before.error) };
    const prev = before.data as (Saved & { text_hash: string | null; pages: unknown; cover_path: string | null }) | null;
    // solo il proprietario modifica tavole e testi (lo staff nasconde o rimette online dalla pagina)
    if (!prev || prev.owner !== user.id) return { error: "forbidden" };
    if (prev.status === "hidden") return { error: "comic_hidden" };
    const wait = retryAfterSeconds(prev.updated_at, SAVE_MIN_INTERVAL_MS, Date.now());
    if (wait) return { error: "tooFast", retryIn: wait };
    const res = await supabase.from("community_comics").update({ ...row, status }).eq("id", id).select(SAVED_COLUMNS).maybeSingle();
    if (res.error) return { error: comicErrorCode(res.error) };
    saved = res.data as unknown as Saved | null;
    if (!saved) return { error: "forbidden" };
    first = !prev.published_at && Boolean(saved.published_at);
    changed = saved.updated_at !== prev.updated_at || saved.status !== prev.status;
    textChanged = prev.text_hash !== row.text_hash;
    // i file che il fumetto non usa più: tavole tolte o sostituite, copertina cambiata
    const keep = new Set([...value.pages.map((p) => p.path), ...(value.cover_path ? [value.cover_path] : [])]);
    const old = [...storedPages(prev.pages, prev.owner).map((p) => p.path), ...(comicPathOk(prev.cover_path, prev.owner) ? [prev.cover_path] : [])];
    unused = old.filter((p) => !keep.has(p));
  } else {
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      const res = await supabase
        .from("community_comics")
        .insert({ ...row, status, slug: newComicSlug(value.title), owner: user.id })
        .select(SAVED_COLUMNS)
        .single();
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
  afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, ownerId: saved.owner, lang: value.lang, changed, textChanged }, ownerName(saved));
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
  const [before, role] = await Promise.all([supabase.from("community_comics").select("published_at, updated_at, status, lang").eq("id", id).maybeSingle(), comicRoleOf(supabase, user.id)]);
  const prev = before.data as { published_at: string | null; updated_at: string; status: string; lang: string } | null;
  if (prev && !role.staff && prev.status !== status && retryAfterSeconds(prev.updated_at, SAVE_MIN_INTERVAL_MS, Date.now())) {
    redirect(back ?? `/${locale}/account#comics`);
  }
  const res = await supabase.from("community_comics").update({ status }).eq("id", id).select(SAVED_COLUMNS).maybeSingle();
  const saved = res.data as unknown as Saved | null;
  if (saved && prev) {
    const first = !prev.published_at && Boolean(saved.published_at);
    const lang = isLocale(prev.lang) ? prev.lang : "en";
    afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, ownerId: saved.owner, lang, changed: saved.status !== prev.status, textChanged: false }, ownerName(saved));
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
    const { data, error } = await supabase
      .from("community_comics")
      .delete()
      .eq("id", id)
      .select("slug, owner, pages, cover_path, profile:profiles!community_comics_owner_fkey(username)")
      .maybeSingle();
    if (error) console.error("[comics] eliminazione non riuscita:", error.message);
    const gone = data as unknown as { slug: string; owner: string; pages: unknown; cover_path: string | null; profile?: { username: string | null } | null } | null;
    if (gone) {
      revalidateComic(gone.slug, ownerName(gone));
      // i file non sono più in uso: li toglie chi ha eliminato il fumetto, se la policy del bucket glielo lascia fare (il
      // proprietario, un admin); altrimenti restano a scripts/clear-profile-media.mjs --orphans
      const files = [...storedPages(gone.pages, gone.owner).map((p) => p.path), ...(comicPathOk(gone.cover_path, gone.owner) ? [gone.cover_path] : [])];
      removeFilesLater(supabase, files);
    }
  }
  redirect(`/${locale}/account#comics`);
}
