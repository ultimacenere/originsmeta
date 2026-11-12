"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { parseConfig, configWarnings } from "./config";
import { pauseRun, resumeRun, skipRun, startRun, stopRun } from "./clock";
import { cryptoRand, newDraw, nextRound, setWinner, spin, undoRound, undoSpin } from "./engine";
import { isCodeShape, normalizeCode, twitchLogin } from "./codes";
import { parseControlEvent, parseModEvent } from "./view";
import type { AssignResult, AssignStatus, Assignment, ControlEvent, EventConfig, EventState, ModEvent, RedeemStatus } from "./types";

/**
 * Server Action degli eventi della community (10/11/2026). Chi può fare che cosa lo decide il database (blocco
 * "10/11/2026: EVENTI DELLA COMMUNITY"): la regia con il suo link o da staff, il mod con il link del suo canale, il
 * riscatto con l'accesso fatto. Qui si controllano le forme, si applicano le mosse del motore (engine.ts, clock.ts) e si
 * salva con il numero di versione: se un altro caster ha salvato nel frattempo, si rilegge e si riprova una volta.
 */

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const okSlug = (s: unknown): s is string => typeof s === "string" && s.length >= 3 && s.length <= 60 && SLUG_RE.test(s);
const okToken = (t: unknown): t is string => typeof t === "string" && t.length >= 32 && t.length <= 200 && /^[A-Za-z0-9_-]+$/.test(t);
const tokenOrNull = (t: unknown): string | null => (okToken(t) ? t : null);

export type ActionError = { ok: false; error: string; errors?: string[] };

function errorCode(error: { code?: string; message?: string } | null | undefined): string {
  const msg = error?.message ?? "";
  for (const k of ["forbidden", "conflict", "invalid_config", "invalid_state", "exists", "not_found", "bad_slot", "not_your_slot", "bad_count", "invalid_slug", "not_logged_in"]) {
    if (msg.includes(k)) return k;
  }
  if (error?.code === "PGRST202" || /could not find the function/i.test(msg)) return "unavailable";
  return "unavailable";
}

const page = (slug: string) => `/it/events/${slug}`;

/* ---------- regia ---------- */

async function readControl(slug: string, token: string | null): Promise<{ ok: true; event: ControlEvent } | ActionError> {
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_control", { p_slug: slug, p_token: token });
  if (error) return { ok: false, error: errorCode(error) };
  const event = parseControlEvent(data);
  return event ? { ok: true, event } : { ok: false, error: "not_found" };
}

/** La regia: tutto l'evento. `not_found` per lo staff vuol dire "l'evento non c'è ancora". */
export async function loadControl(slug: string, token: string | null): Promise<{ ok: true; event: ControlEvent; warnings: string[] } | ActionError> {
  if (!okSlug(slug)) return { ok: false, error: "not_found" };
  const r = await readControl(slug, tokenOrNull(token));
  if (!r.ok) return r;
  return { ...r, warnings: configWarnings(r.event.config, r.event.codes.total) };
}

export type ControlOp =
  | { type: "spin" }
  | { type: "undoSpin" }
  | { type: "newDraw" }
  | { type: "nextRound" }
  | { type: "undoRound" }
  | { type: "winner"; match: string; winner: string | null }
  | { type: "giveaway"; op: "start" | "skip" | "pause" | "resume" | "stop"; index?: number }
  | { type: "config"; config: unknown };

