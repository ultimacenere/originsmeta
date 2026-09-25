import type { Locale } from "./i18n";
import type { Card } from "./data/cards";

/**
 * Title e meta description delle schede carta, e title dei mazzi della community (Ondata 1 del piano SEO/GEO del
 * 25/09/2026, "ogni ricerca alla sua pagina").
 *
 * Perché: prima il title di una scheda era il solo nome ("Merlin · Origins TCG · OriginsMeta"), uguale in tre lingue
 * e senza la parola "carta"; la description era un elenco di campi senza "Origins TCG" né "Koin Games", e sui nomi
 * condivisi con altri giochi (Merlin in Grand Archive e Sorcery, Riftbound Origins) lo snippet non diceva di che gioco
 * si parla. Qui c'è un modello per tipo di carta (Leggendaria, carta base, carta creata, carta non nella demo) nelle
 * tre lingue, e la description è una frase vera fatta solo con i dati della scheda: tipo, allineamento, costo,
 * statistiche, stato, chi crea la carta, testo e origine della leggenda.
 *
 * Funzioni pure che importano solo tipi: `node --test` le prova su tutto il database carte (cardTitles.test.ts).
 */

/** Stesso limite di `TITLE_MAX` in `page.ts`: un title che contiene già "Origins TCG" deve starci da solo. */
export const CARD_TITLE_MAX = 60;
/** Limiti della meta description, come in `page.ts` (`DESCRIPTION_MAX`) e nella vecchia description della scheda. */
export const CARD_DESC_MIN = 120;
export const CARD_DESC_MAX = 158;

/** I campi della carta che servono a title e description (le schede passano la `Card` intera). */
export type TitleCard = Pick<Card, "slug" | "name" | "type" | "status" | "legendary" | "formerName" | "mana" | "power" | "health" | "alignment" | "ability" | "origin" | "related">;

/**
 * Coda del title per tipo di carta: il nome viene prima, poi il tipo di pagina nella lingua della ricerca
 * ("carta Leggendaria", "carta creada"...). Contengono tutte "Origins TCG", quindi `pageTitle` non aggiunge la parola
 * chiave e mette " · OriginsMeta" solo se il totale resta entro i 60 caratteri.
 */
const titleTails: Record<Locale, { legendary: string; card: string; created: string; removed: string; removedLegendary: string }> = {
  en: {
    legendary: "Origins TCG Legendary card",
    card: "Origins TCG card",
    created: "Origins TCG created card",
    removed: "Origins TCG card, not in the demo",
    removedLegendary: "Origins TCG Legendary, not in the demo",
  },
  it: {
    legendary: "carta Leggendaria di Origins TCG",
    card: "carta di Origins TCG",
    created: "carta creata di Origins TCG",
    removed: "carta di Origins TCG non nella demo",
    removedLegendary: "Leggendaria di Origins TCG non nella demo",
  },
  es: {
    legendary: "carta Legendaria de Origins TCG",
    card: "carta de Origins TCG",
    created: "carta creada de Origins TCG",
    removed: "carta de Origins TCG fuera de la demo",
    removedLegendary: "Legendaria de Origins TCG fuera de la demo",
  },
};

/**
 * Title della scheda carta, senza marchio: "Merlin: Origins TCG Legendary card", "Baker: carta di Origins TCG",
 * "Garlic: carta creada de Origins TCG", "Alice: Origins TCG Legendary, not in the demo". Le carte create non sono mai
 * rimosse, ma se lo diventassero conta lo stato: la prima cosa da dire è che la carta non è nella demo.
 * Se il nome fosse troppo lungo (oggi il più lungo, 24 caratteri, sta in tutti i modelli) si ripiega sulla coda corta.
 */
export function cardTitle(card: TitleCard, locale: Locale): string {
  const t = titleTails[locale];
  const tail = card.status === "removed" ? (card.legendary ? t.removedLegendary : t.removed) : card.type === "token" ? t.created : card.legendary ? t.legendary : t.card;
  for (const option of [tail, t.card]) {
    const title = `${card.name}: ${option}`;
    if (title.length <= CARD_TITLE_MAX) return title;
  }
  const room = CARD_TITLE_MAX - ": Origins TCG".length;
  return `${shorten(card.name, room) || hardCut(card.name, room)}: Origins TCG`;
}

