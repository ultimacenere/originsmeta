/**
 * Invio delle partite al sito (Fase 3, 30/09/2026; docs/tracker.md, "Collegamento e invio").
 *
 * - Collegamento: `claimCode` scambia il codice monouso di originsmeta.com/account/tracker con il token
 *   (POST /api/tracker/link); `unlinkRemote` scollega il PC dal sito (DELETE, con il token).
 * - Coda: ogni partita dello storico sul PC che il sito non ha ancora (`sync.json`: le impronte già mandate) parte a
 *   gruppi di 50, dalla più vecchia, con `toUpload` del lettore (dell'avversario solo la Leggendaria e le carte che ha
 *   giocato). Il sito scarta da sé i doppioni. Partono anche le partite registrate prima del collegamento: la finestra
 *   dell'app lo dice prima di collegare.
 * - Errori: senza rete o con il sito giù si riprova più tardi, con attese crescenti; 429 (tetto giornaliero) dopo
 *   un'ora; 503 (funzioni non ancora nel database) dopo 15 minuti; 401 = PC scollegato dal sito: l'app dimentica il
 *   token. Un 400 è un errore nostro: quelle partite non si riprovano, per non girare a vuoto.
 *
 * Rete e orologio arrivano da fuori (`SyncDeps`), così i test girano senza Electron e senza rete.
 */
import fs from "node:fs";
import path from "node:path";
import { UPLOAD_LIMITS, normalizeLinkCode, toUpload } from "../../../src/lib/tracker/upload";
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { LinkProblem, SyncProblem } from "../shared/types";

export type { LinkProblem, SyncProblem };

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;

export type SyncDeps = {
  /** origine del sito, per esempio https://originsmeta.com */
  site: string;
  fetch: FetchLike;
  now?: () => number;
  timeoutMs?: number;
};

export type SyncStatus = {
  /** partite dello storico che il sito non ha ancora */
  pending: number;
  lastSyncAt: string | null;
  problem: SyncProblem | null;
  /** prossimo tentativo automatico dopo un problema, ISO */
  retryAt: string | null;
  running: boolean;
};

export const DEFAULT_SITE = "https://originsmeta.com";
/** Attese prima di riprovare: senza rete o con il sito giù crescono a ogni tentativo fallito. */
export const RETRY = {
  offline: [60_000, 120_000, 300_000, 900_000],
  rateLimited: 3_600_000,
  unavailable: 900_000,
} as const;

/**
 * L'origine del sito a cui mandare le partite: originsmeta.com, oppure (solo per le prove) un indirizzo https o
 * localhost da ORIGINSMETA_TRACKER_SITE. Tutto il resto torna a originsmeta.com.
 */
export function siteBase(value: string | undefined): string {
  if (!value) return DEFAULT_SITE;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" || (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"))) return u.origin;
  } catch {
    // indirizzo non valido
  }
  return DEFAULT_SITE;
}

/** `reached: false` = nessuna risposta (senza rete, sito irraggiungibile, tempo scaduto). */
type Reply = { reached: true; status: number; body: Record<string, unknown> } | { reached: false; status: 0; body: null };

