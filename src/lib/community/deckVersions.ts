/*
 * Versioni delle carte di un mazzo della community (pacchetto VERSIONI, 30/09/2026). Richiesta di MagicOfHands sul
 * Discord dopo la patch 0.7: aggiornare le carte di un mazzo già pubblicato tenendo nome e guida, invece di pubblicarne
 * uno nuovo; i voti ripartono sulla versione nuova, quella di prima resta consultabile con la sua media.
 *
 * Chi decide davvero è il database (supabase/schema.sql, blocco VERSIONI): il trigger guard_deck_version apre una
 * versione nuova quando cambiano carte, Leggendaria o carte create, e i voti portano la versione in cui sono stati dati.
 * Qui le regole pure che servono al sito: se le carte sono cambiate (come le confronta il trigger, ma senza badare
 * all'ordine: il sito rimette l'ordine salvato, così un riordino non apre una versione), che cosa è cambiato (il riepilogo
 * della pagina di modifica), da quale data si ricava la patch e la media di ogni versione. Nessun import a runtime: lo
 * esegue anche Node nei test.
 */

/** Carta creata dall'autore (il `BuilderCard` del deck builder): qui serve solo lo slug. */
type CustomCard = { slug: string };

/** Le carte di un mazzo, con i nomi delle colonne di community_decks. */
export type DeckCards = { legendary: string | null; cards: string[]; custom_cards?: CustomCard[] | null };

/** Una versione chiusa (riga di community_deck_versions) con la media dei voti ricevuti mentre era in vigore. */
export type DeckVersion = DeckCards & {
  version: number;
  code_om: string | null;
  started_at: string;
  ended_at: string;
  rating: { avg: number; votes: number };
};

const sortedSlugs = (xs: readonly string[]) => Array.from(new Set(xs)).sort();
const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
/** Le carte create si confrontano per intero (nome e statistiche comprese), ordinate per slug. */
const customKey = (xs: readonly CustomCard[] | null | undefined) =>
  JSON.stringify(
    [...(xs ?? [])]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((c) => Object.fromEntries(Object.entries(c).sort(([x], [y]) => x.localeCompare(y)))),
  );

/** Stesse carte, stessa Leggendaria e stesse carte create, in qualsiasi ordine: nessuna versione nuova. */
export function sameDeckCards(a: DeckCards, b: DeckCards): boolean {
  return (a.legendary ?? null) === (b.legendary ?? null) && sameList(sortedSlugs(a.cards), sortedSlugs(b.cards)) && customKey(a.custom_cards) === customKey(b.custom_cards);
}

/** Che cosa cambia passando da `from` a `to`: carte entrate e uscite (nell'ordine del mazzo) e Leggendaria. */
export type CardsDiff = { legendary: { from: string | null; to: string | null } | null; added: string[]; removed: string[] };

export function deckCardsDiff(from: DeckCards, to: DeckCards): CardsDiff {
  const before = new Set(from.cards);
  const after = new Set(to.cards);
  return {
    legendary: (from.legendary ?? null) === (to.legendary ?? null) ? null : { from: from.legendary ?? null, to: to.legendary ?? null },
    added: to.cards.filter((s) => !before.has(s)),
    removed: from.cards.filter((s) => !after.has(s)),
  };
}

/**
 * La data da cui si ricava la patch del mazzo (`patchAt` di cards.ts): quella dell'ultimo cambio di carte, altrimenti
 * quella di pubblicazione. Prima del 30/09/2026 era sempre `created_at`: un mazzo aggiornato alla 0.7 restava "0.6.3".
 */
export function deckCardsDate(deck: { created_at: string; cards_updated_at?: string | null }): string {
  return deck.cards_updated_at || deck.created_at;
}

/*
 * Il giro dell'aggiornamento: pagina di modifica (o tasto "Aggiorna alla versione …") → deck builder con `?update=<slug>`
 * e il mazzo nell'hash → tasto "Salva nel mazzo pubblicato" → pagina di modifica con `?deck=<codice>`, dove si vede che
 * cosa cambia e si salva. Il builder è una pagina statica: lo slug lo legge nel browser, e lo controlla con DECK_SLUG_RE
 * prima di metterlo in un indirizzo.
 */
export const DECK_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** Deck builder aperto sulle carte del mazzo, in modalità aggiornamento. `code`: il codice OM1 del mazzo. */
export function deckUpdateHref(locale: string, slug: string, code: string): string {
  return `/${locale}/deck-builder?update=${encodeURIComponent(slug)}#${code}`;
}

/** Ritorno dal deck builder: la pagina di modifica del mazzo con le carte nuove, ancora da salvare. */
export function deckSaveCardsHref(locale: string, slug: string, code: string): string {
  return `/${locale}/decks/community/${encodeURIComponent(slug)}/edit?deck=${encodeURIComponent(code)}`;
}

/**
 * Il mazzo è fermo a una patch precedente all'ultima uscita (il tasto "Aggiorna alla versione 0.7", Pierluigi 30/09/2026).
 * `order` è `patchOrder` di cards.ts, passato da chi chiama perché questo modulo resta senza import. Un mazzo senza
 * patch (pubblicato prima della prima patch che conosciamo) è indietro anche lui.
 */
export function deckOutdated(patch: string | undefined, order: readonly string[]): boolean {
  const latest = order[order.length - 1];
  return Boolean(latest) && patch !== latest;
}

/** Media e numero dei voti per versione, dai voti letti da deck_votes (media con due decimali, come deck_ratings). */
export function versionRatings(votes: readonly { version: number; stars: number }[]): Map<number, { avg: number; votes: number }> {
  const sums = new Map<number, { total: number; votes: number }>();
  for (const v of votes) {
    if (!Number.isInteger(v.version) || !(v.stars >= 1 && v.stars <= 5)) continue;
    const s = sums.get(v.version) ?? { total: 0, votes: 0 };
    s.total += v.stars;
    s.votes += 1;
    sums.set(v.version, s);
  }
  return new Map(Array.from(sums, ([version, s]) => [version, { avg: Math.round((s.total / s.votes) * 100) / 100, votes: s.votes }]));
}
