import { after, NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { isLocale } from "@/lib/i18n";
import { trackerInstallHref } from "@/lib/analyticsLabels";
import { TRACKER_DOWNLOAD_URL } from "@/lib/trackerDownload";

/**
 * Download di OriginsMeta Tracker solo per chi ha fatto l'accesso (12/10/2026, Pierluigi: "ben inteso che solo i
 * registrati al sito possono scaricare l'app e possono usarla"). Il tasto di /tracker porta qui (la pagina resta
 * statica): con la sessione del sito → 302 verso lo zip su GitHub Releases (`TRACKER_DOWNLOAD_URL`, che solo questa
 * rotta conosce); senza → la pagina di accesso, con il ritorno alla guida all'installazione nella lingua
 * (`?lang=`, /it/tracker#installazione). L'evento `analytics_download` lo manda il browser al clic sul tasto.
 *
 * Dal 15/10/2026 (Pierluigi: "voglio avere accortezza di chi scarica il tracker") ogni clic si registra anche nel
 * database, `tracker_download_log` con il segreto del server (blocco "15/10/2026: DOWNLOAD DEL TRACKER"): l'account se
 * c'è l'accesso, la lingua, l'ora. Lo legge lo staff con scripts/tracker-downloads.mjs. Il conteggio va dopo la
 * risposta (`after`) e un suo errore non ferma mai il download; i crawler non contano.
 *
 * Mai in cache (dipende dalla sessione). Lo zip resta pubblico su GitHub per chi ne conosce l'indirizzo: la protezione
 * vera è nell'app, che funziona solo collegata a un account.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("lang") ?? "";
  const locale = isLocale(raw) ? raw : "en";
  const { user } = await currentUser();
  const target = user
    ? TRACKER_DOWNLOAD_URL
    : new URL(`/${locale}/login?next=${encodeURIComponent(trackerInstallHref(locale))}`, request.nextUrl.origin).toString();
  if (!BOT_RE.test(request.headers.get("user-agent") ?? "")) after(() => logDownload(user?.id ?? null, locale));
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}

async function logDownload(owner: string | null, lang: string) {
  const key = process.env.CRON_SECRET?.trim();
  const db = supabaseAnon();
  if (!key || !db) return;
  try {
    const { error } = await db.rpc("tracker_download_log", { p_key: key, p_owner: owner, p_lang: lang });
    // prima della migrazione la funzione non c'è: si tace
    if (error && !["PGRST202", "42883", "42P01"].includes(error.code ?? "")) console.error("[tracker] download:", error.message);
  } catch (e) {
    console.error("[tracker] download:", e instanceof Error ? e.message : e);
  }
}
