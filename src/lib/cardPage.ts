import { formatDate, type Locale } from "./i18n";
import { activeCards, cardsVerified, patchLabel, patchOrder, patches, type Card, type Change, type PatchId } from "./data/cards";
import cardArt from "./data/card-art.json";
import type { RelCard } from "./cardSynergy";

/**
 * Testi della scheda carta costruiti dai dati, nelle tre lingue (Ondata 2 del piano SEO/GEO, 25/09/2026: CARDS-05,
 * GEO-07, SCHEDE-06, SCHEDE-07, SCHEDE-10, SCHEDE-11, CARDS-09, CARDS-14, CARDS-16).
 *
 * - `cardLead`: la frase d'attacco sotto l'H1, che dice che cos'è la carta (tipo, costo, statistiche, allineamento,
 *   stato, mazzi pubblicati) senza nessun giudizio; per le carte create la prima cosa è chi le genera, per quelle
 *   rimosse che non sono nella Demo 2.0 e quindi non entrano nel deck builder.
 * - `cardBrief`: il riquadro "In breve", 2–3 domande e risposte ricavate dai dati. Solo testo visibile: niente
 *   FAQPage, perché Google non mostra più i rich result FAQ dal 7 maggio 2026 (SCHEDE-10). Ogni risposta dice una cosa
 *   che la frase d'attacco non dice già (revisione del 25/09/2026, TECH-04: niente blocchi ripetuti a modello).
 * - `cardLabels`: le etichette nuove della scheda (sezioni, testi del gioco e traduzioni, alt dell'illustrazione…).
 *   Stanno qui e non nei dizionari, come `linkLabels.ts` e `tierLabels.ts`; `en` è il tipo di riferimento.
 *
 * Le frasi sono fatte di pezzi (`Part`): testo e riferimenti a carte o pagine, che la scheda rende come link.
 * Termini di gioco dal glossario ufficiale (docs/testi-di-gioco.md, docs/spagnolo.md): unità/magia/carta generata,
 * unidad/hechizo/carta creada, Potenza/Salute, Poder/Salud; allineamenti Good/Evil/Neutral in inglese come sulla
 * carta; nomi di carte in inglese. Nessun dato nuovo: tutto viene da `cards.ts`, dai mazzi pubblicati e dai testi.
 * Dove compare una patch si usa `patchLabel`, mai l'id (CLAUDE.md).
 * Funzioni pure (a parte `formatDate`, che usa Intl): test in `cardPage.test.ts`.
 */

/** Un pezzo di frase: testo, una carta (diventa il link alla sua scheda) o una pagina (percorso senza lingua). */
export type Part = string | { card: string; text: string } | { path: string; text: string };

/** Il testo di una frase fatta di pezzi, senza link: per i test, per il JSON-LD e per chi deve contare i caratteri. */
export function partsText(parts: readonly Part[]): string {
  return parts.map((p) => (typeof p === "string" ? p : p.text)).join("");
}

/** I campi della carta che servono alle frasi. */
export type LeadCard = Pick<Card, "slug" | "name" | "type" | "status" | "legendary" | "mana" | "power" | "health" | "alignment" | "formerName" | "history">;

/** Conto dei mazzi pubblicati: in quanti c'è la carta (`n`) su quanti (`total`). */
export type DeckCount = { n: number; total: number };

/** Una carta spesso nello stesso mazzo (`companions` di cardSynergy.ts), con nome e tipo per le frasi. */
export type BriefCompanion = { card: Pick<Card, "slug" | "name" | "legendary">; together: number };

/** I fatti che la scheda passa alle frasi, oltre alla carta. */
export type CardFacts = {
  /** assente se la lettura dei mazzi non è riuscita: allora le frasi non dicono niente sui mazzi, invece di dire zero */
  decks?: DeckCount;
  /** carte presenti in almeno 2 dei mazzi della carta (solo carte della demo): la terza domanda di "In breve" */
  companions?: readonly BriefCompanion[];
  /** chi genera la carta, a ritroso (`creationChain`), solo per le carte create */
  createdBy: readonly RelCard[][];
  /** carte fuori dalla demo che la generavano (`earlierCreators`) */
  createdByEarlier: readonly RelCard[];
  /** che cosa genera (`createdChain`) */
  creates: readonly RelCard[][];
  /** collegate da World of Origins senza un testo che lo spieghi (`linkedCards`) */
  linked: readonly RelCard[];
};

// ---------- Aiuti di lingua ----------

const cardRef = (c: { slug: string; name: string }): Part => ({ card: c.slug, text: c.name });

/**
 * Elenco con virgole e congiunzione finale ("A, B and C"), fatto di pezzi. Un elemento può essere un gruppo di pezzi
 * ("Koschei (in 2 su 3)"): la congiunzione guarda il primo.
 */
function listParts(items: readonly (Part | readonly Part[])[], and: (next: string) => string): Part[] {
  const out: Part[] = [];
  items.forEach((item, i) => {
    const group = (Array.isArray(item) ? item : [item]) as readonly Part[];
    if (i > 0) out.push(i === items.length - 1 ? and(partsText(group.slice(0, 1))) : ", ");
    out.push(...group);
  });
  return out;
}

const andWord: Record<Locale, (next: string) => string> = {
  en: () => " and ",
  it: () => " e ",
  // "y" diventa "e" davanti a un suono "i" ("e Imhotep"), non davanti a "hie-" / "ya"
  es: (next) => (/^h?i(?![aeiouáéíóú])/i.test(next) ? " e " : " y "),
};

const orWord: Record<Locale, (next: string) => string> = {
  en: () => " or ",
  it: () => " o ",
  // "o" diventa "u" davanti a un suono "o" ("u Old MacDonald")
  es: (next) => (/^h?o/i.test(next) ? " u " : " o "),
};

/** Le carte come pezzi, unite con "e": Animate Object and Sorcerer's Apprentice. */
export function cardList(cards: readonly { slug: string; name: string }[], locale: Locale, or = false): Part[] {
  return listParts(cards.map(cardRef), (or ? orWord : andWord)[locale]);
}

/**
 * Articolo determinativo plurale davanti a un numero in cifre: "dei 16", ma "degli 11" e "degli 8" (si legge undici,
 * otto). Vale per 8…, 11, 11.000 e così via: le cifre si leggono come parole.
 */
export function itDei(n: number): string {
  const s = String(n);
  return /^8/.test(s) || /^11(?:\d{3})*$/.test(s) ? "degli" : "dei";
}

/** Come `itDei`, con "in": "nei 16", "negli 8". */
export function itNei(n: number): string {
  return itDei(n) === "degli" ? "negli" : "nei";
}

