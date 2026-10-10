/**
 * Ponte della finestra del pannello del mazzo (10/10/2026): solo la lettura dei dati da mostrare, nient'altro.
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
};

contextBridge.exposeInMainWorld("deckApi", api);
