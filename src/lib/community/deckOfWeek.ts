/*
 * Mazzo della settimana (30/09/2026, dal confronto con i siti concorrenti: un motivo per tornare sul sito fra una patch
 * e l'altra). È il mazzo pubblicato con il punteggio "Di tendenza" più alto degli ultimi 7 giorni (funzione del database
 * deck_trending, blocco PREFERITI E TENDENZA: visite, copie del codice, clic, video, voti e salvataggi, i giorni vecchi
 * pesano meno). La home lo mostra in una striscia (ISR, cambia durante la settimana); il lunedì il cron
 * /api/cron/deck-of-the-week lo annuncia nel canale #community-decks. Nessun import a runtime: lo esegue Node nei test.
 */

import type { Locale } from "../i18n";

/** Sotto questo punteggio la settimana è stata troppo ferma per dare un titolo: né striscia né annuncio. */
export const DECK_OF_WEEK_MIN_SCORE = 5;

type Candidate = { id: string; created_at: string; trend?: number; favorites?: number };

/** Il mazzo della settimana fra quelli pubblicati: punteggio, poi salvataggi, poi il più recente; null sotto la soglia. */
export function pickDeckOfWeek<T extends Candidate>(decks: readonly T[]): T | null {
  const ranked = decks
    .filter((d) => (d.trend ?? 0) >= DECK_OF_WEEK_MIN_SCORE)
    .sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0) || (b.favorites ?? 0) - (a.favorites ?? 0) || b.created_at.localeCompare(a.created_at));
  return ranked[0] ?? null;
}

/** Testi della striscia in home e del messaggio su Discord. Segnaposto: {name}, {author}. */
export const deckOfWeekLabels: Record<Locale, { title: string; postit: string; sub: string; by: string; open: string; all: string }> = {
  en: {
    title: "Deck of the week",
    postit: "TOP",
    sub: "The most viewed, copied, voted and saved deck of the last 7 days.",
    by: "by {author}",
    open: "Open the deck",
    all: "Trending decks",
  },
  it: {
    title: "Mazzo della settimana",
    postit: "TOP",
    sub: "Il mazzo più visto, copiato, votato e salvato degli ultimi 7 giorni.",
    by: "di {author}",
    open: "Apri il mazzo",
    all: "Mazzi di tendenza",
  },
  es: {
    title: "Mazo de la semana",
    postit: "TOP",
    sub: "El mazo más visto, copiado, votado y guardado de los últimos 7 días.",
    by: "de {author}",
    open: "Abrir el mazo",
    all: "Mazos en tendencia",
  },
};
