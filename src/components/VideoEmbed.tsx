"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TWITCH_MIN_WIDTH, embedSrc, formatStart, twitchParents, watchUrl, type ParsedVideo } from "@/lib/videos";
import { fillVideoLabel, type VideoLabels } from "@/lib/videoLabels";
import { trackEvent } from "@/lib/analytics";
import { NEW_TAB_HINT_ID, NewTabIcon } from "./SteamButton";

type Props = {
  video: ParsedVideo;
  /** titolo del video (nome accessibile del tasto e dell'iframe) */
  title: string;
  /** anteprima: un'immagine del sito (illustrazione della Leggendaria, copertina della guida), mai una miniatura presa da YouTube */
  poster?: string;
  labels: VideoLabels["player"];
  /** percorso della privacy nella lingua della pagina, con l'ancora del paragrafo sui video */
  privacyHref: string;
  /** misura (`video_play`): dove sta il lettore */
  placement: "deck_page" | "guide";
};

/**
 * Lettore "a clic" (pacchetto VIDEO, 26/09/2026). Prima del clic c'è solo un tasto con un'immagine del sito e la riga
 * "caricando il video accetti i cookie di …": la pagina non contatta YouTube né Twitch, niente cookie di terzi e niente
 * centinaia di KB di script del lettore. Al clic l'iframe (youtube-nocookie.com, o Twitch con i `parent` del sito e
 * della pagina) parte già in riproduzione e riceve il focus, così chi usa la tastiera resta sul video.
 * Twitch non riproduce un embed più stretto di 400 px: sotto quella misura il clic apre il video su Twitch.
 * L'immagine resta intera (object-contain) e senza scritte sopra: le copertine del media kit hanno i crediti impressi,
 * che non si coprono né si tagliano. Titolo e dati del video stanno sotto.
 */
export function VideoEmbed({ video, title, poster, labels, privacyHref, placement }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const provider = labels.providers[video.provider];
  const short = video.kind === "short";
  const external = watchUrl(video);

  useEffect(() => {
    if (src) frame.current?.focus();
  }, [src]);

  const play = () => {
    trackEvent("video_play", { provider: video.provider, placement });
    if (video.provider === "twitch" && (box.current?.clientWidth ?? 0) < TWITCH_MIN_WIDTH) {
      window.open(external, "_blank", "noopener");
      return;
    }
    setSrc(embedSrc(video, twitchParents(window.location.hostname)));
  };

  // "YouTube", "YouTube · Short", "Twitch · VOD · dal minuto 12:30"
  const meta = [provider, video.kind === "video" ? "" : labels.kinds[video.kind], video.start ? fillVideoLabel(labels.from, { time: formatStart(video.start) }) : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <figure className={`min-w-0 ${short ? "mx-auto w-full max-w-[22rem]" : ""}`}>
      <div ref={box} className={`relative overflow-hidden rounded-xl border-2 border-sky bg-felt-deep ${short ? "aspect-[9/16]" : "aspect-video"}`}>
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
            aria-label={fillVideoLabel(labels.play, { title, provider })}
            className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none"
          >
            {poster ? (
              <Image src={poster} alt="" fill sizes="(max-width: 768px) 92vw, 720px" className="object-contain opacity-80 transition-opacity group-hover:opacity-100" />
            ) : null}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-mint text-ink shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-sky motion-reduce:transition-none"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current">
                <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 min-w-0">
        <span className="block font-display text-sm font-bold text-sky">{title}</span>
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
            {fillVideoLabel(labels.consent, { provider })}{" "}
            <a href={privacyHref} className="underline underline-offset-2 hover:text-pale">
              {labels.privacy}
            </a>
            {video.provider === "twitch" ? <span className="sm:hidden"> {labels.narrow}</span> : null}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
