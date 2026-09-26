import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { getStreamDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { cleanDeckSlug, displayHost, firstParam, isDeckSlug, overlayLayout, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { DeckOverlay, OverlayMessage } from "@/components/stream/DeckOverlay";

/**
 * Overlay per OBS di un mazzo preciso (pacchetto STREAM, 26/09/2026): /overlay/deck/<slug>?layout=vertical|horizontal
 * &lang=en|it|es. Pagina dinamica (legge i parametri): legge il mazzo senza cache dei dati (copia in memoria di 5 s),
 * e `OverlayRefresh` del layout la rifà ogni minuto. Lo slug vale anche con le maiuscole, come nel link breve. Un mazzo che non c'è, o il
 * database irraggiungibile, danno un messaggio dentro l'overlay (lo streamer lo vede in OBS) invece della 404 del
 * sito, che non è trasparente.
 */
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DeckOverlayPage({ params, searchParams }: Props) {
  const [{ slug: raw }, sp] = await Promise.all([params, searchParams]);
  const lang = pickLang(firstParam(sp.lang), locales, defaultLocale);
  const labels = streamLabels[lang].overlay;
  let slug = "";
  try {
    slug = cleanDeckSlug(decodeURIComponent(raw));
  } catch {
    /* percorso scritto male: resta vuoto */
  }
  if (!isDeckSlug(slug)) return <OverlayMessage text={labels.noDeck} lang={lang} note={labels.unofficial} />;
  let deck;
  try {
    deck = await getStreamDeck(slug, { fresh: true });
  } catch (e) {
    console.error("[stream] overlay:", e instanceof Error ? e.message : e);
    return <OverlayMessage text={labels.unavailable} lang={lang} note={labels.unofficial} />;
  }
  if (!deck) return <OverlayMessage text={labels.noDeck} lang={lang} note={labels.unofficial} />;
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
