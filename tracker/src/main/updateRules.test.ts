/** Test delle regole dell'aggiornamento automatico (updateRules.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { installScript, isNewer, parseVersion, pickRelease, trustedAssetUrl, UPDATE_ASSET } from "./updateRules";

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

test("script di installazione: aspetta l'app, copia, riapre", () => {
  const s = installScript({ pid: 4242, source: "C:\\Temp\\u\\app\\OriginsMeta Analytics-win32-x64", target: "C:\\Giochi\\OriginsMeta", exe: "C:\\Giochi\\OriginsMeta\\OriginsMeta Analytics.exe", log: "C:\\Temp\\u\\install.log" });
  assert.match(s, /Wait-Process -Id 4242 -Timeout 60/);
  assert.ok(!s.includes("|"), "niente pipe");
  assert.match(s, /robocopy "C:\\Temp\\u\\app\\OriginsMeta Analytics-win32-x64" "C:\\Giochi\\OriginsMeta" \/E/);
  assert.match(s, /start "" "C:\\Giochi\\OriginsMeta\\OriginsMeta Analytics.exe"/);
  assert.ok(s.includes("\r\n"), "fine riga di Windows");
  assert.ok(!installScript({ pid: 1, source: 'a"b', target: "c", exe: "d", log: "e" }).includes('a"b'), "niente virgolette dentro i percorsi");
});
