/**
 * Test della scheda che racconta (28/11/2026): letture, eventi, prezzo tipico, affidabilità, note e tratti del grafico.
 * `node --test src/lib/market/story.test.ts`. Le letture d'esempio ricalcano la storia vera di Dracula Crimson Cup Top 32:
 * comparsa, ribasso, sparizione, ritorno, secondo venditore.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  HOUR_MS,
  eventsOf,
  onSaleSince,
  priceAt,
  readHoursOf,
  readingsOf,
  reliabilityOf,
  stateAt,
  stepSegments,
  storyNotes,
  typicalPrice,
  type Reading,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./story.ts";

const T0 = Date.parse("2026-11-01T00:00:00Z");
const h = (n: number) => T0 + n * HOUR_MS;
const iso = (n: number) => new Date(h(n)).toISOString();
const point = (n: number, close: number, listings = 1) => ({ t: iso(n), low: close, high: close, close, listings });

describe("letture", () => {
  test("le ore lette senza la riga dell'oggetto sono 'nessuna offerta', dalla prima in vendita", () => {
    const hourly = [point(2, 1000), point(3, 1000)];
    const read = readHoursOf([iso(0), iso(1), iso(2), iso(3), iso(4), iso(4)]);
    assert.deepEqual(read, [h(0), h(1), h(2), h(3), h(4)]);
    const r = readingsOf(hourly, read);
    assert.deepEqual(r.map((x: Reading) => [x.t, x.listed]), [[h(2), true], [h(3), true], [h(4), false]]);
  });
  test("senza le ore lette restano solo quelle in vendita", () => {
    const r = readingsOf([point(5, 10), point(1, 20)], null);
    assert.deepEqual(r.map((x: Reading) => x.t), [h(1), h(5)]);
    assert.ok(r.every((x: Reading) => x.listed));
  });
  test("niente storico, niente letture", () => {
    assert.deepEqual(readingsOf([], [h(0)]), []);
  });
});

/** Come Dracula Top 32: 862,50 → 805 → 310,50, sparita, torna a 1.230,76, secondo venditore a 831,74, ritocchi. */
function draculaLike(): Reading[] {
  const hourly = [point(0, 86250), point(24, 80500), point(36, 31050), point(37, 31050), point(300, 123076), point(312, 121987), point(324, 83174, 2), point(336, 82837, 2), point(337, 83000, 2)];
  const read = [0, 24, 36, 37, 48, 60, 72, 300, 312, 324, 336, 337].map(h);
  return readingsOf(hourly, read);
}

describe("eventi", () => {
  test("comparsa, ribassi, sparizione, ritorno, secondo venditore, rialzo", () => {
    const ev = eventsOf(draculaLike());
    assert.deepEqual(
      ev.map((e: { kind: string }) => e.kind),
      ["first", "down", "down", "gone", "back", "down", "seller", "down", "up"],
    );
    const gone = ev.find((e: { kind: string }) => e.kind === "gone")!;
    assert.equal(gone.from, h(37));
    assert.equal(gone.t, h(48));
    assert.equal(gone.price, 31050);
    const back = ev.find((e: { kind: string }) => e.kind === "back")!;
    assert.equal(back.from, h(72));
    const seller = ev.find((e: { kind: string }) => e.kind === "seller")!;
    assert.equal(seller.price, 83174);
    assert.equal(seller.before, 121987);
  });
  test("con tante offerte il numero che cambia non è un fatto", () => {
    const r = readingsOf([point(0, 500, 80), point(1, 500, 85), point(2, 500, 70)], null);
    assert.deepEqual(eventsOf(r).map((e: { kind: string }) => e.kind), ["first"]);
  });
});

