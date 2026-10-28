/**
 * Test del riquadro delle liste negli articoli (`decklists`, 28/10/2026, intervista a SouL): la riga `{{decklists}}`
 * c'è una volta in ogni lingua delle news con le liste e in nessun'altra news, i tre mazzi rispettano le regole Conquest
 * dei mazzi torneo e coincidono con il file da cui nasce il mazzo torneo linkato (scripts/data/*.json, pubblicato con
 * scripts/publish-deck-set-as.mjs). `node --test src/lib/data/newsDecklists.test.ts`.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import type { Locale } from "../i18n";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// news.ts e deckSets.ts importano senza estensione: come in newsMeta.test.ts, l'hook di Node aggiunge `.ts`
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(specifier, context);
  },
});
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsModule: typeof import("./news") = await import("./news.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const setsModule: typeof import("../community/deckSets") = await import("../community/deckSets.ts");
const { news, splitDecklists, DECKLISTS_MARKER } = newsModule;
const { deckSetIssue, DECK_SET_GUIDE_SECTIONS } = setsModule;

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const locales = [...(read("../i18n.ts").match(/export const locales = \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z]{2})"/g)].map((m) => m[1]) as Locale[];
const cards = new Map((JSON.parse(read("./woo-cards.json")).cards as { slug: string; legendary?: boolean; type: string; status: string }[]).map((c) => [c.slug, c]));
const archetypes = [...read("./decks.ts").matchAll(/^\s{2}(\w+): n\(/gm)].map((m) => m[1]);

/** I file dei mazzi torneo pubblicati con publish-deck-set-as.mjs, per slug. */
type SetFile = { slug: string; decks: { name: string; archetype: string; legendary: string; cards: string[] }[]; guide: Record<string, string>; translations: Record<string, Record<string, string>> };
const dataDir = new URL("../../../scripts/data/", import.meta.url);
const setFiles = new Map<string, SetFile>(
  readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(new URL(f, dataDir), "utf8")))
    .filter((j): j is SetFile => typeof j.slug === "string" && Array.isArray(j.decks))
    .map((j) => [j.slug, j]),
);

const withLists = news.filter((item) => item.decklists);

describe("riquadro delle liste nelle news", () => {
  test("lingue lette e almeno una news con le liste", () => {
    assert.ok(locales.length >= 7, locales.join(","));
    assert.ok(withLists.length >= 1);
  });
  test("splitDecklists divide il testo alla riga del segnaposto, e solo lì", () => {
    assert.deepEqual(splitDecklists(`## A\n\ntesto\n\n${DECKLISTS_MARKER}\n\n## B`), ["## A\n\ntesto\n\n", "\n\n## B"]);
    assert.equal(splitDecklists(`testo ${DECKLISTS_MARKER} in una frase`), null);
    assert.equal(splitDecklists("niente"), null);
    assert.equal(splitDecklists(`${DECKLISTS_MARKER}\n\n${DECKLISTS_MARKER}`), null);
  });
  test("il segnaposto c'è una volta in ogni lingua delle news con le liste, mai nelle altre", () => {
    for (const item of news)
      for (const l of locales) {
        const body = item.body?.[l] ?? "";
        if (item.decklists) assert.ok(splitDecklists(body), `${item.slug} [${l}]: manca la riga ${DECKLISTS_MARKER}`);
        else assert.ok(!body.includes(DECKLISTS_MARKER), `${item.slug} [${l}]: ${DECKLISTS_MARKER} senza decklists`);
      }
  });
  test("tre mazzi giocabili insieme: carte attive, archetipi del sito, regole Conquest dei mazzi torneo", () => {
    for (const item of withLists) {
      const decks = item.decklists!.decks;
      assert.equal(decks.length, 3, item.slug);
      for (const d of decks) {
        assert.ok(cards.get(d.legendary)?.legendary, `${item.slug}: ${d.legendary} non è una Leggendaria`);
        assert.equal(new Set(d.cards).size, 12, `${item.slug}: ${d.name}`);
        for (const s of d.cards) assert.equal(cards.get(s)?.status, "active", `${item.slug}: ${s}`);
        assert.ok(archetypes.includes(d.archetype), `${item.slug}: archetipo ${d.archetype}`);
        assert.ok(d.name.length >= 3 && d.name.length <= 60, d.name);
      }
      assert.equal(deckSetIssue(decks.map((d) => ({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: [] }))), null, item.slug);
    }
  });
  test("il mazzo torneo linkato nasce da un file con le stesse liste e la guida in tutte le lingue", () => {
    for (const item of withLists) {
      const set = setFiles.get(item.decklists!.set);
      assert.ok(set, `${item.slug}: nessun file in scripts/data con slug ${item.decklists!.set}`);
      assert.deepEqual(
        set.decks.map((d) => ({ name: d.name, archetype: d.archetype, legendary: d.legendary, cards: d.cards })),
        item.decklists!.decks,
        `${item.slug}: liste diverse da scripts/data`,
      );
      const keys = Object.keys(set.guide).filter((k) => k !== "lang").sort();
      assert.ok(keys.every((k) => k === "summary" || (DECK_SET_GUIDE_SECTIONS as readonly string[]).includes(k)), keys.join(","));
      for (const l of locales.filter((x) => x !== set.guide.lang)) assert.deepEqual(Object.keys(set.translations[l] ?? {}).sort(), keys, `${set.slug}: traduzione ${l}`);
    }
  });
});
