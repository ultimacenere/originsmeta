import type { Locale } from "../i18n";
import woo from "./woo-cards.json";
import cardArt from "./card-art.json";
import { cardLore } from "./card-lore";
import { cardHistory } from "./card-history";
import { cardCredits, type CardCredit } from "./card-credits";

/**
 * Database carte. Quattro sorgenti unite qui:
 * - `woo-cards.json`: dati di gioco (nome, costo, statistiche, testo inglese, tag, rarità, allineamento, chiave
 *   ufficiale, carte collegate) importati dal database community World of Origins con `npm run import:woo`;
 * - `card-lore.ts`: saga, origine della leggenda e traduzione italiana del testo, scritte a mano;
 * - `card-history.ts`: storico dei bilanciamenti trascritto dalle patch notes ufficiali su Steam;
 * - `card-art.json`: illustrazioni ufficiali Koin convertite da `npm run import:art`, indicizzate per chiave.
 */

export type L10n = Record<Locale, string> & { fr?: string };
export type CardType = "unit" | "spell" | "token";
export type ChangeKind = "buff" | "nerf" | "rework" | "deck";
/**
 * Patch del gioco in ordine di uscita. Le versioni del playtest hanno un numero; la patch della demo
 * del 21/09/2026 non ce l'ha (il team la chiama "Demo patch notes - Sep 21 2026"), quindi ha un id nostro
 * e un'etichetta leggibile in `patches`.
 */
export const patchOrder = ["0.6.1", "0.6.2", "0.6.3", "demo-0921"] as const;
export type PatchId = (typeof patchOrder)[number];
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

/** `url` è il post Steam della patch (gid verificati con l'API ufficiale Valve `ISteamNews/GetNewsForApp`, appid 4429430). */
/** `news` è lo slug dell'articolo del sito che racconta la patch (MetaShifting ci rimanda). */
export const patches: Record<PatchId, { date: string; url: string; title: string; label?: L10n; news?: string }> = {
  "0.6.1": {
    date: "2026-08-14",
    url: "https://store.steampowered.com/news/app/4429430/view/1840944183780414",
    title: "Closed Playtest Patch Notes - Update 0.6.1",
    news: "patch-0-6-1-ranked",
  },
  "0.6.2": {
    date: "2026-08-21",
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228669961",
    title: "Closed Playtest Patch Notes - Update 0.6.2",
    news: "patch-0-6-2",
  },
  "0.6.3": {
    date: "2026-08-27",
    url: "https://store.steampowered.com/news/app/4429430/view/1842212951301184",
    title: "Closed Playtest Patch Notes - Update 0.6.3",
    news: "patch-0-6-3",
  },
  // Primo grande aggiornamento della demo: il bilanciamento è "rispetto all'ultima build del playtest" (0.6.3).
  // Il post Steam ne riporta una parte; la versione del Discord ufficiale aggiunge Christopher Robin, due
  // regole di gioco e The Gallows (vedi la news `demo-patch-notes-0921`).
  "demo-0921": {
    date: "2026-09-21",
    url: "https://store.steampowered.com/news/app/4429430/view/1844115010502611",
    title: "The first big update to the Origins demo just landed!",
    label: { en: "Demo · 21 Sep", it: "Demo · 21 set" },
    news: "demo-patch-notes-0921",
  },
};

/** Nome della patch da mostrare: l'etichetta quando c'è (patch senza numero), altrimenti il numero di versione. */
export function patchLabel(id: PatchId, locale: Locale): string {
  return patches[id].label?.[locale] ?? id;
}

/** L'ultima patch uscita. */
export const latestPatch: PatchId = patchOrder[patchOrder.length - 1];

/**
 * Ultima verifica carta per carta sul gioco (collezione della demo, My Decks → Cards): data e numero di
 * carte confrontate. Il deck builder la mostra nel disclaimer sui dati; va aggiornata a ogni nuova verifica.
 */
export const cardsVerified = { date: "2026-09-22", count: 122 };

export type Stats = { mana?: number; power?: number; health?: number };

export type Change = {
  patch: PatchId;
  kind: ChangeKind;
  from?: Stats;
  to?: Stats;
  /** cambio di allineamento, quando la patch lo tocca (es. Itsy Bitsy Spider da Neutrale a Malvagia) */
  alignment?: { from: Alignment; to: Alignment };
  note: L10n;
};

