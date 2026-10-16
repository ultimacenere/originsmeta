/**
 * OriginsMeta Tracker, processo principale (Fasi 2–4 del tracker/overlay, 29–30/09/2026; guida in docs/tracker.md).
 * Si chiamava OriginsMeta Tracker fino al 01/10/2026, OriginsMeta Analytics dal 01/10 al 12/10/2026 (Pierluigi, 12/10:
 * "l'app si chiama OriginsMeta Tracker"; Analytics è la pagina delle statistiche sul sito). Il nome cambia solo dove si
 * vede: cartella dei dati, AppUserModelId e release restano quelli di prima (appIdentity.ts). Al primo avvio dopo il
 * 01/10 i dati passavano dalla cartella vecchia (`moveOldData`).
 *
 * - Icona accanto all'orologio: clic = apri la finestra; menu con "Apri", "Overlay sopra il gioco", "Avvio
 *   automatico" ed "Esci". Dal 10/10/2026 la X della finestra chiude tutta l'app (prima la nascondeva); avviata in
 *   automatico l'app resta solo nella barra finché non si apre la finestra o si sceglie "Esci".
 * - Avvio automatico (startup.ts, 16/10/2026): "Con il gioco" (di default dalla 0.4.7: voce di Windows "Esegui
 *   all'avvio" con `--hidden --wait-game`, l'app aspetta in silenzio che il gioco sia aperto e poi parte nella barra),
 *   "Con Windows" (`--hidden`, subito nella barra) o "Mai". Avviata così registra le partite ma non apre né la
 *   finestra né overlay e pannelli: si aprono quando il giocatore apre l'app.
 * - Una sola copia aperta: la seconda riporta in primo piano la prima.
 * - Account OriginsMeta (Fase 3): collegamento con il codice di originsmeta.com/account/tracker, token cifrato con
 *   safeStorage (account.ts), invio delle partite a gruppi con i tentativi (sync.ts): subito dopo ogni partita, all'avvio
 *   e ogni 5 minuti se qualcosa resta indietro. ORIGINSMETA_TRACKER_SITE (solo https o localhost) punta a un altro sito
 *   per le prove.
 * - Overlay (Fase 4): una finestra piccola sopra il gioco (sempre in primo piano, trasparente, lascia passare i clic
 *   finché il giocatore non sceglie "Sposta") e la sorgente per OBS servita solo su 127.0.0.1 (overlay.ts). Mai
 *   agganciata alla grafica del gioco: è una finestra separata. Con il gioco a schermo intero esclusivo Windows non la
 *   mostra: serve la modalità a finestra o a finestra senza bordi.
 * - Pannelli (deckTracker.ts): "Deck tracker" (10/10/2026), una finestra accanto al gioco, sempre in primo piano, con il
 *   mazzo scelto aggiornato dal vivo dallo scanner (carte giocate, round), e dall'11/10/2026 "Carte dell'avversario",
 *   una seconda finestra con la Leggendaria e le carte rivelate dall'avversario. La stessa pagina per OBS su
 *   /overlay/deck e /overlay/deck?view=opp. Si accendono dall'app o dal menu dell'icona; posizione e misure in
 *   deck.json e opponent.json.
 * - Aggiornamento automatico (11/10/2026, updater.ts): l'app impacchettata controlla le release su GitHub, scarica la
 *   versione nuova e si riavvia aggiornata quando il giocatore non è in partita.
 * - Sicurezza: interfaccia senza Node (contextIsolation, sandbox, preload minimi), nessuna navigazione né finestra
 *   nuova, nessun permesso del browser, link esterni solo verso https://originsmeta.com, IPC accettato solo dalla
 *   pagina locale dell'app (la finestra dell'overlay legge solo i suoi dati).
 * - `--capture=<file.png>` (con `--capture-size=LxA`, `--capture-bottom` o `--capture-scroll=<px>` per scorrere la
 *   pagina e `--capture-delay=<ms>` per aspettare le immagini delle carte): apre la finestra,
 *   aspetta che l'interfaccia abbia disegnato, salva uno screenshot ed esce. Serve alle verifiche; con
 *   ORIGINSMETA_TRACKER_DATA si usa una cartella dati di prova. Niente rete né finestra dell'overlay in questa modalità
 *   (la sorgente per OBS sì, per mostrarne gli indirizzi).
 * - Scanner dello schermo (10/10/2026, frames.ts): riprende la finestra del gioco, riconosce le carte e, quando una
 *   partita finisce senza replay, ne aggiunge giocate e carte dell'avversario (`applyScan`). Acceso di default dalla
 *   0.3.0 (Pierluigi: "acceso"), con un avviso al primo avvio e un interruttore nell'app e nel menu dell'icona
 *   (preferenza in scan.json). `--frames` (`npm run frames`) salva anche i fotogrammi sul PC, per la taratura.
 * - **Solo con l'account** (0.4.0, 12/10/2026, access.ts; Pierluigi: "se non sono registrati con il cazzo possono
 *   usarla"): senza un collegamento verificato dal sito il "motore" (watcher dei file del gioco, scanner, overlay,
 *   pannelli, sorgente per OBS, invio) resta spento e la finestra mostra solo il collegamento e "Chiudi l'app". Il token
 *   si verifica all'avvio e ogni 4 ore; token rifiutato = blocco subito; sito irraggiungibile = 7 giorni di tolleranza
 *   dall'ultima verifica riuscita. Lo storico sul PC non si tocca. Resta acceso solo l'aggiornamento automatico, così
 *   anche un'app bloccata riceve le correzioni. `--capture-unlocked` (solo fuori dall'app impacchettata) fotografa
 *   l'app sbloccata per le verifiche; `--capture-setup` apre la pagina Setup.
 */
