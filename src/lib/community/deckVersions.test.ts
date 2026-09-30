/**
 * Test delle versioni dei mazzi della community (pacchetto VERSIONI, 30/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/deckVersions.test.ts`.
 *
 * - Regole pure (deckVersions.ts): confronto delle carte senza badare all'ordine, riepilogo dei cambi, data da cui si
 *   ricava la patch, mazzo fermo a una patch di prima, indirizzi del giro builder → modifica, medie per versione.
 * - Blocco "30/09/2026: VERSIONI" di supabase/schema.sql: colonne, chiave dei voti con la versione, trigger, vista
 *   deck_ratings sulla versione in vigore, tabella delle versioni senza scritture degli utenti.
 * - Etichette nelle tre lingue (deckVersionLabels.ts): stesse chiavi e stessi segnaposto.
 *
 * Import senza estensione come in deckArt.test.ts: un hook di risoluzione aggiunge `.ts`.
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
const V: typeof import("./deckVersions") = await import("./deckVersions.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../deckVersionLabels") = await import("../deckVersionLabels.ts");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const deck = (legendary: string | null, cards: string[], custom: { slug: string; name?: string }[] = []) => ({ legendary, cards, custom_cards: custom });

describe("regole delle versioni", () => {
  test("stesse carte in un altro ordine: nessuna versione nuova", () => {
    assert.equal(V.sameDeckCards(deck("merlin", ["a", "b", "c"]), deck("merlin", ["c", "a", "b"])), true);
  });
  test("una carta, la Leggendaria o una carta creata diverse: versione nuova", () => {
    assert.equal(V.sameDeckCards(deck("merlin", ["a", "b"]), deck("merlin", ["a", "x"])), false);
    assert.equal(V.sameDeckCards(deck("merlin", ["a", "b"]), deck("mulan", ["a", "b"])), false);
    assert.equal(V.sameDeckCards(deck("merlin", ["a"], [{ slug: "custom:x", name: "X" }]), deck("merlin", ["a"], [{ slug: "custom:x", name: "Y" }])), false);
    assert.equal(V.sameDeckCards(deck("merlin", ["a"], [{ slug: "custom:x", name: "X" }]), deck("merlin", ["a"], [{ name: "X", slug: "custom:x" }])), true);
  });
  test("riepilogo dei cambi nell'ordine del mazzo", () => {
    const d = V.deckCardsDiff(deck("merlin", ["a", "b", "c"]), deck("mulan", ["c", "d", "a", "e"]));
    assert.deepEqual(d, { legendary: { from: "merlin", to: "mulan" }, added: ["d", "e"], removed: ["b"] });
    assert.equal(V.deckCardsDiff(deck("merlin", ["a"]), deck("merlin", ["a"])).legendary, null);
  });
  test("la patch si ricava dall'ultimo cambio di carte, altrimenti dalla pubblicazione", () => {
    assert.equal(V.deckCardsDate({ created_at: "2026-09-10T10:00:00Z" }), "2026-09-10T10:00:00Z");
    assert.equal(V.deckCardsDate({ created_at: "2026-09-10T10:00:00Z", cards_updated_at: null }), "2026-09-10T10:00:00Z");
    assert.equal(V.deckCardsDate({ created_at: "2026-09-10T10:00:00Z", cards_updated_at: "2026-09-30T08:00:00Z" }), "2026-09-30T08:00:00Z");
  });
  test("mazzo fermo a una patch di prima", () => {
    const order = ["0.6.3", "demo-0921", "0.7"];
    assert.equal(V.deckOutdated("demo-0921", order), true);
    assert.equal(V.deckOutdated(undefined, order), true);
    assert.equal(V.deckOutdated("0.7", order), false);
  });
  test("giro builder → modifica: indirizzi e slug", () => {
    assert.equal(V.deckUpdateHref("it", "spellcast-ab12", "OM1.x"), "/it/deck-builder?update=spellcast-ab12#OM1.x");
    assert.equal(V.deckSaveCardsHref("es", "spellcast-ab12", "OM1.a b"), "/es/decks/community/spellcast-ab12/edit?deck=OM1.a%20b");
    assert.equal(V.DECK_SLUG_RE.test("spellcast-ab12"), true);
    for (const bad of ["", "../x", "a/b", "A-b", "-x", "x?y", "x".repeat(101)]) assert.equal(V.DECK_SLUG_RE.test(bad), false, bad);
  });
  test("media per versione come deck_ratings (due decimali), voti non validi scartati", () => {
    const m = V.versionRatings([
      { version: 1, stars: 5 },
      { version: 1, stars: 4 },
      { version: 1, stars: 4 },
      { version: 2, stars: 3 },
      { version: 2, stars: 9 },
    ]);
    assert.deepEqual(m.get(1), { avg: 4.33, votes: 3 });
    assert.deepEqual(m.get(2), { avg: 3, votes: 1 });
    assert.equal(m.get(3), undefined);
  });
});

describe("blocco VERSIONI di schema.sql", () => {
  const schema = read("../../../supabase/schema.sql");
  const start = schema.indexOf("-- ===== 30/09/2026: VERSIONI =====");
  const block = schema.slice(start);
  test("c'è, dopo DATE E FOTO", () => {
    assert.ok(start > 0);
    assert.ok(schema.indexOf("-- ===== 27/09/2026: DATE E FOTO =====") < start);
  });
  test("colonne e chiave dei voti con la versione", () => {
    assert.match(block, /add column if not exists version integer not null default 1/);
    assert.match(block, /community_decks add column if not exists cards_updated_at timestamptz/);
    assert.match(block, /deck_votes add column if not exists version integer not null default 1/);
    assert.match(block, /primary key \(deck_id, user_id, version\)/);
  });
  test("versione e voti li scrivono solo i trigger", () => {
    assert.match(block, /create trigger community_decks_version before insert or update on public\.community_decks/);
    assert.match(block, /create trigger deck_votes_version before insert or update on public\.deck_votes/);
    assert.match(block, /new\.version := old\.version;\s*new\.cards_updated_at := old\.cards_updated_at;/);
    // un mazzo privato si riscrive senza versioni
    assert.match(block, /if old\.status <> 'draft'/);
  });
  test("la media mostrata è quella della versione in vigore", () => {
    assert.match(block, /create or replace view public\.deck_ratings as[\s\S]*?d\.version = v\.version/);
  });
  test("nessuna scrittura degli utenti sulla tabella delle versioni", () => {
    assert.match(block, /revoke all on public\.community_deck_versions from anon, authenticated;/);
    assert.match(block, /grant select on public\.community_deck_versions to anon, authenticated;/);
    assert.doesNotMatch(block, /grant (?:insert|update|delete|all)[^;]*community_deck_versions/);
  });
});

describe("etichette delle versioni", () => {
  const keys = (o: object, p = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const holes = (o: object): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? holes(v).map((h) => `${k}.${h}`) : [`${k}:${[...String(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")}`]));
  test("stesse chiavi e stessi segnaposto in inglese, italiano e spagnolo", () => {
    for (const l of ["it", "es"] as const) {
      assert.deepEqual(keys(L.deckVersionLabels[l]), keys(L.deckVersionLabels.en), l);
      assert.deepEqual(holes(L.deckVersionLabels[l]), holes(L.deckVersionLabels.en), l);
    }
  });
});
