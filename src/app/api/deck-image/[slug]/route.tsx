import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, getDictionary, locales, siteUrl } from "@/lib/i18n";
import { archetypeLabels } from "@/lib/data/decks";
import { getStreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView, type StreamDeckView } from "@/lib/community/streamView";
import {
  DECK_IMAGE_FORMATS,
  cleanDeckSlug,
  deckImageCacheControl,
  deckImageFilename,
  deckImageFormat,
  deckImageRedirect,
  displayHost,
  imageSafe,
  imageVersion,
  isDeckSlug,
  isNewerVersion,
  pickLang,
  shortLinkUrl,
} from "@/lib/stream";
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
 * modifica del mazzo, `imageVersion`) e `download=1` (lo scarica con il nome originsmeta-<slug>-<formato>.png).
 *
 * Si disegna solo all'indirizzo canonico (`deckImageRedirect`): ogni altra forma (versione vecchia o inventata,
 * parametri in più, slug con le maiuscole) riceve un 307 verso quello, con una cache breve, perché un `?v=<a caso>`
 * non faccia disegnare un PNG nuovo a ogni richiesta; il controllo costa una lettura, che resta un minuto nella cache
 * dei dati. Una versione PIÙ NUOVA di quella in cache (la scheda del mazzo appena modificata la chiede subito) fa
 * rileggere il mazzo senza cache prima di decidere: così il rimando va sempre verso la versione vera, mai indietro, e
 * due rimandi non possono rincorrersi. Il canonico ha la cache lunga. Solo mazzi pubblicati. Mazzo inesistente: 404;
 * database irraggiungibile: 503 senza cache. Runtime Node (quello di default), come le altre rotte del sito.
 */
function plain(body: string, status: number, cache: string): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" } });
}

/** I testi scritti dagli utenti con i soli caratteri del font dell'immagine (`imageSafe`). */
function imageView(view: StreamDeckView): StreamDeckView {
  const card = <T extends { name: string; slug: string }>(c: T): T => ({ ...c, name: imageSafe(c.name, c.slug.replace(/^custom:/, "")) });
  return {
    ...view,
    name: imageSafe(view.name, view.slug),
    author: imageSafe(view.author, view.username ?? "player"),
    legendary: view.legendary ? card(view.legendary) : null,
    cards: view.cards.map(card),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = cleanDeckSlug(raw);
  const sp = req.nextUrl.searchParams;
  if (!isDeckSlug(slug)) return plain("Not found", 404, "public, max-age=3600");
  let deck;
  try {
    deck = await getStreamDeck(slug);
  } catch (e) {
    console.error("[stream] /api/deck-image:", e instanceof Error ? e.message : e);
    return plain("Unavailable", 503, "no-store");
  }
  if (!deck) return plain("Not found", 404, "public, max-age=60");
  if (isNewerVersion(sp.get("v"), imageVersion(deck.updated_at))) {
    try {
      deck = await getStreamDeck(slug, { fresh: true });
    } catch (e) {
      console.error("[stream] /api/deck-image:", e instanceof Error ? e.message : e);
      return plain("Unavailable", 503, "no-store");
    }
    if (!deck) return plain("Not found", 404, "public, max-age=60");
  }

  const version = imageVersion(deck.updated_at);
  const canonical = deckImageRedirect(raw, sp, { slug: deck.slug, version }, locales, defaultLocale);
  if (canonical) {
    return NextResponse.redirect(new URL(canonical, req.url), { status: 307, headers: { "cache-control": "public, max-age=60, s-maxage=60", "x-robots-tag": "noindex" } });
  }

  const format = deckImageFormat(sp.get("format"));
  const lang = pickLang(sp.get("lang"), locales, defaultLocale);
  const view = imageView(streamDeckView(deck));
  const L = streamLabels[lang].image;
  const badges = getDictionary(lang).community.badges as Record<string, string>;
  const badge = view.badge && view.badge !== "community" ? (badges[view.badge] ?? null) : null;
  const { width, height } = DECK_IMAGE_FORMATS[format];
  const headers: Record<string, string> = { "cache-control": deckImageCacheControl(Boolean(version)) };
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
