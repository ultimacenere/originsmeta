import type { BroadcastState } from "./state";

/**
 * Broadcasting OM in diretta (05/11/2026): errori e forme comuni al lato server (liveServer.ts) e alla memoria delle
 * prove in locale (liveDev.ts).
 */
export type LiveErrorCode = "login" | "unavailable" | "too_fast" | "invalid" | "too_many" | "invalid_code" | "forbidden" | "error";

export class LiveError extends Error {
  code: LiveErrorCode;
  constructor(code: LiveErrorCode) {
    super(code);
    this.code = code;
  }
}

export const LIVE_ERROR_STATUS: Record<LiveErrorCode, number> = {
  login: 401,
  unavailable: 503,
  too_fast: 429,
  invalid: 400,
  too_many: 429,
  invalid_code: 400,
  forbidden: 401,
  error: 500,
};

/** Errore del database → codice: funzione o tabella che mancano (migrazione non fatta) = "unavailable". */
export function liveErrorOf(error: { code?: string | null; message?: string | null }): LiveErrorCode {
  if (["PGRST202", "42883", "42P01", "42703"].includes(error.code ?? "")) return "unavailable";
  const m = error.message ?? "";
  if (m.includes("not_authenticated")) return "login";
  if (m.includes("too_fast")) return "too_fast";
  if (m.includes("invalid_state") || m.includes("invalid_image")) return "invalid";
  if (m.includes("too_many")) return "too_many";
  if (m.includes("invalid_code")) return "invalid_code";
  if (m.includes("forbidden")) return "forbidden";
  return "error";
}

export type LiveChannel = { id: string; login: string | null };
export type LiveInfo = { id: string; version: number; updatedAt: string; live: boolean; channels: LiveChannel[] };
export type LiveRow = { id: string | null; state: unknown; version: number; updatedAt: string };

/** Quello che la regia fa con la sua sessione. */
export type UserBackend = {
  username: string | null;
  info(create: boolean): Promise<LiveInfo | null>;
  save(state: BroadcastState): Promise<{ id: string; version: number; channels: string[] }>;
  clear(): Promise<{ id: string; version: number; channels: string[] } | null>;
  imagePut(data: string): Promise<string>;
  linkCode(): Promise<string>;
  unlink(channel: string): Promise<boolean>;
};

/** Quello che leggono l'overlay e l'estensione, e il collegamento dalla rotta dell'estensione. */
export type PublicBackend = {
  liveState(id: string): Promise<LiveRow | null>;
  channelState(channel: string): Promise<LiveRow | null>;
  imageGet(id: string, hash: string): Promise<string | null>;
  linkClaim(key: string, code: string, channel: string, login: string | null): Promise<string | null>;
};

/** Risposta di GET /api/broadcast/live alla regia. */
export type LiveInfoResponse = { username: string | null; live: LiveInfo | null; twitch: boolean };
