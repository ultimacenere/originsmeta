"use client";

import { useId, useState } from "react";
import type { AchievementIcon as Icon } from "@/lib/community/achievements";
import { AchievementIcon } from "./AchievementIcon";

/** Una medaglia già pronta da mostrare: testi scritti dal server nella lingua della pagina (date comprese). */
export type Medal = {
  id: string;
  icon: Icon;
  /** numero sulle carte dei traguardi dei mazzi */
  mark?: string;
  tone: "sky" | "gold";
  name: string;
  description: string;
  /** righe di dettaglio: data, quante volte, mesi */
  meta: string[];
  /** "×2" sulla medaglia, per i traguardi ottenuti più volte */
  times?: string;
};

/**
 * La fila di medaglie dei traguardi su /u (pacchetto TRAGUARDI, 27/09/2026), con il dettaglio al passaggio del mouse,
 * al focus da tastiera o al tocco: nome, descrizione, data. Il dettaglio sta in un riquadro sotto la fila (non in un
 * fumetto accanto alla medaglia), così a 375 px non esce mai dallo schermo.
 *
 * Accessibilità: ogni medaglia è un bottone con il nome del traguardo e la descrizione collegata (`aria-describedby`),
 * quindi i lettori di schermo non hanno bisogno del riquadro, che per loro è nascosto (non si legge due volte). Il tocco
 * apre e chiude il dettaglio (`aria-pressed`). Senza JavaScript restano le medaglie con i loro nomi.
 *
 * `size`: "large" sulla vetrina (Creator, Autore, Pro, Staff), con il nome sotto ogni medaglia; "small" sugli altri
 * profili. Animazione solo con `motion-safe` ("riduci animazioni": tutto fermo).
 */
export function AchievementMedals({ medals, size, hint, listLabel }: { medals: Medal[]; size: "large" | "small"; hint: string; listLabel: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const uid = useId();
  const shownId = hovered ?? pinned ?? focused;
  const shown = medals.find((m) => m.id === shownId) ?? null;
  const large = size === "large";
  const circle = large ? "h-14 w-14" : "h-11 w-11";
  const icon = large ? "h-8 w-8" : "h-6 w-6";

  return (
    <div>
      <ul className={`flex flex-wrap ${large ? "gap-4" : "gap-2.5"}`} aria-label={listLabel}>
        {medals.map((m) => {
          const descId = `${uid}-${m.id}`;
          const gold = m.tone === "gold";
          return (
            <li key={m.id} className={large ? "w-20" : undefined}>
              <button
                type="button"
                aria-describedby={descId}
                aria-pressed={pinned === m.id}
                onClick={() => setPinned((p) => (p === m.id ? null : m.id))}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHovered(m.id);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setHovered(null);
                }}
                onFocus={() => setFocused(m.id)}
                onBlur={() => setFocused((f) => (f === m.id ? null : f))}
                className={`group flex w-full flex-col items-center gap-1.5 rounded-xl text-center ${large ? "p-1" : "p-0.5"}`}
              >
                <span
                  className={`relative flex ${circle} items-center justify-center rounded-full border-[3px] motion-safe:transition-transform motion-safe:group-hover:scale-105 ${
                    gold ? "border-gold bg-night-3 text-gold" : "border-sky bg-night-2 text-mint"
                  } ${shownId === m.id ? (gold ? "ring-2 ring-gold/60" : "ring-2 ring-mint/60") : ""}`}
                >
                  <AchievementIcon icon={m.icon} mark={m.mark} className={icon} />
                  {m.times ? (
                    <span aria-hidden="true" className="absolute -right-2 -top-1.5 rounded-full border-2 border-sky bg-night-3 px-1 font-mono text-[10px] font-bold leading-4 text-pale">
                      {m.times}
                    </span>
                  ) : null}
                </span>
                <span className={large ? "text-[11px] font-semibold leading-tight text-pale" : "sr-only"}>{m.name}</span>
              </button>
              {/* fuori dal bottone: altrimenti entrerebbe anche nel suo nome */}
              <span id={descId} className="sr-only">
                {[m.description, ...m.meta].join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
      {/* il dettaglio per chi vede: per i lettori di schermo c'è già la descrizione di ogni bottone */}
      <div aria-hidden="true" className="mt-3 min-h-[4.5rem] rounded-lg bg-night-2 px-4 py-3 text-sm">
        {shown ? (
          <>
            <p className={`font-bold ${shown.tone === "gold" ? "text-gold" : "text-sky"}`}>{shown.name}</p>
            <p className="mt-0.5 text-pale">{shown.description}</p>
            {shown.meta.length ? <p className="mt-1 font-mono text-xs text-pale-muted">{shown.meta.join(" · ")}</p> : null}
          </>
        ) : (
          <p className="text-pale-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}
