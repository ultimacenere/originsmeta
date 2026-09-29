import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales, type Locale } from "@/lib/i18n";
import { CommunityReadError } from "./queries";
import { canPublishComics } from "./badges";
import {
  comicTableMissing,
  sitemapComics,
  storedEditions,
  storedPages,
  type ComicListEdition,
  type ComicListItem,
  type ComicListTranslation,
  type ComicStatus,
  type ComicTranslations,
  type CommunityComic,
  type SitemapComic,
} from "./comics";

/**
 * Letture dei fumetti (pacchetto FUMETTI, 29/09/2026): news e home, pagina del fumetto, elenco /news/comics, profilo /u,
 * sitemap (client anonimo, ISR) e pannello privato /account (client con la sessione). Stesso schema delle guide della
 * community (guideQueries.ts): gli ELENCHI leggono colonne leggere (niente tavole né traduzioni intere, solo impronta,
 * data e presentazione di ogni traduzione); nelle letture pubbliche un errore lancia e l'ISR tiene la pagina di prima;
 * la tabella che non c'è ancora (codice online prima della migrazione) vale "nessun fumetto" e per 5 minuti non si
 * chiede più, poi si riprova. Lo stesso per le versioni disegnate (colonna `editions`, blocco FUMETTI IN PIÙ LINGUE del
 * 30/09/2026): senza la colonna si legge senza, e i fumetti restano (con le sole tavole originali).
 */

const AUTHOR = "profile:profiles!community_comics_owner_fkey(username, display_name, avatar_url, badge)";
const BASE_COLUMNS = "id, slug, owner, lang, title, summary, cover_path, status, text_hash, created_at, updated_at, published_at";
/** Di ogni traduzione solo impronta, data, presentazione e titolo: `tr_it_hash`, `tr_it_at`, `tr_it_summary`, `tr_it_title`… */
const TRANSLATION_COLUMNS = locales
  .map((l) => `tr_${l}_hash:translations->${l}->>hash, tr_${l}_at:translations->${l}->>at, tr_${l}_summary:translations->${l}->comic->>summary, tr_${l}_title:translations->${l}->comic->>title`)
  .join(", ");
/** Di ogni versione disegnata titolo, presentazione, copertina e il file della prima tavola: `ed_it_title`, `ed_it_page`… */
const EDITION_COLUMNS = locales
  .map((l) => `ed_${l}_title:editions->${l}->>title, ed_${l}_summary:editions->${l}->>summary, ed_${l}_cover:editions->${l}->>cover_path, ed_${l}_page:editions->${l}->pages->0->>path`)
  .join(", ");
const PUBLISHED: ComicStatus = "published";

/** Le colonne di una lettura, con o senza le versioni disegnate (senza: la colonna non c'è ancora). */
const COLUMNS = {
  list: (ed: boolean) => `${BASE_COLUMNS}, ${TRANSLATION_COLUMNS}${ed ? `, ${EDITION_COLUMNS}` : ""}, ${AUTHOR}`,
  index: (ed: boolean) => `${BASE_COLUMNS}, ${TRANSLATION_COLUMNS}${ed ? `, ${EDITION_COLUMNS}` : ""}`,
  full: (ed: boolean) => `${BASE_COLUMNS}, pages, translations${ed ? ", editions" : ""}, ${AUTHOR}`,
};

const MISSING_RETRY_MS = 5 * 60_000;
const tableState = { missingUntil: 0, logged: false };
const editionsState = { missingUntil: 0, logged: false };

function readable(): boolean {
  return Date.now() >= tableState.missingUntil;
}

/** Manca la colonna delle versioni disegnate (o quella degli indirizzi di prima)? Postgres 42703, PostgREST PGRST204. */
export function editionsColumnMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error || !/\beditions\b|\bformer_slugs\b/.test(error.message ?? "")) return false;
  return error.code === "42703" || error.code === "PGRST204" || /does not exist|could not find/i.test(error.message ?? "");
}

/**
 * Una lettura con le versioni disegnate e, se la colonna non c'è ancora, di nuovo senza (per 5 minuti non la si chiede
 * più). Va fatta PRIMA del controllo della tabella mancante, che scambierebbe la colonna per la tabella.
 */
