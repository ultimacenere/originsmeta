/**
 * Ponte della finestra nascosta della modalità cattura (main/frames.ts): riceve l'id della finestra del gioco da
 * riprendere, manda i fotogrammi letti dal riconoscitore e, nella modalità cattura, i JPEG. Nient'altro.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { FramesApi } from "../shared/types";

const api: FramesApi = {
  onStart: (listener) => ipcRenderer.on("frames:start", (_e, id: string, opts: { save: boolean }) => listener(id, { save: opts?.save === true })),
  onStop: (listener) => ipcRenderer.on("frames:stop", () => listener()),
  save: (jpeg) => ipcRenderer.invoke("frames:save", jpeg),
  ended: () => ipcRenderer.send("frames:ended"),
  scan: (frame) => ipcRenderer.send("frames:scan", frame),
};

contextBridge.exposeInMainWorld("framesApi", api);
