/**
 * Ponte fra l'interfaccia (senza Node) e il processo principale: solo queste cinque funzioni, niente altro.
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
  // l'interfaccia ha disegnato lo stato (serve solo agli screenshot di verifica)
  rendered: () => ipcRenderer.send("tracker:rendered"),
};

contextBridge.exposeInMainWorld("tracker", api);
