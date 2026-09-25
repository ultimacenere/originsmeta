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
export type TitleCard = Pick<Card, "slug" | "name" | "type" | "status" | "legendary" | "formerName" | "mana" | "power" | "health" | "alignment" | "ability" | "origin" | "history">;

/**
 * Da quando vale il testo delle carte nei nostri dati, per capire se una modifica dello storico lo ha superato
 * (`textOutdated`). I valori sono quelli di `cards.ts` (li raccoglie `cardTextSource` in `cardDates.ts`) e arrivano
 * da fuori perché questo modulo importa solo tipi.
 */
export type TextSource = {
  /** giorno di uscita di ogni patch */
  dates: Readonly<Record<string, string>>;
  /** giorno della verifica sul gioco (`cardsVerified.date`): vale per le carte della collezione della demo */
  verified: string;
};

/**
 * Il testo della carta nei nostri dati è superato da una modifica dello storico? Contano le sole modifiche del testo
 * (senza statistiche prima/dopo, senza allineamento e senza modifiche ai mazzi: per esempio il danno di una magia, che
 * sta nel testo):
 * - carte della collezione della demo (attive e non create): il testo è stato letto nel gioco (`verified`), quindi
 *   conta solo una patch uscita dopo quel giorno;
 * - carte create e rimosse: non stanno nella collezione, quindi nessuno le ha rilette nel gioco, e il testo importato
 *   da World of Origins non segue sempre le patch, nemmeno quelle uscite prima dell'import: conta qualunque modifica
 *   del testo nello storico.
 * Esempio: Silver Bullet, carta creata, nel database dice ancora "Deal 3 damage to ANY character." anche se la 0.6.2,
 * uscita prima dell'import della 0.6.3, ha portato il danno a 1 (e la patch della demo del 21/09/2026 le fa colpire
 * anche le barriere). Il testo resta sulla scheda, con lo storico sotto; la description e i dati strutturati non lo citano.
 */
export function textOutdated(card: Pick<Card, "status" | "type" | "history">, src: TextSource): boolean {
  const inCollection = card.status === "active" && card.type !== "token";
  return card.history.some((h) => {
    if (h.kind === "deck" || (h.from && h.to) || h.alignment) return false;
    return inCollection ? (src.dates[h.patch] ?? "") > src.verified : true;
  });
}

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
    created: "carta generata di Origins TCG",
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
  return `${fitName(card.name, CARD_TITLE_MAX - ": Origins TCG".length)}: Origins TCG`;
}

/** Etichette di allineamento: restano in inglese in tutte le lingue, come sulla carta (docs/testi-di-gioco.md). */
const alignWord = { good: "Good", evil: "Evil", neutral: "Neutral" } as const;

