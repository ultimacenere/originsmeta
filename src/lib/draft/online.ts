/**
 * Draft online fra due persone (fase 2, 02/10/2026; Pierluigi: "ok pusha su main e passa alla fase 2", con l'accesso
 * obbligatorio deciso prima). Regole pure, senza database: le usano le Server Action (`onlineActions.ts`) e i test.
 *
 * Lo stato di una stanza è il draft del motore (`engine.ts`) più due cose della partita a distanza:
 * - una **scadenza** per le decisioni in corso: allo scadere il Cervello sceglie al posto di chi è in ritardo (meglio
 *   di una carta a caso, e il draft non si blocca mai);
 * - chi ha **lasciato** la stanza: da lì in poi per lui sceglie il Cervello, subito, così l'altro finisce senza aspettare.
 * Le mosse le convalida sempre il server con `applyAction`; al browser va solo `viewFor` (engine.ts).
 */
import { applyAction, viewFor, type DraftAction, type DraftState, type Seat } from "./engine";
import { botAction, type BotKit } from "./bot";

export type OnlineState = {
  v: 1;
  draft: DraftState;
  /** fine del tempo per le decisioni in corso, in millisecondi; null a draft finito */
  deadline: number | null;
  /** posti lasciati: per loro sceglie il Cervello */
  left: [boolean, boolean];
};

/** Secondi per decisione, per tipo: le Leggendarie e la costruzione chiedono di più. */
export const TIMERS = {
  legendary: 45,
  pick: 30,
  keepGive: 45,
  packPick: 35,
  build: 240,
} as const;

export function decisionSeconds(draft: DraftState): number {
  if (draft.phase === "build") return TIMERS.build;
  if (draft.phase === "legendary") return TIMERS.legendary;
  if (draft.format === "exchange") return TIMERS.keepGive;
  if (draft.format === "packs") return TIMERS.packPick;
  return TIMERS.pick;
}

/** È cominciata una decisione nuova (giro, fase o turno)? Allora la scadenza riparte con il tempo intero. */
function nextDeadline(before: DraftState, after: DraftState, deadline: number | null, now: number): number | null {
  if (after.phase === "done") return null;
  const newTurn = before.phase !== after.phase || before.round !== after.round || after.seats.some((s, i) => s.pending && !before.seats[i].pending);
  return newTurn || deadline === null ? now + decisionSeconds(after) * 1000 : deadline;
}

export function startOnline(draft: DraftState, now: number): OnlineState {
  return { v: 1, draft, deadline: now + decisionSeconds(draft) * 1000, left: [false, false] };
}

/**
 * Il Cervello muove per chi ha lasciato e, a tempo scaduto, per chi è in ritardo. Una decisione nuova riparte con il
 * suo tempo intero: nel Tris, se il primo è in ritardo, il secondo non perde il suo turno.
 */
export function autoplay(st: OnlineState, now: number, kit: BotKit): OnlineState {
  let draft = st.draft;
  let deadline = st.deadline;
  for (let guard = 0; guard < 200 && draft.phase !== "done"; guard++) {
    const expired = deadline !== null && now >= deadline;
    const seat = ([0, 1] as Seat[]).find((s) => draft.seats[s].pending && (st.left[s] || expired));
    if (seat === undefined) break;
    const res = applyAction(draft, botAction(draft, seat, kit));
    if (!("state" in res)) break;
    deadline = nextDeadline(draft, res.state, deadline, now);
    draft = res.state;
  }
  return { ...st, draft, deadline: draft.phase === "done" ? null : deadline };
}

export type OnlineError = "notYourTurn" | "badCard" | "sameCard" | "badDeck" | "finished";

/** La mossa di un giocatore: prima le mosse automatiche dovute, poi la sua (il posto lo decide il server). */
export function playOnline(st: OnlineState, seat: Seat, action: DraftAction, now: number, kit: BotKit): { state: OnlineState } | { error: OnlineError } {
  const ready = autoplay(st, now, kit);
  const res = applyAction(ready.draft, { ...action, seat } as DraftAction);
  if (!("state" in res)) return { error: res.error };
  const deadline = nextDeadline(ready.draft, res.state, ready.deadline, now);
  return { state: autoplay({ ...ready, draft: res.state, deadline }, now, kit) };
}

/** Chi lascia la stanza: per lui sceglie il Cervello da subito. */
export function leaveOnline(st: OnlineState, seat: Seat, now: number, kit: BotKit): OnlineState {
  const left: [boolean, boolean] = [st.left[0] || seat === 0, st.left[1] || seat === 1];
  return autoplay({ ...st, left }, now, kit);
}

/** Quello che il browser riceve: la vista del suo posto, la scadenza e chi ha lasciato. */
export type OnlineView = { draft: DraftState; deadline: number | null; left: [boolean, boolean]; seat: Seat };

export function onlineView(st: OnlineState, seat: Seat): OnlineView {
  return { draft: viewFor(st.draft, seat), deadline: st.deadline, left: st.left, seat };
}

/* ------------------------------------------------------------------------------------------------ codici delle stanze */

/** Lettere e cifre senza quelle che si confondono (0/O, 1/I/L): un codice da dettare a voce in diretta. */
export const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/;

export function newRoomCode(rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) out += ROOM_ALPHABET[Math.floor(rand() * ROOM_ALPHABET.length)];
  return out;
}

/** Codice scritto a mano: maiuscole, senza spazi né trattini. */
export function normalizeRoomCode(input: string): string | null {
  const c = (input ?? "").toUpperCase().replace(/[\s-]/g, "");
  return ROOM_CODE_RE.test(c) ? c : null;
}

/* ------------------------------------------------------------------------------------------------ errori */

export type RoomError =
  | "signin"
  | "unavailable"
  | "not_found"
  | "forbidden"
  | "rate_limited"
  | "room_full"
  | "own_room"
  | "not_invited"
  | "rematch_exists"
  | "busy"
  | "db"
  | OnlineError;

/** Gli errori che le funzioni del blocco DRAFT ONLINE alzano con `raise exception`, per messaggio. */
const RAISED: Record<string, RoomError> = {
  not_signed_in: "signin",
  forbidden: "forbidden",
  rate_limited: "rate_limited",
  bad_rematch: "forbidden",
  rematch_exists: "rematch_exists",
  not_found: "not_found",
  room_full: "room_full",
  own_room: "own_room",
  not_invited: "not_invited",
  not_drafting: "finished",
};

/** Errore del database → errore della stanza. Funzione o tabella mancante = migrazione da fare ("unavailable"). */
export function roomErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): RoomError {
  if (!error) return "db";
  if (["42P01", "42883", "42703", "PGRST200", "PGRST202", "PGRST205"].includes(error.code ?? "")) return "unavailable";
  const msg = (error.message ?? "").trim();
  return Object.hasOwn(RAISED, msg) ? RAISED[msg] : "db";
}

/** Stanza valida? Serve alla Server Action prima di leggere il JSON dal database. */
export function isOnlineState(x: unknown): x is OnlineState {
  const s = x as OnlineState;
  return Boolean(s && s.v === 1 && s.draft && s.draft.v === 1 && Array.isArray(s.draft.seats) && s.draft.seats.length === 2 && Array.isArray(s.left));
}
