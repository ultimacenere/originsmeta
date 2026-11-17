/**
 * Primo accesso con Steam senza un account collegato (18/11/2026, dopo il caso Tankready del 17/11: entrato con
 * "Continua con Steam" prima di collegare Steam, si era ritrovato un secondo account vuoto). Il ritorno da Steam non crea
 * più l'account da solo: scrive questo cookie con lo SteamID appena confermato da Steam e porta alla pagina di accesso
 * con `?steam=new`, dove si sceglie fra "Crea l'account con Steam" (con il nome) e "Ho già un account" (si entra con
 * Discord o con l'email e Steam si collega a quell'account). Regole e indirizzi del browser in firstLogin.ts.
 *
 * Il cookie è firmato con il segreto del server (HMAC-SHA256 con CRON_SECRET, la stessa chiave che steam_link_set
 * ricontrolla): il browser non può scriverne uno con lo SteamID di un altro. Vale 10 minuti, solo per le rotte /auth
 * (il ritorno /auth/callback e le rotte /auth/steam), httpOnly. Porta anche il nome del profilo Steam, se il server è
 * riuscito a leggerlo, per proporlo come nome sul sito. Funzioni pure (node:crypto): test in steam.test.ts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isSteamId } from "./openid";

export const STEAM_PENDING_COOKIE = "om_steam_new";
export const STEAM_PENDING_COOKIE_PATH = "/auth";
export const STEAM_PENDING_MAX_AGE_S = 600;
/** Il nome del profilo Steam si tiene al massimo di questa lunghezza (il nome sul sito ne ammette 40). */
const NAME_MAX = 64;
const RAW_MAX = 1000;

/** id = SteamID64 confermato da Steam, name = nome del profilo Steam (o null), t = ora del ritorno da Steam. */
export type SteamPending = { id: string; name: string | null; t: number };

/** Il segreto basta per firmare (stessa soglia di CRON_SECRET in tutto il sito). */
export function pendingSecretOk(secret: string | null | undefined): secret is string {
  return typeof secret === "string" && secret.trim().length >= 32;
}

function sign(payload: string, secret: string): string {
  // prefisso di dominio: la stessa chiave serve anche ad altro (cron, steam_link_set)
  return createHmac("sha256", secret.trim()).update(`originsmeta-steam-pending\n${payload}`).digest("base64url");
}

export function encodeSteamPending(p: SteamPending, secret: string): string {
  const name = p.name ? p.name.trim().slice(0, NAME_MAX) : "";
  const payload = Buffer.from(JSON.stringify({ i: p.id, n: name || null, t: p.t }), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Il cookie, se è firmato con questo segreto, intatto e ha meno di 10 minuti; altrimenti null. */
export function decodeSteamPending(raw: string | null | undefined, secret: string | null | undefined, now = Date.now()): SteamPending | null {
  if (!raw || raw.length > RAW_MAX || !pendingSecretOk(secret)) return null;
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]{43}$/.test(sig)) return null;
  const given = Buffer.from(sig, "utf8");
  const expected = Buffer.from(sign(payload, secret), "utf8");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const v = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { i?: unknown; n?: unknown; t?: unknown } | null;
    if (!v || typeof v !== "object" || !isSteamId(v.i)) return null;
    if (typeof v.t !== "number" || !Number.isFinite(v.t)) return null;
    const age = now - v.t;
    if (age < -60_000 || age > STEAM_PENDING_MAX_AGE_S * 1000) return null;
    const name = typeof v.n === "string" && v.n.trim() ? v.n.trim().slice(0, NAME_MAX) : null;
    return { id: v.i, name, t: v.t };
  } catch {
    return null;
  }
}

/** Le opzioni del cookie (per scriverlo: `maxAge` pieno; per toglierlo: `clear`). */
export function steamPendingCookieOptions(secure: boolean, clear = false) {
  return { httpOnly: true, sameSite: "lax" as const, secure, path: STEAM_PENDING_COOKIE_PATH, maxAge: clear ? 0 : STEAM_PENDING_MAX_AGE_S };
}
