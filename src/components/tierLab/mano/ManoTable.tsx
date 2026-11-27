"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { GameCardFace } from "@/components/GameCard";
import type { Locale } from "@/lib/i18n";
import type { LabLegendary } from "@/lib/tierLab/types";
import { Dossier, type DossierCtx } from "./Dossier";
import { TIER_ORDER, shortLabel, tierLetter, tierMeaning, tierName } from "./text";
import "./mano.css";

/**
 * «La mano del meta» (prototipo 1 della tier list, 27/11/2026): ogni fascia è una mano di carte del gioco a ventaglio;
 * al passaggio la carta si alza, al clic si apre l'ispezione (carta grande che si gira, sul retro il fascicolo).
 * Pre-renderizzato: carte, nomi, fasce e numeri sono nell'HTML; senza JavaScript ogni carta porta al suo fascicolo
 * nell'archivio in fondo alla pagina (id `f-<slug>`).
 */

type Dir = "next" | "prev" | "open";

export function ManoTable({ legendaries, ctx }: { legendaries: LabLegendary[]; ctx: DossierCtx }) {
  const locale = ctx.locale as Locale;
  const dialog = useRef<HTMLDialogElement>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState<Dir>("open");
  const lastSlug = useRef<string | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const flipTimer = useRef<number | undefined>(undefined);

  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const open = useCallback(
    (i: number) => {
      window.clearTimeout(flipTimer.current);
      setDir("open");
      setIdx(i);
      lastSlug.current = legendaries[i].slug;
      if (reduced()) setFlipped(true);
      else {
        setFlipped(false);
        // la carta arriva davanti, poi si gira da sola sul fascicolo
        flipTimer.current = window.setTimeout(() => setFlipped(true), 520);
      }
      const d = dialog.current;
      if (d && !d.open) d.showModal();
      document.documentElement.classList.add("tlm-lock");
    },
    [legendaries],
  );

  const step = useCallback(
    (delta: number) => {
      setIdx((cur) => {
        if (cur === null) return cur;
        const n = legendaries.length;
        const next = (cur + delta + n) % n;
        lastSlug.current = legendaries[next].slug;
        return next;
      });
      window.clearTimeout(flipTimer.current);
      setDir(delta > 0 ? "next" : "prev");
    },
    [legendaries],
  );

  const close = useCallback(() => dialog.current?.close(), []);

  // l'archivio dei fascicoli è aperto nell'HTML (per chi non ha JavaScript): qui si chiude, e un link #f-<slug> apre l'ispezione
  useEffect(() => {
    document.getElementById("fascicoli")?.removeAttribute("open");
    const fromHash = () => {
      const m = /^#f-(.+)$/.exec(window.location.hash);
      if (!m) return;
      const i = legendaries.findIndex((l) => l.slug === decodeURIComponent(m[1]));
      if (i >= 0) open(i);
    };
    fromHash();
    return () => window.clearTimeout(flipTimer.current);
  }, [legendaries, open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      window.clearTimeout(flipTimer.current);
      document.documentElement.classList.remove("tlm-lock");
      const slug = lastSlug.current;
      setIdx(null);
      if (slug) document.getElementById(`c-${slug}`)?.focus({ preventScroll: false });
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const groups = TIER_ORDER.map((tier) => ({ tier, cards: legendaries.map((l, i) => ({ l, i })).filter(({ l }) => l.official.tier === tier) })).filter(
    (g) => g.cards.length,
  );

  const cur = idx !== null ? legendaries[idx] : null;

  return (
    <>
      <div className="tlm-table">
        {groups.map((g) => (
          <section key={g.tier} className={`tlm-hand tlm-hand--${g.tier}`} aria-labelledby={`tlm-h-${g.tier}`}>
            <div className="tlm-hand-head">
              <span className={`tlm-stamp tlm-tone--${g.tier}`} aria-hidden="true">
                {tierLetter(g.tier)}
              </span>
              <div className="min-w-0">
                <h2 id={`tlm-h-${g.tier}`} className="tlm-hand-title">
                  {tierName(g.tier)}
                </h2>
                <p className="tlm-hand-mean">{tierMeaning[g.tier]}</p>
              </div>
            </div>
            <ol className="tlm-fan" style={{ "--n": g.cards.length } as CSSProperties}>
              {g.cards.map(({ l, i }, k) => {
                const o = k - (g.cards.length - 1) / 2;
                return (
                  <li key={l.slug} className="tlm-slot" style={{ "--o": o, "--o2": o * o } as CSSProperties}>
                    <a
                      id={`c-${l.slug}`}
                      href={`#f-${l.slug}`}
                      className="tlm-card"
                      aria-label={`${l.name}, ${tierName(l.official.tier)}: ${shortLabel(ctx.locale, l)}. Guarda la carta da vicino`}
                      onClick={(e) => {
                        e.preventDefault();
                        open(i);
                      }}
                    >
                      <span className="tlm-card-face" aria-hidden="true">
                        <GameCardFace input={l.game} lang={locale} />
                      </span>
                      <span className="tlm-tag" aria-hidden="true">
                        <span>{shortLabel(ctx.locale, l)}</span>
                        {l.official.boosted && l.official.ladderTier !== l.official.tier ? <span className="tlm-tag-plus">+1 Crimson Cup</span> : null}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="tlm-inspect"
        aria-label={cur ? `${cur.name}: il fascicolo` : "Ispezione della carta"}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
      >
        {cur && idx !== null ? (
          <div className="tlm-sheet">
            <div className="tlm-sheet-bar">
              <span className="tlm-sheet-count">
                {idx + 1} di {legendaries.length}
              </span>
              <button type="button" className="tlm-btn tlm-btn--ghost" onClick={close}>
                Chiudi
              </button>
            </div>
            <div
              className="tlm-stage"
              onTouchStart={(e) => {
                const t = e.touches[0];
                swipe.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
              }}
              onTouchEnd={(e) => {
                const s = swipe.current;
                swipe.current = null;
                const t = e.changedTouches[0];
                if (!s || !t) return;
                const dx = t.clientX - s.x;
                const dy = t.clientY - s.y;
                // passata di lato: carta dopo o prima (in verticale si scorre il fascicolo)
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
              }}
              onTouchCancel={() => (swipe.current = null)}
            >
              <button type="button" className="tlm-nav tlm-nav--prev" aria-label="Carta precedente" onClick={() => step(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <div key={`${cur.slug}-${dir}`} className={`tlm-slide is-${dir}`}>
                <div className={`tlm-flip${flipped ? " is-flipped" : ""}`}>
                  <button
                    type="button"
                    className="tlm-face tlm-face--front"
                    aria-label={`Gira la carta di ${cur.name} e leggi il fascicolo`}
                    tabIndex={flipped ? -1 : 0}
                    onClick={() => setFlipped(true)}
                  >
                    <GameCardFace input={cur.game} lang={locale} />
                    <span className={`tlm-stamp tlm-stamp--card tlm-tone--${cur.official.tier}`} aria-hidden="true">
                      {tierLetter(cur.official.tier)}
                    </span>
                  </button>
                  <div className="tlm-face tlm-face--back" aria-hidden={!flipped}>
                    <div className="tlm-back" tabIndex={flipped ? 0 : -1}>
                      <Dossier l={cur} ctx={ctx} level={2} />
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" className="tlm-nav tlm-nav--next" aria-label="Carta successiva" onClick={() => step(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="tlm-sheet-foot">
              <button type="button" className="tlm-btn" autoFocus onClick={() => setFlipped((f) => !f)}>
                {flipped ? "Guarda la carta" : "Leggi il fascicolo"}
              </button>
              <span className="tlm-sheet-hint">← → per sfogliare · Esc per chiudere</span>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

