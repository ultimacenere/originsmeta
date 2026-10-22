/**
 * Tipi condivisi fra il processo principale dell'app e l'interfaccia (passano dal preload con contextBridge).
 * Nessun nome né id di giocatori o partite: le partite sono i `TrackedMatch` del lettore (src/lib/tracker/match.ts).
 */
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { ScanFrame } from "./reconstruct";
import type { LockReason } from "../main/access";

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
 * Solo con l'account (0.4.0, 12/10/2026; main/access.ts): senza un collegamento verificato l'app è bloccata e
 * l'interfaccia mostra solo la schermata di collegamento.
 */
export type AccessView = {
  open: boolean;
  /** perché è bloccata (null se aperta) */
  reason: LockReason | null;
  /** una verifica del token con il sito è in corso */
  checking: boolean;
  /** l'ultima verifica non ha raggiunto il sito: l'app va avanti fino a `graceUntil` */
  offline: boolean;
  /** ultima verifica riuscita e fine della tolleranza, ISO (null se mai verificata) */
  verifiedAt: string | null;
  graceUntil: string | null;
  /** partite già registrate su questo PC (restano lì anche ad app bloccata) */
  localMatches: number;
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

/**
 * Template dei pannelli sopra il gioco (0.4.1, 12/10/2026, disegni di Pierluigi): `classic` = Deck tracker a griglia
 * nella fascia a sinistra e pannello a L dell'avversario in alto a destra; `strips` = "Fasce in alto", due fasce
 * orizzontali sul bordo alto del gioco (le 12 carte e la Leggendaria del mio mazzo; Leggendaria e carte rivelate
 * dell'avversario); `columns` = "Colonne ai lati", due colonne sui bordi del tabellone (a sinistra il mio mazzo e le
 * carte ancora nel mazzo; a destra, sopra il pannello del mana del gioco, Leggendaria e carte rivelate dell'avversario,
 * le sue carte rimanenti e il mana dei due giocatori con la freccia del combattimento); `custom` = "Personalizzato",
 * con le opzioni di `PanelCustom` scelte in Setup.
 */
export type PanelTemplate = "classic" | "strips" | "columns" | "custom";
export const PANEL_TEMPLATES: readonly PanelTemplate[] = ["classic", "strips", "columns", "custom"];

/**
 * Il template personalizzato (0.4.1, 12/10/2026, Pierluigi: "customizzazione del tracker, righe e posizioni, orizzontale
 * o verticale, trasparenza, carte solo nomi in riga o carte disegnate"). Valori controllati da `readCustom`
 * (main/panelLayout.ts).
 */
export type PanelCustom = {
  /** `vertical`: i numeri sotto le carte; `horizontal`: accanto, a destra (pannello largo e basso) */
  orientation: "vertical" | "horizontal";
  /** carte disegnate o solo i nomi in riga (gemma del mana, nome, copie) */
  cards: "art" | "names";
  /** carte (o righe di nomi) per fila, da 1 a 13 */
  perRow: number;
  /** opacità del fondo del pannello, da 0 (trasparente) a 100 */
  opacity: number;
  /** le carte finite (tutte le copie pescate) spariscono invece di scurirsi */
  hideOut: boolean;
  /** cosa mostrare del mio mazzo */
  me: { legendary: boolean; deckLeft: boolean; life: boolean };
  /** cosa mostrare dell'avversario */
  opp: { legendary: boolean; deckLeft: boolean; life: boolean; mana: boolean };
};
/** Un cambio delle opzioni del personalizzato: solo i campi che cambiano. */
export type PanelCustomChange = Omit<Partial<PanelCustom>, "me" | "opp"> & { me?: Partial<PanelCustom["me"]>; opp?: Partial<PanelCustom["opp"]> };

/** Overlay (Fase 4, 30/09/2026): finestra sopra il gioco e sorgente per OBS. */
export type OverlayState = {
  /** il template dei pannelli (0.4.1) e le opzioni di quello personalizzato */
  template: PanelTemplate;
  custom: PanelCustom;
  /** i pannelli si vedono solo durante la partita (0.4.1, serve lo scanner acceso) */
  onlyInMatch: boolean;
  /** i pannelli non finiscono nelle riprese dello schermo (OBS): li mostra l'estensione Twitch (0.4.3, 14/10/2026) */
  hideFromStream: boolean;
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
  /** la finestra con le carte dell'avversario è aperta (11/10/2026) e il suo indirizzo per OBS */
  oppWindow: boolean;
  oppObsUrl: string | null;
};

export type AppState = {
  version: string;
  /** Solo con l'account (0.4.0): con `open: false` partite, storico e mazzo arrivano vuoti. */
  access: AccessView;
  status: TrackerStatus;
  /** Partite registrate, dalla più recente. */
  matches: TrackedMatch[];
  /** Esiti di partite giocate a tracker spento, dal più recente (solo V/S). */
  missed: string;
  /** Esiti di tutte le partite secondo il gioco, dal più recente. */
  history: string;
  activeDeck: ActiveDeck;
  /** Avvio automatico (startup.ts, 16/10/2026). */
  startMode: "off" | "game";
  dataFolder: string;
  account: AccountState;
  overlay: OverlayState;
  /** Aggiornamento automatico in corso (11/10/2026, updater.ts); null se non c'è niente da dire. */
  update: { state: "idle" | "downloading" | "ready" | "installing" | "error"; version: string | null } | null;
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
  setStartMode(mode: "off" | "game"): Promise<"off" | "game">;
  openDataFolder(): Promise<void>;
  /** Solo indirizzi di originsmeta.com, nel browser predefinito. */
  openLink(url: string): Promise<void>;
  /** Collega l'app all'account con il codice creato in originsmeta.com/account/tracker. */
  linkAccount(code: string): Promise<LinkResult>;
  /** Scollega questo PC (anche sul sito, se c'è la rete). */
  unlinkAccount(): Promise<void>;
  /** Manda subito le partite in attesa. */
  syncNow(): Promise<void>;
  /** Verifica subito il collegamento con il sito (tasto "Riprova" della schermata di blocco, 0.4.0). */
  verifyNow(): Promise<void>;
  /** Apre o chiude la finestra sopra il gioco. */
  setOverlayWindow(on: boolean): Promise<boolean>;
  /** Apre o chiude il pannello del mazzo (10/10/2026). */
  setDeckWindow(on: boolean): Promise<boolean>;
  /** Apre o chiude la finestra con le carte dell'avversario (11/10/2026). */
  setOppWindow(on: boolean): Promise<boolean>;
  /** Sceglie il template dei pannelli (0.4.1): i pannelli aperti si riaprono con quello nuovo; restituisce quello in uso. */
  setPanelTemplate(template: PanelTemplate): Promise<PanelTemplate>;
  /** Cambia le opzioni del template personalizzato (anche solo una; "reset" = quelle di partenza); i pannelli si aggiornano subito. Restituisce quelle in uso. */
  setPanelCustom(custom: PanelCustomChange | "reset"): Promise<PanelCustom>;
  /** Pannelli solo durante la partita (true) o sempre (false); restituisce la scelta in uso. */
  setPanelsOnlyInMatch(on: boolean): Promise<boolean>;
  /** Pannelli esclusi dalle riprese dello schermo (true) o no; restituisce la scelta in uso. */
  setPanelsHideFromStream(on: boolean): Promise<boolean>;
  /** Chiude l'app, con overlay, pannelli e scanner (11/10/2026). */
  quitApp(): Promise<void>;
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
  /** Tutorial (12/10/2026): i pannelli sopra il gioco si illuminano per farsi trovare (true) o tornano normali. */
  spotPanels(on: boolean): Promise<void>;
};

/** Finestra nascosta dello scanner (main/frames.ts, 10/10/2026). */
export type FramesStartOpts = { save: boolean; screens: [number, number][] };

export type FramesApi = {
  /**
   * L'id della finestra del gioco da riprendere (desktopCapturer); `save`: modalità cattura, si salvano anche i JPEG;
   * `screens`: misure in pixel veri degli schermi, per riconoscere lo schermo intero (niente barra del titolo).
   */
  onStart(listener: (sourceId: string, opts: FramesStartOpts) => void): void;
  onStop(listener: () => void): void;
  /** Un fotogramma JPEG; false se il processo principale non l'ha salvato. */
  save(jpeg: Uint8Array): Promise<boolean>;
  /** La ripresa si è chiusa da sola. */
  ended(): void;
  /** Un fotogramma letto dal riconoscitore (shared/reconstruct.ts). */
  scan(frame: ScanFrame): void;
  /**
   * Il ritaglio PNG del nome dell'avversario nella schermata VS (14/10/2026, shared/botNames.ts): il processo principale
   * lo legge con l'OCR di Windows solo per sapere se è un bot, poi lo dimentica.
   */
  name(png: Uint8Array): void;
  /**
   * Il ritaglio PNG, nero su bianco, della zona sopra il mio ritratto nella schermata VS (22/10/2026): il processo
   * principale lo legge con l'OCR di Windows solo per sapere se c'è una lega (partita classificata), poi lo dimentica.
   */
  league(png: Uint8Array): void;
};

/**
 * Una carta del pannello del mazzo (deckTracker.ts): `copies` nel mazzo, `played` quelle viste giocare in questa partita,
 * `drawn` quelle pescate (in mano o già giocate; dall'11/10/2026, mai meno delle giocate).
 */
export type DeckCard = { key: string; name: string; slug: string | null; mana: number | null; spell: boolean; legendary: boolean; copies: number; played: number; drawn: number };

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
  live: {
    inMatch: boolean;
    round: number | null;
    /** carte ancora nel mio mazzo: 25 meno quelle pescate (11/10/2026, overlay di Davdas) */
    deckLeft: number | null;
    /** segmenti di vita accesi degli eroi, 0–2 (anello sotto la miniatura) */
    life: { me: number | null; opp: number | null };
    /** il mana dei due giocatori, "rimasto/massimo", e il verso del combattimento (11/10/2026 sera: pannello a L) */
    mana: { me: { current: number; max: number } | null; opp: { current: number; max: number } | null };
    direction: "left" | "right" | null;
    /** `deckLeft`: carte ancora nel mazzo dell'avversario, stimate dalla sua mano (12/10/2026; null se non si sa) */
    opponent: { deckLeft: number | null; legendary: DeckCard | null; seen: DeckCard[] };
  } | null;
  /** le opzioni del template personalizzato quando è quello in uso (0.4.1), così le ricevono anche la finestra e OBS */
  custom?: PanelCustom | null;
  /** fuori partita con "solo durante la partita" acceso: la sorgente per OBS resta vuota (le finestre si nascondono) */
  hidden?: boolean;
  updatedAt: string;
};

export type DeckApi = {
  getView(): Promise<DeckTrackerView | null>;
  onView(listener: (view: DeckTrackerView) => void): () => void;
  /** L'altezza del contenuto in pixel CSS: la finestra si adatta, niente barra di scorrimento (11/10/2026). */
  fit(height: number): void;
  /** Chiude il pannello (la finestra non ha più la cornice di Windows). */
  close(): void;
  /** Deck tracker (12/10/2026): allargamento con la maniglia cominciato (true) o finito; la finestra trasparente non si ridimensiona dai bordi. */
  resize(on: boolean): void;
  /** Tutorial della finestra principale (12/10/2026): il pannello si illumina per farsi trovare. */
  onSpot(listener: (on: boolean) => void): () => void;
};
