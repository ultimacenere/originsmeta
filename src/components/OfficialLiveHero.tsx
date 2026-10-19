"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { useLiveUsers } from "@/lib/liveClient";
import { OFFICIAL_LIVE_REFRESH_MS, heroHeading, heroLiveOf, officialViewersText, type OfficialLiveLabels } from "@/lib/officialLive";
import type { LivePageLabels } from "@/lib/creatorLabels";
import { LivePlayer } from "./LivePlayer";

/**
 * La diretta al posto dello slider della home (18/10/2026, Pierluigi: "quando da Twitch loro vanno online, al posto del
 * nostro slider in homepage deve apparire la loro diretta; finisce la diretta, torna tutto come prima"). La home resta
 * ISR: nell'HTML c'è lo slider (`children`), il browser chiede /api/live (promessa condivisa con il bollino LIVE e la
 * striscia del calendario) e mostra la prima diretta in corso fra quelle di `HERO_STREAMS` (src/lib/officialLive.ts):
 * il canale ufficiale di Origins TCG e, sulle pagine italiane dal 19 al 21 ottobre 2026, prima il cast della Crimson Cup
 * di CoachCrono. Ricontrolla ogni minuto a scheda visibile; quando la diretta finisce torna lo slider (o l'altra diretta).
 * Il lettore è quello di /live (`LivePlayer`), ma dal 20/10/2026 parte da solo e muto (`autoStart`; Pierluigi: "rendi il
 * player già attivo, lascialo muto così non disturbiamo ma che si veda il video di default"): l'informativa #video lo dice.
 * Misura (Pierluigi: "voglio anche un tracker di quanti guardano la diretta e quanti cliccano per andare su Twitch"):
 * `official_live_view` quando il riquadro compare (una volta per pagina vista e per diretta), `video_play` con placement
 * home_hero quando la si avvia sul sito, `official_live_twitch` per chi va su Twitch; `stream` dice quale diretta.
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
  // il momento conta solo per il periodo del cast: quello della risposta di /api/live (ogni minuto)
  const live = useMemo(() => (state ? heroLiveOf(state.users, locale, state.at) : null), [state, locale]);
  const counted = useRef<string | null>(null);
  const liveId = live?.id ?? null;
  useEffect(() => {
    if (liveId && counted.current !== liveId) {
      counted.current = liveId;
      trackEvent("official_live_view", { placement: "home_hero", stream: liveId });
    }
  }, [liveId]);
  if (!live) return <>{children}</>;
  const viewers = officialViewersText(labels, live.viewers, locale);
  const channelUrl = `https://www.twitch.tv/${live.channel}`;
  const toTwitch = (method: "button" | "player") => trackEvent("official_live_twitch", { placement: "home_hero", method, stream: live.id });
  return (
    <section aria-labelledby="official-live-title" className="w-full border-b border-felt-line/70 bg-felt-deep">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:py-8">
        <LivePlayer
          key={live.channel}
          login={live.channel}
          name={live.name}
          labels={playerLabels}
          privacyHref={privacyHref}
          placement="home_hero"
          className="mt-0"
          autoStart
          onOpenTwitch={() => toTwitch("player")}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-crimson-soft">
            <span className="live-dot" aria-hidden="true" />
            {labels.kicker}
          </p>
          <h2 id="official-live-title" className="t-page mt-2">
            {heroHeading(labels, live)}
          </h2>
          {live.title ? <p className="mt-3 line-clamp-3 text-pale">{live.title}</p> : null}
          {viewers ? <p className="mt-2 font-mono text-sm text-pale-muted">{viewers}</p> : null}
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" onClick={() => toTwitch("button")} className="btn btn-primary mt-5 inline-flex">
            {labels.openTwitch} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
