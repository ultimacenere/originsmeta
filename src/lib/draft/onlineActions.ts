"use server";

import { currentUser } from "@/lib/supabase/server";
import type { Db } from "@/lib/supabase/public";
import { botKit } from "./bot";
import { DRAFT_FORMATS, DECK_BASE, createDraft, newSeed, type DraftAction, type DraftFormat, type Seat } from "./engine";
import {
  autoplay,
  isOnlineState,
  leaveOnline,
  newRoomCode,
  normalizeRoomCode,
  onlineView,
  playOnline,
  roomErrorCode,
  startOnline,
  type OnlineState,
  type OnlineView,
  type RoomError,
} from "./online";
import { draftPool } from "./pool";

/**
 * Server Action del draft online (fase 2, 02/10/2026). Ogni mossa passa da qui: il server legge la stanza con la
 * sessione del giocatore, decide il suo posto dal database (mai dal browser), fa giocare il Cervello per chi è in
 * ritardo o ha lasciato (`autoplay`), applica la mossa con il motore e salva solo se nessuno ha scritto nel frattempo
 * (versione), altrimenti rilegge e riprova. Al browser torna solo la vista del suo posto.
 *
 * Le funzioni del database (blocco DRAFT ONLINE di schema.sql) vogliono anche il segreto del cron (`CRON_SECRET`, già su
 * Vercel e registrato con scripts/set-cron-key.mjs): così nessun iscritto può scrivere uno stato inventato via API.
 * Senza segreto o prima della migrazione tutto risponde "unavailable" e la pagina lo dice.
 */

const pool = draftPool();
const kit = botKit(pool);
const RETRIES = 4;

export type RoomInfo = {
  id: string;
  code: string;
  format: DraftFormat;
  status: "waiting" | "drafting" | "done";
  creatorName: string | null;
  joinerName: string | null;
  /** il mio posto: 0 chi ha creato la stanza, 1 chi è entrato; null se non gioco qui */
  seat: Seat | null;
  /** rivincita proposta: codice della stanza nuova */
  nextCode: string | null;
  /** la stanza è una rivincita riservata a me */
  invitedMe: boolean;
  /** posso entrare (stanza in attesa, non mia, libera o riservata a me) */
  canJoin: boolean;
  version: number;
};

export type RoomResult = { ok: true; room: RoomInfo; view: OnlineView | null; now: number } | { ok: false; error: RoomError };

function secret(): string | null {
  const s = process.env.CRON_SECRET?.trim() ?? "";
  return s.length >= 32 ? s : null;
}

type Ctx = { sb: Db; uid: string; key: string };

async function context(): Promise<Ctx | RoomError> {
  const key = secret();
  if (!key) return "unavailable";
  const { supabase, user } = await currentUser();
  if (!supabase) return "unavailable";
  if (!user) return "signin";
  return { sb: supabase, uid: user.id, key };
}

type Loaded = { room: RoomInfo; state: OnlineState | null };

async function read(ctx: Ctx, code: string): Promise<Loaded | RoomError> {
  const { data, error } = await ctx.sb.rpc("draft_room_get", { p_key: ctx.key, p_code: code });
  if (error) return roomErrorCode(error);
  const r = Array.isArray(data) ? data[0] : null;
  if (!r) return "not_found";
  const seat = r.seat === 0 || r.seat === 1 ? (r.seat as Seat) : null;
  const invitedMe = r.invited === ctx.uid;
  const room: RoomInfo = {
    id: r.id,
    code: r.code,
    format: r.format,
    status: r.status,
    creatorName: r.creator_name,
    joinerName: r.joiner_name,
    seat,
    nextCode: r.next_code,
    invitedMe,
    canJoin: r.status === "waiting" && r.creator !== ctx.uid && !r.joiner && (!r.invited || invitedMe),
    version: r.version,
  };
  return { room, state: seat !== null && isOnlineState(r.state) ? r.state : null };
}

async function write(ctx: Ctx, room: RoomInfo, state: OnlineState): Promise<"ok" | "conflict" | RoomError> {
  const { data, error } = await ctx.sb.rpc("draft_room_put", {
    p_key: ctx.key,
    p_code: room.code,
    p_version: room.version,
    p_state: state,
    p_done: state.draft.phase === "done",
  });
  if (error) return roomErrorCode(error);
  return typeof data === "number" ? "ok" : "conflict";
}

const result = (loaded: Loaded): RoomResult => ({
  ok: true,
  room: loaded.room,
  view: loaded.state && loaded.room.seat !== null ? onlineView(loaded.state, loaded.room.seat) : null,
  now: Date.now(),
});

/**
 * Cambia lo stato di una stanza con `change` (null = niente da fare) e salva, riprovando se un'altra richiesta ha
 * scritto nel frattempo. Prima di ogni cambio fa giocare il Cervello dove è dovuto.
 */
