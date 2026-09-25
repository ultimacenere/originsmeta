import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { revalidateTag, unstable_cache } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { listPublicProfiles, listPublishedSlugs } from "@/lib/community/queries";
import { supabasePublic } from "@/lib/supabase/public";
import { todayUtc } from "@/lib/lastmod";
import { sitemapIndexXml, urlsetXml } from "@/lib/seoXml";
import {
  COMMUNITY_SECTIONS,
  EMPTY_COMMUNITY,
  homeEntries,
  sectionEntries,
  sitemapIndexEntries,
  sitemapPages,
  type CommunityData,
  type SitemapSection,
} from "@/lib/sitemapEntries";

/**
 * Il lato server delle sitemap divise (Ondata 2, 25/09/2026): legge i dati della community una volta sola per tutte e
 * risponde ai route handler di /sitemap.xml, /sitemap-home.xml e /<lingua>/sitemap-<sezione>.xml.
 *
 * Regola di rigenerazione. I dati di Supabase (slug e date di mazzi, tornei, profili e tier list) stanno in una cache
 * condivisa (`unstable_cache`, la cache dei dati di Next: su Vercel è comune a tutte le funzioni) con il tag
 * `SITEMAP_TAG` e una validità di `DATA_TTL` secondi: le 25 sitemap li leggono una volta sola, non una per sitemap
 * (con 25 file senza cache sarebbero state una trentina di query a ogni giro). Le route sono ISR (`revalidate = 3600`),
 * ma Next prende il più breve fra la route e le cache che usa: l'indice e le sitemap delle pagine, dei mazzi e della
 * community si rigenerano quindi ogni `DATA_TTL` (un mazzo nuovo entra in sitemap entro una decina di minuti), le
 * altre ogni ora (news, guide e carte cambiano solo con un deploy; l'ora serve al taglio "mai nel futuro" delle date).
 * Durante la rigenerazione di una route un dato scaduto della cache si rilegge subito, non in background
 * (node_modules/next/dist/server/web/spec-extension/unstable-cache.js, ramo `isStale`). Le route ereditano il tag,
 * quindi `revalidateSitemaps()` (dopo la pubblicazione di un mazzo o di un torneo) rinnova dati e sitemap insieme.
 *
 * Errori. Una lettura fallita lancia (`readCommunity`), e nessun risultato vuoto finisce in cache: durante la
 * rigenerazione `unstable_cache` risponde con la copia precedente, e se non c'è Next continua a servire la sitemap
 * di prima (guida ISR, "Handling uncaught exceptions"). Solo alla build una lettura fallita dà le sitemap senza
 * community, corrette alla prima rigenerazione. `listPublishedSlugs` e `listPublicProfiles` (src/lib/community/
 * queries.ts) lanciano da soli dal pacchetto DECKS dell'Ondata 2; tornei e tier list si leggono qui.
 *
 * Perché `unstable_cache`: nel progetto le Cache Components (`cacheComponents`) sono spente, e senza di loro è l'unica
 * cache condivisa con tag e scadenza. Se si accendono, va sostituita con la direttiva 'use cache' (cacheTag, cacheLife),
 * come chiede la guida di Next 16 (docs/01-app/03-api-reference/04-functions/unstable_cache.md).
 * Il layout (site) non legge mai Supabase: qui si passa solo dalle route delle sitemap.
 */

/** Tag della cache dei dati della community usati dalle sitemap. */
export const SITEMAP_TAG = "sitemap-community";

/**
 * Versione delle letture, nella chiave della cache. La cache dei dati di Next sopravvive ai deploy, e la chiave
 * contiene solo il testo di `readCommunity`, non quello delle funzioni che chiama: quando cambia una query usata qui
 * (anche in queries.ts, per esempio un filtro sui mazzi) o la forma di `CommunityData`, si aumenta questo numero nello
 * stesso commit, così il deploy non serve per `DATA_TTL` i dati letti con la regola vecchia.
 */
export const SITEMAP_DATA_VERSION = 2;

/** Secondi di validità della cache dei dati: cinque minuti (un giro costa quattro letture leggere). */
const DATA_TTL = 300;

/** Errore di una lettura delle sitemap: non si salva nulla in cache e resta la sitemap di prima. */
class SitemapReadError extends Error {
  constructor(what: string, message: string) {
    super(`[sitemap] ${what}: ${message}`);
    this.name = "SitemapReadError";
  }
}

