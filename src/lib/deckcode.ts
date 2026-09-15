/**
 * Codici-mazzo.
 *
 * 1) Formato del gioco (Koin Games), come emesso dal client di Origins TCG:
 *    "KGBLDC" + base64( "v1|KEY|KEY|…" ) + ":" + checksum
 *    - KEY = chiave interna della carta, es. C0042_MB; una variante cosmetica si esprime con il suffisso _V<n>
 *      (il default _V00000 viene omesso); le chiavi sono ordinate per il numero che segue la "C".
 *    - checksum = primi 4 byte di SHA-256 del payload "v1|…", in esadecimale.
 *    Per esportare in questo formato servono le chiavi ufficiali di ogni carta (campo `key` in cards.ts);
 *    importando un codice del gioco con chiavi che non conosciamo ancora, le chiavi restano visibili
 *    così da poterle associare alle carte.
 *
 * 2) Formato OriginsMeta (per condividere link e salvataggi anche senza chiavi ufficiali):
 *    "OM1." + base64url( JSON {n: nome, l: slug leggendaria, c: [slug…], x: [carte custom…]} )
 */
import type { BuilderCard, DeckState } from "./deckrules";

export const GAME_PREFIX = "KGBLDC";
export const OM_PREFIX = "OM1.";

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function checksum(payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest.slice(0, 4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const keyNumber = (key: string): number => {
  const m = key.match(/^C(\d+)/i);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};

/** Codifica una lista di chiavi ufficiali nel formato del gioco. */
export async function encodeGameCode(keys: string[]): Promise<string> {
  const norm = keys.map((k) => (k.includes("_V") ? k : `${k}_V00000`));
  const sorted = [...norm].sort((a, b) => keyNumber(a) - keyNumber(b)).map((k) => (k.endsWith("_V00000") ? k.split("_V")[0] : k));
  const payload = `v1|${sorted.join("|")}`;
  return `${GAME_PREFIX}${utf8ToBase64(payload)}:${await checksum(payload)}`;
}

export type GameDecode = { keys: string[] } | { error: "empty" | "prefix" | "separator" | "checksum" | "version" | "decode" };

/** Decodifica un codice del gioco in chiavi ufficiali (con suffisso _V00000 esplicito). */
export async function decodeGameCode(input: string): Promise<GameDecode> {
  let t = (input ?? "").trim();
  if (!t) return { error: "empty" };
  t = t.replace(/[^\w|:+=/]+$/, "");
  const at = t.indexOf(GAME_PREFIX);
  if (at < 0) return { error: "prefix" };
  const rest = t.substring(at + GAME_PREFIX.length);
  const sep = rest.lastIndexOf(":");
  if (sep < 0) return { error: "separator" };
  const b64 = rest.substring(0, sep);
  const sum = rest.substring(sep + 1);
  try {
    const payload = base64ToUtf8(b64);
    if (sum !== (await checksum(payload))) return { error: "checksum" };
    const parts = payload.split("|");
    if (parts.length < 2 || parts[0] !== "v1") return { error: "version" };
    return { keys: parts.slice(1).map((k) => (k.includes("_V") ? k : `${k}_V00000`)) };
  } catch {
    return { error: "decode" };
  }
}

/** Chiave "base" senza variante cosmetica, per confrontarla con il campo `key` delle carte. */
export function baseKey(key: string): string {
  return key.replace(/_V\d+$/, "");
}

/* ---------- formato OriginsMeta ---------- */

function toBase64Url(s: string): string {
  return utf8ToBase64(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return base64ToUtf8(b64);
}

export function encodeOmCode(deck: DeckState): string {
  const payload = JSON.stringify({ n: deck.name, l: deck.legendary, c: deck.cards, x: deck.customCards });
  return `${OM_PREFIX}${toBase64Url(payload)}`;
}

export function decodeOmCode(input: string): DeckState | null {
  const t = (input ?? "").trim();
  const at = t.indexOf(OM_PREFIX);
  if (at < 0) return null;
  try {
    const raw = JSON.parse(fromBase64Url(t.substring(at + OM_PREFIX.length))) as { n?: unknown; l?: unknown; c?: unknown; x?: unknown };
    const cards = Array.isArray(raw.c) ? raw.c.filter((s): s is string => typeof s === "string").slice(0, 40) : [];
    const custom = Array.isArray(raw.x)
      ? (raw.x as unknown[]).filter((c): c is BuilderCard => typeof c === "object" && c !== null && typeof (c as BuilderCard).slug === "string" && typeof (c as BuilderCard).name === "string").slice(0, 40)
      : [];
    return {
      name: typeof raw.n === "string" ? raw.n.slice(0, 60) : "",
      legendary: typeof raw.l === "string" ? raw.l : null,
      cards,
      customCards: custom.map((c) => ({ ...c, custom: true, name: String(c.name).slice(0, 60) })),
    };
  } catch {
    return null;
  }
}

/** Lista testuale "1x Legendary / 2x Card" per copia, invio e import da altri siti. */
export function toTextList(deck: DeckState, lookup: (slug: string) => BuilderCard | undefined): string {
  const lines: string[] = [];
  if (deck.name) lines.push(`# ${deck.name}`);
  if (deck.legendary) lines.push(`1x ${lookup(deck.legendary)?.name ?? deck.legendary} (Legendary)`);
  for (const s of deck.cards) lines.push(`2x ${lookup(s)?.name ?? s}`);
  return lines.join("\n");
}

/** Riconosce righe "2x Nome", "Nome x2", "Nome" e restituisce i nomi trovati. */
export function parseTextList(text: string): { name: string; copies: number }[] {
  const out: { name: string; copies: number }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    let m = line.match(/^(\d+)\s*[xX×]\s*(.+?)(?:\s*\((?:legendary|leggendaria)\))?$/i);
    if (m) {
      out.push({ name: m[2].trim(), copies: parseInt(m[1], 10) });
      continue;
    }
    m = line.match(/^(.+?)\s*[xX×]\s*(\d+)$/);
    if (m) {
      out.push({ name: m[1].trim(), copies: parseInt(m[2], 10) });
      continue;
    }
    out.push({ name: line.replace(/\s*\((?:legendary|leggendaria)\)$/i, ""), copies: 1 });
  }
  return out;
}