import { app, BrowserWindow, clipboard, desktopCapturer, ipcMain, Menu, nativeImage, net, safeStorage, screen, session, shell, Tray, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cardsTable from "../cards.json";
import { gameDirs } from "./paths";
import { Store } from "./store";
import { MatchWatcher } from "./watcher";
import { Account, type Cipher } from "./account";
import { SyncQueue, claimCode, siteBase, unlinkRemote, verifyToken, type SyncDeps } from "./sync";
import { checkDue, decideAccess, type Access } from "./access";
import { APP_NAME, APP_USER_MODEL_ID, OLD_DATA_FOLDER, dataDir, staleLoginItem } from "./appIdentity";
import { overlayView, startOverlayServer, type CardLookup } from "./overlay";
import { LivePusher, LIVE_MIN_MS } from "./twitchLive";
import type { LiveRect, LiveUi } from "../../../src/lib/tracker/live";
import { FrameRecorder } from "./frames";
import { Updater } from "./updater";
import { justUpdated, updateNotice, type UpdateNotice } from "./updateRules";
import { deckTrackerView } from "./deckTracker";
import { pickGameWindow } from "../shared/frames";
import { applyScan, type ScanFrame } from "../shared/reconstruct";
import { buildMatch } from "../../../src/lib/tracker/match";
import type { AccessView, AccountState, ActiveDeck, AppState, DeckTrackerView, LinkResult, OverlayView, PanelCustom, PanelTemplate, TrackedMatch } from "../shared/types";
import { PANEL_TEMPLATES } from "../shared/types";
import { clampWidth, DEFAULT_CUSTOM, defaultSpot, panelShape, readCustom, readTemplate, WIDTH_LIMITS, type PanelKind } from "./panelLayout";
import { layerAction } from "./panelVisibility";
import { gameRunning, GAME_POLL_MS, initialStartMode, readStartMode, START_MODES, startArgs, WAIT_GAME_ARG, type StartMode } from "./startup";
import { execFile } from "node:child_process";
import type { GameDeck } from "../../../src/lib/tracker/profile";

const HIDDEN = process.argv.includes("--hidden");
/** Avvio automatico "con il gioco" (startup.ts): aspetta il gioco prima di partire. */
const WAIT_GAME = process.argv.includes(WAIT_GAME_ARG);
const FRAMES = process.argv.includes("--frames");
/** `--scan`/`--frames` accendono lo scanner anche se il giocatore l'ha spento; `--no-scan` lo spegne per le prove. */
const FORCE_SCAN = FRAMES || process.argv.includes("--scan");
const NO_SCAN = process.argv.includes("--no-scan");
const CAPTURE = process.argv.find((a) => a.startsWith("--capture="))?.slice("--capture=".length) ?? null;
const CAPTURE_SIZE = (process.argv.find((a) => a.startsWith("--capture-size="))?.slice("--capture-size=".length) ?? "1040x760").split("x").map(Number);
/** Screenshot di verifica dell'app sbloccata senza account: solo con --capture e mai nell'app impacchettata. */
const CAPTURE_UPDATE = CAPTURE ? (process.argv.find((a) => a.startsWith("--capture-update="))?.slice("--capture-update=".length) ?? null) : null;
const CAPTURE_UNLOCKED = Boolean(CAPTURE) && !app.isPackaged && process.argv.includes("--capture-unlocked");

// la cartella dei dati è fissa (%APPDATA%\OriginsMeta Analytics), qualunque sia il nome dell'app: senza, col nome
// "OriginsMeta Tracker" Electron userebbe %APPDATA%\OriginsMeta Tracker e il collegamento (chiave di safeStorage in
// Local State), lo storico e le impostazioni non si troverebbero più (appIdentity.ts)
app.setPath("userData", dataDir(app.getPath("appData"), process.env.ORIGINSMETA_TRACKER_DATA));
// fisso anche lui: è il nome della voce di "Avvia con Windows" nel registro
app.setAppUserModelId(APP_USER_MODEL_ID);

/** I file dei dati dell'app (store.ts, sync.ts, account.ts, overlay.json). */
const DATA_FILES = ["matches.jsonl", "state.json", "sync.json", "account.json", "overlay.json"];

/**
 * Cambio di nome del 01/10/2026: con "OriginsMeta Analytics" Electron tiene i dati in %APPDATA%\OriginsMeta Analytics.
 * Se lì non c'è ancora niente e la cartella vecchia (%APPDATA%\OriginsMeta Tracker) ha i dati, si copiano: storico,
 * stato, invii, collegamento e posizione dell'overlay, **più `Local State`**, il file dove Electron tiene la chiave
 * (cifrata con la protezione di Windows) di safeStorage: senza, il token copiato non si decifra e l'app si ritrova
 * scollegata (successo il 01/10/2026 sul PC di Pierluigi, prima di questa correzione). Si fa prima che l'app parta,
 * quindi prima che Electron crei una chiave nuova. La cartella vecchia resta com'è. Con ORIGINSMETA_TRACKER_DATA
 * (prove) non si tocca niente.
 */
function moveOldData() {
  if (process.env.ORIGINSMETA_TRACKER_DATA) return;
  const target = app.getPath("userData");
  const old = path.join(app.getPath("appData"), OLD_DATA_FOLDER);
  if (path.resolve(old) === path.resolve(target) || !fs.existsSync(path.join(old, "state.json"))) return;
  if (DATA_FILES.some((f) => fs.existsSync(path.join(target, f)))) return;
  try {
    fs.mkdirSync(target, { recursive: true });
    for (const f of DATA_FILES) if (fs.existsSync(path.join(old, f))) fs.copyFileSync(path.join(old, f), path.join(target, f));
    if (fs.existsSync(path.join(old, "Local State")) && !fs.existsSync(path.join(target, "Local State"))) fs.copyFileSync(path.join(old, "Local State"), path.join(target, "Local State"));
  } catch {
    // se la copia non riesce l'app parte vuota: i dati restano nella cartella vecchia
  }
}
moveOldData();

const SITE = "https://originsmeta.com/";
const SITE_ORIGIN = siteBase(process.env.ORIGINSMETA_TRACKER_SITE);
const ICON = path.join(__dirname, "icon.ico");
const SYNC_EVERY_MS = 5 * 60_000;

let win: BrowserWindow | null = null;
let overlayWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;
let store: Store;
let watcher: MatchWatcher;
let account: Account;
let sync: SyncQueue;
let history = "";
let activeDeck: ActiveDeck = null;
let notice: AccountState["notice"] = null;
let sessionStart = Date.now();
let overlayServer: { port: number; url: string; close: () => void } | null = null;
let frames: FrameRecorder | null = null;
let updater: Updater | null = null;
/** Solo con l'account (0.4.0, access.ts): stato del blocco, motore acceso, verifiche del token. */
let access: Access = { open: false, reason: "never" };
let engineOn = false;
/** cresce a ogni avvio del motore: la sorgente per OBS di un avvio superato si chiude */
let engineGen = 0;
let checking = false;
let lastCheckAt: number | null = null;
let lastCheckFailed = false;

type CardRow = { n: string; s: string; l: 0 | 1; t?: string; m?: number | null };
const CARDS = cardsTable as Record<string, CardRow>;
const card: CardLookup = (key) => {
  const c = CARDS[key];
  return c ? { name: c.n, legendary: c.l === 1, slug: c.s, mana: c.m ?? null, type: c.t } : undefined;
};

/* ---------- avviso dopo un aggiornamento (13/10/2026) ---------- */

/** Al primo avvio di una versione nuova (versione salvata in last-version.json più vecchia): "puoi aprire il gioco". */
function noteVersion(notify: (kind: UpdateNotice, version: string) => void) {
  const file = path.join(app.getPath("userData"), "last-version.json");
  let saved: string | null = null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { version?: unknown };
    saved = typeof raw.version === "string" ? raw.version : null;
  } catch {
    // prima installazione o file illeggibile: niente avviso
  }
  const current = app.getVersion();
  if (justUpdated(saved, current)) setTimeout(() => notify("done", current), 3000);
  if (saved !== current) {
    try {
      fs.writeFileSync(file, JSON.stringify({ version: current }));
    } catch {
      // non essenziale
    }
  }
}

/* ---------- lingua del menu dell'icona ---------- */

const lang = (): "en" | "it" | "es" => {
  const l = app.getLocale().toLowerCase();
  return l.startsWith("it") ? "it" : l.startsWith("es") ? "es" : "en";
};
const TRAY = {
  en: { open: "Open OriginsMeta Tracker", overlay: "Overlay above the game", deck: "Deck tracker", opp: "Opponent's cards", scanner: "Screen scanner", startup: "Start automatically", start: { game: "With the game", windows: "With Windows", off: "Never" }, quit: "Quit", listening: "tracking", waiting: "waiting for the game", locked: "link your OriginsMeta account to start", today: (w: number, l: number) => `today ${w}–${l}`, none: "no matches today" },
  it: { open: "Apri OriginsMeta Tracker", overlay: "Overlay sopra il gioco", deck: "Deck tracker", opp: "Carte dell'avversario", scanner: "Scanner dello schermo", startup: "Avvio automatico", start: { game: "Con il gioco", windows: "Con Windows", off: "Mai" }, quit: "Esci", listening: "in ascolto", waiting: "in attesa del gioco", locked: "collega il tuo account OriginsMeta per iniziare", today: (w: number, l: number) => `oggi ${w}–${l}`, none: "nessuna partita oggi" },
  es: { open: "Abrir OriginsMeta Tracker", overlay: "Overlay sobre el juego", deck: "Deck tracker", opp: "Cartas del rival", scanner: "Escáner de pantalla", startup: "Inicio automático", start: { game: "Con el juego", windows: "Con Windows", off: "Nunca" }, quit: "Salir", listening: "registrando", waiting: "esperando al juego", locked: "vincula tu cuenta de OriginsMeta para empezar", today: (w: number, l: number) => `hoy ${w}–${l}`, none: "ninguna partida hoy" },
};

/* ---------- avvio automatico: con il gioco o con Windows (startup.ts) ---------- */

const START_FILE = "startup.json";
let startMode: StartMode = "off";
// in sviluppo si lancia electron.exe con la cartella dell'app; nell'app installata basta l'eseguibile
const loginArgs = (mode: StartMode = startMode) => {
  const args = startArgs(mode === "off" ? "windows" : mode);
  return app.isPackaged ? args : [app.getAppPath(), ...args];
};

/** Registra la scelta: la voce "Esegui all'avvio" di Windows (una sola, cambiano gli argomenti) e startup.json. */
function applyStartMode(mode: StartMode): StartMode {
  try {
    app.setLoginItemSettings({ openAtLogin: mode !== "off", path: process.execPath, args: loginArgs(mode) });
    startMode = mode;
    fs.writeFileSync(path.join(app.getPath("userData"), START_FILE), JSON.stringify({ mode }));
  } catch {
    // non essenziale: resta la scelta di prima
  }
  return startMode;
}

/**
 * La scelta salvata o, la prima volta (0.4.7), quella di partenza: con il gioco, tranne per chi aveva già acceso o
 * spento "Avvia con Windows" (`initialStartMode`). In sviluppo niente scelta automatica (registrerebbe electron.exe).
 */
function loadStartMode() {
  if (CAPTURE || process.platform !== "win32") return;
  try {
    const saved = readStartMode((JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), START_FILE), "utf8")) as { mode?: unknown }).mode);
    if (saved) {
      startMode = saved;
      return;
    }
  } catch {
    // prima volta con questa versione
  }
  if (!app.isPackaged) return;
  const items = app.getLoginItemSettings({ path: process.execPath, args: loginArgs("windows") }).launchItems ?? [];
  applyStartMode(initialStartMode(items));
}

/**
 * Avviata con `--wait-game`: niente icona, finestre né letture finché il gioco non è aperto (controllo ogni 10 secondi
 * con `tasklist`). Se nel frattempo il giocatore apre l'app (seconda copia), parte subito con la finestra.
 */
let waitingForGame: (() => void) | null = null;
let openRequested = false;
function waitForGame(): Promise<void> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const done = () => {
      if (timer) clearTimeout(timer);
      waitingForGame = null;
      resolve();
    };
    waitingForGame = done;
    const check = () =>
      execFile("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
        if (!waitingForGame) return;
        if (!err && gameRunning(String(out))) return done();
        timer = setTimeout(check, GAME_POLL_MS);
      });
    check();
  });
}
/**
 * Cambio di nome dell'eseguibile (0.4.0, 12/10/2026): chi aveva acceso "Avvia con Windows" con "OriginsMeta
 * Analytics.exe" (o con l'app in un'altra cartella) passa a quello che gira adesso, con lo stato abilitato o no che
 * aveva in Gestione attività. La voce ha lo stesso nome nel registro (l'AppUserModelId), quindi resta una sola.
 */
function migrateLoginItem() {
  if (!app.isPackaged || CAPTURE || process.platform !== "win32") return;
  try {
    const stale = staleLoginItem(app.getLoginItemSettings({ path: process.execPath, args: loginArgs() }).launchItems ?? [], process.execPath);
    if (!stale) return;
    // gli argomenti restano quelli della voce vecchia (con o senza `--wait-game`)
    app.setLoginItemSettings({ openAtLogin: false, path: stale.path, args: stale.args });
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: stale.args, enabled: stale.enabled !== false });
  } catch {
    // non essenziale: il giocatore la riaccende dall'app
  }
}

