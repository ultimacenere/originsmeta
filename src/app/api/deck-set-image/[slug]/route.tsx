import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, getDictionary, locales, siteUrl } from "@/lib/i18n";
import { getStreamDeckSet } from "@/lib/community/streamDeckSets";
import { streamDeckSetView, type StreamDeckSetView } from "@/lib/community/streamView";
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
import { DeckSetImage } from "@/components/stream/DeckSetImage";

/**
 * Immagine PNG di un mazzo torneo (04/10/2026, gemella di /api/deck-image per i mazzi singoli), disegnata da
 * `DeckSetImage` con next/og: i tre mazzi affiancati (og e 16:9) o in colonna (9:16).
 *
 *   /api/deck-set-image/<slug>?format=og     1200×630, l'og:image della scheda del trio (/decks/tournament/<slug>)
 *   /api/deck-set-image/<slug>?format=16x9   1280×720, miniature e post
 *   /api/deck-set-image/<slug>?format=9x16   1080×1920, storie e short
 *
 * Stesse regole della rotta dei mazzi singoli: `lang`, `v` (versione da `updated_at`, `imageVersion`), `download=1`
 * (originsmeta-tournament-<slug>-<formato>.png); si disegna solo all'indirizzo canonico (`deckImageRedirect` con
 * target "set"), ogni altra forma riceve un 307 verso quello; una versione più nuova di quella in cache fa rileggere
 * il trio senza cache. Solo trii pubblicati; trio inesistente o tabella non ancora migrata: 404; database
 * irraggiungibile: 503 senza cache. robots.txt chiude i download (`download=1`), l'og:image resta aperta.
 */
function plain(body: string, status: number, cache: string): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" } });
}

/** I testi scritti dagli utenti con i soli caratteri del font dell'immagine (`imageSafe`). */
function imageView(view: StreamDeckSetView): StreamDeckSetView {
  const card = <T extends { name: string; slug: string }>(c: T): T => ({ ...c, name: imageSafe(c.name, c.slug.replace(/^custom:/, "")) });
  return {
    ...view,
    name: imageSafe(view.name, view.slug),
    author: imageSafe(view.author, view.username ?? "player"),
    decks: view.decks.map((deck) => ({
      ...deck,
      name: imageSafe(deck.name, deck.letter),
      legendary: deck.legendary ? card(deck.legendary) : null,
      cards: deck.cards.map(card),
    })),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = cleanDeckSlug(raw);
  const sp = req.nextUrl.searchParams;
  if (!isDeckSlug(slug)) return plain("Not found", 404, "public, max-age=3600");
  let set;
  try {
    set = await getStreamDeckSet(slug);
  } catch (e) {
    console.error("[stream] /api/deck-set-image:", e instanceof Error ? e.message : e);
    return plain("Unavailable", 503, "no-store");
  }
  if (!set) return plain("Not found", 404, "public, max-age=60");
  if (isNewerVersion(sp.get("v"), imageVersion(set.updated_at))) {
    try {
      set = await getStreamDeckSet(slug, { fresh: true });
    } catch (e) {
      console.error("[stream] /api/deck-set-image:", e instanceof Error ? e.message : e);
      return plain("Unavailable", 503, "no-store");
    }
    if (!set) return plain("Not found", 404, "public, max-age=60");
  }

  const version = imageVersion(set.updated_at);
  const canonical = deckImageRedirect(raw, sp, { slug: set.slug, version }, locales, defaultLocale, "set");
  if (canonical) {
    return NextResponse.redirect(new URL(canonical, req.url), { status: 307, headers: { "cache-control": "public, max-age=60, s-maxage=60", "x-robots-tag": "noindex" } });
  }

  const format = deckImageFormat(sp.get("format"));
  const lang = pickLang(sp.get("lang"), locales, defaultLocale);
  const view = imageView(streamDeckSetView(set));
  const L = streamLabels[lang].image;
  const badges = getDictionary(lang).community.badges as Record<string, string>;
  const badge = view.badge && view.badge !== "community" ? (badges[view.badge] ?? null) : null;
  const { width, height } = DECK_IMAGE_FORMATS[format];
  const headers: Record<string, string> = { "cache-control": deckImageCacheControl(Boolean(version)) };
  if (sp.get("download") === "1") headers["content-disposition"] = `attachment; filename="${deckImageFilename(slug, format, "set")}"`;

  return new ImageResponse(
    (
      <DeckSetImage
        view={view}
        format={format}
        shortLink={displayHost(shortLinkUrl(siteUrl, view.slug))}
        labels={{ kicker: L.setKicker, by: L.by, deck: L.deck, unofficial: L.unofficial, badge }}
      />
    ),
    { width, height, headers },
  );
}
