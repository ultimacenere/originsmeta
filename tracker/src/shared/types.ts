/**
 * Tipi condivisi fra il processo principale dell'app e l'interfaccia (passano dal preload con contextBridge).
 * Nessun nome né id di giocatori o partite: le partite sono i `TrackedMatch` del lettore (src/lib/tracker/match.ts).
 */
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { ScanFrame } from "./reconstruct";

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

/** Problemi dell'invio delle partite al sito (sync.ts); i testi stanno nell'interfaccia. */
export type SyncProblem = "offline" | "server" | "rate_limited" | "unavailable" | "unlinked";
/** Problemi del collegamento con il codice (sync.ts, `claimCode`). */
export type LinkProblem = "invalid_code" | "too_many_devices" | "unavailable" | "offline" | "error";

/** Collegamento all'account OriginsMeta e invio delle partite (Fase 3, 30/09/2026). Mai il token. */
export type AccountState = {
  linked: boolean;
  username: string | null;
  linkedAt: string | null;
  /** false: la cifratura di Windows non c'è e il collegamento vale fino alla chiusura dell'app */
  persisted: boolean;
  /** partite dello storico che il sito non ha ancora */
  pending: number;
  lastSyncAt: string | null;
  problem: SyncProblem | null;
  running: boolean;
  /** "unlinked": il sito ha scollegato questo PC (resta finché non si ricollega); "relink": il collegamento salvato
   *  non si legge più su questo PC (account.ts, `unreadable`) e va rifatto */
  notice: "unlinked" | "relink" | null;
};

/**
 * Quello che mostra l'overlay (Fase 4, 30/09/2026; overlay.ts): mazzo scelto nel gioco, sessione, record del mazzo
 * nello storico sul PC, ultima partita finita. Mai bot o persona, mai il rank dell'avversario, mai nomi.
 */
export type OverlayView = {
  /** `legendarySlug`: indirizzo dell'immagine della carta sul sito (originsmeta.com/cards/<slug>.webp), dal 01/10/2026 */
  deck: { name: string | null; legendary: string | null; legendaryName: string | null; legendarySlug: string | null } | null;
  session: { wins: number; losses: number };
  /** il mazzo scelto adesso, in tutto lo storico sul PC (stesse 13 carte) */
  deckRecord: { wins: number; losses: number; games: number } | null;
  last: { result: "W" | "L" | null; opponentLegendary: string | null; opponentName: string | null; opponentSlug: string | null } | null;
  updatedAt: string;
};

/** Overlay (Fase 4, 30/09/2026): finestra sopra il gioco e sorgente per OBS. */
export type OverlayState = {
  /** la finestra sopra il gioco è aperta */
  window: boolean;
  /** la finestra lascia passare i clic al gioco */
  clickThrough: boolean;
  /** indirizzo della sorgente per OBS (solo su questo PC), null se il server locale non è partito */
  obsUrl: string | null;
  /** inizio della sessione dell'overlay (avvio dell'app o "Nuova sessione"), ISO */
  sessionStart: string;
  /** quello che l'overlay mostra adesso */
  view: OverlayView;
  /** la finestra del pannello del mazzo è aperta (10/10/2026) */
  deckWindow: boolean;
  /** indirizzo del pannello del mazzo per OBS, null se il server locale non è partito */
  deckObsUrl: string | null;
};

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
  account: AccountState;
  overlay: OverlayState;
  /** Scanner dello schermo (10/10/2026): acceso, finestra del gioco ripresa adesso, avviso del primo avvio già visto. */
  scanner: { on: boolean; capturing: boolean; noticeSeen: boolean };
};

export type LinkResult = { ok: true; username: string | null } | { ok: false; problem: LinkProblem };

/** Quello che la finestra dell'overlay può chiamare (preload a parte, overlay-preload.ts): solo leggere i dati. */
export type OverlayApi = {
  getView(): Promise<{ view: OverlayView; clickThrough: boolean } | null>;
  onView(listener: (state: { view: OverlayView; clickThrough: boolean }) => void): () => void;
};

export type TrackerApi = {
  getState(): Promise<AppState>;
  onState(listener: (state: AppState) => void): () => void;
  setOpenAtLogin(on: boolean): Promise<boolean>;
  openDataFolder(): Promise<void>;
  /** Solo indirizzi di originsmeta.com, nel browser predefinito. */
  openLink(url: string): Promise<void>;
  /** Collega l'app all'account con il codice creato in originsmeta.com/account/tracker. */
  linkAccount(code: string): Promise<LinkResult>;
  /** Scollega questo PC (anche sul sito, se c'è la rete). */
  unlinkAccount(): Promise<void>;
  /** Manda subito le partite in attesa. */
  syncNow(): Promise<void>;
  /** Apre o chiude la finestra sopra il gioco. */
  setOverlayWindow(on: boolean): Promise<boolean>;
  /** Apre o chiude il pannello del mazzo (10/10/2026). */
  setDeckWindow(on: boolean): Promise<boolean>;
  /** Accende o spegne lo scanner dello schermo; restituisce lo stato vero. */
  setScanner(on: boolean): Promise<boolean>;
  /** L'avviso del primo avvio sullo scanner è stato letto. */
  dismissScannerNotice(): Promise<void>;
  /** La finestra sopra il gioco lascia passare i clic (true) o si può spostare (false). */
  setOverlayClickThrough(on: boolean): Promise<boolean>;
  /** Azzera vittorie e sconfitte della sessione dell'overlay. */
  resetSession(): Promise<void>;
  /** Copia un testo negli appunti (l'indirizzo per OBS). */
  copyText(text: string): Promise<void>;
};

/** Finestra nascosta dello scanner (main/frames.ts, 10/10/2026). */
export type FramesApi = {
  /** L'id della finestra del gioco da riprendere (desktopCapturer); `save`: modalità cattura, si salvano anche i JPEG. */
  onStart(listener: (sourceId: string, opts: { save: boolean }) => void): void;
  onStop(listener: () => void): void;
  /** Un fotogramma JPEG; false se il processo principale non l'ha salvato. */
  save(jpeg: Uint8Array): Promise<boolean>;
  /** La ripresa si è chiusa da sola. */
  ended(): void;
  /** Un fotogramma letto dal riconoscitore (shared/reconstruct.ts). */
  scan(frame: ScanFrame): void;
};

/** Una carta del pannello del mazzo (deckTracker.ts): `copies` nel mazzo, `played` quelle viste giocare in questa partita. */
export type DeckCard = { key: string; name: string; slug: string | null; mana: number | null; spell: boolean; legendary: boolean; copies: number; played: number };

/**
 * Il pannello del mazzo (10/10/2026, "Deck tracker"): il mazzo scelto nel gioco, aggiornato dal vivo dallo scanner
 * durante la partita. Mostra solo quello che il gioco mostra: le mie carte, il round, la Leggendaria dell'avversario
 * (schermata VS) e le sue carte rivelate. Mai nomi, mai bot o persona, mai il rank.
 */
export type DeckTrackerView = {
  deck: { name: string | null; legendary: DeckCard | null; cards: DeckCard[] } | null;
  record: { wins: number; losses: number; games: number } | null;
  /** lo scanner è acceso (senza, il pannello mostra solo il mazzo) */
  scanner: boolean;
  /** la partita in corso o appena finita, dallo scanner */
  live: { inMatch: boolean; round: number | null; opponent: { legendary: DeckCard | null; seen: DeckCard[] } } | null;
  updatedAt: string;
};

export type DeckApi = {
  getView(): Promise<DeckTrackerView | null>;
  onView(listener: (view: DeckTrackerView) => void): () => void;
};
