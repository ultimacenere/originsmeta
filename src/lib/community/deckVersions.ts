/*
 * Versioni delle carte di un mazzo della community (pacchetto VERSIONI, 30/09/2026). Richiesta di MagicOfHands sul
 * Discord dopo la patch 0.7: aggiornare le carte di un mazzo già pubblicato tenendo nome e guida, invece di pubblicarne
 * uno nuovo; quella di prima resta consultabile con la sua media. Fino al 09/11/2026 i voti ripartivano sulla versione
 * nuova; da allora (Pierluigi: "il deck aggiornato mantiene visualizzazioni e voti") il mazzo tiene l'ultimo voto di ogni
 * persona (`deckRating`) e un cambio di carte lo riporta in cima all'ordine "Più recenti" (`newestCardsFirst`).
 *
 * Chi decide davvero è il database (supabase/schema.sql, blocchi VERSIONI e "09/11/2026: ORDINE PER AGGIORNAMENTO"): il
 * trigger guard_deck_version apre una versione nuova quando cambiano carte, Leggendaria o carte create, e i voti portano
 * la versione in cui sono stati dati. Qui le regole pure che servono al sito: se le carte sono cambiate (senza badare
 * all'ordine, come il trigger dal 09/11/2026; il sito rimette anche l'ordine salvato), che cosa è cambiato (il riepilogo
 * della pagina di modifica), da quale data si ricava la patch, l'ordine e la media del mazzo e di ogni versione. Nessun
 * import a runtime: lo esegue anche Node nei test.
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

/** Le carte come multinsieme (09/11/2026): ordinate e con i doppioni, così conta anche una quantità diversa, come nel trigger. */
const sortedSlugs = (xs: readonly string[]) => [...xs].sort();
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

/** Lo stato di un mazzo salvato che conta per le versioni (colonne di community_decks). */
export type DeckSaveState = DeckCards & { status: string; version: number; created_at: string; cards_updated_at: string | null };

/**
 * Che cosa fa il trigger guard_deck_version a un salvataggio di un mazzo (supabase/schema.sql, blocco "09/11/2026: ORDINE
 * PER AGGIORNAMENTO", che sostituisce quello di VERSIONI): versione e data delle carte non le scrive chi salva; se un
 * mazzo non privato cambia carte (in qualsiasi ordine: `sameDeckCards`), `version` sale di uno e `cards_updated_at`
 * diventa `now`, altrimenti restano quelle di prima, qualunque altro campo cambi (nome, guida, video). La regola vera è
 * nell'SQL: questa copia serve ai test, che controllano anche che il blocco dica lo stesso.
 */
export function deckAfterSave<T extends DeckSaveState>(before: T, edit: Partial<T>, now: string): T {
  // anche created_at resta quella di prima (trigger guard_created_at, blocco DATE E FOTO)
  const next: T = { ...before, ...edit, created_at: before.created_at, version: before.version, cards_updated_at: before.cards_updated_at };
  if (before.status !== "draft" && !sameDeckCards(before, next)) return { ...next, version: before.version + 1, cards_updated_at: now };
  return next;
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
 * Ordine "più recenti" dei mazzi della community (richiesta di Pierluigi sul Discord del 09/11/2026): conta la data
 * dell'ultimo aggiornamento delle carte, non quella della prima pubblicazione. Aggiornamento = carte diverse (una carta
 * entrata o uscita, una quantità diversa, la Leggendaria o una carta creata), come decide il trigger guard_deck_version;
 * nome, guida, video e gli altri testi cambiano solo `updated_at`, che qui non conta. Il mazzo resta lo stesso (stesso
 * id, stesso indirizzo): visite e voti restano suoi.
 */
type Dated = { slug: string; created_at: string; cards_updated_at?: string | null };

/** Dal mazzo con le carte cambiate più di recente; a pari data il più nuovo, poi lo slug (ordine stabile). */
export function newestCardsFirst(a: Dated, b: Dated): number {
  return deckCardsDate(b).localeCompare(deckCardsDate(a)) || b.created_at.localeCompare(a.created_at) || a.slug.localeCompare(b.slug);
}

/** Data dell'ultimo cambio di carte dopo la pubblicazione (da mostrare come "Aggiornato il …"); null se le carte sono quelle pubblicate. */
export function deckCardsUpdated(deck: { cards_updated_at?: string | null }): string | null {
  return deck.cards_updated_at || null;
}

/**
 * I `limit` mazzi con le carte più recenti da due letture del database, perché PostgREST non ordina su
 * coalesce(cards_updated_at, created_at): i più nuovi per `created_at` e gli aggiornati per `cards_updated_at`, tutte e
 * due con lo stesso `limit`. Basta così: un mazzo mai aggiornato che sta nei primi `limit` per data delle carte sta nei
 * primi `limit` per creazione (chi è nato dopo di lui ha anche le carte più recenti), e un mazzo aggiornato sta nei primi
 * `limit` degli aggiornati. Senza doppioni: vale la prima riga letta per id.
 */
export function mergeNewestCards<T extends Dated & { id: string }>(byCreated: readonly T[], byCardsUpdate: readonly T[], limit: number): T[] {
  const seen = new Map<string, T>();
  for (const d of [...byCreated, ...byCardsUpdate]) if (!seen.has(d.id)) seen.set(d.id, d);
  return Array.from(seen.values()).sort(newestCardsFirst).slice(0, limit);
}

/**
 * Media mostrata di un mazzo (blocco "09/11/2026: ORDINE PER AGGIORNAMENTO", Pierluigi: "il deck aggiornato mantiene
 * visualizzazioni e voti"): un voto per persona, il più recente di qualsiasi versione. Chi aveva votato la versione di
 * prima conta ancora finché non vota quella nuova, e allora conta il voto nuovo. È la regola della vista deck_ratings,
 * scritta qui per i test. Media con due decimali, come la vista; voti non validi scartati.
 */
export function deckRating(votes: readonly { user_id: string; version: number; stars: number }[]): { avg: number; votes: number } {
  const latest = new Map<string, { version: number; stars: number }>();
  for (const v of votes) {
    if (!Number.isInteger(v.version) || !(v.stars >= 1 && v.stars <= 5)) continue;
    const seen = latest.get(v.user_id);
    if (!seen || v.version > seen.version) latest.set(v.user_id, v);
  }
  if (!latest.size) return { avg: 0, votes: 0 };
  const total = Array.from(latest.values()).reduce((sum, v) => sum + v.stars, 0);
  return { avg: Math.round((total / latest.size) * 100) / 100, votes: latest.size };
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
