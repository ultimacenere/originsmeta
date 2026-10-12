/**
 * Test del cambio di nome in OriginsMeta Tracker (0.4.0, 12/10/2026; appIdentity.ts): cartella dei dati fissa, voce di
 * "Avvia con Windows", eseguibile da riaprire dopo un aggiornamento, zip delle release. `npm test` nella cartella tracker/.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { APP_NAME, APP_USER_MODEL_ID, DATA_FOLDER, EXE_NAME, LEGACY_EXE_NAME, OLD_DATA_FOLDER, dataDir, exeAfterUpdate, staleLoginItem } from "./appIdentity";
import { LEGACY_UPDATE_ASSET, UPDATE_ASSET, UPDATE_TAG_PREFIX } from "./updateRules";

const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "..", "package.json"), "utf8")) as { productName: string };
const APPDATA = "C:\\Users\\Pier\\AppData\\Roaming";

test("il nome visibile è OriginsMeta Tracker, la cartella dei dati resta OriginsMeta Analytics", () => {
  assert.equal(pkg.productName, APP_NAME, "il nome del pacchetto (eseguibile, finestre) è quello di appIdentity");
  assert.equal(APP_NAME, "OriginsMeta Tracker");
  assert.equal(DATA_FOLDER, "OriginsMeta Analytics");
  // Electron ricaverebbe la cartella dal nome del pacchetto: dataDir non ne dipende
  assert.notEqual(DATA_FOLDER, pkg.productName);
  assert.equal(dataDir(APPDATA), path.join(APPDATA, "OriginsMeta Analytics"));
  assert.equal(dataDir(APPDATA, ""), path.join(APPDATA, "OriginsMeta Analytics"));
  assert.equal(dataDir(APPDATA, "D:\\prove\\dati"), "D:\\prove\\dati", "ORIGINSMETA_TRACKER_DATA per le prove");
  // la cartella di prima del 01/10 da cui moveOldData copia: mai quella dei dati
  assert.equal(OLD_DATA_FOLDER, "OriginsMeta Tracker");
  assert.notEqual(OLD_DATA_FOLDER, DATA_FOLDER);
  // il nome della voce di avvio nel registro e il prefisso delle release non cambiano
  assert.equal(APP_USER_MODEL_ID, "com.originsmeta.analytics");
  assert.equal(UPDATE_TAG_PREFIX, "analytics-v");
});

test("zip delle release: quello nuovo e quello per le app 0.3.x", () => {
  assert.equal(UPDATE_ASSET, "OriginsMeta-Tracker-win-x64.zip");
  assert.equal(LEGACY_UPDATE_ASSET, "OriginsMeta-Analytics-win-x64.zip");
  const script = fs.readFileSync(path.join(import.meta.dirname, "..", "..", "scripts", "package.mjs"), "utf8");
  for (const name of [UPDATE_ASSET, LEGACY_UPDATE_ASSET, LEGACY_EXE_NAME]) assert.ok(script.includes(name), `npm run package fa ${name}`);
});

test("Avvia con Windows: la voce del vecchio eseguibile passa a quello di adesso, una volta sola", () => {
  const now = "C:\\Giochi\\OriginsMeta Analytics-win32-x64\\OriginsMeta Tracker.exe";
  const old = { path: "C:\\Giochi\\OriginsMeta Analytics-win32-x64\\OriginsMeta Analytics.exe", args: ["--hidden"], enabled: true };
  assert.deepEqual(staleLoginItem([old], now), old);
  // già quella giusta (anche con maiuscole diverse): niente da fare
  assert.equal(staleLoginItem([{ path: now.toUpperCase(), args: ["--hidden"] }], now), null);
  assert.equal(staleLoginItem([old, { path: now, args: ["--hidden"] }], now), null);
  // mai accesa: niente
  assert.equal(staleLoginItem([], now), null);
  // l'app spostata in un'altra cartella
  const moved = { path: "D:\\Vecchia\\OriginsMeta Tracker.exe", args: ["--hidden"] };
  assert.deepEqual(staleLoginItem([moved], now), moved);
  // voci di altri programmi: mai toccate
  assert.equal(staleLoginItem([{ path: "C:\\Programmi\\Discord\\Update.exe", args: [] }], now), null);
  assert.equal(EXE_NAME, "OriginsMeta Tracker.exe");
});

test("dopo un aggiornamento si riapre l'eseguibile col nome nuovo se lo zip lo porta", () => {
  const target = "C:\\Giochi\\OriginsMeta Analytics-win32-x64";
  const current = `${target}\\OriginsMeta Analytics.exe`;
  assert.equal(exeAfterUpdate(target, true, current), `${target}\\OriginsMeta Tracker.exe`);
  assert.equal(exeAfterUpdate(target, false, current), current);
});
