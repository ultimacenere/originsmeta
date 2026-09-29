/**
 * OriginsMeta Tracker, processo principale (Fasi 2–4 del tracker/overlay, 29–30/09/2026; guida in docs/tracker.md).
 *
 * - Icona accanto all'orologio: clic = apri la finestra; menu con "Apri", "Overlay sopra il gioco", "Avvia con
 *   Windows" ed "Esci". Chiudere la finestra la nasconde e il tracker continua a registrare.
 * - "Avvia con Windows" è spento finché il giocatore non lo accende (voce di Windows "Esegui all'avvio"), e parte con
 *   `--hidden`, cioè solo nella barra.
 * - Una sola copia aperta: la seconda riporta in primo piano la prima.
 * - Account OriginsMeta (Fase 3): collegamento con il codice di originsmeta.com/account/tracker, token cifrato con
 *   safeStorage (account.ts), invio delle partite a gruppi con i tentativi (sync.ts): subito dopo ogni partita, all'avvio
 *   e ogni 5 minuti se qualcosa resta indietro. ORIGINSMETA_TRACKER_SITE (solo https o localhost) punta a un altro sito
 *   per le prove.
 * - Overlay (Fase 4): una finestra piccola sopra il gioco (sempre in primo piano, trasparente, lascia passare i clic
 *   finché il giocatore non sceglie "Sposta") e la sorgente per OBS servita solo su 127.0.0.1 (overlay.ts). Mai
 *   agganciata alla grafica del gioco: è una finestra separata. Con il gioco a schermo intero esclusivo Windows non la
 *   mostra: serve la modalità a finestra o a finestra senza bordi.
 * - Sicurezza: interfaccia senza Node (contextIsolation, sandbox, preload minimi), nessuna navigazione né finestra
 *   nuova, nessun permesso del browser, link esterni solo verso https://originsmeta.com, IPC accettato solo dalla
 *   pagina locale dell'app (la finestra dell'overlay legge solo i suoi dati).
 * - `--capture=<file.png>` (con `--capture-size=LxA` e `--capture-bottom` per il fondo della pagina): apre la finestra,
 *   aspetta che l'interfaccia abbia disegnato, salva uno screenshot ed esce. Serve alle verifiche; con
 *   ORIGINSMETA_TRACKER_DATA si usa una cartella dati di prova. Niente rete né finestra dell'overlay in questa modalità
 *   (la sorgente per OBS sì, per mostrarne gli indirizzi).
 */
