/**
 * OriginsMeta Tracker, processo principale (Fase 2 del tracker/overlay, 29/09/2026; guida in docs/tracker.md).
 *
 * - Icona accanto all'orologio: clic = apri la finestra; menu con "Apri", "Avvia con Windows" ed "Esci". Chiudere la
 *   finestra la nasconde e il tracker continua a registrare.
 * - "Avvia con Windows" è spento finché il giocatore non lo accende (voce di Windows "Esegui all'avvio"), e parte con
 *   `--hidden`, cioè solo nella barra.
 * - Una sola copia aperta: la seconda riporta in primo piano la prima.
 * - Sicurezza: interfaccia senza Node (contextIsolation, sandbox, preload minimo), nessuna navigazione né finestra nuova,
 *   nessun permesso del browser, link esterni solo verso https://originsmeta.com, IPC accettato solo dalla pagina
 *   locale dell'app.
 * - `--capture=<file.png>` (con `--capture-size=LxA` e `--capture-bottom` per il fondo della pagina): apre la finestra,
 *   aspetta che l'interfaccia abbia disegnato, salva uno screenshot ed esce. Serve alle verifiche; con
 *   ORIGINSMETA_TRACKER_DATA si usa una cartella dati di prova.
 */
import { app, BrowserWindow, ipcMain, Menu, nativeImage, session, shell, Tray, type IpcMainInvokeEvent } from "electron";
import fs from "node:fs";
import path from "node:path";
import { gameDirs } from "./paths";
import { Store } from "./store";
import { MatchWatcher } from "./watcher";
import type { ActiveDeck, AppState } from "../shared/types";
import type { GameDeck } from "../../../src/lib/tracker/profile";

const HIDDEN = process.argv.includes("--hidden");
const CAPTURE = process.argv.find((a) => a.startsWith("--capture="))?.slice("--capture=".length) ?? null;
const CAPTURE_SIZE = (process.argv.find((a) => a.startsWith("--capture-size="))?.slice("--capture-size=".length) ?? "1040x760").split("x").map(Number);

if (process.env.ORIGINSMETA_TRACKER_DATA) app.setPath("userData", process.env.ORIGINSMETA_TRACKER_DATA);
app.setAppUserModelId("com.originsmeta.tracker");

const SITE = "https://originsmeta.com/";
const ICON = path.join(__dirname, "icon.ico");

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;
let store: Store;
let watcher: MatchWatcher;
let history = "";
let activeDeck: ActiveDeck = null;

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
  };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function push() {
  if (pushTimer) return;
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (win && !win.isDestroyed()) win.webContents.send("tracker:state", state());
    refreshTray();
  }, 100);
}

/* ---------- barra delle notifiche ---------- */

function todayRecord(): string {
  const today = new Date().toDateString();
  const list = store.matches.filter((m) => m.endedAt && new Date(m.endedAt).toDateString() === today);
  const w = list.filter((m) => m.result === "W").length;
  const l = list.filter((m) => m.result === "L").length;
  return list.length ? `oggi ${w}–${l}` : "nessuna partita oggi";
}

function refreshTray() {
  if (!tray) return;
  tray.setToolTip(`OriginsMeta Tracker · ${watcher?.status.cache ? "in ascolto" : "in attesa del gioco"} · ${store ? todayRecord() : ""}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Apri OriginsMeta Tracker", click: showWindow },
      { type: "separator" },
      { label: "Avvia con Windows", type: "checkbox", checked: openAtLogin(), click: (item) => setOpenAtLogin(item.checked) },
      { type: "separator" },
      { label: "Esci", click: () => app.quit() },
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

function registerIpc() {
  ipcMain.handle("tracker:state", (e) => (fromApp(e) ? state() : null));
  ipcMain.handle("tracker:login", (e, on: unknown) => (fromApp(e) && !CAPTURE ? setOpenAtLogin(on === true) : openAtLogin()));
  ipcMain.handle("tracker:folder", async (e) => {
    if (fromApp(e)) await shell.openPath(store.dir);
  });
  ipcMain.handle("tracker:link", (e, url: unknown) => {
    if (fromApp(e)) openLink(url);
  });
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

function boot() {
  store = new Store(app.getPath("userData"));
  const hadState = store.load();
  watcher = new MatchWatcher(gameDirs(app.getPath("home"), app.getPath("documents")), store.saved, { firstRun: !hadState });
  watcher.on("match", (m) => {
    if (store.add(m)) push();
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
  if (!CAPTURE) {
    tray = new Tray(nativeImage.createFromPath(ICON));
    tray.on("click", showWindow);
    refreshTray();
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
  });
  // la finestra si nasconde invece di chiudersi: l'app resta nella barra finché non si sceglie "Esci"
  app.on("window-all-closed", () => {
    if (CAPTURE) app.quit();
  });
  void app.whenReady().then(boot);
}
