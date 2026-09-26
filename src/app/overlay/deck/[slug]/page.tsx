import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { getStreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { displayHost, firstParam, isDeckSlug, overlayLayout, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { DeckOverlay, OverlayMessage } from "@/components/stream/DeckOverlay";

/**
 * Overlay per OBS di un mazzo preciso (pacchetto STREAM, 26/09/2026): /overlay/deck/<slug>?layout=vertical|horizontal
 * &lang=en|it|es. Pagina dinamica (legge i parametri) ma leggera: la lettura del mazzo resta 60 s nella cache dei
 * dati, e `OverlayRefresh` del layout la rifà ogni minuto. Un mazzo che non c'è, o il database irraggiungibile, danno
 * un messaggio dentro l'overlay (lo streamer lo vede in OBS) invece della 404 del sito, che non è trasparente.
 */
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DeckOverlayPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const lang = pickLang(firstParam(sp.lang), locales, defaultLocale);
  const labels = streamLabels[lang].overlay;
  if (!isDeckSlug(slug)) return <OverlayMessage text={labels.noDeck} lang={lang} />;
  let deck;
  try {
    deck = await getStreamDeck(slug);
  } catch (e) {
    console.error("[stream] overlay:", e instanceof Error ? e.message : e);
    return <OverlayMessage text={labels.unavailable} lang={lang} />;
  }
  if (!deck) return <OverlayMessage text={labels.noDeck} lang={lang} />;
  return (
    <DeckOverlay
      view={streamDeckView(deck)}
      layout={overlayLayout(firstParam(sp.layout))}
      lang={lang}
      labels={labels}
      shortLink={displayHost(shortLinkUrl(siteUrl, deck.slug))}
    />
  );
}