/** Maiuscola alla prima lettera. */
function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Allineamento come sulla carta: Good, Evil, Neutral restano in inglese in tutte le lingue. */
const alignWord = { good: "Good", evil: "Evil", neutral: "Neutral" } as const;

/** In spagnolo "hechizo" è maschile: cambiano articolo, aggettivi e pronome. */
const esMasculine = (c: Pick<Card, "type">) => c.type === "spell";

/**
 * Il nome di una patch da mostrare: `patchLabel` quando la patch è fra quelle del sito ("Demo · 21 set" per
 * demo-0921), altrimenti il valore com'è (per esempio la patch dichiarata da World of Origins, se non la conosciamo).
 */
function patchName(id: string, locale: Locale): string {
  return (patchOrder as readonly string[]).includes(id) ? patchLabel(id as PatchId, locale) : id;
}

// ---------- Etichette ----------

const en = {
  /** titolo delle sezioni dei mazzi: per le Leggendarie "guidati da" (SCHEDE-02, COMP-03) */
  decksLed: "Decks led by {name}",
  decksWith: "Decks with {name}",
  /** carte create: i mazzi con la carta che le genera */
  decksCreating: "Decks that create {name}",
  /** carte create: solo il conto, con il link alla sezione dei mazzi della carta che le genera */
  tokenDecksOne: "1 published deck includes {roots}.",
  tokenDecksMany: "{n} published decks include {roots}.",
  /** sotto il titolo della sezione dei mazzi: ordine e che cosa vuol dire il conto (il conto sta nella frase d'attacco) */
  decksNote: "Decks with votes first, by rating, then the newest. How often a card is played is popularity, not a win rate:",
  mostPlayed: "Most played cards",
  /** mazzi non linkati qui (pagina non indicizzabile in questa lingua, o oltre il tetto dell'elenco) */
  moreDecksOne: "1 more deck with this card is in the list of all decks.",
  moreDecksMany: "{n} more decks with this card are in the list of all decks.",
  allDecks: "All decks",
  together: "Often in the same deck",
  togetherIntroLed: "Cards found in at least {min} of the {n} decks led by {name}.",
  togetherIntro: "Cards found with {name} in at least {min} of its {n} published decks.",
  /** "{k} su {n}" accanto a ogni carta */
  togetherCount: "in {k} of {n}",
  creates: "Cards it creates",
  /** carte rimosse: al passato */
  createdPast: "Cards it created",
  createsIntro: "From its card text.",
  createsNextOne: "In turn, {name} creates",
  createsNextMany: "In turn, these create",
  howToGet: "How you get it",
  createdBy: "Created by",
  createdByNext: "which is created by",
  createdByEarlier: "In earlier builds, also by",
  noCreator: "No card text says which card creates it.",
  linkedBy: "World of Origins links it to",
  linked: "Related cards (World of Origins)",
  linkedIntro: "Links from the World of Origins community database: no card text explains them.",
  brief: "In brief",
  /** etichette dei testi della carta (SCHEDE-07, CARDS-14) */
  textOfficial: "Official game text",
  textEnglish: "English game text",
  /** carte create e rimosse sulle pagine italiane e spagnole: l'inglese non è verificabile nel gioco */
  textEnglishWoo: "English text (World of Origins)",
  textOurs: "OriginsMeta translation (game glossary)",
  textWoo: "Card text (World of Origins)",
  textOutdated: "A later patch changed this text: see the balance history below.",
  /** riga sotto le statistiche, per le carte che la collezione della demo non mostra (CARDS-09) */
  asOfToken:
    "Created card: it is not in the game's collection, so it was not checked in the game. Card data from the World of Origins community database (import of {date}), balance notes from the official patch notes.",
  asOfRemoved: "Not in Demo 2.0: last known data from the World of Origins community database (based on patch {patch}); it cannot be checked in the game.",
  /** tra parentesi nella riga della fonte, al posto del solo "(Patch 0.6.3)" */
  sourceImport: "import of {date}, based on patch {patch}",
  sourceLater: "; patch {patch} applied from the official notes",
  /** tier list della community sulla scheda (SCHEDE-11) */
  community: "Community tier list",
  communityScoreOne: "Tier {tier}: average {avg} out of 5 from 1 vote.",
  communityScore: "Tier {tier}: average {avg} out of 5 from {votes} votes.",
  communityUnranked: "No saved tier list has ranked it yet.",
  communityInvite: "Rank {name} in your own tier list: the community tier list starts at {min} lists",
  communitySoFar: " ({n} so far)",
  communityCta: "Make your tier list",
  communityOpen: "Open the community tier list",
  deckGuide: "Deck guide",
  sameSagaDemo: "Same saga in Demo 2.0",
  /** carte create: al posto dell'invito al deck builder, che non le accetta (SCHEDE-04) */
  buildRoot: "Build a deck with {roots}",
  buildRootText: "{name} is a created card and cannot be added to a deck in the deck builder: to see it in a match, put {roots} in your deck.",
  legendaryPower: "Legendary power",
  /** alt della carta ufficiale (CARDS-16): nome, tipo, gioco, illustratore e diritti */
  alt: "{name}, {kind}: official Origins TCG card, art by {illus}, © Koin Games",
  altNoCredit: "{name}, {kind}: official Origins TCG card, © Koin Games",
  kind: { unit: "unit", spell: "spell", token: "created card", legendaryUnit: "Legendary unit", legendarySpell: "Legendary spell" },
  creditText: "Art by {illus} · © Koin Games",
};

export type CardLabels = typeof en;

