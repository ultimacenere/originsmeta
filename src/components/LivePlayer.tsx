"use client";

import { useEffect, useRef, useState } from "react";
import { liveEmbedSrc, twitchFits, twitchParents } from "@/lib/videos";
import { fillCreator, type LivePageLabels } from "@/lib/creatorLabels";
import { trackEvent } from "@/lib/analytics";

/**
 * La diretta di un canale Twitch "a clic" nella pagina /live (28/09/2026), con le regole di `VideoEmbed`: prima del
 * clic c'è solo un tasto nostro con la riga sui cookie di Twitch, e la pagina non contatta Twitch; al clic l'iframe
 * del lettore (con i `parent` del sito e della pagina) parte già in riproduzione e riceve il focus. Twitch non
 * riproduce un embed più piccolo di 400×300: in un riquadro più piccolo (il telefono) il clic apre la diretta su Twitch,
 * e il tasto e la nota lo dicono prima. Niente immagini del media kit come sfondo: il materiale Koin non è interfaccia.
 * Misura: `video_play` con provider twitch e placement live_page.
 * Con `autoStart` (la diretta in home, 20/10/2026, Pierluigi: "rendi il player già attivo, lascialo muto così non
 * disturbiamo ma che si veda il video di default") l'iframe si carica da solo, muto, appena il riquadro è misurato e
 * abbastanza grande per Twitch; sotto 400×300 resta il tasto che apre Twitch. L'avvio automatico non conta `video_play`
 * (lo conta già `official_live_view`) e non sposta il focus.
 */
export function LivePlayer({
  login,
  name,
  labels,
  privacyHref,
  placement = "live_page",
  className = "mt-4",
  onOpenTwitch,
  autoStart = false,
}: {
  login: string;
  name: string;
  labels: LivePageLabels;
  privacyHref: string;
  /** dove sta il lettore, per `video_play`: la pagina /live o la home (diretta ufficiale al posto dello slider, 18/10/2026) */
  placement?: "live_page" | "home_hero";
  className?: string;
  /** il lettore troppo piccolo per l'embed apre Twitch: chi lo usa può contarlo (diretta in home, 18/10/2026) */
  onOpenTwitch?: () => void;
  /** parte da solo, muto, senza clic (la diretta in home, 20/10/2026) */
  autoStart?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const clicked = useRef(false);
  const channelUrl = `https://www.twitch.tv/${login}`;
  const title = fillCreator(labels.playerTitle, { name });

  useEffect(() => {
    if (src && clicked.current) frame.current?.focus();
  }, [src]);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // la prima misura arriva subito dopo observe(): niente setState sincrono nell'effetto
    const ro = new ResizeObserver(() => {
      const fits = twitchFits(el.clientWidth, el.clientHeight);
      setNarrow(!fits);
      if (autoStart && fits) setSrc((cur) => cur ?? liveEmbedSrc(login, twitchParents(window.location.hostname), true));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoStart, login]);

  const play = () => {
    clicked.current = true;
    trackEvent("video_play", { provider: "twitch", placement });
    const el = box.current;
    const url = liveEmbedSrc(login, twitchParents(window.location.hostname));
    if (!url || !el || !twitchFits(el.clientWidth, el.clientHeight)) {
      onOpenTwitch?.();
      window.open(channelUrl, "_blank", "noopener");
      return;
    }
    setSrc(url);
  };

  return (
    <figure className={`${className} min-w-0`}>
      <div ref={box} className="relative aspect-video overflow-hidden rounded-xl border-2 border-crimson bg-night">
        {src ? (
          <iframe
            ref={frame}
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={play}
            aria-label={fillCreator(narrow ? labels.openAria : labels.watch, { name })}
            className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none"
          >
            <span aria-hidden="true" className="absolute inset-0 flex flex-col justify-between p-4 text-left">
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-crimson-soft">
                <span className="live-dot" />
                Twitch · LIVE
              </span>
              <span className="line-clamp-2 font-display text-sm font-bold text-sky">{title}</span>
            </span>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-mint text-ink shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-sky motion-reduce:transition-none"
            >
              {narrow ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current">
                  <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
                </svg>
              )}
            </span>
          </button>
        )}
      </div>
      {src ? null : (
        <figcaption className="mt-2 text-xs text-pale-muted">
          {narrow ? (
            labels.narrow
          ) : (
            <>
              {labels.consent}{" "}
              <a href={privacyHref} className="underline underline-offset-2 hover:text-pale">
                {labels.privacy}
              </a>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
