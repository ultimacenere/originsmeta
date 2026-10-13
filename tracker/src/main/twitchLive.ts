/**
 * Stato dal vivo per l'estensione Twitch "Deck tracker" (13/10/2026; docs/twitch.md, guida in docs/tracker.md).
 *
 * Durante la partita l'app manda al sito lo stato del Deck tracker (`liveStateOf` di src/lib/tracker/live.ts: il mio
 * mazzo con le copie pescate e giocate, il round, la Leggendaria dell'avversario e le carte che ha rivelato; niente
 * nomi, niente rank, niente bot), solo quando cambia e al massimo ogni `LIVE_MIN_MS`. Il sito lo tiene e lo inoltra
 * agli spettatori solo se l'account ha collegato un canale Twitch; se no risponde `linked: false` e l'app smette di
 * mandare per `LIVE_PAUSE.unlinked`. Senza account collegato non parte niente.
 *
 * Rete e orologio arrivano da fuori (`SyncDeps` di sync.ts), così i test girano senza Electron e senza rete.
 */
import { liveStateOf, type LiveSource } from "../../../src/lib/tracker/live";
import type { SyncDeps } from "./sync";

/** Fra due invii almeno 2 secondi (il sito ne accetta al massimo due al secondo; Twitch uno al secondo per canale). */
export const LIVE_MIN_MS = 2000;
export const LIVE_PAUSE = { unlinked: 5 * 60_000, invalidToken: 30 * 60_000, unavailable: 15 * 60_000, offline: 60_000, rejected: 10 * 60_000 } as const;

export class LivePusher {
  private lastKey: string | null = null;
  private lastAt = 0;
  private pausedUntil = 0;
  private busy = false;
  /** il canale risulta collegato (l'ultima risposta del sito) */
  linked: boolean | null = null;

  private readonly deps: SyncDeps;
  private readonly token: () => string | null;

  constructor(deps: SyncDeps, token: () => string | null) {
    this.deps = deps;
    this.token = token;
  }

  /** Lo stato di adesso: parte se è cambiato e se è passato abbastanza tempo; altrimenti aspetta la prossima chiamata. */
  async offer(view: LiveSource): Promise<void> {
    const now = (this.deps.now ?? Date.now)();
    const token = this.token();
    if (!token || this.busy || now < this.pausedUntil || now - this.lastAt < LIVE_MIN_MS) return;
    const state = liveStateOf(view);
    const key = JSON.stringify(state);
    if (key === this.lastKey) return;
    this.busy = true;
    this.lastAt = now;
    try {
      const res = await this.deps.fetch(`${this.deps.site}/api/tracker/live`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ state }),
        signal: AbortSignal.timeout(this.deps.timeoutMs ?? 10_000),
      });
      if (res.status === 200) {
        const body = (await res.json()) as { linked?: unknown };
        this.linked = body.linked === true;
        if (this.linked) this.lastKey = key;
        else this.pausedUntil = now + LIVE_PAUSE.unlinked;
      } else if (res.status === 401) this.pausedUntil = now + LIVE_PAUSE.invalidToken;
      else if (res.status === 503) this.pausedUntil = now + LIVE_PAUSE.unavailable;
      else if (res.status === 400) {
        // un errore nostro: quello stato non si riprova
        this.lastKey = key;
        this.pausedUntil = now + LIVE_PAUSE.rejected;
      }
      // 429 e gli altri: si riprova alla prossima chiamata
    } catch {
      this.pausedUntil = now + LIVE_PAUSE.offline;
    } finally {
      this.busy = false;
    }
  }

  /** Account scollegato o ricollegato: si ricomincia da capo. */
  reset(): void {
    this.lastKey = null;
    this.lastAt = 0;
    this.pausedUntil = 0;
    this.linked = null;
  }
}
