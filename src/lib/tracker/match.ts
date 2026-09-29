/**
 * Una partita registrata dal tracker (tracker/overlay, Fase 1, 29/09/2026): unisce la fine della partita letta dalla
 * cache del profilo (esito, ora, mazzo scelto: profile.ts) e il replay (mazzo avversario, rank, giocate: replay.ts).
 * Funzioni pure: il file system e i tempi di attesa li gestisce l'app.
 *
 * Il replay arriva a pochi secondi dalla cache (2 s nelle prove del 29/09/2026) e non contiene l'esito; i due si
 * abbinano per ora (`replayBelongsTo`). Senza replay la partita resta registrata con esito e mazzo.
 *
 * `TrackedMatch` è il record che l'app salva sul PC; al sito ne arriva solo una parte (`toUpload` di upload.ts: del
 * mazzo dell'avversario solo la Leggendaria e le carte che ha giocato, decisione di Pierluigi del 30/09/2026).
 * Versione 2 (30/09/2026): in più la coda (`queue`, "ranked" o "normal", da queue.ts). Le partite v1 già salvate sul PC
 * si leggono con `readTrackedMatch`, che le porta alla v2 con la coda "normal" (erano tutte della coda normale).
 * Regole (docs/tracker.md):
 * - **mai dire se l'avversario è un bot o una persona** (Pierluigi, 29/09/2026): niente flag bot, niente modalità del
 *   nome del file ("BotBattle"), niente rank dell'avversario (quello dei bot è un "Master" finto). Un test controlla
 *   che la stessa partita contro un bot o contro una persona dia lo stesso record;
 * - mai nomi né id di giocatori o partite: dell'id della partita resta un'impronta, calcolata con l'id dell'account
 *   come sale, così la stessa partita fra due utenti del tracker ha impronte diverse e non li collega.
 */
import { encodeGameCode } from "../deckcode";
import { cardBaseKey, isLegendaryKey, type ReplayMatch, type ReplayPlayer } from "./replay";
import type { GameDeck, MatchEnd } from "./profile";
import { isTrackQueue, type TrackQueue } from "./queue";

export const TRACKED_MATCH_VERSION = 2;
/** Distanza massima fra la fine della partita nella cache e la scrittura del replay. */
export const PAIR_WINDOW_MS = 120_000;

export type TrackedMatch = {
  v: typeof TRACKED_MATCH_VERSION;
  /** Impronta della partita (vedi `matchFingerprint`), unica per giocatore. */
  id: string;
  endedAt: string | null;
  result: "W" | "L" | null;
  /** Classificata o coda normale (queue.ts): serve solo alle statistiche del sito, non si mostra partita per partita. */
  queue: TrackQueue;
  deck: {
    /** Nome dato dal giocatore nel gioco, se il mazzo giocato è quello scelto nel profilo. */
    name: string | null;
    legendary: string | null;
    /** Le 13 carte senza variante cosmetica. */
    cards: string[];
    /** Codice del gioco (KGBLDC…), da incollare nel gioco o nel deck builder del sito. */
    code: string | null;
  };
  /** Rank del giocatore all'inizio della partita, come lo scrive il replay. */
  rank: string | null;
  /** Mazzo dell'avversario dal replay; null senza replay. */
  opponent: { legendary: string | null; cards: string[] } | null;
  arena: string | null;
  locationPool: string | null;
  turns: number | null;
  plays: { turn: number; me: boolean; card: string | null; lane: number | null }[];
  /** Esiti di partite finite senza che il tracker guardasse (dal più recente), senza altri dati. */
  missed: string;
};

