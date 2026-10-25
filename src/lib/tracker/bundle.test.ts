/**
 * Test delle statistiche in una lettura (25/10/2026): `node --test src/lib/tracker/bundle.test.ts`.
 * - Le funzioni pure di bundle.ts: forma della risposta, timeout riconosciuti, attese dei nuovi tentativi.
 * - schema.sql: tracker_stats_bundle ripete la logica delle sette tracker_stats_* (stesse condizioni, stessi raggruppamenti,
 *   stesse soglie, stesso ordine). Chi cambia una funzione e non la funzione unica (o il contrario) fa fallire il test.
 *   L'equivalenza dei risultati la prova scripts/tracker-bundle-dry-run.mjs sul database vero.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { STATS_PARTS, isStatementTimeout, parseBundle, retryDelays } from "./bundle.ts";
import { sqlStatements } from "../../../scripts/schema-guard.mjs";

describe("risposta della funzione unica", () => {
  test("un array per parte", () => {
    const ok = Object.fromEntries(STATS_PARTS.map((p) => [p, []]));
    assert.deepEqual(parseBundle(ok), ok);
    assert.equal(parseBundle(null), null);
    assert.equal(parseBundle([]), null);
    assert.equal(parseBundle({ ...ok, cards: null }), null);
    assert.equal(parseBundle(Object.fromEntries(STATS_PARTS.filter((p) => p !== "lists").map((p) => [p, []]))), null);
  });
  test("timeout riconosciuti", () => {
    assert.ok(isStatementTimeout({ code: "57014", message: "x" }));
    assert.ok(isStatementTimeout({ code: null, message: "canceling statement due to statement timeout" }));
    assert.ok(!isStatementTimeout({ code: "PGRST202", message: "not found" }));
    assert.ok(!isStatementTimeout(null));
  });
  test("due nuovi tentativi, entro 7 secondi in tutto", () => {
    assert.deepEqual(retryDelays(() => 0), [1200, 3000]);
    const max = retryDelays(() => 1);
    assert.deepEqual(max, [2000, 4500]);
    assert.ok(max.reduce((a, b) => a + b) <= 7000);
  });
});

describe("schema.sql: tracker_stats_bundle come le sette funzioni", () => {
  const stmts: string[] = sqlStatements(fs.readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8"));
  const last = (name: string) => {
    const s = stmts.filter((x) => x.startsWith(`create or replace function public.${name}(`)).at(-1);
    assert.ok(s, `manca ${name}`);
    return s;
  };
  const bundle = last("tracker_stats_bundle");

  test("è security definer, stabile, eseguibile da anon e authenticated", () => {
    assert.ok(bundle.includes("returns jsonb language sql stable security definer set search_path = public, pg_temp"));
    const revoke = stmts.indexOf("revoke all on function public.tracker_stats_bundle(text) from public");
    assert.ok(revoke >= 0 && stmts.indexOf("grant execute on function public.tracker_stats_bundle(text) to anon, authenticated") > revoke);
  });

  test("le partite lette come tracker_stat_rows (una per impronta, esito noto, coda, la più vecchia)", () => {
    const rows = last("tracker_stat_rows");
    const from = rows.slice(rows.indexOf("from public.tracked_matches t"), rows.indexOf("order by t.id, t.created_at") + "order by t.id, t.created_at".length);
    assert.ok(from.length > 60, from);
    assert.ok(bundle.includes(from), "la lettura delle partite è cambiata in tracker_stat_rows o nella funzione unica");
    assert.ok(bundle.includes("with r as materialized ("), "le partite si leggono una volta sola");
    // colonne: le stesse, con i nomi delle colonne di tracker_stat_rows
    assert.ok(rows.includes("select distinct on (t.id) t.owner, t.id, t.result = 'w', t.deck_legendary, t.deck_cards, t.deck_list, t.archetype, t.opponent_legendary, t.plays"));
    assert.ok(bundle.includes("select distinct on (t.id) t.owner, t.id, t.result = 'w' as win, t.deck_legendary as legendary, t.deck_cards as cards, t.deck_list as list, t.archetype, t.opponent_legendary as opponent, t.plays"));
  });

  const HAVING = "having public.tracker_stats_ok(count(*), count(distinct r.owner))";
  for (const name of ["legendaries", "lists", "archetypes", "matchups", "opponents"]) {
    test(`${name}: stesse condizioni, raggruppamento, soglia e ordine`, () => {
      const fn = last(`tracker_stats_${name}`);
      const m = /from public\.tracker_stat_rows\(p_patch\) r (where .*? group by .*?) having/.exec(fn);
      assert.ok(m, fn);
      assert.ok(bundle.includes(`from r ${m[1]} ${HAVING}`), `${name}: ${m[1]}`);
      const order = /order by (.*?);?\s*\$\$$/.exec(fn)?.[1];
      assert.ok(order, fn);
      const mapped = order.replace("count(*)", "x.games").replace(/\br\./g, "x.");
      assert.ok(bundle.includes(`'${name}', coalesce((select jsonb_agg(to_jsonb(x) order by ${mapped}) from ${name} x), '[]'::jsonb)`), `${name}: order by ${mapped}`);
    });
  }

  test("overview: stessi totali e stessa soglia", () => {
    const fn = last("tracker_stats_overview");
    const o = /o as \((.*?)\)\s+select/.exec(fn)?.[1];
    assert.ok(o, fn);
    assert.ok(bundle.includes(`o as (${o})`), o);
    assert.ok(fn.includes(`from r ${HAVING}`) && bundle.includes(`from r ${HAVING}`));
    assert.ok(bundle.includes("(select case when public.tracker_stats_ok(o.n, o.p) then o.n end from o) as with_opponent"));
  });

  test("cards: carte nel mazzo, prima giocata, giocate e unione uguali", () => {
    const fn = last("tracker_stats_cards");
    const chain = fn.slice(fn.indexOf("in_deck as ("), fn.indexOf("select j.card,"));
    assert.ok(chain.length > 200, chain);
    assert.ok(bundle.includes(chain.trim()), "le CTE delle carte sono cambiate in una delle due funzioni");
    assert.ok(fn.includes("where j.ok_d or j.ok_p order by coalesce(j.dg, 0) desc, j.card"));
    assert.ok(bundle.includes("where j.ok_d or j.ok_p )"));
    assert.ok(bundle.includes("'cards', coalesce((select jsonb_agg(to_jsonb(x) order by coalesce(x.deck_games, 0) desc, x.card) from cards x), '[]'::jsonb)"));
  });

  test("ogni parte ha il suo posto nella risposta", () => {
    for (const p of STATS_PARTS) assert.ok(bundle.includes(`'${p}', coalesce((select jsonb_agg(to_jsonb(x)`), p);
  });

  test("l'indice per la lettura delle partite", () => {
    assert.ok(stmts.includes("create index if not exists tracked_matches_stats_idx on public.tracked_matches (patch, id, created_at) where result in ('w', 'l')"));
  });
});
