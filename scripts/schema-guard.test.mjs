/**
 * Test del controllo di schema.sql (`schema-guard.mjs`), quello che scripts/db-migrate.mjs fa prima di collegarsi:
 * `node --test scripts/schema-guard.test.mjs`. Lo schema vero passa; ogni modo di riaprire la scrittura dei profili
 * agli utenti (commit 6c6756d) viene rifiutato. Mai la rete.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { CREATOR_MARKER, PROFILES_GRANTS, PROFILES_REVOKE, schemaProblems, splitSchema, sqlStatements, withPendingBlocks } from "./schema-guard.mjs";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
/*
  I pacchetti dell'ondata 2 (27/09/2026) portano il loro SQL in supabase/wave2-<PACCHETTO>.sql, che l'integratore accoda a
  schema.sql. La grant per colonna di TRAGUARDI (show_stats) sta già in PROFILES_GRANTS: le prove sullo schema "vero" si
  fanno su schema.sql più i file non ancora accodati, cioè su quello che db-migrate applicherà.
*/
const supabaseDir = new URL("../supabase/", import.meta.url);
const pending = readdirSync(supabaseDir)
  .filter((f) => /^wave2-.+\.sql$/.test(f))
  .sort()
  .map((f) => readFileSync(new URL(f, supabaseDir), "utf8"));
const full = withPendingBlocks(schema, pending);
const COLUMN_GRANT = "grant update (bio, links, content_langs) on public.profiles to authenticated;";

/*
  Pacchetto VETRINA (27/09/2026): il suo SQL è nato in supabase/wave2-VETRINA.sql e l'integrazione lo ha accodato in fondo
  a schema.sql; `full` qui sopra lo comprende in tutti e due i casi. Il grant per colonna della vetrina sta in
  PROFILES_GRANTS: lo si cerca per contenuto (la colonna avatar_path), così l'ordine dell'elenco non conta.
*/
const VETRINA_MARKER = "-- ===== 27/09/2026: VETRINA =====";
const VETRINA_GRANT = `${PROFILES_GRANTS.find((g) => g.startsWith("grant update (avatar_path,")) ?? PROFILES_GRANTS[2]};`;

/** Lo schema vero con una riga accodata in fondo. */
const withTail = (extra) => `${schema}\n${extra}\n`;
/** Lo schema vero con una sostituzione (che deve trovare il testo). */
function replaced(from, to) {
  assert.ok(schema.includes(from), `schema.sql non contiene: ${from}`);
  return schema.replace(from, to);
}

describe("lettura delle istruzioni", () => {
  test("commenti tolti, stringhe e corpi fra dollari interi, spazi normalizzati", () => {
    const sql = [
      "-- grant update on public.profiles to authenticated;",
      "/* revoke all on public.profiles from anon; */",
      "select 'a;b' as x, E'it\\'s;' as y; -- coda",
      "create function f() returns int language sql as $$ select 1; select 2; $$;",
      "create function g() returns int language plpgsql as $body$ begin return 1; end $body$;",
      'create policy "a;b" on t for select using (true);',
      "GRANT   SELECT\r\n  ON public.x TO anon;",
    ].join("\n");
    assert.deepEqual(sqlStatements(sql), [
      "select 'a;b' as x, e'it\\'s;' as y",
      "create function f() returns int language sql as $$ select 1; select 2; $$",
      "create function g() returns int language plpgsql as $body$ begin return 1; end $body$",
      'create policy "a;b" on t for select using (true)',
      "grant select on public.x to anon",
    ]);
  });
});

describe("schema.sql vero", () => {
  test("si può applicare: nessun problema, da solo e con i file dell'ondata 2 accodati", () => {
    assert.deepEqual(schemaProblems(schema), []);
    assert.deepEqual(schemaProblems(full), []);
  });
  test("con il blocco della vetrina accodato si può ancora applicare", () => {
    assert.ok(full.includes(VETRINA_MARKER), "manca il blocco VETRINA (supabase/wave2-VETRINA.sql o in fondo a schema.sql)");
    assert.deepEqual(schemaProblems(full), []);
  });
  test("le sole grant su public.profiles sono quelle ammesse, la revoke c'è e viene prima di ogni grant per colonna", () => {
    const stmts = sqlStatements(full);
    const onProfiles = stmts.filter((s) => /^grant\b/.test(s) && /\bpublic\.profiles\b/.test(s));
    // come insiemi: l'ordine dipende da come l'integratore accoda i blocchi dell'ondata 2 (TRAGUARDI, VETRINA, …)
    assert.deepEqual([...onProfiles].sort(), [...PROFILES_GRANTS].sort());
    assert.equal(new Set(onProfiles).size, onProfiles.length, "grant ripetute");
    assert.ok(stmts.lastIndexOf(PROFILES_REVOKE) >= 0);
    for (const g of PROFILES_GRANTS.slice(1)) assert.ok(stmts.lastIndexOf(PROFILES_REVOKE) < stmts.indexOf(g), g);
  });
  test("la grant della vetrina è per colonna e non tocca ruolo, tag, nome utente né id", () => {
    const cols = /^grant update \(([^)]+)\) on public\.profiles to authenticated;$/.exec(VETRINA_GRANT)?.[1].split(", ") ?? [];
    assert.ok(cols.length > 0);
    for (const reserved of ["role", "badge", "username", "discord_id", "id", "created_at", "avatar_url", "showcase_updated_at"]) assert.ok(!cols.includes(reserved), reserved);
  });
  test("due parti: lo schema di sempre (con la correzione) e i pacchetti creator", () => {
    const parts = splitSchema(schema);
    assert.equal(parts.length, 2);
    assert.equal(parts[0].sql + parts[1].sql, schema);
    assert.ok(parts[1].sql.startsWith(CREATOR_MARKER));
    // la correzione dei profili sta nella prima parte, che db-migrate applica e conferma per prima (anche da sola, --base)
    assert.ok(sqlStatements(parts[0].sql).includes(PROFILES_REVOKE));
    assert.deepEqual(schemaProblems(parts[0].sql), []);
  });
});

