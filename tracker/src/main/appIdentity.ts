/**
 * Nome dell'app, cartella dei dati ed eseguibile (0.4.0, 12/10/2026; docs/tracker.md, "Nome: OriginsMeta Tracker").
 *
 * Pierluigi, 12/10/2026: "l'app si chiama OriginsMeta Tracker" ("Analytics" diventa il nome della pagina delle
 * statistiche sul sito, originsmeta.com/analytics; la pagina dell'app passa a originsmeta.com/tracker). Dal 01/10 al
 * 12/10/2026 l'app si chiamava OriginsMeta Analytics, e prima ancora OriginsMeta Tracker.
 *
 * Cambia solo il nome visibile. Restano fissi, perché un cambio farebbe perdere qualcosa a chi ha già l'app:
 * - la cartella dei dati `%APPDATA%\OriginsMeta Analytics` (`DATA_FOLDER`): Electron la ricaverebbe dal nome nuovo
 *   (`%APPDATA%\OriginsMeta Tracker`, che è anche la cartella di prima del 01/10 e può avere dati vecchi), e la chiave
 *   di safeStorage sta nel suo `Local State`: il 01/10 il cambio di cartella aveva reso illeggibile il token;
 * - l'AppUserModelId `com.originsmeta.analytics`: è anche il nome del valore che "Avvia con Windows" scrive nel
 *   registro (chiave Run), quindi la voce di avvio resta una sola;
 * - il prefisso delle release su GitHub `analytics-v` e lo zip con il nome di prima (`LEGACY_UPDATE_ASSET`), che le
 *   app 0.3.x cercano per aggiornarsi (updateRules.ts).
 *
 * Funzioni pure: i test girano senza Electron (appIdentity.test.ts).
 */
import path from "node:path";

export const APP_NAME = "OriginsMeta Tracker";
export const EXE_NAME = `${APP_NAME}.exe`;
/** L'eseguibile dal 01/10 al 12/10/2026 (0.2.0–0.3.7): resta nelle cartelle di chi aggiorna, con il codice nuovo. */
export const LEGACY_EXE_NAME = "OriginsMeta Analytics.exe";
export const APP_USER_MODEL_ID = "com.originsmeta.analytics";

/** La cartella dei dati, fissa (vedi sopra). */
export const DATA_FOLDER = "OriginsMeta Analytics";
/** La cartella di prima del 01/10/2026: `moveOldData` di main.ts ne copia i dati se quella nuova è vuota. */
export const OLD_DATA_FOLDER = "OriginsMeta Tracker";

/** La cartella dei dati: `ORIGINSMETA_TRACKER_DATA` per le prove, altrimenti `<AppData>\OriginsMeta Analytics`. */
export function dataDir(appData: string, override?: string | null): string {
  return override ? override : path.join(appData, DATA_FOLDER);
}

const sameFile = (a: string, b: string) => path.win32.normalize(a).toLowerCase() === path.win32.normalize(b).toLowerCase();
const ourExe = (p: string) => [EXE_NAME, LEGACY_EXE_NAME].some((n) => path.win32.basename(p).toLowerCase() === n.toLowerCase());

export type LoginItem = { path: string; args: string[]; enabled?: boolean };

/**
 * "Avvia con Windows" dopo il cambio di eseguibile: la voce di avvio che punta a un altro nostro eseguibile
 * (`OriginsMeta Analytics.exe`, o lo stesso in un'altra cartella), da sostituire con quello che gira adesso. Null se la
 * voce di adesso c'è già o se il giocatore non l'aveva mai accesa.
 */
export function staleLoginItem(items: readonly LoginItem[], execPath: string): LoginItem | null {
  if (items.some((i) => sameFile(i.path, execPath))) return null;
  return items.find((i) => ourExe(i.path)) ?? null;
}

/** L'eseguibile da riaprire dopo un aggiornamento: quello col nome nuovo se lo zip lo porta, altrimenti quello di adesso. */
export function exeAfterUpdate(target: string, zipHasNewExe: boolean, execPath: string): string {
  return zipHasNewExe ? path.win32.join(target, EXE_NAME) : execPath;
}