export const cardLabels: Record<Locale, CardLabels> = {
  en,
  it: {
    decksLed: "Mazzi guidati da {name}",
    decksWith: "Mazzi con {name}",
    decksCreating: "Mazzi che generano {name}",
    tokenDecksOne: "Un mazzo pubblicato contiene {roots}.",
    tokenDecksMany: "{n} mazzi pubblicati contengono {roots}.",
    decksNote: "Prima i mazzi votati, dal voto più alto, poi i più recenti. Quanto è giocata una carta dice la sua popolarità, non un win rate:",
    mostPlayed: "Le più giocate",
    moreDecksOne: "Un altro mazzo con questa carta è nell'elenco di tutti i mazzi.",
    moreDecksMany: "Altri {n} mazzi con questa carta sono nell'elenco di tutti i mazzi.",
    allDecks: "Tutti i mazzi",
    together: "Spesso nello stesso mazzo",
    togetherIntroLed: "Carte presenti in almeno {min} {dei} {n} mazzi guidati da {name}.",
    // davanti a "suoi" l'articolo è sempre "dei", qualunque sia il numero ("dei suoi 8 mazzi")
    togetherIntro: "Carte presenti insieme a {name} in almeno {min} dei suoi {n} mazzi pubblicati.",
    togetherCount: "in {k} su {n}",
    creates: "Carte che genera",
    createdPast: "Carte che generava",
    createsIntro: "Dal testo della carta.",
    createsNextOne: "A sua volta {name} genera",
    createsNextMany: "A loro volta queste generano",
    howToGet: "Come si ottiene",
    createdBy: "Generata da",
    createdByNext: "a sua volta generata da",
    createdByEarlier: "Nelle build precedenti anche da",
    noCreator: "Nessun testo di carta dice quale carta la genera.",
    linkedBy: "World of Origins la collega a",
    linked: "Carte collegate (World of Origins)",
    linkedIntro: "Collegamenti del database community World of Origins: nessun testo di carta li spiega.",
    brief: "In breve",
    textOfficial: "Testo ufficiale del gioco",
    textEnglish: "Testo inglese del gioco",
    textEnglishWoo: "Testo inglese (World of Origins)",
    textOurs: "Traduzione di OriginsMeta (glossario del gioco)",
    textWoo: "Testo della carta (World of Origins)",
    textOutdated: "Una patch successiva ha cambiato questo testo: vedi lo storico dei bilanciamenti qui sotto.",
    asOfToken:
      "Carta generata: non è nella collezione del gioco, quindi non è stata verificata nel gioco. Dati dal database community World of Origins (import del {date}), note di bilanciamento dalle patch notes ufficiali.",
    asOfRemoved: "Non nella Demo 2.0: ultimi dati noti del database community World of Origins (base patch {patch}); non si può verificare nel gioco.",
    sourceImport: "import del {date}, base patch {patch}",
    sourceLater: "; patch {patch} applicata dalle note ufficiali",
    community: "Tier list della community",
    communityScoreOne: "Fascia {tier}: media {avg} su 5 con 1 voto.",
    communityScore: "Fascia {tier}: media {avg} su 5 con {votes} voti.",
    communityUnranked: "Nessuna tier list salvata l'ha ancora classificata.",
    communityInvite: "Classifica {name} nella tua tier list: la tier list della community parte da {min} liste",
    communitySoFar: " (per ora {n})",
    communityCta: "Crea la tua tier list",
    communityOpen: "Apri la tier list della community",
    deckGuide: "Guida al mazzo",
    sameSagaDemo: "Stessa saga nella Demo 2.0",
    buildRoot: "Costruisci un mazzo con {roots}",
    buildRootText: "{name} è una carta generata e non si può mettere nel mazzo con il deck builder: per vederla in partita, metti {roots} nel tuo mazzo.",
    legendaryPower: "Potere leggendario",
    alt: "{name}, {kind}: carta ufficiale di Origins TCG, illustrazione di {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: carta ufficiale di Origins TCG, © Koin Games",
    kind: { unit: "unità", spell: "magia", token: "carta generata", legendaryUnit: "unità Leggendaria", legendarySpell: "magia Leggendaria" },
    creditText: "Illustrazione di {illus} · © Koin Games",
  },
  es: {
    decksLed: "Mazos liderados por {name}",
    decksWith: "Mazos con {name}",
    decksCreating: "Mazos que crean {name}",
    tokenDecksOne: "Un mazo publicado incluye {roots}.",
    tokenDecksMany: "{n} mazos publicados incluyen {roots}.",
    decksNote: "Primero los mazos votados, de mayor a menor valoración, y luego los más recientes. Cuánto se juega una carta indica su popularidad, no un win rate:",
    mostPlayed: "Las más jugadas",
    moreDecksOne: "Otro mazo con esta carta está en la lista de todos los mazos.",
    moreDecksMany: "Otros {n} mazos con esta carta están en la lista de todos los mazos.",
    allDecks: "Todos los mazos",
    together: "A menudo en el mismo mazo",
    togetherIntroLed: "Cartas que están en al menos {min} de los {n} mazos liderados por {name}.",
    togetherIntro: "Cartas que están con {name} en al menos {min} de sus {n} mazos publicados.",
    togetherCount: "en {k} de {n}",
    creates: "Cartas que crea",
    createdPast: "Cartas que creaba",
    createsIntro: "Según el texto de la carta.",
    createsNextOne: "A su vez, {name} crea",
    createsNextMany: "A su vez, estas crean",
    howToGet: "Cómo se obtiene",
    createdBy: "Creada por",
    createdByNext: "a su vez creada por",
    createdByEarlier: "En builds anteriores, también por",
    noCreator: "Ningún texto de carta dice qué carta la crea.",
    linkedBy: "World of Origins la relaciona con",
    linked: "Cartas relacionadas (World of Origins)",
    linkedIntro: "Relaciones de la base de datos de la comunidad World of Origins: ningún texto de carta las explica.",
    brief: "En resumen",
    textOfficial: "Texto oficial del juego",
    textEnglish: "Texto en inglés del juego",
    textEnglishWoo: "Texto en inglés (World of Origins)",
    textOurs: "Traducción de OriginsMeta (glosario del juego)",
    textWoo: "Texto de la carta (World of Origins)",
    textOutdated: "Un parche posterior cambió este texto: mira el historial de cambios de equilibrio más abajo.",
    asOfToken:
      "Carta creada: no está en la colección del juego, así que no se ha verificado en el juego. Datos de la base de datos de la comunidad World of Origins (importación del {date}), cambios de equilibrio según las notas oficiales de los parches.",
    asOfRemoved: "Fuera de la Demo 2.0: últimos datos conocidos de la base de datos de la comunidad World of Origins (base parche {patch}); no se puede verificar en el juego.",
    sourceImport: "importación del {date}, base parche {patch}",
    sourceLater: "; parche {patch} aplicado según las notas oficiales",
    community: "Tier list de la comunidad",
    communityScoreOne: "Tier {tier}: promedio de {avg} sobre 5 con 1 voto.",
    communityScore: "Tier {tier}: promedio de {avg} sobre 5 con {votes} votos.",
    communityUnranked: "Ninguna tier list guardada la ha clasificado todavía.",
    communityInvite: "Clasifica {name} en tu tier list: la tier list de la comunidad empieza con {min} listas",
    communitySoFar: " ({n} por ahora)",
    communityCta: "Crea tu tier list",
    communityOpen: "Abre la tier list de la comunidad",
    deckGuide: "Guía del mazo",
    sameSagaDemo: "Misma saga en la Demo 2.0",
    buildRoot: "Construye un mazo con {roots}",
    buildRootText: "{name} es una carta creada y no se puede añadir a un mazo en el deck builder: para verla en la partida, pon {roots} en tu mazo.",
    legendaryPower: "Poder legendario",
    alt: "{name}, {kind}: carta oficial de Origins TCG, ilustración de {illus}, © Koin Games",
    altNoCredit: "{name}, {kind}: carta oficial de Origins TCG, © Koin Games",
    kind: { unit: "unidad", spell: "hechizo", token: "carta creada", legendaryUnit: "unidad Legendaria", legendarySpell: "hechizo Legendario" },
    creditText: "Ilustración de {illus} · © Koin Games",
  },
};

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/**
 * Un'etichetta con segnaposto che diventano pezzi (carte, elenchi di carte): "Build a deck with {roots}" con i link.
 * I segnaposto di testo semplice si passano come stringhe.
 */
