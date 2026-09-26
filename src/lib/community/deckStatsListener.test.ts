/**
 * Test dell'aggancio dei contatori dei mazzi alla misura del sito (pacchetto STATS, 26/09/2026): `onTrackedEvent` e
 * l'attributo `data-om-deck-stat` in src/lib/analytics.ts. Runner integrato di Node:
 * `node --test src/lib/community/deckStatsListener.test.ts`.
 *
 * Come analytics.test.ts: analytics.ts importa `./consent` e `./discord` senza estensione, quindi prima di caricarlo si
 * registra un hook di risoluzione che aggiunge `.ts`; poi un browser finto e minimo (window = globalThis, location,
 * localStorage e la coda `window.va` di Vercel).
 */
import * as nodeModule from "node:module";
import { before, describe, mock, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
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
    return next(specifier, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const A: typeof import("../analytics") = await import("../analytics.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const S: typeof import("./deckStats") = await import("./deckStats.ts");

const store = new Map<string, string>();
const vaCalls: unknown[][] = [];
const vercelEvents = () => vaCalls.filter((c) => c[0] === "event");

describe("contatori dei mazzi agganciati agli eventi", () => {
  before(() => {
    const define = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    define("window", globalThis);
    define("location", { href: "https://originsmeta.com/it/decks/community/spellcast-ab12", origin: "https://originsmeta.com", pathname: "/it/decks/community/spellcast-ab12", search: "", hash: "", hostname: "originsmeta.com" });
    define("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
    define("va", (...args: unknown[]) => void vaCalls.push(args));
    mock.method(console, "info", () => {});
  });

  test("chi ascolta riceve gli eventi che partono, con i parametri puliti; la copia dalla scheda è un contatore", () => {
    const got: [string, Record<string, unknown>][] = [];
    const off = A.onTrackedEvent((name, params) => void got.push([name, { ...params }]));
    A.trackEvent("game_code_copy", { placement: "deck_page" });
    assert.deepEqual(got, [["game_code_copy", { placement: "deck_page" }]]);
    assert.equal(S.statKindForEvent(got[0][0], got[0][1]), "code");
    off();
    A.trackEvent("game_code_copy", { placement: "deck_page" });
    assert.equal(got.length, 1, "dopo la disiscrizione niente");
  });

  test("un ascoltatore rotto non ferma la misura", () => {
    const off = A.onTrackedEvent(() => {
      throw new Error("rotto");
    });
    const before = vercelEvents().length;
    A.trackEvent("deck_open_builder", { placement: "deck_page" });
    assert.equal(vercelEvents().length, before + 1);
    off();
  });

  test("browser dello staff (traffico interno): agli ascoltatori non arriva nulla, come a Vercel", () => {
    const got: string[] = [];
    const off = A.onTrackedEvent((name) => void got.push(name));
    store.set(A.INTERNAL_KEY, "1");
    try {
      const before = vercelEvents().length;
      A.trackEvent("game_code_copy", { placement: "deck_page" });
      assert.deepEqual(got, []);
      assert.equal(vercelEvents().length, before);
    } finally {
      store.delete(A.INTERNAL_KEY);
      off();
    }
  });

  test("data-om-deck-stat non diventa un parametro dell'evento", () => {
    assert.deepEqual(A.datasetEvent({ omEvent: "deck_open_builder", omPlacement: "deck_page", omDeckStat: "video" }), {
      name: "deck_open_builder",
      params: { placement: "deck_page" },
    });
  });
});
