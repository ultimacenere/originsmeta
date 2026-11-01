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
  /** carte nel gioco, tutte o solo quelle non nel gioco (30/10/2026): le parole del filtro del Theory craft */
  status: "Cards",
  statusGame: "In the game",
  statusAll: "All",
  statusRemoved: "Not in game",
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
  status: "Carte",
  statusGame: "Nel gioco",
  statusAll: "Tutte",
  statusRemoved: "Non nel gioco",
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
  status: "Cartas",
  statusGame: "En el juego",
  statusAll: "Todas",
  statusRemoved: "Fuera del juego",
  clear: "Borrar filtros",
  active: "{n} activos",
};

const fr: CardFilterLabels = {
  cost: "Coût",
  more: "Plus de filtres",
  keyword: "Mot-clé",
  gameKeywords: "Mots-clés du jeu",
  effects: "Effets",
  power: "Puissance",
  health: "Santé",
  min: "min",
  max: "max",
  status: "Cartes",
  statusGame: "Dans le jeu",
  statusAll: "Toutes",
  statusRemoved: "Hors du jeu",
  clear: "Effacer les filtres",
  active: "{n} actifs",
};

const pt: CardFilterLabels = {
  cost: "Custo",
  more: "Mais filtros",
  keyword: "Palavra-chave",
  gameKeywords: "Palavras-chave do jogo",
  effects: "Efeitos",
  power: "Poder",
  health: "Vida",
  min: "mín.",
  max: "máx.",
  status: "Cartas",
  statusGame: "No jogo",
  statusAll: "Todas",
  statusRemoved: "Fora do jogo",
  clear: "Limpar filtros",
  active: "{n} ativos",
};

const de: CardFilterLabels = {
  cost: "Kosten",
  more: "Weitere Filter",
  keyword: "Schlüsselwort",
  gameKeywords: "Schlüsselwörter des Spiels",
  effects: "Effekte",
  power: "Kraft",
  health: "Leben",
  min: "min.",
  max: "max.",
  status: "Karten",
  statusGame: "Im Spiel",
  statusAll: "Alle",
  statusRemoved: "Nicht im Spiel",
  clear: "Filter zurücksetzen",
  active: "{n} aktiv",
};

// russo (20/10/2026): Сила / Здоровье come nel glossario di docs/russo.md
const ru: CardFilterLabels = {
  cost: "Стоимость",
  more: "Другие фильтры",
  keyword: "Ключевое слово",
  gameKeywords: "Ключевые слова игры",
  effects: "Эффекты",
  power: "Сила",
  health: "Здоровье",
  min: "мин.",
  max: "макс.",
  status: "Карты",
  statusGame: "В игре",
  statusAll: "Все",
  statusRemoved: "Не в игре",
  clear: "Сбросить фильтры",
  active: "Активно: {n}",
};

export const cardFilterLabels: Record<Locale, CardFilterLabels> = { en, it, es, fr, pt, de, ru };
