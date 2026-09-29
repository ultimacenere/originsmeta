/**
 * Ponte della finestra dell'overlay (Fase 4, 30/09/2026): solo la lettura dei dati da mostrare, nient'altro. Nessuna
 * delle funzioni dell'app (collegamento, cartelle, link) è raggiungibile da qui.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { OverlayApi, OverlayView } from "../shared/types";

type Payload = { view: OverlayView; clickThrough: boolean };

const api: OverlayApi = {
  getView: () => ipcRenderer.invoke("overlay:view"),
  onView: (listener) => {
    const handler = (_e: IpcRendererEvent, s: Payload) => listener(s);
    ipcRenderer.on("overlay:view", handler);
    return () => ipcRenderer.removeListener("overlay:view", handler);
  },
};

contextBridge.exposeInMainWorld("overlayApi", api);
