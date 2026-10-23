/**
 * Test del cambio di nome mostrato e nome utente (23/10/2026) con il runner integrato di Node:
 * `node --test src/lib/community/profileNames.test.ts`.
 *
 * - Regole pure (profileNames.ts): pulizia, forma, nomi riservati, attesa dei 30 giorni, lettura della risposta.
 * - Lo stesso blocco "23/10/2026: NOME UTENTE" di schema.sql: espressioni, elenchi e numeri uguali al codice; storico
 *   chiuso ai client; la funzione di scrittura eseguibile solo da authenticated; nessuna grant su public.profiles; il
 *   trigger dei campi riservati lascia passare il nome utente solo con l'impostazione che scrive profile_set_names.
 * - Etichette nelle sette lingue (profileNameLabels.ts): stesse chiavi e stessi segnaposto, tipografia francese.
 * - Nomi utente scritti nel codice (pinnedUsernames.ts).
 *
 * I moduli sono scritti per Next (import senza estensione): il test registra un hook di risoluzione dei moduli di Node
 * (`module.registerHooks`, come deckComments.test.ts) che aggiunge `.ts` agli import senza estensione.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

const N: typeof import("./profileNames") = await import("./profileNames.ts" as string);
const P: typeof import("./pinnedUsernames") = await import("./pinnedUsernames.ts" as string);
const { profileNameLabels, fillName }: typeof import("../profileNameLabels") = await import("../profileNameLabels.ts" as string);
const { locales }: typeof import("../i18n") = await import("../i18n.ts" as string);
const { sqlStatements } = (await import(new URL("../../../scripts/schema-guard.mjs", import.meta.url).href)) as {
  sqlStatements: (sql: string) => string[];
};

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const schema = read("../../../supabase/schema.sql");
const START = "-- ===== 23/10/2026: NOME UTENTE =====";
const block = (() => {
  const from = schema.indexOf(START);
  const next = schema.indexOf("\n-- ===== ", from + START.length);
  return from < 0 ? "" : schema.slice(from, next < 0 ? undefined : next);
})();
const stmts = sqlStatements(block);
/** L'istruzione del blocco che comincia così (normalizzata: minuscole, spazi singoli). */
const one = (re: RegExp) => {
  const found = stmts.filter((s) => re.test(s));
  assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
  return found[0];
};
/** Il testo originale (maiuscole e escape compresi) della definizione di una funzione nel blocco. */
const rawFn = (name: string) => {
  const at = block.indexOf(`create or replace function public.${name}(`);
  assert.ok(at >= 0, name);
  return block.slice(at, block.indexOf("$$;", block.indexOf("$$", at) + 2) + 3);
};
/** Gli elementi di un `array['a', 'b']` dentro un testo. */
const sqlArray = (text: string) => {
  const m = /array\[([^\]]+)\]/.exec(text);
  assert.ok(m, text);
  return m[1].split(",").map((x) => x.trim().replace(/^'|'$/g, ""));
};

describe("nome utente: regole", () => {
  test("pulizia: spazi, @ e maiuscole", () => {
    assert.equal(N.cleanUsername("  @@EagleAxe93 "), "eagleaxe93");
    assert.equal(N.cleanUsername(undefined), "");
  });
  test("forma", () => {
    for (const ok of ["abc", "eagleaxe93", "fabio-rossi", "a1b", "x".repeat(N.USERNAME_MAX)]) assert.ok(N.usernameShapeOk(ok), ok);
    for (const bad of ["ab", "-abc", "abc-", "a--b", "a_b", "a b", "àbc", "ABC", "x".repeat(N.USERNAME_MAX + 1)]) assert.ok(!N.usernameShapeOk(bad), bad);
    assert.equal(N.USERNAME_MIN, 3);
  });
  test("riservati, tranne per lo staff", () => {
    for (const r of ["bot-12", "bot-3-1", "staff", "admin", "originsmeta-fan", "origins-tcg", "koin-games-it", "the-originsmeta"]) {
      assert.equal(N.checkUsername(r), "reserved", r);
      assert.equal(N.checkUsername(r, true), "ok", r);
    }
    for (const ok of ["robot-1", "bots-fan", "staffordshire-x", "koinonia"]) assert.equal(N.checkUsername(ok), "ok", ok);
    assert.equal(N.checkUsername("a--b", true), "invalid");
  });
  test("30 giorni fra due cambi", () => {
    const now = Date.parse("2026-10-23T12:00:00Z");
    assert.equal(N.nextUsernameChange(null, now), null);
    assert.equal(N.nextUsernameChange("2026-09-01T00:00:00Z", now), null);
    assert.equal(N.nextUsernameChange("2026-10-20T12:00:00Z", now)?.toISOString(), "2026-11-19T12:00:00.000Z");
    assert.equal(N.nextUsernameChange("non è una data", now), null);
  });
});

