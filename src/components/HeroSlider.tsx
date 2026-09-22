"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

export type SliderLabels = { prev: string; next: string; goTo: string; credit: string; pause: string; play: string };

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/* Preferenza "riduci il movimento" letta come sorgente esterna: niente setState dentro un effetto */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const getServerReducedMotion = () => false;

/**
 * Slider a tutta larghezza con le immagini ufficiali del media kit: rotazione automatica (ferma al passaggio
 * del mouse, con il focus, con il tasto pausa e se l'utente preferisce meno animazioni), frecce, puntini,
 * tastiera e swipe.
 *
 * Revisione del 21/09/2026 (GR-10):
 * - sul telefono l'immagine sta sopra (2:1) e il testo sotto, sempre visibile e ad altezza fissa: il primo schermo
 *   non è più tutto slider e la pagina non salta a ogni cambio di slide; da sm in su il testo resta sovrapposto;
 * - tasto pausa/riproduci (WCAG 2.2.2) e `aria-live` solo quando la rotazione è ferma: con uno screen reader la
 *   home non parla più ogni 4,5 secondi, ma annuncia la slide quando è l'utente a cambiarla;
 * - puntini con area cliccabile di 24 px;
 * - si montano solo la slide attiva e la successiva (più quelle già viste), non tutte e cinque; la prima ha
 *   priorità alta perché è l'elemento più grande del primo schermo.
 */
export function HeroSlider({ slides, labels, interval = 4500 }: { slides: Slide[]; labels: SliderLabels; interval?: number }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  /* hover e focus fermano la rotazione solo finché durano; `choice` è la scelta esplicita dell'utente (tasto) */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);
  const touchX = useRef<number | null>(null);

  /* slide montate: la attiva e la successiva, più quelle già viste (tornarci non ricarica l'immagine) */
  const next = (index + 1) % n;
  const [mounted, setMounted] = useState<number[]>(() => (n > 1 ? [0, 1] : [0]));
  if (!mounted.includes(index) || !mounted.includes(next)) {
    // aggiornamento durante il render (schema "informazioni dal render precedente" di React), senza effetti
    setMounted((m) => Array.from(new Set([...m, index, next])));
  }

  const go = (k: number) => setIndex(((k % n) + n) % n);
  /* con "riduci il movimento" la rotazione non parte da sola, ma l'utente può avviarla con il tasto */
  const wantsRotation = choice === "play" || (choice === "auto" && !reducedMotion);
  const rotating = wantsRotation && !hovered && !focused && n > 1;

  useEffect(() => {
    if (!rotating) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % n), interval);
    return () => window.clearInterval(id);
  }, [rotating, n, interval]);

  const active = slides[index];
  const arrow = "absolute top-1/2 z-20 hidden sm:block -translate-y-1/2 rounded-full border border-chalk/40 bg-felt-deep/70 p-2 text-chalk backdrop-blur transition hover:border-mint hover:text-mint";

  /* Tasto pausa/riproduci + puntini: stessi controlli sul telefono (sull'immagine) e da sm (accanto al credito) */
  const controls = (
    <div className="flex items-center gap-0.5 rounded-full bg-felt-deep/70 px-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setChoice(wantsRotation ? "pause" : "play")}
        aria-label={wantsRotation ? labels.pause : labels.play}
        className="grid h-6 w-6 place-items-center rounded-full text-chalk transition hover:text-mint"
      >
        {wantsRotation ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
            <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      {slides.map((s, k) => (
        <button
          key={s.src}
          type="button"
          aria-current={k === index ? "true" : undefined}
          aria-label={fmt(labels.goTo, { n: k + 1 })}
          onClick={() => go(k)}
          className="group/dot grid h-6 min-w-6 place-items-center"
        >
          <span className={`block h-2 rounded-full transition-all ${k === index ? "w-6 bg-mint" : "w-2 bg-chalk/50 group-hover/dot:bg-chalk"}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  return (
    <section
      className="group relative w-full overflow-hidden bg-felt-deep sm:h-[calc(36vh+200px)] sm:max-h-[660px] sm:min-h-[450px]"
      aria-roledescription="carousel"
      aria-label="Origins TCG"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // il focus che passa da un controllo all'altro dello slider non fa ripartire la rotazione
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
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
      {/* Immagini: 2:1 sopra il testo sul telefono, a tutta altezza da sm in su */}
      <div className="relative aspect-[2/1] w-full sm:absolute sm:inset-0 sm:aspect-auto">
        {slides.map((s, k) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${k === index ? "opacity-100" : "opacity-0"}`}
            aria-hidden={k !== index}
          >
            {mounted.includes(k) ? (
              <Image
                src={s.src}
                alt={s.alt}
                fill
                sizes="100vw"
                loading={k === 0 ? "eager" : "lazy"}
                fetchPriority={k === 0 ? "high" : "auto"}
                className="object-cover object-center"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-felt-deep via-felt-deep/20 to-transparent sm:via-felt-deep/35 sm:to-felt-deep/5" aria-hidden="true" />
          </div>
        ))}

        {/* Sul telefono: credito in alto a sinistra (mai tolto), puntini e pausa in basso a destra */}
        <span className="absolute left-2 top-2 z-10 rounded bg-felt-deep/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-chalk-muted sm:hidden">
          {labels.credit}
        </span>
        <div className="absolute bottom-2 right-2 z-10 sm:hidden">{controls}</div>
      </div>

      <div className="relative z-10 sm:absolute sm:inset-x-0 sm:bottom-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
          {/*
            Altezza ferma sul telefono: il contenuto sotto lo slider non si sposta a ogni cambio automatico.
            140 px e non più 168 (22/09/2026, dopo la rimozione del blocco titolo): misurato a 375 px, il contenuto
            più alto (kicker 18 + titolo su una riga 25 + testo su due righe 40 + tasto 46 + spazi 8) fa 137 px, e i
            31 px in più restavano un vuoto fra il testo e il tasto, prima delle news. Per questo sul telefono il
            titolo sta su una riga sola (a 320 px il più lungo prende i puntini; il testo intero resta nel DOM).
            `min-h` e non `h`: con il testo ingrandito (zoom del solo testo, caratteri grandi di Android, WCAG 1.4.4)
            il riquadro cresce invece di far uscire il contenuto sopra la striscia del calendario.
          */}
          <div className="flex min-h-[140px] w-full max-w-2xl flex-col sm:min-h-0 sm:w-auto" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
            <p className="kicker truncate text-mint">{active.kicker}</p>
            {/* Non è un titolo di sezione: l'unico H1 della pagina è quello (nascosto alla vista) in cima al main della home */}
            <p className="mt-1 line-clamp-1 font-display text-xl font-extrabold leading-tight text-sky sm:line-clamp-2 sm:text-3xl">{active.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-chalk-muted sm:line-clamp-none">{active.text}</p>
            <div className="mt-auto pt-2 sm:mt-0 sm:pt-3">
              {active.external ? (
                <SteamButton href={active.href} variant="green" size="sm">
                  {active.cta}
                </SteamButton>
              ) : (
                <Link href={active.href} className="btn btn-primary text-xs">
                  {active.cta}
                </Link>
              )}
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            {controls}
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
