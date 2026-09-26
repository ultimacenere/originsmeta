/**
 * Regole della directory /creators (pacchetto CREATOR, 26/09/2026), in funzioni pure: `node --test
 * src/lib/community/creatorDirectory.test.ts`.
 *
 * - Chi c'è: i profili con un tag autore (Autore, Influencer, Pro, Staff), nessun elenco scritto a mano.
 * - Ordine dichiarato nella pagina, uguale per tutti: prima chi fa contenuti nella lingua della pagina, poi chi ha
 *   pubblicato più mazzi, poi il nome (così nessuno è "in evidenza" per scelta nostra).
 * - Indicizzazione: la pagina va su Google e in sitemap solo con almeno `CREATORS_MIN_INDEX` creator; sotto è una pagina
 *   sottile, navigabile ma noindex e fuori da hreflang e sitemap (stessa logica dei profili /u senza contenuti).
 */

/** Da quanti creator la directory si indicizza (richiesta del pacchetto: "in sitemap solo se ci sono almeno 3 creator"). */
export const CREATORS_MIN_INDEX = 3;

export function directoryIndexable(count: number): boolean {
  return count >= CREATORS_MIN_INDEX;
}

/** Quello che serve all'ordine e ai filtri: nome, lingue dei contenuti, piattaforme dei canali, mazzi pubblicati. */
export type DirectoryItem = { name: string; langs: readonly string[]; kinds: readonly string[]; decks: number };

/** Ordine della directory nella lingua `locale` (vedi sopra). Non cambia l'elenco passato. */
export function orderCreators<T extends DirectoryItem>(items: readonly T[], locale: string): T[] {
  return items
    .slice()
    .sort(
      (a, b) =>
        Number(b.langs.includes(locale)) - Number(a.langs.includes(locale)) ||
        b.decks - a.decks ||
        a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
    );
}

/** Filtri della directory: lingua dei contenuti e piattaforma ("all" = nessun filtro). */
export function filterCreators<T extends DirectoryItem>(items: readonly T[], lang: string, platform: string): T[] {
  return items.filter((c) => (lang === "all" || c.langs.includes(lang)) && (platform === "all" || c.kinds.includes(platform)));
}

/** Le piattaforme presenti nei profili, nell'ordine dato (quello di LINK_KINDS): il filtro mostra solo quelle. */
export function platformsInUse<K extends string>(items: readonly DirectoryItem[], order: readonly K[]): K[] {
  const used = new Set(items.flatMap((c) => c.kinds));
  return order.filter((k) => used.has(k));
}