import { app, BrowserWindow, clipboard, ipcMain, Menu, nativeImage, net, safeStorage, screen, session, shell, Tray, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cardsTable from "../cards.json";
import { gameDirs } from "./paths";
import { Store } from "./store";
import { MatchWatcher } from "./watcher";
import { Account, type Cipher } from "./account";
import { SyncQueue, claimCode, siteBase, unlinkRemote, type SyncDeps } from "./sync";
import { overlayView, startOverlayServer, type CardLookup } from "./overlay";
import type { AccountState, ActiveDeck, AppState, LinkResult, OverlayView } from "../shared/types";
import type { GameDeck } from "../../../src/lib/tracker/profile";

const HIDDEN = process.argv.includes("--hidden");
const CAPTURE = process.argv.find((a) => a.startsWith("--capture="))?.slice("--capture=".length) ?? null;
const CAPTURE_SIZE = (process.argv.find((a) => a.startsWith("--capture-size="))?.slice("--capture-size=".length) ?? "1040x760").split("x").map(Number);

if (process.env.ORIGINSMETA_TRACKER_DATA) app.setPath("userData", process.env.ORIGINSMETA_TRACKER_DATA);
app.setAppUserModelId("com.originsmeta.tracker");

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

type CardRow = { n: string; l: 0 | 1 };
const CARDS = cardsTable as Record<string, CardRow>;
const card: CardLookup = (key) => {
  const c = CARDS[key];
  return c ? { name: c.n, legendary: c.l === 1 } : undefined;
};

/* ---------- lingua del menu dell'icona ---------- */

const lang = (): "en" | "it" | "es" => {
  const l = app.getLocale().toLowerCase();
  return l.startsWith("it") ? "it" : l.startsWith("es") ? "es" : "en";
};
const TRAY = {
  en: { open: "Open OriginsMeta Tracker", overlay: "Overlay above the game", startup: "Start with Windows", quit: "Quit", listening: "tracking", waiting: "waiting for the game", today: (w: number, l: number) => `today ${w}–${l}`, none: "no matches today" },
  it: { open: "Apri OriginsMeta Tracker", overlay: "Overlay sopra il gioco", startup: "Avvia con Windows", quit: "Esci", listening: "in ascolto", waiting: "in attesa del gioco", today: (w: number, l: number) => `oggi ${w}–${l}`, none: "nessuna partita oggi" },
  es: { open: "Abrir OriginsMeta Tracker", overlay: "Overlay sobre el juego", startup: "Iniciar con Windows", quit: "Salir", listening: "registrando", waiting: "esperando al juego", today: (w: number, l: number) => `hoy ${w}–${l}`, none: "ninguna partida hoy" },
};

/* ---------- avvio con Windows ---------- */

// in sviluppo si lancia electron.exe con la cartella dell'app; nell'app installata basta l'eseguibile
const loginArgs = () => (app.isPackaged ? ["--hidden"] : [app.getAppPath(), "--hidden"]);
const openAtLogin = () => app.getLoginItemSettings({ path: process.execPath, args: loginArgs() }).openAtLogin;
function setOpenAtLogin(on: boolean): boolean {
  app.setLoginItemSettings({ openAtLogin: on, path: process.execPath, args: loginArgs() });
  refreshTray();
  return openAtLogin();
}

/* ---------- stato per l'interfaccia ---------- */

function currentView(): OverlayView {
  return overlayView({ matches: store.matches, activeDeck, sessionStart, card });
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

function state(): AppState {
  return {
    version: app.getVersion(),
    status: watcher.status,
    matches: [...store.matches].reverse(),
    missed: store.saved.missed,
    history,
    activeDeck,
    openAtLogin: CAPTURE ? false : openAtLogin(),
    dataFolder: store.dir,
    account: accountState(),
    overlay: {
      window: Boolean(overlayWin && !overlayWin.isDestroyed()),
      clickThrough: overlayPrefs.clickThrough,
      obsUrl: overlayServer ? `${overlayServer.url}?lang=${lang()}` : null,
      sessionStart: new Date(sessionStart).toISOString(),
      view: currentView(),
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
    refreshTray();
  }, 100);
}

/* ---------- invio delle partite al sito ---------- */

const cipher: Cipher = {
  available: () => safeStorage.isEncryptionAvailable(),
  encrypt: (text) => safeStorage.encryptString(text),
  decrypt: (data) => safeStorage.decryptString(data),
};
const syncDeps: SyncDeps = { site: SITE_ORIGIN, fetch: (url, init) => net.fetch(url, init) };

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
  if (!token || CAPTURE) return;
  const running = sync.run(store.matches, token, { force });
  push();
  const r = await running;
  if (r.unlinked) {
    // il sito non riconosce più il token (PC scollegato da /account/tracker): si dimentica e lo si dice
    account.clear();
    sync.reset();
    notice = "unlinked";
  }
  push();
}

async function linkAccount(code: unknown): Promise<LinkResult> {
  if (account.linked) return { ok: true, username: account.username };
  const r = await claimCode(syncDeps, String(code ?? ""), os.hostname());
  if (!r.ok) return r;
  account.set(r.token, r.username, SITE_ORIGIN);
  // tutto lo storico sul PC va a questo account (il sito scarta da sé i doppioni)
  sync.reset();
  notice = null;
  push();
  void runSync(true);
  return { ok: true, username: r.username };
}

async function unlinkAccount() {
  const token = account.token;
  account.clear();
  sync.reset();
  notice = null;
  push();
  if (token) await unlinkRemote(syncDeps, token);
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
  if (on) openOverlay();
  else if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
  overlayPrefs = { ...overlayPrefs, open: on };
  saveOverlayPrefs();
  push();
  return on;
}

function setClickThrough(on: boolean): boolean {
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
  tray.setToolTip(`OriginsMeta Tracker · ${watcher?.status.cache ? t.listening : t.waiting} · ${store ? todayRecord() : ""}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t.open, click: showWindow },
      { type: "separator" },
      { label: t.overlay, type: "checkbox", checked: Boolean(overlayWin && !overlayWin.isDestroyed()), click: (item) => setOverlayWindow(item.checked) },
      { label: t.startup, type: "checkbox", checked: openAtLogin(), click: (item) => setOpenAtLogin(item.checked) },
      { type: "separator" },
      { label: t.quit, click: () => app.quit() },
    ]),
  );
}

/* ---------- finestra ---------- */

function showWindow() {
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
    title: "OriginsMeta Tracker",
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
  win.on("close", (e) => {
    if (!quitting && !CAPTURE) {
      e.preventDefault();
      win?.hide();
    }
  });
  win.once("ready-to-show", () => {
    if (CAPTURE) win?.showInactive();
    else if (show) win?.show();
  });
  void win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function openLink(url: unknown) {
  if (typeof url === "string" && url.startsWith(SITE) && !/[\s"'<>]/.test(url)) void shell.openExternal(url);
}

/* ---------- IPC: solo dalla pagina locale dell'app ---------- */

const fromApp = (e: IpcMainInvokeEvent) => Boolean(e.senderFrame?.url.startsWith("file://")) && e.sender === win?.webContents;
const fromOverlay = (e: IpcMainInvokeEvent) => Boolean(e.senderFrame?.url.startsWith("file://")) && Boolean(overlayWin) && e.sender === overlayWin?.webContents;

function registerIpc() {
  ipcMain.handle("tracker:state", (e) => (fromApp(e) ? state() : null));
  ipcMain.handle("tracker:login", (e, on: unknown) => (fromApp(e) && !CAPTURE ? setOpenAtLogin(on === true) : openAtLogin()));
  ipcMain.handle("tracker:folder", async (e) => {
    if (fromApp(e)) await shell.openPath(store.dir);
  });
  ipcMain.handle("tracker:link", (e, url: unknown) => {
    if (fromApp(e)) openLink(url);
  });
  ipcMain.handle("tracker:account-link", (e, code: unknown): Promise<LinkResult> | LinkResult => (fromApp(e) && !CAPTURE ? linkAccount(code) : { ok: false, problem: "error" }));
  ipcMain.handle("tracker:account-unlink", async (e) => {
    if (fromApp(e) && !CAPTURE) await unlinkAccount();
  });
  ipcMain.handle("tracker:sync-now", async (e) => {
    if (fromApp(e)) await runSync(true);
  });
  ipcMain.handle("tracker:overlay-window", (e, on: unknown) => (fromApp(e) && !CAPTURE ? setOverlayWindow(on === true) : Boolean(overlayWin)));
  ipcMain.handle("tracker:overlay-click-through", (e, on: unknown) => (fromApp(e) ? setClickThrough(on === true) : overlayPrefs.clickThrough));
  ipcMain.handle("tracker:overlay-session", (e) => {
    if (!fromApp(e)) return;
    sessionStart = Date.now();
    push();
  });
  ipcMain.handle("tracker:copy", (e, text: unknown) => {
    // indirizzi per OBS e codici del gioco (un codice di 13 carte sta sotto i 300 caratteri; il tetto del sito è 420)
    if (fromApp(e) && typeof text === "string" && text.length <= 600) clipboard.writeText(text);
  });
  // la finestra dell'overlay legge solo i suoi dati
  ipcMain.handle("overlay:view", (e) => (fromOverlay(e) ? { view: currentView(), clickThrough: overlayPrefs.clickThrough } : null));
  ipcMain.on("tracker:rendered", (e) => {
    if (!CAPTURE || e.sender !== win?.webContents) return;
    // l'interfaccia ha disegnato lo stato: un attimo per i caratteri, poi lo screenshot
    setTimeout(async () => {
      try {
        if (process.argv.includes("--capture-bottom")) await win!.webContents.executeJavaScript("window.scrollTo(0, document.body.scrollHeight)");
        const image = await win!.webContents.capturePage();
        fs.mkdirSync(path.dirname(path.resolve(CAPTURE)), { recursive: true });
        fs.writeFileSync(path.resolve(CAPTURE), image.toPNG());
      } finally {
        quitting = true;
        app.exit(0);
      }
    }, 600);
  });
}

/* ---------- avvio ---------- */

const deckView = (deck: GameDeck | null): ActiveDeck => (deck ? { name: deck.name, legendary: deck.legendary?.replace(/_V\d+$/, "") ?? null, cards: deck.cards.map((k) => k.replace(/_V\d+$/, "")) } : null);

async function boot() {
  store = new Store(app.getPath("userData"));
  const hadState = store.load();
  account = new Account(app.getPath("userData"), cipher);
  account.load();
  sync = new SyncQueue(app.getPath("userData"), syncDeps);
  sync.load();
  loadOverlayPrefs();
  watcher = new MatchWatcher(gameDirs(app.getPath("home"), app.getPath("documents")), store.saved, { firstRun: !hadState });
  watcher.on("match", (m) => {
    if (store.add(m)) {
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
    activeDeck = deckView(d);
    push();
  });

  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => callback(false));
  registerIpc();
  // la sorgente per OBS parte anche nella modalità di cattura, così lo screenshot mostra gli indirizzi veri
  overlayServer = await startOverlayServer({ dir: path.join(__dirname, "overlay"), view: currentView });
  if (!CAPTURE) {
    tray = new Tray(nativeImage.createFromPath(ICON));
    tray.on("click", showWindow);
    refreshTray();
    if (overlayPrefs.open) openOverlay();
    scheduleSync(10_000);
    setInterval(() => void runSync(false), SYNC_EVERY_MS);
  }
  createWindow(!HIDDEN);
  watcher.start();
}

if (!CAPTURE && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showWindow);
  app.on("web-contents-created", (_e, contents) => {
    contents.on("will-attach-webview", (e) => e.preventDefault());
  });
  app.on("before-quit", () => {
    quitting = true;
    watcher?.stop();
    overlayServer?.close();
  });
  // la finestra si nasconde invece di chiudersi: l'app resta nella barra finché non si sceglie "Esci"
  app.on("window-all-closed", () => {
    if (CAPTURE) app.quit();
  });
  void app.whenReady().then(boot);
}