/** Una mossa della regia. Con "spin" torna anche il giro della ruota, per l'animazione. */
export async function controlAction(
  slug: string,
  token: string | null,
  op: ControlOp,
): Promise<{ ok: true; event: ControlEvent; warnings: string[]; assignment?: Assignment } | ActionError> {
  if (!okSlug(slug) || !op || typeof op !== "object") return { ok: false, error: "forbidden" };
  const tok = tokenOrNull(token);
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await readControl(slug, tok);
    if (!cur.ok) return cur;
    let config: EventConfig | null = null;
    let state: EventState | null = null;
    let assignment: Assignment | undefined;
    const ev = cur.event;
    const now = Date.now();
    switch (op.type) {
      case "config": {
        const parsed = parseConfig(op.config, "strict");
        if (parsed.errors.length) return { ok: false, error: "invalid_config", errors: parsed.errors.slice(0, 30) };
        config = parsed.config;
        break;
      }
      case "spin": {
        const r = spin(ev.config, ev.state, cryptoRand(), now);
        if (!r.ok) return { ok: false, error: r.error };
        state = r.state;
        assignment = r.assignment;
        break;
      }
      case "undoSpin":
      case "newDraw":
      case "nextRound":
      case "undoRound": {
        const r =
          op.type === "undoSpin"
            ? undoSpin(ev.state)
            : op.type === "newDraw"
              ? newDraw(ev.config, ev.state, cryptoRand())
              : op.type === "nextRound"
                ? nextRound(ev.config, ev.state, cryptoRand())
                : undoRound(ev.state);
        if (!r.ok) return { ok: false, error: r.error };
        state = r.state;
        break;
      }
      case "winner": {
        if (typeof op.match !== "string" || (op.winner !== null && typeof op.winner !== "string")) return { ok: false, error: "bad_winner" };
        const r = setWinner(ev.state, op.match, op.winner);
        if (!r.ok) return { ok: false, error: r.error };
        state = r.state;
        break;
      }
      case "giveaway": {
        const slots = ev.config.slots;
        const run = ev.state.giveaway;
        const index = Number.isInteger(op.index) && (op.index as number) >= 0 && (op.index as number) < slots.length ? (op.index as number) : 0;
        const next =
          op.op === "start" ? startRun(now, index) : op.op === "skip" ? skipRun(slots, run, now) : op.op === "pause" ? pauseRun(slots, run, now) : op.op === "resume" ? resumeRun(run, now) : stopRun();
        state = { ...ev.state, giveaway: next };
        break;
      }
      default:
        return { ok: false, error: "forbidden" };
    }
    const { error } = await sb.rpc("community_event_save", { p_slug: slug, p_token: tok, p_config: config, p_state: state, p_version: ev.version });
    if (error) {
      const code = errorCode(error);
      if (code === "conflict" && attempt === 0) continue;
      return { ok: false, error: code };
    }
    revalidatePath(page(slug));
    const fresh = await readControl(slug, tok);
    if (!fresh.ok) return fresh;
    return { ...fresh, warnings: configWarnings(fresh.event.config, fresh.event.codes.total), ...(assignment ? { assignment } : {}) };
  }
  return { ok: false, error: "conflict" };
}

/** Lo staff crea l'evento: il link della regia. */
export async function createEvent(slug: string, config: unknown): Promise<{ ok: true; token: string } | ActionError> {
  if (!okSlug(slug)) return { ok: false, error: "invalid_slug" };
  const parsed = parseConfig(config, "strict");
  if (parsed.errors.length) return { ok: false, error: "invalid_config", errors: parsed.errors.slice(0, 30) };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_create", { p_slug: slug, p_config: parsed.config });
  if (error || typeof data !== "string") return { ok: false, error: errorCode(error) };
  revalidatePath(page(slug));
  return { ok: true, token: data };
}

