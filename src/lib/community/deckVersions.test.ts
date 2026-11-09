/**
 * Test delle versioni dei mazzi della community (pacchetto VERSIONI, 30/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/deckVersions.test.ts`.
 *
 * - Regole pure (deckVersions.ts): confronto delle carte senza badare all'ordine, riepilogo dei cambi, data da cui si
 *   ricava la patch, mazzo fermo a una patch di prima, indirizzi del giro builder → modifica, medie per versione.
 * - Blocco "30/09/2026: VERSIONI" di supabase/schema.sql: colonne, chiave dei voti con la versione, trigger, vista
 *   deck_ratings sulla versione in vigore, tabella delle versioni senza scritture degli utenti.
 * - Etichette nelle tre lingue (deckVersionLabels.ts): stesse chiavi e stessi segnaposto.
 * - Ordine per data dell'ultimo aggiornamento delle carte (09/11/2026): una modifica di solo testo non sposta la data,
 *   una modifica delle carte sì e porta il mazzo in cima, il mazzo resta lo stesso; blocco "09/11/2026: ORDINE PER
 *   AGGIORNAMENTO" di schema.sql (carte confrontate senza badare all'ordine).
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
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const F: typeof import("./favorites") = await import("./favorites.ts");

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
  test("una quantità diversa è una versione nuova (le carte sono un multinsieme, come in deck_cards_key)", () => {
    assert.equal(V.sameDeckCards(deck("merlin", ["a", "a", "b"]), deck("merlin", ["a", "b", "b"])), false);
    assert.equal(V.sameDeckCards(deck("merlin", ["a", "b"]), deck("merlin", ["a", "a", "b"])), false);
    assert.equal(V.sameDeckCards(deck("merlin", ["b", "a", "a"]), deck("merlin", ["a", "b", "a"])), true);
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

describe("ordine per data dell'ultimo aggiornamento delle carte (Pierluigi, 09/11/2026)", () => {
  type Row = import("./deckVersions").DeckSaveState & { id: string; slug: string; name: string; guide: string; updated_at: string };
  const row = (slug: string, created_at: string, cards: string[], extra: Partial<Row> = {}): Row => ({
    id: `id-${slug}`,
    slug,
    name: `Mazzo ${slug}`,
    guide: "guida",
    status: "published",
    legendary: "merlin",
    cards,
    custom_cards: [],
    version: 1,
    created_at,
    updated_at: created_at,
    cards_updated_at: null,
    ...extra,
  });
  const order = (rows: Row[]) => rows.slice().sort(V.newestCardsFirst).map((r) => r.slug);
  const vecchio = row("vecchio", "2026-10-01T10:00:00.000+00:00", ["a", "b", "c"]);
  const medio = row("medio", "2026-10-20T10:00:00.000+00:00", ["d", "e", "f"]);
  const nuovo = row("nuovo", "2026-11-05T10:00:00.000+00:00", ["g", "h", "i"]);
  const oggi = "2026-11-09T09:30:00.000+00:00";

  test("di partenza: dal più nuovo, come prima", () => {
    assert.deepEqual(order([vecchio, nuovo, medio]), ["nuovo", "medio", "vecchio"]);
  });
  test("una modifica di solo testo (nome, guida) non sposta la data né il mazzo", () => {
    const dopo = V.deckAfterSave(vecchio, { name: "Nome nuovo", guide: "guida riscritta", updated_at: oggi }, oggi);
    assert.equal(dopo.cards_updated_at, null);
    assert.equal(dopo.version, 1);
    assert.equal(V.deckCardsDate(dopo), vecchio.created_at);
    assert.deepEqual(order([dopo, nuovo, medio]), ["nuovo", "medio", "vecchio"]);
  });
  test("le stesse carte in un altro ordine non sono un aggiornamento", () => {
    const dopo = V.deckAfterSave(vecchio, { cards: ["c", "a", "b"] }, oggi);
    assert.equal(dopo.cards_updated_at, null);
    assert.deepEqual(order([dopo, nuovo, medio]), ["nuovo", "medio", "vecchio"]);
  });
  test("una modifica delle carte sposta la data e porta il mazzo in cima", () => {
    for (const edit of [{ cards: ["a", "b", "x"] }, { cards: ["a", "b"] }, { cards: ["a", "b", "c", "c"] }, { legendary: "mulan" }]) {
      const dopo = V.deckAfterSave(vecchio, edit, oggi);
      assert.equal(dopo.cards_updated_at, oggi, JSON.stringify(edit));
      assert.equal(dopo.version, 2);
      assert.equal(V.deckCardsUpdated(dopo), oggi);
      assert.deepEqual(order([dopo, nuovo, medio]), ["vecchio", "nuovo", "medio"]);
    }
  });
  test("il mazzo aggiornato resta lo stesso: id, slug e data di creazione", () => {
    const dopo = V.deckAfterSave(vecchio, { cards: ["a", "b", "x"], created_at: oggi } as Partial<Row>, oggi);
    assert.equal(dopo.id, vecchio.id);
    assert.equal(dopo.slug, vecchio.slug);
    assert.equal(dopo.created_at, vecchio.created_at);
  });
  test("un mazzo privato si riscrive senza versioni né data", () => {
    const dopo = V.deckAfterSave({ ...vecchio, status: "draft" }, { cards: ["x", "y", "z"] }, oggi);
    assert.equal(dopo.cards_updated_at, null);
    assert.equal(dopo.version, 1);
  });
  test("dopo un aggiornamento, un cambio di guida non sposta più la data dell'aggiornamento", () => {
    const aggiornato = V.deckAfterSave(vecchio, { cards: ["a", "b", "x"] }, "2026-11-08T10:00:00.000+00:00");
    const dopo = V.deckAfterSave(aggiornato, { guide: "altra guida" }, oggi);
    assert.equal(dopo.cards_updated_at, "2026-11-08T10:00:00.000+00:00");
    assert.equal(dopo.version, 2);
  });
  test("due letture unite: un mazzo vecchio aggiornato entra anche oltre il limite", () => {
    const aggiornato = { ...vecchio, cards_updated_at: oggi, version: 2 };
    // limite 2: per creazione arrivano "nuovo" e "medio", fra gli aggiornati "vecchio"
    assert.deepEqual(V.mergeNewestCards([nuovo, medio], [aggiornato], 2).map((r) => r.slug), ["vecchio", "nuovo"]);
    // la stessa riga letta due volte conta una volta
    assert.deepEqual(V.mergeNewestCards([aggiornato, nuovo], [aggiornato], 5).map((r) => r.slug), ["vecchio", "nuovo"]);
  });
  test("elenco nel browser: l'ordine \"Più recenti\" e gli spareggi di tendenza usano l'ultimo cambio di carte", () => {
    assert.equal(F.recentAt({ cardsAt: oggi, created: "2026-10-01", updated: "2026-10-02" }), oggi);
    assert.equal(F.recentAt({ created: "2026-10-01", updated: "2026-10-02" }), "2026-10-01");
    assert.equal(F.recentAt({ updated: "2026-10-02" }), "2026-10-02");
    const a = { trend: 0, favorites: 0, cardsAt: oggi, created: "2026-10-01", updated: oggi };
    const b = { trend: 0, favorites: 0, cardsAt: "2026-11-05T10:00:00.000+00:00", created: "2026-11-05", updated: "2026-11-05" };
    assert.ok(F.compareTrending(a, b) < 0);
    assert.ok(F.compareSaved(a, b) < 0);
  });
});

describe("blocco ORDINE PER AGGIORNAMENTO di schema.sql", () => {
  const schema = read("../../../supabase/schema.sql");
  const start = schema.indexOf("-- ===== 09/11/2026: ORDINE PER AGGIORNAMENTO =====");
  const block = schema.slice(start);
  test("c'è, dopo VERSIONI, quindi la sua guard_deck_version è quella che resta", () => {
    assert.ok(start > schema.indexOf("-- ===== 30/09/2026: VERSIONI ====="));
    assert.equal(schema.lastIndexOf("create or replace function public.guard_deck_version()") > start, true);
  });
  test("carte e carte create confrontate come multinsieme, senza badare all'ordine", () => {
    assert.match(block, /create or replace function public\.deck_cards_key\(cards jsonb\)[\s\S]*?jsonb_agg\(x order by x\)/);
    assert.match(block, /public\.deck_cards_key\(new\.cards\) is distinct from public\.deck_cards_key\(old\.cards\)/);
    assert.match(block, /new\.legendary is distinct from old\.legendary/);
    assert.match(block, /public\.deck_cards_key\(new\.custom_cards\) is distinct from public\.deck_cards_key\(old\.custom_cards\)/);
  });
  test("versione e data delle carte restano quelle di prima, salvo un cambio di carte di un mazzo non privato", () => {
    const fn = block.slice(block.indexOf("create or replace function public.guard_deck_version()"));
    assert.match(fn, /new\.version := old\.version;\s*new\.cards_updated_at := old\.cards_updated_at;/);
    assert.match(fn, /if old\.status <> 'draft'/);
    assert.match(fn, /new\.version := old\.version \+ 1;\s*new\.cards_updated_at := now\(\);/);
  });
  test("niente colonne nuove né riempimenti: nessuna riga di mazzi, voti o visite si tocca", () => {
    assert.doesNotMatch(block, /add column/);
    assert.doesNotMatch(block, /^\s*(?:update|delete from|truncate)\b/im);
  });
  test("la media mostrata è l'ultimo voto di ogni persona, di qualsiasi versione (l'ultima vista del file)", () => {
    const last = schema.lastIndexOf("create or replace view public.deck_ratings as");
    assert.ok(last > start);
    const view = schema.slice(last, schema.indexOf(";", last));
    assert.match(view, /distinct on \(v\.deck_id, v\.user_id\)/);
    assert.match(view, /order by v\.deck_id, v\.user_id, v\.version desc/);
    assert.doesNotMatch(view, /d\.version = v\.version/);
    assert.match(block, /grant select on public\.deck_ratings to anon, authenticated;/);
  });
});

describe("il mazzo aggiornato tiene visite e voti (09/11/2026)", () => {
  test("i voti della versione di prima restano nella media finché chi li ha dati non vota quella nuova", () => {
    const v1 = [
      { user_id: "anna", version: 1, stars: 5 },
      { user_id: "bruno", version: 1, stars: 4 },
      { user_id: "carla", version: 1, stars: 3 },
    ];
    assert.deepEqual(V.deckRating(v1), { avg: 4, votes: 3 });
    // le carte cambiano (versione 2): nessun voto nuovo, la media non riparte da zero
    assert.deepEqual(V.deckRating(v1), { avg: 4, votes: 3 });
    // Anna vota la versione 2: conta il suo voto nuovo, non due voti
    const v2 = [...v1, { user_id: "anna", version: 2, stars: 2 }];
    assert.deepEqual(V.deckRating(v2), { avg: 3, votes: 3 });
    // Dario vota solo la versione 2: si aggiunge
    assert.deepEqual(V.deckRating([...v2, { user_id: "dario", version: 2, stars: 5 }]), { avg: 3.5, votes: 4 });
  });
  test("l'ordine delle righe non conta e i voti non validi si scartano", () => {
    const votes = [
      { user_id: "anna", version: 2, stars: 2 },
      { user_id: "anna", version: 1, stars: 5 },
      { user_id: "bruno", version: 1, stars: 9 },
    ];
    assert.deepEqual(V.deckRating(votes), { avg: 2, votes: 1 });
    assert.deepEqual(V.deckRating([]), { avg: 0, votes: 0 });
  });
  test("la media di ogni versione di prima resta quella dei voti ricevuti mentre era in vigore", () => {
    const votes = [
      { user_id: "anna", version: 1, stars: 5 },
      { user_id: "anna", version: 2, stars: 2 },
      { user_id: "bruno", version: 1, stars: 4 },
    ];
    assert.deepEqual(V.versionRatings(votes).get(1), { avg: 4.5, votes: 2 });
    assert.deepEqual(V.versionRatings(votes).get(2), { avg: 2, votes: 1 });
    assert.deepEqual(V.deckRating(votes), { avg: 3, votes: 2 });
  });
  test("le visite stanno sull'id del mazzo, che un aggiornamento non cambia", () => {
    const schema = read("../../../supabase/schema.sql");
    assert.match(schema, /create table if not exists public\.deck_stats_daily \(\s*deck_id uuid not null references public\.community_decks\(id\) on delete cascade/);
    const before = { id: "id-1", slug: "x", status: "published", legendary: "merlin", cards: ["a", "b"], custom_cards: [], version: 1, created_at: "2026-10-01T00:00:00Z", cards_updated_at: null };
    const after = V.deckAfterSave(before, { cards: ["a", "c"] }, "2026-11-09T00:00:00Z");
    assert.equal(after.id, before.id);
    assert.equal(after.version, 2);
  });
  test("testi: nessuna lingua dice più che i voti ripartono", () => {
    for (const [l, t] of Object.entries(L.deckVersionLabels)) {
      for (const text of [t.edit.intro, t.edit.saveNotice, t.builder.banner, t.deck.hint])
        assert.doesNotMatch(text, /from zero|starts again|ripart|da zero|vuelven a cero|empieza de nuevo|repartent|de zéro|começa de novo|do zero|von vorn|bei null|с нуля|начнутся заново|从零|重新开始/i, `${l}: ${text}`);
    }
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
  test("la vista di VERSIONI contava la versione in vigore (sostituita il 09/11/2026, vedi ORDINE PER AGGIORNAMENTO)", () => {
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
    for (const l of ["it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const) {
      assert.deepEqual(keys(L.deckVersionLabels[l]), keys(L.deckVersionLabels.en), l);
      assert.deepEqual(holes(L.deckVersionLabels[l]), holes(L.deckVersionLabels.en), l);
    }
  });
});