export function fillParts(template: string, values: Record<string, string | number | Part | readonly Part[]>): Part[] {
  const out: Part[] = [];
  let last = 0;
  for (const m of template.matchAll(/\{(\w+)\}/g)) {
    out.push(template.slice(last, m.index));
    const v = values[m[1]];
    if (v === undefined) out.push(m[0]);
    else if (Array.isArray(v)) out.push(...(v as Part[]));
    else out.push(typeof v === "number" ? String(v) : (v as Part));
    last = m.index + m[0].length;
  }
  out.push(template.slice(last));
  return out.filter((p) => p !== "");
}

/** Tipo della carta in parole, per l'alt e le frasi: "unità Leggendaria", "hechizo", "carta creada". */
export function kindWord(card: Pick<Card, "type" | "legendary">, locale: Locale): string {
  const k = cardLabels[locale].kind;
  if (card.type === "token") return k.token;
  if (card.legendary) return card.type === "spell" ? k.legendarySpell : k.legendaryUnit;
  return card.type === "spell" ? k.spell : k.unit;
}

/**
 * Alt della carta ufficiale (CARDS-16): "Merlin, unità Leggendaria: carta ufficiale di Origins TCG, illustrazione di
 * Don Flores, © Koin Games". L'illustratore è quello stampato sulla carta (`credit.illus`).
 */
export function cardImageAlt(card: Pick<Card, "name" | "type" | "legendary" | "credit">, locale: Locale): string {
  const l = cardLabels[locale];
  const illus = card.credit?.illus;
  return fill(illus ? l.alt : l.altNoCredit, { name: card.name, kind: kindWord(card, locale), illus: illus ?? "" });
}

/**
 * Misure della carta ufficiale intera (`/cards/<slug>.webp`), da `card-art.json`, che le ha scritte `npm run import:art`
 * convertendo i file (480×690, 480×660 o 480×650). Servono a og:image:width/height, che Discord usa per impaginare
 * l'anteprima, e all'ImageObject del JSON-LD. Prima si leggevano dal file con `imageSizeOf`: con la scheda in ISR la
 * rigenerazione gira su Vercel, dove la funzione non ha `public/`, e dopo la prima le misure sparivano.
 */
export function cardImageSize(card: Pick<Card, "key" | "image">): { width: number; height: number } | undefined {
  if (!card.key || !card.image) return undefined;
  const art = (cardArt.art as Record<string, { w?: number; h?: number }>)[card.key];
  return art?.w && art.h ? { width: art.w, height: art.h } : undefined;
}

// ---------- Frase d'attacco ----------

type Tense = "present" | "past";

/** "Costa 5 mana, ha 5 di Potenza e 5 di Salute ed è Neutral." (o al passato, per le carte rimosse). */
function statsClause(card: LeadCard, locale: Locale, tense: Tense): string {
  const { mana: m, power: p, health: h } = card;
  const align = card.alignment ? alignWord[card.alignment] : undefined;
  const past = tense === "past";
  const clauses: string[] = [];
  if (locale === "it") {
    if (m !== undefined) clauses.push(`${past ? "costava" : "costa"} ${m} mana`);
    if (p !== undefined) clauses.push(`${past ? "aveva" : "ha"} ${p} di Potenza e ${h ?? "?"} di Salute`);
    if (align) clauses.push(`${past ? "era" : "è"} ${align}`);
    // "e" davanti a "è" / "era" diventa "ed"
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} ${/^[eè]/.test(c) ? "ed" : "e"} ${c}` : `${acc}, ${c}`), "");
  }
  if (locale === "es") {
    if (m !== undefined) clauses.push(`${past ? "costaba" : "cuesta"} ${m} de maná`);
    if (p !== undefined) clauses.push(`${past ? "tenía" : "tiene"} ${p} de Poder y ${h ?? "?"} de Salud`);
    if (align) clauses.push(`${past ? "era" : "es"} ${align}`);
    return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc} y ${c}` : `${acc}, ${c}`), "");
  }
  if (m !== undefined) clauses.push(`${past ? "cost" : "costs"} ${m} mana`);
  if (p !== undefined) clauses.push(`${past ? "had" : "has"} ${p} Power and ${h ?? "?"} Health`);
  if (align) clauses.push(`${past ? "was" : "is"} ${align}`);
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return clauses.reduce((acc, c, i) => (i === 0 ? c : i === clauses.length - 1 ? `${acc}, and ${c}` : `${acc}, ${c}`), "");
}

/** Frase delle statistiche, con il soggetto: "It costs…", "Costa…", "Cuesta…"; "" se la carta non ha statistiche. */
function statsSentence(card: LeadCard, locale: Locale): string {
  const c = statsClause(card, locale, "present");
  if (!c) return "";
  return locale === "en" ? `It ${c}.` : `${cap(c)}.`;
}

/** "unità Leggendaria" con l'articolo: "un'unità Leggendaria", "un hechizo Legendario", "a Legendary unit". */
function withArticle(card: Pick<Card, "type" | "legendary">, locale: Locale): string {
  const word = kindWord(card, locale);
  if (locale === "it") return card.type === "unit" ? `un'${word}` : `una ${word}`;
  if (locale === "es") return esMasculine(card) ? `un ${word}` : `una ${word}`;
  return `${/^[aeio]/i.test(word) ? "an" : "a"} ${word}`;
}

const gameName: Record<Locale, string> = {
  en: "Origins TCG, the digital card game by Koin Games",
  it: "Origins TCG, il gioco di carte digitale di Koin Games",
  es: "Origins TCG, el juego de cartas digital de Koin Games",
};

/**
 * Una carta creata non si può aggiungere nel deck builder. Non si dice "non va mai in un mazzo": in partita alcune
 * finiscono proprio nel mazzo (Old MacDonald mescola le Pumpkin nel mazzo dell'avversario).
 */
const notInBuilder: Record<Locale, string> = {
  en: "it cannot be added to a deck in the deck builder",
  it: "non si può mettere nel mazzo con il deck builder",
  es: "no se puede añadir a un mazo en el deck builder",
};

/**
 * Frase sui mazzi pubblicati: "Guida 1 dei 16 mazzi pubblicati su OriginsMeta.", "It appears in 9 of the 16 decks
 * published on OriginsMeta.", "Ninguno de los 16 mazos publicados en OriginsMeta la usa todavía.". Per una Leggendaria
 * conta i mazzi che guida, per una carta base quelli che la contengono, come "Le più giocate".
 */
