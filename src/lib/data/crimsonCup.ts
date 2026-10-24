import type { Locale } from "../i18n";

/*
  Crimson Cup: i dati ufficiali del torneo (20/10/2026). Pierluigi ha passato le tabelle che Koin Games ha pubblicato sul
  suo Discord ufficiale dopo la prima qualificazione (AMER #1 del 19/10/2026; "arriva da discord", "solo AMER #1") e ha
  chiesto di usarle oltre la news: pagina /analytics/crimson-cup con un selettore per qualificazione, confronto con il
  ladder e righe sulle schede carta (scelte del 20/10/2026).

  Qui stanno SOLO i numeri come li ha pubblicati Koin, trascritti dalle due tabelle:
  - Leggendarie: "Ban rate", "Banned / Seen", "Submitted", "Played", "Deepest". Il ban rate non si scrive: è banned / seen
    (tutte e undici le righe tornano con il valore pubblicato, lo controlla il test). "Deepest" è il turno più avanzato
    del tabellone (R4 = il turno dei 32 qualificati).
  - Carte più giocate: "Share of all submitted decks containing the card — so it covers everyone who entered, not only
    those who got a match". Le prime 20 della tabella, con la percentuale pubblicata (a un decimale) e il conteggio.
  Il totale dei mazzi consegnati Koin non lo scrive: dalle percentuali delle carte risulta 723 (241 terne), mentre le righe
  delle Leggendarie sommano 721. Il sito non scrive né l'uno né l'altro (niente numero di iscritti: Pierluigi ha chiesto
  di non parlare di chi non si è presentato, 20/10/2026) e le quote delle Leggendarie si calcolano sulle righe della
  tabella (`submittedTotal`).

  Una qualificazione nuova: si aggiunge la sua voce in `crimsonQualifiers` con `stats` quando Koin pubblica le tabelle
  (e `read`, il giorno in cui le abbiamo lette); la pagina e le schede carta la mostrano da sole. Regole e calcoli in
  src/lib/crimsonCup.ts, testi in src/lib/crimsonCupLabels.ts.
*/

type L10n = Record<Locale, string>;
const n = (en: string, it: string, es: string, fr: string, pt: string, de: string, ru: string): L10n => ({ en, it, es, fr, pt, de, ru });

export type CrimsonLegendaryRow = {
  /** slug della Leggendaria in cards.ts */
  legendary: string;
  banned: number;
  seen: number;
  /** mazzi consegnati con questa Leggendaria */
  submitted: number;
  /** "Played" della tabella di Koin */
  played: number;
  /** turno più avanzato raggiunto ("Deepest": R4 = 4) */
  deepest: number;
};

export type CrimsonCardRow = {
  card: string;
  /** mazzi consegnati con la carta */
  decks: number;
  /** quota pubblicata da Koin, a un decimale (47,2% = 0.472) */
  share: number;
};

export type CrimsonStats = {
  /** giorno in cui abbiamo letto le tabelle */
  read: string;
  /** turno dei qualificati nel tabellone ("R4": i 32 che passano ai playoff) */
  qualifyRound: number;
  legendaries: CrimsonLegendaryRow[];
  /** le carte più giocate nell'ordine della tabella di Koin (solo quelle pubblicate) */
  cards: CrimsonCardRow[];
};

export type CrimsonQualifier = {
  id: string;
  /** nome ufficiale (AMER #1, EMEA #1…): non si traduce */
  name: string;
  /** inizio con orario e fuso come lo scrive Koin (EST di Koin = UTC-4, vedi events.ts) */
  startAt: string;
  /** fuso come lo scrive la grafica ufficiale, accanto all'ora */
  zone: string;
  stats?: CrimsonStats;
};

/** Dove Koin ha pubblicato le tabelle: il Discord ufficiale (lo stesso link di Footer.tsx e delle news). */
export const CRIMSON_SOURCE_URL = "https://discord.gg/originstcg";

/**
 * Le fasi della Crimson Cup in ordine, dal calendario ufficiale del 05/10/2026 (events.ts). Playoff e finali non hanno
 * ancora una voce: si aggiungono quando Koin ne pubblica i numeri.
 */
