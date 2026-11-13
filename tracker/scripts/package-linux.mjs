// Versione per Linux (0.6.0, 13/11/2026; docs/tracker.md, "Linux"): un AppImage, un solo file che si apre senza
// installare niente e si aggiorna da sé (src/main/updater.ts). `npm run package:linux` dalla cartella tracker/, **solo su
// Linux**: lo fa GitHub Actions (.github/workflows/tracker-linux.yml), che a ogni release pubblicata aggiunge l'AppImage
// accanto allo zip di Windows. Su Windows mancano gli strumenti (squashfs, permessi dei file).
//
// Passi: build.mjs; @electron/packager per linux-x64 (preso con npx come in package.mjs, non è una dipendenza;
// eseguibile `originsmeta-tracker`, solo dist/ e package.json in asar, niente OCR: quello è di Windows); la cartella
// AppDir con il lanciatore (scripts/linux/AppRun: X11 e sandbox), la voce .desktop e l'icona; appimagetool con il
// runtime di AppImage, tutti e due a una versione fissa e controllati con l'impronta SHA-256.
//
// Uscite in out/: OriginsMeta-Tracker-linux-x86_64.AppImage (nome fisso: è quello che cercano l'aggiornamento
// automatico, LINUX_UPDATE_ASSET di updateRules.ts, e il download del sito) e la copia con la versione nel nome.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

if (process.platform !== "linux") throw new Error("l'AppImage si costruisce su Linux: lo fa GitHub Actions (.github/workflows/tracker-linux.yml)");

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const name = pkg.productName;
const version = pkg.version;
/** L'identità dell'app sui desktop Linux: DESKTOP_ID di src/main/linux.ts e desktopName di package.json. */
const ID = "com.originsmeta.tracker";
const EXE = "originsmeta-tracker";
if (pkg.desktopName !== `${ID}.desktop`) throw new Error(`desktopName di package.json diverso da ${ID}.desktop`);

const out = path.join(root, "out");
const folder = path.join(out, "package", `${name}-linux-x64`);
const appDir = path.join(out, "AppDir");
const stable = path.join(out, "OriginsMeta-Tracker-linux-x86_64.AppImage");
const versioned = path.join(out, `OriginsMeta-Tracker-${version}-linux-x86_64.AppImage`);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, stdio: "inherit", ...opts });

// gli strumenti di AppImage, a versione fissa (letti il 13/11/2026 dalle release su GitHub)
const TOOLS = [
  { file: "appimagetool-x86_64.AppImage", url: "https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-x86_64.AppImage", sha256: "ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0" },
  { file: "runtime-x86_64", url: "https://github.com/AppImage/type2-runtime/releases/download/20251108/runtime-x86_64", sha256: "2fca8b443c92510f1483a883f60061ad09b46b978b2631c807cd873a47ec260d" },
];

async function tool({ file, url, sha256 }) {
  const dir = path.join(out, "tools");
  const target = path.join(dir, file);
  const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
  if (!fs.existsSync(target) || hash(fs.readFileSync(target)) !== sha256) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${file}: download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (hash(buf) !== sha256) throw new Error(`${file}: impronta SHA-256 diversa da quella attesa`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, buf, { mode: 0o755 });
  }
  fs.chmodSync(target, 0o755);
  return target;
}

run("node", ["build.mjs"]);
run("npx", [
  "--yes",
  "@electron/packager@20.3.0",
  ".",
  name,
  "--platform=linux",
  "--arch=x64",
  "--out=out/package",
  "--overwrite",
  "--asar",
  `--executable-name=${EXE}`,
  `--app-version=${version}`,
  "--app-copyright=OriginsMeta, non affiliato a Koin Games",
  // solo dist/ e package.json: sorgenti, script, risorse di partenza e uscite restano fuori; l'OCR è di Windows
  "--ignore=^/(src|scripts|assets|out|tsconfig\\.json|build\\.mjs|README\\.md|\\.gitignore|dist/ocr)($|/)",
]);
if (!fs.existsSync(path.join(folder, EXE))) throw new Error(`manca ${EXE} nel pacchetto`);

// AppDir: l'app in usr/lib/originsmeta-tracker, il lanciatore, la voce .desktop e l'icona
fs.rmSync(appDir, { recursive: true, force: true });
const lib = path.join(appDir, "usr", "lib", EXE);
fs.mkdirSync(path.dirname(lib), { recursive: true });
run("cp", ["-a", folder, lib]);
// il lanciatore con i fine riga di Linux anche se il checkout li avesse cambiati
fs.writeFileSync(path.join(appDir, "AppRun"), fs.readFileSync(path.join(root, "scripts", "linux", "AppRun"), "utf8").replace(/\r\n/g, "\n"), { mode: 0o755 });
fs.chmodSync(path.join(appDir, "AppRun"), 0o755);
const desktop = [
  "[Desktop Entry]",
  "Type=Application",
  "Version=1.0",
  `Name=${name}`,
  "Comment=Records your Origins TCG matches. Unofficial fan project, not affiliated with Koin Games.",
  "Comment[it]=Registra le tue partite di Origins TCG. Progetto fan non ufficiale, non affiliato a Koin Games.",
  "Comment[es]=Registra tus partidas de Origins TCG. Proyecto fan no oficial, no afiliado a Koin Games.",
  `Exec=${EXE}`,
  `Icon=${ID}`,
  "Terminal=false",
  "Categories=Game;",
  `StartupWMClass=${ID}`,
  `X-AppImage-Version=${version}`,
  "",
].join("\n");
fs.writeFileSync(path.join(appDir, `${ID}.desktop`), desktop);
const icon = fs.readFileSync(path.join(root, "assets", "icon.png"));
fs.writeFileSync(path.join(appDir, `${ID}.png`), icon);
fs.writeFileSync(path.join(appDir, ".DirIcon"), icon);
const hicolor = path.join(appDir, "usr", "share", "icons", "hicolor", "256x256", "apps");
fs.mkdirSync(hicolor, { recursive: true });
fs.writeFileSync(path.join(hicolor, `${ID}.png`), icon);

// l'AppImage: appimagetool senza FUSE (--appimage-extract-and-run), con il runtime a versione fissa
const appimagetool = await tool(TOOLS[0]);
const runtime = await tool(TOOLS[1]);
fs.rmSync(stable, { force: true });
run(appimagetool, ["--appimage-extract-and-run", "--no-appstream", "--runtime-file", runtime, appDir, stable], { env: { ...process.env, ARCH: "x86_64" } });
fs.chmodSync(stable, 0o755);
fs.copyFileSync(stable, versioned);
fs.chmodSync(versioned, 0o755);

const head = Buffer.alloc(11);
const fd = fs.openSync(stable, "r");
fs.readSync(fd, head, 0, 11, 0);
fs.closeSync(fd);
// lo stesso controllo dell'aggiornamento automatico (isAppImage di updateRules.ts)
if (!(head[0] === 0x7f && head.subarray(1, 4).toString() === "ELF" && head[8] === 0x41 && head[9] === 0x49 && head[10] === 0x02)) throw new Error("il file prodotto non è un AppImage");
const size = fs.statSync(stable).size;
const sha = crypto.createHash("sha256").update(fs.readFileSync(stable)).digest("hex");
console.log(`\n${stable} (${Math.round(size / 1024 / 1024)} MB, sha256 ${sha})\n${versioned}`);
