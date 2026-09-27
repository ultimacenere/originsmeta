import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales, type Locale } from "@/lib/i18n";
import { CommunityReadError } from "./queries";
import { canPublishGuides } from "./badges";
import {
  DEFAULT_GUIDE_COVER,
  GUIDE_CATEGORIES,
  guideTableMissing,
  isCoverPreset,
  isGuideCategory,
  sitemapCommunityGuides,
  storedSections,
  type CommunityGuide,
  type CommunityGuideListItem,
  type CommunityGuideStatus,
  type CommunityGuideTranslations,
  type GuideListTranslation,
  type SitemapCommunityGuide,
} from "./guides";

/**
 * Letture delle guide della community (pacchetto GUIDE, 27/09/2026): pagina pubblica, sezione di /guides, elenco
 * /guides/community, profilo /u, sitemap (client anonimo, ISR) e pannello privato /account (client con la sessione).
 *
 * Gli ELENCHI leggono colonne leggere: niente sezioni, video e traduzioni intere (una guida piena con due traduzioni
 * pesa più di 100 KB e una lettura di 60 guide supererebbe i 2 MB della cache dei dati di Next), ma parole e impronta
 * salvate dal sito (`words`, `text_hash`) e, per ogni lingua, impronta, data e riassunto della traduzione
 * (`translations->it->>hash`…). Con quelle `guideShapeIndexing` (guides.ts) decide dove una guida si indicizza, come fa
 * la pagina con il testo intero. Solo la pagina di una guida e la sua modifica leggono tutto.
 *
 * Errori come nel resto della community (queries.ts, DECKS-12): nelle letture pubbliche un errore lancia e l'ISR tiene
 * la pagina di prima. Unica eccezione, voluta: la tabella che ancora non c'è (codice online prima della migrazione,
 * 42P01 o PGRST205; colonne mancanti 42703). Allora si risponde "nessuna guida" e il sito resta com'era, e per
 * `MISSING_RETRY_MS` non si chiede più; poi si riprova, così dopo la migrazione un'istanza accesa torna a leggere da
 * sola, senza un nuovo deploy (lo stesso schema di `missingUntil` in creators.ts).
 */

const AUTHOR = "profile:profiles!community_guides_owner_fkey(username, display_name, avatar_url, badge)";
/** Colonne di base di una voce di elenco (le stesse per la sitemap, senza l'autore). */
const BASE_COLUMNS = "id, slug, owner, lang, title, summary, category, cover_preset, cover_path, status, words, text_hash, created_at, updated_at, published_at";
/** Di ogni traduzione solo impronta, data e riassunto: `tr_it_hash`, `tr_it_at`, `tr_it_summary`… */
const TRANSLATION_COLUMNS = locales.map((l) => `tr_${l}_hash:translations->${l}->>hash, tr_${l}_at:translations->${l}->>at, tr_${l}_summary:translations->${l}->guide->>summary`).join(", ");
const LIST_COLUMNS = `${BASE_COLUMNS}, ${TRANSLATION_COLUMNS}, ${AUTHOR}`;
const INDEX_COLUMNS = `${BASE_COLUMNS}, ${TRANSLATION_COLUMNS}`;
/** Una guida intera (pagina pubblica e modifica). */
const FULL_COLUMNS = `id, slug, owner, lang, title, summary, sections, category, cards, videos, links, cover_preset, cover_path, status, translations, words, text_hash, created_at, updated_at, published_at, ${AUTHOR}`;
const PUBLISHED: CommunityGuideStatus = "published";

const MISSING_RETRY_MS = 5 * 60_000;
const tableState = { missingUntil: 0, logged: false };

function readable(): boolean {
  return Date.now() >= tableState.missingUntil;
}