/** Il replay scritto a `writtenAtMs` è quello della partita finita a `endedAt`? */
export function replayBelongsTo(endedAt: string | null, writtenAtMs: number, windowMs = PAIR_WINDOW_MS): boolean {
  const end = endedAt ? Date.parse(endedAt) : NaN;
  return Number.isFinite(end) && Number.isFinite(writtenAtMs) && Math.abs(writtenAtMs - end) <= windowMs;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Impronta della partita: SHA-256 di id dell'account + id della partita (32 caratteri esadecimali). */
export async function matchFingerprint(accountId: string | null, matchId: string | null, endedAt: string | null): Promise<string> {
  const source = matchId ? `om-tracker|${accountId ?? ""}|${matchId}` : `om-tracker|${accountId ?? ""}|t:${endedAt ?? ""}`;
  return (await sha256Hex(source)).slice(0, 32);
}

const sameCards = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const x = a.map(cardBaseKey).sort();
  const y = b.map(cardBaseKey).sort();
  return x.every((k, i) => k === y[i]);
};

/**
 * Il giocatore del tracker nel replay: quello con l'id dell'account; altrimenti l'unico non bot; altrimenti quello
 * con il mazzo scelto nel profilo; altrimenti il primo (il giocatore 0 in tutte le prove del 29/09/2026).
 */
export function pickMe(players: ReplayPlayer[], deck: GameDeck | null): ReplayPlayer | null {
  if (!players.length) return null;
  const byId = players.find((p) => p.isMe);
  if (byId) return byId;
  const humans = players.filter((p) => !p.isBot);
  if (humans.length === 1) return humans[0];
  const byDeck = deck ? players.filter((p) => sameCards(p.deck, deck.cards)) : [];
  if (byDeck.length === 1) return byDeck[0];
  return players[0];
}

export async function buildMatch(input: {
  end: MatchEnd;
  accountId: string | null;
  /** Il mazzo dell'inventario alla posizione `end.deckIndex`, se c'è. */
  deck: GameDeck | null;
  /** Il replay della partita, già letto con `readReplay(…, { accountId })`; null se non è arrivato. */
  replay: ReplayMatch | null;
  /** Coda della partita (`matchQueue` di queue.ts); "normal" se non si sa. */
  queue?: TrackQueue;
}): Promise<TrackedMatch> {
  const { end, accountId, deck, replay } = input;
  const me = replay ? pickMe(replay.players, deck) : null;
  const opp = replay && me ? (replay.players.find((p) => p !== me) ?? null) : null;

  // il mazzo giocato davvero è quello del replay; il nome viene dal profilo solo se le carte coincidono
  const played = me?.deck.length ? me.deck : (deck?.cards ?? []);
  const cards = played.map(cardBaseKey);
  const name = deck && sameCards(deck.cards, played) ? deck.name : null;
  const code = cards.length ? await encodeGameCode(cards) : null;

  return {
    v: TRACKED_MATCH_VERSION,
    id: await matchFingerprint(accountId, end.matchId, end.endedAt),
    endedAt: end.endedAt,
    result: end.result,
    queue: input.queue ?? "normal",
    deck: { name, legendary: cards.find(isLegendaryKey) ?? null, cards, code },
    rank: me?.rank ?? null,
    opponent: opp ? { legendary: opp.legendary ? cardBaseKey(opp.legendary) : null, cards: opp.deck.map(cardBaseKey) } : null,
    arena: replay?.arena ?? null,
    locationPool: replay?.locationPool ?? null,
    turns: replay ? replay.turns : null,
    plays: replay && me ? replay.plays.map((p) => ({ turn: p.turn, me: p.player === me.index, card: p.card ? cardBaseKey(p.card) : null, lane: p.lane })) : [],
    missed: end.missed,
  };
}

/**
 * Una partita letta dallo storico sul PC (una riga di `matches.jsonl`): v2 così com'è, v1 (Fase 2, 29/09/2026) portata
 * alla v2 con la coda "normal". Null per tutto il resto (riga rotta, versione futura, forma diversa).
 */
export function readTrackedMatch(raw: unknown): TrackedMatch | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const m = raw as Omit<Partial<TrackedMatch>, "v"> & { v?: unknown };
  if ((m.v !== 1 && m.v !== TRACKED_MATCH_VERSION) || typeof m.id !== "string" || !m.deck || typeof m.deck !== "object" || !Array.isArray(m.plays)) return null;
  return { ...(m as TrackedMatch), v: TRACKED_MATCH_VERSION, queue: isTrackQueue(m.queue) ? m.queue : "normal" };
}
