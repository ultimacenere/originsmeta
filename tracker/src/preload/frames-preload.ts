/**
 * Ponte della finestra nascosta della modalità cattura (main/frames.ts): riceve l'id della finestra del gioco da
 * riprendere, manda i fotogrammi letti dal riconoscitore, il ritaglio del nome dell'avversario della schermata VS (per
 * riconoscere i bot, 14/10/2026) e, nella modalità cattura, i JPEG. Nient'altro.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { FramesApi, FramesStartOpts } from "../shared/types";

const screensOf = (v: unknown): [number, number][] =>
  Array.isArray(v) ? v.filter((s): s is [number, number] => Array.isArray(s) && s.length === 2 && s.every((n) => Number.isFinite(n))).slice(0, 16) : [];

const api: FramesApi = {
  onStart: (listener) =>
    ipcRenderer.on("frames:start", (_e, id: string, opts: Partial<FramesStartOpts>) => listener(id, { save: opts?.save === true, screens: screensOf(opts?.screens) })),
  onStop: (listener) => ipcRenderer.on("frames:stop", () => listener()),
  save: (jpeg) => ipcRenderer.invoke("frames:save", jpeg),
  ended: () => ipcRenderer.send("frames:ended"),
  scan: (frame) => ipcRenderer.send("frames:scan", frame),
  name: (png) => ipcRenderer.send("frames:name", png),
};

contextBridge.exposeInMainWorld("framesApi", api);