function setStartMode(raw: unknown): StartMode {
  const mode = readStartMode(raw);
  if (mode) applyStartMode(mode);
  refreshTray();
  push();
  return startMode;
}

/* ---------- stato per l'interfaccia ---------- */

function currentView(): OverlayView {
  return overlayView({ matches: store.matches, activeDeck, sessionStart, card });
}

function currentDeckView(): DeckTrackerView {
  const view = deckTrackerView({ activeDeck, matches: store.matches, live: frames?.running ? frames.live() : null, scanner: Boolean(frames?.running), card });
  // le opzioni del personalizzato viaggiano con i dati: le leggono la finestra e la sorgente per OBS (0.4.1)
  return { ...view, custom: panelTemplate === "custom" ? panelCustom : null, hidden: !panelsWanted() };
}

/* ---------- partite che solo lo schermo vede (11/10/2026) ---------- */

/**
 * Nel playtest le partite online e classificate non lasciano niente nei file del PC (le statistiche contano solo le
 * "offline"), quindi il watcher non le vede finire. Lo stendardo di fine partita sì: `RESULT_WAIT_MS` dopo, se il
 * watcher non ha registrato una partita finita lì vicino (`NEAR_MS`), la registra l'app con quello che ha letto lo
 * schermo: esito, ora e mazzo scelto, più giocate e carte dell'avversario se la partita è stata vista per intero (`complete`;
 * dall'11/10/2026 l'esito vale anche senza, vedi `finishFromScreen`). Se poi
 * il watcher porta la stessa partita (statistiche in ritardo), si scarta la sua: niente doppioni. Il ritardo può essere
 * lungo: l'11/10 il playtest ha scritto la vittoria di un allenamento delle 06:32 solo alle 06:51, entrando in coda
 * online, con l'ora della scrittura. Per questo, oltre alla vicinanza (`NEAR_MS`), una partita dei file con lo stesso
 * esito di una dello schermo non ancora abbinata, e finita dopo, prende il suo posto (`screenTwin`): si tiene quella
 * dello schermo, che ha l'ora vera e le giocate.
 */
const RESULT_WAIT_MS = 30_000;
const NEAR_MS = 3 * 60_000;
/** Il ritardo più lungo accettato per le statistiche dei file (oltre, una partita dei file resta a sé). */
const LATE_MS = 60 * 60_000;
let lastBannerAt = 0;
let gameDeck: GameDeck | null = null;
const fromScreen: { at: number; result: "W" | "L"; used: boolean }[] = [];
const nearTo = (iso: string | null, at: number) => Boolean(iso) && Math.abs(Date.parse(iso as string) - at) <= NEAR_MS;
/** La partita dello schermo che è la stessa di una dei file: vicina nel tempo, o con lo stesso esito e finita prima. */
function screenTwin(raw: TrackedMatch) {
  const near = fromScreen.find((s) => !s.used && nearTo(raw.endedAt, s.at));
  if (near) return near;
  const end = raw.endedAt ? Date.parse(raw.endedAt) : Date.now();
  return fromScreen.find((s) => !s.used && s.result === raw.result && s.at <= end + NEAR_MS && s.at >= end - LATE_MS);
}

function noteFrame(f: ScanFrame) {
  pushDeck();
  if (!f.result || f.ms - lastBannerAt < NEAR_MS) return;
  lastBannerAt = f.ms;
  setTimeout(() => void finishFromScreen(f.ms), RESULT_WAIT_MS);
}

async function finishFromScreen(at: number) {
  if (!frames || !engineOn || store.matches.some((m) => nearTo(m.endedAt, at))) return;
  // l'esito dello stendardo vale anche se la partita non è stata vista dal round 1 (11/10/2026, Magic in finestra: in una
  // finestra piccola il mana si legge a tratti, la partita risultava incompleta e si perdeva anche vittoria o sconfitta);
  // le giocate entrano solo da una partita completa (`applyScan`)
  const scan = frames.matchFor(at + 10_000);
  const seen = scan?.result ? { result: scan.result, resultAt: scan.resultAt } : frames.resultNear(at);
  if (!seen.result) return;
  const endedAt = new Date(seen.resultAt ?? at).toISOString();
  const base = await buildMatch({ end: { endedAt, result: seen.result, matchId: null, deckIndex: null, missed: "" }, accountId: watcher.lastAccountId, deck: gameDeck, replay: null, queue: "normal" });
  const m = applyScan(base, scan);
  if (!store.add(m)) return;
  fromScreen.push({ at, result: seen.result, used: false });
  frames.event("match", { source: "screen", endedAt: m.endedAt, result: m.result, legendary: m.deck?.legendary ?? null, cards: m.deck?.cards ?? [], opponent: m.opponent, turns: m.turns, plays: m.plays });
  push();
  scheduleSync(5000);
}

/* ---------- scanner dello schermo: acceso di default, avviso al primo avvio ---------- */

type ScanPrefs = { on: boolean; noticeSeen: boolean };
let scanPrefs: ScanPrefs = { on: true, noticeSeen: false };
const scanPrefsFile = () => path.join(app.getPath("userData"), "scan.json");
function loadScanPrefs() {
  try {
    const raw = JSON.parse(fs.readFileSync(scanPrefsFile(), "utf8")) as Partial<ScanPrefs>;
    scanPrefs = { on: raw.on !== false, noticeSeen: raw.noticeSeen === true };
  } catch {
    // prima volta: acceso, con l'avviso
  }
}
function saveScanPrefs() {
  try {
    fs.writeFileSync(scanPrefsFile(), JSON.stringify(scanPrefs));
  } catch {
    // non essenziale
  }
}
function setScanner(on: boolean): boolean {
  if (!engineOn) return false; // app bloccata: lo scanner non si accende (access.ts)
  scanPrefs = { ...scanPrefs, on, noticeSeen: true };
  saveScanPrefs();
  if (on) frames?.start();
  else frames?.stop();
  push();
  return Boolean(frames?.running);
}

function accountState(): AccountState {
  const s = sync.status(store.matches);
  return {
    linked: account.linked,
    username: account.username,
    linkedAt: account.linkedAt,
    persisted: account.persisted,
    pending: account.linked ? s.pending : 0,
    lastSyncAt: account.linked ? s.lastSyncAt : null,
    problem: account.linked ? s.problem : null,
    running: s.running,
    notice,
  };
}

function accessView(): AccessView {
  return {
    open: access.open,
    reason: access.open ? null : access.reason,
    checking,
    offline: lastCheckFailed,
    verifiedAt: access.open ? access.verifiedAt : account.verifiedAt,
    graceUntil: access.open ? access.graceUntil : null,
    localMatches: store.matches.length,
  };
}

function state(): AppState {
  // app bloccata (access.ts): all'interfaccia niente partite, storico né mazzo, solo il collegamento
  const open = access.open;
  return {
    version: app.getVersion(),
    access: accessView(),
    status: watcher.status,
    matches: open ? [...store.matches].reverse() : [],
    missed: open ? store.saved.missed : "",
    history: open ? history : "",
    activeDeck: open ? activeDeck : null,
    startMode: CAPTURE ? "off" : startMode,
    dataFolder: store.dir,
    account: accountState(),
    overlay: {
      window: Boolean(overlayWin && !overlayWin.isDestroyed()),
      clickThrough: overlayPrefs.clickThrough,
      obsUrl: overlayServer ? `${overlayServer.url}?lang=${lang()}` : null,
      deckWindow: panelOpen("deck"),
      template: panelTemplate,
      custom: panelCustom,
      onlyInMatch: panelsOnlyInMatch,
      hideFromStream: panelsHideFromStream,
      deckObsUrl: overlayServer ? `${overlayServer.url}deck?lang=${lang()}${obsLayout()}` : null,
      oppWindow: panelOpen("opp"),
      oppObsUrl: overlayServer ? `${overlayServer.url}deck?view=opp&lang=${lang()}${obsLayout()}` : null,
      sessionStart: new Date(sessionStart).toISOString(),
      view: currentView(),
    },
    // --capture-update=<versione>: l'avviso dell'aggiornamento negli screenshot di verifica (0.4.1)
    update: CAPTURE_UPDATE ? { state: "downloading", version: CAPTURE_UPDATE } : updater && updater.status.state !== "idle" ? updater.status : null,
    scanner: {
      // negli screenshot di verifica (--capture) lo scanner non parte: si mostra la preferenza
      on: CAPTURE ? scanPrefs.on : Boolean(frames?.running),
      capturing: Boolean(frames?.status.capturing),
      noticeSeen: scanPrefs.noticeSeen,
    },
  };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function push() {
  if (pushTimer) return;
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (win && !win.isDestroyed()) win.webContents.send("tracker:state", state());
    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.webContents.send("overlay:view", { view: currentView(), clickThrough: overlayPrefs.clickThrough });
    pushDeckNow();
    refreshTray();
  }, 100);
}

/**
 * Niente zoom nelle finestre sopra il gioco (11/10/2026: un tester con Ctrl + rotella ha ingrandito il Deck tracker, e
 * Chromium ricorda lo zoom nelle preferenze dei dati dell'app, che restano anche disinstallando): ogni richiesta di zoom e
 * ogni caricamento rimettono il 100%, e il doppio clic sulla zona trascinabile non massimizza.
 */