export function deckSentence(card: Pick<Card, "type" | "legendary">, count: DeckCount, locale: Locale): string {
  const { n, total } = count;
  const leg = Boolean(card.legendary);
  if (locale === "it") {
    if (total === 0) return "Su OriginsMeta non ci sono ancora mazzi pubblicati.";
    if (total === 1 && n === 1) return leg ? "Guida l'unico mazzo pubblicato su OriginsMeta." : "È nell'unico mazzo pubblicato su OriginsMeta.";
    if (total === 1) return leg ? "L'unico mazzo pubblicato su OriginsMeta è guidato da un'altra Leggendaria." : "L'unico mazzo pubblicato su OriginsMeta non la usa.";
    if (n === 0) return `Nessuno ${itDei(total)} ${total} mazzi pubblicati su OriginsMeta la usa ancora${leg ? " come Leggendaria" : ""}.`;
    return `${leg ? "Guida" : "È in"} ${n} ${itDei(total)} ${total} mazzi pubblicati su OriginsMeta.`;
  }
  if (locale === "es") {
    const pron = esMasculine(card) ? "lo" : "la";
    if (total === 0) return "Todavía no hay mazos publicados en OriginsMeta.";
    if (total === 1 && n === 1) return leg ? "Lidera el único mazo publicado en OriginsMeta." : "Está en el único mazo publicado en OriginsMeta.";
    if (total === 1) return leg ? "El único mazo publicado en OriginsMeta lo lidera otra Legendaria." : `El único mazo publicado en OriginsMeta no ${pron} usa.`;
    if (n === 0) return `Ninguno de los ${total} mazos publicados en OriginsMeta ${pron} usa todavía${leg ? " como Legendaria" : ""}.`;
    return `${leg ? "Lidera" : "Está en"} ${n} de los ${total} mazos publicados en OriginsMeta.`;
  }
  if (total === 0) return "No deck has been published on OriginsMeta yet.";
  if (total === 1 && n === 1) return leg ? "It leads the only deck published on OriginsMeta." : "It appears in the only deck published on OriginsMeta.";
  if (total === 1) return leg ? "The only deck published on OriginsMeta is led by another Legendary." : "The only deck published on OriginsMeta does not use it.";
  if (n === 0) return `None of the ${total} decks published on OriginsMeta uses it${leg ? " as its Legendary" : ""} yet.`;
  return `It ${leg ? "leads" : "appears in"} ${n} of the ${total} decks published on OriginsMeta.`;
}

/** "Nelle build precedenti si chiamava Puss in Boots.": il vecchio nome è anche una ricerca (CARDS-10). */
function formerSentence(card: LeadCard, locale: Locale): string {
  if (!card.formerName) return "";
  if (locale === "it") return `Nelle build precedenti si chiamava ${card.formerName}.`;
  if (locale === "es") return `En builds anteriores se llamaba ${card.formerName}.`;
  return `In earlier builds it was called ${card.formerName}.`;
}

/** La catena di chi genera una carta creata: "Van Helsing's Tools, a sua volta generata da Van Helsing". */
function chainParts(chain: readonly RelCard[][], locale: Locale): Part[] {
  const [first, second] = chain;
  const out: Part[] = cardList(first, locale);
  // il secondo passaggio solo se il primo è una carta sola: con più carte "a sua volta" non si capirebbe di chi
  if (first.length === 1 && second?.length) {
    const next = { en: ", which is in turn created by ", it: ", a sua volta generata da ", es: ", a su vez creada por " }[locale];
    out.push(next, ...cardList(second, locale));
  }
  return out;
}

/** Chi genera una carta creata, in una frase dopo i due punti: "in partita la genera Van Helsing's Tools, …". */
function tokenOrigin(facts: CardFacts, locale: Locale): Part[] {
  const [first] = facts.createdBy;
  if (first?.length) {
    const many = first.length > 1;
    const verb = {
      en: ", and during a match it is created by ",
      it: many ? ", in partita la generano " : ", in partita la genera ",
      es: many ? ", durante la partida la crean " : ", durante la partida la crea ",
    }[locale];
    return [verb, ...chainParts(facts.createdBy, locale), "."];
  }
  const none = { en: ". No card text says which card creates it", it: ". Nessun testo di carta dice quale carta la genera", es: ". Ningún texto de carta dice qué carta la crea" }[locale];
  if (!facts.linked.length) return [none, "."];
  const linked = { en: "; World of Origins links it to ", it: "; World of Origins la collega a ", es: "; World of Origins la relaciona con " }[locale];
  return [none, linked, ...cardList(facts.linked, locale), "."];
}

/**
 * Una carta creata arriva in partita da una carta della Demo 2.0? Vero quando nella catena di chi la genera (dai
 * testi) c'è una carta della collezione della demo (Garlic ← Van Helsing's Tools ← Van Helsing). Falso per le carte
 * create che nessun testo nomina (Reflection, Little Pig, Off With Your Head!): la loro presenza nella demo viene solo
 * dallo stato di World of Origins, e le frasi lo attribuiscono a World of Origins.
 */
export function createdFromDemo(facts: Pick<CardFacts, "createdBy">): boolean {
  return facts.createdBy.some((level) => level.some((c) => c.type !== "token" && c.status === "active"));
}

/** Giorno della verifica sul gioco, scritto nella lingua della pagina ("22 settembre 2026"). */
function verifiedOn(locale: Locale): string {
  return formatDate(locale, cardsVerified.date);
}

/**
 * La frase d'attacco della scheda (CARDS-05, GEO-07): quello che un assistente copia per rispondere a "che cos'è
 * Merlin in Origins TCG". Tre modelli:
 * - carte della Demo 2.0 (122): tipo, gioco, statistiche, "è nella Demo 2.0 (verificata nel gioco il …)" e il conto
 *   dei mazzi pubblicati, se la lettura è riuscita;
 * - carte create: che non si aggiungono nel deck builder e chi le genera, con la catena (Garlic ← Van Helsing's Tools
 *   ← Van Helsing), oppure che nessun testo lo dice e a che cosa le collega World of Origins; poi costo e statistiche;
 * - carte rimosse: prima di tutto che non sono nella Demo 2.0 e quindi non entrano nel deck builder (CARDS-09), poi
 *   che cos'erano e le ultime statistiche note, al passato.
 * Il vecchio nome, quando c'è, chiude la frase.
 */
