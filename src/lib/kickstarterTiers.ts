/**
 * I livelli della campagna Kickstarter della Alpha Edition, dalle schede di Koin Games che Pierluigi ha passato il
 * 26/10/2026 notte ("questi sono i pacchetti che saranno disponibili domani su kickstarter"). Nomi dei livelli e dei
 * contenuti in inglese, come li scrive Koin (sono nomi di prodotto); prezzi in dollari.
 *
 * La landing li mostra solo con `KICKSTARTER_TIERS_PUBLIC` acceso (dal 27/10/2026, vedi sotto). Questo modulo lo importa
 * solo la pagina /kickstarter (componente server): materiale di Koin non ancora pubblico non deve finire in un componente
 * client, altrimenti arriverebbe nel JavaScript del sito anche con il flag spento.
 *
 * Non si mostrano né l'"MSRP" barrato né il "Bonus value" delle schede: sono prezzi di riferimento di prodotti mai venduti
 * a quel prezzo, e ripeterli da affiliati sarebbe un prezzo di confronto non verificabile (direttiva UE sulle pratiche
 * commerciali sleali, Codice del consumo). Si mostrano prezzo, prodotti sigillati e contenuti.
 *
 * `verify` segna un dato delle schede da controllare: il test non lascia accendere i livelli finché un livello lo ha. Per
 * Myth (immagine ×13, elenco 30 case) Pierluigi ha scelto l'elenco il 27/10/2026.
 */

/**
 * Acceso il 27/10/2026 notte, con la campagna ancora in pre-lancio sulla pagina pubblica di Kickstarter, per decisione di
 * Pierluigi ("pubblica lo stesso adesso ... me ne prendo io la responsabilità con Koin"). Myth come l'elenco della scheda:
 * 30 case, 4.320 pacchetti (l'immagine mostra ×13).
 */
export const KICKSTARTER_TIERS_PUBLIC = true;

export type KickstarterTier = {
  /** nome del livello come lo scrive Koin */
  name: string;
  /** prezzo in dollari */
  usd: number;
  /** il prodotto sigillato principale, come lo scrive Koin */
  sealed: string;
  /** pacchetti in tutto */
  packs: number;
  /** gli altri contenuti, come li scrive Koin, in ordine */
  items: string[];
  /** un dato delle schede da controllare sulla pagina della campagna prima di accendere i livelli */
  verify?: string;
};

const BASE = ["Alpha Supporter Title", "Founder Collector Capsule (Avatar, Card Back, 1 Founder Emote, 1 Founder Slab)", "Permanent Origins TCG Collector Pass"];
const BIG_BOB = ["Big Bob Commander (Kickstarter Exclusive)", "Big Bob Emote Pack (3 Emotes)"];
const GOLDEN_BOB = ["Golden Big Bob Commander (Kickstarter Exclusive)", "Golden Big Bob Emote Pack (3 Emotes)", "Alpha Alt Art Promo Box"];

export const KICKSTARTER_TIERS: readonly KickstarterTier[] = [
  { name: "Worthy", usd: 24, sealed: "1 sealed Alpha Booster Bundle", packs: 6, items: ["Alpha Supporter Title", "Permanent Origins TCG Collector Pass"] },
  { name: "Aspirant", usd: 99, sealed: "1 sealed Alpha Booster Box", packs: 24, items: [...BASE, ...BIG_BOB] },
  { name: "Apprentice", usd: 199, sealed: "2 sealed Alpha Booster Box", packs: 48, items: [...BASE, ...BIG_BOB, ...GOLDEN_BOB] },
  { name: "Hero", usd: 499, sealed: "1 sealed Alpha Booster Box Case", packs: 144, items: [...BASE, ...BIG_BOB, ...GOLDEN_BOB, "Alpha Gameboard", "Van Helsing Golden Slab Promo"] },
  { name: "Champion", usd: 999, sealed: "2 sealed Alpha Booster Box Case", packs: 288, items: [...BASE, ...BIG_BOB, ...GOLDEN_BOB, "Alpha Gameboard", "Van Helsing & Rapunzel Golden Slab Promos"] },
  {
    name: "Icon",
    usd: 2499,
    sealed: "6 sealed Alpha Booster Box Case",
    packs: 864,
    items: [...BASE, ...BIG_BOB, ...GOLDEN_BOB, "Alpha Gameboard", "Van Helsing & Rapunzel Golden Slab Promos", "Guaranteed Premium Alternate Art Promo Set"],
  },
  {
    name: "Myth: Winnie-the-Pooh",
    usd: 4999,
    sealed: "30 sealed Alpha Booster Box Case",
    packs: 4320,
    items: [
      ...BASE,
      ...BIG_BOB,
      ...GOLDEN_BOB,
      "Alpha Gameboard",
      "Van Helsing & Rapunzel Golden Slab Promos",
      "Guaranteed Premium Alternate Art Promo Set",
      "Golden Commander Skin",
      "Golden Emote",
      "Serialized Character Profile Promo",
    ],
  },
  {
    name: "Legend: Winnie-the-Pooh",
    usd: 9999,
    sealed: "30 sealed Alpha Booster Box Case",
    packs: 4320,
    items: [
      ...BASE,
      ...BIG_BOB,
      ...GOLDEN_BOB,
      "Alpha Gameboard",
      "Van Helsing & Rapunzel Golden Slab Promos",
      "Guaranteed Premium Alternate Art Promo Set",
      "Golden Commander Skin",
      "Golden Emote",
      "Serialized Character Profile Promo",
      "Serialized Signature Character Profile Promo",
    ],
  },
];

/** Il livello più economico e il più caro, per la riga sotto il tasto. */
export function tierRange(tiers: readonly KickstarterTier[] = KICKSTARTER_TIERS): { min: number; max: number } {
  const prices = tiers.map((t) => t.usd);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Il prezzo nel formato della lingua, in dollari e senza decimali (24 $, $24, 24 $US). */
export function formatUsd(locale: string, usd: number): string {
  // `useGrouping: "always"`: in italiano e spagnolo Intl scrive 9999 senza punto sotto le cinque cifre
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0, useGrouping: "always" } as Intl.NumberFormatOptions).format(usd);
}