function lockZoom(win: BrowserWindow) {
  const reset = () => {
    if (!win.isDestroyed()) win.webContents.setZoomFactor(1);
  };
  win.webContents.on("zoom-changed", reset);
  win.webContents.on("did-finish-load", reset);
  void win.webContents.setVisualZoomLevelLimits(1, 1);
  win.on("maximize", () => win.unmaximize());
}

/* ---------- pannelli: Deck tracker e carte dell'avversario ---------- */

/** Il template negli indirizzi per OBS (il classico non ha parametro). */
const obsLayout = () => (panelTemplate === "classic" ? "" : `&layout=${panelTemplate}`);

/**
 * Due finestre con la stessa pagina (overlay/deck.html): `deck` con il mio mazzo e `opp` con la Leggendaria e le
 * carte rivelate dall'avversario (Pierluigi, 11/10/2026: "il deck avversario crea un'altra tab dove si popola con le
 * carte avversario", in una finestra separata). Ognuna con apertura e posizioni salvate a parte (deck.json,
 * opponent.json).
 *
 * Template (0.4.1, 12–13/10/2026, disegni di Pierluigi; panelLayout.ts): Classico (colonna del mio mazzo e fascia
 * dell'avversario), Fasce, Colonne ai lati, Personalizzato. Il template scelto sta in panel-template.json e la pagina
 * lo riceve nell'indirizzo (`layout`); ogni template ha la sua posizione salvata (`spots`; x, y e larghezza del vecchio
 * Deck tracker a griglia, fino al 12/10, non si leggono più). Cambiare template riapre i pannelli aperti. I pannelli
 * si trascinano con la zona di Windows e si allargano con la maniglia.
 */
type Spot = { x: number; y: number; width: number };
type PanelPrefs = { open: boolean; spots?: Partial<Record<PanelTemplate, Spot>> };
let panelTemplate: PanelTemplate = "classic";
/** Le opzioni del template personalizzato, salvate con il template (0.4.1). */
let panelCustom: PanelCustom = DEFAULT_CUSTOM;
/**
 * Pannelli solo durante la partita (0.4.1, Pierluigi: "il tracker appare solo quando sei in partita, quando esci
 * scompare, un'opzione flaggabile"). "In partita" è quello dello scanner (`frames.live().inMatch`: mana del tabellone
 * letto negli ultimi 30 secondi): i pannelli compaiono al primo round e spariscono una trentina di secondi dopo la
 * fine. Senza scanner l'app non lo sa, e i pannelli restano visibili. Le finestre si nascondono (non si chiudono:
 * restano "accese" e tengono posto e misura); la sorgente per OBS resta vuota (`hidden`).
 */
let panelsOnlyInMatch = false;
/** Il tutorial illumina i pannelli: in quel momento si vedono anche fuori partita. */
let panelsSpotlit = false;
function panelsWanted(): boolean {
  if (!panelsOnlyInMatch || panelsSpotlit || !frames?.running) return true;
  return Boolean(frames.live()?.inMatch);
}
/**
 * Mostra o nasconde le finestre dei pannelli accese e le tiene sopra il gioco (anche l'overlay): gira ogni secondo e
 * mezzo e a ogni aggiornamento dei pannelli. Una finestra minimizzata o coperta dal gioco torna su da sola
 * (panelVisibility.ts, 16/10/2026).
 */
function syncPanelVisibility() {
  const want = panelsWanted();
  const wins: { w: BrowserWindow; want: boolean }[] = [];
  for (const k of PANEL_KINDS) if (panelOpen(k)) wins.push({ w: panels[k].win!, want });
  if (overlayWin && !overlayWin.isDestroyed()) wins.push({ w: overlayWin, want: true });
  for (const { w, want } of wins) {
    if (w.webContents.isLoading()) continue; // la mostra ready-to-show
    const act = layerAction(want, { visible: w.isVisible(), minimized: w.isMinimized(), focused: w.isFocused(), busy: deckResize !== null });
    if (act === "show") w.showInactive();
    else if (act === "hide") w.hide();
    else if (act === "raise") {
      w.setAlwaysOnTop(true, "screen-saver");
      w.moveTop();
    }
  }
}
setInterval(syncPanelVisibility, 1500);
/**
 * Pannelli esclusi dalle riprese dello schermo (0.4.3, 14/10/2026, prova in diretta di Pierluigi con l'estensione Twitch
 * "come l'app": "sono duplicati"). OBS che riprende lo schermo intero metteva in onda anche le finestre dei pannelli, e
 * l'estensione ne disegnava un'altra copia sopra. Con l'opzione accesa Windows esclude le finestre dei pannelli da ogni
 * ripresa (`setContentProtection`): il giocatore le vede, la diretta no. Lo scanner non ne risente: riprende solo la
 * finestra del gioco.
 */
let panelsHideFromStream = false;
function applyHideFromStream(win: BrowserWindow) {
  try {
    win.setContentProtection(panelsHideFromStream);
  } catch {
    // Windows troppo vecchio: i pannelli restano nelle riprese
  }
}
function setPanelsHideFromStream(on: boolean): boolean {
  panelsHideFromStream = on;
  savePanelTemplate();
  for (const k of PANEL_KINDS) if (panelOpen(k)) applyHideFromStream(panels[k].win!);
  push();
  return on;
}
function setPanelsOnlyInMatch(on: boolean): boolean {
  panelsOnlyInMatch = on;
  savePanelTemplate();
  syncPanelVisibility();
  pushDeckNow();
  push();
  return on;
}
const TEMPLATE_FILE = "panel-template.json";
// `keep`: chiusa dall'app che si blocca (access.ts), non dal giocatore: la preferenza "aperta" resta e si riapre allo sblocco
// `bottom`: la finestra è partita attaccata al bordo basso dello schermo (fascia in basso, posizione di partenza): alla
// prima misura del contenuto (deck:fit) sale quanto serve per restarci attaccata
const panels: Record<PanelKind, { win: BrowserWindow | null; prefs: PanelPrefs; file: string; keep: boolean; bottom: number | null }> = {
  deck: { win: null, prefs: { open: false }, file: "deck.json", keep: false, bottom: null },
  opp: { win: null, prefs: { open: false }, file: "opponent.json", keep: false, bottom: null },
};
/** L'allargamento in corso di un pannello (vedi IPC `deck:resize`). */
let deckResize: ReturnType<typeof setInterval> | null = null;
const PANEL_KINDS: PanelKind[] = ["deck", "opp"];
const panelOpen = (k: PanelKind) => Boolean(panels[k].win && !panels[k].win!.isDestroyed());

function pushDeckNow() {
  syncPanelVisibility();
  if (!PANEL_KINDS.some(panelOpen)) return;
  const view = currentDeckView();
  for (const k of PANEL_KINDS) if (panelOpen(k)) panels[k].win!.webContents.send("deck:view", view);
}
// le letture dello scanner arrivano due volte al secondo: i pannelli si aggiornano al massimo una volta al secondo
let deckTimer: ReturnType<typeof setTimeout> | null = null;
function pushDeck() {
  if (deckTimer || !PANEL_KINDS.some(panelOpen)) return;
  deckTimer = setTimeout(() => {
    deckTimer = null;
    pushDeckNow();
  }, 1000);
}

function loadPanelPrefs() {
  for (const k of PANEL_KINDS) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), panels[k].file), "utf8")) as Partial<PanelPrefs>;
      const int = (v: unknown) => (Number.isInteger(v) ? (v as number) : undefined);
      const spots: PanelPrefs["spots"] = {};
      for (const t of PANEL_TEMPLATES) {
        const sp = raw.spots?.[t];
        const x = int(sp?.x);
        const y = int(sp?.y);
        const width = int(sp?.width);
        if (x !== undefined && y !== undefined && width !== undefined) spots[t] = { x, y, width };
      }
      panels[k].prefs = { open: raw.open === true, spots };
    } catch {
      // prima volta: chiuso, e alla prima apertura la posizione del template (panelLayout.ts)
    }
  }
  try {
    const saved = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), TEMPLATE_FILE), "utf8")) as { template?: unknown; custom?: unknown; onlyInMatch?: unknown; hideFromStream?: unknown };
    panelTemplate = readTemplate(saved.template);
    panelCustom = readCustom(saved.custom);
    panelsOnlyInMatch = saved.onlyInMatch === true;
    panelsHideFromStream = saved.hideFromStream === true;
  } catch {
    // prima volta: classico
  }
}
function savePanelTemplate() {
  try {
    fs.writeFileSync(path.join(app.getPath("userData"), TEMPLATE_FILE), JSON.stringify({ template: panelTemplate, custom: panelCustom, onlyInMatch: panelsOnlyInMatch, hideFromStream: panelsHideFromStream }));
  } catch {
    // non essenziale
  }
}
/** Posizione e misura attuali di un pannello, nel posto del template in uso. */
function rememberPanel(k: PanelKind) {
  const win = panels[k].win;
  if (!win || win.isDestroyed()) return;
  const b = win.getBounds();
  panels[k].prefs = { ...panels[k].prefs, spots: { ...panels[k].prefs.spots, [panelTemplate]: { x: b.x, y: b.y, width: b.width } } };
  savePanelPrefs(k);
}
function savePanelPrefs(k: PanelKind) {
  try {
    fs.writeFileSync(path.join(app.getPath("userData"), panels[k].file), JSON.stringify(panels[k].prefs));
  } catch {
    // non essenziale
  }
}

