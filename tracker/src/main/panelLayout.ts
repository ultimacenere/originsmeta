/**
 * Template dei pannelli sopra il gioco (0.4.1, 12/10/2026, disegni di Pierluigi sul tabellone): posizione e larghezza
 * di partenza di ogni pannello e limiti della larghezza. Funzioni pure, con i test in panelLayout.test.ts; le usa
 * main.ts per aprire le finestre.
 *
 * Le posizioni sono frazioni dello schermo su cui sta il gioco, misurate sui disegni (gioco a schermo intero o finestra
 * senza bordi, 16:9): l'app non sa dove sta la finestra del gioco (la ripresa dello schermo non dà la posizione),
 * quindi il giocatore sposta i pannelli e la posizione si salva, una per template.
 * - Fasce in alto (`strips`): sul bordo alto, il mio mazzo fra il mio nome e la mano coperta dell'avversario
 *   (dall'11,25% al 40,9% della larghezza), quello dell'avversario fra la sua mano e l'ingranaggio (dal 62,4% al 92,9%).
 * - Colonne ai lati (`columns`): a sinistra del tabellone il mio mazzo (dal bordo al 14,4%, dal 15,8% dell'altezza); a
 *   destra, sopra il pannello del mana del gioco, quello dell'avversario (dall'84,4% al 99,5%, dal 28,8%).
 * - Classico (`classic`): le misure di sempre, in main.ts (Deck tracker largo 230 nella fascia a sinistra, pannello a L
 *   largo 480 in alto a destra).
 */
import { PANEL_TEMPLATES, type PanelTemplate } from "../shared/types";

export type PanelKind = "deck" | "opp";
type Rect = { x: number; y: number; width: number; height: number };

/** Frazioni dello schermo: sinistra, alto, larghezza. */
const SPOTS: Record<Exclude<PanelTemplate, "classic">, Record<PanelKind, { left: number; top: number; width: number }>> = {
  strips: { deck: { left: 0.1125, top: 0, width: 0.296 }, opp: { left: 0.624, top: 0, width: 0.305 } },
  columns: { deck: { left: 0, top: 0.158, width: 0.144 }, opp: { left: 0.844, top: 0.288, width: 0.151 } },
};

/** Larghezza ammessa (in punti dello schermo) per ogni template: abbastanza per leggere le carte, mai più dello schermo. */
export const WIDTH_LIMITS: Record<PanelTemplate, { min: number; max: number }> = {
  classic: { min: 200, max: 600 },
  strips: { min: 320, max: 1600 },
  columns: { min: 180, max: 520 },
};

/** Il template salvato, o il classico per un valore che l'app non conosce (file vecchio o modificato a mano). */
export function readTemplate(raw: unknown): PanelTemplate {
  return PANEL_TEMPLATES.includes(raw as PanelTemplate) ? (raw as PanelTemplate) : "classic";
}

/** Larghezza dentro i limiti del template. */
export function clampWidth(template: PanelTemplate, width: number): number {
  const { min, max } = WIDTH_LIMITS[template];
  return Math.round(Math.min(Math.max(width, min), max));
}

/** Dove parte un pannello dei template nuovi, sullo schermo `screen` (i suoi limiti interi, non l'area di lavoro). */
export function defaultSpot(template: Exclude<PanelTemplate, "classic">, kind: PanelKind, screen: Rect): { x: number; y: number; width: number } {
  const s = SPOTS[template][kind];
  return { x: Math.round(screen.x + screen.width * s.left), y: Math.round(screen.y + screen.height * s.top), width: clampWidth(template, screen.width * s.width) };
}
