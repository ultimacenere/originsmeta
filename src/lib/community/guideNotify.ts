import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { discordWebhookUrl, sendDiscordWebhook } from "@/lib/discordWebhook";
import { guidePayload, guideReportPayload, type AnnouncedGuide, type GuideReportNotice } from "./guideDiscord";
import { isGuideCategory } from "./guides";

/**
 * Avvisi di una guida della community (pacchetto GUIDE, 27/09/2026), tutti dopo la risposta al browser (`after()`), mai
 * un'eccezione verso chi pubblica, timeout di rete:
 *
 * - `announceGuide`: la PRIMA pubblicazione di una guida va in diretta nel canale #guides del nostro Discord (regola del
 *   24/09/2026: "quello che si pubblica sul sito arriva da solo sul nostro Discord"). INTERRUTTORE: DISCORD_WEBHOOK_GUIDES
 *   (Vercel → Settings → Environment Variables, solo server, poi un deploy): webhook del canale #guides. Senza, niente.
 *   La guida si rilegge con il client anonimo e senza cache: parte solo se è davvero pubblica. Una modifica, o una guida
 *   riportata tra le bozze e ripubblicata, non si riannuncia (conta `published_at`, scritto una volta sola dal database).
 * - `notifyGuideFollowers`: PUNTO DI AGGANCIO per il pacchetto SEGUI (avvisi a chi segue un autore). Nel ramo di questo
 *   pacchetto SEGUI non c'è ancora: la funzione non fa nulla. All'integrazione, se SEGUI esporta `notifyFollowers`, qui
 *   basta chiamarla con l'autore, il tipo "guide" e il link (vedi il commento dentro la funzione).
 * - `notifyGuideReport`: una segnalazione va nel canale PRIVATO dello staff (DISCORD_FEEDBACK_WEBHOOK_URL, lo stesso dei
 *   feedback), con il motivo e il link alla guida, dove lo staff trova "Nascondi".
 */

const TIMEOUT_MS = 3000;

function runLater(job: () => Promise<void>, what: string): void {
  const safe = async () => {
    try {
      await job();
    } catch (e) {
      console.error(`[guides] ${what} non riuscito:`, e instanceof Error ? e.message : e);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

/** Client anonimo senza cache, per rileggere la guida come la vede chiunque. */
function anonClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
}

/** Nome della categoria nelle tre lingue, dai dizionari. */
function categoryNames(category: string): AnnouncedGuide["category"] {
  const names = Object.fromEntries(
    locales.map((l) => {
      const cats = getDictionary(l).guides.categories as Record<string, string>;
      return [l, isGuideCategory(category) ? (cats[category] ?? category) : category];
    }),
  );
  return names as AnnouncedGuide["category"];
}

/** Rilegge la guida pubblicata (client anonimo): null se non è pubblica. */
async function readPublished(slug: string): Promise<AnnouncedGuide | null> {
  if (!supabaseEnabled) return null;
  const { data } = await anonClient()
    .from("community_guides")
    .select("slug, title, lang, summary, category, status, owner:profiles!community_guides_owner_fkey(username, display_name)")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as unknown as {
    slug: string;
    title: string;
    lang: string;
    summary: string;
    category: string;
    status: string;
    owner: { username: string | null; display_name: string | null } | null;
  } | null;
  if (!row || row.status !== "published") return null;
  const lang = (locales as readonly string[]).includes(row.lang) ? (row.lang as Locale) : "en";
  const author = (row.owner?.display_name || row.owner?.username || "?").replace(/[\r\n]+/g, " ").trim();
  return { slug: row.slug, title: row.title, lang, author, summary: row.summary, category: categoryNames(row.category) };
}

/** Da chiamare dopo la PRIMA pubblicazione di una guida: annuncio nel canale #guides, se il webhook c'è. */
export function announceGuide(slug: string): void {
  const url = discordWebhookUrl("DISCORD_WEBHOOK_GUIDES");
  if (!url || !supabaseEnabled) return;
  runLater(async () => {
    const guide = await readPublished(slug);
    if (guide) await sendDiscordWebhook(url, guidePayload(guide), { timeoutMs: TIMEOUT_MS });
  }, "annuncio della guida su Discord");
}

/**
 * Avviso a chi segue l'autore (pacchetto SEGUI). Oggi non fa nulla: SEGUI non è in questo ramo.
 * All'integrazione: `import { notifyFollowers } from "./follows"` (o il modulo di SEGUI) e, qui dentro,
 * `notifyFollowers({ authorId: g.ownerId, kind: "guide", title: g.title, path: \`/guides/community/${g.slug}\` })`,
 * con la firma che SEGUI avrà scelto. Si chiama solo alla prima pubblicazione, come l'annuncio su Discord.
 */
export function notifyGuideFollowers(g: { ownerId: string; slug: string; title: string; lang: Locale }): void {
  void g;
}

/** Segnalazione di una guida: avviso nel canale privato dello staff, se il webhook c'è. */
export function notifyGuideReport(r: GuideReportNotice): void {
  const url = discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL");
  if (!url) return;
  runLater(async () => {
    await sendDiscordWebhook(url, guideReportPayload(r), { timeoutMs: TIMEOUT_MS });
  }, "avviso della segnalazione allo staff");
}
