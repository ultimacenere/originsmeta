import type { Locale } from "../i18n";
import woo from "./woo-cards.json";
import { cardLore } from "./card-lore";
import { cardHistory } from "./card-history";

/**
 * Database carte. Tre sorgenti unite qui:
 * - `woo-cards.json`: dati di gioco (nome, costo, statistiche, testo inglese, tag, rarità, allineamento, chiave
 *   ufficiale, carte collegate) importati dal database community World of Origins con `npm run import:woo`;
 * - `card-lore.ts`: saga, origine della leggenda e traduzione italiana del testo, scritte a mano;
 * - `card-history.ts`: storico dei bilanciamenti trascritto dalle patch notes ufficiali su Steam.
 */

export type L10n = Record<Locale, string> & { fr?: string };
export type CardType = "unit" | "spell" | "token";
export type ChangeKind = "buff" | "nerf" | "rework" | "deck";
export type PatchId = "0.6.1" | "0.6.2" | "0.6.3";
export type Alignment = "good" | "evil" | "neutral";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export type SagaId =
  | "arthurian"
  | "wonderland"
  | "hundred-acre-wood"
  | "oz"
  | "sherwood"
  | "gothic"
  | "jungle-book"
  | "fairy-tale"
  | "nursery-rhyme"
  | "myth-folklore"
  | "african-folklore"
  | "american-tales"
  | "classic-literature"
  | "ballad-of-mulan"
  | "arabian-nights"
  | "baker-street"
  | "other";

export const sagas: Record<SagaId, L10n> = {
  arthurian: { en: "Arthurian legend", it: "Ciclo arturiano", fr: "Légende arthurienne" },
  wonderland: { en: "Wonderland", it: "Paese delle Meraviglie", fr: "Pays des Merveilles" },
  "hundred-acre-wood": { en: "Hundred Acre Wood", it: "Bosco dei Cento Acri", fr: "Forêt des Rêves bleus" },
  oz: { en: "Land of Oz", it: "Terra di Oz", fr: "Pays d'Oz" },
  sherwood: { en: "Sherwood", it: "Sherwood", fr: "Sherwood" },
  gothic: { en: "Gothic horror", it: "Horror gotico", fr: "Horreur gothique" },
  "jungle-book": { en: "The Jungle Book", it: "Il libro della giungla", fr: "Le Livre de la jungle" },
  "fairy-tale": { en: "Fairy tales", it: "Fiabe", fr: "Contes de fées" },
  "nursery-rhyme": { en: "Nursery rhymes", it: "Filastrocche", fr: "Comptines" },
  "myth-folklore": { en: "Myth & folklore", it: "Miti e folclore", fr: "Mythes et folklore" },
  "african-folklore": { en: "African folklore", it: "Folclore africano", fr: "Folklore africain" },
  "american-tales": { en: "American tales", it: "Racconti americani", fr: "Récits américains" },
  "classic-literature": { en: "Classic literature", it: "Letteratura classica", fr: "Littérature classique" },
  "ballad-of-mulan": { en: "Ballad of Mulan", it: "Ballata di Mulan", fr: "Ballade de Mulan" },
  "arabian-nights": { en: "Arabian Nights", it: "Le mille e una notte", fr: "Les Mille et Une Nuits" },
  "baker-street": { en: "Baker Street", it: "Baker Street", fr: "Baker Street" },
  other: { en: "Other", it: "Altro", fr: "Autre" },
};

export const patches: Record<PatchId, { date: string; url: string; title: string }> = {
  "0.6.1": {
    date: "2026-08-14",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.1",
  },
  "0.6.2": {
    date: "2026-08-21",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.2",
  },
  "0.6.3": {
    date: "2026-08-27",
    url: "https://steamcommunity.com/app/4429430/allnews/",
    title: "Closed Playtest Patch Notes - Update 0.6.3",
  },
};

export type Stats = { mana?: number; power?: number; health?: number };

export type Change = {
  patch: PatchId;
  kind: ChangeKind;
  from?: Stats;
  to?: Stats;
  note: L10n;
};

