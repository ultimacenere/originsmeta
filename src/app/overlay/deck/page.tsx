import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { latestDeckOfUser, type LatestDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { displayHost, fill, firstParam, normalizeUsername, overlayLayout, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { DeckOverlay, OverlayMessage } from "@/components/stream/DeckOverlay";

/**
 * Overlay per OBS con l'ultimo mazzo pubblicato di un creator (pacchetto STREAM, 26/09/2026):
 * /overlay/deck?u=<nome utente>&layout=vertical|horizontal&lang=en|it|es. È il link da mettere una volta in OBS: il
 * creator pubblica o aggiorna un mazzo e l'overlay lo segue entro un minuto (`OverlayRefresh` nel layout), come il
 * comando !deck. Utente inesistente, nessun mazzo o database irraggiungibile: un messaggio dentro l'overlay.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LatestDeckOverlayPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang = pickLang(firstParam(sp.lang), locales, defaultLocale);
  const labels = streamLabels[lang].overlay;
  const user = normalizeUsername(firstParam(sp.u) ?? firstParam(sp.user));
  if (!user) return <OverlayMessage text={labels.usage} lang={lang} />;
  let found: LatestDeck;
  try {
    found = await latestDeckOfUser(user);
  } catch (e) {
    console.error("[stream] overlay ?u=:", e instanceof Error ? e.message : e);
    return <OverlayMessage text={labels.unavailable} lang={lang} />;
  }
  if (found.user === "missing") return <OverlayMessage text={fill(labels.noUser, { user })} lang={lang} />;
  if (!found.deck) return <OverlayMessage text={fill(labels.noDecks, { user })} lang={lang} />;
  return (
    <DeckOverlay
      view={streamDeckView(found.deck)}
      layout={overlayLayout(firstParam(sp.layout))}
      lang={lang}
      labels={labels}
      shortLink={displayHost(shortLinkUrl(siteUrl, found.deck.slug))}
    />
  );
}
