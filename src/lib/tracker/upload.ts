/**
 * Dal PC al sito (tracker/overlay, Fase 3, 30/09/2026): la partita che l'app OriginsMeta Tracker manda a
 * /api/tracker/sync e che il database accetta. Stessi campi e stessi limiti di `tracker_match_ok` (blocco TRACKER di
 * supabase/schema.sql): `upload.test.ts` li confronta con l'SQL. Funzioni pure, senza import del sito: le usano l'app
 * (esbuild la mette nel pacchetto), le rotte del sito e i test.
 *
 * Cosa parte e cosa no (regole del tracker, docs/tracker.md):
 * - della partita: impronta (mai l'id), fine, esito, coda (classificata o normale), mazzo del giocatore (nome, 13 carte,
 *   Leggendaria, codice del gioco), il suo rank, i turni, le giocate turno per turno;
 * - dell'avversario **solo la Leggendaria e le carte che ha giocato** (decisione di Pierluigi del 30/09/2026): il suo
 *   mazzo completo, che il gioco non mostra, resta nello storico sul PC e non si manda;
 * - mai nomi né id di giocatori o partite, mai il rank dell'avversario, mai la modalità ("BotBattle") né un segnale bot.
 *
 * Il sito aggiunge due campi suoi (`SERVER_KEYS`: patch in vigore alla fine della partita e archetipo del mazzo), che
 * l'app non manda: `isUpload` rifiuta una partita che li porta.
 */
import type { TrackedMatch } from "./match";
import { isTrackQueue, type TrackQueue } from "./queue";

export const UPLOAD_LIMITS = {
  deckCards: 13,
  oppPlayed: 40,
  plays: 300,
  maxTurn: 200,
  maxLane: 2,
  deckName: 60,
  deckCode: 420,
  rank: 30,
  /** partite per chiamata (tracker_submit) */
  batch: 50,
  /** partite nuove per utente in 24 ore (tracker_submit) */
  perDay: 500,
} as const;

/** Collegamento dell'app all'account (tracker_link_code, tracker_link_claim). */
export const LINK = {
  /** caratteri del codice: niente 0/O e 1/I, che si confondono */
  alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  length: 8,
  minutes: 10,
  perHour: 5,
  maxDevices: 10,
} as const;

export const KEY_RE = /^C[0-9]{5}_[A-Z]{2}$/;
export const ID_RE = /^[0-9a-f]{32}$/;
export const TOKEN_RE = /^omt_[0-9a-f]{64}$/;
export const DECK_CODE_RE = /^KGBLDC[A-Za-z0-9+/=]+:[0-9a-f]{8}$/;
export const RANK_RE = /^[A-Za-z0-9 ]*$/;
export const TIMESTAMP_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,6})?Z$/;
export const PATCH_RE = /^[a-z0-9][a-z0-9.-]{0,19}$/;
export const ARCHETYPE_RE = /^[a-z]{1,20}$/;
/** La partita più vecchia che il database accetta, e al massimo un giorno nel futuro (orologi del PC sbagliati). */
export const EARLIEST_MATCH = "2026-01-01T00:00:00Z";
const DAY_MS = 86_400_000;

export type UploadPlay = { t: number; m: boolean; c: string | null; l: number | null };

export type TrackerUpload = {
  id: string;
  endedAt: string | null;
  result: "W" | "L" | null;
  queue: TrackQueue;
  deckName: string | null;
  deckLegendary: string | null;
  deckCards: string[];
  deckCode: string | null;
  rank: string | null;
  oppLegendary: string | null;
  oppPlayed: string[];
  turns: number | null;
  plays: UploadPlay[];
};

/** I campi che manda l'app, tutti e sempre (anche null). */
export const UPLOAD_KEYS = ["id", "endedAt", "result", "queue", "deckName", "deckLegendary", "deckCards", "deckCode", "rank", "oppLegendary", "oppPlayed", "turns", "plays"] as const;
/** I campi che aggiunge il sito (enrich.ts) prima di chiamare tracker_submit. */
export const SERVER_KEYS = ["patch", "archetype"] as const;
export type TrackerRow = TrackerUpload & { patch: string | null; archetype: string | null };

const PLAY_KEYS = ["t", "m", "c", "l"] as const;

