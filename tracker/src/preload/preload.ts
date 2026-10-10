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
  setOpenAtLogin: (on) => ipcRenderer.invoke("tracker:login", on),
  openDataFolder: () => ipcRenderer.invoke("tracker:folder"),
  openLink: (url) => ipcRenderer.invoke("tracker:link", url),
  // account OriginsMeta (Fase 3)
  linkAccount: (code) => ipcRenderer.invoke("tracker:account-link", code),
  unlinkAccount: () => ipcRenderer.invoke("tracker:account-unlink"),
  syncNow: () => ipcRenderer.invoke("tracker:sync-now"),
  // overlay (Fase 4)
  setOverlayWindow: (on) => ipcRenderer.invoke("tracker:overlay-window", on),
  setDeckWindow: (on) => ipcRenderer.invoke("tracker:deck-window", on),
  setOppWindow: (on) => ipcRenderer.invoke("tracker:opp-window", on),
  setScanner: (on) => ipcRenderer.invoke("tracker:scanner", on),
  dismissScannerNotice: () => ipcRenderer.invoke("tracker:scanner-notice"),
  setOverlayClickThrough: (on) => ipcRenderer.invoke("tracker:overlay-click-through", on),
  resetSession: () => ipcRenderer.invoke("tracker:overlay-session"),
  copyText: (text) => ipcRenderer.invoke("tracker:copy", text),
  // l'interfaccia ha disegnato lo stato (serve solo agli screenshot di verifica)
  rendered: () => ipcRenderer.send("tracker:rendered"),
};

contextBridge.exposeInMainWorld("tracker", api);
