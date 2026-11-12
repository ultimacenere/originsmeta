"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/**
 * Riquadro navigabile di un tabellone grande (11/11/2026, Pierluigi sul tabellone da 512 a doppia eliminazione: "lo
 * scrolldown è infinito, aggiungiamo una barra di navigazione laterale anche all'inizio del tabellone, poi cliccando e
 * tenendo premuto all'interno del tabellone potersi muovere, aggiungerei anche zoom in e zoom out").
 * - Il tabellone sta in una finestra alta al massimo quanto lo schermo, che scorre dentro nei due versi: la pagina non si
 *   allunga più di 25.000 pixel e la barra orizzontale è sempre a portata di mano, non in fondo al primo turno.
 * - In cima, una barra con un tasto per colonna (i turni e i qualificati) che porta la finestra su quella colonna, lo zoom
 *   (−, la percentuale che riporta al 100%, +) e "Schermo intero": il riquadro copre tutta la finestra del browser (in
 *   CSS, non con l'API Fullscreen: funziona anche su iPhone e non chiede permessi), Esc o lo stesso tasto per uscire.
 * - Col mouse si tiene premuto e si trascina (dopo un trascinamento il clic non apre la partita); col dito lo scorrimento
 *   nei due versi è quello del browser. Da tastiera la finestra prende il fuoco e scorre con le frecce.
 * Il contenuto (le colonne, disegnate sul server) arriva come `children`; ogni colonna porta `data-col` con il suo numero.
 */
export type BracketViewLabels = { region: string; rounds: string; zoomIn: string; zoomOut: string; zoomReset: string; full: string; exitFull: string; hint: string };

const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.8, 1, 1.25] as const;
const ZOOM_100 = 5;
/** pixel di movimento oltre i quali il clic diventa un trascinamento */
const DRAG_START = 6;

type Drag = { id: number; x: number; y: number; left: number; top: number; moved: boolean };

export function BracketViewport({ columns, labels, resetKey, children }: { columns: string[]; labels: BracketViewLabels; resetKey: string; children: ReactNode }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zi, setZi] = useState<number>(ZOOM_100);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const skipClick = useRef(false);
  /**
   * Il punto del tabellone al centro della finestra prima di un cambio di zoom (in frazioni del contenuto); `left` e
   * `top` dicono che la finestra era attaccata al bordo, e lì deve restare (dall'inizio non si scivola in mezzo).
   */
  const keep = useRef<{ x: number; y: number; left: boolean; top: boolean } | null>(null);
  const [full, setFull] = useState(false);

  // a tutta finestra: la pagina sotto non scorre ed Esc riporta al riquadro
  useEffect(() => {
    if (!full) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  // un'altra scheda (vincenti, perdenti, un altro tabellone): si riparte dall'angolo in alto a sinistra
  useEffect(() => {
    viewRef.current?.scrollTo({ left: 0, top: 0 });
  }, [resetKey]);

  // dopo un cambio di zoom il punto che era al centro resta al centro
  useLayoutEffect(() => {
    const v = viewRef.current;
    const k = keep.current;
    if (!v || !k) return;
    keep.current = null;
    v.scrollLeft = k.left ? 0 : k.x * v.scrollWidth - v.clientWidth / 2;
    v.scrollTop = k.top ? 0 : k.y * v.scrollHeight - v.clientHeight / 2;
  }, [zi]);

  const zoomTo = (next: number) => {
    const v = viewRef.current;
    const i = Math.min(ZOOMS.length - 1, Math.max(0, next));
    if (!v || i === zi) return;
    keep.current = {
      x: (v.scrollLeft + v.clientWidth / 2) / Math.max(1, v.scrollWidth),
      y: (v.scrollTop + v.clientHeight / 2) / Math.max(1, v.scrollHeight),
      left: v.scrollLeft < 1,
      top: v.scrollTop < 1,
    };
    setZi(i);
  };

  const jump = (i: number) => {
    const v = viewRef.current;
    const col = contentRef.current?.querySelector<HTMLElement>(`[data-col="${i}"]`);
    if (!v || !col) return;
    const left = col.getBoundingClientRect().left - v.getBoundingClientRect().left + v.scrollLeft - 12;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    v.scrollTo({ left: Math.max(0, left), behavior: calm ? "auto" : "smooth" });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const v = viewRef.current;
    if (!v || e.pointerType !== "mouse" || e.button !== 0) return;
    // sulle barre di scorrimento il clic resta della barra
    const r = v.getBoundingClientRect();
    if (e.clientX - r.left - v.clientLeft >= v.clientWidth || e.clientY - r.top - v.clientTop >= v.clientHeight) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: v.scrollLeft, top: v.scrollTop, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const v = viewRef.current;
    const d = drag.current;
    if (!v || !d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_START) return;
      d.moved = true;
      setDragging(true);
      v.setPointerCapture(d.id);
      window.getSelection()?.removeAllRanges();
    }
    v.scrollLeft = d.left - dx;
    v.scrollTop = d.top - dy;
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    setDragging(false);
    // il clic che chiude un trascinamento non deve aprire la partita sotto il puntatore
    skipClick.current = true;
    window.setTimeout(() => {
      skipClick.current = false;
    }, 0);
  };

  const zoomBtn = "btn btn-ink !px-3 !py-1 font-mono text-sm disabled:opacity-40";
  return (
    <div data-bracket-view="" className={full ? "fixed inset-0 z-[90] flex flex-col bg-felt p-3 sm:p-4" : ""}>
      {/* sul telefono i turni su una riga loro e lo zoom sotto; da 640 px tutto su una riga */}
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <nav aria-label={labels.rounds} className="flex min-w-0 flex-wrap gap-1.5 sm:flex-1">
          {columns.map((name, i) => (
            <button key={i} type="button" onClick={() => jump(i)} className="whitespace-nowrap rounded-lg border-2 border-sky px-2.5 py-1 text-xs font-semibold text-pale-muted hover:border-mint hover:text-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint">
              {name}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => zoomTo(zi - 1)} disabled={zi === 0} aria-label={labels.zoomOut} title={labels.zoomOut} className={zoomBtn}>
            −
          </button>
          <button type="button" onClick={() => zoomTo(ZOOM_100)} aria-label={labels.zoomReset} title={labels.zoomReset} className="min-w-14 rounded-lg border-2 border-sky px-2 py-1 text-center font-mono text-xs text-pale hover:border-mint">
            {Math.round(ZOOMS[zi] * 100)}%
          </button>
          <button type="button" onClick={() => zoomTo(zi + 1)} disabled={zi === ZOOMS.length - 1} aria-label={labels.zoomIn} title={labels.zoomIn} className={zoomBtn}>
            +
          </button>
          <button type="button" onClick={() => setFull((v) => !v)} aria-pressed={full} className="btn btn-ink !px-3 !py-1 text-xs">
            {full ? labels.exitFull : labels.full}
          </button>
        </div>
      </div>
      <p className="mb-2 text-xs text-pale-muted">{labels.hint}</p>
      <div
        ref={viewRef}
        role="region"
        aria-label={labels.region}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (!skipClick.current) return;
          skipClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`bracket-view-scroll overflow-auto rounded-xl border-2 border-sky/60 bg-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint ${full ? "min-h-0 flex-1" : "max-h-[min(78vh,56rem)]"} ${dragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        <div ref={contentRef} style={{ zoom: ZOOMS[zi] }} className="flex min-w-max gap-6 px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}
