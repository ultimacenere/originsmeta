/**
 * Scanner dello schermo (10/10/2026; regole in ../shared/frames.ts, riconoscitore in ../shared/recognize.ts e
 * reconstruct.ts, guida in docs/tracker.md "Scanner dello schermo"). Acceso di default dalla 0.3.0 (10/10/2026,
 * Pierluigi), si spegne e si riaccende dall'app senza riavviarla (`start`/`stop`, preferenza in scan.json di main.ts);
 * `--frames` (`npm run frames`) salva anche i fotogrammi, per la taratura.
 *
 * La finestra nascosta legge ogni fotogramma cambiato e manda qui solo il risultato (`ScanFrame`: carte dei 18 spazi,
 * Leggendarie della schermata VS, mana massimo), che resta in memoria per `KEEP_MS`; quando il tracker chiude una
 * partita, `scanFor` ne ricostruisce giocate e carte dell'avversario (main.ts, `applyScan`).
 *
 * Modalità cattura:
 * Ogni `POLL_MS` cerca la finestra del gioco per titolo esatto; quando c'è, una finestra nascosta la riprende (sola
 * lettura dello schermo, come OBS: niente processo del gioco) e manda qui un JPEG ogni `FRAME_MS`, solo se lo schermo
 * è cambiato. I fotogrammi vanno in `<dati dell'app>\frames\<sessione>\`, accanto a `events.jsonl` (inizio e fine
 * della ripresa, mazzo scelto, partite registrate dal tracker) che serve a etichettarli. **Restano sul PC**: contengono
 * anche i nomi dei giocatori e niente di questa cartella va al sito.
 *
 * Per le prove senza il gioco: ORIGINSMETA_FRAMES_WINDOW=<titolo esatto di un'altra finestra>.
 */
