import type { CSSProperties, ReactNode } from "react";
import { pos, type Axis, type Dir } from "@/lib/tracker/snapshot";

/*
  Pezzi comuni della pagina /analytics (design "Meta Snapshot v2.0", 12/10/2026): delta dal 50%, forbice dell'intervallo,
  carta intera, testata di sezione. Senza stato né hook, così li usano anche i client component della pagina (ricevono
  numeri e testi già pronti dal server). Stili `.an-*` in fondo a globals.css.
*/

/** Freccia e punti dal 50% ("▲ +7,1 pt"); per i lettori di schermo la frase intera. */
export type DeltaInfo = { dir: Dir; text: string; sr: string };
export function Delta({ d, pt, block = false }: { d: DeltaInfo; pt?: string; block?: boolean }) {
  const arrow = d.dir === "up" ? "▲" : d.dir === "down" ? "▼" : "=";
  return (
    <span className={`an-delta is-${d.dir}${block ? " is-block" : ""}`}>
      <span aria-hidden="true">
        {arrow} {d.text}
        {pt ? ` ${pt}` : ""}
      </span>
      <span className="sr-only">{d.sr}</span>
    </span>
  );
}

/** La forbice dell'intervallo su una scala con il 50% segnato: fascia celeste, punto (tondo sopra, rombo sotto). */
export function Interval({ lo, hi, r, axis, label, mini = false, style }: { lo: number; hi: number; r: number; axis: Axis; label: string; mini?: boolean; style?: CSSProperties }) {
  const l = pos(lo, axis);
  const w = Math.max(0.5, pos(hi, axis) - l);
  const dir = r > 0.5 ? "up" : r < 0.5 ? "down" : "even";
  return (
    <span className={`an-ci${mini ? " is-mini" : ""}`} role="img" aria-label={label} style={style}>
      <span className="an-ci-track" />
      <span className="an-ci-range" style={{ left: `${l}%`, width: `${w}%` }} />
      <span className="an-ci-mid" style={{ left: `${pos(0.5, axis)}%` }} />
      <span className={`an-ci-dot is-${dir}`} style={{ left: `${pos(r, axis)}%` }} />
    </span>
  );
}

/**
 * Carta intera (5:7), mai ritagliata né coperta: in basso ci sono i crediti dell'illustratore e di Koin Games. Senza
 * immagine, un riquadro tratteggiato col nome. `thumb` (160 px) per le misure piccole, `src` (480 px) per le grandi.
 */
export function CardArt({ src, thumb, name, width, eager = false, alt }: { src?: string; thumb?: string; name: string; width: number; eager?: boolean; alt?: string }) {
  const small = thumb && width <= 90;
  const url = small ? thumb : (src ?? thumb);
  if (!url) {
    return (
      <span className="an-card-fallback" style={{ width }}>
        {name}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="an-card"
      src={url}
      srcSet={small && src ? `${thumb} 1x, ${src} 2x` : undefined}
      width={width}
      height={Math.round(width * 1.4)}
      alt={alt ?? ""}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

/** Testata di sezione: numero grande a contorno (01–05), occhiello, H2, dati a destra. */
export function SectionHead({ num, kicker, title, id, meta }: { num: number; kicker: string; title: string; id: string; meta?: ReactNode }) {
  return (
    <div className="an-sec-head an-reveal">
      <span className="an-sec-num" aria-hidden="true">
        {String(num).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <span className="kicker an-sec-kicker">{kicker}</span>
        <h2 id={id} className="an-h2">
          {title}
        </h2>
      </div>
      {meta ? <span className="an-sec-meta">{meta}</span> : null}
    </div>
  );
}

/** Stella delle Leggendarie (gialla, davanti al nome) con il nome per i lettori di schermo, come `CardName`. */
export function Star({ label }: { label: string }) {
  return (
    <>
      <span className="legendary-star" aria-hidden="true">
        ★
      </span>
      <span className="sr-only">{label} </span>
    </>
  );
}
