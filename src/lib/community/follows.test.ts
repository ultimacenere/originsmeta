/**
 * Test del "Segui" (pacchetto SEGUI, 27/09/2026): funzioni pure di `follows.ts` e regole dell'SQL del pacchetto, con il
 * runner integrato di Node: `node --test src/lib/community/follows.test.ts`.
 *
 * L'SQL sta in supabase/wave2-SEGUI.sql finché l'integratore non lo accoda a supabase/schema.sql, sotto il titolo
 * `-- ===== 27/09/2026: SEGUI =====`: il test legge il blocco in schema.sql se c'è, altrimenti il file del pacchetto.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { schemaProblems, sqlStatements } from "../../../scripts/schema-guard.mjs";
import {
  FOLLOW_MAX,
  alreadyFollowing,
  fillFollow,
  followErrorCode,
  followersText,
  loginReturnHref,
  parseFollowState,
  toggledState,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./follows.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { SHOWCASE_BADGES } from "./badges.ts";

const MARKER = "-- ===== 27/09/2026: SEGUI =====";
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

/** Il blocco SQL del pacchetto: in schema.sql (dopo l'integrazione) o nel file del pacchetto. */
function seguiSql(): { sql: string; inSchema: boolean } {
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  if (at >= 0) {
    const next = schema.indexOf("\n-- ===== ", at + MARKER.length);
    return { sql: schema.slice(at, next < 0 ? undefined : next), inSchema: true };
  }
  const file = new URL("../../../supabase/wave2-SEGUI.sql", import.meta.url);
  assert.ok(existsSync(file), "manca l'SQL del pacchetto SEGUI (supabase/wave2-SEGUI.sql o il blocco in schema.sql)");
  return { sql: readFileSync(file, "utf8"), inSchema: false };
}