export function cardLead(card: LeadCard, facts: CardFacts, locale: Locale): Part[] {
  const name = cardRef(card);
  const out: Part[] = [];
  const sp = (s: string) => (s ? ` ${s}` : "");

  if (card.status === "removed") {
    const head = {
      en: " is not in Demo 2.0, so it cannot be added in the deck builder.",
      it: " non è nella Demo 2.0, quindi non si può aggiungere nel deck builder.",
      es: " no está en la Demo 2.0, así que no se puede añadir en el deck builder.",
    }[locale];
    const was = {
      en: `It was ${withArticle(card, locale)} in earlier builds of ${gameName.en}.`,
      it: `Era ${withArticle(card, locale)} delle build precedenti di ${gameName.it}.`,
      es: `Era ${withArticle(card, locale)} de las builds anteriores de ${gameName.es}.`,
    }[locale];
    const clause = statsClause(card, locale, "past");
    const stats = clause ? { en: `Last known stats: it ${clause}.`, it: `Ultime statistiche note: ${clause}.`, es: `Últimas estadísticas conocidas: ${clause}.` }[locale] : "";
    out.push(name, head, sp(was), sp(stats), sp(formerSentence(card, locale)));
    return out.filter((p) => p !== "");
  }

  if (card.type === "token") {
    const head = {
      en: ` is a created card in ${gameName.en}: ${notInBuilder.en}`,
      it: ` è una carta generata di ${gameName.it}: ${notInBuilder.it}`,
      es: ` es una carta creada de ${gameName.es}: ${notInBuilder.es}`,
    }[locale];
    out.push(name, head, ...tokenOrigin(facts, locale), sp(statsSentence(card, locale)));
    return out.filter((p) => p !== "");
  }

  const is = { en: ` is ${withArticle(card, locale)} in ${gameName.en}.`, it: ` è ${withArticle(card, locale)} di ${gameName.it}.`, es: ` es ${withArticle(card, locale)} de ${gameName.es}.` }[locale];
  const demo = {
    en: `It is in Demo 2.0 (checked in the game on ${verifiedOn(locale)}).`,
    it: `È nella Demo 2.0 (verificata nel gioco il ${verifiedOn(locale)}).`,
    es: `Está en la Demo 2.0 (${esMasculine(card) ? "verificado" : "verificada"} en el juego el ${verifiedOn(locale)}).`,
  }[locale];
  out.push(name, is, sp(statsSentence(card, locale)), sp(demo));
  if (facts.decks) out.push(sp(deckSentence(card, facts.decks, locale)));
  out.push(sp(formerSentence(card, locale)));
  return out.filter((p) => p !== "");
}

// ---------- In breve ----------

export type BriefItem = { q: string; a: Part[] };

/** Le modifiche vere della carta (statistiche, testo, allineamento): gli scambi nei mazzi del playtest non contano. */
function cardChanges(history: readonly Change[]): Change[] {
  return history.filter((h) => h.kind !== "deck");
}

/** "la Potenza da 3 a 5 e la Salute da 3 a 5", "il testo", "l'allineamento da Neutral a Evil". */
function changeWhat(ch: Change, locale: Locale): string {
  const stat = {
    en: { mana: "its cost", power: "its Power", health: "its Health" },
    it: { mana: "il costo", power: "la Potenza", health: "la Salute" },
    es: { mana: "su coste", power: "su Poder", health: "su Salud" },
  }[locale];
  const fromTo = { en: (a: number, b: number) => `from ${a} to ${b}`, it: (a: number, b: number) => `da ${a} a ${b}`, es: (a: number, b: number) => `de ${a} a ${b}` }[locale];
  const bits: string[] = [];
  for (const k of ["mana", "power", "health"] as const) {
    const a = ch.from?.[k];
    const b = ch.to?.[k];
    if (a !== undefined && b !== undefined && a !== b) bits.push(`${stat[k]} ${fromTo(a, b)}`);
  }
  if (ch.alignment) {
    const [what, from, to] = { en: ["its alignment", "from", "to"], it: ["l'allineamento", "da", "a"], es: ["su alineamiento", "de", "a"] }[locale];
    bits.push(`${what} ${from} ${alignWord[ch.alignment.from]} ${to} ${alignWord[ch.alignment.to]}`);
  }
  if (!bits.length) return { en: "its text", it: "il testo", es: "su texto" }[locale];
  const and = { en: " and ", it: " e ", es: " y " }[locale];
  return bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(", ")}${and}${bits[bits.length - 1]}`;
}

/** Domanda e risposta sulle patch: quante l'hanno cambiata e che cosa ha fatto l'ultima, con il link alla sua news. */
function patchAnswer(card: LeadCard, locale: Locale): Part[] {
  const changes = cardChanges(card.history);
  const first = patchOrder[0];
  if (!changes.length) {
    const since = `${patchLabel(first, locale)} (${formatDate(locale, patches[first].date)})`;
    const deckOnly = [...new Set(card.history.filter((h) => h.kind === "deck").map((h) => patchLabel(h.patch, locale)))];
    const no = {
      en: `No: none of the patches since ${since} changed its stats or its text.`,
      it: `No: nessuna patch dalla ${since} ha cambiato le sue statistiche o il suo testo.`,
      es: `No: ningún parche desde el ${since} ha cambiado sus estadísticas ni su texto.`,
    }[locale];
    const only = deckOnly.length
      ? {
          en: ` It only appears in the changes to the playtest's preset decks (${deckOnly.join(", ")}).`,
          it: ` Compare solo nelle modifiche ai mazzi preimpostati del playtest (${deckOnly.join(", ")}).`,
          es: ` Solo aparece en los cambios de los mazos predefinidos del playtest (${deckOnly.join(", ")}).`,
        }[locale]
      : "";
    return [no + only];
  }
  const ids = [...new Set(changes.map((c) => c.patch))];
  const last = changes[changes.length - 1];
  const p = patches[last.patch];
  const label = patchLabel(last.patch, locale);
  const date = formatDate(locale, p.date);
  const patchPart: Part = p.news ? { path: `/news/${p.news}`, text: label } : label;
  const k = ids.length;
  const what = changeWhat(last, locale);
  // Una patch sola: la si dice direttamente, senza "in 1 patch. L'ultima è…"
  if (k === 1) {
    if (locale === "it") return ["Sì: la patch ", patchPart, ` del ${date} ha cambiato ${what}.`];
    if (locale === "es") return ["Sí: el parche ", patchPart, ` del ${date} cambió ${what}.`];
    return ["Yes: patch ", patchPart, ` (${date}) changed ${what}.`];
  }
  // "patch" in italiano non cambia al plurale
  if (locale === "it") return [`Sì, in ${k} patch. L'ultima è la patch `, patchPart, ` del ${date}, che ha cambiato ${what}.`];
  if (locale === "es") return [`Sí, en ${k} parches. El último es el parche `, patchPart, ` del ${date}, que cambió ${what}.`];
  return [`Yes, in ${k} patches. The latest is patch `, patchPart, ` (${date}), which changed ${what}.`];
}

