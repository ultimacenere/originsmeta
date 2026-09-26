/**
 * Regole della directory /creators, "Creator e autori" (pacchetto CREATOR, 26/09/2026; ruoli del 27/09/2026), in
 * funzioni pure: `node --test src/lib/community/creatorDirectory.test.ts`.
 *
 * - Chi c'è: i profili con il ruolo Creator, Autore, Pro o Staff (`SHOWCASE_BADGES` di badges.ts) che hanno compilato
 *   il profilo pubblico (almeno una bio o un canale, `listedInDirectory`), nessun elenco scritto a mano. Una scheda con
 *   il solo nome non dice nulla a chi legge e farebbe della pagina una pagina sottile.
 * - Filtri: lingua dei contenuti, piattaforma e ruolo (27/09/2026).
 * - Ordine dichiarato nella pagina, uguale per tutti: prima chi fa contenuti nella lingua della pagina, poi chi ha
 *   pubblicato più mazzi, poi il nome (così nessuno è "in evidenza" per scelta nostra).
 * - Indicizzazione: la pagina va su Google e in sitemap solo con almeno `CREATORS_MIN_INDEX` schede; sotto è una pagina
 *   sottile, navigabile ma noindex e fuori da hreflang e sitemap (stessa logica dei profili /u senza contenuti). La
 *   pagina e la sitemap contano con la stessa funzione.
 */

/** Da quante schede la directory si indicizza (richiesta del pacchetto: "in sitemap solo se ci sono almeno 3 creator"). */
export const CREATORS_MIN_INDEX = 3;

/** Un profilo con il ruolo Creator, Autore, Pro o Staff entra nella directory solo con una bio o almeno un canale. */
export function listedInDirectory(p: { bio: string | null | undefined; links: readonly unknown[] }): boolean {
  return p.links.length > 0 || Boolean(p.bio?.trim());
}

export function directoryIndexable(count: number): boolean {
  return count >= CREATORS_MIN_INDEX;
}

/** Quello che serve all'ordine e ai filtri: nome, lingue dei contenuti, piattaforme dei canali, mazzi pubblicati, ruolo. */
export type DirectoryItem = { name: string; langs: readonly string[]; kinds: readonly string[]; decks: number; badge?: string };

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

/** Filtri della directory: lingua dei contenuti, piattaforma e ruolo ("all" = nessun filtro). */
export function filterCreators<T extends DirectoryItem>(items: readonly T[], lang: string, platform: string, role: string = "all"): T[] {
  return items.filter((c) => (lang === "all" || c.langs.includes(lang)) && (platform === "all" || c.kinds.includes(platform)) && (role === "all" || c.badge === role));
}

/** I ruoli presenti nella directory, nell'ordine dato (quello di BADGE_ORDER): il filtro per ruolo mostra solo quelli. */
export function rolesInUse<R extends string>(items: readonly DirectoryItem[], order: readonly R[]): R[] {
  const used = new Set(items.map((c) => c.badge));
  return order.filter((r) => used.has(r));
}

/** Le piattaforme presenti nei profili, nell'ordine dato (quello di LINK_KINDS): il filtro mostra solo quelle. */
export function platformsInUse<K extends string>(items: readonly DirectoryItem[], order: readonly K[]): K[] {
  const used = new Set(items.flatMap((c) => c.kinds));
  return order.filter((k) => used.has(k));
}
