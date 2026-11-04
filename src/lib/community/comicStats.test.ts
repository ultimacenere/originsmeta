/**
 * Test delle statistiche dei fumetti per chi li disegna (`comicStats.ts`, 02/11/2026) con il runner integrato di Node:
 * `node --test src/lib/community/comicStats.test.ts`. Controlla anche che il blocco "02/11/2026: STATISTICHE DEI
 * FUMETTI" di supabase/schema.sql dica le stesse cose del codice (tipi di contatore, lingue, tetto, chiave).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
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

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const S: typeof import("./comicStats") = await import("./comicStats.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("./comics") = await import("./comics.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../comicStatsLabels") = await import("../comicStatsLabels.ts");
const G: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const row = (comic_id: string, day: string, lang: string, views = 0, reads = 0) => ({ comic_id, day, lang, views, reads }) as ReturnType<typeof S.normalizeComicStatRow> & object;

describe("tipi di contatore e lingue", () => {
  test("i due tipi e le colonne della tabella, come in bump_comic_stat", () => {
    assert.deepEqual([...S.COMIC_STAT_KINDS], ["view", "read"]);
    assert.deepEqual(S.COMIC_STAT_COLUMN, { view: "views", read: "reads" });
    assert.equal(S.isComicStatKind("read"), true);
    assert.equal(S.isComicStatKind("code"), false);
  });
  test("le lingue sono quelle dei fumetti", () => {
    assert.deepEqual([...S.COMIC_STAT_LANGS], [...C.COMIC_LANGS]);
    assert.equal(S.isComicStatLang("ru"), true);
    assert.equal(S.isComicStatLang("xx"), false);
  });
  test("chiave della memoria di sessione separata dai mazzi", () => {
    assert.equal(S.comicSeenKey("cap-1", "it", "view"), "comic:cap-1:it|view");
    assert.notEqual(S.comicSeenKey("cap-1", "it", "view"), S.comicSeenKey("cap-1", "en", "view"));
  });
});

describe("righe", () => {
  test("una riga buona passa, i numeri strani diventano 0", () => {
    assert.deepEqual(S.normalizeComicStatRow({ comic_id: "a", day: "2026-11-02", lang: "it", views: "3", reads: -1 }), { comic_id: "a", day: "2026-11-02", lang: "it", views: 3, reads: 0 });
  });
  test("giorno o lingua rotti: null", () => {
    assert.equal(S.normalizeComicStatRow({ comic_id: "a", day: "ieri", lang: "it" }), null);
    assert.equal(S.normalizeComicStatRow({ comic_id: "a", day: "2026-11-02", lang: "jp" }), null);
    assert.equal(S.normalizeComicStatRow(null), null);
  });
});

describe("riepiloghi", () => {
  const today = "2026-11-02";
  const rows = [
    row("a", "2026-11-02", "en", 10, 4),
    row("a", "2026-11-01", "it", 5, 1),
    row("a", "2026-10-10", "es", 7, 7), // dentro i 30 giorni (dal 04/10), fuori dai 7
    row("a", "2026-09-30", "en", 100, 50), // fuori dai 30 giorni
    row("b", "2026-11-02", "fr", 1, 0),
    row("z", "2026-11-02", "en", 99, 99), // fumetto non richiesto
  ];
  test("finestre, lingue dalla più vista, primo giorno", () => {
    const per = S.summarizeComics(["a", "b"], rows, today);
    const a = per.get("a")!;
    assert.deepEqual(a.views, { d7: 15, d30: 22, total: 122 });
    assert.deepEqual(a.reads, { d7: 5, d30: 12, total: 62 });
    assert.equal(a.firstDay, "2026-09-30");
    assert.deepEqual(
      a.langs.map((l) => [l.lang, l.views.total, l.views.d30]),
      [
        ["en", 110, 10],
        ["es", 7, 7],
        ["it", 5, 5],
      ],
    );
    const b = per.get("b")!;
    assert.deepEqual(b.views, { d7: 1, d30: 1, total: 1 });
    assert.deepEqual(b.langs.map((l) => l.lang), ["fr"]);
    assert.equal(per.has("z"), false);
  });
  test("serie: oggi è l'ultima casella, ieri la penultima", () => {
    const a = S.summarizeComics(["a"], rows, today).get("a")!;
    assert.equal(a.series.views.length, 30);
    assert.equal(a.series.views.at(-1), 10);
    assert.equal(a.series.views.at(-2), 5);
    assert.equal(a.series.reads.at(-1), 4);
    assert.equal(a.series.views.reduce((s, x) => s + x, 0), 22);
  });
  test("la somma di più fumetti unisce le lingue", () => {
    const per = S.summarizeComics(["a", "b"], rows, today);
    const all = S.combineComicSummaries([...per.values()]);
    assert.deepEqual(all.views, { d7: 16, d30: 23, total: 123 });
    assert.deepEqual(
      all.langs.map((l) => [l.lang, l.views.total]),
      [
        ["en", 110],
        ["es", 7],
        ["it", 5],
        ["fr", 1],
      ],
    );
    assert.equal(all.series.views.at(-1), 11);
    assert.equal(all.firstDay, "2026-09-30");
    assert.equal(S.combineComicSummaries([]).firstDay, null);
  });
  test("quota di letture complete", () => {
    assert.equal(S.readRate(0, 0), null);
    assert.equal(S.readRate(4, 10), 40);
    assert.equal(S.readRate(12, 10), 100);
    assert.equal(S.readRate(1, 3), 33);
  });
  test("classifica dello staff: solo gli ultimi 30 giorni, dal più visto", () => {
    const ranked = S.rankComics(rows, today);
    assert.deepEqual(
      ranked.map((r) => [r.comic_id, r.views30, r.views7, r.reads30]),
      [
        ["z", 99, 99, 99],
        ["a", 22, 15, 12],
        ["b", 1, 1, 0],
      ],
    );
    assert.equal(S.rankComics(rows, today, 1).length, 1);
    assert.deepEqual(S.rankComics([row("a", "2026-09-01", "en", 5, 5)], today), []);
  });
});

describe("etichette nelle otto lingue", () => {
  const locales = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
  test("ogni lingua ha le chiavi dell'inglese e il testo della privacy", () => {
    const keys = Object.keys(L.comicStatsLabels.en).sort();
    for (const l of locales) {
      assert.deepEqual(Object.keys(L.comicStatsLabels[l]).sort(), keys, l);
      for (const [k, v] of Object.entries(L.comicStatsLabels[l])) assert.ok(typeof v === "string" && v.trim(), `${l}.${k}`);
      assert.ok(L.comicStatsPrivacy[l].length > 200, `privacy ${l}`);
      assert.match(L.comicStatsPrivacy[l], /Supabase/);
    }
  });
  test("i segnaposto sono gli stessi dell'inglese", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const l of locales) {
      for (const k of Object.keys(L.comicStatsLabels.en) as (keyof typeof L.comicStatsLabels.en)[]) {
        assert.deepEqual(ph(L.comicStatsLabels[l][k]), ph(L.comicStatsLabels.en[k]), `${l}.${k}`);
      }
    }
  });
});

describe("database: blocco STATISTICHE DEI FUMETTI di supabase/schema.sql", () => {
  const MARKER = "-- ===== 02/11/2026: STATISTICHE DEI FUMETTI =====";
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  const stmts = G.sqlStatements(block);
  const one = (re: RegExp) => {
    const found = stmts.filter((s) => re.test(s));
    assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
    return found[0];
  };

  test("il blocco c'è, dopo FUMETTI e STATS, e non tocca public.profiles", () => {
    assert.ok(at > 0, "manca il blocco");
    assert.ok(at > schema.indexOf("-- ===== 29/09/2026: FUMETTI ====="));
    assert.ok(at > schema.indexOf("-- ===== 26/09/2026: STATS ====="));
    assert.deepEqual(G.schemaProblems(schema), []);
    assert.deepEqual(G.singleDollarLines(block), []);
    assert.deepEqual(
      stmts.filter((s) => /^(grant|revoke)\b/.test(s) && /\bpublic\.profiles\b/.test(s)),
      [],
    );
  });

  test("tabella: chiave (fumetto, giorno, lingua), lingue e colonne come il codice", () => {
    const table = one(/^create table if not exists public\.comic_stats_daily\b/);
    assert.match(table, /primary key \(comic_id, day, lang\)/);
    assert.match(table, /references public\.community_comics\(id\) on delete cascade/);
    const langs = /lang text not null check \(lang in \(([^)]*)\)\)/.exec(table);
    assert.ok(langs, "vincolo sulla lingua");
    assert.deepEqual(
      langs![1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")),
      [...S.COMIC_STAT_LANGS],
    );
    for (const col of Object.values(S.COMIC_STAT_COLUMN)) assert.match(table, new RegExp(`\\b${col} int not null default 0 check \\(${col} >= 0\\)`));
    assert.match(one(/^alter table public\.comic_stats_daily enable row level security/), /row level security/);
  });

  test("lettura solo per chi disegna e per lo staff, nessuna scrittura diretta", () => {
    const policy = one(/^create policy "comic stats: owners and staff read"/);
    assert.match(policy, /for select to authenticated/);
    assert.match(policy, /deck_stats_is_staff\(\)\) or public\.comic_stats_owns\(comic_id\)/);
    assert.equal(stmts.filter((s) => /^create policy/.test(s)).length, 1, "una sola policy (solo lettura)");
    assert.match(one(/^revoke all on public\.comic_stats_daily from anon, authenticated/), /revoke/);
    assert.match(one(/^grant select on public\.comic_stats_daily to authenticated/), /grant select/);
    const owns = one(/^create or replace function public\.comic_stats_owns\(/);
    assert.match(owns, /security definer set search_path = public, pg_temp/);
    assert.match(owns, /c\.owner = auth\.uid\(\)/);
  });

  test("bump_comic_stat: tipi, lingue, solo pubblicati, mai l'autore, tetto come il codice", () => {
    const fn = one(/^create or replace function public\.bump_comic_stat\(p_slug text, p_lang text, p_kind text\)/);
    assert.match(fn, /security definer set search_path = public, pg_temp/);
    const kinds = /p_kind not in \(([^)]*)\)/.exec(fn);
    assert.deepEqual(kinds![1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")), [...S.COMIC_STAT_KINDS]);
    const langs = /p_lang not in \(([^)]*)\)/.exec(fn);
    assert.deepEqual(langs![1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")), [...S.COMIC_STAT_LANGS]);
    assert.match(fn, /c\.status = 'published'/);
    assert.match(fn, /if cowner = auth\.uid\(\) then return; end if;/);
    assert.match(fn, new RegExp(`cap constant int := ${S.COMIC_STAT_CAP};`));
    assert.match(fn, /on conflict \(comic_id, day, lang\) do update set/);
    assert.match(one(/^grant execute on function public\.bump_comic_stat\(text, text, text\) to anon, authenticated/), /anon, authenticated/);
  });
});
