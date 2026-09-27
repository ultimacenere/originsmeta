import { href, type Locale } from "@/lib/i18n";
import { videoLabels } from "@/lib/videoLabels";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { fillVideoLabel, type ParsedVideo, type ShownLink } from "@/lib/videos";
import { NEW_TAB_HINT_ID, NewTabIcon } from "../SteamButton";
import { VideoEmbed } from "../VideoEmbed";

/**
 * Video e risorse di una guida della community (pacchetto GUIDE, 27/09/2026), con le regole dei mazzi (pacchetto VIDEO):
 * lettore a clic (`VideoEmbed`, placement "guide": nessuna richiesta a YouTube o Twitch prima del clic) e link su host
 * ammessi, con il dominio accanto, `rel="ugc nofollow noopener"` e nuova scheda. Gemelli di `DeckVideos` e
 * `DeckResources` (DeckMedia.tsx), con i testi delle guide: quelli dei mazzi parlano di "chi ha pubblicato il mazzo".
 */
export function CommunityGuideVideos({ videos, title, locale }: { videos: ParsedVideo[]; title: string; locale: Locale }) {
  if (!videos.length) return null;
  const V = videoLabels[locale];
  const L = communityGuideLabels[locale].page;
  const many = videos.length > 1;
  const sideBySide = many && videos.every((v) => v.provider === "youtube");
  return (
    <section className="mt-8" aria-labelledby="guide-videos">
      <h2 id="guide-videos" className="t-section">
        {many ? L.videoMany : L.videoOne}
      </h2>
      <div className={`mt-3 grid grid-cols-1 gap-6 ${sideBySide ? "lg:grid-cols-2" : ""}`}>
        {videos.map((v, i) => (
          <div key={v.url} className={`min-w-0 ${sideBySide && videos.length === 3 && i === 0 ? "lg:col-span-2" : ""}`}>
            <VideoEmbed
              video={v}
              title={v.title || (many ? fillVideoLabel(V.player.videoN, { n: i + 1 }) : title)}
              labels={V.player}
              privacyHref={`${href(locale, "/privacy")}#video`}
              placement="guide"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CommunityGuideResources({ links, locale }: { links: ShownLink[]; locale: Locale }) {
  if (!links.length) return null;
  const L = communityGuideLabels[locale].page;
  return (
    <section className="mt-8 rounded-lg border-2 border-sky bg-night-2/70 p-4" aria-labelledby="guide-resources">
      <h2 id="guide-resources" className="kicker text-mint">
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
              data-om-placement="guide_resources"
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
