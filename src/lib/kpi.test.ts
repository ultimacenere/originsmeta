/**
 * Test dei numeri della dashboard privata (`kpi.ts`, 22/10/2026): `node --test src/lib/kpi.test.ts`.
 * Controlla il parametro `from`, la lettura delle righe e che il blocco "22/10/2026: NUMERI DELLA DASHBOARD" di
 * schema.sql dica le stesse cose del codice: giorno del lancio, tetto dei giorni, giorni di Roma, solo con il segreto.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { KPI_MAX_DAYS, KPI_SINCE, kpiDays, kpiFrom } from "./kpi.ts";

const schema = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const START = "-- ===== 22/10/2026: NUMERI DELLA DASHBOARD =====";
const block = (() => {
  const from = schema.indexOf(START);
  const next = schema.indexOf("\n-- ===== ", from + START.length);
  return from < 0 ? "" : schema.slice(from, next < 0 ? undefined : next);
})();

describe("parametro from", () => {
  test("un giorno valido passa, il resto torna al giorno del lancio", () => {
    assert.equal(kpiFrom("2026-10-01"), "2026-10-01");
    for (const bad of [null, undefined, "", "2026-13-01", "2026-02-30", "01/10/2026", "2026-10-01T00:00", "x"]) assert.equal(kpiFrom(bad), KPI_SINCE, String(bad));
  });
});

describe("righe del database", () => {
  test("nomi della funzione → nomi della dashboard, numeri sporchi a zero, righe senza giorno scartate", () => {
    assert.deepEqual(
      kpiDays([
        { day: "2026-10-21", signups: 4, tracker_downloads: "3", tracker_new_accounts: 2, tracker_clicks_no_login: 5, decks_created: 7, decks_published: 6, deck_sets_created: 1 },
        { day: "boh", signups: 1 },
        { day: "2026-10-22", signups: -1, tracker_downloads: null },
      ]),
      [
        { day: "2026-10-21", signups: 4, trackerDownloads: 3, trackerNewAccounts: 2, trackerClicksNoLogin: 5, decksCreated: 7, decksPublished: 6, deckSetsCreated: 1 },
        { day: "2026-10-22", signups: 0, trackerDownloads: 0, trackerNewAccounts: 0, trackerClicksNoLogin: 0, decksCreated: 0, decksPublished: 0, deckSetsCreated: 0 },
      ],
    );
    assert.deepEqual(kpiDays(null), []);
  });
});

describe("blocco NUMERI DELLA DASHBOARD di schema.sql", () => {
  test("c'è, con la funzione security definer che parte solo con il segreto del cron", () => {
    assert.ok(block.length > 500, "blocco mancante");
    assert.match(block, /create or replace function public\.kpi_daily\(p_key text, p_from date default date '2026-09-15'\)/);
    assert.match(block, /language plpgsql stable security definer set search_path = public, pg_temp as/);
    assert.match(block, /if not public\.notify_key_ok\(p_key\) then raise exception 'forbidden'/);
    assert.ok(block.includes("revoke all on function public.kpi_daily(text, date) from public;"));
  });
  test("stesso giorno del lancio e stesso tetto dei giorni del codice, giorni di Roma", () => {
    assert.ok(block.includes(`date '${KPI_SINCE}'`));
    assert.ok(block.includes(`::date - ${KPI_MAX_DAYS - 1}`));
    assert.ok(!/at time zone 'UTC'/.test(block));
    assert.equal((block.match(/at time zone 'Europe\/Rome'/g) ?? []).length >= 7, true);
  });
  test("solo conteggi: nessuna tabella nuova, nessun permesso sulle tabelle", () => {
    assert.ok(!/create table/.test(block));
    assert.ok(!/^grant [^;]* on public\.(?!kpi_daily)/m.test(block.replace(/grant execute on function[^;]*;/g, "")));
  });
});
