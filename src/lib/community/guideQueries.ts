import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales, type Locale } from "@/lib/i18n";
import { CommunityReadError } from "./queries";
import { canPublishGuides } from "./badges";
import {
  GUIDE_CATEGORIES,
  GUIDE_COVER_PRESETS,
  guideTableMissing,
  isCoverPreset,
  isGuideCategory,
  sitemapCommunityGuides,
  storedSections,
  type CommunityGuide,
  type CommunityGuideStatus,
  type CommunityGuideTranslations,
  type SitemapCommunityGuide,
} from "./guides";

/**
 * Letture delle guide della community (pacchetto GUIDE, 27/09/2026): pagina pubblica, sezione di /guides, profilo /u,
 * sitemap (client anonimo, ISR) e pannello privato /account (client con la sessione).
 *
 * Errori come nel resto della community (queries.ts, DECKS-12): nelle letture pubbliche un errore lancia e l'ISR tiene
 * la pagina di prima. Unica eccezione, voluta: la tabella che ancora non c'è (codice online prima della migrazione,
 * 42P01 o PGRST205; colonne mancanti 42703). Allora si risponde "nessuna guida" e il sito resta com'era, e per
 * `MISSING_RETRY_MS` non si chiede più; poi si riprova, così dopo la migrazione un'istanza accesa torna a leggere da
 * sola, senza un nuovo deploy (lo stesso schema di `missingUntil` in creators.ts).
 */

/** Colonne delle liste (senza video e risorse, che mostra solo la pagina della guida). */
const LIST_COLUMNS =
  "id, slug, owner, lang, title, summary, sections, category, cards, cover_preset, cover_path, status, translations, created_at, updated_at, published_at, profile:profiles!community_guides_owner_fkey(username, display_name, avatar_url, badge)";
const FULL_COLUMNS = `${LIST_COLUMNS}, videos, links`;
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
    console.error("[community] manca la tabella community_guides: va applicata la migrazione del pacchetto GUIDE (supabase/wave2-GUIDE.sql)");
  }
  return true;
}

type Row = Omit<CommunityGuide, "sections" | "lang" | "category" | "cover_preset" | "cards"> & {
  sections: unknown;
  lang: string;
  category: string;
  cover_preset: string;
  cards: unknown;
  translations?: unknown;
};

/** Dalla riga del database ai dati mostrati: sezioni, carte, lingua, categoria e copertina ricontrollate. */
export function toGuide(row: Row): CommunityGuide {
  const lang = (locales as readonly string[]).includes(row.lang) ? (row.lang as Locale) : "en";
  const translations = row.translations && typeof row.translations === "object" && !Array.isArray(row.translations) ? (row.translations as CommunityGuideTranslations) : null;
  return {
    ...row,
    lang,
    sections: storedSections(row.sections),
    category: isGuideCategory(row.category) ? row.category : GUIDE_CATEGORIES[1],
    cover_preset: isCoverPreset(row.cover_preset) ? row.cover_preset : GUIDE_COVER_PRESETS[0],
    cards: Array.isArray(row.cards) ? row.cards.filter((c): c is string => typeof c === "string") : [],
    translations,
  };
}

/** Guide pubblicate, dalla più recente (data della prima pubblicazione). Vuoto con la community spenta o la tabella mancante. */
export async function listPublishedGuides(limit = 60): Promise<CommunityGuide[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit);
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listPublishedGuides", res.error.message);
  return ((res.data ?? []) as unknown as Row[]).map(toGuide);
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
export async function listGuidesByOwner(ownerId: string, limit = 50): Promise<CommunityGuide[]> {
  const client = supabasePublic();
  if (!client || !readable()) return [];
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("owner", ownerId).eq("status", PUBLISHED).order("published_at", { ascending: false }).limit(limit);
  if (missing(res.error)) return [];
  if (res.error) throw new CommunityReadError("listGuidesByOwner", res.error.message);
  return ((res.data ?? []) as unknown as Row[]).map(toGuide);
}

/**
 * Tutte le guide di un utente, bozze e nascoste comprese (pannello privato /account, client con la sessione). Come le
 * altre letture del pannello un errore non rompe la pagina: `status` dice che cosa mostrare.
 */
export async function listOwnGuides(client: Db, userId: string): Promise<{ status: "ok" | "missing" | "error"; guides: CommunityGuide[] }> {
  const res = await client.from("community_guides").select(LIST_COLUMNS).eq("owner", userId).order("updated_at", { ascending: false }).limit(100);
  if (guideTableMissing(res.error)) return { status: "missing", guides: [] };
  if (res.error) {
    console.error("[community] listOwnGuides:", res.error.message);
    return { status: "error", guides: [] };
  }
  return { status: "ok", guides: ((res.data ?? []) as unknown as Row[]).map(toGuide) };
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
 * le lingue in cui la pagina si indicizza; `latest` per il lastmod di /guides. Con la tabella mancante nessuna guida;
 * con un altro errore lancia (la sitemap resta quella di prima).
 */
export async function listGuideIndex(): Promise<{ guides: SitemapCommunityGuide[]; latest?: string }> {
  const client = supabasePublic();
  if (!client || !readable()) return { guides: [] };
  const res = await client
    .from("community_guides")
    .select("slug, updated_at, lang, summary, sections, translations, status")
    .eq("status", PUBLISHED)
    .order("published_at", { ascending: false })
    .limit(1000);
  if (missing(res.error)) return { guides: [] };
  if (res.error) throw new CommunityReadError("listGuideIndex", res.error.message);
  const rows = ((res.data ?? []) as unknown as Row[]).map(toGuide);
  return sitemapCommunityGuides(rows, locales);
}