export type Card = {
  slug: string;
  name: string;
  /** nome con cui la carta era conosciuta in una patch precedente */
  formerName?: string;
  /** carta da collezione ufficiale intera, 480 px (es. /cards/mulan.webp); assente per le carte che il materiale Koin non copre */
  image?: string;
  /** stessa carta a 160 px, per i chip e la griglia (es. /cards/sm/mulan.webp) */
  thumb?: string;
  /** sola finestra d'arte, per la carta di gioco che disegniamo noi (es. /cards/art/mulan.webp) */
  art?: string;
  /** ritaglio 16:9 dell'arte, solo per le Leggendarie: copertina dei mazzi della community */
  cover?: string;
  /** illustratore e numero di collezione stampati sulla carta ufficiale */
  credit?: CardCredit;
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

/**
 * Patch uscite dopo i dati importati da World of Origins: le loro modifiche, trascritte dalle patch notes
 * ufficiali in `card-history.ts`, si applicano sopra, così costo, statistiche e allineamento restano quelli
 * del gioco anche prima del prossimo import. Quando World of Origins importa la patch, `cardSource.patch` la
 * raggiunge (o porta un nome che non conosciamo) e qui non si applica più nulla: vincono i suoi dati.
 */
const importedIndex = (patchOrder as readonly string[]).indexOf(cardSource.patch);
function isAfterImport(patch: PatchId): boolean {
  return importedIndex >= 0 && patchOrder.indexOf(patch) > importedIndex;
}

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
  // La chiave di una carta creata può mancare in World of Origins: in quel caso la dà `card-lore.ts`, letta dal materiale ufficiale.
  const key = w.key ?? lore?.key;
  if (key) card.key = key;
  const art = key ? (cardArt.art as Record<string, { slug: string; cover?: boolean }>)[key] : undefined;
  if (art) {
    card.image = `/cards/${art.slug}.webp`;
    card.thumb = `/cards/sm/${art.slug}.webp`;
    card.art = `/cards/art/${art.slug}.webp`;
    if (art.cover) card.cover = `/cards/cover/${art.slug}.webp`;
    if (cardCredits[art.slug]) card.credit = cardCredits[art.slug];
  }
  if (w.legendary) card.legendary = true;
  if (w.mana !== undefined) card.mana = w.mana;
  if (w.power !== undefined) card.power = w.power;
  if (w.health !== undefined) card.health = w.health;
  if (w.alignment) card.alignment = w.alignment;
  for (const ch of card.history) {
    if (!isAfterImport(ch.patch)) continue;
    if (ch.to?.mana !== undefined) card.mana = ch.to.mana;
    if (ch.to?.power !== undefined) card.power = ch.to.power;
    if (ch.to?.health !== undefined) card.health = ch.to.health;
    if (ch.alignment) card.alignment = ch.alignment.to;
  }
  if (w.rarity && !w.tokenOnly) card.rarity = w.rarity;
  if (w.keywords.length) card.keywords = w.keywords;
  // Il testo letto nel gioco (`card-lore.ts`, campo `en`) vince su quello di World of Origins quando è rimasto indietro.
  const abilityEn = lore?.en ?? w.ability;
  if (abilityEn) card.ability = { en: abilityEn, it: lore?.it ?? abilityEn };
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

export type Moved = { card: Card; change: Change; delta: number };

/** Impatto di una modifica sulle statistiche: +Potenza +Salute −costo. Zero per le modifiche solo di testo o allineamento. */
function deltaOf(ch: Change): number {
  if (!ch.from || !ch.to) return 0;
  const dp = (ch.to.power ?? 0) - (ch.from.power ?? 0);
  const dh = (ch.to.health ?? 0) - (ch.from.health ?? 0);
  const dm = (ch.to.mana ?? 0) - (ch.from.mana ?? 0);
  return dp + dh - dm;
}

/**
 * Ordine per importanza: prima chi cambia statistiche, poi le Leggendarie (guidano i mazzi), poi l'entità
 * della variazione, poi chi cambia costo, poi il tipo di modifica e il nome.
 */
function byImpact(a: Moved, b: Moved): number {
  const stats = (m: Moved) => (m.change.from && m.change.to ? 1 : 0);
  const mana = (m: Moved) => (m.change.from?.mana !== undefined && m.change.to?.mana !== undefined && m.change.from.mana !== m.change.to.mana ? 1 : 0);
  return (
    stats(b) - stats(a) ||
    Number(!!b.card.legendary) - Number(!!a.card.legendary) ||
    Math.abs(b.delta) - Math.abs(a.delta) ||
    mana(b) - mana(a) ||
    kindOrder[a.change.kind] - kindOrder[b.change.kind] ||
    a.card.name.localeCompare(b.card.name)
  );
}

/** Movers: carte con variazioni di statistiche, ordinate per importanza; con `patch`, solo quelle di quella patch. */
export function movers(patch?: PatchId): Moved[] {
  const out: Moved[] = [];
  for (const card of cards) {
    for (const ch of card.history) {
      if (!ch.from || !ch.to) continue;
      if (patch && ch.patch !== patch) continue;
      out.push({ card, change: ch, delta: deltaOf(ch) });
    }
  }
  return out.sort(byImpact);
}

/**
 * Tutte le modifiche raggruppate per patch, dalla più recente (MetaShifting): statistiche, effetti e
 * allineamenti. Così l'ultima patch sta in cima e le modifiche solo di testo non spariscono.
 */
export function patchChanges(): { patch: PatchId; items: Moved[] }[] {
  return [...patchOrder]
    .reverse()
    .map((patch) => {
      const items: Moved[] = [];
      for (const card of cards) for (const ch of card.history) if (ch.patch === patch) items.push({ card, change: ch, delta: deltaOf(ch) });
      return { patch, items: items.sort(byImpact) };
    })
    .filter((group) => group.items.length > 0);
}