/** Etichette di allineamento: restano in inglese in tutte le lingue, come sulla carta (docs/testi-di-gioco.md). */
const alignWord = { good: "Good", evil: "Evil", neutral: "Neutral" } as const;

type Head = {
  /** nome, con il nome precedente fra parentesi quando c'è */
  name: string;
  align: string;
  legendary: boolean;
  /** magia (le carte create non lo dicono: si chiamano "carta creata") */
  spell: boolean;
  stats: string;
  /** chi crea la carta, già unito ("Van Helsing's Tools", "Animate Object and Sorcerer's Apprentice") */
  creators?: string;
};

type DescWords = {
  stats: (mana: number | undefined, power: number | undefined, health: number | undefined) => string;
  former: (name: string) => string;
  and: string;
  active: (h: Head) => string;
  created: (h: Head) => string;
  removed: (h: Head) => string;
  /** riserva per le carte senza testo e con l'origine lunga: dice che cosa si trova nella pagina (poi in breve) */
  tail: string;
  shortTail: string;
};

/**
 * Attacco della description per tipo di carta, con "Origins TCG" e "Koin Games" sempre dentro: sulle ricerche
 * "<nome> origins tcg" lo snippet deve dire che si parla del gioco di Koin Games, non di un omonimo.
 * Termini di gioco come nel glossario (docs/testi-di-gioco.md, docs/spagnolo.md): unità/magia, unidad/hechizo,
 * Leggendaria/Legendaria, carta creata/creada; spagnolo neutro.
 */
const descWords: Record<Locale, DescWords> = {
  en: {
    stats: (m, p, h) => (p === undefined ? `${m ?? "?"} mana` : `${m ?? "?"} mana, ${p}/${h ?? "?"}`),
    former: (x) => ` (formerly ${x})`,
    and: " and ",
    active: (h) => `${h.name}, ${h.align} ${h.legendary ? "Legendary " : ""}${h.spell ? "spell" : "unit"} in Origins TCG by Koin Games: ${h.stats}.`,
    created: (h) =>
      h.creators
        ? `${h.name}, ${h.align} card created by ${h.creators} in Origins TCG (Koin Games): ${h.stats}.`
        : `${h.name}, ${h.align} created card in Origins TCG by Koin Games: ${h.stats}.`,
    removed: (h) => `${h.name}, ${h.align} ${h.legendary ? "Legendary " : ""}${h.spell ? "spell" : "unit"} from Origins TCG by Koin Games, not in the demo: ${h.stats}.`,
    tail: "Stats and origin of the legend on OriginsMeta.",
    shortTail: "Stats and legend on OriginsMeta.",
  },
  it: {
    stats: (m, p, h) => (p === undefined ? `${m ?? "?"} mana` : `${m ?? "?"} mana, ${p}/${h ?? "?"}`),
    former: (x) => ` (già ${x})`,
    and: " e ",
    active: (h) => `${h.name}, ${h.spell ? "magia" : "unità"}${h.legendary ? " Leggendaria" : ""} ${h.align} di Origins TCG (Koin Games): ${h.stats}.`,
    created: (h) =>
      h.creators
        ? `${h.name}, carta ${h.align} creata da ${h.creators} in Origins TCG (Koin Games): ${h.stats}.`
        : `${h.name}, carta creata ${h.align} di Origins TCG (Koin Games): ${h.stats}.`,
    removed: (h) => `${h.name}, ${h.spell ? "magia" : "unità"}${h.legendary ? " Leggendaria" : ""} ${h.align} di Origins TCG (Koin Games) non nella demo: ${h.stats}.`,
    tail: "Statistiche e origine della leggenda su OriginsMeta.",
    shortTail: "Statistiche e leggenda su OriginsMeta.",
  },
  es: {
    stats: (m, p, h) => (p === undefined ? `${m ?? "?"} de maná` : `${m ?? "?"} de maná, ${p}/${h ?? "?"}`),
    former: (x) => ` (antes ${x})`,
    and: " y ",
    // "hechizo" è maschile: una magia Leggendaria è "hechizo Legendario" (Legion of the Dead)
    active: (h) => `${h.name}, ${h.spell ? "hechizo" : "unidad"}${h.legendary ? (h.spell ? " Legendario" : " Legendaria") : ""} ${h.align} de Origins TCG (Koin Games): ${h.stats}.`,
    created: (h) =>
      h.creators
        ? `${h.name}, carta ${h.align} creada por ${h.creators} en Origins TCG (Koin Games): ${h.stats}.`
        : `${h.name}, carta creada ${h.align} de Origins TCG (Koin Games): ${h.stats}.`,
    removed: (h) =>
      `${h.name}, ${h.spell ? "hechizo" : "unidad"}${h.legendary ? (h.spell ? " Legendario" : " Legendaria") : ""} ${h.align} de Origins TCG (Koin Games) fuera de la demo: ${h.stats}.`,
    tail: "Estadísticas y origen de la leyenda en OriginsMeta.",
    shortTail: "Estadísticas y leyenda en OriginsMeta.",
  },
};