const sorted = (xs: readonly string[]) => [...xs].sort();
const quoted = (s: string) => [...s.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

describe("stato del tasto Segui", () => {
  test("parseFollowState legge la RPC e scarta i valori strani", () => {
    assert.deepEqual(parseFollowState({ followers: 12, following: true, followable: true }), { followers: 12, following: true, followable: true });
    assert.deepEqual(parseFollowState({ followers: "7", following: "true", followable: 1 }), { followers: 7, following: false, followable: false }, "solo i veri booleani");
    assert.deepEqual(parseFollowState({ followers: -3 }), { followers: 0, following: false, followable: false });
    assert.deepEqual(parseFollowState({ followers: Infinity }), { followers: 0, following: false, followable: false });
    assert.equal(parseFollowState(null), null);
    assert.equal(parseFollowState([1]), null);
    assert.equal(parseFollowState("x"), null);
  });
  test("toggledState cambia tasto e numero, mai sotto zero", () => {
    const s = { followers: 3, following: false, followable: true };
    assert.deepEqual(toggledState(s, true), { followers: 4, following: true, followable: true });
    assert.equal(toggledState(s, false), s, "niente da cambiare");
    assert.deepEqual(toggledState({ followers: 0, following: true, followable: true }, false), { followers: 0, following: false, followable: true });
  });
  test("followersText: singolare e plurale con il numero intero", () => {
    const L = { followersOne: "1 follower", followersMany: "{n} follower" };
    assert.equal(followersText(L, 1), "1 follower");
    assert.equal(followersText(L, 0), "0 follower");
    assert.equal(followersText(L, 25), "25 follower");
    assert.equal(followersText(L, NaN), "0 follower");
    assert.equal(fillFollow("{a} e {b}", { a: 1 }), "1 e {b}", "segnaposto sconosciuto lasciato com'è");
  });
});

describe("errori e ritorno dall'accesso", () => {
  test("followErrorCode: errori del trigger, policy, vincolo, migrazione mancante", () => {
    assert.equal(followErrorCode({ message: "too_many_follows", code: "P0001" }), "tooMany");
    assert.equal(followErrorCode({ message: "not_followable", code: "P0001" }), "notFollowable");
    assert.equal(followErrorCode({ message: "follow_self", code: "P0001" }), "self");
    assert.equal(followErrorCode({ message: 'new row violates row-level security policy for table "follows"', code: "42501" }), "notFollowable");
    assert.equal(followErrorCode({ message: "violates check constraint", code: "23514" }), "self");
    for (const code of ["42P01", "42883", "PGRST200", "PGRST202", "PGRST205"]) assert.equal(followErrorCode({ message: "x", code }), "unavailable", code);
    assert.equal(followErrorCode({ message: "toString" }), "db", "niente nomi ereditati");
    assert.equal(followErrorCode(null), "db");
    assert.ok(alreadyFollowing({ code: "23505" }));
    assert.ok(!alreadyFollowing({ code: "23514" }));
    assert.ok(!alreadyFollowing(null));
  });
  test("loginReturnHref: solo percorsi interni", () => {
    assert.equal(loginReturnHref("it", "/it/u/vegakiles"), "/it/login?next=%2Fit%2Fu%2Fvegakiles");
    assert.equal(loginReturnHref("es", "/es/decks/community/swarm-ab12"), "/es/login?next=%2Fes%2Fdecks%2Fcommunity%2Fswarm-ab12");
    for (const bad of ["//evil.example", "/\\evil", "https://evil.example", "", null, undefined]) {
      assert.equal(loginReturnHref("en", bad), "/en/login?next=%2Fen%2Faccount", String(bad));
    }
  });
});

describe("database: supabase/wave2-SEGUI.sql", () => {
  const { sql, inSchema } = seguiSql();
  const stmts = sqlStatements(sql);
  const fn = (name: string) => stmts.find((s) => s.startsWith(`create or replace function public.${name}(`)) ?? "";

  test("si seguono solo i profili vetrina: ogni elenco di tag dell'SQL è SHOWCASE_BADGES", () => {
    const lists = [...sql.matchAll(/badge (?:not )?in \(([^)]*)\)/g)].map((m) => quoted(m[1]));
    assert.ok(lists.length >= 5, `elenchi trovati: ${lists.length}`);
    for (const l of lists) assert.deepEqual(sorted(l), sorted(SHOWCASE_BADGES));
  });
  test("follows: chiave doppia, mai se stessi, RLS sulle proprie righe, niente modifiche", () => {
    const table = stmts.find((s) => s.startsWith("create table if not exists public.follows")) ?? "";
    assert.match(table, /primary key \(follower, followed\)/);
    assert.match(table, /check \(follower <> followed\)/);
    assert.ok(stmts.includes("alter table public.follows enable row level security"));
    const policy = (name: string) => stmts.find((s) => s.includes(`create policy "${name}" on public.follows`)) ?? "";
    assert.match(policy("follows read own"), /for select to authenticated using \(follower = \(select auth\.uid\(\)\)\)/);
    assert.match(policy("follows insert own"), /with check \( follower = \(select auth\.uid\(\)\)/);
    assert.match(policy("follows delete own"), /for delete to authenticated using \(follower = \(select auth\.uid\(\)\)\)/);
    assert.match(policy("follows no update"), /as restrictive for update/);
    assert.ok(stmts.includes("revoke all on public.follows from anon, authenticated"));
    assert.ok(stmts.includes("grant insert (follower, followed) on public.follows to authenticated"), "insert solo per colonna: la data la mette il database");
    assert.ok(!stmts.some((s) => /^grant\b.*\bupdate\b.*on public\.follows/.test(s)), "nessun update sui segui");
  });
  test("trigger guard_follow: data del database, profilo vetrina, tetto uguale a FOLLOW_MAX", () => {
    const g = fn("guard_follow");
    assert.match(g, /new\.created_at := now\(\)/);
    assert.match(g, /raise exception 'not_followable'/);
    assert.ok(g.includes(`if n >= ${FOLLOW_MAX} then raise exception 'too_many_follows'`), "tetto diverso fra codice e database");
    assert.ok(stmts.includes("create trigger follows_guard before insert on public.follows for each row execute function public.guard_follow()"));
  });
  test("follow_state: solo il numero dei follower, per anon e authenticated", () => {
    const f = fn("follow_state");
    assert.match(f, /security definer set search_path = public, pg_temp/);
    assert.match(f, /'followers', \(select count\(\*\)/);
    assert.ok(!/array_agg|json_agg|jsonb_agg|string_agg/.test(f), "mai l'elenco di chi segue");
    assert.ok(stmts.includes("grant execute on function public.follow_state(uuid) to anon, authenticated"));
  });
  test("sicurezza generale: search_path fisso, execute tolto, niente grant o revoke sui profili, schema-guard contento", () => {
    for (const s of stmts.filter((x) => x.startsWith("create or replace function"))) {
      const name = /function (public\.\w+)\(/.exec(s)?.[1] ?? "";
      if (s.includes("security definer")) assert.match(s, /set search_path = public, pg_temp/, name);
      if (/returns trigger/.test(s)) continue;
      assert.ok(stmts.some((x) => x.startsWith(`revoke all on function ${name}(`)), `${name}: manca la revoke`);
    }
    assert.ok(!stmts.some((s) => /^(grant|revoke)\b/.test(s) && /\bon (?:table )?(?:[^;]*,\s*)?public\.profiles\b/.test(s)), "il pacchetto non tocca i grant dei profili");
    for (const table of stmts.filter((s) => s.startsWith("create table if not exists public.")).map((s) => /public\.(\w+)/.exec(s)?.[1])) {
      assert.ok(stmts.includes(`alter table public.${table} enable row level security`), `${table}: manca la RLS`);
      assert.ok(stmts.some((s) => /^revoke all on /.test(s) && s.includes(`public.${table}`) && s.endsWith("from anon, authenticated")), `${table}: manca la revoke`);
    }
    const schema = read("../../../supabase/schema.sql");
    assert.deepEqual(schemaProblems(inSchema ? schema : `${schema}\n${sql}`), []);
  });
});