async function update(code: string, change: (st: OnlineState, seat: Seat, now: number) => OnlineState | RoomError | null): Promise<RoomResult> {
  const c = normalizeRoomCode(code);
  if (!c) return { ok: false, error: "not_found" };
  const ctx = await context();
  if (typeof ctx === "string") return { ok: false, error: ctx };
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const loaded = await read(ctx, c);
    if (typeof loaded === "string") return { ok: false, error: loaded };
    const { room, state } = loaded;
    if (room.status !== "drafting" || room.seat === null || !state) return result(loaded);
    const now = Date.now();
    const ready = autoplay(state, now, kit);
    const next = change(ready, room.seat, now);
    if (typeof next === "string") {
      // la mossa non vale (per esempio è scaduto il tempo e ha scelto il Cervello): si salva comunque il giro automatico
      if (ready !== state && JSON.stringify(ready) !== JSON.stringify(state)) await write(ctx, room, ready);
      return { ok: false, error: next };
    }
    const target = next ?? ready;
    if (JSON.stringify(target) === JSON.stringify(state)) return result(loaded);
    const saved = await write(ctx, room, target);
    if (saved === "ok") return result({ room: { ...room, version: room.version + 1, status: target.draft.phase === "done" ? "done" : "drafting" }, state: target });
    if (saved !== "conflict") return { ok: false, error: saved };
  }
  return { ok: false, error: "busy" };
}

/** La stanza com'è adesso (e, se è il momento, le mosse del Cervello per chi è in ritardo). */
export async function loadDraftRoom(code: string): Promise<RoomResult> {
  return update(code, () => null);
}

/** Crea una stanza in attesa dell'avversario. `from`: la stanza finita da cui parte la rivincita. */
export async function createDraftRoom(format: string, from?: string): Promise<{ ok: true; code: string } | { ok: false; error: RoomError }> {
  if (!DRAFT_FORMATS.includes(format as DraftFormat)) return { ok: false, error: "forbidden" };
  const prev = from ? normalizeRoomCode(from) : null;
  if (from && !prev) return { ok: false, error: "not_found" };
  const ctx = await context();
  if (typeof ctx === "string") return { ok: false, error: ctx };
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newRoomCode();
    const { error } = await ctx.sb.rpc("draft_room_create", { p_key: ctx.key, p_code: code, p_format: format, p_from: prev });
    if (!error) return { ok: true, code };
    // codice già usato (raro): se ne prova un altro
    if (error.code !== "23505") return { ok: false, error: roomErrorCode(error) };
  }
  return { ok: false, error: "busy" };
}

/** Entra nella stanza: il draft parte subito, con un seme nuovo che nessuno dei due conosce. */
export async function joinDraftRoom(code: string): Promise<RoomResult> {
  const c = normalizeRoomCode(code);
  if (!c) return { ok: false, error: "not_found" };
  const ctx = await context();
  if (typeof ctx === "string") return { ok: false, error: ctx };
  const loaded = await read(ctx, c);
  if (typeof loaded === "string") return { ok: false, error: loaded };
  if (!loaded.room.canJoin) return loaded.room.seat !== null ? result(loaded) : { ok: false, error: "room_full" };
  const state = startOnline(createDraft(loaded.room.format, newSeed(), pool), Date.now());
  const { error } = await ctx.sb.rpc("draft_room_join", { p_key: ctx.key, p_code: c, p_state: state });
  if (error) return { ok: false, error: roomErrorCode(error) };
  return loadDraftRoom(c);
}

/** Una mossa del giocatore. Il posto lo decide il database; la forma della mossa si ricontrolla qui. */
export async function moveDraftRoom(code: string, action: DraftAction): Promise<RoomResult> {
  const clean = cleanAction(action);
  if (!clean) return { ok: false, error: "badCard" };
  return update(code, (st, seat, now) => {
    const res = playOnline(st, seat, clean, now, kit);
    return "state" in res ? res.state : res.error;
  });
}

/** Lascia il draft: da qui in poi per te sceglie il Cervello, e l'avversario finisce senza aspettare. */
export async function leaveDraftRoom(code: string): Promise<RoomResult> {
  return update(code, (st, seat, now) => leaveOnline(st, seat, now, kit));
}

const str = (x: unknown): x is string => typeof x === "string" && x.length > 0 && x.length <= 80;

function cleanAction(a: DraftAction): DraftAction | null {
  if (!a || typeof a !== "object") return null;
  // il posto lo mette il server: quello del browser non conta
  if (a.type === "pick" && str(a.card)) return { seat: 0, type: "pick", card: a.card };
  if (a.type === "keepGive" && str(a.keep) && str(a.give)) return { seat: 0, type: "keepGive", keep: a.keep, give: a.give };
  if (a.type === "build" && str(a.legendary) && Array.isArray(a.cards) && a.cards.length === DECK_BASE && a.cards.every(str)) {
    return { seat: 0, type: "build", legendary: a.legendary, cards: [...a.cards] };
  }
  return null;
}
