import variantArt from "./data/card-variants.json";
import { variantCredits, type CardCredit } from "./data/card-credits";
import { KICKSTARTER_PROMOS, type KickstarterPromo } from "./kickstarterPromos";

/**
 * Illustrazioni alternative delle carte, sulla scheda carta (02/11/2026, Pierluigi: "perché non abbiamo le alternative
 * art sulle schede delle carte? le voglio!"). Due gruppi, tutti e due materiale ufficiale Koin usato come contenuto (mai
 * come design), con le immagini intere, i crediti impressi e l'illustratore scritto accanto:
 * - **Alpha Edition**: le varianti con il segno ALPHA del pacco creator del 19/09/2026 (file `_V00001`, `_V00011`–`_V00015`),
 *   che `import-card-art.mjs` aveva lasciato fuori perché non sono l'aspetto normale della carta. Le converte
 *   `node scripts/import-card-variants.mjs` in `public/cards/alt/`, con misure e giorno di entrata in `card-variants.json`;
 *   illustratore e numero impressi stanno in `variantCredits` di card-credits.ts, trascritti a mano. Solo carte del nostro
 *   database: le carte non annunciate del pacco (Peter Pan, Wukong, Nezha) non entrano.
 * - **Promo del Kickstarter**: le promo della Alpha Edition già pubbliche sulla pagina della campagna (`kickstarterPromos.ts`,
 *   30/10/2026), nella custodia della gradazione, le stesse della landing /kickstarter e della guida.
 * Le stesse immagini vanno nella sitemap della scheda (`cardAltArtImages`, sitemapEntries.ts) e il giorno in cui la carta
 * le ha avute entra nelle sue date (`cardAltArtDay`, cardDates.ts). Import relativi e niente React: lo carica `node --test`.
 */

/** Giorno in cui le schede carta hanno cominciato a mostrare le promo del Kickstarter. */
export const CARD_PROMOS_SINCE = "2026-11-03";

export type AlphaVariant = {
  /** chiave del file Koin, carta più variante: C00316_MC_V00011 */
  id: string;
  /** codice della variante: V00011 */
  code: string;
  /** slug della carta */
  card: string;
  /** WebP intera in public/ */
  image: string;
  width: number;
  height: number;
  /** illustratore e numero stampati sulla variante */
  credit: CardCredit;
  /** giorno in cui è entrata sul sito */
  since: string;
};

export type CardAltArts = { alpha: AlphaVariant[]; promos: KickstarterPromo[] };

type ManifestEntry = { slug: string; w: number; h: number; since: string };

/** Il file della variante: `public/cards/alt/<slug>-v00011.webp`, come lo scrive import-card-variants.mjs. */
export function alphaImagePath(slug: string, code: string): string {
  return `/cards/alt/${slug}-${code.toLowerCase()}.webp`;
}

/** Tutte le varianti ALPHA con il loro credito, nell'ordine delle chiavi (carta, poi variante). */
export const alphaVariants: readonly AlphaVariant[] = Object.entries(variantArt.variants as Record<string, ManifestEntry>)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([id, e]) => {
    const credit = variantCredits[id];
    // senza illustratore la variante non si mostra (il test lo segnala: il credito va sempre accanto all'immagine)
    if (!credit?.illus) return [];
    const code = id.slice(-6);
    return [{ id, code, card: e.slug, image: alphaImagePath(e.slug, code), width: e.w, height: e.h, credit, since: e.since }];
  });

/** Le illustrazioni alternative di una carta: prima le varianti ALPHA, poi le promo del Kickstarter nell'ordine della landing. */
export function cardAltArts(slug: string, alpha: readonly AlphaVariant[] = alphaVariants, promos: readonly KickstarterPromo[] = KICKSTARTER_PROMOS): CardAltArts {
  return { alpha: alpha.filter((v) => v.card === slug), promos: promos.filter((p) => p.card === slug) };
}

/** Quante sono. */
export function altArtCount(arts: CardAltArts): number {
  return arts.alpha.length + arts.promos.length;
}

/** Le immagini da aggiungere alla sitemap della scheda, dopo la carta ufficiale. */
export function cardAltArtImages(slug: string): string[] {
  const { alpha, promos } = cardAltArts(slug);
  return [...alpha.map((v) => v.image), ...promos.map((p) => p.image)];
}

/** Il giorno in cui la scheda ha avuto la sua ultima illustrazione alternativa; nessuno se non ne ha. */
export function cardAltArtDay(slug: string): string | undefined {
  const { alpha, promos } = cardAltArts(slug);
  const days = [...alpha.map((v) => v.since), ...(promos.length ? [CARD_PROMOS_SINCE] : [])];
  return days.length ? days.reduce((a, b) => (a > b ? a : b)) : undefined;
}
