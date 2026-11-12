"use client";

import { useEffect, useRef, useState } from "react";
import type { EventDeck } from "@/lib/event/types";

/**
 * Ruota dei mazzi della regia (10/11/2026): "Gira la ruota: colore estratto = coppia di giocatori + deck assegnato".
 * Uno spicchio per mazzo, del suo colore; i mazzi già usciti restano sulla ruota sbiaditi. Il mazzo lo estrae il server
 * (engine.ts con un generatore crittografico): qui la ruota gira e si ferma sullo spicchio uscito sotto la lancetta.
 * Con "riduci animazioni" si ferma subito.
 */

const SIZE = 320;
const R = SIZE / 2 - 6;

function polar(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [SIZE / 2 + r * Math.cos(a), SIZE / 2 + r * Math.sin(a)];
}

function slicePath(i: number, n: number): string {
  const a0 = (360 / n) * i;
  const a1 = (360 / n) * (i + 1);
  const [x0, y0] = polar(a0, R);
  const [x1, y1] = polar(a1, R);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${SIZE / 2} ${SIZE / 2} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Testo leggibile sullo spicchio: scuro sui colori chiari, chiaro sui colori scuri. */
function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? "#16102a" : "#d9dfe8";
}

export function EventWheel({ decks, used, target, onDone }: { decks: EventDeck[]; used: ReadonlySet<string>; target: { deck: string; key: number } | null; onDone?: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const lastKey = useRef<number | null>(null);
  const n = Math.max(decks.length, 1);

  // callback e mazzi dai ref: l'effetto deve ripartire solo per un giro nuovo (un callback scritto in linea cambia a
  // ogni disegno della regia, che si ridisegna ogni secondo, e la pulizia dell'effetto fermerebbe i timer)
  const doneRef = useRef(onDone);
  const decksRef = useRef(decks);
  useEffect(() => {
    doneRef.current = onDone;
    decksRef.current = decks;
  }, [onDone, decks]);

  useEffect(() => {
    if (!target || target.key === lastKey.current) return;
    lastKey.current = target.key;
    const list = decksRef.current;
    const i = list.findIndex((d) => d.id === target.deck);
    if (i < 0) return;
    const center = (360 / Math.max(list.length, 1)) * (i + 0.5);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // subito dopo il disegno: la transizione parte dal punto in cui la ruota è ferma. Un timer e non
    // requestAnimationFrame, che nelle schede in secondo piano non parte; e il risultato si mostra comunque dopo 4,6 s
    // anche se il browser salta l'evento di fine transizione.
    const start = setTimeout(() => {
      setRotation((r) => {
        const base = r - (((r % 360) + 360) % 360);
        return base + (reduce ? 0 : 360 * 6) + ((360 - center) % 360) + (reduce ? 0 : 360);
      });
      setSpinning(!reduce);
      if (reduce) doneRef.current?.();
    }, 30);
    const done = reduce ? null : setTimeout(() => doneRef.current?.(), 4600);
    return () => {
      clearTimeout(start);
      if (done) clearTimeout(done);
    };
  }, [target]);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Ruota dei mazzi">
        <g
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "50% 50%", transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.8, 0.18, 1)" : "none" }}
          onTransitionEnd={() => {
            setSpinning(false);
            onDone?.();
          }}
        >
          {decks.map((d, i) => {
            const mid = (360 / n) * (i + 0.5);
            const [tx, ty] = polar(mid, R * 0.62);
            const off = used.has(d.id) && d.id !== target?.deck;
            return (
              <g key={d.id} opacity={off ? 0.28 : 1}>
                <path d={decks.length === 1 ? `M ${SIZE / 2} ${SIZE / 2 - R} A ${R} ${R} 0 1 1 ${SIZE / 2 - 0.01} ${SIZE / 2 - R} Z` : slicePath(i, n)} fill={d.color} stroke="#121a2c" strokeWidth={2} />
                <text
                  x={tx}
                  y={ty}
                  fill={inkOn(d.color)}
                  fontSize={n > 10 ? 10 : 12}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid > 180 ? mid + 90 : mid - 90} ${tx} ${ty})`}
                  style={{ fontFamily: "var(--font-manrope), sans-serif" }}
                >
                  {d.name.length > 16 ? `${d.name.slice(0, 15)}…` : d.name}
                </text>
              </g>
            );
          })}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={22} fill="#121a2c" stroke="#3fc4e8" strokeWidth={3} />
        </g>
        <path d={`M ${SIZE / 2 - 13} 2 L ${SIZE / 2 + 13} 2 L ${SIZE / 2} 30 Z`} fill="#f2d23c" stroke="#16102a" strokeWidth={2} />
      </svg>
    </div>
  );
}
