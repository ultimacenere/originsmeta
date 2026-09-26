import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { defaultLocale, getDictionary, locales, siteUrl } from "@/lib/i18n";
import { archetypeLabels } from "@/lib/data/decks";
import { getStreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { DECK_IMAGE_FORMATS, deckImageCacheControl, deckImageFilename, deckImageFormat, displayHost, isDeckSlug, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { DeckImage } from "@/components/stream/DeckImage";

/**
 * Immagine PNG di un mazzo della community (pacchetto STREAM, 26/09/2026), disegnata da `DeckImage` con next/og:
 *
 *   /api/deck-image/<slug>?format=og     1200×630, l'og:image della scheda del mazzo (anteprima su Discord, X…)
 *   /api/deck-image/<slug>?format=16x9   1280×720, miniature e post
 *   /api/deck-image/<slug>?format=9x16   1080×1920, storie e short
 *
 * Parametri: `lang` (en, it, es: le etichette; i nomi delle carte restano in inglese), `v` (versione dalla data di
 * modifica del mazzo, `imageVersion`: con la versione la cache è lunga, senza è di dieci minuti) e `download=1` (lo
 * scarica con il nome originsmeta-<slug>-<formato>.png). Solo mazzi pubblicati. Mazzo inesistente: 404; database
 * irraggiungibile: 503 senza cache. Runtime Node (quello di default), come le altre rotte del sito.
 */
function plain(body: string, status: number, cache: string): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sp = req.nextUrl.searchParams;
  const format = deckImageFormat(sp.get("format"));
  const lang = pickLang(sp.get("lang"), locales, defaultLocale);
  if (!isDeckSlug(slug)) return plain("Not found", 404, "public, max-age=3600");
  let deck;
  try {
    deck = await getStreamDeck(slug);
  } catch (e) {
    console.error("[stream] /api/deck-image:", e instanceof Error ? e.message : e);
    return plain("Unavailable", 503, "no-store");
  }
  if (!deck) return plain("Not found", 404, "public, max-age=60");

  const view = streamDeckView(deck);
  const L = streamLabels[lang].image;
  const badges = getDictionary(lang).community.badges as Record<string, string>;
  const badge = view.badge && view.badge !== "community" ? (badges[view.badge] ?? null) : null;
  const { width, height } = DECK_IMAGE_FORMATS[format];
  const headers: Record<string, string> = { "cache-control": deckImageCacheControl(Boolean(sp.get("v"))) };
  if (sp.get("download") === "1") headers["content-disposition"] = `attachment; filename="${deckImageFilename(slug, format)}"`;

  return new ImageResponse(
    (
      <DeckImage
        view={view}
        format={format}
        shortLink={displayHost(shortLinkUrl(siteUrl, view.slug))}
        labels={{
          kicker: L.kicker,
          by: L.by,
          legendary: L.legendary,
          cards: L.cards,
          unofficial: L.unofficial,
          badge,
          archetype: archetypeLabels[view.archetype]?.[lang] ?? view.archetype,
        }}
      />
    ),
    { width, height, headers },
  );
}
