"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";

export type TickerItem = {
  key: string;
  href: string;
  /** data ISO (aaaa-mm-gg) per ordinare eventi ufficiali e tornei della community */
  date: string;
  day: string | number;
  month: string;
  title: string;
  where: string;
  isNext: boolean;
};

type Props = {
  items: TickerItem[];
  ariaLabel: string;
  nextLabel: string;
  prevLabel: string;
  nextBtnLabel: string;
  /** velocità in pixel al secondo */
  speed?: number;
  /** JSON con i tornei della community per lingua (/api/calendar): caricato nel browser, così il layout resta statico */
  extraUrl?: string;
  locale?: string;
};

/** Unisce eventi ufficiali e tornei, in ordine di data; il primo è "il prossimo" (evidenziato in giallo). */
function merge(base: TickerItem[], extra: TickerItem[]): TickerItem[] {
  const seen = new Set(base.map((i) => i.key));
  const all = [...base, ...extra.filter((i) => !seen.has(i.key))].sort((a, b) => a.date.localeCompare(b.date));
  return all.map((it, i) => ({ ...it, isNext: i === 0 }));
}

const PAUSE_AFTER_INTERACTION = 6000;

/**
 * Quante volte ripetere la lista dentro una copia perché la copia sia più larga della striscia (23/09/2026).
 * Il ciclo di scorrimento si regge su due copie identiche: se una copia non riempie la striscia non c'è niente
 * da far scorrere e il nastro resta fermo — era il motivo per cui con pochi eventi su uno schermo largo la
 * striscia non si muoveva (§1 punto 27.4 della KB). Tetto a 8 per non moltiplicare i nodi all'infinito.
 */
const MAX_REPEATS = 8;

/**
 * Striscia del calendario: scorre da sola (requestAnimationFrame, non CSS) così si può anche navigare
 * a mano con le frecce, la rotella o il dito; si ferma al passaggio del mouse. La lista è duplicata e,
 * superata la prima copia, la posizione torna indietro di una copia: il ciclo non ha mai un salto visibile.
 * Tra la fine e l'inizio del ciclo c'è un blocco con il logo del gioco. Con "riduci il movimento" attivo
 * non scorre da sola ma resta navigabile.
 */