/** La tabella manca ancora? Lo si scrive nei log una volta sola, e per un po' non si chiede più. */
function missing(error: { code?: string; message: string } | null): boolean {
  if (!guideTableMissing(error)) return false;
  tableState.missingUntil = Date.now() + MISSING_RETRY_MS;
  if (!tableState.logged) {
    tableState.logged = true;
    console.error("[community] manca la tabella community_guides (o una sua colonna): va applicata la migrazione del pacchetto GUIDE (supabase/wave2-GUIDE.sql)");
  }
  return true;
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const langOf = (v: unknown): Locale => ((locales as readonly string[]).includes(String(v)) ? (v as Locale) : "en");
const statusOf = (v: unknown): CommunityGuideStatus => (v === "published" || v === "hidden" ? v : "draft");
const profileOf = (v: unknown): CommunityGuide["profile"] => (v && typeof v === "object" && !Array.isArray(v) ? (v as CommunityGuide["profile"]) : null);

/** Dalla riga intera ai dati mostrati: sezioni, carte, lingua, categoria e copertina ricontrollate. */
export function toGuide(row: Row): CommunityGuide {
  const translations = row.translations && typeof row.translations === "object" && !Array.isArray(row.translations) ? (row.translations as CommunityGuideTranslations) : null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    owner: String(row.owner),
    lang: langOf(row.lang),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    sections: storedSections(row.sections),
    category: isGuideCategory(row.category) ? row.category : GUIDE_CATEGORIES[1],
    cards: Array.isArray(row.cards) ? row.cards.filter((c): c is string => typeof c === "string") : [],
    videos: (row.videos as CommunityGuide["videos"]) ?? null,
    links: (row.links as CommunityGuide["links"]) ?? null,
    cover_preset: isCoverPreset(row.cover_preset) ? row.cover_preset : DEFAULT_GUIDE_COVER,
    cover_path: str(row.cover_path),
    status: statusOf(row.status),
    translations,
    words: typeof row.words === "number" ? row.words : null,
    text_hash: str(row.text_hash),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: str(row.published_at),
    profile: profileOf(row.profile),
  };
}

/** Dalla riga leggera di un elenco alla voce: le traduzioni ridotte a impronta, data e riassunto. */
export function toListItem(row: Row): CommunityGuideListItem {
  const tr: Partial<Record<Locale, GuideListTranslation>> = {};
  for (const l of locales) {
    const t = { hash: str(row[`tr_${l}_hash`]), at: str(row[`tr_${l}_at`]), summary: str(row[`tr_${l}_summary`]) };
    if (t.hash || t.summary) tr[l] = t;
  }
  return {
    id: String(row.id),
    slug: String(row.slug),
    owner: String(row.owner),
    lang: langOf(row.lang),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    category: isGuideCategory(row.category) ? row.category : GUIDE_CATEGORIES[1],
    cover_preset: isCoverPreset(row.cover_preset) ? row.cover_preset : DEFAULT_GUIDE_COVER,
    cover_path: str(row.cover_path),
    status: statusOf(row.status),
    words: typeof row.words === "number" ? row.words : null,
    text_hash: str(row.text_hash),
    tr,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: str(row.published_at),
    profile: profileOf(row.profile),
  };
}

const rows = (data: unknown): Row[] => (Array.isArray(data) ? (data as Row[]) : []);

/**
 * Guide pubblicate, dalla più recente (data della prima pubblicazione), fino a 200 (righe leggere: qualche centinaio di
 * KB, sotto il tetto della cache dei dati; la stessa lettura serve /guides, /guides/community e le "altre guide").
 * Vuoto con la community spenta o la tabella mancante.
 */
export async function listPublishedGuides(limit = 200): Promise<CommunityGuideListItem[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit);
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listPublishedGuides", res.error.message);
  return rows(res.data).map(toListItem);
}