export const crimsonQualifiers: CrimsonQualifier[] = [
  {
    id: "amer-1",
    name: "AMER #1",
    startAt: "2026-10-19T19:00:00-04:00",
    zone: "EST",
    stats: {
      read: "2026-10-20",
      qualifyRound: 4,
      legendaries: [
        { legendary: "van-helsing", banned: 96, seen: 216, submitted: 135, played: 108, deepest: 4 },
        { legendary: "merlin", banned: 38, seen: 90, submitted: 71, played: 53, deepest: 4 },
        { legendary: "three-not-so-little-pigs", banned: 86, seen: 262, submitted: 168, played: 138, deepest: 4 },
        { legendary: "dorothy", banned: 6, seen: 26, submitted: 23, played: 15, deepest: 4 },
        { legendary: "king-arthur", banned: 15, seen: 66, submitted: 46, played: 39, deepest: 4 },
        { legendary: "queen-of-hearts", banned: 13, seen: 62, submitted: 47, played: 38, deepest: 4 },
        { legendary: "mulan", banned: 13, seen: 64, submitted: 48, played: 39, deepest: 4 },
        { legendary: "legion-of-the-dead", banned: 19, seen: 99, submitted: 67, played: 49, deepest: 4 },
        { legendary: "dracula", banned: 9, seen: 64, submitted: 53, played: 40, deepest: 4 },
        { legendary: "robin-hood", banned: 8, seen: 68, submitted: 52, played: 38, deepest: 4 },
        { legendary: "wicked-stepmother", banned: 1, seen: 9, submitted: 11, played: 7, deepest: 3 },
      ],
      cards: [
        { card: "baby-bear", decks: 341, share: 0.472 },
        { card: "roo", decks: 244, share: 0.337 },
        { card: "spellbook", decks: 234, share: 0.324 },
        { card: "mind-palace", decks: 229, share: 0.317 },
        { card: "golden-egg", decks: 218, share: 0.302 },
        { card: "trash-for-treasure", decks: 216, share: 0.299 },
        { card: "ali-baba", decks: 204, share: 0.282 },
        { card: "dark-omen", decks: 198, share: 0.274 },
        { card: "mummy", decks: 180, share: 0.249 },
        { card: "sandman", decks: 173, share: 0.239 },
        { card: "impundulu", decks: 161, share: 0.223 },
        { card: "forbidden-knowledge", decks: 161, share: 0.223 },
        { card: "scarecrow", decks: 160, share: 0.221 },
        { card: "defense-matrix", decks: 160, share: 0.221 },
        { card: "en-passant", decks: 157, share: 0.217 },
        { card: "bullseye", decks: 156, share: 0.216 },
        { card: "tin-woodman", decks: 156, share: 0.216 },
        { card: "reinforcements", decks: 154, share: 0.213 },
        { card: "obliterate", decks: 151, share: 0.209 },
        { card: "shahrazad", decks: 147, share: 0.203 },
      ],
    },
  },
  {
    // tabelle passate da Pierluigi il 21/10/2026 ("i dati di ieri"): 924 mazzi sia dalle Leggendarie sia dalle carte
    id: "emea-1",
    name: "EMEA #1",
    startAt: "2026-10-20T19:00:00+02:00",
    zone: "CEST",
    stats: {
      read: "2026-10-21",
      qualifyRound: 4,
      legendaries: [
        { legendary: "van-helsing", banned: 139, seen: 272, submitted: 182, played: 143, deepest: 4 },
        { legendary: "merlin", banned: 54, seen: 111, submitted: 90, played: 66, deepest: 4 },
        { legendary: "three-not-so-little-pigs", banned: 112, seen: 321, submitted: 216, played: 164, deepest: 4 },
        { legendary: "robin-hood", banned: 20, seen: 102, submitted: 71, played: 58, deepest: 4 },
        { legendary: "legion-of-the-dead", banned: 20, seen: 130, submitted: 90, played: 67, deepest: 4 },
        { legendary: "mulan", banned: 17, seen: 111, submitted: 77, played: 62, deepest: 4 },
        { legendary: "dracula", banned: 11, seen: 76, submitted: 54, played: 39, deepest: 4 },
        { legendary: "dorothy", banned: 2, seen: 20, submitted: 21, played: 11, deepest: 4 },
        { legendary: "queen-of-hearts", banned: 6, seen: 75, submitted: 62, played: 47, deepest: 4 },
        { legendary: "king-arthur", banned: 4, seen: 63, submitted: 53, played: 33, deepest: 4 },
        // Koin scrive "—" come ban rate: 0 su 6
        { legendary: "wicked-stepmother", banned: 0, seen: 6, submitted: 8, played: 3, deepest: 4 },
      ],
      cards: [
        { card: "baby-bear", decks: 463, share: 0.501 },
        { card: "mind-palace", decks: 305, share: 0.33 },
        { card: "roo", decks: 301, share: 0.326 },
        { card: "spellbook", decks: 300, share: 0.325 },
        { card: "trash-for-treasure", decks: 286, share: 0.31 },
        { card: "golden-egg", decks: 271, share: 0.293 },
        { card: "ali-baba", decks: 266, share: 0.288 },
        { card: "dark-omen", decks: 265, share: 0.287 },
        { card: "mummy", decks: 246, share: 0.266 },
        { card: "scarecrow", decks: 237, share: 0.256 },
        { card: "tin-woodman", decks: 235, share: 0.254 },
        { card: "obliterate", decks: 220, share: 0.238 },
        { card: "en-passant", decks: 217, share: 0.235 },
        { card: "forbidden-knowledge", decks: 214, share: 0.232 },
        { card: "stroke-of-midnight", decks: 213, share: 0.231 },
        { card: "sandman", decks: 211, share: 0.228 },
        { card: "bagheera", decks: 210, share: 0.227 },
        { card: "jekyll", decks: 196, share: 0.212 },
        { card: "impundulu", decks: 195, share: 0.211 },
        { card: "reinforcements", decks: 194, share: 0.21 },
      ],
    },
  },
  {
    // tabelle passate da Pierluigi il 22/10/2026: 891 mazzi sia dalle Leggendarie sia dalle carte
    id: "amer-2",
    name: "AMER #2",
    startAt: "2026-10-21T21:00:00-04:00",
    zone: "EST",
    stats: {
      read: "2026-10-22",
      qualifyRound: 4,
      legendaries: [
        { legendary: "van-helsing", banned: 90, seen: 186, submitted: 179, played: 102, deepest: 4 },
        { legendary: "merlin", banned: 38, seen: 80, submitted: 80, played: 44, deepest: 4 },
        { legendary: "three-not-so-little-pigs", banned: 79, seen: 219, submitted: 214, played: 122, deepest: 4 },
        { legendary: "dorothy", banned: 3, seen: 9, submitted: 20, played: 5, deepest: 4 },
        { legendary: "king-arthur", banned: 18, seen: 75, submitted: 58, played: 39, deepest: 4 },
        { legendary: "robin-hood", banned: 8, seen: 43, submitted: 58, played: 28, deepest: 4 },
        { legendary: "mulan", banned: 6, seen: 43, submitted: 62, played: 28, deepest: 4 },
        { legendary: "queen-of-hearts", banned: 6, seen: 50, submitted: 58, played: 28, deepest: 4 },
        { legendary: "legion-of-the-dead", banned: 9, seen: 85, submitted: 87, played: 47, deepest: 4 },
        { legendary: "dracula", banned: 6, seen: 65, submitted: 64, played: 37, deepest: 4 },
        { legendary: "wicked-stepmother", banned: 1, seen: 12, submitted: 11, played: 6, deepest: 4 },
      ],
      cards: [
        { card: "baby-bear", decks: 411, share: 0.461 },
        { card: "mind-palace", decks: 301, share: 0.338 },
        { card: "spellbook", decks: 290, share: 0.325 },
        { card: "roo", decks: 279, share: 0.313 },
        { card: "trash-for-treasure", decks: 258, share: 0.29 },
        { card: "golden-egg", decks: 249, share: 0.279 },
        { card: "ali-baba", decks: 240, share: 0.269 },
        { card: "scarecrow", decks: 231, share: 0.259 },
        { card: "dark-omen", decks: 229, share: 0.257 },
        { card: "impundulu", decks: 220, share: 0.247 },
        { card: "bagheera", decks: 209, share: 0.235 },
        { card: "tin-woodman", decks: 208, share: 0.233 },
        { card: "sandman", decks: 207, share: 0.232 },
        { card: "mummy", decks: 198, share: 0.222 },
        { card: "bullseye", decks: 194, share: 0.218 },
        { card: "defense-matrix", decks: 189, share: 0.212 },
        { card: "forbidden-knowledge", decks: 188, share: 0.211 },
        { card: "en-passant", decks: 187, share: 0.21 },
        { card: "shahrazad", decks: 185, share: 0.208 },
        { card: "stroke-of-midnight", decks: 183, share: 0.205 },
      ],
    },
  },
  // APAC: le tabelle Koin non le ha pubblicate. Il 23/10/2026 le abbiamo messe qui per sbaglio con quelle della EMEA #2
  // (voce qui sotto, corretta il 24/10/2026): stats si aggiunge quando escono quelle vere.
  { id: "apac", name: "APAC", startAt: "2026-10-22T19:00:00+08:00", zone: "SGT" },
  {
    // tabelle pubblicate da apix (Koin) sul Discord ufficiale il 23/10/2026 alle 08:54 CEST in #the-courtyard, senza dire di
    // quale qualificazione fossero; a chi chiedeva la fonte ha risposto "data from last EMEA qual". Pierluigi le aveva
    // passate il 23/10 come "i dati di apac di ieri sera" e fino al 24/10 sono state online sotto la APAC (ff29483).
    // 1383 mazzi sia dalle Leggendarie sia dalle carte. Koin scrive R5 come turno più avanzato per tutte le Leggendarie,
    // dove nelle altre qualificazioni scriveva R4: il formato ufficiale resta 32 qualificati dopo il turno 4 (events.ts),
    // quindi qualifyRound resta 4 e R5 si mostra com'è.
    id: "emea-2",
    name: "EMEA #2",
    startAt: "2026-10-22T19:00:00+02:00",
    zone: "CEST",
    stats: {
      read: "2026-10-23",
      qualifyRound: 4,
      legendaries: [
        { legendary: "van-helsing", banned: 179, seen: 325, submitted: 317, played: 176, deepest: 5 },
        { legendary: "merlin", banned: 49, seen: 133, submitted: 126, played: 72, deepest: 5 },
        { legendary: "three-not-so-little-pigs", banned: 125, seen: 370, submitted: 355, played: 198, deepest: 5 },
        { legendary: "dorothy", banned: 8, seen: 26, submitted: 28, played: 14, deepest: 5 },
        { legendary: "mulan", banned: 14, seen: 67, submitted: 127, played: 40, deepest: 5 },
        { legendary: "king-arthur", banned: 15, seen: 82, submitted: 62, played: 39, deepest: 5 },
        { legendary: "wicked-stepmother", banned: 3, seen: 17, submitted: 11, played: 9, deepest: 5 },
        { legendary: "dracula", banned: 11, seen: 81, submitted: 80, played: 43, deepest: 5 },
        { legendary: "queen-of-hearts", banned: 9, seen: 76, submitted: 73, played: 42, deepest: 5 },
        { legendary: "robin-hood", banned: 16, seen: 139, submitted: 99, played: 69, deepest: 5 },
        { legendary: "legion-of-the-dead", banned: 12, seen: 124, submitted: 105, played: 69, deepest: 5 },
      ],
      cards: [
        { card: "baby-bear", decks: 689, share: 0.498 },
        { card: "spellbook", decks: 433, share: 0.313 },
        { card: "roo", decks: 421, share: 0.304 },
        { card: "mind-palace", decks: 418, share: 0.302 },
        { card: "scarecrow", decks: 383, share: 0.277 },
        { card: "ali-baba", decks: 377, share: 0.273 },
        { card: "trash-for-treasure", decks: 359, share: 0.26 },
        { card: "tin-woodman", decks: 353, share: 0.255 },
        { card: "jekyll", decks: 346, share: 0.25 },
        { card: "shahrazad", decks: 339, share: 0.245 },
        { card: "dark-omen", decks: 335, share: 0.242 },
        { card: "mummy", decks: 317, share: 0.229 },
        { card: "stroke-of-midnight", decks: 317, share: 0.229 },
        { card: "golden-egg", decks: 316, share: 0.228 },
        { card: "bagheera", decks: 312, share: 0.226 },
        { card: "obliterate", decks: 301, share: 0.218 },
        { card: "sandman", decks: 294, share: 0.213 },
        { card: "bullseye", decks: 292, share: 0.211 },
        { card: "searing-light", decks: 283, share: 0.205 },
        { card: "three-blind-mice", decks: 281, share: 0.203 },
      ],
    },
  },
];

/** La regione di ogni qualificazione, per la riga sotto il nome nel selettore. */
export const crimsonRegions: Record<string, L10n> = {
  AMER: n("Americas", "Americhe", "Américas", "Amériques", "Américas", "Amerika", "Америка"),
  EMEA: n("Europe, Middle East and Africa", "Europa, Medio Oriente e Africa", "Europa, Oriente Medio y África", "Europe, Moyen-Orient et Afrique", "Europa, Oriente Médio e África", "Europa, Naher Osten und Afrika", "Европа, Ближний Восток и Африка"),
  APAC: n("Asia-Pacific", "Asia-Pacifico", "Asia-Pacífico", "Asie-Pacifique", "Ásia-Pacífico", "Asien-Pazifik", "Азиатско-Тихоокеанский регион"),
};
