/**
 * Ricerca delle carte per nome, saga e testo (24/09/2026, primo feedback arrivato dal pop-up del sito: "nel deck
 * builder sarebbe utile poter cercare nel testo della carta… vorrei avere visibili le carte con abilità On Reveal
 * inserendo 'Reveal'"). La usano il deck builder (anche quello dei tornei) e il database /cards.
 *
 * Regole: maiuscole, accenti e apostrofi tipografici non contano ("abilita" trova "abilità"); con più parole le
 * carte devono contenerle tutte, in qualunque ordine e anche in campi diversi ("mulan reveal"). Si cerca nel testo
 * verificato nel gioco (`card.ability`, più l'inglese sulle pagine non inglesi); /cards aggiunge le parole chiave di
 * World of Origins, che portano anche categorie assenti dal testo ("Buff", "Vanilla").
 * Funzioni pure, con test in `cardSearch.test.ts`.
 */

/** Minuscole, senza accenti, apostrofi dritti e spazi compattati. */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʼ`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Parole della ricerca, già normalizzate: vuoto se la ricerca è vuota. */
export function searchTerms(query: string): string[] {
  const n = normalizeSearch(query);
  return n ? n.split(" ") : [];
}

/** Testo in cui si cerca una carta. I campi sono uniti da uno spazio, quindi una parola non può stare a cavallo di due campi. */
export function searchHaystack(fields: readonly (string | undefined)[]): string {
  return normalizeSearch(fields.filter(Boolean).join(" "));
}

/** Vero se ogni parola della ricerca compare nel testo della carta; senza parole passano tutte le carte. */
export function matchesSearch(haystack: string, terms: readonly string[]): boolean {
  return terms.every((t) => haystack.includes(t));
}