/** Chiude le risposte sui legami fra carte: vengono dai testi, non da una nostra lettura. */
const fromTexts: Record<Locale, string> = { en: " (from the card texts).", it: " (dai testi delle carte).", es: " (según los textos de las cartas)." };

/**
 * Le carte generate in avanti, con il secondo passaggio: "Van Helsing genera Van Helsing's Tools, che a sua volta genera
 * Holy Water, …". Per le carte rimosse il primo verbo va al passato ("Headless Horseman generava Pumpkin"); il secondo
 * passaggio resta al presente, perché parla di carte create che esistono ancora.
 */
function createsParts(card: LeadCard, creates: readonly RelCard[][], locale: Locale): Part[] {
  const [first, second] = creates;
  const past = card.status === "removed";
  const verb = past ? { en: " created ", it: " generava ", es: " creaba " } : { en: " creates ", it: " genera ", es: " crea " };
  const out: Part[] = [cardRef(card), verb[locale], ...cardList(first, locale)];
  if (second?.length) {
    const one = first.length === 1;
    const next = {
      en: one ? ", which in turn creates " : "; these in turn create ",
      it: one ? ", che a sua volta genera " : ", che a loro volta generano ",
      es: one ? ", que a su vez crea " : ", que a su vez crean ",
    }[locale];
    out.push(next, ...cardList(second, locale));
  }
  out.push(fromTexts[locale]);
  return out;
}

/**
 * Le carte più spesso nello stesso mazzo, le prime tre: dal numero di mazzi, a parità le Leggendarie e poi il nome.
 * "Koschei (in 2 su 3), Genie (in 2 su 3) e Captain Ahab (in 2 su 3)".
 */
function companionParts(list: readonly BriefCompanion[], decks: number, locale: Locale): Part[] {
  const top = [...list]
    .sort((a, b) => b.together - a.together || Number(Boolean(b.card.legendary)) - Number(Boolean(a.card.legendary)) || a.card.name.localeCompare(b.card.name))
    .slice(0, 3);
  const count = cardLabels[locale].togetherCount;
  return listParts(
    top.map((c) => [cardRef(c.card), ` (${fill(count, { k: c.together, n: decks })})`]),
    andWord[locale],
  );
}

/**
 * Il riquadro "In breve" (SCHEDE-10): 2–3 domande con le risposte dai dati, pensate per chi cerca e per gli
 * assistenti. Sempre: è nella demo? le patch l'hanno cambiata? Poi, in quest'ordine, la prima che vale: chi la genera
 * (carte create), che carte genera, quali carte stanno spesso nel suo stesso mazzo (carte della demo in almeno due
 * mazzi). Il conto dei mazzi non si ripete: lo dice già la frase d'attacco (revisione del 25/09/2026).
 */
export function cardBrief(card: LeadCard, facts: CardFacts, locale: Locale): BriefItem[] {
  const n = card.name;
  const items: BriefItem[] = [];
  const legendaries = activeCards.filter((c) => c.legendary).length;
  const date = verifiedOn(locale);

  // 1. È nella demo?
  const q1 = { en: `Is ${n} in the Origins TCG demo?`, it: `${n} è nella demo di Origins TCG?`, es: `¿Está ${n} en la demo de Origins TCG?` }[locale];
  if (card.status === "removed") {
    items.push({
      q: q1,
      a: [
        {
          en: "No: it was in earlier builds of Origins TCG and is not in Demo 2.0, so it cannot be added in the deck builder.",
          it: "No: era nelle build precedenti di Origins TCG e non è nella Demo 2.0, quindi non si può aggiungere nel deck builder.",
          es: "No: estaba en builds anteriores de Origins TCG y no está en la Demo 2.0, así que no se puede añadir en el deck builder.",
        }[locale],
      ],
    });
  } else if (card.type === "token") {
    // Chi la genera lo dice la terza domanda: qui solo lo stato, con la sua fonte.
    const a = createdFromDemo(facts)
      ? {
          en: `Yes, as a created card: ${notInBuilder.en}, but it comes into a match from a card in Demo 2.0.`,
          it: `Sì, come carta generata: ${notInBuilder.it}, ma in partita arriva da una carta della Demo 2.0.`,
          es: `Sí, como carta creada: ${notInBuilder.es}, pero llega a la partida desde una carta de la Demo 2.0.`,
        }[locale]
      : {
          en: `According to World of Origins, yes: it lists it among the current created cards. ${cap(notInBuilder.en)}.`,
          it: `Secondo World of Origins sì: la elenca fra le carte generate attuali. ${cap(notInBuilder.it)}.`,
          es: `Según World of Origins, sí: la incluye entre las cartas creadas actuales. ${cap(notInBuilder.es)}.`,
        }[locale];
    items.push({ q: q1, a: [a] });
  } else {
    const total = activeCards.length;
    const a = card.legendary
      ? {
          en: `Yes: it is one of the ${legendaries} Legendaries in Demo 2.0, checked in the game on ${date}, so it can lead a deck in the deck builder.`,
          it: `Sì: è una delle ${legendaries} Leggendarie della Demo 2.0, verificate nel gioco il ${date}, quindi può guidare un mazzo nel deck builder.`,
          es: `Sí: es una de las ${legendaries} Legendarias de la Demo 2.0, verificadas en el juego el ${date}, así que puede liderar un mazo en el deck builder.`,
        }[locale]
      : {
          en: `Yes: it is one of the ${total} cards in Demo 2.0, checked in the game on ${date}, so you can put it in a deck in the deck builder.`,
          it: `Sì: è una delle ${total} carte della Demo 2.0, verificate nel gioco il ${date}, quindi puoi metterla in un mazzo nel deck builder.`,
          es: `Sí: es una de las ${total} cartas de la Demo 2.0, verificadas en el juego el ${date}, así que puedes ponerla en un mazo en el deck builder.`,
        }[locale];
    items.push({ q: q1, a: [a] });
  }

  // 2. Le patch l'hanno cambiata?
  items.push({
    q: { en: `Has a patch changed ${n}?`, it: `Le patch hanno cambiato ${n}?`, es: `¿Algún parche ha cambiado ${n}?` }[locale],
    a: patchAnswer(card, locale),
  });

  // 3. Chi la genera, che cosa genera o con quali carte sta
  if (card.type === "token") {
    const q = { en: `Which card creates ${n}?`, it: `Quale carta genera ${n}?`, es: `¿Qué carta crea ${n}?` }[locale];
    const [first] = facts.createdBy;
    const a: Part[] = [];
    if (first?.length) {
      const many = first.length > 1;
      a.push({ en: "It is created by ", it: many ? "La generano " : "La genera ", es: many ? "La crean " : "La crea " }[locale], ...chainParts(facts.createdBy, locale), fromTexts[locale]);
    } else {
      a.push({ en: "No card text says so", it: "Nessun testo di carta lo dice", es: "Ningún texto de carta lo dice" }[locale]);
      if (facts.linked.length) a.push({ en: "; World of Origins links it to ", it: "; World of Origins la collega a ", es: "; World of Origins la relaciona con " }[locale], ...cardList(facts.linked, locale));
      a.push(".");
    }
    if (facts.createdByEarlier.length) {
      const many = facts.createdByEarlier.length > 1;
      a.push(
        {
          en: " In earlier builds it was also created by ",
          it: many ? " Nelle build precedenti la generavano anche " : " Nelle build precedenti la generava anche ",
          es: many ? " En builds anteriores también la creaban " : " En builds anteriores también la creaba ",
        }[locale],
        ...cardList(facts.createdByEarlier, locale),
        ".",
      );
    }
    items.push({ q, a });
  } else if (facts.creates.length) {
    const past = card.status === "removed";
    items.push({
      q: past
        ? { en: `Which cards did ${n} create?`, it: `Quali carte generava ${n}?`, es: `¿Qué cartas creaba ${n}?` }[locale]
        : { en: `Which cards does ${n} create?`, it: `Quali carte genera ${n}?`, es: `¿Qué cartas crea ${n}?` }[locale],
      a: createsParts(card, facts.creates, locale),
    });
  } else if (card.status === "active" && facts.decks && facts.companions?.length) {
    const d = facts.decks.n;
    const leg = Boolean(card.legendary);
    const q = {
      en: `Which cards are often in the same deck as ${n}?`,
      it: `Quali carte stanno spesso nello stesso mazzo di ${n}?`,
      es: `¿Qué cartas suelen ir en el mismo mazo que ${n}?`,
    }[locale];
    const intro = {
      en: leg ? `The cards found most often in the ${d} decks it leads: ` : `The cards found most often in its ${d} published decks: `,
      it: leg ? `Le carte più presenti ${itNei(d)} ${d} mazzi che guida: ` : `Le carte più presenti nei suoi ${d} mazzi pubblicati: `,
      es: leg ? `Las cartas más presentes en los ${d} mazos que lidera: ` : `Las cartas más presentes en sus ${d} mazos publicados: `,
    }[locale];
    items.push({ q, a: [intro, ...companionParts(facts.companions, d, locale), "."] });
  }
  return items;
}

