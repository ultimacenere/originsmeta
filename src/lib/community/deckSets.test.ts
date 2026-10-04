/**
 * Test dei Mazzi torneo (04/10/2026) con il runner integrato di Node: `node --test src/lib/community/deckSets.test.ts`.
 *
 * - Regole pure (deckSets.ts): codici dei tre mazzi nell'indirizzo, regole Conquest, guida (sezioni, impronta,
 *   traduzioni, soglia), errori del database.
 * - Blocco "04/10/2026: MAZZI TORNEO" di supabase/schema.sql: numeri e chiavi uguali al codice, RLS, avvisi.
 * - Etichette nelle tre lingue (deckSetLabels.ts): stesse chiavi e stessi segnaposto; voci del menu uguali ai dizionari.
 *
 * Import senza estensione come in deckVersions.test.ts: un hook di risoluzione aggiunge `.ts`.
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
const D: typeof import("./deckSets") = await import("./deckSets.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const R: typeof import("../deckrules") = await import("../deckrules.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("../deckcode") = await import("../deckcode.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../deckSetLabels") = await import("../deckSetLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const N: typeof import("./notifications") = await import("./notifications.ts");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `c${from + i}`);
const deck = (legendary: string, cards: string[]) => ({ name: `Deck ${legendary}`, legendary, cards, customCards: [] });
const good = [deck("l1", range(1, 12)), deck("l2", range(9, 20)), deck("l3", range(21, 32))];

describe("codici dei tre mazzi nell'indirizzo", () => {
  test("andata e ritorno con il separatore ~", () => {
    const codes = good.map((d) => C.encodeOmCode(d));
    const joined = D.joinSetCodes(codes);
    assert.equal(joined.split("~").length, 3);
    assert.deepEqual(D.splitSetCodes(joined), codes);
    assert.deepEqual(
      D.decodeSetCodes(joined)?.map((d) => d.legendary),
      ["l1", "l2", "l3"],
    );
  });
  test("codici su righe diverse, anche dentro i link del deck builder", () => {
    const codes = good.map((d) => C.encodeOmCode(d));
    const text = codes.map((c) => `https://originsmeta.com/it/deck-builder#${c}`).join("\n");
    assert.deepEqual(D.splitSetCodes(text), codes);
    assert.ok(D.decodeSetCodes(`${codes[0]}, ${codes[1]} ; ${codes[2]}`));
  });
  test("due codici o un codice rotto: nessun trio", () => {
    const codes = good.map((d) => C.encodeOmCode(d));
    assert.equal(D.decodeSetCodes(D.joinSetCodes(codes.slice(0, 2))), null);
    assert.equal(D.decodeSetCodes(`${codes[0]}~${codes[1]}~OM1.@@@`), null);
    assert.equal(D.decodeSetCodes(""), null);
    assert.equal(D.splitSetCodes([...codes, ...codes].join("~")).length, 3, "al massimo tre");
  });
  test("il base64url dei codici non usa mai il separatore", () => {
    const code = C.encodeOmCode({ name: "~~~ ñ €", legendary: "l1", cards: range(1, 12), customCards: [] });
    assert.ok(!code.includes(D.DECK_SET_CODE_SEPARATOR));
  });
});

describe("regole Conquest", () => {
  test("i numeri sono quelli del deck builder e della Crimson Cup", () => {
    assert.equal(D.DECK_SET_SIZE, 3);
    assert.equal(D.DECK_SET_MIN_DIFFERENT, R.RULES.conquestMinDifferent);
    assert.equal(D.DECK_SET_MIN_DIFFERENT, 8);
  });
  test("trio valido", () => {
    assert.equal(D.deckSetIssue(good), null);
  });
  test("Leggendaria ripetuta", () => {
    assert.deepEqual(D.deckSetIssue([good[0], deck("l1", range(40, 51)), good[2]]), { code: "legendaries" });
  });
  test("mazzi troppo simili, con la coppia e il conto", () => {
    const issue = D.deckSetIssue([good[0], deck("l2", range(6, 17)), good[2]]);
    assert.deepEqual(issue, { code: "similar", decks: [0, 1], value: 6 });
  });
  test("esattamente 8 carte diverse (5 in comune): si pubblica", () => {
    assert.equal(D.deckSetIssue([good[0], deck("l2", [...range(8, 12), ...range(40, 46)]), good[2]]), null);
  });
  test("due mazzi soli", () => {
    assert.deepEqual(D.deckSetIssue(good.slice(0, 2)), { code: "count" });
  });
});

describe("guida del trio", () => {
  const guide = { lang: "it" as const, summary: "Tre piani diversi per la Crimson Cup.", deck_1: "Apre il torneo", notes: "" };
  test("testo nell'ordine delle sezioni, senza i campi vuoti", () => {
    assert.deepEqual(Object.keys(D.deckSetGuideText(guide)), ["summary", "deck_1"]);
  });
  test("l'impronta cambia con il testo e con la lingua", () => {
    const h = D.deckSetGuideHash(guide);
    assert.notEqual(h, D.deckSetGuideHash({ ...guide, deck_1: "Chiude il torneo" }));
    assert.notEqual(h, D.deckSetGuideHash({ ...guide, lang: "en" }));
    assert.equal(h, D.deckSetGuideHash({ ...guide }));
  });
  test("traduzione valida solo sul testo attuale", () => {
    const hash = D.deckSetGuideHash(guide);
    const set = { guide, translations: { en: { hash, at: "x", guide: { summary: "Three plans." } }, es: { hash: "vecchia", at: "x", guide: { summary: "Tres planes." } } } };
    assert.deepEqual(D.deckSetGuideLocales(set, ["en", "it", "es"]), ["en", "it"]);
    assert.deepEqual(D.missingSetLocales(set, ["en", "it", "es"]), ["es"]);
    assert.equal(D.localizedSetGuide(set, "en").translated, true);
    assert.equal(D.localizedSetGuide(set, "es").lang, "it");
  });
  test("soglia di parole: sotto nessuna lingua si indicizza", () => {
    assert.deepEqual(D.deckSetIndexableLocales({ guide }, ["en", "it", "es"]), []);
    const long = { ...guide, summary: Array.from({ length: 80 }, (_, i) => `parola${i}`).join(" ") };
    assert.deepEqual(D.deckSetIndexableLocales({ guide: long }, ["en", "it", "es"]), ["it"]);
  });
  test("lettura dal modulo: lingua, riassunto minimo, sezioni tagliate", () => {
    const fd = new Map<string, string>([
      ["lang", "es"],
      ["summary", "  Un plan de juego bastante largo.  "],
      ["deck_2", "x".repeat(2500)],
      ["strengths", "   "],
    ]);
    const g = D.readDeckSetGuide((k) => fd.get(k) ?? null, ["en", "it", "es"], "it");
    assert.equal(g?.lang, "es");
    assert.equal(g?.summary, "Un plan de juego bastante largo.");
    assert.equal(g?.deck_2?.length, 2000);
    assert.equal(g?.strengths, undefined);
    assert.equal(D.readDeckSetGuide(() => "corto", ["en", "it", "es"], "it"), null);
    assert.equal(D.readDeckSetGuide((k) => (k === "lang" ? "fr" : "Un riassunto abbastanza lungo"), ["en", "it", "es"], "it")?.lang, "it");
  });
});

describe("errori del database", () => {
  test("ogni eccezione del trigger ha il suo codice", () => {
    assert.equal(D.deckSetErrorCode({ message: "deck_set_limit" }), "limit");
    assert.equal(D.deckSetErrorCode({ message: "deck_set_legendaries" }), "legendaries");
    assert.equal(D.deckSetErrorCode({ message: "deck_set_similar" }), "similar");
    assert.equal(D.deckSetErrorCode({ message: "deck_set_invalid" }), "invalidDeck");
    assert.equal(D.deckSetErrorCode({ code: "42P01", message: 'relation "public.community_deck_sets" does not exist' }), "unavailable");
    assert.equal(D.deckSetErrorCode({ code: "23514", message: "altro" }), "db");
  });
});

describe("blocco MAZZI TORNEO di supabase/schema.sql", () => {
  const schema = read("../../../supabase/schema.sql");
  const MARKER = "-- ===== 04/10/2026: MAZZI TORNEO =====";
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  test("il blocco c'è, in fondo, dopo DRAFT ONLINE, e non tocca public.profiles", () => {
    assert.ok(at > schema.indexOf("-- ===== 02/10/2026: DRAFT ONLINE ====="));
    assert.ok(!/grant[^;]*on public\.profiles/i.test(block));
    assert.ok(!/revoke[^;]*on public\.profiles/i.test(block));
  });
  test("minimo di carte diverse uguale al codice", () => {
    assert.match(block, new RegExp(`min_different constant int := ${D.DECK_SET_MIN_DIFFERENT};`));
    assert.match(block, /jsonb_array_length\(decks\) = 3/);
    assert.match(block, new RegExp(`jsonb_array_length\\(d->'cards'\\) <> ${R.RULES.distinctCards}`));
  });
  test("chiavi e limiti della guida uguali al codice", () => {
    const keys = /e\.key not in \(([^)]*)\)/.exec(block)?.[1] ?? "";
    const list = keys.split(",").map((k) => k.trim().replace(/'/g, ""));
    assert.deepEqual(list, ["lang", "summary", ...D.DECK_SET_GUIDE_SECTIONS]);
    const lim = D.DECK_SET_GUIDE_LIMITS;
    assert.ok(block.includes(`char_length(g->>'summary') between ${lim.summaryMin} and ${lim.summaryMax}`));
    assert.ok(block.includes(`char_length(e.value #>> '{}') > ${lim.sectionMax}`));
  });
  test("RLS su tutte le tabelle nuove, scritture solo per authenticated, statistiche solo dalla funzione", () => {
    for (const t of ["community_deck_sets", "deck_set_votes", "deck_set_stats_daily"]) assert.ok(block.includes(`alter table public.${t} enable row level security;`), t);
    assert.ok(block.includes("grant insert, update, delete on public.community_deck_sets to authenticated;"));
    assert.ok(!/grant (insert|update|delete)[^;]*on public\.deck_set_stats_daily/i.test(block));
    assert.ok(block.includes("grant execute on function public.bump_deck_set_stat(text, text) to anon, authenticated;"));
    assert.ok(/s\.owner <> auth\.uid\(\)/.test(block), "mai un voto sul proprio trio");
  });
  test("avvisi: notify_followers (ultima definizione) conosce i mazzi torneo", () => {
    const defs = schema.split("create or replace function public.notify_followers(");
    const last = defs.at(-1) ?? "";
    assert.ok(schema.lastIndexOf("create or replace function public.notify_followers(") > at, "l'ultima definizione è in questo blocco");
    assert.ok(last.includes("'deck_set_published'"));
    assert.ok(last.includes("'^/decks/tournament/[a-z0-9-]{1,80}$'"));
    assert.ok(last.includes("substr(v_target, 19)"));
    assert.equal("/decks/tournament/".length, 18);
    for (const kind of ["deck_published", "guide_published", "comic_published"]) assert.ok(last.includes(`'${kind}'`), kind);
  });
  test("tipi di avviso uguali al codice", () => {
    const kinds = /notifications_kind_check check \(kind in \(([^)]*)\)\)/g;
    let m: RegExpExecArray | null;
    let lastList = "";
    while ((m = kinds.exec(schema))) lastList = m[1];
    assert.deepEqual(
      lastList.split(",").map((k) => k.trim().replace(/'/g, "")),
      [...N.NOTIFICATION_KINDS],
    );
  });
});

describe("avvisi dei mazzi torneo (notifications.ts)", () => {
  test("percorso, slug e link", () => {
    assert.equal(N.publishTarget("deck_set_published", "trio-ab12"), "/decks/tournament/trio-ab12");
    assert.equal(N.publishTarget("deck_set_published", "/it/decks/tournament/trio-ab12"), "/decks/tournament/trio-ab12");
    assert.equal(N.publishTarget("deck_set_published", "../x"), null);
    assert.equal(N.deckSetSlugOf("/decks/tournament/trio-ab12"), "trio-ab12");
    assert.equal(N.deckSetSlugOf("/decks/community/trio-ab12"), null);
    assert.equal(N.notificationHref("es", "/decks/tournament/trio-ab12"), "/es/decks/tournament/trio-ab12");
  });
});

describe("etichette dei mazzi torneo (deckSetLabels.ts)", () => {
  const flat = (o: unknown, prefix = ""): Record<string, string> =>
    Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>((acc, [k, v]) => {
      if (typeof v === "string") acc[`${prefix}${k}`] = v;
      else Object.assign(acc, flat(v, `${prefix}${k}.`));
      return acc;
    }, {});
  const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  test("stesse chiavi e stessi segnaposto in inglese, italiano e spagnolo", () => {
    const en = flat(L.deckSetLabels.en);
    for (const locale of ["it", "es"] as const) {
      const other = flat(L.deckSetLabels[locale]);
      assert.deepEqual(Object.keys(other).sort(), Object.keys(en).sort(), locale);
      for (const k of Object.keys(en)) assert.deepEqual(holes(other[k]), holes(en[k]), `${locale}: ${k}`);
    }
  });
  test("le voci del menu sono quelle dei dizionari", () => {
    for (const locale of ["en", "it", "es"] as const) {
      const dict = read(`../dictionaries/${locale}.ts`);
      assert.ok(dict.includes(`decksSingle: "${L.deckSetLabels[locale].nav.single}"`), locale);
      assert.ok(dict.includes(`decksTournament: "${L.deckSetLabels[locale].nav.tournament}"`), locale);
    }
  });
  test("lettere dei mazzi", () => {
    assert.deepEqual([0, 1, 2].map(L.deckLetter), ["A", "B", "C"]);
  });
});
