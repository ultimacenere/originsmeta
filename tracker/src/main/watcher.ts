/**
 * Il tracker vero e proprio: guarda i file che Origins TCG scrive sul PC e registra ogni partita finita.
 *
 * Ogni `POLL_MS` controlla l'ora di modifica del file delle statistiche (una sola `stat`, niente di più pesante).
 * Quando cambia lo rilegge; se l'ultima partita è nuova (impronta diversa da quella salvata) aspetta il replay, che
 * il gioco scrive a un secondo dalla cache, fino a `REPLAY_WAIT_MS` (15 s), e poi costruisce la partita con il lettore
 * (src/lib/tracker/). Senza replay la partita si registra con esito e mazzo. I file si riconoscono dal contenuto
 * (`discover`, ogni `DISCOVER_MS` o quando spariscono). Tutto in sola lettura: nessun blocco sui file, niente processo
 * del gioco, niente token (regole in docs/tracker.md).
 *
 * Primo avvio (nessuno stato salvato): l'ultima partita del gioco si registra solo se il suo replay è ancora lì; gli
 * esiti più vecchi restano nello storico del gioco (`history`) e non diventano partite perse.
 *
 * Eventi: "match" (TrackedMatch), "missed" (esiti di partite giocate a tracker spento), "saved" (stato da salvare),
 * "status", "deck" (mazzo scelto adesso), "history" (esiti secondo il gioco). Niente di questo contiene nomi, id o il
 * segnale bot, che restano dentro il lettore.
 */
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { readInventoryFile, readStatsFile, resultsDelta, type GameDeck, type MatchEnd, type ProfileStats } from "../../../src/lib/tracker/profile";
import { parseReplay, readReplay, replayFileInfo, REPLAY_MAX_BYTES, type ReplayMatch } from "../../../src/lib/tracker/replay";
import { buildMatch, matchFingerprint, replayBelongsTo } from "../../../src/lib/tracker/match";
import { matchQueue } from "../../../src/lib/tracker/queue";
import type { GameDirs } from "./paths";
import type { SavedState } from "./store";
import type { TrackerStatus } from "../shared/types";

export const POLL_MS = 2000;
export const DISCOVER_MS = 30_000;
/**
 * Attesa del replay dopo la fine della partita: 15 secondi dal 10/10/2026 (prima un minuto; Pierluigi: "riduciamo sto
 * tempo di attesa, 15 secondi max"). Il replay arrivava a 1–2 s dalla cache, e con la 0.7 non arriva più: la partita
 * compare nello storico 15 secondi dopo la fine, con i dati dello scanner se è acceso.
 */
export const REPLAY_WAIT_MS = 15_000;

/** Codici dei problemi: i testi, nelle tre lingue, stanno nell'interfaccia (renderer/app.ts). */
export const PROBLEMS = { noGame: "noGame", badReplay: "badReplay", error: "error" } as const;

type Saved = Pick<SavedState, "lastFingerprint" | "results">;

type Pending = {
  end: MatchEnd;
  accountId: string | null;
  deck: GameDeck | null;
  /** `BattleMode` delle statistiche alla fine della partita: con il nome del replay dà la coda (queue.ts) */
  battleMode: string | null;
  fingerprint: string;
  results: string;
  /** Gli esiti salvati prima di questa partita: se l'esito arriva dopo l'id, si ricalcola da qui. */
  prevResults: string;
  /** L'ora di fine rimasta quella della partita precedente (0.7): finché non cambia, `end.endedAt` è l'ora in cui il
   * gioco ha scritto l'esito. */
  staleAt: string | null;
  since: number;
  firstRun: boolean;
};

const statOf = (p: string) => {
  try {
    const s = fs.statSync(p);
    return { mtimeMs: s.mtimeMs, size: s.size, dir: s.isDirectory() };
  } catch {
    return null;
  }
};
const subdirs = (p: string) => {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(p, e.name));
  } catch {
    return [];
  }
};
const readText = (p: string) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

export class MatchWatcher extends EventEmitter {
  readonly dirs: GameDirs;
  status: TrackerStatus = { cache: false, replays: false, lastRead: null, problem: null };
  private saved: Saved;
  private firstRun: boolean;
  private now: () => number;
  private files: { stats: string | null; inventory: string | null } = { stats: null, inventory: null };
  private lastDiscover = -Infinity;
  private statsMtime = -1;
  /** `lastMatchAt` della lettura precedente delle statistiche (undefined: nessuna lettura ancora). */
  private seenAt: string | null | undefined = undefined;
  private pending: Pending | null = null;
  private deckKey: string | null = null;
  /**
   * Il file delle statistiche è cambiato (demo ↔ playtest, 11/10/2026): le statistiche nuove sono di un'altra build,
   * con un altro storico. La prima lettura fa da punto di partenza e non registra niente: prima l'app prendeva l'ultima
   * partita dell'altra build per una partita appena finita (la partita del playtest del 02/10, registrata senza esito
   * all'apertura del playtest l'11/10).
   */
  private rebase = false;
  /** L'id dell'account dell'ultima lettura delle statistiche: sale dell'impronta delle partite lette dallo schermo. */
  lastAccountId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = false;

