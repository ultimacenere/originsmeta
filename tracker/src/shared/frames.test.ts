/** Test delle regole della modalità cattura dello scanner (frames.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { frameFileName, frameSignature, isJpegFrame, MAX_FRAME_BYTES, pickGameWindow, SAME_FRAME_DIFF, sessionDirName, signatureDiff } from "./frames";

test("finestra del gioco: solo un titolo esatto, la demo prima delle altre", () => {
  const sources = [
    { id: "window:1", name: "Origins TCG Demo - Discord" },
    { id: "window:2", name: "OriginsMeta Analytics" },
    { id: "window:3", name: "Origins TCG Demo" },
  ];
  assert.deepEqual(pickGameWindow(sources), { id: "window:3", name: "Origins TCG Demo" });
  assert.equal(pickGameWindow(sources.slice(0, 2)), null, "un titolo che contiene il nome non basta");
  assert.equal(pickGameWindow([{ id: "window:9", name: "Origins TCG" }, { id: "window:8", name: "Origins TCG Demo" }])?.id, "window:8");
  assert.equal(pickGameWindow([]), null);
});

test("impronta e differenza: uguali sotto la soglia, un cambio vero sopra", () => {
  const rgba = (gray: number, n = 48 * 27) => Uint8Array.from({ length: n * 4 }, (_, i) => (i % 4 === 3 ? 255 : gray));
  const a = frameSignature(rgba(100));
  assert.equal(a.length, 48 * 27);
  assert.equal(a[0], 100);
  assert.equal(signatureDiff(a, frameSignature(rgba(100))), 0);
  assert.ok(signatureDiff(a, frameSignature(rgba(101))) < SAME_FRAME_DIFF, "rumore di compressione");
  assert.ok(signatureDiff(a, frameSignature(rgba(140))) > SAME_FRAME_DIFF, "carta che entra in campo");
  assert.equal(signatureDiff(null, a), Infinity, "il primo fotogramma si salva sempre");
  assert.equal(signatureDiff(a.slice(1), a), Infinity, "misure diverse");
});

test("nomi di cartelle e file ordinabili", () => {
  assert.equal(sessionDirName(new Date(2026, 9, 10, 9, 5, 7)), "2026-10-10_09-05-07");
  assert.equal(frameFileName(1234.9), "000001234.jpg");
  assert.equal(frameFileName(-5), "000000000.jpg");
  assert.ok(frameFileName(9_000_000) < frameFileName(10_000_000));
});

test("sul disco solo JPEG non troppo grandi", () => {
  assert.equal(isJpegFrame(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0])), true);
  assert.equal(isJpegFrame(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0])), false, "PNG");
  assert.equal(isJpegFrame(Uint8Array.from([0xff, 0xd8, 0xff])), false, "troppo corto");
  const big = new Uint8Array(MAX_FRAME_BYTES + 1);
  big.set([0xff, 0xd8, 0xff]);
  assert.equal(isJpegFrame(big), false);
});