/**
 * Dove si apre un pannello: la posizione salvata per il template in uso se sta ancora su uno schermo, altrimenti quella
 * del disegno sullo schermo principale (i limiti interi: le fasce stanno sui bordi). L'altezza la decide il contenuto.
 */
function panelBounds(k: PanelKind) {
  const t = panelTemplate;
  const saved = panels[k].prefs.spots?.[t];
  const height = 160; // la decide il contenuto (deck:fit)
  const on = saved ? screen.getAllDisplays().some((d) => saved.x >= d.bounds.x - 8 && saved.y >= d.bounds.y - 8 && saved.x + 40 <= d.bounds.x + d.bounds.width && saved.y + 20 <= d.bounds.y + d.bounds.height) : false;
  panels[k].bottom = null;
  if (saved && on) return { x: saved.x, y: saved.y, width: clampWidth(t, k, saved.width), height };
  const spot = defaultSpot(t, k, screen.getPrimaryDisplay().bounds);
  if (spot.fromBottom) panels[k].bottom = spot.y;
  return { x: spot.x, y: spot.fromBottom ? spot.y - height : spot.y, width: spot.width, height };
}

function openPanel(k: PanelKind) {
  if (panelOpen(k)) return;
  const win = new BrowserWindow({
    ...panelBounds(k),
    minWidth: WIDTH_LIMITS[panelShape(panelTemplate, k)].min,
    minHeight: 40,
    // senza la cornice di Windows (Pierluigi, 11/10/2026: "togliere la barra di Windows e il titolo"): si sposta
    // trascinando il pannello, si allarga dai bordi, si chiude con la × del pannello o dall'app
    frame: false,
    alwaysOnTop: true,
    fullscreenable: false,
    maximizable: false,
    show: false,
    title: k === "deck" ? "OriginsMeta · Deck tracker" : "OriginsMeta · Opponent",
    // trasparenti (12/10/2026): la linguetta del logo sporge fuori dal pannello
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "deck-preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  panels[k].win = win;
  applyHideFromStream(win);
  lockZoom(win);
  win.removeMenu();
  win.setAlwaysOnTop(true, "screen-saver");
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  const remember = () => rememberPanel(k);
  win.on("moved", remember);
  win.on("resized", remember);
  win.on("closed", () => {
    panels[k].win = null;
    // chiusa con la X: resta spenta anche al prossimo avvio (non se l'ha chiusa il blocco dell'app)
    if (!quitting && !panels[k].keep) {
      panels[k].prefs = { ...panels[k].prefs, open: false };
      savePanelPrefs(k);
    }
    panels[k].keep = false;
    push();
  });
  win.once("ready-to-show", () => panelsWanted() && win.showInactive());
  void win.loadFile(path.join(__dirname, "overlay", "deck.html"), { query: { view: k === "deck" ? "me" : "opp", layout: panelTemplate } });
}

/**
 * Opzioni del personalizzato (0.4.1): arrivano anche a ogni passo di un cursore, quindi i pannelli si aggiornano subito
 * ma il file si scrive mezzo secondo dopo l'ultimo cambio. La finestra principale tiene da sé il valore che mostra
 * (niente ridisegno dell'app a ogni passo, che toglierebbe il cursore di mano).
 */
let customSaveTimer: ReturnType<typeof setTimeout> | null = null;
function setPanelCustom(raw: unknown): PanelCustom {
  panelCustom = raw === "reset" ? DEFAULT_CUSTOM : readCustom(raw, panelCustom);
  if (customSaveTimer) clearTimeout(customSaveTimer);
  customSaveTimer = setTimeout(() => {
    customSaveTimer = null;
    savePanelTemplate();
  }, 500);
  pushDeckNow();
  return panelCustom;
}

/** Cambio di template (0.4.1): si salva e i pannelli aperti si chiudono e si riaprono con quello nuovo. */
function setPanelTemplate(t: PanelTemplate): PanelTemplate {
  if (t === panelTemplate) return t;
  panelTemplate = t;
  savePanelTemplate();
  for (const k of PANEL_KINDS) {
    if (!panelOpen(k)) continue;
    const win = panels[k].win!;
    // chiusa dall'app, non dal giocatore: resta "aperta" e si riapre appena chiusa (dopo il gestore di openPanel)
    panels[k].keep = true;
    win.once("closed", () => {
      if (engineOn && !quitting) openPanel(k);
    });
    win.close();
  }
  push();
  return t;
}

function setPanel(k: PanelKind, on: boolean): boolean {
  if (!engineOn) return false; // app bloccata (access.ts)
  if (on) openPanel(k);
  else if (panelOpen(k)) panels[k].win!.close();
  panels[k].prefs = { ...panels[k].prefs, open: on };
  savePanelPrefs(k);
  push();
  return on;
}

/* ---------- invio delle partite al sito ---------- */

const cipher: Cipher = {
  available: () => safeStorage.isEncryptionAvailable(),
  encrypt: (text) => safeStorage.encryptString(text),
  decrypt: (data) => safeStorage.decryptString(data),
};
const syncDeps: SyncDeps = { site: SITE_ORIGIN, fetch: (url, init) => net.fetch(url, init) };

/**
 * Estensione Twitch "Deck tracker" (13/10/2026, twitchLive.ts): lo stato del pannello del mazzo parte per il sito quando
 * cambia, al massimo ogni 2 secondi, e il sito lo tiene solo se l'account ha collegato un canale Twitch.
 */
const livePusher = new LivePusher(syncDeps, () => account.token);
/**
 * Lo stile dei pannelli per l'estensione in modalità "come l'app" (14/10/2026, Pierluigi: "non possiamo renderlo identico
 * come visuale alla versione del tracker scelto dall'utente?"): template e opzioni, pannelli nascosti fuori partita,
 * scanner, misure dello schermo principale (quello su cui partono i pannelli, panelLayout.ts) e la posizione delle due
 * finestre rispetto a lui, in punti di Windows. L'estensione le riporta sopra il video, in proporzione.
 */
function liveUi(): LiveUi {
  const d = screen.getPrimaryDisplay().bounds;
  // un pannello chiuso sul PC va comunque su Twitch (14/10/2026, Pierluigi: "non si può scegliere di avere quelli di
  // Twitch senza che noi a schermo abbiamo effettivamente i due tracker visibili?"): la posizione salvata per lo stile
  // in uso, o quella di partenza (panelLayout.ts); l'altezza la decide il contenuto, qui solo una misura di partenza
  const rect = (k: PanelKind): LiveRect => {
    if (panelOpen(k)) {
      const b = panels[k].win!.getBounds();
      return { x: Math.round(b.x - d.x), y: Math.round(b.y - d.y), w: Math.max(1, Math.round(b.width)), h: Math.max(1, Math.round(b.height)) };
    }
    const h = 160;
    const saved = panels[k].prefs.spots?.[panelTemplate];
    if (saved) return { x: Math.round(saved.x - d.x), y: Math.round(saved.y - d.y), w: clampWidth(panelTemplate, k, saved.width), h };
    const spot = defaultSpot(panelTemplate, k, d);
    return { x: Math.round(spot.x - d.x), y: Math.round((spot.fromBottom ? spot.y - h : spot.y) - d.y), w: spot.width, h };
  };
  return { template: panelTemplate, custom: panelTemplate === "custom" ? panelCustom : null, hidden: !panelsWanted(), scanner: Boolean(frames?.running), screen: { w: d.width, h: d.height }, panels: { deck: rect("deck"), opp: rect("opp") } };
}
setInterval(() => {
  if (!account.token || CAPTURE || !engineOn) return;
  const v = currentDeckView();
  // le carte del tabellone, per le zone dell'estensione Twitch (14/10/2026): solo in partita
  const board = v.live?.inMatch && frames?.running ? frames.board() : null;
  // e le carte in mano con la loro posizione (domanda di Davdas: "perché non anche le carte in mano?")
  const hand = v.live?.inMatch && frames?.running ? frames.hand() : null;
  void livePusher.offer({ ...v, live: v.live ? { ...v.live, board, hand } : null }, liveUi());
}, LIVE_MIN_MS);

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync(ms: number) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void runSync(false);
  }, ms);
}

async function runSync(force: boolean) {
  const token = account.token;
  if (!token || CAPTURE || !engineOn) return;
  const running = sync.run(store.matches, token, { force });
  push();
  const r = await running;
  if (account.token !== token) return push(); // scollegata o ricollegata nel frattempo
  if (r.unlinked) forgetLink();
  else if (r.verified) noteVerified();
  push();
}

/** Il sito non riconosce più il token (PC scollegato da /account/tracker, account eliminato): si dimentica, lo si dice, l'app si blocca. */
function forgetLink() {
  account.clear();
  sync.reset();
  livePusher.reset();
  notice = "unlinked";
  lastCheckFailed = false;
  refreshAccess();
}

/** Il sito ha appena accettato il token (verifica o invio): riparte la tolleranza. */
function noteVerified() {
  account.markVerified();
  lastCheckAt = Date.now();
  lastCheckFailed = false;
  refreshAccess();
}

async function linkAccount(code: unknown): Promise<LinkResult> {
  if (account.linked) return { ok: true, username: account.username };
  const r = await claimCode(syncDeps, String(code ?? ""), os.hostname());
  if (!r.ok) return r;
  // il collegamento appena dato dal sito vale come verifica (account.set salva anche l'ora)
  account.set(r.token, r.username, SITE_ORIGIN);
  // tutto lo storico sul PC va a questo account (il sito scarta da sé i doppioni)
  sync.reset();
  livePusher.reset();
  notice = null;
  lastCheckAt = Date.now();
  lastCheckFailed = false;
  refreshAccess();
  void runSync(true);
  return { ok: true, username: r.username };
}

