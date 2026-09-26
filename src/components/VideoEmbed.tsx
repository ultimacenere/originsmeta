"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { embedSrc, fillVideoLabel, formatStart, twitchFits, twitchParents, watchUrl, youtubeThumb, type ParsedVideo } from "@/lib/videos";
import type { VideoLabels } from "@/lib/videoLabels";
import { trackEvent } from "@/lib/analytics";
import { NEW_TAB_HINT_ID, NewTabIcon } from "./SteamButton";

type Props = {
  video: ParsedVideo;
  /** titolo del video (nome accessibile del tasto e dell'iframe, didascalia) */
  title: string;
  /** anteprima salvata nel sito (public/…, la miniatura di un video di una guida): vince sulla miniatura di YouTube */
  poster?: string;
  labels: VideoLabels["player"];
  /** percorso della privacy nella lingua della pagina, con l'ancora del paragrafo sui video */
  privacyHref: string;
  /** misura (`video_play`): dove sta il lettore */
  placement: "deck_page" | "guide";
};

/**
 * Lettore "a clic" (pacchetto VIDEO, 26/09/2026). Prima del clic c'è solo un tasto con l'anteprima e la riga "caricando
 * il video accetti i cookie di …": la pagina non contatta YouTube né Twitch, niente cookie di terzi e niente centinaia
 * di KB di script del lettore. Anteprima, in quest'ordine: l'immagine salvata nel sito (`poster`, intera e senza
 * scritte sopra, così eventuali crediti impressi restano visibili), la miniatura di YouTube passata dall'ottimizzatore
 * del sito (il browser chiede /_next/image a originsmeta.com, mai a Google), altrimenti un riquadro con piattaforma e
 * titolo (Twitch, o una miniatura che non si carica). Niente illustrazioni del media kit come sfondo del tasto: il
 * materiale Koin non si usa per l'interfaccia.
 * Al clic l'iframe (youtube-nocookie.com, o Twitch con i `parent` del sito e della pagina) parte già in riproduzione e
 * riceve il focus, così chi usa la tastiera resta sul video. Twitch non riproduce un embed più piccolo di 400×300: in
 * un riquadro più piccolo il clic apre il video su Twitch, e il tasto e la nota lo dicono prima.
 */
export function VideoEmbed({ video, title, poster, labels, privacyHref, placement }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  /* Twitch in un riquadro sotto 400×300: lo misura un ResizeObserver dopo il montaggio (prima vale "entra") */
  const [narrow, setNarrow] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const provider = labels.providers[video.provider];
  const short = video.kind === "short";
  const external = watchUrl(video);
  const isTwitch = video.provider === "twitch";

  useEffect(() => {
    if (src) frame.current?.focus();
  }, [src]);

  useEffect(() => {
    const el = box.current;
    if (!isTwitch || !el || typeof ResizeObserver === "undefined") return;
    // la prima misura arriva subito dopo observe(): niente setState sincrono nell'effetto
    const ro = new ResizeObserver(() => setNarrow(!twitchFits(el.clientWidth, el.clientHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isTwitch]);

  const play = () => {
    trackEvent("video_play", { provider: video.provider, placement });
    const el = box.current;
    if (isTwitch && (!el || !twitchFits(el.clientWidth, el.clientHeight))) {
      window.open(external, "_blank", "noopener");
      return;
    }
    setSrc(embedSrc(video, twitchParents(window.location.hostname)));
  };

  // "YouTube", "YouTube · Short", "Twitch · VOD · dal minuto 12:30"
  const meta = [provider, video.kind === "video" ? "" : labels.kinds[video.kind], video.start ? fillVideoLabel(labels.from, { time: formatStart(video.start) }) : ""]
    .filter(Boolean)
    .join(" · ");
  const thumb = poster ?? (thumbFailed ? null : youtubeThumb(video));

  return (
    <figure className={`min-w-0 ${short ? "mx-auto w-full max-w-[22rem]" : ""}`}>
      <div ref={box} className={`relative overflow-hidden rounded-xl border-2 border-sky bg-night ${short ? "aspect-[9/16]" : "aspect-video"}`}>
        {src ? (
          <iframe
            ref={frame}
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={play}
            aria-label={narrow ? fillVideoLabel(labels.openTwitch, { title }) : fillVideoLabel(labels.play, { title, provider })}
            className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none"
          >
            {thumb ? (
              <Image
                src={thumb}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 720px"
                className={poster ? "object-contain" : "object-cover"}
                onError={poster ? undefined : () => setThumbFailed(true)}
              />
            ) : (
              <span aria-hidden="true" className="absolute inset-0 flex flex-col justify-between p-4 text-left">
                <span className="kicker text-mint">{meta}</span>
                <span className="line-clamp-2 font-display text-sm font-bold text-sky">{title}</span>
              </span>
            )}
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
      <figcaption className="mt-2 min-w-0">
        <span className="block break-words font-display text-sm font-bold text-sky">{title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pale-muted">
          <span className="font-mono">{meta}</span>
          <a
            href={external}
            target="_blank"
            rel="ugc nofollow noopener"
            aria-describedby={NEW_TAB_HINT_ID}
            className="inline-flex items-center gap-1 text-mint underline-offset-2 hover:underline"
          >
            {fillVideoLabel(labels.openOn, { provider })}
            <NewTabIcon />
          </a>
        </span>
        {src ? null : (
          <span className="mt-1 block text-xs text-pale-muted">
            {narrow ? (
              labels.narrow
            ) : (
              <>
                {fillVideoLabel(labels.consent, { provider })}{" "}
                <a href={privacyHref} className="underline underline-offset-2 hover:text-pale">
                  {labels.privacy}
                </a>
              </>
            )}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
