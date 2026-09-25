import { revalidateTag, unstable_cache } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { listPublicProfiles, listPublishedSlugs } from "@/lib/community/queries";
import { listTournamentSlugs } from "@/lib/tournament/queries";
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
 * Regola di rigenerazione. Le sitemap sono ISR (`revalidate = 3600` in ogni route, come la vecchia sitemap unica):
 * al massimo un'ora di ritardo. I dati di Supabase (slug e date di mazzi, tornei, profili e tier list) stanno in una
 * cache condivisa (`unstable_cache`, la cache dei dati di Next: su Vercel è comune a tutte le funzioni) con il tag
 * `SITEMAP_TAG`: le 25 sitemap e la build li leggono UNA volta all'ora, non una volta per sitemap (prima 4 query per
 * la sitemap unica; con 25 file senza cache sarebbero state una trentina). Le route che li usano ereditano il tag,
 * quindi `revalidateSitemaps()` (dopo la pubblicazione di un mazzo o di un torneo) rinnova dati e sitemap insieme.
 * Il layout (site) non legge mai Supabase: qui si passa solo dalle route delle sitemap.
 */

/** Tag della cache dei dati della community usati dalle sitemap. */
export const SITEMAP_TAG = "sitemap-community";

/** Secondi di validità della cache dei dati: come le route. */
const DATA_TTL = 3600;

/**
 * Date delle tier list salvate dagli iscritti: la più recente (per /tier-list/community e /tier-list) e quella di
 * ogni utente (la sua pagina pubblica /u/<nome> le mostra). Si legge solo `updated_at` con il nome utente, mai le
 * fasce (`entries`, JSON pesante che alla sitemap non serve): dalla più recente, quindi la prima di ogni utente è la sua.
 */
async function tierListDates(): Promise<CommunityData["tierLists"]> {
  const byUser: Record<string, string> = {};
  const client = supabasePublic();
  if (!client) return { byUser };
  const { data, error } = await client
    .from("tier_lists")
    .select("updated_at, profile:profiles!tier_lists_owner_fkey(username)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[sitemap] tier_lists:", error.message);
    return { byUser };
  }
  const rows = (data ?? []) as unknown as { updated_at: string; profile: { username: string | null } | null }[];
  for (const r of rows) {
    const u = r.profile?.username;
    if (u && !(u in byUser)) byUser[u] = r.updated_at;
  }
  return { latest: rows[0]?.updated_at, byUser };
}

/** Le quattro letture, in parallelo. Il risultato è JSON puro (niente Map): la cache lo serializza. */
async function readCommunity(): Promise<CommunityData> {
  const [decks, tournaments, profiles, tierLists] = await Promise.all([listPublishedSlugs(), listTournamentSlugs(), listPublicProfiles(), tierListDates()]);
  return { decks, tournaments, profiles, tierLists };
}

const cachedCommunity = unstable_cache(readCommunity, ["sitemap-community-v1"], { revalidate: DATA_TTL, tags: [SITEMAP_TAG] });

/** I dati della community per le sitemap; se la lettura fallisce, le sitemap escono senza (mai un errore 500). */
async function communityData(): Promise<CommunityData> {
  try {
    return await cachedCommunity();
  } catch (e) {
    console.error("[sitemap] dati della community non letti:", e instanceof Error ? e.message : e);
    return EMPTY_COMMUNITY;
  }
}

/**
 * Da chiamare dopo una pubblicazione che cambia le sitemap (mazzo pubblicato, modificato o tradotto, torneo creato):
 * alla prossima richiesta dati e sitemap si rigenerano. `expire: 0`: nessuna copia vecchia servita nel frattempo,
 * perché chi legge le sitemap sono i motori, poche volte al giorno. Fuori da una richiesta non fa nulla (la cache
 * scade comunque entro un'ora).
 */
export function revalidateSitemaps(): void {
  try {
    revalidateTag(SITEMAP_TAG, { expire: 0 });
  } catch {
    // fuori da una Server Action o da un route handler: ci pensa la scadenza oraria
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
