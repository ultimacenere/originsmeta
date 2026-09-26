/**
 * Test del controllo di schema.sql (`schema-guard.mjs`), quello che scripts/db-migrate.mjs fa prima di collegarsi:
 * `node --test scripts/schema-guard.test.mjs`. Lo schema vero passa; ogni modo di riaprire la scrittura dei profili
 * agli utenti (commit 6c6756d) viene rifiutato. Mai la rete.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CREATOR_MARKER, PROFILES_GRANTS, PROFILES_REVOKE, schemaProblems, splitSchema, sqlStatements } from "./schema-guard.mjs";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const COLUMN_GRANT = "grant update (bio, links, content_langs) on public.profiles to authenticated;";

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
  test("si può applicare: nessun problema", () => {
    assert.deepEqual(schemaProblems(schema), []);
  });
  test("le sole grant su public.profiles sono quelle ammesse, la revoke c'è e viene prima della grant per colonna", () => {
    const stmts = sqlStatements(schema);
    const onProfiles = stmts.filter((s) => /^grant\b/.test(s) && /\bpublic\.profiles\b/.test(s));
    assert.deepEqual(onProfiles, PROFILES_GRANTS);
    assert.ok(stmts.lastIndexOf(PROFILES_REVOKE) >= 0);
    assert.ok(stmts.lastIndexOf(PROFILES_REVOKE) < stmts.indexOf(PROFILES_GRANTS[1]));
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
    "corpo di funzione con un dollaro solo (6c6756d)": replaced("returns trigger language plpgsql as $$\nbegin\n  -- il tag autore".replace(/\n/g, schema.includes("\r\n") ? "\r\n" : "\n"), "returns trigger language plpgsql as $\nbegin\n  -- il tag autore"),
  };
  for (const [name, sql] of Object.entries(cases)) {
    test(name, () => {
      assert.notDeepEqual(schemaProblems(sql), [], "db-migrate lo applicherebbe");
    });
  }
  test("la grant per colonna nella prima parte non basta a far passare la grant sull'intera tabella", () => {
    const sql = replaced(COLUMN_GRANT, `${COLUMN_GRANT}\ngrant update on public.profiles to authenticated;`);
    assert.ok(schemaProblems(sql).some((p) => p.startsWith("grant non prevista")));
  });
});
