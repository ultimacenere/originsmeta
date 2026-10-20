// Controlli sulla configurazione dell'app (npm test dalla cartella mobile/; i test Java di SiteLinks li lancia Gradle).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { centered, splitLogo } from "./icons.mjs";

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(mobile, "..");
const read = (p) => readFileSync(path.join(mobile, p), "utf8");
const config = JSON.parse(read("capacitor.config.json"));
const pkg = JSON.parse(read("package.json"));

test("l'app carica originsmeta.com in https, con la pagina offline locale", () => {
  assert.equal(config.server.url, "https://originsmeta.com");
  assert.equal(config.server.cleartext, undefined);
  assert.equal(config.android.allowMixedContent, false);
  assert.ok(existsSync(path.join(mobile, "www", config.server.errorPath)), "manca la pagina offline");
  assert.ok(existsSync(path.join(mobile, "www/index.html")));
});

test("nell'app si naviga solo sul sito, su Supabase (accesso) e su Discord (accesso con Discord)", () => {
  const supabase = readFileSync(path.join(repo, "src/lib/supabase/env.ts"), "utf8").match(/https:\/\/([a-z0-9]+\.supabase\.co)/);
  assert.ok(supabase, "non trovo l'indirizzo di Supabase in src/lib/supabase/env.ts");
  assert.deepEqual(
    [...config.server.allowNavigation].sort(),
    ["*.discord.com", "*.originsmeta.com", "discord.com", "originsmeta.com", supabase[1]].sort(),
  );
});

test("lo user agent dice la versione dell'app, la stessa di package.json", () => {
  assert.equal(config.android.appendUserAgent, `OriginsMetaApp/${pkg.version}`);
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test("la pagina offline ha i testi nelle cinque lingue e la dicitura su Koin Games in ognuna", () => {
  const html = read("www/offline.html");
  for (const lang of ["en", "it", "es", "fr", "pt"]) {
    const texts = html.match(new RegExp(`\\b${lang}: \\[([\\s\\S]*?)\\]`));
    assert.ok(texts, `manca ${lang}`);
    assert.equal(texts[1].match(/"[^"]*"/g)?.length, 4, `${lang}: titolo, testo, tasto e dicitura`);
    assert.match(texts[1], /Koin Games\."\s*$/, `${lang}: manca la dicitura su Koin Games`);
  }
  assert.match(html, /<small id="note">[^<]*Koin Games/, "dicitura anche senza JavaScript");
  assert.doesNotMatch(html, /#fff(?:fff)?\b/i, "niente bianco pieno");
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=/i, "niente file esterni: la pagina si vede senza rete");
});

test("icone dal logo del sito, la carta dentro la zona sicura delle icone adattive", () => {
  const { background, content } = splitLogo(readFileSync(path.join(repo, "src/app/icon.svg"), "utf8"));
  assert.match(background, /^#[0-9a-f]{6}$/);
  assert.match(content, /<text/);
  assert.doesNotMatch(content, /width="64" height="64"/);
  // La carta del logo va da (16, 9) a (51, 55) con il bordo: a scala 1,2 deve stare nel cerchio di 33 dp di raggio.
  const corners = [[17, 10], [47, 10], [17, 54], [47, 54], [50, 16]];
  for (const [x, y] of corners) {
    const dx = (x - 32) * 1.2;
    const dy = (y - 32) * 1.2;
    assert.ok(Math.hypot(dx, dy) <= 33, `(${x}, ${y}) fuori dalla zona sicura`);
  }
  assert.match(centered(content, 1.2), /scale\(1\.2\)/);
  assert.equal(
    read("android/app/src/main/res/values/ic_launcher_background.xml").match(/#[0-9A-F]{6}/)?.[0],
    background.toUpperCase(),
  );
});

test("l'avvio e i colori dell'app usano la palette del sito, mai materiale Koin", () => {
  const styles = read("android/app/src/main/res/values/styles.xml");
  assert.match(styles, /om_felt">#150C2C/);
  assert.match(styles, /windowSplashScreenAnimatedIcon">@mipmap\/ic_launcher_foreground/);
  assert.equal(config.backgroundColor, "#150c2c");
  assert.equal(config.plugins.SplashScreen.backgroundColor, "#150c2c");
});

test("il backup di Android non copia cookie e sessione dell'app", () => {
  assert.match(read("android/app/src/main/AndroidManifest.xml"), /android:allowBackup="false"/);
});
