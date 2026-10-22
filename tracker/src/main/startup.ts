/**
 * Avvio automatico (16/10/2026, Pierluigi: "aggiungi avvio automatico con l'avvio del gioco ma senza aprire il builder,
 * solo icona vicino all'orologio… se il giocatore vuole aprire l'app e i layer se l'aprirà, a noi ci interessa il
 * tracking delle sue partite principalmente"). Funzioni pure, provate in startup.test.ts.
 *
 * Windows non sa avviare un programma quando ne parte un altro senza permessi da amministratore, quindi "con il gioco"
 * è una voce di "Esegui all'avvio" che lancia l'app con `--wait-game`: l'app aspetta in silenzio (niente icona, niente
 * finestre, nessuna lettura dei file del gioco) e controlla ogni 10 secondi se il gioco è aperto; quando lo vede parte
 * solo nella barra, accanto all'orologio, e registra le partite. Finestra dell'app e pannelli si aprono solo se il
 * giocatore apre l'app.
 *
 * Dalla 0.4.9 (22/10/2026, segnalazione di un giocatore: "il tracker si avvia alla partenza di Windows nonostante lui
 * voglia che parta all'avvio del gioco"; Pierluigi: "il tracker deve partire solo all'avvio del gioco") le scelte sono
 * due, "Con il gioco" e "Mai": "Con Windows" non c'è più. La 0.4.7 la teneva a chi aveva acceso il vecchio "Avvia con
 * Windows", e quei giocatori si ritrovavano l'app accesa nella barra a ogni avvio del PC. Ora la scelta salvata
 * "windows" vale "con il gioco" e la sua voce di avvio (senza `--wait-game`) si riscrive al primo avvio della 0.4.9
 * (`loginItemFix`), con lo stato acceso o spento che aveva in Gestione attività.
 */
import type { LoginItem } from "./appIdentity";

export type StartMode = "off" | "game";
export const START_MODES: readonly StartMode[] = ["game", "off"];
export const WAIT_GAME_ARG = "--wait-game";
/** Ogni quanto l'app in attesa guarda se il gioco è aperto. */
export const GAME_POLL_MS = 10_000;

/** Gli argomenti della voce di avvio (in sviluppo si aggiunge davanti la cartella dell'app). */
export function startArgs(): string[] {
  return ["--hidden", WAIT_GAME_ARG];
}

/** La scelta salvata in startup.json; "windows" (fino alla 0.4.8) vale "con il gioco". */
export function readStartMode(raw: unknown): StartMode | null {
  if (raw === "off") return "off";
  return raw === "game" || raw === "windows" ? "game" : null;
}

/**
 * La scelta al primo avvio senza una scelta salvata: chi aveva disattivato la voce da Gestione attività resta spento,
 * tutti gli altri partono con il gioco (anche chi aveva il vecchio "Avvia con Windows").
 */
export function initialStartMode(items: readonly LoginItem[]): StartMode {
  return items[0]?.enabled === false ? "off" : "game";
}

/**
 * La voce di avvio da riscrivere, o null se va bene: con "con il gioco" una voce senza `--wait-game` (il vecchio "Con
 * Windows") farebbe partire l'app con il PC. Si riscrive tenendo lo stato che ha in Gestione attività.
 */
export function loginItemFix(items: readonly LoginItem[], mode: StartMode): { enabled: boolean } | null {
  const ours = items[0];
  if (mode !== "game" || !ours || ours.args.includes(WAIT_GAME_ARG)) return null;
  return { enabled: ours.enabled !== false };
}

/** Gli eseguibili del gioco (demo, playtest, gioco completo): `OriginsTCGDemo.exe`, mai `UnityCrashHandler64.exe`. */
const GAME_EXE = /^"?(originstcg[a-z0-9_]*\.exe)"?\s*,/im;

/** Il gioco è aperto, dall'uscita di `tasklist /FO CSV /NH`. */
export function gameRunning(tasklistCsv: string): boolean {
  return tasklistCsv.split(/\r?\n/).some((line) => GAME_EXE.test(line));
}
