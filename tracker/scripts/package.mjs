// Versione portatile per Windows (01/10/2026, Pierluigi: "fammi un eseguibile rapido che lo condivido via wa a dav"):
// `npm run package` dalla cartella tracker/. Compila (build.mjs), impacchetta con @electron/packager (preso con npx,
// non è una dipendenza del progetto; Electron dalla cache di @electron/get, la stessa versione delle devDependencies),
// aggiunge LEGGIMI.txt e fa lo zip in out/OriginsMeta-Tracker-<versione>-win-x64.zip, più una copia con il nome fisso
// out/OriginsMeta-Tracker-win-x64.zip: è quella da caricare su GitHub Releases, perché il tasto di download della
// pagina dell'app (originsmeta.com/tracker dal 12/10/2026) punta a releases/latest/download/OriginsMeta-Tracker-win-x64.zip.
//
// Dalla 0.4.0 (12/10/2026) l'app si chiama OriginsMeta Tracker (src/main/appIdentity.ts). Le app 0.3.x si aggiornano
// solo con lo zip col nome di prima, out/OriginsMeta-Analytics-win-x64.zip (LEGACY_UPDATE_ASSET di updateRules.ts),
// che deve contenere "OriginsMeta Analytics.exe": è la stessa app con una copia dell'eseguibile col nome vecchio. Va
// caricato nella stessa release, accanto all'altro (almeno nella 0.4.0, che deve restare fra le ultime 20 release del
// repo: le app 0.3.x scelgono la più nuova che lo porta).
//
// Firma (21/10/2026, Pierluigi: certificato Certum da privato, chiave nel cloud SimplySign): dopo il packager l'exe si
// firma con signtool, prima di fare gli zip (la copia "OriginsMeta Analytics.exe" è lo stesso file, quindi firmata
// anch'essa). Serve SimplySign Desktop collegato: il certificato compare nell'archivio di Windows come una chiavetta.
// Il certificato si sceglie con SIGN_SUBJECT (nome intestatario, di base "Pierluigi Cella") o SIGN_THUMBPRINT
// (impronta SHA1, più sicura se ce ne sono due); signtool da SIGNTOOL o dal Windows SDK più recente. Senza firma il
// pacchetto si ferma: per uno zip non firmato di prova `npm run package -- --unsigned`. Anche firmata, SmartScreen
// mostra l'avviso finché il file non si fa una reputazione (qualche settimana di download).
// Dentro il pacchetto solo dist/ e package.json (asar): niente sorgenti.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const name = pkg.productName;
const version = pkg.version;
const out = path.join(root, "out");
const folder = path.join(out, "package", `${name}-win32-x64`);
const zip = path.join(out, `OriginsMeta-Tracker-${version}-win-x64.zip`);
const stableZip = path.join(out, "OriginsMeta-Tracker-win-x64.zip");
// per le app 0.3.x (vedi sopra): nome dello zip e dell'eseguibile di allora
const legacyZip = path.join(out, "OriginsMeta-Analytics-win-x64.zip");
const legacyExe = "OriginsMeta Analytics.exe";
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
const unsigned = process.argv.includes("--unsigned");
const timestampUrl = "http://time.certum.pl";

// signtool.exe: SIGNTOOL, altrimenti il Windows SDK più recente (Windows Kits\10\bin\<versione>\x64)
function findSigntool() {
  if (process.env.SIGNTOOL) return process.env.SIGNTOOL;
  const kits = path.join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Windows Kits", "10", "bin");
  const versions = fs.existsSync(kits) ? fs.readdirSync(kits).filter((v) => /^10\./.test(v)) : [];
  versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).reverse();
  for (const v of versions) {
    const exe = path.join(kits, v, "x64", "signtool.exe");
    if (fs.existsSync(exe)) return exe;
  }
  throw new Error(
    'signtool.exe non trovato: installa "Windows SDK Signing Tools" (Windows SDK) o indica il percorso in SIGNTOOL.\n' +
      "Per uno zip non firmato di prova: npm run package -- --unsigned",
  );
}

function sign(file) {
  const signtool = findSigntool();
  const cert = process.env.SIGN_THUMBPRINT
    ? ["/sha1", process.env.SIGN_THUMBPRINT.replace(/\s/g, "")]
    : ["/n", process.env.SIGN_SUBJECT ?? "Pierluigi Cella"];
  try {
    execFileSync(signtool, ["sign", ...cert, "/fd", "sha256", "/tr", timestampUrl, "/td", "sha256", "/d", name, file], { stdio: "inherit" });
    execFileSync(signtool, ["verify", "/pa", file], { stdio: "inherit" });
  } catch {
    throw new Error(
      `Firma di ${path.basename(file)} non riuscita: SimplySign Desktop è collegato (codice dall'app sul telefono)? ` +
        "Il nome in SIGN_SUBJECT o l'impronta in SIGN_THUMBPRINT corrispondono al certificato?",
    );
  }
}