async function withEditions<R extends { error: { code?: string; message: string } | null }>(run: (ed: boolean) => PromiseLike<R>): Promise<R> {
  if (Date.now() >= editionsState.missingUntil) {
    const res = await run(true);
    if (!editionsColumnMissing(res.error)) return res;
    editionsState.missingUntil = Date.now() + MISSING_RETRY_MS;
    if (!editionsState.logged) {
      editionsState.logged = true;
      console.error("[community] manca la colonna community_comics.editions: va applicata la migrazione del blocco FUMETTI IN PIÙ LINGUE di supabase/schema.sql");
    }
  }
  return run(false);
}

/** La tabella manca ancora? Lo si scrive nei log una volta sola, e per un po' non si chiede più. */
function missing(error: { code?: string; message: string } | null): boolean {
  if (!comicTableMissing(error)) return false;
  tableState.missingUntil = Date.now() + MISSING_RETRY_MS;
  if (!tableState.logged) {
    tableState.logged = true;
    console.error("[community] manca la tabella community_comics (o una sua colonna): va applicata la migrazione del pacchetto FUMETTI (blocco FUMETTI di supabase/schema.sql)");
  }
  return true;
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const langOf = (v: unknown): Locale => ((locales as readonly string[]).includes(String(v)) ? (v as Locale) : "en");
const statusOf = (v: unknown): ComicStatus => (v === "published" || v === "hidden" ? v : "draft");
const profileOf = (v: unknown): CommunityComic["profile"] => (v && typeof v === "object" && !Array.isArray(v) ? (v as CommunityComic["profile"]) : null);

/** Dalla riga intera ai dati mostrati: tavole, versioni disegnate, lingua e stato ricontrollati. */
export function toComic(row: Row): CommunityComic {
  const translations = row.translations && typeof row.translations === "object" && !Array.isArray(row.translations) ? (row.translations as ComicTranslations) : null;
  const owner = String(row.owner);
  const lang = langOf(row.lang);
  return {
    id: String(row.id),
    slug: String(row.slug),
    owner,
    lang,
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    pages: storedPages(row.pages, owner),
    cover_path: str(row.cover_path),
    status: statusOf(row.status),
    translations,
    editions: storedEditions(row.editions, owner, lang),
    text_hash: str(row.text_hash),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: str(row.published_at),
    profile: profileOf(row.profile),
  };
}

/** Dalla riga leggera di un elenco alla voce: le traduzioni ridotte a impronta, data e presentazione, le versioni disegnate a titolo, presentazione, copertina e prima tavola. */
export function toComicListItem(row: Row): ComicListItem {
  const tr: Partial<Record<Locale, ComicListTranslation>> = {};
  const ed: Partial<Record<Locale, ComicListEdition>> = {};
  for (const l of locales) {
    const t = { hash: str(row[`tr_${l}_hash`]), at: str(row[`tr_${l}_at`]), summary: str(row[`tr_${l}_summary`]), title: str(row[`tr_${l}_title`]) };
    if (t.hash || t.summary) tr[l] = t;
    const e = { title: str(row[`ed_${l}_title`]), summary: str(row[`ed_${l}_summary`]), cover_path: str(row[`ed_${l}_cover`]), page: str(row[`ed_${l}_page`]) };
    if (e.title || e.summary || e.page) ed[l] = e;
  }
  return {
    id: String(row.id),
    slug: String(row.slug),
    owner: String(row.owner),
    lang: langOf(row.lang),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    cover_path: str(row.cover_path),
    status: statusOf(row.status),
    text_hash: str(row.text_hash),
    tr,
    ed,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: str(row.published_at),
    profile: profileOf(row.profile),
  };
}

const rows = (data: unknown): Row[] => (Array.isArray(data) ? (data as Row[]) : []);

/**
 * Fumetti pubblicati, dal più recente (prima pubblicazione), fino a `limit`: home e /news ne mostrano pochi, l'elenco
 * /news/comics tutti. Vuoto con la community spenta o la tabella mancante; con un altro errore lancia.
 */
export async function listPublishedComics(limit = 100): Promise<ComicListItem[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.list(ed)).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit));
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listPublishedComics", res.error.message);
  return rows(res.data).map(toComicListItem);
}