/** Per confrontare nomi e testi senza badare all'apostrofo tipografico (il database li usa tutti e due). */
function plain(text: string): string {
  return text.replace(/[’‘]/g, "'");
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Chi crea una carta creata. Il campo `related` di World of Origins vuol dire "citata da" e a volte salta un passaggio
 * (Garlic risulta da Van Helsing, ma la gioca Van Helsing's Tools; Mama Bear da Baby Bear, ma la aggiunge Papa Bear):
 * quindi prima si cercano le carte il cui testo inglese nomina la carta creata (anche al plurale, "three Pumpkins"),
 * e solo se nessun testo la nomina si usa `related`. Fra più fonti restano quelle nella demo, quando ce ne sono.
 * Un nome contenuto in uno più lungo ("Little Pig" in "Not So Little Pig") non conta dentro il nome più lungo.
 */
export function creatorsOf(card: TitleCard, all: readonly TitleCard[]): TitleCard[] {
  if (card.type !== "token") return [];
  const name = plain(card.name);
  const longer = all.map((c) => plain(c.name)).filter((n) => n.length > name.length && n.includes(name));
  const re = new RegExp(`(?<![A-Za-z])${escapeRe(name)}(?:e?s)?(?![A-Za-z])`);
  const mentions = (c: TitleCard) => {
    let text = plain(c.ability?.en ?? "");
    for (const n of longer) text = text.split(n).join(" ");
    return re.test(text);
  };
  const others = all.filter((c) => c.slug !== card.slug);
  const byText = others.filter(mentions);
  const pool = byText.length ? byText : others.filter((c) => c.related?.includes(card.slug));
  const inDemo = pool.filter((c) => c.status === "active");
  return inDemo.length ? inDemo : pool;
}

/** Testo della carta su una riga: gli a capo del database diventano punti ("Trample. If I'm in your hand…"). */
function oneLine(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const joined = lines.reduce((acc, line) => (!acc ? line : /[.!?:;,…]$/.test(acc) ? `${acc} ${line}` : `${acc}. ${line}`), "");
  return joined && !/[.!?…]$/.test(joined) ? `${joined}.` : joined;
}

/**
 * Taglio entro `max` caratteri: alla fine dell'ultima frase intera, se ne resta abbastanza (meglio "…by my ⚔️." che
 * "…by my ⚔️. If…"), altrimenti a parola intera con l'ellissi (compresa nel conto), come faceva la vecchia description
 * della scheda. Non lascia a metà una coppia surrogata (emoji fuori dal piano base).
 */
function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  // Fine di frase: un punto seguito da uno spazio, ma non quello di un'abbreviazione ("Dr. Frank", "St. George")
  const within = text.slice(0, max + 1);
  let sentence = -1;
  for (const m of within.matchAll(/[.!?](?= )/g)) if (!/\b(?:Dr|Mr|Mrs|Ms|St)$/.test(within.slice(0, m.index))) sentence = m.index;
  if (sentence + 1 >= max * 0.6) return text.slice(0, sentence + 1);
  let hard = text.slice(0, max - 1);
  if (/[\uD800-\uDBFF]$/.test(hard)) hard = hard.slice(0, -1);
  const space = hard.lastIndexOf(" ");
  const kept = space > max * 0.6 ? hard.slice(0, space) : hard;
  return `${kept.replace(/[\s,.;:·—–-]+$/, "")}…`;
}

/**
 * Nome accorciato all'ultima parola intera, con l'ellissi, entro `max` caratteri. "" quando non resta spazio utile
 * o quando l'ultima parola intera lascerebbe meno di metà dello spazio: meglio togliere il nome che spezzarlo a metà
 * parola ("The Trick-or-Tre…"). Il chiamante decide il ripiego.
 */
function shorten(name: string, max: number): string {
  if (name.length <= max) return name;
  if (max < 8) return "";
  const space = name.slice(0, max).lastIndexOf(" ");
  if (space < (max - 1) * 0.5) return "";
  return `${name.slice(0, space).replace(/[\s,.;:·—–-]+$/, "")}…`;
}

/** Ultima risorsa: taglio netto con l'ellissi, per un nome che non ha spazi dove accorciarsi. */
function hardCut(name: string, max: number): string {
  return name.length <= max ? name : `${name.slice(0, max - 1).trim()}…`;
}

/**
 * Meta description della scheda carta, 120–158 caratteri: l'attacco per tipo ("Merlin, Neutral Legendary unit in
 * Origins TCG by Koin Games: 5 mana, 5/5."), poi il testo della carta nella lingua della pagina, poi, se la frase è
 * ancora corta, l'origine della leggenda e infine la riga su che cosa c'è nella pagina. `all` è il database carte:
 * serve a dire chi crea le carte create.
 */
export function cardDescription(card: TitleCard, locale: Locale, all: readonly TitleCard[]): string {
  const w = descWords[locale];
  const creators = creatorsOf(card, all)
    .slice(0, 2)
    .map((c) => c.name)
    .join(w.and);
  const head: Head = {
    name: `${card.name}${card.formerName ? w.former(card.formerName) : ""}`,
    align: card.alignment ? alignWord[card.alignment] : "",
    legendary: Boolean(card.legendary),
    spell: card.type === "spell",
    stats: w.stats(card.mana, card.power, card.health),
    creators: creators || undefined,
  };
  const lead = card.status === "removed" ? w.removed(head) : card.type === "token" ? w.created(head) : w.active(head);
  // Senza allineamento resterebbe un doppio spazio: il database oggi lo ha per tutte le carte, ma non costa niente.
  let out = lead.replace(/ {2,}/g, " ").trim();
  const add = (piece: string) => {
    if (!piece || out.length >= CARD_DESC_MIN) return;
    const room = CARD_DESC_MAX - out.length - 1;
    // Sotto i 24 caratteri resterebbe un moncone: meglio fermarsi.
    if (room >= 24) out += ` ${cut(piece, room)}`;
  };
  const ability = card.ability?.[locale] ?? card.ability?.en;
  add(ability ? oneLine(ability) : "");
  // Dopo il testo, se la frase è ancora corta: l'origine della leggenda se ci sta intera, altrimenti la riga su che
  // cosa c'è nella pagina (lunga o corta) se ci sta intera e basta ad arrivare a 120, e solo in ultimo l'origine
  // tagliata. Una frase intera si legge meglio di un pezzo con i puntini.
  const origin = card.origin?.[locale] ? oneLine(card.origin[locale]) : "";
  const room = CARD_DESC_MAX - out.length - 1;
  const next =
    origin && origin.length <= room ? origin : ([w.tail, w.shortTail].find((p) => p.length <= room && out.length + 1 + p.length >= CARD_DESC_MIN) ?? origin);
  add(next);
  // La riga sulla pagina una volta sola: solo se prima è andata l'origine e la frase è ancora corta
  if (next === origin) add(w.shortTail);
  return out;
}

// ---------- Mazzi della community ----------

/**
 * Il title di un mazzo non contiene "Origins TCG": `pageTitle` gli aggiunge " · Origins TCG" (14 caratteri), quindi
 * il title nudo deve stare entro 46 perché quello finale resti entro 60.
 */
export const DECK_TITLE_MAX = CARD_TITLE_MAX - " · Origins TCG".length;

const deckTitles: Record<Locale, { with: (legendary: string, name: string) => string; only: (legendary: string) => string }> = {
  en: { with: (l, n) => `${l} deck: ${n}`, only: (l) => `${l} deck` },
  it: { with: (l, n) => `Mazzo di ${l}: ${n}`, only: (l) => `Mazzo di ${l}` },
  es: { with: (l, n) => `Mazo de ${l}: ${n}`, only: (l) => `Mazo de ${l}` },
};

/**
 * Title di un mazzo della community: "Merlin deck: Spellcast", "Mazzo di Merlin: Spellcast", "Mazo de Merlin: Spellcast".
 * Chi cerca un mazzo scrive il nome della Leggendaria, non quello inventato dall'autore; il nome dell'autore non va
 * mai nel title (regola del 16/09/2026). Il nome del mazzo lo sceglie l'utente e può essere lungo quanto vuole: come
 * in `pageTitleWith`, si accorcia lui all'ultima parola intera e la Leggendaria resta sempre; se non resta spazio
 * utile per il nome, il title è la sola Leggendaria ("Three Not So Little Pigs deck"). Senza Leggendaria nota resta
 * il nome del mazzo. Un mazzo che si chiama come la sua Leggendaria non la ripete ("Merlin deck", non "Merlin deck: Merlin").
 */
export function deckTitle(name: string, legendary: string | undefined, locale: Locale): string {
  const n = name.replace(/\s+/g, " ").trim();
  const l = legendary?.replace(/\s+/g, " ").trim();
  const t = deckTitles[locale];
  // Leggendaria assente, o scritta a mano dall'utente e lunghissima: resta il nome del mazzo
  if (!l || t.only(l).length > DECK_TITLE_MAX) return shorten(n, DECK_TITLE_MAX) || hardCut(n, DECK_TITLE_MAX);
  if (!n || n.toLowerCase() === l.toLowerCase()) return t.only(l);
  const full = t.with(l, n);
  if (full.length <= DECK_TITLE_MAX) return full;
  const short = shorten(n, DECK_TITLE_MAX - t.with(l, "").length);
  return short ? t.with(l, short) : t.only(l);
}

/**
 * Prima frase della description di un mazzo: Leggendaria, "Origins TCG", nome, autore (una volta sola) e archetipo.
 * Dell'etichetta d'archetipo si tiene la parte prima della barra ("Swarm / go wide" → "Swarm"): nelle frasi la
 * spiegazione fra barre pesa e non aggiunge niente.
 */
export function deckLead(deck: { name: string; legendary?: string; author: string; archetype: string }, locale: Locale): string {
  const arch = deck.archetype.split(" / ")[0].trim();
  const name = deck.name.replace(/\s+/g, " ").trim();
  const l = deck.legendary;
  if (locale === "it") return `${l ? `Mazzo di ${l} per Origins TCG` : "Mazzo di Origins TCG"}: ${name} di ${deck.author}, archetipo ${arch}.`;
  if (locale === "es") return `${l ? `Mazo de ${l} para Origins TCG` : "Mazo de Origins TCG"}: ${name} de ${deck.author}, arquetipo ${arch}.`;
  return `${l ? `${l} deck for Origins TCG` : "Origins TCG deck"}: ${name} by ${deck.author}, ${arch} archetype.`;
}
