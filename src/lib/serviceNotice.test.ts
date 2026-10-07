/**
 * Test dell'avviso di servizio (`serviceNotice.ts`): `node --test src/lib/serviceNotice.test.ts`.
 * Finestra di validità, chiave di chiusura, testi completi nelle tre lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_NOTICE,
  serviceNoticeActive,
  serviceNoticeKey,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in lastmod.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./serviceNotice.ts";

const locales = ["en", "it", "es"] as const;

describe("serviceNoticeActive", () => {
  const notice = { from: "2026-10-07T00:00:00+02:00", until: "2026-10-10T23:59:59+02:00" };
  test("è attivo dentro la finestra, estremi compresi", () => {
    assert.equal(serviceNoticeActive(new Date("2026-10-07T00:00:00+02:00"), notice), true);
    assert.equal(serviceNoticeActive(new Date("2026-10-08T12:00:00+02:00"), notice), true);
    assert.equal(serviceNoticeActive(new Date("2026-10-10T23:59:59+02:00"), notice), true);
  });
  test("non è attivo prima e dopo", () => {
    assert.equal(serviceNoticeActive(new Date("2026-10-06T23:59:59+02:00"), notice), false);
    assert.equal(serviceNoticeActive(new Date("2026-10-11T00:00:00+02:00"), notice), false);
  });
  test("con date non valide non si mostra", () => {
    assert.equal(serviceNoticeActive(new Date("2026-10-08T12:00:00+02:00"), { from: "boh", until: notice.until }), false);
    assert.equal(serviceNoticeActive(new Date("2026-10-08T12:00:00+02:00"), { from: notice.from, until: "" }), false);
  });
  test("l'avviso configurato ha una finestra valida e finita", () => {
    assert.ok(Date.parse(SERVICE_NOTICE.from) < Date.parse(SERVICE_NOTICE.until));
  });
});

describe("serviceNoticeKey", () => {
  test("cambia con l'id, così un avviso nuovo si rivede anche dopo aver chiuso il vecchio", () => {
    assert.equal(serviceNoticeKey("dns-2026-10-07"), "om.notice.dns-2026-10-07");
    assert.notEqual(serviceNoticeKey("a"), serviceNoticeKey("b"));
    assert.equal(serviceNoticeKey(), serviceNoticeKey(SERVICE_NOTICE.id));
  });
});

describe("testi", () => {
  test("ogni lingua ha kicker, testo, data e chiusura non vuoti", () => {
    for (const l of locales) {
      const t = SERVICE_NOTICE.text[l];
      for (const k of ["kicker", "text", "date", "close"] as const) assert.ok(t[k].trim().length > 0, `${l}.${k}`);
    }
  });
  test("il testo nomina il fornitore e il sito, e non supera le due righe", () => {
    for (const l of locales) {
      const t = SERVICE_NOTICE.text[l];
      assert.match(t.text, /Register\.it/);
      assert.match(t.text, /OriginsMeta/);
      assert.ok(t.text.length <= 260, `${l}: ${t.text.length} caratteri`);
    }
  });
});