/** Lo staff cambia il link della regia (il vecchio smette di valere). */
export async function rotateControl(slug: string): Promise<{ ok: true; token: string } | ActionError> {
  if (!okSlug(slug)) return { ok: false, error: "not_found" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_rotate", { p_slug: slug });
  if (error || typeof data !== "string") return { ok: false, error: errorCode(error) };
  return { ok: true, token: data };
}

/** Lo staff, a pacchetti consegnati, toglie dai codici le impronte dei vincitori e gli account (restano i conteggi). */
export async function forgetWinners(slug: string): Promise<{ ok: true; cleared: number } | ActionError> {
  if (!okSlug(slug)) return { ok: false, error: "not_found" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_forget", { p_slug: slug });
  if (error || typeof data !== "number") return { ok: false, error: errorCode(error) };
  return { ok: true, cleared: data };
}

/** La regia genera `count` codici in più (al massimo 500 per evento). */
export async function addCodes(slug: string, token: string | null, count: number): Promise<{ ok: true; total: number } | ActionError> {
  if (!okSlug(slug) || !Number.isInteger(count) || count < 1 || count > 500) return { ok: false, error: "bad_count" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_codes_add", { p_slug: slug, p_token: tokenOrNull(token), p_count: count });
  if (error || typeof data !== "number") return { ok: false, error: errorCode(error) };
  return { ok: true, total: data };
}

/** La regia crea i link dei mod per i canali degli slot. */
export async function syncMods(slug: string, token: string | null): Promise<{ ok: true } | ActionError> {
  if (!okSlug(slug)) return { ok: false, error: "not_found" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { error } = await sb.rpc("community_event_mods_sync", { p_slug: slug, p_token: tokenOrNull(token) });
  if (error) return { ok: false, error: errorCode(error) };
  return { ok: true };
}

/* ---------- mod ---------- */

export async function loadMod(slug: string, token: string): Promise<{ ok: true; event: ModEvent } | ActionError> {
  if (!okSlug(slug) || !okToken(token)) return { ok: false, error: "forbidden" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_mod_view", { p_slug: slug, p_token: token });
  if (error) return { ok: false, error: errorCode(error) };
  const event = parseModEvent(data);
  return event ? { ok: true, event } : { ok: false, error: "forbidden" };
}

const ASSIGN_STATUSES: readonly AssignStatus[] = ["ok", "dup", "full", "none", "invalid"];

/** Il mod dà i codici ai vincitori di uno slot del suo canale (nomi Twitch; quelli non validi tornano "invalid"). */
export async function assignCodes(slug: string, token: string, slot: number, logins: string[]): Promise<{ ok: true; results: AssignResult[] } | ActionError> {
  if (!okSlug(slug) || !okToken(token) || !Number.isInteger(slot) || slot < 0 || !Array.isArray(logins) || logins.length > 100) return { ok: false, error: "forbidden" };
  const clean = logins.map((l) => (typeof l === "string" ? (twitchLogin(l) ?? l.slice(0, 25)) : ""));
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_assign", { p_slug: slug, p_token: token, p_slot: slot, p_logins: clean });
  if (error) return { ok: false, error: errorCode(error) };
  const results: AssignResult[] = Array.isArray(data)
    ? data.flatMap((x) => {
        if (!x || typeof x !== "object") return [];
        const o = x as Record<string, unknown>;
        const status = (ASSIGN_STATUSES as readonly string[]).includes(String(o.status)) ? (o.status as AssignStatus) : "invalid";
        return [{ login: String(o.login ?? ""), status, ...(typeof o.code === "string" ? { code: o.code } : {}), ...(typeof o.redeemed === "boolean" ? { redeemed: o.redeemed } : {}) }];
      })
    : [];
  return { ok: true, results };
}

/** Il codice non riscattato passa a un altro vincitore. */
export async function swapCode(slug: string, token: string, code: string, login: string): Promise<{ ok: true; status: string } | ActionError> {
  if (!okSlug(slug) || !okToken(token) || !isCodeShape(code)) return { ok: false, error: "forbidden" };
  const lg = twitchLogin(login);
  if (!lg) return { ok: true, status: "invalid" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_swap", { p_slug: slug, p_token: token, p_code: normalizeCode(code), p_login: lg });
  if (error) return { ok: false, error: errorCode(error) };
  return { ok: true, status: String(data) };
}

/** Il codice non riscattato torna libero. */
export async function releaseCode(slug: string, token: string, code: string): Promise<{ ok: true; status: string } | ActionError> {
  if (!okSlug(slug) || !okToken(token) || !isCodeShape(code)) return { ok: false, error: "forbidden" };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "unavailable" };
  const { data, error } = await sb.rpc("community_event_release", { p_slug: slug, p_token: token, p_code: normalizeCode(code) });
  if (error) return { ok: false, error: errorCode(error) };
  return { ok: true, status: String(data) };
}

/* ---------- riscatto ---------- */

const REDEEM: readonly RedeemStatus[] = ["ok", "mine", "taken", "invalid", "limit", "too_many", "closed"];

/** Un iscritto riscatta un codice. */
export async function redeemCode(slug: string, code: string): Promise<RedeemStatus> {
  if (!okSlug(slug)) return "invalid";
  if (typeof code !== "string" || code.length > 40 || !isCodeShape(code)) return "invalid";
  const sb = await supabaseServer();
  if (!sb) return "unavailable";
  const { data: auth } = await sb.auth.getClaims();
  if (!auth?.claims?.sub) return "not_logged_in";
  const { data, error } = await sb.rpc("community_event_redeem", { p_slug: slug, p_code: normalizeCode(code) });
  if (error) {
    const c = errorCode(error);
    return c === "not_logged_in" || c === "forbidden" ? "not_logged_in" : "unavailable";
  }
  return (REDEEM as readonly string[]).includes(String(data)) ? (data as RedeemStatus) : "unavailable";
}

/** I codici riscattati dall'iscritto della sessione (vuoto senza accesso). */
export async function myCodes(slug: string): Promise<{ code: string; at: string }[]> {
  if (!okSlug(slug)) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data: auth } = await sb.auth.getClaims();
  if (!auth?.claims?.sub) return [];
  const { data, error } = await sb.rpc("community_event_my_codes", { p_slug: slug });
  if (error || !Array.isArray(data)) return [];
  return data.map((r) => ({ code: r.code, at: r.redeemed_at }));
}