describe("nome mostrato: regole", () => {
  test("pulizia: spazi in fila, a capo, forma composta", () => {
    assert.equal(N.cleanDisplayName("  Fabio \t  Rossi\n"), "Fabio Rossi");
    assert.equal(N.cleanDisplayName("Jose\u0301"), "José");
  });
  test("forma", () => {
    for (const ok of ["Al", "Fabio Rossi", "Pierluigi 🎴 Cella", "Ünïcødé", "Влад", "x".repeat(N.DISPLAY_NAME_MAX)]) assert.equal(N.checkDisplayName(ok), "ok", ok);
    for (const bad of ["x", "", "x".repeat(N.DISPLAY_NAME_MAX + 1), "ab\u200bcd", "ab\u202ecd", "\u3164\u3164", "a\u0007b", " ab", "a  b"]) assert.equal(N.checkDisplayName(bad), "invalid", JSON.stringify(bad));
    // la lunghezza in caratteri, non in unità UTF-16
    assert.equal(N.checkDisplayName("🎴".repeat(N.DISPLAY_NAME_MAX)), "ok");
  });
  test("parole dello staff e del gioco, tranne per lo staff", () => {
    for (const r of ["Staff", "OriginsMeta Fan", "Koin Games", "Admin", "ＳＴＡＦＦ", "the moderator", "Origins TCG Team", "Mod"]) {
      assert.equal(N.checkDisplayName(r), "reserved", r);
      assert.equal(N.checkDisplayName(r, true), "ok", r);
    }
    for (const ok of ["Mod Luca", "Origins fan", "Koinonia", "Luca"]) assert.equal(N.checkDisplayName(ok), "ok", ok);
  });
});

describe("risposta di profile_set_names", () => {
  test("esiti noti", () => {
    assert.deepEqual(N.parseSetNamesResult({ ok: true, changed: true, display: "ok", username: "same", next_change: null }), { ok: true, changed: true, display: "ok", username: "same", nextChange: null });
    assert.deepEqual(N.parseSetNamesResult({ ok: false, error: null, display: "same", username: "too_soon", next_change: "2026-11-22T10:00:00+00:00" }), {
      ok: false,
      error: null,
      display: "same",
      username: "too_soon",
      nextChange: "2026-11-22T10:00:00+00:00",
    });
    assert.deepEqual(N.parseSetNamesResult({ ok: false, error: "not_logged_in" }), { ok: false, error: "not_logged_in" });
  });
  test("un esito sconosciuto è un errore", () => {
    for (const bad of [null, [], "ok", { ok: true, display: "boh", username: "ok" }, { display: "ok", username: "ok" }]) assert.deepEqual(N.parseSetNamesResult(bad), { ok: false, error: "bad_response" });
  });
  test("ogni esito dell'SQL è conosciuto dal codice", () => {
    const fn = rawFn("profile_set_names");
    const disp = [...new Set([...fn.matchAll(/s_disp := '([a-z_]+)'/g)].map((m) => m[1]))].sort();
    const user = [...new Set([...fn.matchAll(/s_user := '([a-z_]+)'/g)].map((m) => m[1]))].sort();
    assert.deepEqual(disp, ["invalid", "lookalike", "ok", "reserved", "same", "too_fast"]);
    assert.deepEqual(user, ["invalid", "ok", "reserved", "same", "taken", "too_soon"]);
    const known = (r: ReturnType<typeof N.parseSetNamesResult>) => r.ok || r.error !== "bad_response";
    for (const d of disp) assert.ok(known(N.parseSetNamesResult({ ok: false, error: null, display: d, username: "same" })), d);
    for (const u of user) assert.ok(known(N.parseSetNamesResult({ ok: false, error: null, display: "same", username: u })), u);
  });
  test("migrazione mancante", () => {
    for (const code of ["PGRST202", "42883", "42703", "42P01"]) assert.ok(N.namesMigrationMissing({ code }), code);
    assert.ok(!N.namesMigrationMissing({ code: "23505" }));
    assert.ok(!N.namesMigrationMissing(null));
  });
});

