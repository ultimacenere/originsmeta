/**
 * Modalità cattura dello scanner (10/10/2026; regole in ../shared/frames.ts, guida in docs/tracker.md "Scanner dello
 * schermo"). Solo con `--frames` (`npm run frames`): niente voce nell'interfaccia, è uno strumento per lo staff.
 *
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

export const POLL_MS = 5000;
const PARTITION = "frames";
const TEST_WINDOW = process.env.ORIGINSMETA_FRAMES_WINDOW || null;

export type FramesStatus = { capturing: boolean; frames: number; bytes: number; dir: string; full: boolean };

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

  constructor(userData: string, onChange: () => void = () => {}) {
    this.root = path.join(userData, "frames");
    this.onChange = onChange;
  }

  get status(): FramesStatus {
    return { capturing: Boolean(this.sourceId), frames: this.frames, bytes: this.bytes, dir: this.dir ?? this.root, full: this.full };
  }

  start(): void {
    if (this.timer) return;
    const ses = session.fromPartition(PARTITION);
    // la ripresa dello schermo la chiede solo la finestra nascosta di questo modulo
    ses.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "media" && wc === this.win?.webContents));
    ses.setPermissionCheckHandler((wc, perm) => perm === "media" && wc === this.win?.webContents);
    ipcMain.handle("frames:save", (e, data: unknown) => this.save(e, data));
    ipcMain.on("frames:ended", (e) => this.ended(e));
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.release("stop");
    if (this.win && !this.win.isDestroyed()) this.win.destroy();
    this.win = null;
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
    if (this.full) return;
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
    this.sessionDir();
    this.event("start", { window: game.name });
    const win = this.window();
    if (win.webContents.isLoading()) win.webContents.once("did-finish-load", () => this.sourceId && win.webContents.send("frames:start", this.sourceId));
    else win.webContents.send("frames:start", game.id);
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

  private save(e: IpcMainInvokeEvent, data: unknown): boolean {
    if (!this.fromFrames(e) || !this.sourceId || this.full) return false;
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
