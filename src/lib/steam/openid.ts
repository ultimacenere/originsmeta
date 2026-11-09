/**
 * Accesso e collegamento con Steam (09/11/2026, Pierluigi: "nel profilo dei nostri giocatori, dare la possibilità di
 * connettersi anche a steam con il profilo id. e viceversa perché creiamo la possibilità di registrarsi usando il loro
 * steamid").
 *
 * Steam non ha OAuth: usa OpenID 2.0 ("Sign in through Steam"). Nessuna chiave e nessun token: Steam conferma chi è
 * l'utente e dà al sito solo il suo SteamID64. Il giro:
 * 1. /auth/steam scrive un cookie tecnico con uno stato casuale (`encodeSteamState`) e rimanda a Steam
 *    (`steamLoginUrl`), con l'indirizzo di ritorno /auth/steam/callback?s=<stato>;
 * 2. su Steam l'utente entra e conferma; Steam torna a quell'indirizzo con la sua asserzione firmata (parametri openid.*);
 * 3. il ritorno controlla che lo stato sia quello del cookie, cioè che il giro sia partito da questo browser (niente
 *    accesso forzato nell'account di un altro né account Steam di un altro collegato al proprio profilo), che
 *    l'asserzione venga da Steam, torni proprio qui e sia fresca (`checkAssertion`), e la fa confermare a Steam
 *    (`confirmWithSteam`, check_authentication): senza quest'ultimo passo chiunque potrebbe scriversi lo SteamID di un
 *    altro nell'indirizzo.
 *
 * Funzioni pure, senza dipendenze (la chiamata a Steam riceve `fetch`): test in steam.test.ts.
 */

export const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";

/**
 * SteamID64 di un account personale: 17 cifre che iniziano con 7656119. Stessa espressione nel blocco "09/11/2026: STEAM"
 * di supabase/schema.sql (vincolo di steam_links e controllo di steam_link_set; steam.test.ts le confronta).
 */
export const STEAM_ID_PATTERN = "^7656119[0-9]{10}$";
const steamIdRe = new RegExp(STEAM_ID_PATTERN);
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(7656119[0-9]{10})$/;

/** Ritorno da Steam: il percorso e il parametro con lo stato. */
export const STEAM_CALLBACK_PATH = "/auth/steam/callback";
export const STEAM_STATE_PARAM = "s";
/** Cookie tecnico del giro (stato, modo, pagina di ritorno): vale 10 minuti e una volta sola. */
export const STEAM_STATE_COOKIE = "om_steam";
export const STEAM_STATE_COOKIE_PATH = "/auth/steam";
export const STEAM_STATE_MAX_AGE_S = 600;
/** Un'asserzione più vecchia di così non vale (l'ora sta in openid.response_nonce); qualche minuto di tolleranza per gli orologi. */
export const STEAM_NONCE_MAX_AGE_MS = 5 * 60_000;
const STEAM_NONCE_FUTURE_MS = 2 * 60_000;
/** I campi che la firma di Steam deve coprire: senza, un parametro non firmato potrebbe essere stato cambiato per strada. */
const REQUIRED_SIGNED = ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce", "assoc_handle"] as const;
/** Lunghezza massima della pagina di ritorno salvata nel cookie. */
const NEXT_MAX = 1000;

export function isSteamId(v: unknown): v is string {
  return typeof v === "string" && steamIdRe.test(v);
}

/** La pagina pubblica dell'account Steam. */
export function steamProfileUrl(steamId: string): string {
  return `https://steamcommunity.com/profiles/${steamId}`;
}

/** L'indirizzo a cui Steam torna, con lo stato: lo stesso, carattere per carattere, che il ritorno si aspetta. */
export function steamReturnTo(origin: string, state: string): string {
  return `${origin.replace(/\/+$/, "")}${STEAM_CALLBACK_PATH}?${STEAM_STATE_PARAM}=${encodeURIComponent(state)}`;
}