async function unlinkAccount() {
  const token = account.token;
  account.clear();
  sync.reset();
  livePusher.reset();
  notice = null;
  lastCheckFailed = false;
  // senza collegamento l'app si ferma e torna alla schermata di collegamento
  refreshAccess();
  if (token) await unlinkRemote(syncDeps, token);
}

/* ---------- solo con l'account (0.4.0, 12/10/2026, access.ts) ---------- */

/** Ricalcola il blocco e accende o spegne il motore di conseguenza. */
function refreshAccess() {
  const now = Date.now();
  access = CAPTURE_UNLOCKED
    ? { open: true, verifiedAt: new Date(now).toISOString(), graceUntil: new Date(now).toISOString() }
    : decideAccess({ linked: account.linked, unreadable: account.unreadable, notice, verifiedAt: account.verifiedAt, now });
  if (access.open && !engineOn) void startEngine();
  else if (!access.open && engineOn) stopEngine();
  push();
}

/** Verifica il token con il sito (zero partite a /api/tracker/sync). */
async function checkAccess() {
  const token = account.token;
  if (!token || CAPTURE || checking) return;
  checking = true;
  push();
  const outcome = await verifyToken(syncDeps, token);
  checking = false;
  lastCheckAt = Date.now();
  if (account.token !== token) return refreshAccess(); // scollegata o ricollegata nel frattempo
  if (outcome === "ok") return noteVerified();
  if (outcome === "revoked") return forgetLink();
  // sito irraggiungibile: niente cambia, vale la tolleranza dall'ultima verifica riuscita
  lastCheckFailed = true;
  refreshAccess();
}

/** Ogni minuto: verifica quando è ora (avvio, ogni 4 ore, ogni 5 minuti da bloccata) e ricontrolla la tolleranza. */
function accessTick() {
  if (checkDue({ linked: account.linked, open: access.open, lastAttemptAt: lastCheckAt, lastFailed: lastCheckFailed, now: Date.now() })) void checkAccess();
  else refreshAccess();
}

/**
 * Il motore dell'app: file del gioco, sorgente per OBS e, fuori dalla modalità cattura, overlay e pannelli aperti
 * l'ultima volta, scanner (se acceso nelle preferenze) e invio. Parte solo con l'app sbloccata.
 */
async function startEngine() {
  engineOn = true;
  const gen = ++engineGen;
  watcher.start();
  if (!CAPTURE) {
    // con la finestra dell'app già aperta (avviata in automatico ma da collegare) non si aspetta
    if (layersDeferred && win && !win.isDestroyed() && win.isVisible()) layersDeferred = false;
    if (!layersDeferred) openSavedLayers();
    if (frames && !NO_SCAN && (FORCE_SCAN || scanPrefs.on)) frames.start();
    scheduleSync(10_000);
  }
  push();
  // la sorgente per OBS parte anche nella modalità di cattura, così lo screenshot mostra gli indirizzi veri
  const server = await startOverlayServer({ dir: path.join(__dirname, "overlay"), view: currentView, deckView: currentDeckView });
  if (!engineOn || gen !== engineGen) return server?.close(); // bloccata (o ripartita) mentre partiva
  overlayServer = server;
  push();
}

/**
 * Overlay e pannelli aperti l'ultima volta. Con l'avvio automatico (16/10/2026, Pierluigi: "se il giocatore vuole
 * aprire l'app e i layer se l'aprirà") aspettano che il giocatore apra la finestra dell'app (`showWindow`); dal menu
 * dell'icona si accendono comunque uno per uno.
 */
let layersDeferred = false;
function openSavedLayers() {
  if (overlayPrefs.open) openOverlay();
  for (const k of PANEL_KINDS) if (panels[k].prefs.open) openPanel(k);
}

/** Ferma tutto (app bloccata): niente più letture, riprese, finestre sopra il gioco né sorgente per OBS. Le preferenze restano. */
function stopEngine() {
  engineOn = false;
  watcher.stop();
  frames?.stop();
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.destroy();
  overlayWin = null;
  for (const k of PANEL_KINDS) {
    if (!panelOpen(k)) continue;
    panels[k].keep = true;
    panels[k].win!.destroy();
  }
  overlayServer?.close();
  overlayServer = null;
  gameDeck = null;
  activeDeck = null;
  // la schermata di collegamento si vede subito, anche con l'app solo nell'icona
  if (!CAPTURE && !quitting) showWindow();
  push();
}

/* ---------- overlay: finestra sopra il gioco ---------- */

type OverlayPrefs = { x?: number; y?: number; clickThrough: boolean; open: boolean };
let overlayPrefs: OverlayPrefs = { clickThrough: true, open: false };
const overlayPrefsFile = () => path.join(app.getPath("userData"), "overlay.json");
function loadOverlayPrefs() {
  try {
    const raw = JSON.parse(fs.readFileSync(overlayPrefsFile(), "utf8")) as Partial<OverlayPrefs>;
    overlayPrefs = {
      clickThrough: raw.clickThrough !== false,
      open: raw.open === true,
      x: Number.isInteger(raw.x) ? raw.x : undefined,
      y: Number.isInteger(raw.y) ? raw.y : undefined,
    };
  } catch {
    // prima volta: in alto a destra, lascia passare i clic
  }
}
function saveOverlayPrefs() {
  try {
    fs.writeFileSync(overlayPrefsFile(), JSON.stringify(overlayPrefs));
  } catch {
    // non essenziale
  }
}

const OVERLAY_SIZE = { width: 380, height: 136 };

function overlayPosition() {
  const { width } = OVERLAY_SIZE;
  const { x, y } = overlayPrefs;
  // la posizione salvata vale solo se sta ancora su uno schermo (un monitor staccato la farebbe sparire)
  if (x !== undefined && y !== undefined && screen.getAllDisplays().some((d) => x >= d.workArea.x && y >= d.workArea.y && x + 40 <= d.workArea.x + d.workArea.width && y + 40 <= d.workArea.y + d.workArea.height)) return { x, y };
  const area = screen.getPrimaryDisplay().workArea;
  return { x: area.x + area.width - width - 24, y: area.y + 24 };
}

