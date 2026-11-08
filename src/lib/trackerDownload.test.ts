import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { TRACKER_DOWNLOAD_URL, TRACKER_MIRROR_URL, trackerDownloadTarget } from "./trackerDownload.ts";

const reply = (status: number, location?: string) =>
  (async () => new Response(null, { status, headers: location ? { location } : {} })) as unknown as typeof fetch;

test("GitHub risponde con il redirect allo zip: si scarica da GitHub", async () => {
  assert.equal(await trackerDownloadTarget(reply(302, "https://objects.githubusercontent.com/x.zip")), TRACKER_DOWNLOAD_URL);
});

test("GitHub giù (502), in timeout o irraggiungibile: si scarica dalla riserva", async () => {
  const quiet = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await trackerDownloadTarget(reply(502)), TRACKER_MIRROR_URL);
    const timeout = (async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }) as unknown as typeof fetch;
    assert.equal(await trackerDownloadTarget(timeout), TRACKER_MIRROR_URL);
  } finally {
    console.warn = quiet;
  }
});

test("la riserva è lo zip della versione del tracker, fuori da GitHub", async () => {
  const { readFileSync } = await import("node:fs");
  const { version } = JSON.parse(readFileSync(new URL("../../tracker/package.json", import.meta.url), "utf8"));
  assert.ok(TRACKER_MIRROR_URL.endsWith(`/OriginsMeta-Tracker-${version}-win-x64.zip`), "riserva da aggiornare alla release " + version);
  assert.ok(!TRACKER_MIRROR_URL.includes("github"));
});
