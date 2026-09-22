"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type PostitKind = "deck" | "news" | "patch" | "guide" | "tournament" | "event";

/** Una news è "fresca" (post-it isterico) per 72 ore dalla sua data. */
const FRESH_MS = 72 * 60 * 60 * 1000;

/* Nessuna sorgente da ascoltare: il valore si ricalcola a ogni render lato client, quanto basta per una pagina. */
const subscribeNothing = () => () => {};
/* Sul server (e durante l'idratazione) il post-it non è mai fresco: la home è statica e generata alla build. */
const getServerFresh = () => false;
/* Nel browser: data entro 72 ore dall'ora del visitatore; una data nel futuro (news programmata) conta come fresca. */
function isFresh(date: string | undefined): boolean {
  if (!date) return false;
  const t = Date.parse(date);
  return Number.isFinite(t) && Date.now() - t < FRESH_MS;
}

/**
 * Post-it di un contenuto (contratto fra gli agenti del 22/09/2026): foglietto colorato, storto, appoggiato
 * a mano. Forma, colori, nastro adesivo e animazioni stanno nelle classi `.postit*` di globals.css; qui si
 * sceglie solo che cosa c'è scritto, quanto è grande e quanto è storto.
 *
 * - `kind`: la variante di colore (`.postit-deck`, `.postit-news`, …).
 * - `size="lg"`: il post-it grande che invade l'immagine (`.postit-lg`), per le news in evidenza.
 * - `tilt`: rotazione in gradi; senza, vale quella della variante. Passa per la variabile CSS `--tilt`, così
 *   il raddrizzamento al passaggio del mouse (definito in globals.css) continua a funzionare.
 * - `date`: data ISO della news. Se è entro 72 ore il post-it prende `is-fresh` (animazione "isterica").
 *   Il confronto con l'ora attuale DEVE avvenire nel browser, dopo il montaggio: la pagina è generata alla
 *   build e un calcolo sul server resterebbe fermo al giorno della build. `useSyncExternalStore` usa
 *   `getServerFresh` (false) sul server e durante l'idratazione, poi ricalcola con l'orologio del visitatore:
 *   niente differenze di idratazione e niente setState dentro un effetto.
 * - `className`: posizione (`postit-corner` e ritocchi di top/left/right) o altro.
 *
 * Va messo come figlio diretto del contenitore con `position: relative` (vedi il commento di `.postit`).
 */
export function Postit({
  kind,
  label,
  date,
  size = "md",
  tilt,
  className = "",
}: {
  kind: PostitKind;
  label: string;
  date?: string;
  size?: "md" | "lg";
  tilt?: number;
  className?: string;
}) {
  const fresh = useSyncExternalStore(subscribeNothing, () => isFresh(date), getServerFresh);
  const classes = ["postit", `postit-${kind}`, size === "lg" ? "postit-lg" : "", fresh ? "is-fresh" : "", className].filter(Boolean).join(" ");
  const style = tilt === undefined ? undefined : ({ "--tilt": `${tilt}deg` } as CSSProperties);
  return (
    <span className={classes} style={style}>
      {label}
    </span>
  );
}
