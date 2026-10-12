/**
 * Template dei pannelli sopra il gioco (0.4.1, 12/10/2026, disegni di Pierluigi sul tabellone): posizione e larghezza
 * di partenza di ogni pannello e limiti della larghezza. Funzioni pure, con i test in panelLayout.test.ts; le usa
 * main.ts per aprire le finestre.
 *
 * Le posizioni sono frazioni dello schermo su cui sta il gioco, misurate sui disegni (gioco a schermo intero o finestra
 * senza bordi, 16:9): l'app non sa dove sta la finestra del gioco (la ripresa dello schermo non dà la posizione),
 * quindi il giocatore sposta i pannelli e la posizione si salva, una per template.
 * - Fasce (`strips`): il mio mazzo in basso a sinistra, attaccato al bordo sotto, accanto alla mia mano (dal bordo al
 *   31,4% della larghezza); quello dell'avversario in alto a destra, attaccato al bordo alto e a quello destro (dal 67,25%).
 *   Prima versione (fasce tutte e due in alto) cambiata con lo screenshot di Pierluigi del 12/10/2026 sera: "versione due
 *   sopra cambiare così come lo vedi nello screen". La fascia in basso cresce verso l'alto (`fromBottom`).
 * - Colonne ai lati (`columns`): a sinistra del tabellone il mio mazzo (dal bordo al 14,4%, dal 15,8% dell'altezza); a
 *   destra, sopra il pannello del mana del gioco, quello dell'avversario (dall'84,4% al 99,5%, dal 28,8%).
 * - Classico (`classic`): dal 13/10/2026 un misto (Pierluigi: "al posto della classica, crea un mix con il deck di
 *   sinistra come colonna ai lati mentre il deck avversario come fasce e chiamiamola classica"): il mio mazzo come nelle
 *   Colonne, l'avversario come nelle Fasce (`panelShape`). Fino al 12/10 era il Deck tracker a griglia con il pannello a L.
 * - Personalizzato (`custom`): parte dove partono le colonne, con le opzioni di `PanelCustom` (`readCustom` le
 *   controlla una per una: un file vecchio o scritto a mano non rompe i pannelli).
 */
import { PANEL_TEMPLATES, type PanelCustom, type PanelTemplate } from "../shared/types";

export type PanelKind = "deck" | "opp";
type Rect = { x: number; y: number; width: number; height: number };

/** La forma di un pannello: il classico prende la colonna per il mio mazzo e la fascia per l'avversario. */
export type PanelShape = Exclude<PanelTemplate, "classic">;
export function panelShape(template: PanelTemplate, kind: PanelKind): PanelShape {
  return template === "classic" ? (kind === "deck" ? "columns" : "strips") : template;
}

/** Frazioni dello schermo: sinistra, alto (o il bordo basso, con `fromBottom`), larghezza. */
const SPOTS: Record<PanelShape, Record<PanelKind, { left: number; top: number; width: number; fromBottom?: true }>> = {
  strips: { deck: { left: 0, top: 1, width: 0.314, fromBottom: true }, opp: { left: 0.6725, top: 0, width: 0.3275 } },
  columns: { deck: { left: 0, top: 0.158, width: 0.144 }, opp: { left: 0.844, top: 0.288, width: 0.151 } },
  custom: { deck: { left: 0, top: 0.158, width: 0.144 }, opp: { left: 0.844, top: 0.288, width: 0.151 } },
};

/** Larghezza ammessa (in punti dello schermo) per ogni template: abbastanza per leggere le carte, mai più dello schermo. */
export const WIDTH_LIMITS: Record<PanelShape, { min: number; max: number }> = {
  strips: { min: 320, max: 1600 },
  columns: { min: 180, max: 520 },
  custom: { min: 140, max: 1800 },
};

/** Le opzioni di partenza del template personalizzato: come le colonne, 3 carte per fila, tutto acceso. */
export const DEFAULT_CUSTOM: PanelCustom = {
  orientation: "vertical",
  cards: "art",
  perRow: 3,
  opacity: 85,
  hideOut: false,
  me: { legendary: true, deckLeft: true, life: true },
  opp: { legendary: true, deckLeft: true, life: true, mana: true },
};

const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const intIn = (v: unknown, min: number, max: number, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(Math.max(v, min), max)) : fallback);

/**
 * Le opzioni del template personalizzato da un valore qualunque (file salvato, richiesta della finestra): ogni campo
 * sbagliato o mancante prende quello di `base` (all'inizio `DEFAULT_CUSTOM`), i numeri restano nei limiti. Con `base`
 * le opzioni in uso, un cambio parziale ("solo l'opacità") tocca solo quel campo.
 */
export function readCustom(raw: unknown, base: PanelCustom = DEFAULT_CUSTOM): PanelCustom {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const me = r.me && typeof r.me === "object" ? (r.me as Record<string, unknown>) : {};
  const opp = r.opp && typeof r.opp === "object" ? (r.opp as Record<string, unknown>) : {};
  return {
    orientation: r.orientation === "vertical" || r.orientation === "horizontal" ? r.orientation : base.orientation,
    cards: r.cards === "art" || r.cards === "names" ? r.cards : base.cards,
    perRow: intIn(r.perRow, 1, 13, base.perRow),
    opacity: intIn(r.opacity, 0, 100, base.opacity),
    hideOut: bool(r.hideOut, base.hideOut),
    me: { legendary: bool(me.legendary, base.me.legendary), deckLeft: bool(me.deckLeft, base.me.deckLeft), life: bool(me.life, base.me.life) },
    opp: { legendary: bool(opp.legendary, base.opp.legendary), deckLeft: bool(opp.deckLeft, base.opp.deckLeft), life: bool(opp.life, base.opp.life), mana: bool(opp.mana, base.opp.mana) },
  };
}

/** Il template salvato, o il classico per un valore che l'app non conosce (file vecchio o modificato a mano). */
export function readTemplate(raw: unknown): PanelTemplate {
  return PANEL_TEMPLATES.includes(raw as PanelTemplate) ? (raw as PanelTemplate) : "classic";
}

/** Larghezza dentro i limiti della forma del pannello. */
export function clampWidth(template: PanelTemplate, kind: PanelKind, width: number): number {
  const { min, max } = WIDTH_LIMITS[panelShape(template, kind)];
  return Math.round(Math.min(Math.max(width, min), max));
}

/**
 * Dove parte un pannello dei template nuovi, sullo schermo `screen` (i suoi limiti interi, non l'area di lavoro). Con
 * `fromBottom` `y` è il bordo basso: l'altezza la decide il contenuto, quindi chi apre la finestra la mette sopra.
 */
export function defaultSpot(template: PanelTemplate, kind: PanelKind, screen: Rect): { x: number; y: number; width: number; fromBottom: boolean } {
  const s = SPOTS[panelShape(template, kind)][kind];
  const width = clampWidth(template, kind, screen.width * s.width);
  // mai oltre il bordo destro (l'avversario sta attaccato al bordo)
  const x = Math.min(Math.round(screen.x + screen.width * s.left), screen.x + screen.width - width);
  return { x, y: Math.round(screen.y + screen.height * s.top), width, fromBottom: s.fromBottom === true };
}
