/**
 * Tipi condivisi fra il processo principale dell'app e l'interfaccia (passano dal preload con contextBridge).
 * Nessun nome né id di giocatori o partite: le partite sono i `TrackedMatch` del lettore (src/lib/tracker/match.ts).
 */
import type { TrackedMatch } from "../../../src/lib/tracker/match";

export type { TrackedMatch };

/** Problemi che l'interfaccia spiega nella lingua del giocatore. */
export type ProblemCode = "noGame" | "badReplay" | "error";

export type TrackerStatus = {
  /** Cache del profilo di Origins TCG trovata (file delle statistiche riconosciuto). */
  cache: boolean;
  /** Cartella dei replay trovata. */
  replays: boolean;
  /** Ultima lettura riuscita delle statistiche, ISO. */
  lastRead: string | null;
  /** null se va tutto bene. */
  problem: ProblemCode | null;
};

/** Il mazzo scelto adesso nel gioco (cambia appena il giocatore lo sceglie, prima della partita). */
export type ActiveDeck = { name: string | null; legendary: string | null; cards: string[] } | null;

export type AppState = {
  version: string;
  status: TrackerStatus;
  /** Partite registrate, dalla più recente. */
  matches: TrackedMatch[];
  /** Esiti di partite giocate a tracker spento, dal più recente (solo V/S). */
  missed: string;
  /** Esiti di tutte le partite secondo il gioco, dal più recente. */
  history: string;
  activeDeck: ActiveDeck;
  openAtLogin: boolean;
  dataFolder: string;
};

export type TrackerApi = {
  getState(): Promise<AppState>;
  onState(listener: (state: AppState) => void): () => void;
  setOpenAtLogin(on: boolean): Promise<boolean>;
  openDataFolder(): Promise<void>;
  /** Solo indirizzi di originsmeta.com, nel browser predefinito. */
  openLink(url: string): Promise<void>;
};