// ---------- Stato nei dati strutturati ----------

/**
 * Stato della carta per `creativeWorkStatus` nel JSON-LD: uguale in tutte le lingue, perché la carta è una sola entità
 * per le tre pagine (`@id` comune, jsonld/card.ts); le frasi nella lingua della pagina stanno sulla pagina. Le carte
 * create che nessun testo della demo genera sono attribuite a World of Origins, come in "In breve".
 */
export function cardStatusLd(card: Pick<Card, "type" | "status">, facts: Pick<CardFacts, "createdBy">): string {
  if (card.status === "removed") return "Not in Demo 2.0 (earlier builds)";
  if (card.type !== "token") return "In Demo 2.0";
  return createdFromDemo(facts) ? "Created card in Demo 2.0" : "Created card listed by World of Origins";
}

/**
 * I testi della carta da dichiarare nel JSON-LD, ciascuno con la sua lingua e su una riga: gli stessi su tutte e tre
 * le pagine, perché stanno sull'entità comune della carta. Solo testi del gioco (SCHEDE-07): per le carte della
 * collezione della demo l'inglese, l'italiano e lo spagnolo letti nel gioco; per le carte create e rimosse il solo
 * inglese (di World of Origins), mai le nostre traduzioni. Nessun testo se una patch successiva lo ha superato
 * (`outdated`, `textOutdated` di cardTitles.ts), né una "traduzione" uguale all'inglese (testo locale mancante).
 */
export function cardLdTexts(card: Pick<Card, "type" | "status" | "ability">, outdated: boolean): { lang: Locale; text: string }[] {
  if (outdated || !card.ability?.en) return [];
  const one = (s: string) => s.replace(/\s+/g, " ").trim();
  const en = one(card.ability.en);
  const out: { lang: Locale; text: string }[] = [{ lang: "en", text: en }];
  if (card.status !== "active" || card.type === "token") return out;
  for (const l of ["it", "es"] as const) {
    const t = card.ability[l] ? one(card.ability[l]) : "";
    if (t && t !== en) out.push({ lang: l, text: t });
  }
  return out;
}

// ---------- Righe delle fonti ----------

/**
 * Riga sotto le statistiche per le carte che la collezione della demo non mostra (CARDS-09): carte create e rimosse
 * non sono state verificate nel gioco, e dirlo "verificata" sarebbe un dato falso. Per le 122 carte della demo resta
 * la riga del dizionario (`common.asOf`): `undefined` qui.
 */
export function asOfLine(card: Pick<Card, "type" | "status">, locale: Locale, source: { fetched: string; patch: string }): string | undefined {
  const l = cardLabels[locale];
  if (card.status === "removed") return fill(l.asOfRemoved, { patch: patchName(source.patch, locale) });
  if (card.type === "token") return fill(l.asOfToken, { date: formatDate(locale, source.fetched.slice(0, 10)) });
  return undefined;
}

/**
 * Tra parentesi nella riga della fonte, in fondo alla scheda: prima diceva solo "(Patch 0.6.3)", in contrasto con la
 * riga sotto le statistiche ("patch della demo del 21 settembre"). Ora dice la data dell'import di World of Origins, la
 * patch da cui partono i suoi dati e, se c'è, la patch uscita dopo che `cards.ts` applica dalle note ufficiali.
 */
export function sourceNote(locale: Locale, source: { fetched: string; patch: string }): string {
  const l = cardLabels[locale];
  const imported = patchOrder.indexOf(source.patch as PatchId);
  const later = imported >= 0 ? patchOrder.slice(imported + 1).map((id) => patchLabel(id, locale)) : [];
  const base = fill(l.sourceImport, { date: formatDate(locale, source.fetched.slice(0, 10)), patch: patchName(source.patch, locale) });
  return later.length ? `${base}${fill(l.sourceLater, { patch: later.join(", ") })}` : base;
}

// ---------- Potere leggendario ----------

/**
 * Potere leggendario delle 11 Leggendarie (SCHEDE-13), da leggere nella Demo 2.0 ("Game Start: …") e trascrivere qui
 * nelle tre lingue, con il testo ufficiale del gioco: la scheda lo mostra in una sezione sua appena c'è. Resta vuoto
 * finché nessuno lo ha letto nel gioco: mai copiarlo da altri siti (CLAUDE.md, "niente dati inventati").
 */
export const legendaryPowers: Readonly<Partial<Record<string, Record<Locale, string>>>> = {};
