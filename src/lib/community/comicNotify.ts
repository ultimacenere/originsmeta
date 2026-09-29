import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { locales, type Locale } from "@/lib/i18n";
import { discordWebhookUrl, sendDiscordWebhook } from "@/lib/discordWebhook";
import type { Db } from "@/lib/supabase/public";
import { comicPayload, type AnnouncedComic } from "./comicDiscord";
import { comicImageUrl, comicPathOk } from "./comics";
import { notifyFollowers } from "./notify";

/**
 * Avvisi di un fumetto appena pubblicato (pacchetto FUMETTI, 29/09/2026), dopo la risposta al browser (`after()`), mai
 * un'eccezione verso chi pubblica:
 *
 * - `announceComic`: la PRIMA pubblicazione va sul nostro Discord (regola del 24/09/2026: "quello che si pubblica sul sito
 *   arriva da solo sul nostro Discord"). INTERRUTTORE: DISCORD_WEBHOOK_COMICS (Vercel → Settings → Environment Variables,
 *   solo server, poi un deploy): il webhook del canale scelto da Pierluigi (per esempio #announcements o #site-news, come
 *   le news). Senza, niente. Il fumetto si rilegge con il client anonimo e senza cache: parte solo se è davvero pubblico.
 * - `notifyComicFollowers`: avvisi a chi segue l'autore (pacchetto SEGUI): `notifyFollowers` con il tipo
 *   "comic_published", il PROPRIETARIO del fumetto e il suo slug.
 */

const TIMEOUT_MS = 3000;

function runLater(job: () => Promise<void>, what: string): void {
  const safe = async () => {
    try {
      await job();
    } catch (e) {
      console.error(`[comics] ${what} non riuscito:`, e instanceof Error ? e.message : e);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

/** Client anonimo senza cache, per rileggere il fumetto come lo vede chiunque. */
function anonClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
}

/** Rilegge il fumetto pubblicato (client anonimo): null se non è pubblico. */
async function readPublished(slug: string): Promise<AnnouncedComic | null> {
  if (!supabaseEnabled) return null;
  const { data } = await anonClient()
    .from("community_comics")
    .select("slug, title, lang, summary, cover_path, status, owner, profile:profiles!community_comics_owner_fkey(username, display_name)")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as unknown as {
    slug: string;
    title: string;
    lang: string;
    summary: string;
    cover_path: string | null;
    status: string;
    owner: string;
    profile: { username: string | null; display_name: string | null } | null;
  } | null;
  if (!row || row.status !== "published") return null;
  const lang = (locales as readonly string[]).includes(row.lang) ? (row.lang as Locale) : "en";
  const author = (row.profile?.display_name || row.profile?.username || "?").replace(/[\r\n]+/g, " ").trim();
  const image = comicPathOk(row.cover_path, row.owner) ? comicImageUrl(row.cover_path, supabaseUrl) : null;
  return { slug: row.slug, title: row.title, lang, author, summary: row.summary, image };
}

/** Da chiamare dopo la PRIMA pubblicazione di un fumetto: annuncio su Discord, se il webhook c'è. */
export function announceComic(slug: string): void {
  const url = discordWebhookUrl("DISCORD_WEBHOOK_COMICS");
  if (!url || !supabaseEnabled) return;
  runLater(async () => {
    const comic = await readPublished(slug);
    if (comic) await sendDiscordWebhook(url, comicPayload(comic), { timeoutMs: TIMEOUT_MS });
  }, "annuncio del fumetto su Discord");
}

/**
 * Avviso a chi segue l'autore (pacchetto SEGUI): `notifyFollowers` di notify.ts con il PROPRIETARIO del fumetto e il
 * percorso /news/comics/<slug>. Il database controlla che il fumetto sia pubblicato e suo. Solo alla prima pubblicazione.
 */
export function notifyComicFollowers(ownerId: string, slug: string, client?: Db): void {
  notifyFollowers(ownerId, "comic_published", slug, client);
}