/* ---------- aiuti ---------- */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isKey = (v: unknown): v is string => typeof v === "string" && KEY_RE.test(v);
const isIntIn = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
/** Lunghezza in caratteri (code point), come `char_length` di Postgres. */
const chars = (s: string) => [...s].length;
/** Caratteri di controllo (C0, DEL, C1) e separatori di riga Unicode: il database li toglie dal nome del mazzo. */
const isControl = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c < 0x20 || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029;
};
const sameKeys = (o: Record<string, unknown>, keys: readonly string[]) => {
  const own = Object.keys(o);
  return own.length === keys.length && keys.every((k) => Object.prototype.hasOwnProperty.call(o, k));
};

/** Data e ora ISO in UTC, di calendario vero (niente 30 febbraio), fra il 2026 e domani (come `tracker_ts_ok`). */
export function timestampOk(s: unknown, now = Date.now()): s is string {
  if (typeof s !== "string" || !TIMESTAMP_RE.test(s)) return false;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return false;
  // Date.parse accetta giorni che non esistono (2026-02-30 diventa il 2 marzo): il giorno e l'ora devono restare quelli
  if (new Date(t).toISOString().slice(0, 19) !== s.slice(0, 19)) return false;
  return t >= Date.parse(EARLIEST_MATCH) && t <= now + DAY_MS;
}

/* ---------- dal record dell'app alla partita da mandare ---------- */

/** Nome del mazzo senza caratteri di controllo, al massimo 60 caratteri; null se resta vuoto. */
export function cleanDeckName(name: string | null | undefined): string | null {
  if (!name) return null;
  const text = [...name].filter((ch) => !isControl(ch)).join("").trim();
  return text ? [...text].slice(0, UPLOAD_LIMITS.deckName).join("") : null;
}

export function toUpload(m: TrackedMatch, now = Date.now()): TrackerUpload {
  const keyOrNull = (k: string | null | undefined) => (isKey(k) ? k : null);
  const oppPlayed = [...new Set(m.plays.filter((p) => !p.me && isKey(p.card)).map((p) => p.card as string))];
  return {
    id: m.id,
    endedAt: timestampOk(m.endedAt, now) ? m.endedAt : null,
    result: m.result === "W" || m.result === "L" ? m.result : null,
    queue: isTrackQueue(m.queue) ? m.queue : "normal",
    deckName: cleanDeckName(m.deck.name),
    deckLegendary: keyOrNull(m.deck.legendary),
    deckCards: m.deck.cards.filter(isKey).slice(0, UPLOAD_LIMITS.deckCards),
    deckCode: m.deck.code && m.deck.code.length <= UPLOAD_LIMITS.deckCode && DECK_CODE_RE.test(m.deck.code) ? m.deck.code : null,
    rank: m.rank && chars(m.rank) <= UPLOAD_LIMITS.rank && RANK_RE.test(m.rank) ? m.rank : null,
    // dell'avversario solo la Leggendaria e le carte che ha giocato: `m.opponent.cards` (il mazzo intero) non parte mai
    oppLegendary: keyOrNull(m.opponent?.legendary),
    oppPlayed: oppPlayed.slice(0, UPLOAD_LIMITS.oppPlayed),
    turns: isIntIn(m.turns, 0, UPLOAD_LIMITS.maxTurn) ? m.turns : null,
    plays: m.plays
      .filter((p) => isIntIn(p.turn, 0, UPLOAD_LIMITS.maxTurn))
      .slice(0, UPLOAD_LIMITS.plays)
      .map((p) => ({ t: p.turn, m: p.me === true, c: keyOrNull(p.card), l: isIntIn(p.lane, 0, UPLOAD_LIMITS.maxLane) ? p.lane : null })),
  };
}

/* ---------- controllo (rotta del sito, test) ---------- */

function playOk(p: unknown): boolean {
  if (!isRecord(p) || !sameKeys(p, PLAY_KEYS)) return false;
  return isIntIn(p.t, 0, UPLOAD_LIMITS.maxTurn) && typeof p.m === "boolean" && (p.c === null || isKey(p.c)) && (p.l === null || isIntIn(p.l, 0, UPLOAD_LIMITS.maxLane));
}

