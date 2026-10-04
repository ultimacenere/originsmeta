import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales, type Locale } from "@/lib/i18n";
import { normalizeBadge, publishedDeckCap, type Badge } from "./badges";
import { rowOrThrow, rowsOrThrow } from "./queries";
import { deckSetIndexableLocales, deckSetTableMissing, type CommunityDeckSet, type DeckSetGuide, type DeckSetTranslations } from "./deckSets";

/*
 * Letture dei Mazzi torneo (blocco "04/10/2026: MAZZI TORNEO" di supabase/schema.sql). Come i mazzi singoli
 * (queries.ts): le letture pubbliche filtrano su status = 'published' e lanciano sugli errori, così l'ISR tiene la pagina
 * di prima; la tabella che non c'è ancora (migrazione non applicata) vale "nessun mazzo torneo", senza errore, così il
 * codice può andare online prima dello schema.
 */
const PUBLISHED = "published";

const SET_SELECT =
  "id, slug, owner, name, decks, legendaries, guide, translations, videos, links, status, created_at, updated_at, profile:profiles!community_deck_sets_owner_fkey(username, display_name, avatar_url, badge)";
/** Le liste non scaricano video e link: li mostra solo la scheda del trio. */
const LIST_SELECT =
  "id, slug, owner, name, decks, legendaries, guide, translations, status, created_at, updated_at, profile:profiles!community_deck_sets_owner_fkey(username, display_name, avatar_url, badge)";

type ReadResult = { data: unknown; error: { code?: string; message: string } | null };

/** Le righe di una lettura pubblica: vuota se la tabella non c'è ancora, errore lanciato per il resto. */
function setRows(what: string, res: ReadResult): CommunityDeckSet[] {
  if (deckSetTableMissing(res.error)) return [];
  return rowsOrThrow<CommunityDeckSet>(what, res);
}

/** Media voti dei trii; la vista che manca vale "nessun voto". `lenient` per il pannello privato /account. */
async function withSetRatings(client: Db, sets: CommunityDeckSet[], lenient = false): Promise<CommunityDeckSet[]> {
  if (!sets.length) return sets;
  const res = await client
    .from("deck_set_ratings")
    .select("set_id, avg_stars, votes")
    .in(
      "set_id",
      sets.map((s) => s.id),
    );
  if (res.error && (lenient || deckSetTableMissing(res.error))) {
    if (lenient) console.error("[deck-sets] deck_set_ratings:", res.error.message);
    return sets.map((s) => ({ ...s, rating: { avg: 0, votes: 0 } }));
  }
  const rows = rowsOrThrow<{ set_id: string; avg_stars: number | string; votes: number | string }>("deck_set_ratings", res);
  const map = new Map(rows.map((r) => [r.set_id, { avg: Number(r.avg_stars), votes: Number(r.votes) }]));
  return sets.map((s) => ({ ...s, rating: map.get(s.id) ?? { avg: 0, votes: 0 } }));
}

/** Mazzi torneo pubblicati, dal più recente, con autore e media voti. Vuoto con la community spenta o senza migrazione. */
export async function listPublishedDeckSets(limit = 200): Promise<CommunityDeckSet[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await client.from("community_deck_sets").select(LIST_SELECT).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit);
  return withSetRatings(client, setRows("listPublishedDeckSets", res));
}

/** Un mazzo torneo pubblicato; null solo se la lettura riesce e il trio non c'è (404 vera) o la tabella manca. */
export async function getDeckSet(slug: string): Promise<CommunityDeckSet | null> {
  const client = supabasePublic();
  if (!client) return null;
  const res = await client.from("community_deck_sets").select(SET_SELECT).eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  if (deckSetTableMissing(res.error)) return null;
  const set = rowOrThrow<CommunityDeckSet>("getDeckSet", res);
  if (!set) return null;
  const [rated] = await withSetRatings(client, [set]);
  return rated;
}

/** Mazzi torneo pubblicati di un utente, dal più recente (profilo pubblico /u). */
export async function listDeckSetsByOwner(userId: string, limit = 50): Promise<CommunityDeckSet[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await client.from("community_deck_sets").select(LIST_SELECT).eq("owner", userId).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit);
  return withSetRatings(client, setRows("listDeckSetsByOwner", res));
}

/**
 * Tutti i mazzi torneo di un utente, anche nascosti: client con la sessione dell'utente (pannello privato /account,
 * dinamico). Un errore resta una lista vuota, come `listUserDecks`.
 */
export async function listUserDeckSets(client: Db, userId: string): Promise<CommunityDeckSet[]> {
  const { data, error } = await client.from("community_deck_sets").select(LIST_SELECT).eq("owner", userId).order("updated_at", { ascending: false });
  if (error) {
    if (!deckSetTableMissing(error)) console.error("[deck-sets] listUserDeckSets:", error.message);
    return [];
  }
  return withSetRatings(client, (data ?? []) as unknown as CommunityDeckSet[], true);
}

/** Un mazzo torneo dell'utente per la pagina di modifica (anche nascosto); lo staff legge anche quelli degli altri (RLS). */
export async function getOwnDeckSet(client: Db, slug: string): Promise<CommunityDeckSet | null> {
  const { data, error } = await client.from("community_deck_sets").select(SET_SELECT).eq("slug", slug).maybeSingle();
  if (error) {
    if (!deckSetTableMissing(error)) console.error("[deck-sets] getOwnDeckSet:", error.message);
    return null;
  }
  return (data ?? null) as unknown as CommunityDeckSet | null;
}

/** Quanti mazzi torneo ha un utente (pubblicati e nascosti) e quanti ne può avere: lo stesso tetto dei mazzi singoli. */
export async function deckSetLimit(client: Db, userId: string): Promise<{ used: number; cap: number; badge: Badge }> {
  const { count } = await client.from("community_deck_sets").select("id", { count: "exact", head: true }).eq("owner", userId);
  const { data } = await client.from("profiles").select("role, badge").eq("id", userId).maybeSingle();
  const p = data as { role: string | null; badge: string | null } | null;
  return { used: count ?? 0, cap: publishedDeckCap(p), badge: normalizeBadge(p?.badge) };
}

/** Una riga della sitemap per un mazzo torneo: le lingue in cui la pagina si indicizza (mai un elenco vuoto). */
export type SitemapDeckSet = { slug: string; updated_at: string; locales: Locale[] };

/**
 * I mazzi torneo per la sitemap: solo quelli sopra la soglia di parole, ognuno con le sue lingue; `latest` è la data
 * dell'ultimo trio pubblicato o modificato (lastmod di /decks/tournament). Con un errore lancia.
 */
export async function listDeckSetIndex(): Promise<{ sets: SitemapDeckSet[]; latest?: string }> {
  const client = supabasePublic();
  if (!client) return { sets: [] };
  const res = await client.from("community_deck_sets").select("slug, updated_at, guide, translations").eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(1000);
  if (deckSetTableMissing(res.error)) return { sets: [] };
  const rows = rowsOrThrow<{ slug: string; updated_at: string; guide: DeckSetGuide; translations?: DeckSetTranslations | null }>("listDeckSetIndex", res);
  const sets = rows.map((r) => ({ slug: r.slug, updated_at: r.updated_at, locales: deckSetIndexableLocales(r, locales) })).filter((r) => r.locales.length > 0);
  const latest = rows.reduce<string | undefined>((max, r) => (!max || r.updated_at > max ? r.updated_at : max), undefined);
  return latest ? { sets, latest } : { sets };
}