// via gli zip di prima: se la firma fallisce non deve restare in out/ uno zip vecchio (magari non firmato) da caricare
for (const f of [zip, stableZip, legacyZip]) fs.rmSync(f, { force: true });
run("node", ["build.mjs"]);
run("npx", [
  "--yes",
  "@electron/packager@20.3.0",
  ".",
  `"${name}"`,
  "--platform=win32",
  "--arch=x64",
  "--out=out/package",
  "--overwrite",
  "--asar",
  "--icon=assets/icon.ico",
  `--app-version=${version}`,
  '--app-copyright="OriginsMeta, non affiliato a Koin Games"',
  '--win32metadata.CompanyName="OriginsMeta"',
  `--win32metadata.FileDescription="${name}"`,
  `--win32metadata.ProductName="${name}"`,
  // solo dist/ e package.json: sorgenti, script, risorse di partenza e uscite restano fuori
  '--ignore="^/(src|scripts|assets|out|tsconfig\\.json|build\\.mjs|README\\.md|\\.gitignore)($|/)"',
]);

if (!unsigned) sign(path.join(folder, `${name}.exe`));

const readme = `${name} ${version}${unsigned ? " (versione di prova, non firmata)" : ""}

1. Scompatta lo zip in una cartella, per esempio Documenti\\${name}.
2. Apri "${name}.exe". Windows può dire "Windows ha protetto il PC": premi "Ulteriori informazioni"
   e poi "Esegui comunque"${unsigned ? " (l'app non è ancora firmata)" : " (l'app è firmata: l'avviso sparisce man mano che Windows la conosce)"}.
3. L'app si apre e mette un'icona accanto all'orologio: mentre giochi a Origins TCG registra da sola le partite,
   15 secondi dopo la fine. Per chiuderla: il tasto "Chiudi l'app" in alto, la X della finestra o "Esci" dal menu
   dell'icona (si chiudono anche overlay e pannelli). Dalla 0.3.2 l'app si aggiorna da sola quando esce una versione
   nuova: la scarica e si riavvia aggiornata appena non sei in partita.
4. L'app funziona solo collegata a un account OriginsMeta (gratuito): finché non la colleghi non legge il gioco e non
   registra niente. Crea un account o accedi su https://originsmeta.com, poi su
   https://originsmeta.com/it/account/tracker premi "Crea un codice"; nell'app scrivi il codice e premi "Collega".
   Le partite vanno al tuo account ed entrano anche nelle statistiche anonime del sito (win rate). L'app ricontrolla
   il collegamento ogni tanto: senza internet continua a funzionare per 7 giorni.
5. Overlay, Deck tracker e carte dell'avversario: nel pannello "Overlay" dell'app, "Mostra sopra il gioco",
   "Mostra il deck tracker" e "Mostra le carte dell'avversario" (si vedono sopra il gioco in modalità finestra o
   finestra senza bordi, oppure su un secondo schermo). Per OBS copia gli
   indirizzi della sorgente Browser che trovi nello stesso pannello.
6. Scanner dello schermo (acceso): dalla patch 0.7 il gioco non salva più i replay, quindi l'app legge le carte giocate
   dalla finestra di Origins TCG. Guarda solo quella finestra, le immagini restano sul PC e al sito arrivano solo gli id
   delle carte, mai i nomi dei giocatori. Si spegne dal riquadro "Scanner dello schermo" o dal menu dell'icona.
7. Funziona con la demo e con il playtest di Steam: sul playtest l'esito delle partite online e classificate lo legge
   dallo schermo di fine partita, quindi lascia lo scanner acceso.

Guida passo per passo: https://originsmeta.com/it/tracker#installazione
L'app legge i file che il gioco salva sul PC e, con lo scanner acceso, la finestra del gioco: non tocca mai il gioco.
OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.
`;
fs.writeFileSync(path.join(folder, "LEGGIMI.txt"), readme.split("\n").join("\r\n"));

fs.rmSync(zip, { force: true });
// lo zip con il tar di Windows (bsdtar, -a sceglie il formato dall'estensione); altrimenti Compress-Archive
const bsdtar = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
if (fs.existsSync(bsdtar)) execFileSync(bsdtar, ["-a", "-c", "-f", zip, "-C", path.dirname(folder), path.basename(folder)], { stdio: "inherit" });
else run("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${folder}' -DestinationPath '${zip}'`]);
fs.copyFileSync(zip, stableZip);

// lo zip per le app 0.3.x: la stessa cartella con una copia dell'eseguibile col nome di allora (il loro aggiornamento
// cerca "OriginsMeta Analytics.exe" nello zip e riapre quello; il codice è lo stesso, dentro resources/app.asar)
const exe = path.join(folder, `${name}.exe`);
const legacyCopy = path.join(folder, legacyExe);
fs.copyFileSync(exe, legacyCopy);
fs.rmSync(legacyZip, { force: true });
try {
  if (fs.existsSync(bsdtar)) execFileSync(bsdtar, ["-a", "-c", "-f", legacyZip, "-C", path.dirname(folder), path.basename(folder)], { stdio: "inherit" });
  else run("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${folder}' -DestinationPath '${legacyZip}'`]);
} finally {
  fs.rmSync(legacyCopy, { force: true });
}
console.log(unsigned ? "\nATTENZIONE: pacchetto NON firmato (--unsigned), non da pubblicare" : "\nexe firmato e verificato");
console.log(`\n${zip} (${Math.round(fs.statSync(zip).size / 1024 / 1024)} MB)\n${stableZip} (per GitHub Releases)\n${legacyZip} (per GitHub Releases, stessa release: aggiornamento delle app 0.3.x)`);