describe("rifiutato: tutto quello che riaprirebbe i profili", () => {
  const cases = {
    "grant di update sull'intera tabella (lo schema di prima di 6c6756d)": withTail("grant update on public.profiles to authenticated;"),
    "grant di update su più righe": withTail("grant\n  update\n  on table public.profiles\n  to authenticated;"),
    "grant per colonna su role e badge": withTail("grant update (role, badge) on public.profiles to authenticated;"),
    "grant per colonna su display_name": withTail("grant update (display_name) on public.profiles to authenticated;"),
    "grant per colonna su show_stats insieme al ruolo": withTail("grant update (show_stats, role) on public.profiles to authenticated;"),
    "grant per colonna su show_stats ad anon": withTail("grant update (show_stats) on public.profiles to anon;"),
    "grant di insert o delete": withTail("grant insert, delete on public.profiles to authenticated;"),
    "grant all su più tabelle insieme": withTail("grant all on public.tier_lists, public.profiles to authenticated;"),
    "grant su tutte le tabelle dello schema": withTail("grant update on all tables in schema public to authenticated;"),
    "privilegi di default sulle tabelle": withTail("alter default privileges in schema public grant update on tables to authenticated;"),
    "revoke di tutte le tabelle dopo la grant per colonna": withTail("revoke all on all tables in schema public from authenticated;"),
    "revoke su profiles dopo la grant per colonna, su più righe": withTail("revoke update\n  on public.profiles\n  from authenticated;"),
    "revoke tolta": replaced(`${PROFILES_REVOKE};`, "select 1;"),
    "grant per colonna prima della revoke": withTail(`${PROFILES_REVOKE};`),
    "trigger senza il controllo del ruolo": replaced("new.role is distinct from old.role", "false"),
    "trigger senza il controllo del nome utente": replaced("new.username is distinct from old.username", "false"),
    "trigger ridefinito dopo, alla vecchia maniera": withTail(
      "create or replace function public.protect_profile_badge()\nreturns trigger language plpgsql as $$\nbegin\n  if new.badge is distinct from old.badge and auth.uid() is not null and not public.is_admin() then\n    raise exception 'badge is assigned by staff';\n  end if;\n  return new;\nend $$;",
    ),
    "trigger tolto e non rimesso": withTail("drop trigger if exists profiles_protect_badge on public.profiles;"),
    "corpo di funzione con un dollaro solo (6c6756d)": replaced("returns trigger language plpgsql as $$\nbegin\n  -- il ruolo (badge)".replace(/\n/g, schema.includes("\r\n") ? "\r\n" : "\n"), "returns trigger language plpgsql as $\nbegin\n  -- il ruolo (badge)"),
  };
  for (const [name, sql] of Object.entries(cases)) {
    test(name, () => {
      assert.notDeepEqual(schemaProblems(sql), [], "db-migrate lo applicherebbe");
    });
  }
  test("revoke su profiles accodata dopo il blocco della vetrina (cancellerebbe anche la sua grant)", () => {
    assert.notDeepEqual(schemaProblems(`${full}\nrevoke update on public.profiles from authenticated;\n`), []);
  });
  test("grant della vetrina prima della revoke di 6c6756d", () => {
    const sql = replaced(`${PROFILES_REVOKE};`, `${VETRINA_GRANT}\n${PROFILES_REVOKE};`);
    assert.ok(schemaProblems(sql).some((p) => p.includes("revoke")));
  });
  test("una colonna in più nella grant della vetrina (per esempio badge) non passa", () => {
    const widened = VETRINA_GRANT.replace("(avatar_path,", "(badge, avatar_path,");
    assert.notEqual(widened, VETRINA_GRANT);
    assert.notDeepEqual(schemaProblems(withTail(widened)), []);
  });
  test("la grant per colonna nella prima parte non basta a far passare la grant sull'intera tabella", () => {
    const sql = replaced(COLUMN_GRANT, `${COLUMN_GRANT}\ngrant update on public.profiles to authenticated;`);
    assert.ok(schemaProblems(sql).some((p) => p.startsWith("grant non prevista")));
  });
  test("revoke su profiles accodata dopo i file dell'ondata 2 (cancellerebbe anche la grant di show_stats)", () => {
    assert.notDeepEqual(schemaProblems(`${full}\nrevoke update on public.profiles from authenticated;\n`), []);
  });
  test("grant di show_stats prima della revoke di 6c6756d", () => {
    const sql = replaced(`${PROFILES_REVOKE};`, `grant update (show_stats) on public.profiles to authenticated;\n${PROFILES_REVOKE};`);
    assert.ok(schemaProblems(sql).some((p) => p.includes("revoke")));
  });
});

describe("file dell'ondata 2 (supabase/wave2-*.sql)", () => {
  test("già accodati a schema.sql non si contano due volte", () => {
    const block = "-- blocco\ngrant update (show_stats) on public.profiles to authenticated;\n";
    const appended = `${schema}\r\n${block.replace(/\n/g, "\r\n")}`;
    assert.equal(withPendingBlocks(appended, [block]), appended);
    assert.equal(withPendingBlocks(schema, [block]), `${schema}\n${block}`);
    assert.equal(withPendingBlocks(schema, ["  \n"]), schema);
  });
});
