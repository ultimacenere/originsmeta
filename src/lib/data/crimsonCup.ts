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
const n = (en: string, it: string, es: string, fr: string, pt: string, de: string): L10n => ({ en, it, es, fr, pt, de });

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
  { id: "emea-1", name: "EMEA #1", startAt: "2026-10-20T19:00:00+02:00", zone: "CEST" },
  { id: "amer-2", name: "AMER #2", startAt: "2026-10-21T21:00:00-04:00", zone: "EST" },
  { id: "apac", name: "APAC", startAt: "2026-10-22T19:00:00+08:00", zone: "SGT" },
  { id: "emea-2", name: "EMEA #2", startAt: "2026-10-22T19:00:00+02:00", zone: "CEST" },
];

/** La regione di ogni qualificazione, per la riga sotto il nome nel selettore. */
export const crimsonRegions: Record<string, L10n> = {
  AMER: n("Americas", "Americhe", "Américas", "Amériques", "Américas", "Amerika"),
  EMEA: n("Europe, Middle East and Africa", "Europa, Medio Oriente e Africa", "Europa, Oriente Medio y África", "Europe, Moyen-Orient et Afrique", "Europa, Oriente Médio e África", "Europa, Naher Osten und Afrika"),
  APAC: n("Asia-Pacific", "Asia-Pacifico", "Asia-Pacífico", "Asie-Pacifique", "Ásia-Pacífico", "Asien-Pazifik"),
};
