/**
 * Ponte fra l'interfaccia (senza Node) e il processo principale: solo queste funzioni, niente altro. Il processo
 * principale accetta le chiamate solo dalla pagina locale della finestra dell'app.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { AppState, TrackerApi } from "../shared/types";

const api: TrackerApi & { rendered(): void } = {
  getState: () => ipcRenderer.invoke("tracker:state"),
  onState: (listener) => {
    const handler = (_e: IpcRendererEvent, s: AppState) => listener(s);
    ipcRenderer.on("tracker:state", handler);
    return () => ipcRenderer.removeListener("tracker:state", handler);
  },
  setStartMode: (mode) => ipcRenderer.invoke("tracker:login", mode),
  openDataFolder: () => ipcRenderer.invoke("tracker:folder"),
  openLink: (url) => ipcRenderer.invoke("tracker:link", url),
  // account OriginsMeta (Fase 3)
  linkAccount: (code) => ipcRenderer.invoke("tracker:account-link", code),
  unlinkAccount: () => ipcRenderer.invoke("tracker:account-unlink"),
  syncNow: () => ipcRenderer.invoke("tracker:sync-now"),
  verifyNow: () => ipcRenderer.invoke("tracker:verify-now"),
  // overlay (Fase 4)
  setOverlayWindow: (on) => ipcRenderer.invoke("tracker:overlay-window", on),
  setDeckWindow: (on) => ipcRenderer.invoke("tracker:deck-window", on),
  setOppWindow: (on) => ipcRenderer.invoke("tracker:opp-window", on),
  setPanelTemplate: (template) => ipcRenderer.invoke("tracker:panel-template", template),
  setPanelCustom: (custom) => ipcRenderer.invoke("tracker:panel-custom", custom),
  setPanelsOnlyInMatch: (on) => ipcRenderer.invoke("tracker:panels-in-match", on),
  setPanelsHideFromStream: (on) => ipcRenderer.invoke("tracker:panels-hide-stream", on),
  setScanner: (on) => ipcRenderer.invoke("tracker:scanner", on),
  quitApp: () => ipcRenderer.invoke("tracker:quit"),
  dismissScannerNotice: () => ipcRenderer.invoke("tracker:scanner-notice"),
  setOverlayClickThrough: (on) => ipcRenderer.invoke("tracker:overlay-click-through", on),
  resetSession: () => ipcRenderer.invoke("tracker:overlay-session"),
  copyText: (text) => ipcRenderer.invoke("tracker:copy", text),
  spotPanels: (on) => ipcRenderer.invoke("tracker:spot-panels", on),
  // l'interfaccia ha disegnato lo stato (serve solo agli screenshot di verifica)
  rendered: () => ipcRenderer.send("tracker:rendered"),
};

contextBridge.exposeInMainWorld("tracker", api);
