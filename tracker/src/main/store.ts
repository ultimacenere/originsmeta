/**
 * Storico delle partite sul PC, nella cartella dei dati dell'app (`%APPDATA%\OriginsMeta Tracker`):
 * - `matches.jsonl`: una partita (`TrackedMatch`) per riga, solo aggiunte; una riga rotta (per esempio il PC spento a
 *   metà scrittura) si salta alla lettura;
 * - `state.json`: dove era arrivato il tracker (impronta dell'ultima partita vista, stringa degli esiti, esiti di
 *   partite giocate a tracker spento), scritto in un file temporaneo e poi rinominato.
 * Nessun dato personale: niente nomi, id, email; dell'ultima partita solo l'impronta.
 */
import fs from "node:fs";
import path from "node:path";
import { readTrackedMatch, type TrackedMatch } from "../../../src/lib/tracker/match";

export type SavedState = {
  v: 1;
  /** Impronta dell'ultima partita già vista (registrata o scartata). */
  lastFingerprint: string | null;
  /** Esiti secondo il gioco all'ultima lettura, dal più recente. */
  results: string;
  /** Esiti di partite giocate a tracker spento, dal più recente. */
  missed: string;
};

export const EMPTY_STATE: SavedState = { v: 1, lastFingerprint: null, results: "", missed: "" };
const MATCHES = "matches.jsonl";
const STATE = "state.json";

export class Store {
  readonly dir: string;
  private list: TrackedMatch[] = [];
  private ids = new Set<string>();
  private state: SavedState = { ...EMPTY_STATE };
  private loaded = false;

  constructor(dir: string) {
    this.dir = dir;
  }

  /** false se non c'era ancora nessuno stato salvato (primo avvio). */
  load(): boolean {
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(this.dir, MATCHES);
    if (fs.existsSync(file)) {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          // v1 (Fase 2) e v2 (con la coda, dal 30/09/2026): readTrackedMatch porta tutto alla v2
          const m = readTrackedMatch(JSON.parse(line));
          if (m && !this.ids.has(m.id)) {
            this.ids.add(m.id);
            this.list.push(m);
          }
        } catch {
          // riga rotta: si salta
        }
      }
    }
    let found = false;
    try {
      const s = JSON.parse(fs.readFileSync(path.join(this.dir, STATE), "utf8")) as Partial<SavedState>;
      if (s && s.v === 1) {
        this.state = { ...EMPTY_STATE, ...s, v: 1 };
        found = true;
      }
    } catch {
      // primo avvio o file rotto: si riparte dallo stato vuoto
    }
    this.loaded = true;
    return found;
  }

  get matches(): readonly TrackedMatch[] {
    return this.list;
  }

  get saved(): SavedState {
    return this.state;
  }

  /** Aggiunge una partita; false se c'era già (stessa impronta). */
  add(match: TrackedMatch): boolean {
    if (!this.loaded) throw new Error("Store.load() prima di add()");
    if (this.ids.has(match.id)) return false;
    fs.appendFileSync(path.join(this.dir, MATCHES), JSON.stringify(match) + "\n");
    this.ids.add(match.id);
    this.list.push(match);
    return true;
  }

  save(next: Partial<Omit<SavedState, "v">>): void {
    this.state = { ...this.state, ...next, v: 1 };
    const file = path.join(this.dir, STATE);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state));
    fs.renameSync(tmp, file);
  }
}