  constructor(dirs: GameDirs, saved: Saved, opts: { firstRun: boolean; now?: () => number }) {
    super();
    this.dirs = dirs;
    this.saved = { ...saved };
    this.firstRun = opts.firstRun;
    this.now = opts.now ?? Date.now;
  }

  start(): void {
    if (this.timer) return;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), POLL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Un giro di controllo (pubblico per i test). */
  async tick(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    let failed = false;
    try {
      const now = this.now();
      if (!this.files.stats || now - this.lastDiscover >= DISCOVER_MS || !statOf(this.files.stats)) this.discover(now);
      if (this.pending) await this.tryFinish(now);
      if (!this.files.stats) return;
      const st = statOf(this.files.stats);
      if (!st || st.mtimeMs === this.statsMtime) return;
      const text = readText(this.files.stats);
      const stats = text ? readStatsFile(text) : null;
      if (!stats) return; // file a metà scrittura: si riprova al giro dopo
      this.statsMtime = st.mtimeMs;
      this.setStatus({ lastRead: new Date(now).toISOString() });
      this.emit("history", stats.results);
      this.updateDeck(stats);
      await this.onStats(stats, now, st.mtimeMs);
    } catch {
      failed = true;
      this.setStatus({ problem: PROBLEMS.error });
    } finally {
      // un errore passeggero sparisce al primo giro andato bene
      if (!failed && this.status.problem === PROBLEMS.error) this.setStatus({ problem: null });
      this.busy = false;
    }
  }

  private setStatus(next: Partial<TrackerStatus>) {
    const before = JSON.stringify(this.status);
    this.status = { ...this.status, ...next };
    if (JSON.stringify(this.status) !== before) this.emit("status", this.status);
  }

  /** Cerca per contenuto il file delle statistiche e l'inventario più recenti (cache/<cid>/<realm>/<versione>/*.json). */
  private discover(now: number) {
    this.lastDiscover = now;
    let stats: { file: string; mtime: number } | null = null;
    let inventory: { file: string; mtime: number } | null = null;
    for (const root of this.dirs.cacheRoots) {
      for (const dir of subdirs(root).flatMap(subdirs).flatMap(subdirs)) {
        let names: string[] = [];
        try {
          names = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
        } catch {
          continue;
        }
        for (const name of names) {
          const file = path.join(dir, name);
          const st = statOf(file);
          if (!st || st.dir || st.size > 8 * 1024 * 1024) continue;
          if (stats && st.mtimeMs <= stats.mtime && inventory && st.mtimeMs <= inventory.mtime) continue;
          const text = readText(file);
          if (!text) continue;
          if ((!stats || st.mtimeMs > stats.mtime) && readStatsFile(text)) stats = { file, mtime: st.mtimeMs };
          else if ((!inventory || st.mtimeMs > inventory.mtime) && readInventoryFile(text)) inventory = { file, mtime: st.mtimeMs };
        }
      }
    }
    if (stats?.file !== this.files.stats) {
      this.statsMtime = -1;
      if (this.files.stats && stats) this.rebase = true;
    }
    this.files = { stats: stats?.file ?? null, inventory: inventory?.file ?? null };
    const replays = this.dirs.replayDirs.some((d) => statOf(d)?.dir);
    this.setStatus({
      cache: Boolean(stats),
      replays,
      problem: stats ? (this.status.problem === PROBLEMS.noGame ? null : this.status.problem) : PROBLEMS.noGame,
    });
  }

  private decks(): GameDeck[] {
    const text = this.files.inventory ? readText(this.files.inventory) : null;
    return (text ? readInventoryFile(text) : null) ?? [];
  }

  private updateDeck(stats: ProfileStats) {
    const deck = stats.activeDeckIndex === null ? null : (this.decks()[stats.activeDeckIndex] ?? null);
    const key = deck ? `${deck.id}|${deck.name}|${deck.cards.join(",")}` : "none";
    if (key === this.deckKey) return;
    this.deckKey = key;
    this.emit("deck", deck);
  }

