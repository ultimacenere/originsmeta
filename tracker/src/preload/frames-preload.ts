/**
 * Ponte della finestra nascosta della modalità cattura (main/frames.ts): riceve l'id della finestra del gioco da
 * riprendere e manda i fotogrammi JPEG. Nient'altro.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { FramesApi } from "../shared/types";

const api: FramesApi = {
  onStart: (listener) => ipcRenderer.on("frames:start", (_e, id: string) => listener(id)),
  onStop: (listener) => ipcRenderer.on("frames:stop", () => listener()),
  save: (jpeg) => ipcRenderer.invoke("frames:save", jpeg),
  ended: () => ipcRenderer.send("frames:ended"),
};

contextBridge.exposeInMainWorld("framesApi", api);
