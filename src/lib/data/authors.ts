import type { Locale } from "../i18n";
import { getGuides, type Guide } from "../content/guides";
import { sortedNews, type NewsItem } from "./news";
import { authors, getAuthor, type Author } from "./authorsCore";

// L'elenco degli autori e le funzioni che non leggono news e guide stanno in authorsCore.ts (modulo leggero): qui si
// riesportano, così chi importa da "@/lib/data/authors" trova tutto come prima.
export { authors, authorByUsername, founders, getAuthor, nicknameOf, type Author } from "./authorsCore";

/**
 * Chi firma una guida. Unico punto di verità: la pagina della guida (firma in fondo e nodo Article
 * dei dati strutturati) e le pagine autore devono dire la stessa cosa, quindi chiamano tutte questa.
 *
 * Oggi la risposta è sempre Pierluigi Cella: i testi delle guide li scrive OriginsMeta, anche quelli
 * ai mazzi della community, che partono dalle note di chi ha pubblicato il mazzo ma non sono firmati
 * da lui (le guide stesse lo dicono: le note dell'autore stanno sulla scheda del mazzo, la lettura
 * dei matchup è di OriginsMeta). Attribuire un testo a chi non l'ha scritto è un errore, non una
 * sfumatura: finché non c'è una firma dichiarata, si firma chi risponde dei contenuti.
 *
 * Quando il tipo Guide (src/lib/content/guides.ts) avrà un campo autore, qui si legge quello e si
 * usa questo valore come riserva: `return getAuthor(guide.author ?? "pierluigi-cella") ?? authors[0]`.
 * Il parametro resta apposta, così le chiamate non cambiano il giorno che succede.
 */
export function authorOfGuide(guide?: Guide): Author {
  // Il campo non esiste ancora nel tipo: quando ci sarà, questa riga lo legge senza altre modifiche.
  const slug = (guide as (Guide & { author?: string }) | undefined)?.author ?? "pierluigi-cella";
  return getAuthor(slug) ?? authors[0];
}

/**
 * Chi firma una news: come per le guide, unico punto di verità per la firma in fondo all'articolo,
 * il nodo NewsArticle dei dati strutturati e la pagina autore. Le news le firma chi risponde dei
 * contenuti (Pierluigi Cella, regola del 21/09/2026), anche quelle sui mazzi della community: il
 * mazzo è di chi lo ha pubblicato e il testo lo cita, ma l'articolo lo scrive OriginsMeta.
 */
export function authorOfNews(item: NewsItem): Author {
  return getAuthor(item.author ?? "pierluigi-cella") ?? authors[0];
}

/** Le news firmate da un autore, dalla più recente. */
export function newsByAuthor(slug: string): NewsItem[] {
  return sortedNews.filter((item) => authorOfNews(item).slug === slug);
}

/** Le guide firmate da un autore, nell'ordine di `guideSlugs`. */
export function guidesByAuthor(locale: Locale, slug: string): Guide[] {
  return getGuides(locale).filter((g) => authorOfGuide(g).slug === slug);
}

/**
 * I mazzi della community pubblicati da un autore, dichiarati in `communityDecks`: le pagine autore
 * restano statiche e non leggono Supabase. Nomi e slug sono quelli delle schede dei mazzi.
 */
export function decksByAuthor(slug: string): { slug: string; name: string }[] {
  return getAuthor(slug)?.communityDecks ?? [];
}
