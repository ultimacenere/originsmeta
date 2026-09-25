import type { Locale } from "./i18n";
import { cardsVerified, patchOrder, patches, type Card } from "./data/cards";
import { cardLore } from "./data/card-lore";
import { tierList, tierOf } from "./data/tierlist";
import { getGuides, type Guide } from "./content/guides";
import { pageLastmod, type Day } from "./lastmod";
import type { TextSource } from "./cardTitles";

/**
 * Date di una scheda carta, in un posto solo (Ondata 1 SEO/GEO, correzione del 25/09/2026 dopo la revisione): le
 * usano la sitemap (`lastmod`) e la scheda (`dateModified` del CreativeWork), così pagina e sitemap dichiarano lo
 * stesso giorno per la stessa modifica. Prima la scheda guardava solo l'ultima patch, la sitemap anche le altre fonti.
 * Import relativi, come i moduli di dati: il test di `cardTitles.test.ts` lo carica con `node --test`.
 */

/**
 * Giorno in cui sono cambiati tutti i testi italiani e spagnoli delle carte (`card-lore.ts`, campi `it` ed `es`):
 * letti nel gioco per le 122 carte della collezione della Demo 2.0, riscritti con il glossario ufficiale per le carte
 * create e rimosse. Tocca solo le schede in quelle lingue: il testo inglese viene da World of Origins o dal campo `en`.
 * Va spostato alla prossima rilettura nel gioco (dopo ogni patch, docs/testi-di-gioco.md).
 */
export const localizedTextsRead: Readonly<Partial<Record<Locale, Day>>> = { it: "2026-09-25", es: "2026-09-25" };

/** Da quando vale il testo delle carte: serve a `textOutdated` e `cardDescription` in `cardTitles.ts`. */
export const cardTextSource: TextSource = {
  dates: Object.fromEntries(patchOrder.map((id) => [id, patches[id].date])),
  verified: cardsVerified.date,
};

/** Le guide di una lingua, lette una volta: la build chiama queste funzioni per ogni scheda in ogni lingua. */
const guidesByLocale = new Map<Locale, readonly Guide[]>();
function guidesOf(locale: Locale): readonly Guide[] {
  let list = guidesByLocale.get(locale);
  if (!list) guidesByLocale.set(locale, (list = getGuides(locale)));
  return list;
}

/**
 * Date che cambiano una scheda carta nella lingua `locale`: le patch che l'hanno toccata, la verifica sul gioco quando
 * ne ha corretto testo o parole chiave (`card-lore.ts`, campi `en` e `keywords`), i testi italiani e spagnoli letti nel
 * gioco (solo per quelle lingue), le guide della lingua che la citano (il riquadro "Guide correlate") e la tier list
 * di OriginsMeta quando la scheda ne mostra la fascia (non "unranked": dall'Ondata 2 la scheda non mostra più quella
 * pastiglia): le stesse fonti che legge la pagina. I giorni dei mazzi della community li aggiunge `cardPageLastmod`
 * (cardSynergy.ts), nella scheda e nella sitemap; i mazzi editoriali di decks.ts non contano più (il file è vuoto e
 * la scheda non li legge). `guides` si passa quando il chiamante le ha già (la sitemap, che le legge una volta per lingua);
 * la scheda non le passa e le prende da `guidesOf`.
 */
export function cardDates(card: Card, locale: Locale, guides: readonly Guide[] = guidesOf(locale)): (string | undefined)[] {
  const lore = cardLore[card.slug];
  const tier = tierOf(card.legendary ? "legendaries" : "cards", card.slug);
  return [
    ...card.history.map((h) => patches[h.patch].date),
    lore?.en || lore?.keywords ? cardsVerified.date : undefined,
    locale !== "en" && lore?.[locale] ? localizedTextsRead[locale] : undefined,
    ...guides.filter((g) => g.tags?.cards?.includes(card.slug)).map((g) => g.updated),
    tier && tier !== "unranked" ? tierList.updated : undefined,
  ];
}

/**
 * Il giorno dell'ultima modifica di una scheda carta: il `lastmod` della sitemap e il `dateModified` della pagina,
 * calcolati tutti e due da questa funzione. Stesse regole di tutte le pagine (`pageLastmod`: modello della pagina,
 * nascita della lingua, mai nel futuro).
 */
export function cardLastmod(card: Card, locale: Locale, today: Day, guides?: readonly Guide[]): Day {
  return pageLastmod("/cards/[slug]", locale, cardDates(card, locale, guides), today);
}
