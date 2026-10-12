import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n";
import { analyticsInstallHref } from "@/lib/analyticsLabels";
import { TRACKER_DOWNLOAD_URL } from "@/lib/trackerDownload";

/**
 * Download di OriginsMeta Analytics solo per chi ha fatto l'accesso (12/10/2026, Pierluigi: "ben inteso che solo i
 * registrati al sito possono scaricare l'app e possono usarla"). Il tasto di /analytics porta qui (la pagina resta
 * statica): con la sessione del sito → 302 verso lo zip su GitHub Releases (`TRACKER_DOWNLOAD_URL`, che solo questa
 * rotta conosce); senza → la pagina di accesso, con il ritorno alla guida all'installazione nella lingua
 * (`?lang=`, /it/analytics#installazione). L'evento `analytics_download` lo manda il browser al clic sul tasto.
 *
 * Mai in cache (dipende dalla sessione). Lo zip resta pubblico su GitHub per chi ne conosce l'indirizzo: la protezione
 * vera è nell'app, che funziona solo collegata a un account.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("lang") ?? "";
  const locale = isLocale(raw) ? raw : "en";
  const { user } = await currentUser();
  const target = user
    ? TRACKER_DOWNLOAD_URL
    : new URL(`/${locale}/login?next=${encodeURIComponent(analyticsInstallHref(locale))}`, request.nextUrl.origin).toString();
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