export function TickerMarquee({ items: base, ariaLabel, nextLabel, prevLabel, nextBtnLabel, speed = 16, extraUrl, locale }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const [hover, setHover] = useState(false);
  const [extra, setExtra] = useState<TickerItem[]>([]);
  const items = extra.length ? merge(base, extra) : base;
  /** ripetizioni della lista dentro ogni copia: si misurano nel browser (vedi MAX_REPEATS) */
  const [repeats, setRepeats] = useState(1);

  /* tornei della community: arrivano dopo il primo render, dal JSON in cache (nessuna lettura di Supabase nel layout) */
  useEffect(() => {
    if (!extraUrl || !locale) return;
    let alive = true;
    fetch(extraUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, TickerItem[]> | null) => {
        const list = data?.[locale];
        if (alive && Array.isArray(list) && list.length) setExtra(list);
      })
      .catch(() => {
        /* la striscia resta con i soli eventi ufficiali */
      });
    return () => {
      alive = false;
    };
  }, [extraUrl, locale]);

  /*
   * Il ciclo di animazione gira solo quando serve (21/09/2026): striscia dentro lo schermo e scheda visibile.
   * Fuori schermo o a scheda nascosta si ferma del tutto, invece di chiedere un fotogramma a vuoto 60 volte al
   * secondo. I due segnali arrivano da IntersectionObserver e visibilitychange, mai letti durante il render.
   */
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // più notifiche nello stesso giro (dentro e fuori in fretta): conta l'ultima
    const io = new IntersectionObserver((entries) => setInView(entries[entries.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /*
   * Quante ripetizioni servono perché una copia superi la larghezza della striscia (23/09/2026). Si misura la
   * lista vera disegnata (una copia = `repeats` ripetizioni più il blocco col logo) e si ricalcola quando la
   * finestra cambia misura o arrivano i tornei del calendario. Il valore si alza solo di quanto serve, con il
   * tetto di MAX_REPEATS, e non scende mai sotto 1: nessun ciclo fra misura e render.
   */
  useEffect(() => {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const measure = () => {
      const copy = track.scrollWidth / 2;
      if (copy <= 0) return;
      const unit = copy / repeats;
      if (unit <= 0) return;
      // una copia deve superare la striscia: mezzo elemento in più evita di restare a filo
      const needed = Math.min(MAX_REPEATS, Math.max(1, Math.ceil((el.clientWidth + unit / 2) / unit)));
      if (needed !== repeats) setRepeats(needed);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [repeats, items]);

  useEffect(() => {
    const el = ref.current;
    if (!el || hover || !inView || !pageVisible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const half = el.scrollWidth / 2;
      if (now > pausedUntil.current && half > el.clientWidth) {
        el.scrollLeft += (speed * dt) / 1000;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hover, speed, inView, pageVisible]);

  const pause = () => {
    pausedUntil.current = performance.now() + PAUSE_AFTER_INTERACTION;
  };

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    pause();
    const half = el.scrollWidth / 2;
    const stepPx = Math.max(240, el.clientWidth * 0.6);
    // le due copie sono identiche: il riposizionamento di una copia intera non si vede
    if (dir < 0 && el.scrollLeft - stepPx < 0) el.scrollLeft += half;
    if (dir > 0 && el.scrollLeft + stepPx >= half) el.scrollLeft -= half;
    el.scrollBy({ left: dir * stepPx, behavior: "smooth" });
  };

  return (
    <div className="ticker" aria-label={ariaLabel} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}>
      <button type="button" className="ticker-arrow left-2" onClick={() => nudge(-1)} aria-label={prevLabel}>
        ‹
      </button>
      <div ref={ref} className="ticker-scroll" onWheel={pause} onTouchStart={pause} onPointerDown={pause}>
        <div ref={trackRef} className="ticker-track">
          {/* Due copie identiche per il ciclo; dentro ognuna la lista si ripete quanto basta a superare la
              larghezza della striscia, altrimenti non ci sarebbe niente da scorrere (vedi MAX_REPEATS). */}
          {[0, 1].map((copy) => (
            <Fragment key={copy}>
              {Array.from({ length: repeats }).flatMap((_, rep) =>
              items.map((it) => (
                <Link
                  key={`${it.key}-${copy}-${rep}`}
                  href={it.href}
                  aria-hidden={copy === 1 || rep > 0 ? true : undefined}
                  tabIndex={copy === 1 || rep > 0 ? -1 : undefined}
                  className="flex shrink-0 items-center gap-3 rounded-xl px-2 py-1 hover:bg-felt-soft"
                >
                  <span className={`date-cube ${it.isNext ? "is-next" : ""}`}>
                    <span className="text-lg">{it.day}</span>
                    <small>{it.month}</small>
                  </span>
                  <span className="min-w-0">
                    <span className={`block font-display text-sm font-bold ${it.isNext ? "text-gold" : "text-sky"}`}>{it.title}</span>
                    <span className="block font-mono text-[11px] uppercase tracking-wider text-chalk-muted">
                      {it.isNext ? `${nextLabel} · ` : ""}
                      {it.where}
                    </span>
                  </span>
                </Link>
              )),
              )}
              <span className="ticker-spacer" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/origins-tcg-logo.webp" alt="" loading="lazy" />
                Origins TCG
              </span>
            </Fragment>
          ))}
        </div>
      </div>
      <button type="button" className="ticker-arrow right-2" onClick={() => nudge(1)} aria-label={nextBtnLabel}>
        ›
      </button>
    </div>
  );
}
