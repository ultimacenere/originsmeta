/**
 * Aggiornamento automatico dell'app (11/10/2026, regole in updateRules.ts). Solo nell'app impacchettata (lo zip), mai
 * nella versione di sviluppo; si spegne con ORIGINSMETA_NO_UPDATE=1.
 *
 * Giro: `UPDATE_FIRST_MS` dopo l'avvio e poi ogni `UPDATE_EVERY_MS` chiede a GitHub le release; se ce n'è una più nuova
 * scarica lo zip in una cartella temporanea (controllando la dimensione), lo scompatta con il tar di Windows e, appena
 * il giocatore non è in partita, scrive uno script che aspetta la chiusura dell'app, copia i file nuovi sopra quelli
 * vecchi (robocopy) e la riapre; poi chiude l'app. I dati (%APPDATA%\OriginsMeta Analytics) non si toccano.
 */
import { app, net } from "electron";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installScript, isNewer, pickRelease, UPDATE_API, UPDATE_ASSET, type Release } from "./updateRules";

/** Primo controllo dopo l'avvio (ORIGINSMETA_UPDATE_DELAY_MS per le prove). */
export const UPDATE_FIRST_MS = Number(process.env.ORIGINSMETA_UPDATE_DELAY_MS) || 30_000;
export const UPDATE_EVERY_MS = 3 * 60 * 60_000;
/** In partita non si riavvia: si riprova fra 2 minuti. */
export const UPDATE_RETRY_MS = 2 * 60_000;

export type UpdateState = { state: "idle" | "downloading" | "ready" | "installing" | "error"; version: string | null };

export class Updater {
  status: UpdateState = { state: "idle", version: null };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private busy = false;
  private readonly current: string;

  constructor(
    private readonly deps: {
      /** il giocatore è in partita (lo dice lo scanner): l'app non si riavvia */
      inMatch: () => boolean;
      onChange: () => void;
      /** chiude l'app per l'aggiornamento */
      quit: () => void;
    },
  ) {
    // per le prove: ORIGINSMETA_UPDATE_FROM finge una versione più vecchia
    this.current = process.env.ORIGINSMETA_UPDATE_FROM || app.getVersion();
  }

  get enabled(): boolean {
    return (app.isPackaged || Boolean(process.env.ORIGINSMETA_UPDATE_FROM)) && process.env.ORIGINSMETA_NO_UPDATE !== "1" && process.platform === "win32";
  }

  start(): void {
    if (!this.enabled || this.timer) return;
    this.timer = setTimeout(() => void this.check(), UPDATE_FIRST_MS);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private set(next: UpdateState) {
    this.status = next;
    this.deps.onChange();
  }

  private again(ms: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.check(), ms);
  }

  async check(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const res = await net.fetch(UPDATE_API, { headers: { accept: "application/vnd.github+json", "user-agent": `OriginsMeta-Analytics/${this.current}` } });
      if (!res.ok) throw new Error(`github ${res.status}`);
      const rel = pickRelease(await res.json());
      if (!rel || !isNewer(rel.version, this.current)) {
        this.again(UPDATE_EVERY_MS);
        return;
      }
      const dir = await this.download(rel);
      this.set({ state: "ready", version: rel.version });
      await this.installWhenIdle(dir, rel.version);
    } catch {
      this.set({ state: "error", version: this.status.version });
      this.again(UPDATE_EVERY_MS);
    } finally {
      this.busy = false;
    }
  }

  /** Scarica e scompatta; restituisce la cartella con l'app nuova (quella che contiene l'exe). */
  private async download(rel: Release): Promise<string> {
    this.set({ state: "downloading", version: rel.version });
    const base = path.join(os.tmpdir(), `OriginsMeta-Analytics-update-${rel.version}`);
    fs.rmSync(base, { recursive: true, force: true });
    fs.mkdirSync(base, { recursive: true });
    const zip = path.join(base, UPDATE_ASSET);
    const res = await net.fetch(rel.url, { headers: { "user-agent": `OriginsMeta-Analytics/${this.current}` } });
    if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
    const out = fs.createWriteStream(zip);
    let got = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      if (got > rel.size) throw new Error("zip più grande del previsto");
      if (!out.write(Buffer.from(value))) await new Promise<void>((r) => out.once("drain", () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((e?: Error | null) => (e ? reject(e) : resolve())));
    if (got !== rel.size || fs.statSync(zip).size !== rel.size) throw new Error("dimensione dello zip diversa");
    const unpacked = path.join(base, "app");
    fs.mkdirSync(unpacked, { recursive: true });
    const tar = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
    await new Promise<void>((resolve, reject) => execFile(tar, ["-x", "-f", zip, "-C", unpacked], { windowsHide: true }, (e) => (e ? reject(e) : resolve())));
    // lo zip contiene una cartella con l'app (OriginsMeta Analytics-win32-x64): quella con l'exe
    const exeName = path.basename(process.execPath);
    const inner = fs.readdirSync(unpacked, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(unpacked, d.name));
    const found = [unpacked, ...inner].find((d) => fs.existsSync(path.join(d, exeName)) || fs.existsSync(path.join(d, "OriginsMeta Analytics.exe")));
    if (!found) throw new Error("exe non trovato nello zip");
    return found;
  }

  private async installWhenIdle(source: string, version: string): Promise<void> {
    if (this.deps.inMatch()) {
      setTimeout(() => void this.installWhenIdle(source, version), UPDATE_RETRY_MS);
      return;
    }
    this.set({ state: "installing", version });
    const target = path.dirname(process.execPath);
    const script = path.join(path.dirname(source), "install.cmd");
    fs.writeFileSync(script, installScript({ pid: process.pid, source, target, exe: process.execPath, log: path.join(path.dirname(source), "install.log") }));
    const note = (line: string) => {
      try {
        fs.appendFileSync(path.join(path.dirname(source), "update.log"), `${new Date().toISOString()} ${line}
`);
      } catch {
        // non essenziale
      }
    };
    const child = spawn("cmd.exe", ["/d", "/c", script], { detached: true, stdio: "ignore", windowsHide: true });
    child.on("error", (e) => note(`errore dello script: ${e.message}`));
    note(`script avviato (pid ${child.pid ?? "?"}), app ${process.pid} ${this.current} -> ${version}`);
    child.unref();
    setTimeout(() => this.deps.quit(), 1500);
  }
}