/** Una partita come la manda l'app: tutti i campi di `UPLOAD_KEYS` e nessun altro, con i limiti del database. */
export function isUpload(x: unknown, now = Date.now()): x is TrackerUpload {
  if (!isRecord(x) || !sameKeys(x, UPLOAD_KEYS)) return false;
  const nullOr = (v: unknown, ok: (v: unknown) => boolean) => v === null || ok(v);
  return (
    typeof x.id === "string" &&
    ID_RE.test(x.id) &&
    nullOr(x.endedAt, (v) => timestampOk(v, now)) &&
    (x.result === null || x.result === "W" || x.result === "L") &&
    isTrackQueue(x.queue) &&
    nullOr(x.deckName, (v) => typeof v === "string" && chars(v) <= UPLOAD_LIMITS.deckName) &&
    nullOr(x.deckLegendary, isKey) &&
    Array.isArray(x.deckCards) &&
    x.deckCards.length <= UPLOAD_LIMITS.deckCards &&
    x.deckCards.every(isKey) &&
    nullOr(x.deckCode, (v) => typeof v === "string" && v.length <= UPLOAD_LIMITS.deckCode && DECK_CODE_RE.test(v)) &&
    nullOr(x.rank, (v) => typeof v === "string" && chars(v) <= UPLOAD_LIMITS.rank && RANK_RE.test(v)) &&
    nullOr(x.oppLegendary, isKey) &&
    Array.isArray(x.oppPlayed) &&
    x.oppPlayed.length <= UPLOAD_LIMITS.oppPlayed &&
    x.oppPlayed.every(isKey) &&
    nullOr(x.turns, (v) => isIntIn(v, 0, UPLOAD_LIMITS.maxTurn)) &&
    Array.isArray(x.plays) &&
    x.plays.length <= UPLOAD_LIMITS.plays &&
    x.plays.every(playOk)
  );
}

/** I due campi del sito: patch (id di `patchOrder`) e archetipo (chiave di `archetypeLabels`), o null. */
export function serverFieldsOk(f: { patch: unknown; archetype: unknown }): boolean {
  return (f.patch === null || (typeof f.patch === "string" && PATCH_RE.test(f.patch))) && (f.archetype === null || (typeof f.archetype === "string" && ARCHETYPE_RE.test(f.archetype)));
}

/* ---------- codice di collegamento, token, errori ---------- */

/**
 * Codice di collegamento scritto dal giocatore → "ABCD-EFGH", o null se non ha 8 caratteri. Come `tracker_link_claim`:
 * i primi 40 caratteri, solo lettere e cifre, in maiuscolo (va bene anche "abcd efgh").
 */
export function normalizeLinkCode(input: unknown): string | null {
  const raw = String(input ?? "")
    .slice(0, 40)
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  return raw.length === LINK.length ? `${raw.slice(0, 4)}-${raw.slice(4)}` : null;
}

export const isTrackerToken = (v: unknown): v is string => typeof v === "string" && TOKEN_RE.test(v);

/** I codici con cui le funzioni del blocco TRACKER si rifiutano (`raise exception '<codice>'`). */
export const TRACKER_ERRORS = ["not_authenticated", "too_many_codes", "invalid_code", "too_many_devices", "invalid_token", "invalid_matches", "too_many_matches"] as const;
export type TrackerError = (typeof TRACKER_ERRORS)[number] | "unavailable" | "bad_request" | "error";

/** Il codice di un errore del database (messaggio di Postgres o di PostgREST), "error" se non è uno dei nostri. */
export function trackerErrorCode(message: string | null | undefined): TrackerError {
  const text = message ?? "";
  return TRACKER_ERRORS.find((c) => text.includes(c)) ?? "error";
}

/** Lo stato HTTP delle rotte /api/tracker/* per ogni errore. */
export function trackerErrorStatus(code: TrackerError): number {
  switch (code) {
    case "invalid_code":
    case "invalid_matches":
    case "bad_request":
      return 400;
    case "invalid_token":
    case "not_authenticated":
      return 401;
    case "too_many_devices":
      return 409;
    case "too_many_codes":
    case "too_many_matches":
      return 429;
    case "unavailable":
      return 503;
    default:
      return 500;
  }
}