describe("blocco NOME UTENTE di schema.sql", () => {
  test("il blocco c'è, in fondo ai pacchetti", () => {
    assert.ok(block.length > 1000);
    assert.ok(schema.indexOf(START) > schema.indexOf("-- ===== 22/10/2026: NUMERI DELLA DASHBOARD ====="));
  });
  test("forma del nome utente uguale al codice", () => {
    const fn = rawFn("profile_username_ok");
    assert.ok(fn.includes(`u ~ '${N.USERNAME_RE}'`), fn);
    assert.ok(fn.includes("position('--' in u) = 0"), fn);
  });
  test("nomi utente riservati uguali al codice", () => {
    const fn = rawFn("profile_username_reserved");
    assert.ok(fn.includes(`u ~ '${N.BOT_USERNAME_RE}'`), fn);
    assert.deepEqual(sqlArray(fn), [...N.RESERVED_USERNAMES]);
    assert.ok(fn.includes(`replace(u, '-', '') ~ '(${N.RESERVED_NAME_PARTS.join("|")})'`), fn);
    // ogni nome riservato ha la forma di un nome utente (uno più corto non servirebbe: la forma lo rifiuta già)
    for (const r of N.RESERVED_USERNAMES) assert.ok(N.usernameShapeOk(r), r);
  });
  test("nome mostrato: lunghezza, caratteri vietati e parole riservate uguali al codice", () => {
    const ok = rawFn("profile_display_name_ok");
    assert.ok(ok.includes(`char_length(n) between ${N.DISPLAY_NAME_MIN} and ${N.DISPLAY_NAME_MAX}`), ok);
    assert.ok(ok.includes(`n !~ '${N.DISPLAY_NAME_BAD_CHARS}'`), ok);
    const res = rawFn("profile_display_name_reserved");
    assert.deepEqual(sqlArray(res), [...N.RESERVED_DISPLAY_WORDS]);
    assert.ok(res.includes(`~ '(${N.RESERVED_DISPLAY_PARTS.join("|")})'`), res);
    assert.ok(res.includes(`~ '(${N.RESERVED_NAME_PARTS.join("|")})'`), res);
    assert.ok(rawFn("profile_display_name_key").includes("regexp_replace(lower(normalize(coalesce(n, ''), NFKC)), '[^a-z0-9]', '', 'g')"));
  });
  test("attese uguali al codice", () => {
    const fn = rawFn("profile_set_names");
    assert.equal((fn.match(new RegExp(`interval '${N.USERNAME_CHANGE_DAYS} days'`, "g")) ?? []).length, 2, "30 giorni: il prossimo cambio e la risposta");
    assert.ok(fn.includes(`interval '${N.DISPLAY_NAME_MIN_INTERVAL_S} seconds'`), fn);
    assert.ok(!/interval '\d+ days'/.test(fn.replace(new RegExp(`interval '${N.USERNAME_CHANGE_DAYS} days'`, "g"), "")), "un'altra attesa in giorni");
  });
  test("lo storico dei nomi è chiuso ai client e si cancella con l'account", () => {
    const table = one(/^create table if not exists public\.profile_username_history /);
    assert.ok(table.includes("references public.profiles(id) on delete cascade"), table);
    assert.ok(stmts.includes("alter table public.profile_username_history enable row level security"));
    assert.ok(stmts.includes("revoke all on public.profile_username_history from anon, authenticated"));
    assert.ok(!stmts.some((s) => /^grant\b/.test(s) && s.includes("profile_username_history")), "nessuna grant sullo storico");
    assert.ok(!stmts.some((s) => /^create policy\b/.test(s)), "nessuna policy: nessun client legge");
  });
  test("nessuna grant né revoke su public.profiles nel blocco", () => {
    for (const s of stmts) assert.ok(!(/^(grant|revoke)\b/.test(s) && /\bon (table )?public\.profiles\b/.test(s)), s);
  });
  test("funzioni: security definer con search_path, scrittura solo per authenticated", () => {
    const set = one(/^create or replace function public\.profile_set_names\(/);
    assert.ok(set.includes("security definer set search_path = public, pg_temp"), set);
    assert.ok(stmts.includes("revoke all on function public.profile_set_names(text, text) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.profile_set_names(text, text) to authenticated"));
    const moved = one(/^create or replace function public\.profile_username_moved\(/);
    assert.ok(moved.includes("stable security definer set search_path = public, pg_temp"), moved);
    assert.ok(stmts.includes("grant execute on function public.profile_username_moved(text) to anon, authenticated"));
    // le regole interne non si chiamano dall'API
    for (const f of ["profile_username_ok(text)", "profile_username_reserved(text)", "profile_display_name_key(text)", "profile_display_name_ok(text)", "profile_display_name_reserved(text)", "profile_username_free()"]) {
      assert.ok(stmts.includes(`revoke all on function public.${f} from public, anon, authenticated`), f);
      assert.ok(!stmts.some((s) => s.startsWith(`grant execute on function public.${f}`)), f);
    }
  });
  test("tutto o niente: si scrive solo dopo che tutti e due i campi vanno bene", () => {
    const fn = one(/^create or replace function public\.profile_set_names\(/);
    const guard = fn.indexOf("if s_disp not in ('same', 'ok') or s_user not in ('same', 'ok') then");
    assert.ok(guard > 0);
    const firstWrite = Math.min(...["insert into", "update public.profiles", "delete from"].map((w) => fn.indexOf(w)).filter((i) => i >= 0));
    assert.ok(firstWrite > guard, "una scrittura prima del controllo dei due campi");
    // il nome riservato e i 30 giorni non valgono per lo staff, la forma e i nomi presi sì
    assert.ok(fn.includes("v_staff := v_row.role = 'admin' or v_row.badge = 'staff'"));
    assert.ok(fn.includes("elsif not v_staff and public.profile_username_reserved(v_user) then"));
    assert.ok(fn.includes("v_next := case when v_staff or v_row.username_changed_at is null then null"));
    assert.ok(fn.includes("for update"), "la riga si blocca durante il cambio");
  });
  test("il trigger dei campi riservati apre il nome utente solo a profile_set_names", () => {
    const flag = "current_setting('originsmeta.username_change', true) is distinct from old.id::text";
    const defs = sqlStatements(schema).filter((s) => /^create (or replace )?function public\.protect_profile_badge\(/.test(s));
    assert.ok(defs.at(-1)?.includes(`(new.username is distinct from old.username and ${flag})`), defs.at(-1));
    // l'impostazione la scrive solo profile_set_names, e la spegne subito dopo l'UPDATE
    const writers = sqlStatements(schema).filter((s) => s.includes("originsmeta.username_change") && !/^create (or replace )?function public\.protect_profile_badge\(/.test(s));
    assert.equal(writers.length, 1);
    assert.ok(writers[0].startsWith("create or replace function public.profile_set_names("));
    const on = writers[0].indexOf("perform set_config('originsmeta.username_change', v_uid::text, true)");
    const upd = writers[0].indexOf("update public.profiles set username = v_user", on);
    const off = writers[0].indexOf("perform set_config('originsmeta.username_change', '', true)", upd);
    assert.ok(on > 0 && upd > on && off > upd, "accesa, UPDATE, spenta");
  });
  test("alla registrazione un nome lasciato da un altro non si assegna", () => {
    assert.ok(stmts.includes("create trigger profiles_username_free before insert on public.profiles for each row execute function public.profile_username_free()"));
  });
});

describe("etichette", () => {
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flat = (o: unknown, prefix = ""): Record<string, string> =>
    Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>((acc, [k, v]) => {
      if (typeof v === "string") acc[prefix + k] = v;
      else Object.assign(acc, flat(v, `${prefix}${k}.`));
      return acc;
    }, {});
  const en = flat(profileNameLabels.en);
  test("sette lingue, stesse chiavi e stessi segnaposto dell'inglese", () => {
    assert.deepEqual(Object.keys(profileNameLabels).sort(), [...locales].sort());
    for (const l of locales) {
      const t = flat(profileNameLabels[l]);
      assert.deepEqual(Object.keys(t).sort(), Object.keys(en).sort(), l);
      for (const [k, v] of Object.entries(t)) {
        assert.ok(v.trim().length > 0, `${l}.${k} vuota`);
        assert.deepEqual(placeholders(v), placeholders(en[k]), `${l}.${k}`);
      }
    }
  });
  test("i numeri dell'informativa sono quelli del codice", () => {
    for (const l of locales) assert.ok(profileNameLabels[l].privacy.includes(String(N.USERNAME_CHANGE_DAYS)), l);
  });
  test("francese: spazio insecabile prima di : ; ? ! e dentro « »", () => {
    for (const [k, v] of Object.entries(flat(profileNameLabels.fr))) {
      assert.ok(!/ [:;?!]/.test(v), `fr.${k}: spazio normale prima della punteggiatura`);
      assert.ok(!/«(?! )|(?<! )»/.test(v), `fr.${k}: virgolette senza spazio insecabile`);
    }
  });
  test("fillName riempie i segnaposto e lascia quelli sconosciuti", () => {
    assert.equal(fillName("Da {min} a {max} ({x})", { min: 2, max: 40 }), "Da 2 a 40 ({x})");
  });
});

describe("nomi utente scritti nel codice", () => {
  test("canale ufficiale e autori della redazione sempre, i cast fino alla fine del loro periodo", () => {
    const oct24 = Date.parse("2026-10-24T12:00:00Z");
    const nov = Date.parse("2026-11-01T12:00:00Z");
    assert.ok(P.usernamePinned("originstcg", nov));
    assert.ok(P.usernamePinned("luigidavdasragoni", nov));
    assert.ok(P.usernamePinned("vint3n", oct24));
    assert.ok(!P.usernamePinned("vint3n", nov));
    assert.ok(!P.usernamePinned("coachcrono", oct24));
    assert.ok(!P.usernamePinned("fabio-rossi", oct24));
    assert.ok(!P.usernamePinned(null, oct24));
  });
});