/** Un fumetto pubblicato; null se la lettura riesce e non c'è (404 vera) o se la tabella manca. Con un errore lancia. */
export async function getPublishedComic(slug: string): Promise<CommunityComic | null> {
  const client = supabasePublic();
  if (!client || !readable() || !/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.full(ed)).eq("slug", slug).eq("status", PUBLISHED).maybeSingle());
  if (missing(res.error)) return null;
  if (res.error) throw new CommunityReadError("getPublishedComic", res.error.message);
  return res.data ? toComic(res.data as unknown as Row) : null;
}

/**
 * Il fumetto pubblicato in cui è stato unito quello con questo indirizzo (colonna `former_slugs`, scritta da
 * scripts/merge-comics.mjs): la pagina di un indirizzo che non c'è più ci porta con un 308. Null se non c'è, se la
 * colonna manca ancora o con un errore (allora la pagina resta una 404, e l'ISR riprova).
 */
export async function comicMovedTo(slug: string): Promise<string | null> {
  const client = supabasePublic();
  if (!client || !readable() || !/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const res = await client.from("community_comics").select("slug").contains("former_slugs", [slug]).eq("status", PUBLISHED).order("published_at", { ascending: true }).limit(1);
  if (res.error) {
    if (!editionsColumnMissing(res.error)) console.error("[community] comicMovedTo:", res.error.message);
    return null;
  }
  const first = rows(res.data)[0];
  return first && typeof first.slug === "string" ? first.slug : null;
}

/** Fumetti pubblicati di un iscritto (la sua pagina /u). Con un errore lancia; vuoto con la tabella mancante. */
export async function listComicsByOwner(ownerId: string, limit = 50): Promise<ComicListItem[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.list(ed)).eq("owner", ownerId).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit));
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listComicsByOwner", res.error.message);
  return rows(res.data).map(toComicListItem);
}

/**
 * Tutti i fumetti di un utente, bozze e nascosti compresi (pannello privato /account, client con la sessione). Un errore
 * non rompe la pagina: `status` dice che cosa mostrare.
 */
export async function listOwnComics(client: Db, userId: string): Promise<{ status: "ok" | "missing" | "error"; comics: ComicListItem[] }> {
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.list(ed)).eq("owner", userId).order("updated_at", { ascending: false }).limit(200));
  if (comicTableMissing(res.error)) return { status: "missing", comics: [] };
  if (res.error) {
    console.error("[community] listOwnComics:", res.error.message);
    return { status: "error", comics: [] };
  }
  return { status: "ok", comics: rows(res.data).map(toComicListItem) };
}

/** Un fumetto qualsiasi (anche bozza o nascosto) come lo vede chi ha fatto l'accesso: pagina di modifica. */
export async function getComicForEdit(client: Db, slug: string): Promise<{ status: "ok" | "missing" | "error"; comic: CommunityComic | null }> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return { status: "ok", comic: null };
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.full(ed)).eq("slug", slug).maybeSingle());
  if (comicTableMissing(res.error)) return { status: "missing", comic: null };
  if (res.error) {
    console.error("[community] getComicForEdit:", res.error.message);
    return { status: "error", comic: null };
  }
  return { status: "ok", comic: res.data ? toComic(res.data as unknown as Row) : null };
}

/** Ruolo di chi ha fatto l'accesso: può pubblicare fumetti? È dello staff? (canPublishComics di badges.ts, is_staff del database) */
export async function comicRoleOf(client: Db, userId: string): Promise<{ canPublish: boolean; staff: boolean; username: string | null }> {
  const { data } = await client.from("profiles").select("role, badge, username").eq("id", userId).maybeSingle();
  const p = data as { role: string | null; badge: string | null; username: string | null } | null;
  return { canPublish: canPublishComics(p?.badge, p?.role), staff: p?.role === "admin" || p?.badge === "staff", username: p?.username ?? null };
}

/**
 * I fumetti per la sitemap (sezione news) e per il lastmod di /news e della home (`sitemapComics` in comics.ts). Con la
 * tabella mancante nessun fumetto; con un altro errore lancia (la sitemap resta quella di prima).
 */
export async function listComicIndex(): Promise<{ comics: SitemapComic[]; latest?: string }> {
  const client = supabasePublic();
  if (!client || !readable()) return { comics: [] };
  const res = await withEditions((ed) => client.from("community_comics").select(COLUMNS.index(ed)).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(1000));
  if (missing(res.error)) return { comics: [] };
  if (res.error) throw new CommunityReadError("listComicIndex", res.error.message);
  return sitemapComics(rows(res.data).map(toComicListItem), locales);
}
