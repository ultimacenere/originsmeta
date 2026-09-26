import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { publishedDeckExists } from "@/lib/community/streamDecks";
import { deckShortLinkTarget, isDeckSlug } from "@/lib/stream";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Link breve di un mazzo della community (pacchetto STREAM, 26/09/2026): originsmeta.com/d/<slug>, da dire in diretta,
 * da scrivere in chat (lo scrive anche il comando !deck) e da mettere nelle descrizioni dei video. Porta alla scheda
 * nella lingua del browser (`preferredLocale`, come /t/<tag>) con gli UTM delle dirette (utm_source=stream,
 * utm_medium=shortlink; quelli scritti nel link vincono: `deckShortLinkTarget` in src/lib/stream.ts). Fuori da [locale]
 * perché non ha la lingua nel percorso; "d" non è una sezione di next.config.ts, quindi nessun redirect la intercetta.
 *
 * Mazzo inesistente, nascosto o privato → /<lingua>/decks. Se la lettura fallisce (Supabase irraggiungibile) si va
 * comunque alla scheda: il link di una diretta non deve rompersi per un controllo, e la scheda in ISR ha la sua copia.
 * La rotta è dinamica perché legge l'Accept-Language; la lettura del mazzo resta 60 s nella cache dei dati.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const locale = preferredLocale(req.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
  let slug = "";
  try {
    slug = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    /* percorso scritto male: resta vuoto e va all'elenco */
  }
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url), { status: 302, headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
  if (!isDeckSlug(slug)) return go(`/${locale}/decks`);
  let exists = true;
  try {
    exists = await publishedDeckExists(slug);
  } catch (e) {
    console.error("[stream] /d:", e instanceof Error ? e.message : e);
  }
  return go(exists ? deckShortLinkTarget(locale, slug, req.nextUrl.searchParams) : `/${locale}/decks`);
}
