import { href, type Locale } from "@/lib/i18n";
import { fillVideoLabel, videoLabels } from "@/lib/videoLabels";
import type { ParsedVideo, ShownLink } from "@/lib/videos";
import { NEW_TAB_HINT_ID, NewTabIcon } from "./SteamButton";
import { VideoEmbed } from "./VideoEmbed";

/**
 * Video della scheda di un mazzo della community (pacchetto VIDEO, 26/09/2026): fino a tre, ognuno col lettore a
 * clic (`VideoEmbed`), con l'illustrazione della Leggendaria come anteprima. Uno solo: a tutta larghezza; due: affiancati
 * da 1024 px; tre: il primo grande e gli altri due sotto. `legacyHref` è il vecchio `video_url` che non è un video
 * riconosciuto (`legacyVideoLink`): resta il tasto di prima, con i rel dei link degli utenti.
 */
export function DeckVideos({
  videos,
  deckName,
  poster,
  locale,
  legacyHref,
  legacyLabel,
}: {
  videos: ParsedVideo[];
  deckName: string;
  poster?: string;
  locale: Locale;
  legacyHref?: string | null;
  legacyLabel: string;
}) {
  if (!videos.length) {
    return legacyHref ? (
      <p className="mt-6">
        <a className="btn btn-ink text-xs" href={legacyHref} rel="ugc nofollow noopener" target="_blank" aria-describedby={NEW_TAB_HINT_ID}>
          ▶ {legacyLabel}
        </a>
      </p>
    ) : null;
  }
  const L = videoLabels[locale];
  const many = videos.length > 1;
  return (
    <section className="mt-8" aria-labelledby="deck-videos">
      <h2 id="deck-videos" className="t-section">
        {many ? L.deck.videoMany : L.deck.videoOne}
      </h2>
      {/* affiancati solo da 1024 px: sotto, mezza colonna sarebbe più stretta dei 400 px minimi dell'embed di Twitch */}
      <div className={`mt-3 grid grid-cols-1 gap-6 ${many ? "lg:grid-cols-2" : ""}`}>
        {videos.map((v, i) => (
          <div key={v.url} className={`min-w-0 ${videos.length === 3 && i === 0 ? "lg:col-span-2" : ""}`}>
            <VideoEmbed
              video={v}
              title={many ? `${deckName} · ${fillVideoLabel(L.player.videoN, { n: i + 1 })}` : deckName}
              poster={poster}
              labels={L.player}
              privacyHref={`${href(locale, "/privacy")}#video`}
              placement="deck_page"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Risorse di un mazzo: i link scelti dall'autore (al massimo cinque, host ammessi, `deckLinks`), in un riquadro a
 * parte e mai dentro il testo della guida, che il sito traduce. Dominio sempre visibile accanto all'etichetta, rel dei
 * link degli utenti (ugc nofollow) e nuova scheda. Misura: `deck_link_click` con il dominio (attributi data-om-*).
 */
export function DeckResources({ links, locale }: { links: ShownLink[]; locale: Locale }) {
  if (!links.length) return null;
  const L = videoLabels[locale].deck;
  return (
    <section className="mt-8 rounded-lg border-2 border-sky bg-night-2/70 p-4" aria-labelledby="deck-resources">
      <h2 id="deck-resources" className="kicker text-mint">
        {L.resources}
      </h2>
      <ul className="mt-2 space-y-2">
        {links.map((l) => (
          <li key={l.url} className="min-w-0">
            <a
              href={l.url}
              target="_blank"
              rel="ugc nofollow noopener"
              aria-describedby={NEW_TAB_HINT_ID}
              className="group inline-flex max-w-full flex-wrap items-center gap-x-2 text-sm"
              data-om-event="deck_link_click"
              data-om-host={l.host}
              data-om-placement="deck_resources"
            >
              <span className="font-semibold text-pale underline-offset-2 group-hover:text-mint group-hover:underline">{l.label}</span>
              <span className="inline-flex min-w-0 items-center gap-1 break-all font-mono text-xs text-pale-muted">
                {l.host}
                <NewTabIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-pale-muted">{L.resourcesNote}</p>
    </section>
  );
}