async function call(deps: SyncDeps, method: string, route: string, token: string | null, body?: unknown): Promise<Reply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 20_000);
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await deps.fetch(`${deps.site}${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    return { reached: true, status: res.status, body: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {} };
  } catch {
    return { reached: false, status: 0, body: null };
  } finally {
    clearTimeout(timer);
  }
}

/** Scambia il codice di collegamento con il token. `name` è il nome del PC, che sul sito vede solo il proprietario. */
export async function claimCode(deps: SyncDeps, code: string, name: string): Promise<{ ok: true; token: string; username: string | null } | { ok: false; problem: LinkProblem }> {
  const normalized = normalizeLinkCode(code);
  if (!normalized) return { ok: false, problem: "invalid_code" };
  const res = await call(deps, "POST", "/api/tracker/link", null, { code: normalized, name: name.slice(0, 40) });
  if (!res.reached) return { ok: false, problem: "offline" };
  const token = res.body.token;
  if (res.status === 200 && typeof token === "string" && /^omt_[0-9a-f]{64}$/.test(token)) {
    return { ok: true, token, username: typeof res.body.username === "string" ? res.body.username : null };
  }
  const error = res.body.error;
  if (error === "invalid_code" || error === "too_many_devices" || error === "unavailable") return { ok: false, problem: error };
  return { ok: false, problem: "error" };
}

/** Scollega il PC anche sul sito (senza rete resta collegato là: si scollega da /account/tracker). */
export async function unlinkRemote(deps: SyncDeps, token: string): Promise<boolean> {
  const res = await call(deps, "DELETE", "/api/tracker/link", token);
  return res.reached && res.status === 200 && res.body.ok === true;
}

type SyncFile = { v: 1; sent: string[]; lastSyncAt: string | null };
const FILE = "sync.json";

export class SyncQueue {
  readonly dir: string;
  private readonly deps: SyncDeps;
  private sent = new Set<string>();
  private lastSyncAt: string | null = null;
  private problem: SyncProblem | null = null;
  private retryAt = 0;
  private failures = 0;
  private running = false;

  constructor(dir: string, deps: SyncDeps) {
    this.dir = dir;
    this.deps = deps;
  }

  private now() {
    return (this.deps.now ?? Date.now)();
  }

  load(): void {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(this.dir, FILE), "utf8")) as Partial<SyncFile>;
      if (raw?.v === 1 && Array.isArray(raw.sent)) {
        this.sent = new Set(raw.sent.filter((id): id is string => typeof id === "string"));
        this.lastSyncAt = typeof raw.lastSyncAt === "string" ? raw.lastSyncAt : null;
      }
    } catch {
      // niente di mandato finora
    }
  }

  private save() {
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(this.dir, FILE);
    const out: SyncFile = { v: 1, sent: [...this.sent], lastSyncAt: this.lastSyncAt };
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(out));
    fs.renameSync(`${file}.tmp`, file);
  }

  /** Le partite che il sito non ha ancora, dalla più vecchia. */
  pendingOf(matches: readonly TrackedMatch[]): TrackedMatch[] {
    return matches.filter((m) => !this.sent.has(m.id));
  }

  status(matches: readonly TrackedMatch[]): SyncStatus {
    return {
      pending: this.pendingOf(matches).length,
      lastSyncAt: this.lastSyncAt,
      problem: this.problem,
      retryAt: this.problem && this.retryAt ? new Date(this.retryAt).toISOString() : null,
      running: this.running,
    };
  }

  /** Scollegato: si dimentica che cosa era stato mandato (un altro account lo riceverà da capo) e ogni problema. */
  reset(): void {
    this.sent.clear();
    this.lastSyncAt = null;
    this.problem = null;
    this.retryAt = 0;
    this.failures = 0;
    fs.rmSync(path.join(this.dir, FILE), { force: true });
  }

  private wait(problem: SyncProblem, ms: number) {
    this.problem = problem;
    this.retryAt = this.now() + ms;
  }

  /**
   * Manda le partite in attesa. Senza `force` non riparte prima dell'ora del prossimo tentativo dopo un problema.
   * `unlinked: true` = il sito non riconosce più il token (PC scollegato da /account/tracker): il chiamante lo dimentica.
   */
  async run(matches: readonly TrackedMatch[], token: string, opts: { force?: boolean } = {}): Promise<{ sent: number; unlinked: boolean }> {
    if (this.running || (!opts.force && this.now() < this.retryAt)) return { sent: 0, unlinked: false };
    this.running = true;
    let sent = 0;
    try {
      const todo = this.pendingOf(matches);
      for (let i = 0; i < todo.length; i += UPLOAD_LIMITS.batch) {
        const chunk = todo.slice(i, i + UPLOAD_LIMITS.batch);
        const now = this.now();
        const res = await call(this.deps, "POST", "/api/tracker/sync", token, { matches: chunk.map((m) => toUpload(m, now)) });
        if (res.status === 200 || res.status === 400) {
          // 400: una richiesta che il sito non accetterà mai (errore nostro): quelle partite non si riprovano
          for (const m of chunk) this.sent.add(m.id);
          if (res.status === 200) {
            sent += chunk.length;
            this.lastSyncAt = new Date(now).toISOString();
            this.problem = null;
            this.retryAt = 0;
            this.failures = 0;
          }
          this.save();
          continue;
        }
        if (res.status === 401) {
          this.problem = "unlinked";
          return { sent, unlinked: true };
        }
        if (res.status === 429) this.wait("rate_limited", RETRY.rateLimited);
        else if (res.status === 503) this.wait("unavailable", RETRY.unavailable);
        else {
          this.wait(res.reached ? "server" : "offline", RETRY.offline[Math.min(this.failures, RETRY.offline.length - 1)]);
          this.failures++;
        }
        return { sent, unlinked: false };
      }
      if (!todo.length) this.problem = null;
      return { sent, unlinked: false };
    } finally {
      this.running = false;
    }
  }
}