import { BrowserWindow, desktopCapturer, ipcMain, session, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import path from "node:path";
import { frameFileName, isJpegFrame, MAX_SESSION_BYTES, pickGameWindow, sessionDirName } from "../shared/frames";
import { readScanFrame, reconstruct, scanFor, splitMatches, type CardInfo, type ScanFrame, type ScannedMatch } from "../shared/reconstruct";

/** La partita resta "dal vivo" nel pannello del mazzo fino a 10 minuti dopo l'ultimo fotogramma con il mana letto. */
export const LIVE_MS = 10 * 60_000;
/** Si gioca ancora se il mana si è letto negli ultimi 30 secondi. */
export const IN_MATCH_MS = 30_000;

export const POLL_MS = 5000;
const PARTITION = "frames";
const TEST_WINDOW = process.env.ORIGINSMETA_FRAMES_WINDOW || null;

export type FramesStatus = { capturing: boolean; frames: number; bytes: number; dir: string; full: boolean; scanned: number };

/** I fotogrammi letti restano in memoria un'ora (una partita dura 10–15 minuti), al massimo `KEEP_FRAMES`. */
export const KEEP_MS = 60 * 60_000;
export const KEEP_FRAMES = 20_000;

export class FrameRecorder {
  private readonly root: string;
  private readonly startedAt = Date.now();
  private dir: string | null = null;
  private win: BrowserWindow | null = null;
  private sourceId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frames = 0;
  private bytes = 0;
  private full = false;
  private onChange: () => void;
  private readonly save: boolean;
  private readonly cards: CardInfo;
  private scans: ScanFrame[] = [];

  /** `save`: modalità cattura (anche i JPEG e `events.jsonl` sul PC). */
  private onScan: () => void;
  private liveCache: { at: number; value: { scan: ScannedMatch; inMatch: boolean } | null } | null = null;

  constructor(userData: string, opts: { save: boolean; cards: CardInfo; onScan?: () => void }, onChange: () => void = () => {}) {
    this.onScan = opts.onScan ?? (() => {});
    this.root = path.join(userData, "frames");
    this.save = opts.save;
    this.cards = opts.cards;
    this.onChange = onChange;
  }

  get status(): FramesStatus {
    return { capturing: Boolean(this.sourceId), frames: this.frames, bytes: this.bytes, dir: this.dir ?? this.root, full: this.full, scanned: this.scans.length };
  }

  /** La partita letta dallo schermo che corrisponde a una partita finita a `endedAtMs` (ora del PC). */
  /**
   * La partita di adesso per il pannello del mazzo: l'ultima della memoria, se il suo mana si è letto da poco. Ricalcolata
   * al massimo una volta al secondo (le letture arrivano due volte al secondo).
   */
  live(now = Date.now()): { scan: ScannedMatch; inMatch: boolean } | null {
    if (this.liveCache && now - this.liveCache.at < 1000) return this.liveCache.value;
    const pieces = splitMatches(this.scans);
    const piece = pieces[pieces.length - 1];
    const lastMana = piece ? [...piece].reverse().find((f) => f.maxMana !== null)?.ms : undefined;
    const value = piece && lastMana !== undefined && now - lastMana <= LIVE_MS ? { scan: reconstruct(piece, this.cards), inMatch: now - lastMana <= IN_MATCH_MS } : null;
    this.liveCache = { at: now, value };
    return value;
  }

  matchFor(endedAtMs: number): ScannedMatch | null {
    return Number.isFinite(endedAtMs) ? scanFor(this.scans, endedAtMs, this.cards) : null;
  }

  private ready = false;

  /** Lo scanner sta guardando (acceso), anche se il gioco non è aperto. */
  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer) return;
    if (!this.ready) {
      // una volta sola: i gestori restano anche quando lo scanner si spegne e si riaccende
      this.ready = true;
      const ses = session.fromPartition(PARTITION);
      // la ripresa dello schermo la chiede solo la finestra nascosta di questo modulo
      ses.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "media" && wc === this.win?.webContents));
      ses.setPermissionCheckHandler((wc, perm) => perm === "media" && wc === this.win?.webContents);
      ipcMain.handle("frames:save", (e, data: unknown) => this.saveFrame(e, data));
      ipcMain.on("frames:ended", (e) => this.ended(e));
      ipcMain.on("frames:scan", (e, raw: unknown) => this.scan(e, raw));
    }
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
    this.onChange();
  }

  /** Spegne la ripresa e dimentica le letture in memoria (spento vuol dire spento). */
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.release("stop");
    if (this.win && !this.win.isDestroyed()) this.win.destroy();
    this.win = null;
    this.scans = [];
    this.liveCache = null;
    this.onChange();
  }

  /** Una riga di `events.jsonl` (partite, mazzo scelto): solo mentre si riprende o se la sessione è già aperta. */
  event(kind: string, data: Record<string, unknown> = {}): void {
    if (!this.dir) return;
    try {
      fs.appendFileSync(path.join(this.dir, "events.jsonl"), JSON.stringify({ t: kind, at: new Date().toISOString(), ms: Date.now() - this.startedAt, ...data }) + "\n");
    } catch {
      // non essenziale
    }
  }

  private sessionDir(): string {
    if (!this.dir) {
      this.dir = path.join(this.root, sessionDirName(new Date(this.startedAt)));
      fs.mkdirSync(this.dir, { recursive: true });
    }
    return this.dir;
  }

  private async poll() {
    if (this.full || !this.timer) return;
    let game: { id: string; name: string } | null = null;
    try {
      // senza miniature: Electron non riprende le altre finestre per elencarle
      const sources = await desktopCapturer.getSources({ types: ["window"], thumbnailSize: { width: 0, height: 0 } });
      game = pickGameWindow(sources.map((s) => ({ id: s.id, name: s.name })), TEST_WINDOW ? [TEST_WINDOW] : undefined);
    } catch {
      return;
    }
    if (!game) return this.release("window-gone");
    if (game.id === this.sourceId) return;
    this.release("window-changed");
    this.sourceId = game.id;
    if (this.save) this.sessionDir();
    this.event("start", { window: game.name });
    const win = this.window();
    const opts = { save: this.save };
    if (win.webContents.isLoading()) win.webContents.once("did-finish-load", () => this.sourceId && win.webContents.send("frames:start", this.sourceId, opts));
    else win.webContents.send("frames:start", game.id, opts);
    this.onChange();
  }

  private release(reason: string) {
    if (!this.sourceId) return;
    this.sourceId = null;
    if (this.win && !this.win.isDestroyed()) this.win.webContents.send("frames:stop");
    this.event("stop", { reason });
    this.onChange();
  }

  private window(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) return this.win;
    this.win = new BrowserWindow({
      show: false,
      width: 320,
      height: 180,
      webPreferences: {
        partition: PARTITION,
        preload: path.join(__dirname, "frames-preload.js"),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        // la ripresa continua anche con la finestra nascosta
        backgroundThrottling: false,
      },
    });
    this.win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    this.win.webContents.on("will-navigate", (e) => e.preventDefault());
    void this.win.loadFile(path.join(__dirname, "frames", "frames.html"));
    return this.win;
  }

  private fromFrames(e: IpcMainInvokeEvent | IpcMainEvent): boolean {
    return Boolean(e.senderFrame?.url.startsWith("file://")) && Boolean(this.win) && e.sender === this.win?.webContents;
  }

  private scan(e: IpcMainEvent, raw: unknown) {
    if (!this.fromFrames(e) || !this.sourceId) return;
    const now = Date.now();
    const f = readScanFrame(raw, now);
    if (!f) return;
    this.scans.push(f);
    this.onScan();
    // modalità cattura: anche le letture sul PC, accanto ai fotogrammi, per confrontarle con quelle di scan-frames.mjs
    if (this.save && this.dir) {
      try {
        fs.appendFileSync(path.join(this.dir, "scan.jsonl"), JSON.stringify({ ...f, ms: f.ms - this.startedAt }) + "\n");
      } catch {
        // non essenziale
      }
    }
    const old = this.scans.findIndex((x) => x.ms >= now - KEEP_MS);
    if (old > 0) this.scans.splice(0, old);
    if (this.scans.length > KEEP_FRAMES) this.scans.splice(0, this.scans.length - KEEP_FRAMES);
  }

  private saveFrame(e: IpcMainInvokeEvent, data: unknown): boolean {
    if (!this.save || !this.fromFrames(e) || !this.sourceId || this.full) return false;
    const bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : null;
    if (!bytes || !isJpegFrame(bytes)) return false;
    if (this.bytes + bytes.length > MAX_SESSION_BYTES) {
      this.full = true;
      this.release("full");
      return false;
    }
    try {
      fs.writeFileSync(path.join(this.sessionDir(), frameFileName(Date.now() - this.startedAt)), bytes);
    } catch {
      return false;
    }
    this.frames++;
    this.bytes += bytes.length;
    if (this.frames % 20 === 1) this.onChange();
    return true;
  }

  /** La ripresa si è chiusa da sola (gioco chiuso o finestra ridotta a icona): al prossimo giro si riprova. */
  private ended(e: IpcMainEvent) {
    if (!this.fromFrames(e)) return;
    this.release("stream-ended");
  }
}