  /** `writtenAt`: ora di modifica del file letto, cioè quando il gioco l'ha scritto. */
  private async onStats(stats: ProfileStats, now: number, writtenAt: number) {
    const prevAt = this.seenAt;
    if (stats.accountId) this.lastAccountId = stats.accountId;
    this.seenAt = stats.lastMatchAt;
    if (!stats.lastMatchAt) {
      this.rebase = false;
      this.saved = { ...this.saved, results: stats.results };
      return;
    }
    const fingerprint = await matchFingerprint(stats.accountId, stats.lastMatchId, stats.lastMatchAt);
    if (this.rebase) {
      // altra build: si chiude quello che restava in attesa e si riparte da qui, senza registrare l'ultima partita
      this.rebase = false;
      if (this.pending) await this.finish(this.pending, null);
      this.saved = { lastFingerprint: fingerprint, results: stats.results };
      this.emit("saved", this.saved);
      return;
    }
    if (this.pending && fingerprint === this.pending.fingerprint) return this.refreshPending(this.pending, stats);
    if (fingerprint === this.saved.lastFingerprint) return;
    // Con la 0.7 (verificato il 30/09/2026) il gioco scrive esito e id della partita qualche secondo prima dell'ora di
    // fine, che per un attimo resta quella della partita precedente: id nuovo con l'ora di prima = ora non ancora
    // arrivata. Intanto vale l'ora in cui il gioco ha scritto l'esito; quella vera la prende `refreshPending`.
    const stale = !this.firstRun && prevAt != null && stats.lastMatchAt === prevAt;
    const endedAt = stale ? new Date(Math.min(writtenAt, now)).toISOString() : stats.lastMatchAt;
    let end: MatchEnd;
    if (this.firstRun) {
      const first = stats.results[0];
      end = { endedAt, result: first === "W" || first === "L" ? first : null, matchId: stats.lastMatchId, deckIndex: stats.activeDeckIndex, missed: "" };
    } else {
      const { result, missed } = resultsDelta(this.saved.results, stats.results);
      end = { endedAt, result, matchId: stats.lastMatchId, deckIndex: stats.activeDeckIndex, missed };
    }
    // due partite in meno di un minuto: la prima si chiude subito con quello che c'è
    if (this.pending) await this.finish(this.pending, null);
    const deck = stats.activeDeckIndex === null ? null : (this.decks()[stats.activeDeckIndex] ?? null);
    this.pending = {
      end,
      accountId: stats.accountId,
      deck,
      battleMode: stats.battleMode,
      fingerprint,
      results: stats.results,
      prevResults: this.saved.results,
      staleAt: stale ? stats.lastMatchAt : null,
      since: now,
      firstRun: this.firstRun,
    };
    this.firstRun = false;
    await this.tryFinish(now);
  }

  /** La stessa partita riletta mentre si aspetta il replay: prende l'ora di fine e l'esito se arrivano dopo l'id. */
  private refreshPending(p: Pending, stats: ProfileStats) {
    if (p.staleAt !== null && stats.lastMatchAt && stats.lastMatchAt !== p.staleAt) {
      p.end = { ...p.end, endedAt: stats.lastMatchAt };
      p.staleAt = null;
    }
    if (p.firstRun || stats.results === p.results || !stats.results.endsWith(p.prevResults)) return;
    const { result, missed } = resultsDelta(p.prevResults, stats.results);
    if (p.end.result === null && result) p.end = { ...p.end, result, missed };
    p.results = stats.results;
  }

  /** Il replay più recente se è quello della partita finita a `endedAt`. */
  private findReplay(endedAt: string | null): string | null {
    let best: { file: string; mtime: number } | null = null;
    for (const dir of this.dirs.replayDirs) {
      let names: string[] = [];
      try {
        names = fs.readdirSync(dir).filter((f) => replayFileInfo(f));
      } catch {
        continue;
      }
      for (const name of names) {
        const file = path.join(dir, name);
        const st = statOf(file);
        if (st && !st.dir && (!best || st.mtimeMs > best.mtime)) best = { file, mtime: st.mtimeMs };
      }
    }
    return best && replayBelongsTo(endedAt, best.mtime) ? best.file : null;
  }

  private readReplayFile(file: string, accountId: string | null): ReplayMatch | null {
    try {
      const st = statOf(file);
      if (!st || st.size > REPLAY_MAX_BYTES) return null;
      return readReplay(parseReplay(new Uint8Array(fs.readFileSync(file))), { accountId });
    } catch {
      return null;
    }
  }

  private async tryFinish(now: number) {
    const p = this.pending;
    if (!p) return;
    const file = this.findReplay(p.end.endedAt);
    const replay = file ? this.readReplayFile(file, p.accountId) : null;
    const timedOut = now - p.since >= REPLAY_WAIT_MS;
    if (replay) return this.finish(p, replay, file);
    if (!timedOut) return; // il replay arriva o si sta ancora scrivendo: si riprova al giro dopo
    if (file) this.setStatus({ problem: PROBLEMS.badReplay });
    if (p.firstRun) {
      // primo avvio senza il replay della partita: non si registra, si parte da qui
      this.pending = null;
      this.saved = { lastFingerprint: p.fingerprint, results: p.results };
      this.emit("saved", this.saved);
      return;
    }
    return this.finish(p, null, file);
  }

  /** `file`: il replay di questa partita (anche se non si legge), per la modalità scritta nel nome. */
  private async finish(p: Pending, replay: ReplayMatch | null, file: string | null = null) {
    this.pending = null;
    if (replay && this.status.problem === PROBLEMS.badReplay) this.setStatus({ problem: null });
    // la coda: solo "ranked" o "normal", mai la modalità del nome ("BotBattle") né un segnale bot (queue.ts)
    const queue = matchQueue({ mode: file ? (replayFileInfo(path.basename(file))?.mode ?? null) : null, battleMode: p.battleMode });
    const match = await buildMatch({ end: p.end, accountId: p.accountId, deck: p.deck, replay, queue });
    this.saved = { lastFingerprint: p.fingerprint, results: p.results };
    this.emit("match", match);
    if (p.end.missed) this.emit("missed", p.end.missed);
    this.emit("saved", this.saved);
  }
}
