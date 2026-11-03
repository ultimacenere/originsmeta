/**
 * Dove Origins TCG salva i file che il tracker legge (docs/tracker.md): la cache del profilo sotto
 * `AppData\LocalLow\Koin Games\<prodotto>\beamable\cache` e i replay sotto `Documenti\My Games\<prodotto>\Replays`.
 * La cartella Documenti arriva da Electron (`app.getPath("documents")`), che segue anche lo spostamento di OneDrive.
 * Dal 28/10/2026 il gioco completo e il playtest, non più la demo (Pierluigi: "con l'uscita della release la demo non
 * esiste più"): la sua cache resta sui PC e il watcher, che segue la cartella scritta più di recente, la prendeva per
 * buona quando non riconosceva le statistiche della release.
 *
 * Per i test e le prove: ORIGINSMETA_TRACKER_CACHE e ORIGINSMETA_TRACKER_REPLAYS (cartelle separate da `;`).
 */
import path from "node:path";

export const PRODUCTS = ["Origins TCG", "Origins TCG Playtest"] as const;

export type GameDirs = { cacheRoots: string[]; replayDirs: string[] };

export function gameDirs(home: string, documents: string, env: Record<string, string | undefined> = process.env): GameDirs {
  const list = (v: string | undefined) => (v ? v.split(path.delimiter).filter(Boolean) : null);
  return {
    cacheRoots: list(env.ORIGINSMETA_TRACKER_CACHE) ?? PRODUCTS.map((p) => path.join(home, "AppData", "LocalLow", "Koin Games", p, "beamable", "cache")),
    replayDirs: list(env.ORIGINSMETA_TRACKER_REPLAYS) ?? PRODUCTS.map((p) => path.join(documents, "My Games", p, "Replays")),
  };
}
