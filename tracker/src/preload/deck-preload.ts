/**
 * Ponte della finestra del pannello del mazzo (10/10/2026): la lettura dei dati da mostrare e, dall'11/10/2026, l'altezza
 * del contenuto per adattare la finestra. Nient'altro.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { DeckApi, DeckTrackerView } from "../shared/types";

const api: DeckApi = {
  getView: () => ipcRenderer.invoke("deck:view"),
  onView: (listener) => {
    const handler = (_e: IpcRendererEvent, v: DeckTrackerView) => listener(v);
    ipcRenderer.on("deck:view", handler);
    return () => ipcRenderer.removeListener("deck:view", handler);
  },
  fit: (height) => ipcRenderer.send("deck:fit", height),
  close: () => ipcRenderer.send("deck:close"),
  hit: (on) => ipcRenderer.send("deck:hit", on === true),
};

contextBridge.exposeInMainWorld("deckApi", api);
