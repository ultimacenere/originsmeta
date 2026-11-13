/** Test delle regole dell'aggiornamento automatico (updateRules.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installScript, isAppImage, isNewer, justUpdated, launcherScript, LINUX_UPDATE_ASSET, parseVersion, pickRelease, relaunchCommand, trustedAssetUrl, updateAssetFor, updateNotice, UPDATE_ASSET } from "./updateRules";

const url = (v: string) => `https://github.com/ultimacenere/originsmeta/releases/download/analytics-v${v}/${UPDATE_ASSET}`;
const release = (v: string, over: Record<string, unknown> = {}, asset: Record<string, unknown> = {}) => ({
  tag_name: `analytics-v${v}`,
  draft: false,
  prerelease: false,
  assets: [{ name: UPDATE_ASSET, size: 158_606_719, state: "uploaded", browser_download_url: url(v), ...asset }],
  ...over,
});

test("versioni: confronto numerico, non alfabetico", () => {
  assert.deepEqual(parseVersion("0.3.10"), [0, 3, 10]);
  assert.equal(parseVersion("v0.3.1"), null);
  assert.equal(isNewer("0.3.10", "0.3.9"), true);
  assert.equal(isNewer("0.3.1", "0.3.1"), false);
  assert.equal(isNewer("0.2.9", "0.3.0"), false);
  assert.equal(isNewer("1.0.0", "0.9.9"), true);
  assert.equal(isNewer("boh", "0.1.0"), false);
});

test("la release giusta: la più nuova dell'app, pubblicata, con lo zip dal nome fisso del nostro repo", () => {
  const list = [release("0.3.0"), release("0.3.2"), release("0.3.1"), release("9.9.9", { draft: true }), release("8.0.0", { prerelease: true }), { tag_name: "sito-v2.0.0", draft: false, prerelease: false, assets: [] }];
  assert.deepEqual(pickRelease(list), { version: "0.3.2", url: url("0.3.2"), size: 158_606_719 });
  assert.equal(pickRelease(null), null);
  assert.equal(pickRelease([release("1.0.0", {}, { name: "altro.zip" })]), null, "zip con un altro nome");
  assert.equal(pickRelease([release("1.0.0", {}, { browser_download_url: "https://evil.example/OriginsMeta-Analytics-win-x64.zip" })]), null, "indirizzo fuori da GitHub");
  assert.equal(pickRelease([release("1.0.0", {}, { browser_download_url: url("0.9.0") })]), null, "zip di un'altra versione");
  assert.equal(pickRelease([release("1.0.0", {}, { state: "starter" })]), null, "caricamento non finito");
  assert.equal(pickRelease([release("1.0.0", {}, { size: 12 })]), null, "dimensione assurda");
  assert.equal(trustedAssetUrl(url("0.3.1"), "0.3.1"), true);
});

test("Linux (0.6.0): l'AppImage dal nome fisso nella stessa release; una release ancora senza AppImage si salta", () => {
  const linuxUrl = (v: string) => `https://github.com/ultimacenere/originsmeta/releases/download/analytics-v${v}/${LINUX_UPDATE_ASSET}`;
  const appImage = (v: string) => ({ name: LINUX_UPDATE_ASSET, size: 121_000_000, state: "uploaded", browser_download_url: linuxUrl(v) });
  const both = (v: string, withLinux = true) => {
    const r = release(v);
    return { ...r, assets: withLinux ? [...r.assets, appImage(v)] : r.assets };
  };
  // la 0.6.1 appena pubblicata, con lo zip di Windows ma prima che GitHub Actions aggiunga l'AppImage
  const list = [both("0.6.0"), both("0.6.1", false)];
  assert.deepEqual(pickRelease(list, LINUX_UPDATE_ASSET), { version: "0.6.0", url: linuxUrl("0.6.0"), size: 121_000_000 });
  assert.equal(pickRelease(list)?.version, "0.6.1", "Windows prende la più nuova con lo zip");
  assert.equal(pickRelease([{ ...release("0.6.0"), assets: [{ ...appImage("0.6.0"), browser_download_url: url("0.6.0") }] }], LINUX_UPDATE_ASSET), null, "indirizzo di un altro file");
  assert.equal(trustedAssetUrl(linuxUrl("0.6.0"), "0.6.0", LINUX_UPDATE_ASSET), true);
  assert.equal(updateAssetFor("linux"), LINUX_UPDATE_ASSET);
  assert.equal(updateAssetFor("win32"), UPDATE_ASSET);
});

test("Linux: un AppImage vero si riconosce dai primi byte", () => {
  assert.equal(isAppImage(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0x41, 0x49, 0x02, 0, 0, 0, 0, 0])), true);
  assert.equal(isAppImage(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])), false, "un programma qualunque");
  assert.equal(isAppImage(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0x41, 0x49, 0x02])), false, "uno zip");
  assert.equal(isAppImage(new Uint8Array(0)), false);
});

test("Linux: la riapertura aspetta la chiusura dell'app; pid e percorso come argomenti, mai dentro lo script", () => {
  const file = "/home/gio/Giochi e app/$x\"y.AppImage";
  const cmd = relaunchCommand(4242.7, file);
  assert.deepEqual(cmd.slice(0, 2), ["/bin/sh", "-c"]);
  assert.ok(!cmd[2].includes("4242") && !cmd[2].includes("AppImage"), "niente dati dentro lo script");
  assert.match(cmd[2], /kill -0 "\$1"/);
  assert.match(cmd[2], /exec "\$2"$/);
  assert.deepEqual(cmd.slice(4), ["4242", file]);
});

test("Linux: la riapertura parte davvero solo dopo la fine del processo", { skip: process.platform !== "linux" }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "om-relaunch-"));
  try {
    const marker = path.join(dir, "riaperta");
    const fake = path.join(dir, "Finto Tracker.AppImage");
    fs.writeFileSync(fake, `#!/bin/sh\necho "$(date +%s%N)" > "${marker}"\n`, { mode: 0o755 });
    const t0 = Date.now();
    const app = spawn("sleep", ["1"]);
    const ended = new Promise<void>((resolve) => app.on("exit", () => resolve()));
    const [cmd, ...args] = relaunchCommand(app.pid!, fake);
    spawn(cmd, args, { stdio: "ignore" });
    await ended;
    for (let i = 0; i < 40 && !fs.existsSync(marker); i++) await new Promise((r) => setTimeout(r, 100));
    assert.ok(fs.existsSync(marker), "l'AppImage è stato riaperto");
    const startedAt = Number(fs.readFileSync(marker, "utf8").trim()) / 1e6;
    assert.ok(startedAt - t0 >= 900, "riaperto dopo la chiusura dell'app, non mentre girava");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("lanciatore dello script: cmd con la finestra nascosta, percorsi con spazi (11/10/2026 sera)", () => {
  const v = launcherScript("C:\\Users\\Mario Rossi\\AppData\\Local\\Temp\\u\\install.cmd");
  assert.equal(v, 'CreateObject("WScript.Shell").Run "cmd.exe /d /c """"C:\\Users\\Mario Rossi\\AppData\\Local\\Temp\\u\\install.cmd""""", 0, False\r\n');
  assert.ok(!launcherScript('C:\\a"b\\install.cmd').includes('a"b'), "niente virgolette dentro il percorso");
});

test("script di installazione: aspetta l'app, copia, riapre", () => {
  const s = installScript({ pid: 4242, source: "C:\\Temp\\u\\app\\OriginsMeta Analytics-win32-x64", target: "C:\\Giochi\\OriginsMeta", exe: "C:\\Giochi\\OriginsMeta\\OriginsMeta Analytics.exe", log: "C:\\Temp\\u\\install.log" });
  // dalla 0.5.1 (03/11/2026) niente PowerShell: tasklist in un file accanto al log, find, al massimo 60 giri
  assert.ok(!/powershell|wait-process/i.test(s), "niente PowerShell");
  assert.ok(s.includes('"%SystemRoot%\\System32\\tasklist.exe" /FI "PID eq 4242" /FO CSV /NH > "C:\\Temp\\u\\processi.txt"'), "tasklist in un file");
  assert.ok(s.includes('"%SystemRoot%\\System32\\find.exe" ",""4242""," "C:\\Temp\\u\\processi.txt"'), "find sul file");
  assert.match(s, /if errorlevel 1 goto copia\r\n/);
  assert.match(s, /if %n% geq 60 goto copia\r\n/);
  assert.ok(s.indexOf(":copia") < s.indexOf("robocopy"), "copia dopo l'attesa");
  assert.ok(!s.includes("|"), "niente pipe");
  assert.match(s, /robocopy "C:\\Temp\\u\\app\\OriginsMeta Analytics-win32-x64" "C:\\Giochi\\OriginsMeta" \/E/);
  assert.match(s, /start "" "C:\\Giochi\\OriginsMeta\\OriginsMeta Analytics.exe"/);
  assert.ok(s.includes("\r\n"), "fine riga di Windows");
  assert.ok(!installScript({ pid: 1, source: 'a"b', target: "c", exe: "d", log: "e" }).includes('a"b'), "niente virgolette dentro i percorsi");
});

test("avvisi dell'aggiornamento: tre lingue, la versione nel testo, \"aggiornata\" solo dopo un aggiornamento (13/10/2026)", () => {
  for (const lang of ["en", "it", "es"] as const)
    for (const kind of ["found", "close", "done"] as const) {
      const n = updateNotice(lang, kind, "0.4.2");
      assert.ok(n.title && n.content.includes("0.4.2") && !n.content.includes("{v}"), `${lang} ${kind}`);
      // Windows taglia i fumetti lunghi: restano sotto i 200 caratteri
      assert.ok(n.content.length <= 200, `${lang} ${kind} troppo lungo`);
    }
  assert.match(updateNotice("it", "found", "0.4.2").content, /tieni chiuso Origins TCG/);
  assert.equal(justUpdated("0.4.1", "0.4.2"), true);
  assert.equal(justUpdated("0.4.2", "0.4.2"), false);
  assert.equal(justUpdated(null, "0.4.2"), false);
  assert.equal(justUpdated("0.5.0", "0.4.2"), false);
});