describe("prezzo tipico e affidabilità", () => {
  const now = h(400);
  const steady = readingsOf(Array.from({ length: 10 }, (_, i) => point(300 + i * 10, 82000 + (i % 2) * 300, 2)), null);
  test("mediana dei 7 giorni, con quante letture e quanto si sparpagliano", () => {
    const t = typicalPrice(steady, now)!;
    assert.equal(t.n, 10);
    assert.equal(t.median, 82150);
    assert.ok(t.spread < 0.01);
    assert.equal(typicalPrice(steady, h(1000)), null);
  });
  test("stabile, si muove molto, dati scarsi; senza offerte nessun giudizio", () => {
    assert.equal(reliabilityOf(true, typicalPrice(steady, now)), "steady");
    const wild = readingsOf(Array.from({ length: 8 }, (_, i) => point(320 + i * 5, i % 2 ? 50000 : 90000)), null);
    assert.equal(reliabilityOf(true, typicalPrice(wild, now)), "wild");
    const thin = readingsOf([point(390, 1000), point(395, 1000)], null);
    assert.equal(reliabilityOf(true, typicalPrice(thin, now)), "thin");
    assert.equal(reliabilityOf(true, null), "thin");
    assert.equal(reliabilityOf(false, typicalPrice(steady, now)), null);
  });
});

describe("note del diario", () => {
  test("prima offerta, ribasso più forte, sparizione, ritorno, secondo venditore; niente rialzo sotto il 3%", () => {
    const notes = storyNotes(eventsOf(draculaLike()));
    assert.deepEqual(notes.map((n: { kind: string }) => n.kind), ["first", "drop", "gone", "back", "seller"]);
    const drop = notes.find((n: { kind: string }) => n.kind === "drop")!;
    assert.equal(drop.before, 80500);
    assert.equal(drop.price, 31050);
    const gone = notes.find((n: { kind: string }) => n.kind === "gone")!;
    assert.equal(gone.t, h(37));
    assert.equal(gone.to, h(48));
  });
  test("un rialzo dal 3% in su è una nota; al massimo sei note", () => {
    const r = readingsOf([point(0, 1000), point(1, 1100), point(2, 1000), point(3, 900)], null);
    const kinds = storyNotes(eventsOf(r)).map((n: { kind: string }) => n.kind);
    assert.ok(kinds.includes("rise"));
    assert.ok(kinds.includes("drop"));
    const many = Array.from({ length: 12 }, (_, i) => [point(i * 10, 1000), { t: iso(i * 10 + 5), low: 0, high: 0, close: 0, listings: 0 }]).flat();
    const rr = readingsOf(
      many.filter((p) => p.listings > 0),
      Array.from({ length: 120 }, (_, i) => h(i)),
    );
    assert.ok(storyNotes(eventsOf(rr)).length <= 6);
  });
});

describe("tratti del grafico", () => {
  test("pieno fra letture di seguito, tratteggio fra letture lontane, puntini prima di sparire, fascia senza offerte", () => {
    const { lines, bands } = stepSegments(draculaLike(), h(0), h(340));
    const kinds = lines.map((l: { kind: string }) => l.kind);
    assert.equal(kinds[0], "gap"); // 0 → 24: ore non lette in mezzo
    assert.ok(kinds.includes("solid"));
    assert.ok(kinds.includes("trail")); // 37 in vendita, 48 no
    assert.ok(bands.length >= 1);
    assert.deepEqual(bands[0], { t0: h(48), t1: h(60) });
    for (const l of lines) assert.ok(l.t0 >= h(0) && l.t1 <= h(340) && l.t1 >= l.t0);
  });
  test("tagliati sull'intervallo", () => {
    const { lines } = stepSegments(draculaLike(), h(320), h(340));
    assert.ok(lines.every((l: { t0: number }) => l.t0 >= h(320)));
  });
});

describe("dito sul grafico e prezzi di prima", () => {
  test("lo stato a un'ora: l'ultima lettura, e se l'ora cade fra due letture lontane", () => {
    const r = draculaLike();
    assert.equal(stateAt(r, h(10)).reading!.t, h(0));
    assert.equal(stateAt(r, h(10)).unread, true);
    assert.equal(stateAt(r, h(36)).unread, false);
    assert.equal(stateAt(r, h(-5)).reading, null);
  });
  test("in vendita da, prezzo a una data", () => {
    const r = draculaLike();
    assert.equal(onSaleSince(r), h(300));
    assert.equal(priceAt(r, h(30)), 80500);
    assert.equal(priceAt(r, h(-1)), null);
    assert.equal(onSaleSince(readingsOf([point(0, 10)], [h(0), h(1)])), null);
  });
});
