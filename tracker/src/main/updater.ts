/**
 * Aggiornamento automatico dell'app (11/10/2026, regole in updateRules.ts). Solo nell'app impacchettata (lo zip), mai
 * nella versione di sviluppo; si spegne con ORIGINSMETA_NO_UPDATE=1.
 *
 * Giro: `UPDATE_FIRST_MS` dopo l'avvio e poi ogni `UPDATE_EVERY_MS` chiede a GitHub le release; se ce n'è una più nuova
 * scarica lo zip in una cartella temporanea (controllando la dimensione), lo scompatta con il tar di Windows e, appena
 * il gioco è chiuso, scrive uno script che aspetta la chiusura dell'app, copia i file nuovi sopra quelli vecchi
 * (robocopy) e la riapre; poi chiude l'app. I dati (%APPDATA%\OriginsMeta Analytics) non si toccano. Dalla 0.4.0
 * riapre `OriginsMeta Tracker.exe` se lo zip lo porta (cambio di nome, appIdentity.ts): il vecchio eseguibile resta
 * nella cartella, così i collegamenti che il giocatore si è fatto continuano ad aprire l'app.
 *
 * 11/10/2026 sera (Magic, playtest in finestra: "ogni tanto succede questo, dura qualche secondo, si toglie e poi si
 * bugga il tracker", con la console nera sopra il gioco e la partita non contata): l'app si aggiornava durante la
 * partita, perché "in partita" lo diceva lo scanner e in una finestra piccola il mana si legge a tratti; e la console
 * dello script si vedeva. Adesso si installa solo a gioco chiuso (`canInstall`) e lo script parte nascosto
 * (`launcherScript`).
 */
import { app, net } from "electron";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installScript, isNewer, launcherScript, pickRelease, UPDATE_API, UPDATE_ASSET, type Release } from "./updateRules";
import { EXE_NAME, LEGACY_EXE_NAME, exeAfterUpdate } from "./appIdentity";

/** Primo controllo dopo l'avvio (ORIGINSMETA_UPDATE_DELAY_MS per le prove). */
export const UPDATE_FIRST_MS = Number(process.env.ORIGINSMETA_UPDATE_DELAY_MS) || 30_000;
export const UPDATE_EVERY_MS = 3 * 60 * 60_000;
/** Con il gioco aperto non si riavvia: si riprova fra 2 minuti. */
export const UPDATE_RETRY_MS = 2 * 60_000;

export type UpdateState = { state: "idle" | "downloading" | "ready" | "installing" | "error"; version: string | null };

export class Updater {
  status: UpdateState = { state: "idle", version: null };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private busy = false;
  private readonly current: string;

  constructor(
    private readonly deps: {
      /** si può installare: il gioco è chiuso (con il gioco aperto l'app non si riavvia mai, nemmeno fra due partite) */
      canInstall: () => Promise<boolean>;
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
      const res = await net.fetch(UPDATE_API, { headers: { accept: "application/vnd.github+json", "user-agent": `OriginsMeta-Tracker/${this.current}` } });
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
    const base = path.join(os.tmpdir(), `OriginsMeta-Tracker-update-${rel.version}`);
    fs.rmSync(base, { recursive: true, force: true });
    fs.mkdirSync(base, { recursive: true });
    const zip = path.join(base, UPDATE_ASSET);
    const res = await net.fetch(rel.url, { headers: { "user-agent": `OriginsMeta-Tracker/${this.current}` } });
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
    // lo zip contiene una cartella con l'app (OriginsMeta Tracker-win32-x64; fino alla 0.3.7 OriginsMeta Analytics-…): quella con l'exe
    const exeNames = [EXE_NAME, LEGACY_EXE_NAME, path.basename(process.execPath)];
    const inner = fs.readdirSync(unpacked, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(unpacked, d.name));
    const found = [unpacked, ...inner].find((d) => exeNames.some((n) => fs.existsSync(path.join(d, n))));
    if (!found) throw new Error("exe non trovato nello zip");
    return found;
  }

  private async installWhenIdle(source: string, version: string): Promise<void> {
    if (!(await this.deps.canInstall().catch(() => false))) {
      setTimeout(() => void this.installWhenIdle(source, version), UPDATE_RETRY_MS);
      return;
    }
    this.set({ state: "installing", version });
    const target = path.dirname(process.execPath);
    const script = path.join(path.dirname(source), "install.cmd");
    const exe = exeAfterUpdate(target, fs.existsSync(path.join(source, EXE_NAME)), process.execPath);
    fs.writeFileSync(script, installScript({ pid: process.pid, source, target, exe, log: path.join(path.dirname(source), "install.log") }));
    const note = (line: string) => {
      try {
        fs.appendFileSync(path.join(path.dirname(source), "update.log"), `${new Date().toISOString()} ${line}
`);
      } catch {
        // non essenziale
      }
    };
    // lo script parte da wscript con la finestra nascosta: cmd lanciato con detached mostrava la console sopra il gioco
    const launcher = path.join(path.dirname(source), "install.vbs");
    fs.writeFileSync(launcher, launcherScript(script));
    const wscript = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "wscript.exe");
    const child = spawn(wscript, ["//B", "//Nologo", launcher], { detached: true, stdio: "ignore", windowsHide: true });
    child.on("error", (e) => note(`errore dello script: ${e.message}`));
    note(`script avviato (pid ${child.pid ?? "?"}), app ${process.pid} ${this.current} -> ${version}`);
    child.unref();
    setTimeout(() => this.deps.quit(), 1500);
  }
}
