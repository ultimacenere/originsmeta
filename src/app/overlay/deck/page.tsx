import { defaultLocale, locales, siteUrl } from "@/lib/i18n";
import { latestDeckOfUser, type LatestDeck } from "@/lib/community/streamDecks";
import { streamDeckView } from "@/lib/community/streamView";
import { displayHost, fill, firstParam, normalizeUsername, overlayLayout, pickLang, shortLinkUrl } from "@/lib/stream";
import { streamLabels } from "@/lib/streamLabels";
import { DeckOverlay, OverlayMessage } from "@/components/stream/DeckOverlay";

/**
 * Overlay per OBS con l'ultimo mazzo pubblicato di un creator (pacchetto STREAM, 26/09/2026):
 * /overlay/deck?u=<nome utente>&layout=vertical|horizontal&lang=en|it|es. È il link da mettere una volta in OBS: il
 * creator pubblica un mazzo nuovo e l'overlay passa a quello entro un minuto (`OverlayRefresh` nel layout, lettura
 * senza cache in `latestDeckOfUser`), come il comando !deck. Il nome utente si riduce come quello del profilo
 * ("albeo_o" → "albeo-o"). Nome mancante, utente inesistente, nessun mazzo o database irraggiungibile: un messaggio
 * dentro l'overlay.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LatestDeckOverlayPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang = pickLang(firstParam(sp.lang), locales, defaultLocale);
  const labels = streamLabels[lang].overlay;
  const message = (text: string) => <OverlayMessage text={text} lang={lang} note={labels.unofficial} />;
  const user = normalizeUsername(firstParam(sp.u) ?? firstParam(sp.user) ?? firstParam(sp.username));
  if (!user) return message(labels.usage);
  let found: LatestDeck;
  try {
    found = await latestDeckOfUser(user);
  } catch (e) {
    console.error("[stream] overlay ?u=:", e instanceof Error ? e.message : e);
    return message(labels.unavailable);
  }
  if (found.user === "missing") return message(fill(labels.noUser, { user }));
  if (!found.deck) return message(fill(labels.noDecks, { user }));
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