function openOverlay() {
  if (overlayWin && !overlayWin.isDestroyed()) return;
  overlayWin = new BrowserWindow({
    ...OVERLAY_SIZE,
    ...overlayPosition(),
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    title: "OriginsMeta Overlay",
    icon: ICON,
    webPreferences: {
      preload: path.join(__dirname, "overlay-preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  lockZoom(overlayWin);
  overlayWin.setAlwaysOnTop(true, "screen-saver");
  overlayWin.setIgnoreMouseEvents(overlayPrefs.clickThrough, { forward: true });
  overlayWin.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  overlayWin.webContents.on("will-navigate", (e) => e.preventDefault());
  overlayWin.on("moved", () => {
    if (!overlayWin) return;
    const [x, y] = overlayWin.getPosition();
    overlayPrefs = { ...overlayPrefs, x, y };
    saveOverlayPrefs();
  });
  overlayWin.on("closed", () => {
    overlayWin = null;
    push();
  });
  // senza rubare il fuoco al gioco
  overlayWin.once("ready-to-show", () => overlayWin?.showInactive());
  void overlayWin.loadFile(path.join(__dirname, "overlay", "overlay.html"));
}

function setOverlayWindow(on: boolean): boolean {
  if (!engineOn) return false; // app bloccata (access.ts)
  if (on) openOverlay();
  else if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
  overlayPrefs = { ...overlayPrefs, open: on };
  saveOverlayPrefs();
  push();
  return on;
}

function setClickThrough(on: boolean): boolean {
  if (!engineOn) return overlayPrefs.clickThrough;
  overlayPrefs = { ...overlayPrefs, clickThrough: on };
  saveOverlayPrefs();
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.setIgnoreMouseEvents(on, { forward: true });
  push();
  return on;
}

/* ---------- barra delle notifiche ---------- */

function todayRecord(): string {
  const t = TRAY[lang()];
  const today = new Date().toDateString();
  const list = store.matches.filter((m) => m.endedAt && new Date(m.endedAt).toDateString() === today);
  const w = list.filter((m) => m.result === "W").length;
  const l = list.filter((m) => m.result === "L").length;
  return list.length ? t.today(w, l) : t.none;
}

function refreshTray() {
  if (!tray) return;
  const t = TRAY[lang()];
  const f = frames?.status;
  if (!access.open) {
    tray.setToolTip(`${APP_NAME} · ${t.locked}`);
    tray.setContextMenu(Menu.buildFromTemplate([{ label: t.open, click: showWindow }, { type: "separator" }, { label: t.quit, click: () => app.quit() }]));
    return;
  }
  const rec = f && frames?.running ? ` · SCAN ${f.capturing ? "●" : "○"}${FRAMES ? ` ${f.frames}` : ""}${f.full ? " (4 GB)" : ""}` : "";
  tray.setToolTip(`${APP_NAME} · ${watcher?.status.cache ? t.listening : t.waiting} · ${store ? todayRecord() : ""}${rec}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t.open, click: showWindow },
      { type: "separator" },
      { label: t.overlay, type: "checkbox", checked: Boolean(overlayWin && !overlayWin.isDestroyed()), click: (item) => setOverlayWindow(item.checked) },
      { label: t.deck, type: "checkbox", checked: panelOpen("deck"), click: (item) => setPanel("deck", item.checked) },
      { label: t.opp, type: "checkbox", checked: panelOpen("opp"), click: (item) => setPanel("opp", item.checked) },
      { label: t.scanner, type: "checkbox", checked: Boolean(frames?.running), click: (item) => setScanner(item.checked) },
      {
        label: t.startup,
        submenu: START_MODES.map((m) => ({ label: t.start[m], type: "radio" as const, checked: startMode === m, click: () => setStartMode(m) })),
      },
      { type: "separator" },
      { label: t.quit, click: () => app.quit() },
    ]),
  );
}

/* ---------- finestra ---------- */

function showWindow() {
  if (layersDeferred) {
    layersDeferred = false;
    if (engineOn) openSavedLayers();
  }
  if (!win || win.isDestroyed()) createWindow(true);
  else {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}

function createWindow(show: boolean) {
  const [width, height] = CAPTURE ? CAPTURE_SIZE : [1040, 760];
  win = new BrowserWindow({
    width,
    height,
    minWidth: 420,
    minHeight: 480,
    show: false,
    title: APP_NAME,
    backgroundColor: "#150c2c",
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  win.removeMenu();
  win.webContents.setWindowOpenHandler(({ url }) => {
    openLink(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  // la X della finestra chiude tutta l'app, con overlay, Deck tracker e scanner (Pierluigi, 10/10/2026: "i due layer si
  // devono chiudere quando si chiude l'app e non rimanere attivi"; fino ad allora la X nascondeva la finestra e l'app
  // restava nella barra). Le finestre aperte si riaprono al prossimo avvio.
  win.on("close", () => {
    if (!quitting && !CAPTURE) app.quit();
  });
  win.once("ready-to-show", () => {
    if (CAPTURE) win?.showInactive();
    else if (show) win?.show();
  });
  // --capture-setup: lo screenshot di verifica della pagina Setup (0.4.1)
  void win.loadFile(path.join(__dirname, "renderer", "index.html"), CAPTURE && process.argv.includes("--capture-setup") ? { hash: "setup" } : {});
}

function openLink(url: unknown) {
  if (typeof url === "string" && url.startsWith(SITE) && !/[\s"'<>]/.test(url)) void shell.openExternal(url);
}

/* ---------- IPC: solo dalla pagina locale dell'app ---------- */

const fromApp = (e: IpcMainInvokeEvent) => Boolean(e.senderFrame?.url.startsWith("file://")) && e.sender === win?.webContents;
/** Dalla finestra dell'app e con l'app sbloccata (access.ts): tutto quello che non è collegamento, link o uscita. */
const fromOpenApp = (e: IpcMainInvokeEvent) => fromApp(e) && engineOn;
const fromOverlay = (e: IpcMainInvokeEvent) => Boolean(e.senderFrame?.url.startsWith("file://")) && Boolean(overlayWin) && e.sender === overlayWin?.webContents;
const fromDeck = (e: IpcMainInvokeEvent | IpcMainEvent) => Boolean(e.senderFrame?.url.startsWith("file://")) && PANEL_KINDS.some((k) => panelOpen(k) && e.sender === panels[k].win!.webContents);

function registerIpc() {
  ipcMain.handle("tracker:state", (e) => (fromApp(e) ? state() : null));
  ipcMain.handle("tracker:login", (e, mode: unknown) => (fromOpenApp(e) && !CAPTURE ? setStartMode(mode) : startMode));
  ipcMain.handle("tracker:folder", async (e) => {
    if (fromOpenApp(e)) await shell.openPath(store.dir);
  });
  ipcMain.handle("tracker:link", (e, url: unknown) => {
    if (fromApp(e)) openLink(url);
  });
  ipcMain.handle("tracker:account-link", (e, code: unknown): Promise<LinkResult> | LinkResult => (fromApp(e) && !CAPTURE ? linkAccount(code) : { ok: false, problem: "error" }));
  ipcMain.handle("tracker:account-unlink", async (e) => {
    if (fromApp(e) && !CAPTURE) await unlinkAccount();
  });
  ipcMain.handle("tracker:sync-now", async (e) => {
    if (fromOpenApp(e)) await runSync(true);
  });
  // "Riprova" della schermata di blocco: verifica subito il collegamento con il sito
  ipcMain.handle("tracker:verify-now", async (e) => {
    if (fromApp(e) && !CAPTURE) await checkAccess();
  });
  ipcMain.handle("tracker:overlay-window", (e, on: unknown) => (fromOpenApp(e) && !CAPTURE ? setOverlayWindow(on === true) : Boolean(overlayWin)));
  // tasto "Chiudi l'app" (11/10/2026, Pierluigi: "un tasto chiudi l'app direttamente nell'app"): come "Esci" dell'icona
  ipcMain.handle("tracker:quit", (e) => {
    if (!fromApp(e) || CAPTURE) return;
    quitting = true;
    app.quit();
  });
  ipcMain.handle("tracker:scanner", (e, on: unknown) => (fromOpenApp(e) && !CAPTURE ? setScanner(on === true) : Boolean(frames?.running)));
  ipcMain.handle("tracker:scanner-notice", (e) => {
    if (!fromOpenApp(e)) return;
    scanPrefs = { ...scanPrefs, noticeSeen: true };
    saveScanPrefs();
    push();
  });
  ipcMain.handle("tracker:deck-window", (e, on: unknown) => (fromOpenApp(e) && !CAPTURE ? setPanel("deck", on === true) : panelOpen("deck")));
  ipcMain.handle("tracker:opp-window", (e, on: unknown) => (fromOpenApp(e) && !CAPTURE ? setPanel("opp", on === true) : panelOpen("opp")));
  ipcMain.handle("tracker:panel-template", (e, t: unknown) => (fromOpenApp(e) ? setPanelTemplate(readTemplate(t)) : panelTemplate));
  ipcMain.handle("tracker:panel-custom", (e, c: unknown) => (fromOpenApp(e) ? setPanelCustom(c) : panelCustom));
  ipcMain.handle("tracker:panels-in-match", (e, on: unknown) => (fromOpenApp(e) ? setPanelsOnlyInMatch(on === true) : panelsOnlyInMatch));
  ipcMain.handle("tracker:panels-hide-stream", (e, on: unknown) => (fromOpenApp(e) ? setPanelsHideFromStream(on === true) : panelsHideFromStream));
  ipcMain.handle("deck:view", (e) => (fromDeck(e) && engineOn ? currentDeckView() : null));
  // la finestra del pannello alta come il suo contenuto (11/10/2026, Davdas: niente scorrimento); la larghezza la sceglie il giocatore
  ipcMain.on("deck:close", (e) => {
    if (!fromDeck(e)) return;
    for (const k of PANEL_KINDS) if (panelOpen(k) && panels[k].win!.webContents === e.sender) setPanel(k, false);
  });
  // allargamento dei pannelli con la maniglia (12/10/2026): la finestra trasparente non si ridimensiona dai bordi
  ipcMain.on("deck:resize", (e, on: unknown) => {
    if (!fromDeck(e)) return;
    const k = PANEL_KINDS.find((x) => panelOpen(x) && panels[x].win!.webContents === e.sender);
    if (!k) return;
    const win = panels[k].win!;
    if (deckResize) clearInterval(deckResize);
    deckResize = null;
    if (on !== true) return rememberPanel(k);
    const x0 = screen.getCursorScreenPoint().x;
    const b0 = win.getBounds();
    const timer = setInterval(() => {
      if (win.isDestroyed()) return void clearInterval(timer);
      const width = clampWidth(panelTemplate, k, b0.width + screen.getCursorScreenPoint().x - x0);
      const b = win.getBounds();
      if (b.width !== width) win.setBounds({ x: b0.x, y: b0.y, width, height: b.height });
    }, 16);
    deckResize = timer;
    setTimeout(() => {
      if (deckResize === timer) {
        clearInterval(timer);
        deckResize = null;
      }
    }, 60_000);
  });
  ipcMain.on("deck:fit", (e, h: unknown) => {
    if (!fromDeck(e) || !Number.isFinite(h)) return;
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win || win.isDestroyed()) return;
    const [w, cur] = win.getContentSize();
    const want = Math.round(Math.min(Math.max(h as number, 40), 1400) * win.webContents.getZoomFactor());
    if (Math.abs(want - cur) > 2) win.setContentSize(w, want);
    // fascia partita attaccata al bordo basso: sale quanto è alta, una volta sola (poi la posizione è del giocatore)
    const k = PANEL_KINDS.find((x) => panelOpen(x) && panels[x].win === win);
    if (k && panels[k].bottom !== null) {
      const b = win.getBounds();
      win.setBounds({ x: b.x, y: panels[k].bottom! - b.height, width: b.width, height: b.height });
      panels[k].bottom = null;
    }
  });
  ipcMain.handle("tracker:overlay-click-through", (e, on: unknown) => (fromOpenApp(e) ? setClickThrough(on === true) : overlayPrefs.clickThrough));
  ipcMain.handle("tracker:overlay-session", (e) => {
    if (!fromOpenApp(e)) return;
    sessionStart = Date.now();
    push();
  });
  // tutorial (12/10/2026): i pannelli aperti si illuminano; quelli chiusi si aprono, così il giocatore vede dove stanno
  ipcMain.handle("tracker:spot-panels", (e, on: unknown) => {
    if (!fromOpenApp(e)) return; // app bloccata: i pannelli non si aprono (0.4.0)
    // illuminati si vedono anche fuori partita, con "solo durante la partita" acceso (0.4.1)
    panelsSpotlit = on === true;
    syncPanelVisibility();
    for (const k of PANEL_KINDS) {
      const opened = on === true && !panelOpen(k);
      if (opened) setPanel(k, true);
      const w = panelOpen(k) ? panels[k].win! : null;
      if (!w) continue;
      // un pannello appena aperto riceve il segnale quando la pagina è pronta
      if (opened || w.webContents.isLoading()) w.webContents.once("did-finish-load", () => w.isDestroyed() || w.webContents.send("deck:spot", on === true));
      else w.webContents.send("deck:spot", on === true);
    }
  });
  ipcMain.handle("tracker:copy", (e, text: unknown) => {
    // indirizzi per OBS e codici del gioco (un codice di 13 carte sta sotto i 300 caratteri; il tetto del sito è 420)
    if (fromOpenApp(e) && typeof text === "string" && text.length <= 600) clipboard.writeText(text);
  });
  // la finestra dell'overlay legge solo i suoi dati
  ipcMain.handle("overlay:view", (e) => (fromOverlay(e) && engineOn ? { view: currentView(), clickThrough: overlayPrefs.clickThrough } : null));
  ipcMain.on("tracker:rendered", (e) => {
    if (!CAPTURE || e.sender !== win?.webContents) return;
    // l'interfaccia ha disegnato lo stato: un attimo per i caratteri (e con --capture-delay per le immagini delle carte,
    // che arrivano da originsmeta.com), poi lo screenshot
    const delay = Number(process.argv.find((a) => a.startsWith("--capture-delay="))?.slice("--capture-delay=".length)) || 600;
    setTimeout(async () => {
      try {
        // --capture-bottom: in fondo alla pagina; --capture-scroll=<px>: a un punto preciso. Poi un attimo per il ridisegno
        const at = process.argv.find((a) => a.startsWith("--capture-scroll="))?.slice("--capture-scroll=".length);
        const scroll = process.argv.includes("--capture-bottom") ? "document.body.scrollHeight" : at && /^\d{1,6}$/.test(at) ? at : null;
        if (scroll) {
          await win!.webContents.executeJavaScript(`window.scrollTo(0, ${scroll})`);
          await new Promise((r) => setTimeout(r, 500));
        }
        const image = await win!.webContents.capturePage();
        fs.mkdirSync(path.dirname(path.resolve(CAPTURE)), { recursive: true });
        fs.writeFileSync(path.resolve(CAPTURE), image.toPNG());
      } finally {
        quitting = true;
        app.exit(0);
      }
    }, Math.min(delay, 30_000));
  });
}

/* ---------- avvio ---------- */

const deckView = (deck: GameDeck | null): ActiveDeck => (deck ? { name: deck.name, legendary: deck.legendary?.replace(/_V\d+$/, "") ?? null, cards: deck.cards.map((k) => k.replace(/_V\d+$/, "")) } : null);

async function boot() {
  if (WAIT_GAME && !CAPTURE) await waitForGame();
  // avviata in automatico (con Windows o con il gioco): solo l'icona, pannelli e overlay quando si apre l'app
  layersDeferred = HIDDEN && !openRequested && !CAPTURE;
  migrateLoginItem();
  loadStartMode();
  store = new Store(app.getPath("userData"));
  const hadState = store.load();
  account = new Account(app.getPath("userData"), cipher);
  account.load();
  if (account.unreadable) notice = "relink";
  sync = new SyncQueue(app.getPath("userData"), syncDeps);
  sync.load();
  loadOverlayPrefs();
  loadPanelPrefs();
  loadScanPrefs();
  watcher = new MatchWatcher(gameDirs(app.getPath("home"), app.getPath("documents")), store.saved, { firstRun: !hadState });
  watcher.on("match", (raw: TrackedMatch) => {
    if (!engineOn) return; // un giro già partito quando l'app si è bloccata
    // la stessa partita già registrata dallo schermo (statistiche arrivate in ritardo): si tiene quella
    const twin = screenTwin(raw);
    if (twin) {
      twin.used = true;
      frames?.event("match-skipped", { endedAt: raw.endedAt, result: raw.result, screenAt: new Date(twin.at).toISOString() });
      return;
    }
    // anche dopo un riavvio dell'app, quando `fromScreen` è vuoto: una partita già nello storico con lo stesso esito e a
    // meno di NEAR_MS è la stessa (12/10/2026: la vittoria delle 01:05 registrata dallo schermo, l'app riavviata, e le
    // statistiche del gioco arrivate dopo l'hanno aggiunta una seconda volta, con un secondo di differenza)
    const end = raw.endedAt ? Date.parse(raw.endedAt) : NaN;
    const stored = Number.isFinite(end) ? store.matches.find((m) => m.result === raw.result && nearTo(m.endedAt, end)) : undefined;
    if (stored) {
      frames?.event("match-skipped", { endedAt: raw.endedAt, result: raw.result, storedAt: stored.endedAt });
      return;
    }
    // scanner: giocate e carte dell'avversario lette dallo schermo, se il replay non le ha date
    const m = frames ? applyScan(raw, frames.matchFor(raw.endedAt ? Date.parse(raw.endedAt) : Date.now())) : raw;
    if (store.add(m)) {
      // modalità cattura: la partita finita etichetta i fotogrammi (esito, mazzo e quello che lo scanner ha letto)
      frames?.event("match", { endedAt: m.endedAt, result: m.result, queue: m.queue, legendary: m.deck?.legendary ?? null, cards: m.deck?.cards ?? [], opponent: m.opponent, turns: m.turns, plays: m.plays });
      push();
      // la partita parte per il sito pochi secondi dopo (il tempo di altre righe dello stesso giro)
      scheduleSync(5000);
    }
  });
  watcher.on("missed", (s: string) => {
    store.save({ missed: (s + store.saved.missed).slice(0, 500) });
    push();
  });
  watcher.on("saved", (s) => store.save(s));
  watcher.on("status", push);
  watcher.on("history", (h: string) => {
    history = h;
    push();
  });
  watcher.on("deck", (d: GameDeck | null) => {
    gameDeck = d;
    activeDeck = deckView(d);
    frames?.event("deck", { deck: activeDeck });
    push();
  });

  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => callback(false));
  registerIpc();
  if (!CAPTURE) {
    tray = new Tray(nativeImage.createFromPath(ICON));
    tray.on("click", showWindow);
    setInterval(() => void runSync(false), SYNC_EVERY_MS);
    // il mazzo scelto: una magia che non c'è è dell'avversario (13/10/2026, `spellPlays` di reconstruct.ts)
    const cards = { token: (k: string) => CARDS[k]?.t === "token", legendary: (k: string) => CARDS[k]?.l === 1, myDeck: () => activeDeck?.cards ?? null };
    frames = new FrameRecorder(app.getPath("userData"), { save: FRAMES, cards, onScan: noteFrame }, push);
    // aggiornamento automatico (11/10/2026): solo nell'app impacchettata e, dall'11/10 sera, solo a gioco chiuso (prima
    // "fuori partita" secondo lo scanner, che in una finestra piccola sbagliava e riavviava l'app in partita)
    // avvisi di Windows dell'aggiornamento (13/10/2026): dal fumetto dell'icona, che non chiede collegamenti nel menu Start
    const notifyUpdate = (kind: UpdateNotice, version: string) => {
      const n = updateNotice(lang(), kind, version);
      tray?.displayBalloon({ title: n.title, content: n.content, iconType: "info", respectQuietTime: false });
    };
    noteVersion(notifyUpdate);
    updater = new Updater({
      notify: notifyUpdate,
      canInstall: async () => {
        if (frames?.running && frames.live()?.inMatch) return false;
        const sources = await desktopCapturer.getSources({ types: ["window"], thumbnailSize: { width: 0, height: 0 } });
        return !pickGameWindow(sources.map((s) => ({ id: s.id, name: s.name })));
      },
      onChange: push,
      quit: () => {
        quitting = true;
        app.quit();
      },
    });
    updater.start();
  }
  // solo con l'account (access.ts): sbloccata se il collegamento è stato verificato da meno di 7 giorni (così parte
  // anche senza rete), poi la verifica con il sito subito e ogni minuto il controllo di quando rifarla
  refreshAccess();
  if (!CAPTURE) {
    void checkAccess();
    setInterval(accessTick, 60_000);
  }
  // avviata con Windows ma bloccata: la finestra si apre comunque, per dire che serve il collegamento (non per
  // "verify", il collegamento della 0.3.x che la verifica appena partita sblocca in un attimo)
  createWindow(openRequested || !HIDDEN || (!access.open && access.reason !== "verify"));
}

if (!CAPTURE && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // in attesa del gioco (startup.ts) il giocatore che apre l'app la fa partire subito, con la finestra
  app.on("second-instance", () => {
    if (!waitingForGame) return showWindow();
    openRequested = true;
    waitingForGame();
  });
  app.on("web-contents-created", (_e, contents) => {
    contents.on("will-attach-webview", (e) => e.preventDefault());
  });
  app.on("before-quit", () => {
    quitting = true;
    watcher?.stop();
    frames?.stop();
    updater?.stop();
    overlayServer?.close();
  });
  // senza finestre (avvio con Windows, solo l'icona nella barra) l'app resta accesa finché non si sceglie "Esci"
  app.on("window-all-closed", () => {
    if (CAPTURE) app.quit();
  });
  void app.whenReady().then(boot);
}
