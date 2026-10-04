import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { getStreamDeckSet } from "@/lib/community/streamDeckSets";
import { streamDeckSetView } from "@/lib/community/streamView";
import { cleanDeckSlug, displayHost, firstParam, isDeckSlug, overlayLayout, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { OverlayMessage } from "@/components/stream/DeckOverlay";
import { DeckSetOverlay } from "@/components/stream/DeckSetOverlay";

/**
 * Overlay per OBS di un mazzo torneo (04/10/2026, gli strumenti delle dirette dei mazzi singoli anche per i trii):
 * /overlay/deck-set/<slug>?layout=vertical|horizontal&lang=en|it|es. Sotto il layout nudo di src/app/overlay (niente
 * header, footer né analytics, `OverlayRefresh` ogni 60 s, noindex) e con le intestazioni di next.config.ts per
 * "/overlay/:path*" (X-Robots-Tag e frame-ancestors), che valgono anche per questo percorso; robots.txt chiude /overlay/.
 * Lettura senza cache dei dati (copia in memoria di 5 s), solo trii pubblicati. Trio che non c'è, tabella non ancora
 * migrata o database irraggiungibile: un messaggio dentro l'overlay invece della 404 del sito, che non è trasparente.
 */
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DeckSetOverlayPage({ params, searchParams }: Props) {
  const [{ slug: raw }, sp] = await Promise.all([params, searchParams]);
  const lang = pickLang(firstParam(sp.lang), locales, defaultLocale);
  const labels = streamLabels[lang].overlay;
  const message = (text: string) => <OverlayMessage text={text} lang={lang} note={labels.unofficial} />;
  let slug = "";
  try {
    slug = cleanDeckSlug(decodeURIComponent(raw));
  } catch {
    /* percorso scritto male: resta vuoto */
  }
  if (!isDeckSlug(slug)) return message(labels.noSet);
  let set;
  try {
    set = await getStreamDeckSet(slug, { fresh: true });
  } catch (e) {
    console.error("[stream] overlay mazzo torneo:", e instanceof Error ? e.message : e);
    return message(labels.unavailable);
  }
  if (!set) return message(labels.noSet);
  return (
    <DeckSetOverlay
      view={streamDeckSetView(set)}
      layout={overlayLayout(firstParam(sp.layout))}
      lang={lang}
      labels={labels}
      shortLink={displayHost(shortLinkUrl(siteUrl, set.slug))}
    />
  );
}
