"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SteamButton } from "./SteamButton";

export type Slide = {
  src: string;
  alt: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  /** link esterno (Steam): apre come <a>, altrimenti Link interno */
  external?: boolean;
  cta: string;
};

export type SliderLabels = { prev: string; next: string; goTo: string; credit: string };

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/**
 * Slider a tutta larghezza con le immagini ufficiali del media kit: rotazione automatica (ferma al passaggio
 * del mouse, con il focus e se l'utente preferisce meno animazioni), frecce, puntini, tastiera e swipe.
 */
export function HeroSlider({ slides, labels, interval = 6500 }: { slides: Slide[]; labels: SliderLabels; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const go = (k: number) => setIndex(((k % n) + n) % n);

  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % n), interval);
    return () => window.clearInterval(id);
  }, [paused, n, interval]);

  const active = slides[index];
  const arrow = "absolute top-1/2 z-20 hidden sm:block -translate-y-1/2 rounded-full border border-ivory/40 bg-felt-deep/70 p-2 text-ivory backdrop-blur transition hover:border-mint hover:text-mint";

  return (
    <section
      className="group relative h-[36vh] max-h-[460px] min-h-[250px] w-full overflow-hidden bg-felt-deep"
      aria-roledescription="carousel"
      aria-label="Origins TCG"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {slides.map((s, k) => (
        <div key={s.src} className={`absolute inset-0 transition-opacity duration-700 ease-out ${k === index ? "opacity-100" : "opacity-0"}`} aria-hidden={k !== index}>
          <Image src={s.src} alt={s.alt} fill priority={k === 0} sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-felt-deep via-felt-deep/35 to-felt-deep/5" aria-hidden="true" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pb-6 sm:px-6">
          <div className="max-w-2xl" aria-live="polite">
            <p className="kicker text-mint">{active.kicker}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-ivory sm:text-3xl">{active.title}</h2>
            <p className="mt-1 hidden text-sm text-chalk-muted sm:block">{active.text}</p>
            {active.external ? (
              <SteamButton href={active.href} variant="green" size="sm" className="mt-3">
                {active.cta}
              </SteamButton>
            ) : (
              <Link href={active.href} className="btn btn-mint mt-3 text-xs">
                {active.cta}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" role="tablist">
              {slides.map((s, k) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={k === index}
                  aria-label={fmt(labels.goTo, { n: k + 1 })}
                  onClick={() => go(k)}
                  className={`h-2 rounded-full transition-all ${k === index ? "w-6 bg-mint" : "w-2 bg-ivory/50 hover:bg-ivory"}`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-muted/70">{labels.credit}</span>
          </div>
        </div>
      </div>

      <button type="button" onClick={() => go(index - 1)} aria-label={labels.prev} className={`${arrow} left-3 sm:left-5`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className={`${arrow} right-3 sm:right-5`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </section>
  );
}
