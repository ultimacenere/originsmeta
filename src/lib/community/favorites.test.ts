/**
 * Test di "Salva" e "Di tendenza" (blocco PREFERITI E TENDENZA, 30/09/2026): `node --test src/lib/community/favorites.test.ts`.
 * Regole pure (favorites.ts), SQL uguale alle costanti, etichette nelle tre lingue (favoriteLabels.ts).
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

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const F: typeof import("./favorites") = await import("./favorites.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../favoriteLabels") = await import("../favoriteLabels.ts");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

describe("regole pure", () => {
  test("popolarità per mazzo, righe non valide scartate", () => {
    const m = F.popularityMap(
      [
        { deck_id: "a", score: "12.5" },
        { deck_id: "b", score: 0 },
        { deck_id: "", score: 3 },
      ],
      [
        { deck_id: "a", favorites: 2 },
        { deck_id: "c", favorites: "4" },
        { deck_id: "d", favorites: 1.5 },
      ],
    );
    assert.deepEqual(m.get("a"), { trend: 12.5, favorites: 2 });
    assert.deepEqual(m.get("c"), { trend: 0, favorites: 4 });
    assert.equal(m.has("b"), false);
    assert.equal(m.has("d"), false);
  });
  test("ordine Di tendenza e Più salvati, a pari merito il più recente", () => {
    const decks = [
      { name: "vecchio fermo", updated: "2026-09-01", created: "2026-09-01" },
      { name: "nuovo fermo", updated: "2026-09-20", created: "2026-09-20" },
      { name: "caldo", trend: 30, favorites: 1, updated: "2026-09-10", created: "2026-09-10" },
      { name: "salvato", trend: 5, favorites: 9, updated: "2026-09-05", created: "2026-09-05" },
    ];
    assert.deepEqual([...decks].sort(F.compareTrending).map((d) => d.name), ["caldo", "salvato", "nuovo fermo", "vecchio fermo"]);
    assert.deepEqual([...decks].sort(F.compareSaved).map((d) => d.name), ["salvato", "caldo", "nuovo fermo", "vecchio fermo"]);
  });
  test("migrazione mancante riconosciuta", () => {
    assert.equal(F.popularityMissing({ code: "PGRST202", message: "Could not find the function public.deck_trending" }), true);
    assert.equal(F.popularityMissing({ code: "PGRST205", message: "Could not find the table 'public.deck_favorites'" }), true);
    assert.equal(F.popularityMissing({ code: "57014", message: "timeout" }), false);
    assert.equal(F.popularityMissing(null), false);
  });
});

describe("blocco PREFERITI E TENDENZA di schema.sql", () => {
  const schema = read("../../../supabase/schema.sql");
  const block = schema.slice(schema.indexOf("-- ===== 30/09/2026: PREFERITI E TENDENZA ====="));
  test("c'è, con tabella, trigger e funzioni", () => {
    assert.ok(block.length > 100);
    assert.match(block, /create table if not exists public\.deck_favorites/);
    assert.match(block, /create trigger deck_favorites_guard before insert on public\.deck_favorites/);
    assert.match(block, /function public\.deck_favorite_counts\(\)/);
    assert.match(block, /function public\.deck_trending\(\)/);
  });
  test("tetto e pesi uguali al codice", () => {
    assert.match(block, new RegExp(`>= ${F.FAVORITE_MAX} then`));
    const w = F.TRENDING_WEIGHTS;
    const has = (t: string) => assert.ok(block.includes(t), t);
    has(`s.views * ${w.views} + s.code_copies * ${w.code_copies} + s.link_clicks * ${w.link_clicks} + s.video_plays * ${w.video_plays}`);
    has(`count(*) * ${w.votes}.0 as pts from public.deck_votes`);
    has(`count(*) * ${w.favorites}.0 as pts from public.deck_favorites`);
    has(`greatest(0, ${F.TRENDING_DAYS} - `);
    has(`interval '${F.TRENDING_DAYS} days'`);
  });
  test("chi salva resta privato: niente lettura per anon, solo le proprie righe", () => {
    assert.match(block, /revoke all on public\.deck_favorites from anon, authenticated;/);
    assert.match(block, /grant select, insert, delete on public\.deck_favorites to authenticated;/);
    assert.match(block, /for select to authenticated using \(user_id = auth\.uid\(\)\)/);
    assert.doesNotMatch(block, /grant [^;]*on public\.deck_favorites to anon/);
  });
});

describe("etichette di Salva", () => {
  const keys = (o: object, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  test("stesse chiavi in inglese, italiano e spagnolo", () => {
    for (const l of ["it", "es"] as const) assert.deepEqual(keys(L.favoriteLabels[l]), keys(L.favoriteLabels.en), l);
  });
});

describe("mazzo della settimana", async () => {
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const W: typeof import("./deckOfWeek") = await import("./deckOfWeek.ts");
  test("il punteggio più alto sopra la soglia, a pari merito salvataggi e poi il più recente", () => {
    const min = W.DECK_OF_WEEK_MIN_SCORE;
    const decks = [
      { id: "a", created_at: "2026-09-10", trend: min + 10, favorites: 1 },
      { id: "b", created_at: "2026-09-20", trend: min + 10, favorites: 3 },
      { id: "c", created_at: "2026-09-29", trend: min + 1 },
    ];
    assert.equal(W.pickDeckOfWeek(decks)?.id, "b");
    assert.equal(W.pickDeckOfWeek([{ id: "x", created_at: "2026-09-29", trend: min - 0.1 }]), null);
    assert.equal(W.pickDeckOfWeek([]), null);
  });
  test("il cron del lunedì è registrato in vercel.json", () => {
    const cfg = JSON.parse(read("../../../vercel.json")) as { crons: { path: string; schedule: string }[] };
    assert.ok(cfg.crons.some((c) => c.path === "/api/cron/deck-of-the-week" && /\* \* 1$/.test(c.schedule)));
  });
  test("testi nelle tre lingue con gli stessi segnaposto", () => {
    for (const l of ["it", "es"] as const) {
      assert.deepEqual(Object.keys(W.deckOfWeekLabels[l]), Object.keys(W.deckOfWeekLabels.en));
      assert.match(W.deckOfWeekLabels[l].by, /\{author\}/);
    }
  });
});
