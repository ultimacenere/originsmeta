/**
 * Test del giorno dei cubetti-data (24/11/2026): `node --test src/lib/calendarDay.test.ts`.
 * La striscia del calendario mostrava i tornei della community con il giorno UTC: il torneo di ChillGiver, il 28/11 alle
 * 23:00 UTC, in Italia diceva 28 invece di 29. Qui il giorno nel fuso di chi guarda e i controlli sui sorgenti che
 * tengono insieme la rotta (che manda l'orario) e la striscia (che lo usa).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { calendarCube, dayNumber, localDay, monthShort } from "./calendarDay.ts";

const CHILLGIVER = "2026-11-28T23:00:00+00:00";

describe("localDay", () => {
  test("il giorno cambia con il fuso di chi guarda", () => {
    assert.equal(localDay(CHILLGIVER, "Europe/Rome"), "2026-11-29");
    assert.equal(localDay(CHILLGIVER, "UTC"), "2026-11-28");
    assert.equal(localDay(CHILLGIVER, "America/New_York"), "2026-11-28");
    assert.equal(localDay("2026-11-27T20:00:00+00:00", "Asia/Shanghai"), "2026-11-28");
    assert.equal(localDay("2026-11-28T03:00:00Z", "America/Los_Angeles"), "2026-11-27");
  });

  test("a cavallo dell'anno", () => {
    assert.equal(localDay("2026-12-31T23:30:00Z", "Europe/Rome"), "2027-01-01");
  });

  test("un orario che non si legge o un fuso sconosciuto danno null", () => {
    assert.equal(localDay("domani sera"), null);
    assert.equal(localDay(""), null);
    assert.equal(localDay(CHILLGIVER, "Europa/Nowhere"), null);
  });

  test("senza fuso usa quello del sistema", () => {
    const d = new Date(CHILLGIVER);
    const pad = (n: number) => String(n).padStart(2, "0");
    assert.equal(localDay(CHILLGIVER), `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  });
});

describe("calendarCube", () => {
  test("numero e mese del giorno locale, nella lingua della pagina", () => {
    assert.deepEqual(calendarCube(CHILLGIVER, "it", "Europe/Rome"), { date: "2026-11-29", day: "29", month: "nov" });
    assert.deepEqual(calendarCube(CHILLGIVER, "en", "America/New_York"), { date: "2026-11-28", day: "28", month: "Nov" });
    assert.deepEqual(calendarCube("2026-12-31T23:30:00Z", "it", "Europe/Rome"), { date: "2027-01-01", day: "1", month: "gen" });
  });

  test("un orario che non si legge o una lingua sconosciuta danno null (resta il giorno della rotta)", () => {
    assert.equal(calendarCube("domani sera", "it", "Europe/Rome"), null);
    assert.equal(calendarCube(CHILLGIVER, "not a locale!", "Europe/Rome"), null);
  });

  test("tutte le lingue del sito hanno un mese", () => {
    for (const locale of ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"]) {
      const cube = calendarCube(CHILLGIVER, locale, "Europe/Rome");
      assert.ok(cube && cube.month.length > 0 && !cube.month.includes("."), locale);
    }
  });
});

describe("monthShort e dayNumber (anche per gli eventi ufficiali, via i18n.ts)", () => {
  test("come prima per le date aaaa-mm-gg", () => {
    assert.equal(monthShort("it", "2026-11-28"), "nov");
    assert.equal(monthShort("en", "2026-10-27"), "Oct");
    assert.equal(monthShort("fr", "2026-11-28"), "nov");
    assert.equal(dayNumber("2026-11-09"), "9");
    assert.equal(dayNumber("2026-11-28"), "28");
  });
});

describe("sorgenti", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

  test("la rotta del calendario manda l'orario dei tornei", () => {
    assert.match(read("../app/api/calendar/route.ts"), /startsAt: t\.starts_at/);
  });

  test("la striscia rifà il giorno dei tornei nel browser", () => {
    const src = read("../components/TickerMarquee.tsx");
    assert.match(src, /from "@\/lib\/calendarDay"/);
    assert.match(src, /list\.map\(\(it\) => inLocalDay\(it, locale\)\)/);
  });

  test("calendarDay.ts non importa niente (entra nel bundle del browser) e i18n.ts lo riesporta", () => {
    assert.doesNotMatch(read("./calendarDay.ts"), /^import /m);
    assert.match(read("./i18n.ts"), /export \{ dayNumber, monthShort \} from "\.\/calendarDay";/);
  });
});
