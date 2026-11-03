/**
 * Test dell'OCR senza PowerShell (0.5.1, 03/11/2026; ocr.ts): dove si cerca il programma, che cosa gli si manda e,
 * soprattutto, che l'app non lanci più PowerShell, che Norton bloccava come "IDP.HELU.PSE96 - Command Line Detection".
 * `npm test` nella cartella tracker/.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isNamePng, MAX_NAME_PNG, OCR_EXE, ocrExeCandidates } from "./ocr";

test("il programma dell'OCR: accanto ad app.asar nell'app impacchettata, poi dist/ocr", () => {
  assert.deepEqual(ocrExeCandidates("C:\\Giochi\\OriginsMeta Tracker\\resources", "C:\\Giochi\\OriginsMeta Tracker\\resources\\app.asar\\dist"), [
    path.join("C:\\Giochi\\OriginsMeta Tracker\\resources", OCR_EXE),
    path.join("C:\\Giochi\\OriginsMeta Tracker\\resources\\app.asar\\dist", "ocr", OCR_EXE),
  ]);
  assert.deepEqual(ocrExeCandidates(undefined, "dist"), [path.join("dist", "ocr", OCR_EXE)]);
});

test("all'OCR solo PNG veri e piccoli", () => {
  const png = (n: number) => Uint8Array.from({ length: n }, (_, i) => [0x89, 0x50, 0x4e, 0x47][i] ?? 0);
  assert.equal(isNamePng(png(100)), true);
  assert.equal(isNamePng(png(MAX_NAME_PNG)), true);
  assert.equal(isNamePng(png(MAX_NAME_PNG + 1)), false);
  assert.equal(isNamePng(png(8)), false);
  assert.equal(isNamePng(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6])), false, "un JPEG no");
});

/** I sorgenti .ts dell'app (test esclusi) senza commenti: i commenti possono raccontare com'era prima. */
function appSources(dir: string): { file: string; code: string }[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return appSources(p);
    if (!d.name.endsWith(".ts") || d.name.endsWith(".test.ts")) return [];
    const code = fs
      .readFileSync(p, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:\\])\/\/.*$/gm, "$1");
    return [{ file: path.relative(dir, p), code }];
  });
}

test("l'app non lancia PowerShell (Norton: IDP.HELU.PSE96, 03/11/2026)", () => {
  const sources = appSources(path.join(import.meta.dirname, ".."));
  assert.ok(sources.some((s) => s.file.endsWith("ocr.ts")), "sorgenti trovati");
  for (const { file, code } of sources) assert.ok(!/powershell|pwsh|EncodedCommand|ExecutionPolicy/i.test(code), `${file}: niente PowerShell`);
});

test("il programma dell'OCR non lancia altri programmi", () => {
  const cs = fs.readFileSync(path.join(import.meta.dirname, "..", "ocr", "OcrHelper.cs"), "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/Process|powershell/i.test(cs));
  assert.match(cs, /TryCreateFromUserProfileLanguages/);
  assert.match(cs, /const int MaxPng = 512 \* 1024;/, "stesso tetto di MAX_NAME_PNG");
  assert.equal(MAX_NAME_PNG, 512 * 1024);
});