/** Tornei pubblici non annullati: le regole di `listTournamentSlugs`, ma un errore lancia invece di dare []. */
async function tournamentSlugs(): Promise<CommunityData["tournaments"]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client
    .from("tournaments")
    .select("slug, updated_at")
    .eq("visibility", "public")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new SitemapReadError("tournaments", error.message);
  return (data ?? []) as CommunityData["tournaments"];
}

/**
 * Date delle tier list salvate dagli iscritti: la più recente (per /tier-list/community e /tier-list) e quella di
 * ogni utente (la sua pagina pubblica /u/<nome> le mostra). Si legge solo `updated_at` con il nome utente, mai le
 * fasce (`entries`, JSON pesante che alla sitemap non serve): dalla più recente, quindi la prima di ogni utente è la sua.
 */
async function tierListDates(): Promise<CommunityData["tierLists"]> {
  const client = supabasePublic();
  if (!client) return { byUser: [] };
  const { data, error } = await client
    .from("tier_lists")
    .select("updated_at, profile:profiles!tier_lists_owner_fkey(username)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw new SitemapReadError("tier_lists", error.message);
  const rows = (data ?? []) as unknown as { updated_at: string; profile: { username: string | null } | null }[];
  const byUser = new Map<string, string>();
  for (const r of rows) {
    const u = r.profile?.username;
    if (u && !byUser.has(u)) byUser.set(u, r.updated_at);
  }
  return { latest: rows[0]?.updated_at, byUser: [...byUser] };
}

/** Le quattro letture, in parallelo. Il risultato è JSON puro (niente Map): la cache lo serializza. */
async function readCommunity(): Promise<CommunityData> {
  const [decks, tournaments, profiles, tierLists] = await Promise.all([listPublishedSlugs(), tournamentSlugs(), listPublicProfiles(), tierListDates()]);
  return { decks, tournaments, profiles, tierLists };
}

const cachedCommunity = unstable_cache(readCommunity, [SITEMAP_TAG, `v${SITEMAP_DATA_VERSION}`], { revalidate: DATA_TTL, tags: [SITEMAP_TAG] });

/**
 * I dati della community per le sitemap. Se la lettura fallisce e la cache non ha una copia: alla build le sitemap
 * escono senza community (e si rigenerano dopo `DATA_TTL`); in produzione l'errore sale, e Next tiene la sitemap di prima.
 */
async function communityData(): Promise<CommunityData> {
  try {
    return await cachedCommunity();
  } catch (e) {
    console.error("[sitemap] dati della community non letti:", e instanceof Error ? e.message : e);
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return EMPTY_COMMUNITY;
    throw e;
  }
}

/**
 * Da chiamare dopo una pubblicazione che cambia le sitemap (mazzo pubblicato, modificato, nascosto o tradotto, torneo
 * creato, tier list salvata). Profilo "max", quello raccomandato dalla guida di Next 16: la richiesta seguente riceve
 * ancora la sitemap vecchia e fa partire la rigenerazione, che rilegge i dati; dalla successiva la sitemap è nuova.
 * Così un errore di Supabase in quel momento non lascia i motori senza sitemap (con `expire: 0` non ci sarebbe una
 * copia da servire). Fuori da una Server Action o da un route handler non fa nulla: ci pensa `DATA_TTL`.
 */
export function revalidateSitemaps(): void {
  try {
    revalidateTag(SITEMAP_TAG, "max");
  } catch {
    // fuori da una richiesta: la cache scade comunque entro DATA_TTL
  }
}

const XML_HEADERS = { "content-type": "application/xml; charset=utf-8" };

/** Risposta XML di una sitemap. */
function xml(body: string): Response {
  return new Response(body, { headers: XML_HEADERS });
}

/** /<lingua>/sitemap-<sezione>.xml: le pagine della sezione in quella lingua. Una lingua sconosciuta risponde 404. */
export async function sectionSitemapResponse(section: SitemapSection, params: Promise<{ locale: string }>): Promise<Response> {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not Found", { status: 404 });
  const data = COMMUNITY_SECTIONS.includes(section) ? await communityData() : EMPTY_COMMUNITY;
  return xml(urlsetXml(sectionEntries(sitemapPages(data), section, locale, todayUtc())));
}

/** /sitemap-home.xml: le home delle tre lingue (dipendono solo dai file del repository). */
export function homeSitemapResponse(): Response {
  return xml(urlsetXml(homeEntries(sitemapPages(EMPTY_COMMUNITY), todayUtc())));
}

/** /sitemap.xml: l'indice di tutte le sitemap, con il giorno dell'ultima modifica di ciascuna. */
export async function sitemapIndexResponse(): Promise<Response> {
  return xml(sitemapIndexXml(sitemapIndexEntries(sitemapPages(await communityData()), todayUtc())));
}
