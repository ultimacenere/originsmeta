/**
 * OCR dei ritagli della schermata VS: il nome dell'avversario (14/10/2026, per riconoscere i bot: shared/botNames.ts)
 * e la zona sopra il mio ritratto (22/10/2026, lega = classificata). Usa l'OCR di Windows (Windows.Media.Ocr, lo stesso
 * del Cattura e annota) attraverso `originsmeta-tracker-ocr.exe`, un programma nostro di una trentina di KB
 * (src/ocr/OcrHelper.cs, compilato da build.mjs con il csc.exe che c'è in ogni Windows): il PNG gli arriva dallo
 * standard input e il testo torna dallo standard output. Niente file sul disco, niente rete, nessuna dipendenza nuova;
 * il testo letto torna al chiamante, che ne tiene solo "bot sì o no" e "lega sì o no".
 *
 * 03/11/2026: fino alla 0.5.0 l'OCR passava da PowerShell con "-ExecutionPolicy Bypass -EncodedCommand", la riga di
 * comando dei programmi malevoli. Norton la bloccava ("IDP.HELU.PSE96 - Command Line Detection") e diceva che l'app era
 * infetta, e a chi lo usa le partite non si registravano. L'app non lancia più PowerShell (test in ocr.test.ts); il
 * TextDetector di Chromium, che userebbe lo stesso OCR, in Electron non è implementato (riprovato il 03/11 con la 44).
 *
 * Lingua: quella del profilo di Windows (`TryCreateFromUserProfileLanguages`). Senza lingue OCR (uscita 3) o senza il
 * programma il risultato è null e la partita si registra come prima. Le chiamate vanno una alla volta; dopo
 * `MAX_FAILURES` errori di fila (un antivirus che blocca il programma, per esempio) l'OCR si ferma fino al riavvio
 * dell'app, così un avviso non si ripete a ogni schermata VS.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** Tetto del ritaglio: un PNG di 1200 × 160 px circa ne pesa una cinquantina di KB (lo stesso in OcrHelper.cs). */
export const MAX_NAME_PNG = 512 * 1024;
export const OCR_EXE = "originsmeta-tracker-ocr.exe";
/** Errori di fila dopo i quali l'OCR si ferma fino al riavvio dell'app. */
export const MAX_FAILURES = 3;
/** Uscita del programma quando Windows non ha lingue OCR: non cambia fino al riavvio, quindi ci si ferma subito. */
const NO_OCR_LANGUAGE = 3;
const TIMEOUT_MS = 20_000;

/** Un PNG vero e non troppo grande: l'unica cosa che la finestra nascosta può far leggere all'OCR. */
export function isNamePng(data: Uint8Array): boolean {
  return data.length > 8 && data.length <= MAX_NAME_PNG && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
}

/** Dove cercare il programma: accanto ad app.asar nell'app impacchettata (package.mjs, `--extra-resource`), poi dist/ocr (sviluppo). */
export function ocrExeCandidates(resourcesPath: string | undefined, dir: string): string[] {
  return [...(resourcesPath ? [path.join(resourcesPath, OCR_EXE)] : []), path.join(dir, "ocr", OCR_EXE)];
}

let found: string | null | undefined;

/** Il programma dell'OCR di questa app, o null se manca. */
export function ocrExe(): string | null {
  if (found === undefined) found = ocrExeCandidates(process.resourcesPath, __dirname).find((p) => fs.existsSync(p)) ?? null;
  return found;
}

let chain: Promise<unknown> = Promise.resolve();
let failures = 0;
let stopped = false;

/** Il testo del ritaglio (righe separate da a capo), o null se l'OCR non c'è o non riesce. Mai salvato. */
export function readNameText(png: Uint8Array, exe: string | null = ocrExe()): Promise<string | null> {
  if (process.platform !== "win32" || stopped || !exe || !isNamePng(png)) return Promise.resolve(null);
  const run = chain.then(() => ocrOnce(exe, png));
  chain = run.catch(() => null);
  return run;
}

function ocrOnce(exe: string, png: Uint8Array): Promise<string | null> {
  if (stopped) return Promise.resolve(null);
  return new Promise((resolve) => {
    const child = execFile(exe, [], { windowsHide: true, timeout: TIMEOUT_MS, encoding: "utf8", maxBuffer: 64 * 1024 }, (err, stdout) => {
      if (!err) failures = 0;
      else if (err.code === NO_OCR_LANGUAGE || ++failures >= MAX_FAILURES) stopped = true;
      resolve(err ? null : String(stdout).trim());
    });
    // se il programma esce prima di leggere (o non parte) la scrittura fallisce: conta l'esito qui sopra
    child.stdin?.on("error", () => {});
    child.stdin?.end(Buffer.from(png));
  });
}
