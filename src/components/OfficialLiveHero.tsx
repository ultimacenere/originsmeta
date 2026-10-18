"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { useLiveUsers } from "@/lib/liveClient";
import { OFFICIAL_LIVE_REFRESH_MS, officialLiveOf, officialViewersText, type OfficialLiveLabels } from "@/lib/officialLive";
import type { LivePageLabels } from "@/lib/creatorLabels";
import { LivePlayer } from "./LivePlayer";

/**
 * La diretta ufficiale di Origins TCG al posto dello slider della home (18/10/2026, Pierluigi: "quando da Twitch loro
 * vanno online, al posto del nostro slider in homepage deve apparire la loro diretta; finisce la diretta, torna tutto come
 * prima"). La home resta ISR: nell'HTML c'è lo slider (`children`), il browser chiede /api/live (promessa condivisa con
 * il bollino LIVE e la striscia del calendario) e, se il profilo OriginsTCG è in diretta, mostra il riquadro della
 * diretta al posto dello slider; ricontrolla ogni minuto a scheda visibile, e quando la diretta finisce torna lo slider.
 * Il lettore è quello di /live (`LivePlayer`): prima del clic nessuna richiesta a Twitch, come dice l'informativa #video.
 * Misura (Pierluigi: "voglio anche un tracker di quanti guardano la diretta e quanti cliccano per andare su Twitch"):
 * `official_live_view` quando il riquadro compare (una volta per pagina vista), `video_play` con placement home_hero
 * quando la si avvia sul sito, `official_live_twitch` per chi va su Twitch (tasto o lettore troppo piccolo).
 */
export function OfficialLiveHero({
  children,
  locale,
  labels,
  playerLabels,
  privacyHref,
}: {
  children: ReactNode;
  locale: string;
  labels: OfficialLiveLabels;
  playerLabels: LivePageLabels;
  privacyHref: string;
}) {
  const state = useLiveUsers(OFFICIAL_LIVE_REFRESH_MS);
  const live = officialLiveOf(state?.users);
  const counted = useRef(false);
  const isLive = live !== null;
  useEffect(() => {
    if (isLive && !counted.current) {
      counted.current = true;
      trackEvent("official_live_view", { placement: "home_hero" });
    }
  }, [isLive]);
  if (!live) return <>{children}</>;
  const viewers = officialViewersText(labels, live.viewers, locale);
  const channelUrl = `https://www.twitch.tv/${live.channel}`;
  return (
    <section aria-labelledby="official-live-title" className="w-full border-b border-felt-line/70 bg-felt-deep">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:py-8">
        <LivePlayer login={live.channel} name={labels.name} labels={playerLabels} privacyHref={privacyHref} placement="home_hero" className="mt-0" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-crimson-soft">
            <span className="live-dot" aria-hidden="true" />
            {labels.kicker}
          </p>
          <h2 id="official-live-title" className="t-page mt-2">
            {labels.heading}
          </h2>
          {live.title ? <p className="mt-3 line-clamp-3 text-pale">{live.title}</p> : null}
          {viewers ? <p className="mt-2 font-mono text-sm text-pale-muted">{viewers}</p> : null}
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("official_live_twitch", { placement: "home_hero", method: "button" })}
            className="btn btn-primary mt-5 inline-flex"
          >
            {labels.openTwitch} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
