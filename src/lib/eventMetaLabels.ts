import type { Locale } from "./i18n";

/**
 * Testi delle pagine del meta dei tornei (/decks/meta/<slug>, 30/09/2026). `en` è il tipo di riferimento; segnaposto
 * {event}, {from}, {to}, {n}, {decks}. Nessun import a runtime.
 */
const en = {
  title: "{event} meta: decks and Legendaries",
  description: "The {event} decklists of Origins TCG: the most played Legendaries, the cards in the most decks and the Conquest line-ups that come back.",
  pending: "The {event} runs from {from} to {to}. The decklists of the top players will be here as soon as they are published, with their source.",
  summary: "{n} players, {decks} decks",
  legendaries: "Legendaries",
  cards: "Most played base cards",
  lineups: "Line-ups that come back",
  players: "Players and decks",
  inDecks: "in {n} decks",
  sources: "Sources",
  note: "Counts on the published decklists only: how often a card is played, not how often it wins.",
  openBuilder: "Deck builder",
  rules: "Crimson Cup rules",
};

export type EventMetaLabels = typeof en;

const it: EventMetaLabels = {
  title: "Meta della {event}: mazzi e Leggendarie",
  description: "Le liste della {event} di Origins TCG: le Leggendarie più giocate, le carte presenti in più mazzi e le formazioni Conquest che tornano.",
  pending: "La {event} si gioca dal {from} al {to}. Le liste dei migliori giocatori arrivano qui appena vengono pubblicate, con la loro fonte.",
  summary: "{n} giocatori, {decks} mazzi",
  legendaries: "Leggendarie",
  cards: "Carte base più giocate",
  lineups: "Formazioni che tornano",
  players: "Giocatori e mazzi",
  inDecks: "in {n} mazzi",
  sources: "Fonti",
  note: "Conteggi sulle sole liste pubblicate: quanto è giocata una carta, non quanto vince.",
  openBuilder: "Deck builder",
  rules: "Regole della Crimson Cup",
};

const es: EventMetaLabels = {
  title: "Meta de la {event}: mazos y Legendarias",
  description: "Las listas de la {event} de Origins TCG: las Legendarias más jugadas, las cartas en más mazos y las formaciones de Conquest que se repiten.",
  pending: "La {event} se juega del {from} al {to}. Las listas de los mejores jugadores llegarán aquí en cuanto se publiquen, con su fuente.",
  summary: "{n} jugadores, {decks} mazos",
  legendaries: "Legendarias",
  cards: "Cartas base más jugadas",
  lineups: "Formaciones que se repiten",
  players: "Jugadores y mazos",
  inDecks: "en {n} mazos",
  sources: "Fuentes",
  note: "Recuentos solo sobre las listas publicadas: cuánto se juega una carta, no cuánto gana.",
  openBuilder: "Deck builder",
  rules: "Reglas de la Crimson Cup",
};

export const eventMetaLabels: Record<Locale, EventMetaLabels> = { en, it, es };