export type Card = {
  slug: string;
  name: string;
  /** nome con cui la carta era conosciuta in una patch precedente */
  formerName?: string;
  /** percorso immagine in /public (es. /cards/mulan.webp); assente finché non abbiamo le illustrazioni */
  image?: string;
  /** chiave ufficiale della carta nei codici-mazzo del gioco (es. C00012_MC), quando nota */
  key?: string;
  type: CardType;
  legendary?: boolean;
  saga: SagaId;
  mana?: number;
  power?: number;
  health?: number;
  alignment?: Alignment;
  /** assente per le carte create (token) */
  rarity?: Rarity;
  /** parole chiave e tag del testo, come li classifica World of Origins */
  keywords?: string[];
  /** testo ufficiale della carta (en) e traduzione (it) */
  ability?: L10n;
  origin?: L10n;
  /** slug delle carte create o richiamate dal testo */
  related?: string[];
  status: "active" | "removed";
  history: Change[];
};

type WooCard = {
  id: string;
  slug: string;
  key?: string;
  name: string;
  formerName?: string;
  type: CardType;
  tokenOnly?: boolean;
  legendary: boolean;
  status: "active" | "removed";
  mana?: number;
  power?: number;
  health?: number;
  alignment?: Alignment;
  rarity?: Rarity;
  series?: number;
  keywords: string[];
  ability?: string;
  related?: string[];
};

type WooData = { source: string; patch: string; fetched: string; cards: WooCard[] };
const data = woo as unknown as WooData;

/** Provenienza dei dati di gioco: sito, patch e data dell'ultimo import. */
export const cardSource = {
  name: "World of Origins",
  url: data.source,
  patch: data.patch.replace(/^.*:v/, ""),
  fetched: data.fetched,
};

export const cards: Card[] = data.cards.map((w) => {
  const lore = cardLore[w.slug];
  const card: Card = {
    slug: w.slug,
    name: w.name,
    type: w.type,
    saga: lore?.saga ?? "other",
    status: w.status,
    history: cardHistory[w.slug] ?? [],
  };
  if (w.formerName) card.formerName = w.formerName;
  if (w.key) card.key = w.key;
  if (w.legendary) card.legendary = true;
  if (w.mana !== undefined) card.mana = w.mana;
  if (w.power !== undefined) card.power = w.power;
  if (w.health !== undefined) card.health = w.health;
  if (w.alignment) card.alignment = w.alignment;
  if (w.rarity && !w.tokenOnly) card.rarity = w.rarity;
  if (w.keywords.length) card.keywords = w.keywords;
  if (w.ability) card.ability = { en: w.ability, it: lore?.it ?? w.ability };
  if (lore?.origin) card.origin = lore.origin;
  if (w.related?.length) card.related = w.related;
  return card;
});

const bySlug = new Map(cards.map((c) => [c.slug, c]));

export function getCard(slug: string): Card | undefined {
  return bySlug.get(slug);
}

/** Carte giocabili nella demo attuale (attive, non create da altre carte). */
export const activeCards: Card[] = cards.filter((c) => c.status === "active" && c.type !== "token");

/** Carte il cui testo crea o richiama questa carta. */
export function relatedFrom(slug: string): Card[] {
  return cards.filter((c) => c.related?.includes(slug));
}

export function statLine(card: Pick<Card, "mana" | "power" | "health" | "type">): string {
  if (card.mana === undefined && card.power === undefined) return "";
  if (card.power === undefined) return card.mana !== undefined ? `${card.mana}` : "";
  return `${card.mana ?? "?"} · ${card.power ?? "?"}/${card.health ?? "?"}`;
}

/** Ultima patch che ha toccato la carta. */
export function lastChange(card: Card): Change | undefined {
  return card.history[card.history.length - 1];
}

const kindOrder: Record<ChangeKind, number> = { buff: 0, nerf: 1, rework: 2, deck: 3 };

/** Movers: carte con variazioni di statistiche, ordinate per impatto. */
export function movers(): { card: Card; change: Change; delta: number }[] {
  const out: { card: Card; change: Change; delta: number }[] = [];
  for (const card of cards) {
    for (const ch of card.history) {
      if (!ch.from || !ch.to) continue;
      const dp = (ch.to.power ?? 0) - (ch.from.power ?? 0);
      const dh = (ch.to.health ?? 0) - (ch.from.health ?? 0);
      const dm = (ch.to.mana ?? 0) - (ch.from.mana ?? 0);
      const delta = dp + dh - dm;
      out.push({ card, change: ch, delta });
    }
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || kindOrder[a.change.kind] - kindOrder[b.change.kind]);
}