type Head = {
  /** nome, con il nome precedente fra parentesi quando c'è */
  name: string;
  align: string;
  legendary: boolean;
  /** magia (le carte create non lo dicono: si chiamano "carta generata" / "carta creada") */
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
        ? `${h.name}, carta ${h.align} generata da ${h.creators} in Origins TCG (Koin Games): ${h.stats}.`
        : `${h.name}, carta generata ${h.align} di Origins TCG (Koin Games): ${h.stats}.`,
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
 * Chi crea una carta creata: le carte il cui testo la nomina (anche al plurale, "three Pumpkins"), in una qualsiasi
 * delle tre lingue, perché i nomi delle carte restano in inglese anche nei testi ufficiali italiani e spagnoli e a
 * volte solo lì il nome è giusto (Van Helsing's Tools in inglese dice "Silver Bolt", in italiano e spagnolo "Silver
 * Bullet"). Fra più fonti restano quelle nella demo, quando ce ne sono. Un nome contenuto in uno più lungo ("Little
 * Pig" in "Not So Little Pig") non conta dentro il nome più lungo.
 * Il campo `related` di World of Origins non basta (e dal 25/09/2026 il sito non lo legge più): vuol dire "citata da",
 * a volte salta un passaggio (Garlic risulta da Van Helsing, ma la gioca Van Helsing's Tools) e su Reflection, Off With
 * Your Head! e Little Pig nessun testo di carta dice chi le crea. Se nessun testo la nomina, la risposta è vuota: la
 * description allora non nomina nessuno, invece di dare per creatrice una carta che la cita soltanto.
 */
export function creatorsOf(card: TitleCard, all: readonly TitleCard[]): TitleCard[] {
  if (card.type !== "token") return [];
  const name = plain(card.name);
  const longer = all.map((c) => plain(c.name)).filter((n) => n.length > name.length && n.includes(name));
  const re = new RegExp(`(?<!\\p{L})${escapeRe(name)}(?:e?s)?(?!\\p{L})`, "u");
  const mentions = (c: TitleCard) =>
    (["en", "it", "es"] as const).some((l) => {
      let text = plain(c.ability?.[l] ?? "");
      for (const n of longer) text = text.split(n).join(" ");
      return re.test(text);
    });
  const found = all.filter((c) => c.slug !== card.slug && mentions(c));
  const inDemo = found.filter((c) => c.status === "active");
  return inDemo.length ? inDemo : found;
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
 * Indice dell'ultima fine di frase entro `max` caratteri (il punto compreso), -1 se non ce n'è: un punto seguito da
 * uno spazio o in fondo al testo, ma non quello di un'abbreviazione ("Dr. Frank", "St. George").
 */
function lastSentenceEnd(text: string, max: number): number {
  const within = text.slice(0, max + 1);
  let end = -1;
  for (const m of within.matchAll(/[.!?](?= |$)/g)) if (m.index < max && !/\b(?:Dr|Mr|Mrs|Ms|St)$/.test(within.slice(0, m.index))) end = m.index;
  return end;
}

/** Il testo intero se ci sta, altrimenti le sue prime frasi intere entro `max` caratteri; "" se non ci sta neanche la prima. */
function wholeSentences(text: string, max: number): string {
  if (text.length <= max) return text;
  const end = lastSentenceEnd(text, max);
  return end >= 0 ? text.slice(0, end + 1) : "";
}

/**
 * Parole vuote da non lasciare prima dell'ellissi ("…devuélvelo a la…", "…but on…"): un testo tagliato che finisce con
 * un articolo o una preposizione sembra dire altro. Un solo elenco per le tre lingue, tanto i nomi delle carte non ci
 * finiscono mai.
 */
const stopWords = new Set(
  (
    "a an the of to in on at by for with from and or but if when your my its their this that these those " +
    "il lo la i gli le un uno una di del dello della dei degli delle da dal dalla dai al allo alla ai agli alle nel nello nella nei " +
    "con su sul sulla per e o ma se si che quando tuo tua tuoi tue suo sua suoi sue questo questa questi queste quel quella " +
    "el los las unos unas de del al en con por para y o pero si se que cuando tu tus su sus este esta estos estas ese esa"
  ).split(" "),
);

/**
 * Taglio entro `max` caratteri: alla fine dell'ultima frase intera, se ne resta abbastanza (meglio "…by my ⚔️." che
 * "…by my ⚔️. If…"), altrimenti a parola intera con l'ellissi (compresa nel conto), senza lasciare in fondo una parola
 * vuota. Non lascia a metà una coppia surrogata (emoji fuori dal piano base).
 */
function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const sentence = lastSentenceEnd(text, max);
  if (sentence + 1 >= max * 0.6) return text.slice(0, sentence + 1);
  let hard = text.slice(0, max - 1);
  if (/[\uD800-\uDBFF]$/.test(hard)) hard = hard.slice(0, -1);
  // Una parola spezzata ("bonificacione…") non si legge: si taglia di netto solo un testo senza spazi.
  const space = hard.lastIndexOf(" ");
  if (space <= 0) return `${hard.replace(/[\s,.;:·—–-]+$/, "")}…`;
  return `${withoutDanglers(hard.slice(0, space)).replace(/[\s,.;:·—–-]+$/, "")}…`;
}

/** Toglie dalla fine le parole vuote, lasciando almeno la prima parola. */
function withoutDanglers(text: string): string {
  const words = text.split(" ");
  while (words.length > 1 && stopWords.has(words[words.length - 1].toLowerCase())) words.pop();
  return words.join(" ");
}

/**
 * Nome accorciato entro `max` caratteri, ellissi compresa: all'ultimo confine di parola (spazio, trattino o barra,
 * così "The Trick-or-Treat Legion" può diventare "The Trick-or-Treat…"), senza lasciare in fondo una parola vuota
 * ("Zombie rush for…", non "Zombie rush for the…", e "…-Zombies…", non "…-Zombies-and…"), e solo se non c'è nessun
 * confine con un taglio netto. Resta sempre almeno la prima parola quando ci sta.
 */
function fitName(name: string, max: number): string {
  if (name.length <= max) return name;
  for (let i = Math.min(max - 1, name.length - 1); i > 0; i--) {
    if (!/[\s\-/]/.test(name[i])) continue;
    const kept = withoutDanglers(name.slice(0, i).trim()).replace(/[\s,.;:·—–\-/]+$/, "");
    // Una parola vuota attaccata col trattino o la barra ("Zombies-and") si toglie al confine prima
    const last = kept.split(/[\s\-/]/).pop() ?? "";
    if (kept && (kept === last || !stopWords.has(last.toLowerCase()))) return `${kept}…`;
  }
  return `${name.slice(0, max - 1).trim()}…`;
}

/**
 * Compone la description dai pezzi, entro 120–158 caratteri, preferendo i pezzi interi a quelli tagliati.
 * - Se il testo della carta ci sta intero, o almeno con le sue prime frasi intere, va sempre, anche quando l'attacco
 *   arriva già a 120 (è la cosa più utile dello snippet); poi, se la frase è ancora corta, l'origine della leggenda
 *   intera, o tagliata se intera non ci sta, e la riga su che cosa c'è nella pagina.
 * - Se non ci sta neanche la sua prima frase: prima l'origine intera al suo posto; poi il testo tagliato, che finisce
 *   con i puntini e senza parole vuote; poi l'origine tagliata; in ultimo la sola riga sulla pagina.
 */
function compose(lead: string, ability: string, origin: string, tails: readonly string[]): string {
  const room = (s: string) => CARD_DESC_MAX - s.length - 1;
  const add = (s: string, piece: string) => (piece ? `${s} ${piece}` : s);
  // Pezzo tagliato solo se ne resta abbastanza: sotto i 24 caratteri sarebbe un moncone ("Duplica todas…").
  const addCut = (s: string, piece: string) => {
    const kept = piece ? cut(piece, room(s)) : "";
    return kept.length >= 24 ? add(s, kept) : s;
  };
  // La riga sulla pagina una volta sola: la prima che ci sta e basta ad arrivare a 120, altrimenti la prima che ci sta.
  const withTail = (s: string) => {
    if (s.length >= CARD_DESC_MIN) return s;
    const fitting = tails.filter((p) => p.length <= room(s));
    return add(s, fitting.find((p) => s.length + 1 + p.length >= CARD_DESC_MIN) ?? fitting[0] ?? "");
  };
  const withOrigin = (s: string) => (s.length < CARD_DESC_MIN && origin && origin.length <= room(s) ? add(s, origin) : s);

  const text = add(lead, wholeSentences(ability, room(lead)));
  const options: string[] = [];
  if (!ability || text !== lead) options.push(withTail(withOrigin(text)), withTail(addCut(text, origin)));
  else {
    if (withOrigin(lead) !== lead) options.push(withTail(withOrigin(lead)));
    options.push(withTail(withOrigin(addCut(lead, ability))), withTail(addCut(lead, origin)), withTail(lead));
  }
  return options.find((o) => o.length >= CARD_DESC_MIN) ?? options[0];
}

/**
 * Meta description della scheda carta, 120–158 caratteri: l'attacco per tipo ("Merlin, Neutral Legendary unit in
 * Origins TCG by Koin Games: 5 mana, 5/5."), poi il testo della carta nella lingua della pagina, poi, se la frase è
 * ancora corta, l'origine della leggenda e infine la riga su che cosa c'è nella pagina (`compose`). `all` è il
 * database carte: serve a dire chi crea le carte create. Un testo superato da una patch (`textOutdated`, con `src`)
 * non si cita: restano gli altri pezzi (tipo, chi crea la carta, stato, statistiche, origine).
 */
export function cardDescription(card: TitleCard, locale: Locale, all: readonly TitleCard[], src: TextSource): string {
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
  const ability = textOutdated(card, src) ? undefined : (card.ability?.[locale] ?? card.ability?.en);
  const origin = card.origin?.[locale];
  return compose(lead.replace(/ {2,}/g, " ").trim(), ability ? oneLine(ability) : "", origin ? oneLine(origin) : "", [w.tail, w.shortTail]);
}

// ---------- Mazzi della community ----------

/**
 * Un title di mazzo senza "Origins TCG" riceve da `pageTitle` " · Origins TCG" (14 caratteri), quindi il title nudo
 * deve stare entro 46 perché quello finale resti entro 60. Un title che contiene già "Origins TCG" (le forme `named`
 * e `namedWord` in italiano e spagnolo) deve starci da solo, entro 60.
 */
export const DECK_TITLE_MAX = CARD_TITLE_MAX - " · Origins TCG".length;

/**
 * Modelli dei title dei mazzi, con il nome del mazzo in testa (mappa delle query, §3 e C34):
 * - `with`: nome e Leggendaria ("Spellcast, Merlin deck");
 * - `only`: il mazzo senza nome proprio, o con il nome uguale alla Leggendaria ("Merlin deck");
 * - `named`: il nome contiene già la Leggendaria e non la ripete. In inglese basta "deck" ("Dorothy Combo deck"); in
 *   italiano e spagnolo "Dorothy Combo, mazzo" non si legge, quindi al posto della Leggendaria va il gioco ("Dorothy
 *   Combo, mazzo di Origins TCG"), così le tre lingue restano diverse.
 * - `withWord` e `namedWord`: le stesse due forme quando il nome contiene già la parola "mazzo" della lingua
 *   (`word`): gli utenti chiamano spesso i mazzi "Merlin Deck" o "Mazzo Merlin", e "Merlin Deck deck" o "Mazzo
 *   Merlin, mazzo di…" ripetono la parola. Diventano "Spellcast Deck with Merlin", "Mazzo Spellcast con Merlin" e, per
 *   un nome che contiene anche la Leggendaria, "Merlin Deck" (in inglese il solo nome) o "Mazzo Merlin per Origins TCG".
 *   La parola conta solo nella lingua della pagina: "Spellcast Deck, mazzo di Merlin" non ripete niente.
 */
const deckTitles: Record<
  Locale,
  {
    with: (legendary: string, name: string) => string;
    only: (legendary: string) => string;
    named: (name: string) => string;
    word: RegExp;
    withWord: (legendary: string, name: string) => string;
    namedWord: (name: string) => string;
  }
> = {
  en: {
    with: (l, n) => `${n}, ${l} deck`,
    only: (l) => `${l} deck`,
    named: (n) => `${n} deck`,
    word: /(?<!\p{L})decks?(?!\p{L})/iu,
    withWord: (l, n) => `${n} with ${l}`,
    namedWord: (n) => n,
  },
  it: {
    with: (l, n) => `${n}, mazzo di ${l}`,
    only: (l) => `Mazzo di ${l}`,
    named: (n) => `${n}, mazzo di Origins TCG`,
    word: /(?<!\p{L})mazz[oi](?!\p{L})/iu,
    withWord: (l, n) => `${n} con ${l}`,
    namedWord: (n) => `${n} per Origins TCG`,
  },
  es: {
    with: (l, n) => `${n}, mazo de ${l}`,
    only: (l) => `Mazo de ${l}`,
    named: (n) => `${n}, mazo de Origins TCG`,
    word: /(?<!\p{L})mazos?(?!\p{L})/iu,
    withWord: (l, n) => `${n} con ${l}`,
    namedWord: (n) => `${n} para Origins TCG`,
  },
};

/**
 * Title di un mazzo della community: "Spellcast, Merlin deck", "Spellcast, mazzo di Merlin", "Spellcast, mazo de Merlin".
 * Il nome del mazzo sta in testa perché la scheda del mazzo risponde alla ricerca del suo nome, mentre "{Leggendaria}
 * deck" è la ricerca della guida al mazzo (mappa delle query, decisione 4, C22 e C34). Il piano dell'Ondata 1 metteva
 * invece la Leggendaria in testa ("Merlin deck: Spellcast"): così scheda del mazzo, guida e pagina dei matchup si contendevano
 * la stessa ricerca, e il 25/09/2026, dopo la revisione, si è deciso che vale la mappa. Il nome dell'autore non va mai
 * nel title (regola del 16/09/2026).
 * Il nome lo sceglie l'utente e può essere lungo quanto vuole: come in `pageTitleWith`, prima si sacrifica il contorno
 * e solo dopo il nome, che resta sempre (almeno la sua prima parola):
 * 1. il modello con la Leggendaria, se ci sta;
 * 2. altrimenti il solo nome ("3 Pigs Mid Range": uguale nelle tre lingue, ma ogni pagina ha l'hreflang giusto);
 * 3. altrimenti il nome accorciato all'ultima parola intera, con i puntini ("The Trick-or-Treat Legion of Halloween…").
 * Un nome che contiene già la Leggendaria non la ripete (`named`), uno che contiene già la parola "mazzo" della
 * lingua non la ripete (`withWord`, `namedWord`); uno uguale alla Leggendaria, o nessun nome, dà "Merlin deck". Senza
 * Leggendaria nota resta il nome del mazzo.
 */
export function deckTitle(name: string, legendary: string | undefined, locale: Locale): string {
  const n = name.replace(/\s+/g, " ").trim();
  const l = legendary?.replace(/\s+/g, " ").trim();
  const t = deckTitles[locale];
  // Lo stesso conto di `pageTitle`: con "Origins TCG" dentro il title deve stare da solo entro 60, senza entro 46.
  const fits = (s: string) => s.length <= (/origins tcg|originsmeta/i.test(s) ? CARD_TITLE_MAX : DECK_TITLE_MAX);
  const orName = (title: string) => [title, n].find(fits) ?? fitName(n, DECK_TITLE_MAX);
  if (!l) return fitName(n, DECK_TITLE_MAX);
  // Nessun nome, o uguale alla Leggendaria; una Leggendaria scritta a mano e lunghissima si accorcia come un nome
  if (!n || n.toLowerCase() === l.toLowerCase()) return fits(t.only(l)) ? t.only(l) : fitName(l, DECK_TITLE_MAX);
  const worded = t.word.test(n);
  if (new RegExp(`(?<!\\p{L})${escapeRe(l)}(?!\\p{L})`, "iu").test(n)) return orName(worded ? t.namedWord(n) : t.named(n));
  return orName(worded ? t.withWord(l, n) : t.with(l, n));
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

/**
 * Coda della description di un mazzo quando i soli fatti non arrivano a 120 caratteri: la riga del dizionario
 * (`community.metaTail`, "Full list, charts and the game's deck code on OriginsMeta.") se ci sta intera, altrimenti
 * questa più corta, altrimenti niente. Una coda tagliata a metà ("…deck code on…") non dice niente.
 */
export const deckShortTail: Record<Locale, string> = {
  en: "Full list on OriginsMeta.",
  it: "Lista completa su OriginsMeta.",
  es: "Lista completa en OriginsMeta.",
};
