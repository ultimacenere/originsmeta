/**
 * JWT dell'estensione Twitch "Deck tracker" (13/10/2026, docs/twitch.md). Twitch firma con HS256 e con il secret
 * dell'estensione (in base64 nella console di dev.twitch.tv) il token che il front-end riceve da
 * `Twitch.ext.onAuthorized` e manda al sito; il sito firma con lo stesso secret i token "external" per chiamare
 * l'Extension PubSub di Helix. Niente librerie: HMAC di node:crypto, confronto a tempo costante, solo HS256.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type ExtRole = "broadcaster" | "moderator" | "viewer" | "external";
export type ExtClaims = { exp: number; channel_id?: string; opaque_user_id?: string; user_id?: string; role: ExtRole; pubsub_perms?: { listen?: string[]; send?: string[] } };

const b64url = (buf: Buffer) => buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const HEADER = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
/** L'id di un canale Twitch: cifre (Helix lo dà come stringa). */
export const CHANNEL_RE = /^[0-9]{1,20}$/;
const ROLES: readonly ExtRole[] = ["broadcaster", "moderator", "viewer", "external"];

export function signExtJwt(claims: ExtClaims, secretB64: string): string {
  const body = b64url(Buffer.from(JSON.stringify(claims)));
  const sig = b64url(createHmac("sha256", Buffer.from(secretB64, "base64")).update(`${HEADER}.${body}`).digest());
  return `${HEADER}.${body}.${sig}`;
}

/** Le dichiarazioni di un token valido (firma HS256 giusta, non scaduto, forma attesa), altrimenti null. */
export function verifyExtJwt(token: string, secretB64: string, nowSec = Math.floor(Date.now() / 1000)): ExtClaims | null {
  if (!secretB64 || typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(fromB64url(parts[0]).toString("utf8")) as { alg?: unknown };
    if (header.alg !== "HS256") return null;
    const want = createHmac("sha256", Buffer.from(secretB64, "base64")).update(`${parts[0]}.${parts[1]}`).digest();
    const got = fromB64url(parts[2]);
    if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
    const c = JSON.parse(fromB64url(parts[1]).toString("utf8")) as Record<string, unknown>;
    if (typeof c.exp !== "number" || c.exp <= nowSec) return null;
    if (!ROLES.includes(c.role as ExtRole)) return null;
    if (c.channel_id !== undefined && !(typeof c.channel_id === "string" && CHANNEL_RE.test(c.channel_id))) return null;
    return c as unknown as ExtClaims;
  } catch {
    return null;
  }
}
