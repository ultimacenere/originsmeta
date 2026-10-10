// Versione portatile per Windows (01/10/2026, Pierluigi: "fammi un eseguibile rapido che lo condivido via wa a dav"):
// `npm run package` dalla cartella tracker/. Compila (build.mjs), impacchetta con @electron/packager (preso con npx,
// non è una dipendenza del progetto; Electron dalla cache di @electron/get, la stessa versione delle devDependencies),
// aggiunge LEGGIMI.txt e fa lo zip in out/OriginsMeta-Analytics-<versione>-win-x64.zip.
//
// Non firmata (Fase 5: certificato o Microsoft Store): Windows mostra "Windows ha protetto il PC" e si apre con
// "Ulteriori informazioni" → "Esegui comunque". Dentro il pacchetto solo dist/ e package.json (asar): niente sorgenti.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const name = pkg.productName;
const version = pkg.version;
const out = path.join(root, "out");
const folder = path.join(out, "package", `${name}-win32-x64`);
const zip = path.join(out, `OriginsMeta-Analytics-${version}-win-x64.zip`);
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

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

const readme = `${name} ${version} (versione di prova, non firmata)

1. Scompatta lo zip in una cartella, per esempio Documenti\\${name}.
2. Apri "${name}.exe". Windows può dire "Windows ha protetto il PC": premi "Ulteriori informazioni"
   e poi "Esegui comunque" (l'app non è ancora firmata).
3. L'app resta nell'area di notifica, accanto all'orologio: mentre giochi a Origins TCG registra da sola le partite.
   La X della finestra chiude l'app (anche overlay e Deck tracker); se parte con Windows resta nell'icona: per
   uscire, tasto destro sull'icona e "Esci".
4. Per mandare le partite al tuo account OriginsMeta: su https://originsmeta.com/it/account/tracker (con l'accesso
   fatto) premi "Crea un codice"; nell'app apri "Account OriginsMeta", scrivi il codice e premi "Collega".
   Collegandola, le partite entrano anche nelle statistiche anonime del sito (win rate).
5. Overlay: nel pannello "Overlay" dell'app, "Mostra sopra il gioco" (gioco in finestra o finestra senza bordi).
   Per OBS copia l'indirizzo della sorgente Browser che trovi nello stesso pannello.

Con la patch 0.7 il gioco non salva i replay: per ora l'app registra esito, ora e mazzo, non le carte giocate.
L'app legge solo i file che il gioco salva sul PC e non tocca mai il gioco.
OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.
`;
fs.writeFileSync(path.join(folder, "LEGGIMI.txt"), readme.split("\n").join("\r\n"));

fs.rmSync(zip, { force: true });
// lo zip con il tar di Windows (bsdtar, -a sceglie il formato dall'estensione); altrimenti Compress-Archive
const bsdtar = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
if (fs.existsSync(bsdtar)) execFileSync(bsdtar, ["-a", "-c", "-f", zip, "-C", path.dirname(folder), path.basename(folder)], { stdio: "inherit" });
else run("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${folder}' -DestinationPath '${zip}'`]);
console.log(`\n${zip} (${Math.round(fs.statSync(zip).size / 1024 / 1024)} MB)`);
