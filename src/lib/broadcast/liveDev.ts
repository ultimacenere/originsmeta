import type { BroadcastState } from "./state";
import { LiveError, type LiveInfo, type LiveRow, type PublicBackend, type UserBackend } from "./liveTypes";
import { isLiveImageData, LIVE_ID_RE, sha256Hex } from "./live";

/**
 * Broadcasting OM in diretta, prove in locale (05/11/2026): con `BROADCAST_LIVE_DEV=1` in `.env.development.local` e
 * `next dev` le rotte della diretta usano questa memoria invece del database, con un utente finto "dev" già collegato,
 * così regia, overlay di OBS e finta estensione si provano prima della migrazione. Mai in produzione (NODE_ENV).
 * Le regole sono quelle delle funzioni SQL, semplificate: una diretta, 400 ms fra due salvataggi, codici di 10 minuti.
 * In modalità prova ogni canale legge la diretta di "dev", anche se non è collegato.
 */
export function liveDevEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.BROADCAST_LIVE_DEV === "1";
}

type Mem = {
  live: { id: string; state: BroadcastState | null; version: number; updatedAt: number } | null;
  images: Map<string, string>;
  channels: Map<string, string | null>;
  codes: Map<string, number>;
};

const g = globalThis as unknown as { __omBroadcastDev?: Mem };
const mem = (): Mem => (g.__omBroadcastDev ??= { live: null, images: new Map(), channels: new Map(), codes: new Map() });

const iso = (ms: number) => new Date(ms).toISOString();
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

function info(create: boolean): LiveInfo | null {
  const m = mem();
  if (!m.live && create) m.live = { id: newId(), state: null, version: 0, updatedAt: Date.now() };
  if (!m.live) return null;
  return { id: m.live.id, version: m.live.version, updatedAt: iso(m.live.updatedAt), live: m.live.state !== null, channels: [...m.channels].map(([id, login]) => ({ id, login })) };
}

function row(): LiveRow | null {
  const l = mem().live;
  return l ? { id: l.id, state: l.state, version: l.version, updatedAt: iso(l.updatedAt) } : null;
}

const user: UserBackend = {
  username: "dev",
  async info(create) {
    return info(create);
  },
  async save(state) {
    info(true);
    const l = mem().live!;
    if (l.state && Date.now() - l.updatedAt < 400) throw new LiveError("too_fast");
    l.state = state;
    l.version += 1;
    l.updatedAt = Date.now();
    return { id: l.id, version: l.version, channels: [...mem().channels.keys()] };
  },
  async clear() {
    const l = mem().live;
    if (!l) return null;
    l.state = null;
    l.version += 1;
    l.updatedAt = Date.now();
    return { id: l.id, version: l.version, channels: [...mem().channels.keys()] };
  },
  async imagePut(data) {
    if (!isLiveImageData(data)) throw new LiveError("invalid");
    const hash = await sha256Hex(data);
    mem().images.set(hash, data);
    return hash;
  },
  async linkCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const raw = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alphabet[b % 32]).join("");
    mem().codes.set(raw, Date.now() + 10 * 60_000);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  },
  async unlink(channel) {
    return mem().channels.delete(channel);
  },
};

const pub: PublicBackend = {
  async liveState(id) {
    const l = mem().live;
    return l && LIVE_ID_RE.test(id) && l.id === id ? row() : null;
  },
  async channelState() {
    return row();
  },
  async imageGet(_id, hash) {
    return mem().images.get(hash) ?? null;
  },
  async linkClaim(_key, code, channel, login) {
    const norm = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const exp = mem().codes.get(norm);
    if (!exp || exp < Date.now()) throw new LiveError("invalid_code");
    mem().codes.delete(norm);
    mem().channels.set(channel, login);
    return "dev";
  },
};

export const devBackend = { user, public: pub };
