import type { Locale } from "./i18n";

/**
 * Filtri in più del database carte /cards (30/09/2026, dal confronto con i siti concorrenti: filtri per costo, parola
 * chiave e statistiche). Il costo è una fila di pastiglie sempre in vista; parola chiave, potenza e salute stanno in
 * "Altri filtri", richiudibile, perché sul telefono i filtri riempivano già la prima schermata (analisi del 29/09).
 * `en` è il tipo di riferimento; nessun import a runtime.
 */
const en = {
  cost: "Cost",
  more: "More filters",
  keyword: "Keyword",
  /** gruppi della tendina: le parole chiave del gioco e le categorie di effetto (Pesca, Evoca…) */
  gameKeywords: "Game keywords",
  effects: "Effects",
  power: "Power",
  health: "Health",
  min: "min",
  max: "max",
  clear: "Clear filters",
  /** sul tasto "Altri filtri" chiuso, quanti ne sono attivi */
  active: "{n} active",
};

export type CardFilterLabels = typeof en;

const it: CardFilterLabels = {
  cost: "Costo",
  more: "Altri filtri",
  keyword: "Parola chiave",
  gameKeywords: "Parole chiave del gioco",
  effects: "Effetti",
  power: "Potenza",
  health: "Salute",
  min: "min",
  max: "max",
  clear: "Azzera i filtri",
  active: "{n} attivi",
};

const es: CardFilterLabels = {
  cost: "Coste",
  more: "Más filtros",
  keyword: "Palabra clave",
  gameKeywords: "Palabras clave del juego",
  effects: "Efectos",
  power: "Poder",
  health: "Salud",
  min: "mín",
  max: "máx",
  clear: "Borrar filtros",
  active: "{n} activos",
};

export const cardFilterLabels: Record<Locale, CardFilterLabels> = { en, it, es };