/** La pagina di Steam dove l'utente entra; `realm` è il sito (Steam lo mostra: "Sign in to originsmeta.com"). */
export function steamLoginUrl(origin: string, state: string): string {
  const base = origin.replace(/\/+$/, "");
  const p = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": steamReturnTo(base, state),
    "openid.realm": `${base}/`,
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_ENDPOINT}?${p.toString()}`;
}

/** L'ora (ms) scritta in testa a openid.response_nonce ("2026-11-09T12:34:56Z" seguito da una parte casuale), o null. */
export function nonceTime(nonce: string | null | undefined): number | null {
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/.exec(nonce ?? "");
  if (!m) return null;
  const t = Date.parse(m[1]);
  return Number.isFinite(t) ? t : null;
}

export type AssertionReason = "cancel" | "mode" | "ns" | "endpoint" | "return_to" | "claimed_id" | "signed" | "nonce";
export type AssertionCheck = { ok: true; steamId: string } | { ok: false; reason: AssertionReason };

/**
 * Controlli sull'asserzione prima di chiederne conferma a Steam: arriva da Steam ed è una risposta positiva, torna
 * esattamente all'indirizzo di questo giro (`expectedReturnTo`, con lo stato del cookie), nomina un account Steam
 * personale, la firma copre i campi che contano ed è di pochi minuti fa.
 */
export function checkAssertion(params: URLSearchParams, expectedReturnTo: string, now = Date.now()): AssertionCheck {
  const mode = params.get("openid.mode");
  if (mode === "cancel") return { ok: false, reason: "cancel" };
  if (mode !== "id_res") return { ok: false, reason: "mode" };
  if (params.get("openid.ns") !== OPENID_NS) return { ok: false, reason: "ns" };
  if (params.get("openid.op_endpoint") !== STEAM_OPENID_ENDPOINT) return { ok: false, reason: "endpoint" };
  if (params.get("openid.return_to") !== expectedReturnTo) return { ok: false, reason: "return_to" };
  const claimed = params.get("openid.claimed_id") ?? "";
  const m = CLAIMED_ID_RE.exec(claimed);
  if (!m || params.get("openid.identity") !== claimed) return { ok: false, reason: "claimed_id" };
  const signed = (params.get("openid.signed") ?? "").split(",");
  if (!params.get("openid.sig") || !REQUIRED_SIGNED.every((f) => signed.includes(f))) return { ok: false, reason: "signed" };
  const at = nonceTime(params.get("openid.response_nonce"));
  if (at === null || now - at > STEAM_NONCE_MAX_AGE_MS || at - now > STEAM_NONCE_FUTURE_MS) return { ok: false, reason: "nonce" };
  return { ok: true, steamId: m[1] };
}

/**
 * Chiede a Steam se l'asserzione l'ha firmata lui (OpenID 2.0, check_authentication): gli stessi parametri openid.*
 * con mode=check_authentication; Steam risponde "is_valid:true" solo per un'asserzione sua e intatta. Nessuna risposta
 * entro `timeoutMs`, una risposta diversa o un errore di rete = false (meglio un accesso in meno che uno falso).
 */
export async function confirmWithSteam(params: URLSearchParams, fetchImpl: typeof fetch = fetch, timeoutMs = 8000): Promise<boolean> {
  const body = new URLSearchParams();
  for (const [k, v] of params) if (k.startsWith("openid.")) body.set(k, v);
  body.set("openid.mode", "check_authentication");
  try {
    const res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      body: body.toString(),
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/plain" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const text = (await res.text()).slice(0, 2000);
    return /(^|\n)is_valid:true\s*(\n|$)/.test(text);
  } catch {
    return false;
  }
}

/* ---------- cookie del giro ---------- */

/** "login": entrare (o iscriversi) con Steam; "link": collegare Steam al profilo con cui si è già entrati. */
export type SteamMode = "login" | "link";
/** s = stato casuale, m = modo, n = pagina di ritorno (percorso interno), u = utente che ha avviato il collegamento, t = ora. */
export type SteamState = { s: string; m: SteamMode; n: string; u?: string; t: number };

const STATE_TOKEN_RE = /^[A-Za-z0-9_-]{22,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Stato casuale del giro: 24 byte dal generatore crittografico. */
export function newStateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

/** Solo percorsi interni (stesse regole di /auth/callback), non troppo lunghi; altrimenti `fallback`. */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || raw.length > NEXT_MAX || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return raw;
}

export function encodeSteamState(state: SteamState): string {
  return b64url(new TextEncoder().encode(JSON.stringify(state)));
}

/** Il cookie del giro, se è intatto e ha meno di 10 minuti; altrimenti null. */
export function decodeSteamState(raw: string | null | undefined, now = Date.now()): SteamState | null {
  if (!raw || raw.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  try {
    const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const v = JSON.parse(json) as Partial<SteamState> | null;
    if (!v || typeof v !== "object") return null;
    if (typeof v.s !== "string" || !STATE_TOKEN_RE.test(v.s)) return null;
    if (v.m !== "login" && v.m !== "link") return null;
    if (typeof v.n !== "string" || safeNextPath(v.n, "") !== v.n) return null;
    if (v.u !== undefined && (typeof v.u !== "string" || !UUID_RE.test(v.u))) return null;
    if (typeof v.t !== "number" || !Number.isFinite(v.t)) return null;
    const age = now - v.t;
    if (age < -60_000 || age > STEAM_STATE_MAX_AGE_S * 1000) return null;
    return { s: v.s, m: v.m, n: v.n, ...(v.u ? { u: v.u } : {}), t: v.t };
  } catch {
    return null;
  }
}

/** `path` (percorso interno, con o senza query e frammento) con `key=value` nella query, prima del frammento. */
export function withQueryParam(path: string, key: string, value: string): string {
  const hashAt = path.indexOf("#");
  const base = hashAt < 0 ? path : path.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : path.slice(hashAt);
  const sep = !base.includes("?") ? "?" : base.endsWith("?") || base.endsWith("&") ? "" : "&";
  return `${base}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}${hash}`;
}
