"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { VideoLabels } from "@/lib/videoLabels";
import type { CreatorVideoLabels } from "@/lib/creatorVideoLabels";
import { VideoEmbed } from "./VideoEmbed";

export type RailVideo = {
  id: string;
  title: string;
  /** data già scritta nella lingua della pagina */
  date: string;
  name: string;
  /** /<lingua>/u/<nome> */
  profileHref: string;
};

/**
 * Carosello dei video dei creator in home (08/10/2026): una fila che scorre di lato (dito, rotella, tastiera) con le
 * frecce per chi usa il mouse. Ogni video è il lettore a clic del sito (`VideoEmbed`): prima del clic nessuna richiesta
 * a YouTube, l'anteprima passa dall'ottimizzatore di immagini del sito. Niente scorrimento automatico: un video che parte
 * non deve scappare via. Le frecce si spengono ai due capi della fila.
 */
export function CreatorVideoRail({ videos, labels, player, privacyHref }: { videos: RailVideo[]; labels: CreatorVideoLabels; player: VideoLabels["player"]; privacyHref: string }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow = "grid h-9 w-9 place-items-center rounded-full border-2 border-sky bg-night text-sky transition-colors hover:bg-night-2 disabled:cursor-default disabled:opacity-40";
  return (
    <div className="mt-4">
      <div className="mb-3 hidden justify-end gap-2 sm:flex">
        <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label={labels.prev} className={arrow}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" onClick={() => go(1)} disabled={edges.end} aria-label={labels.next} className={arrow}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <ul ref={rail} aria-label={labels.list} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {videos.map((v) => (
          <li key={v.id} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc((100%-2.5rem)/3)]">
            <VideoEmbed
              video={{ provider: "youtube", kind: "video", id: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, title: v.title }}
              title={v.title}
              labels={player}
              privacyHref={privacyHref}
              placement="home"
            />
            <p className="mt-1 text-xs text-pale-muted">
              <Link href={v.profileHref} className="font-bold text-mint hover:underline">
                {labels.by.replace("{name}", v.name)}
              </Link>
              {" · "}
              <span className="font-mono">{v.date}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
