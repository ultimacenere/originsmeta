/**
 * Avvio automatico (16/10/2026, Pierluigi: "aggiungi avvio automatico con l'avvio del gioco ma senza aprire il builder,
 * solo icona vicino all'orologio… se il giocatore vuole aprire l'app e i layer se l'aprirà, a noi ci interessa il
 * tracking delle sue partite principalmente"). Funzioni pure, provate in startup.test.ts.
 *
 * Windows non sa avviare un programma quando ne parte un altro senza permessi da amministratore, quindi "con il gioco"
 * è una voce di "Esegui all'avvio" che lancia l'app con `--wait-game`: l'app aspetta in silenzio (niente icona, niente
 * finestre, nessuna lettura dei file del gioco) e controlla ogni 10 secondi se il gioco è aperto; quando lo vede parte
 * solo nella barra, accanto all'orologio, e registra le partite. Finestra dell'app e pannelli si aprono solo se il
 * giocatore apre l'app. "Con il gioco" è acceso di default (i giocatori che avevano già "Avvia con Windows" lo tengono).
 */
import type { LoginItem } from "./appIdentity";

export type StartMode = "off" | "game" | "windows";
export const START_MODES: readonly StartMode[] = ["game", "windows", "off"];
export const WAIT_GAME_ARG = "--wait-game";
/** Ogni quanto l'app in attesa guarda se il gioco è aperto. */
export const GAME_POLL_MS = 10_000;

/** Gli argomenti della voce di avvio (in sviluppo si aggiunge davanti la cartella dell'app). */
export function startArgs(mode: Exclude<StartMode, "off">): string[] {
  return mode === "game" ? ["--hidden", WAIT_GAME_ARG] : ["--hidden"];
}

export function readStartMode(raw: unknown): StartMode | null {
  return raw === "off" || raw === "game" || raw === "windows" ? raw : null;
}

/**
 * La scelta al primo avvio di questa versione, senza una scelta salvata: chi aveva acceso "Avvia con Windows" lo tiene,
 * chi l'aveva disattivato da Gestione attività resta spento, tutti gli altri partono con il gioco.
 */
export function initialStartMode(items: readonly LoginItem[]): StartMode {
  const ours = items[0];
  if (!ours) return "game";
  if (ours.enabled === false) return "off";
  return ours.args.includes(WAIT_GAME_ARG) ? "game" : "windows";
}

/** Gli eseguibili del gioco (demo, playtest, gioco completo): `OriginsTCGDemo.exe`, mai `UnityCrashHandler64.exe`. */
const GAME_EXE = /^"?(originstcg[a-z0-9_]*\.exe)"?\s*,/im;

/** Il gioco è aperto, dall'uscita di `tasklist /FO CSV /NH`. */
export function gameRunning(tasklistCsv: string): boolean {
  return tasklistCsv.split(/\r?\n/).some((line) => GAME_EXE.test(line));
}
