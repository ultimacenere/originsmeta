/**
 * OCR del nome dell'avversario della schermata VS (14/10/2026, per riconoscere i bot: shared/botNames.ts).
 * Usa l'OCR di Windows (Windows.Media.Ocr, lo stesso del Cattura e annota), chiamato da PowerShell: nessuna dipendenza
 * nuova, niente rete. Il ritaglio PNG si scrive per un attimo nella cartella dei dati dell'app e si cancella subito dopo;
 * il testo letto torna al chiamante, che ne tiene solo "bot sì o no".
 *
 * Lingua: quella del profilo di Windows (`TryCreateFromUserProfileLanguages`). Senza un motore OCR (Windows senza
 * lingue OCR) il risultato è null e la partita si registra come prima. Le chiamate vanno una alla volta: PowerShell parte
 * in un secondo o due, e una schermata VS ne manda al massimo tre.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** Tetto del ritaglio: un PNG di 1200 × 160 px circa ne pesa una cinquantina di KB. */
export const MAX_NAME_PNG = 512 * 1024;
const TIMEOUT_MS = 20_000;

/** Un PNG vero e non troppo grande: l'unica cosa che la finestra nascosta può far scrivere per l'OCR. */
export function isNamePng(data: Uint8Array): boolean {
  return data.length > 8 && data.length <= MAX_NAME_PNG && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
}

const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation` + "`" + String.raw`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait() | Out-Null; $task.Result }
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) { exit 3 }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($env:OM_OCR_FILE)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
try {
  $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  foreach ($l in $res.Lines) { [Console]::WriteLine($l.Text) }
} finally { $stream.Dispose() }
`;
const ENCODED = Buffer.from(SCRIPT, "utf16le").toString("base64");

let chain: Promise<unknown> = Promise.resolve();
let counter = 0;

/** Il testo del ritaglio (righe separate da a capo), o null se l'OCR non c'è o non riesce. Mai salvato. */
export function readNameText(dir: string, png: Uint8Array): Promise<string | null> {
  if (process.platform !== "win32" || !isNamePng(png)) return Promise.resolve(null);
  const run = chain.then(() => ocrOnce(dir, png));
  chain = run.catch(() => null);
  return run;
}

function ocrOnce(dir: string, png: Uint8Array): Promise<string | null> {
  const file = path.join(dir, `vs-name-${process.pid}-${++counter}.png`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, png);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", ENCODED],
      { windowsHide: true, timeout: TIMEOUT_MS, env: { ...process.env, OM_OCR_FILE: file }, encoding: "utf8", maxBuffer: 64 * 1024 },
      (err, stdout) => {
        fs.rm(file, { force: true }, () => {});
        resolve(err ? null : String(stdout).trim());
      },
    );
  });
}