/** Una guida pubblicata; null se la lettura riesce e non c'è (404 vera) o se la tabella manca. Con un errore lancia. */
export async function getPublishedGuide(slug: string): Promise<CommunityGuide | null> {
  const client = supabasePublic();
  if (!client || !readable() || !/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const res = await client.from("community_guides").select(FULL_COLUMNS).eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  if (missing(res.error)) return null;
  if (res.error) throw new CommunityReadError("getPublishedGuide", res.error.message);
  return res.data ? toGuide(res.data as unknown as Row) : null;
}

/** Guide pubblicate di un iscritto (la sua pagina /u). Con un errore lancia; vuoto con la tabella mancante. */
export async function listGuidesByOwner(ownerId: string, limit = 50): Promise<CommunityGuideListItem[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("owner", ownerId).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit);
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listGuidesByOwner", res.error.message);
  return rows(res.data).map(toListItem);
}

/**
 * Tutte le guide di un utente, bozze e nascoste comprese (pannello privato /account, client con la sessione). Come le
 * altre letture del pannello un errore non rompe la pagina: `status` dice che cosa mostrare.
 */
export async function listOwnGuides(client: Db, userId: string): Promise<{ status: "ok" | "missing" | "error"; guides: CommunityGuideListItem[] }> {
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("owner", userId).order("updated_at", { ascending: false }).limit(100);
  if (guideTableMissing(res.error)) return { status: "missing", guides: [] };
  if (res.error) {
    console.error("[community] listOwnGuides:", res.error.message);
    return { status: "error", guides: [] };
  }
  return { status: "ok", guides: rows(res.data).map(toListItem) };
}

/** Una guida qualsiasi (anche bozza o nascosta) come la vede chi ha fatto l'accesso: pagina di modifica. */
export async function getGuideForEdit(client: Db, slug: string): Promise<{ status: "ok" | "missing" | "error"; guide: CommunityGuide | null }> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return { status: "ok", guide: null };
  const res = await client.from("community_guides").select(FULL_COLUMNS).eq("slug", slug).maybeSingle();
  if (guideTableMissing(res.error)) return { status: "missing", guide: null };
  if (res.error) {
    console.error("[community] getGuideForEdit:", res.error.message);
    return { status: "error", guide: null };
  }
  return { status: "ok", guide: res.data ? toGuide(res.data as unknown as Row) : null };
}

/**
 * Ruolo e permessi di chi ha fatto l'accesso (Server Action e pagine dinamiche): può pubblicare guide? È dello staff?
 * Stesse regole di `canPublishGuides` (badges.ts) e di `is_staff()` nel database.
 */
export async function guideRoleOf(client: Db, userId: string): Promise<{ canPublish: boolean; staff: boolean; username: string | null }> {
  const { data } = await client.from("profiles").select("role, badge, username").eq("id", userId).maybeSingle();
  const p = data as { role: string | null; badge: string | null; username: string | null } | null;
  return { canPublish: canPublishGuides(p?.badge, p?.role), staff: p?.role === "admin" || p?.badge === "staff", username: p?.username ?? null };
}

/**
 * Le guide per la sitemap (`sitemapCommunityGuides` in guides.ts, con test): solo quelle sopra la soglia di parole, con
 * le lingue in cui la pagina si indicizza e la data di ogni versione; per lingua il lastmod di /guides e di
 * /guides/community. Con la tabella mancante nessuna guida; con un altro errore lancia (la sitemap resta quella di prima).
 */
export async function listGuideIndex(): Promise<{ guides: SitemapCommunityGuide[]; hub: Partial<Record<Locale, string>>; list: Partial<Record<Locale, string>> }> {
  const empty = { guides: [], hub: {}, list: {} };
  const client = supabasePublic();
  if (!client || !readable()) return empty;
  const res = await client.from("community_guides").select(INDEX_COLUMNS).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(1000);
  if (missing(res.error)) return empty;
  if (res.error) throw new CommunityReadError("listGuideIndex", res.error.message);
  return sitemapCommunityGuides(rows(res.data).map(toListItem), locales);
}
