/**
 * /analytics come fonte dei win rate (09/11/2026): `node --test src/lib/analyticsSource.test.ts`.
 * Testi in otto lingue, la riga da citare e il nodo Dataset, senza numeri dei dati.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
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
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});


// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const mod: typeof import("./analyticsSource") = await import("./analyticsSource.ts");
const { analyticsCitation, analyticsDataset, analyticsSourceLabels } = mod;

const locales = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;

describe("fonte di /analytics", () => {
  test("ogni lingua ha tutti i testi, la riga da citare con patch e indirizzo", () => {
    assert.deepEqual(Object.keys(analyticsSourceLabels).sort(), [...locales].sort());
    for (const l of locales) {
      const t = analyticsSourceLabels[l];
      for (const [k, v] of Object.entries(t)) assert.ok(Array.isArray(v) ? v.length === 6 : String(v).trim().length > 0, `${l}.${k}`);
      assert.match(t.cite, /\{patch\}/, l);
      assert.match(t.cite, /\{url\}/, l);
      const line = analyticsCitation(l, "0.8");
      assert.ok(line.includes(`https://originsmeta.com/${l}/analytics`), l);
      assert.ok(line.includes("0.8") && !/[{}]/.test(line), l);
      assert.match(t.what, /OriginsMeta Tracker/, l);
    }
  });

  test("mai il numero di giocatori né una soglia (regole del 12/10/2026)", () => {
    for (const l of locales) {
      const text = Object.values(analyticsSourceLabels[l]).flat().join(" ");
      assert.doesNotMatch(text, /\bplayers? (?:contributed|recorded)|giocatori che|soglia|threshold|seuil|umbral|limiar|Schwelle|порог|阈值/i, l);
    }
  });

  test("francese: spazio insecabile prima di : ; ? ! e dentro « »", () => {
    const text = Object.values(analyticsSourceLabels.fr).flat().join(" ");
    assert.doesNotMatch(text, / [:;?!»]/);
    assert.doesNotMatch(text, /« /);
  });

  test("il nodo Dataset ha nome, descrizione, indirizzo e chi lo fa, con un @id per lingua", () => {
    const ids = new Set<string>();
    for (const l of locales) {
      const d = analyticsDataset(l);
      assert.equal(d["@type"], "Dataset");
      assert.equal(d["@context"], "https://schema.org");
      assert.equal(d.url, `https://originsmeta.com/${l}/analytics`);
      const description = String(d.description);
      assert.ok(description.length >= 50 && description.length <= 5000, `${l}: description di ${description.length}`);
      assert.match(description, /Origins TCG/);
      assert.deepEqual(d.creator, { "@id": "https://originsmeta.com/#organization" });
      assert.equal(d.isAccessibleForFree, true);
      ids.add(String(d["@id"]));
    }
    assert.equal(ids.size, locales.length);
  });
});
