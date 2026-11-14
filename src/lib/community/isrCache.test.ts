/**
 * Test del piano costi del 14/11/2026 (intervento 1, ISR a scadenza lunga), con il runner integrato di Node:
 * `node --test src/lib/community/isrCache.test.ts`.
 * - `pathInAllLocales` (localePaths.ts): i voti rinnovano la pagina in tutte le lingue, non solo in quella da cui si vota;
 * - il `revalidate` delle pagine, che Next vuole scritto come numero letterale, resta uguale alle costanti delle letture
 *   in cache (deckPageData.ts, communityPageCache.ts): se uno dei due cambia da solo, la pagina si rigenera con la
 *   scadenza più bassa dei due e il conto torna a salire senza che nessuno se ne accorga.
 * Stesso hook di risoluzione dei moduli di deckQuality.test.ts (`@/` e import senza estensione).
 */
import * as nodeModule from "node:module";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
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
const lp: typeof import("./localePaths") = await import("./localePaths.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const i18n: typeof import("../i18n") = await import("../i18n.ts");

describe("pathInAllLocales", () => {
  test("la scheda di un mazzo in tutte le lingue del sito", () => {
    const all = lp.pathInAllLocales("/it/decks/community/merlin-control-ab12");
    assert.deepEqual(
      all,
      i18n.locales.map((l) => `/${l}/decks/community/merlin-control-ab12`),
    );
  });

  test("anche dal cinese (lingua con il trattino) e per la sola home della lingua", () => {
    assert.equal(lp.pathInAllLocales("/zh-cn/decks/tournament/trio-x")?.[0], "/en/decks/tournament/trio-x");
    assert.deepEqual(
      lp.pathInAllLocales("/de"),
      i18n.locales.map((l) => `/${l}`),
    );
  });

  test("null fuori dai nostri percorsi: lingua che non c'è, niente lingua, caratteri strani", () => {
    for (const p of ["/xx/decks/community/a", "/decks/community/a", "/it/decks/community/A?x=1", "https://evil.example/it/x", "/it/../admin"]) assert.equal(lp.pathInAllLocales(p), null, p);
  });
});

describe("revalidate delle pagine = costanti delle letture in cache", () => {
  const read = (p: string) => readFileSync(new URL(p, srcUrl), "utf8");
  const pageRevalidate = (p: string) => Number(/export const revalidate = (\d+);/.exec(read(p))?.[1]);
  const constant = (p: string, name: string) => Number(new RegExp(`export const ${name} = ([\\d_]+);`).exec(read(p))?.[1].replaceAll("_", ""));

  test("schede dei mazzi della community", () => {
    assert.equal(pageRevalidate("app/[locale]/(site)/decks/community/[slug]/page.tsx"), constant("lib/community/deckPageData.ts", "DECK_PAGE_REVALIDATE"));
  });

  test("guide della community e mazzi torneo", () => {
    const c = constant("lib/community/communityPageCache.ts", "COMMUNITY_PAGE_REVALIDATE");
    assert.equal(pageRevalidate("app/[locale]/(site)/guides/community/[slug]/page.tsx"), c);
    assert.equal(pageRevalidate("app/[locale]/(site)/decks/tournament/[slug]/page.tsx"), c);
  });

  test("home", () => {
    assert.equal(pageRevalidate("app/[locale]/(home)/page.tsx"), constant("lib/community/communityPageCache.ts", "HOME_REVALIDATE"));
  });

  test("le pagine a scadenza lunga non leggono più `supabasePublic` direttamente (la fetch a 60 s le riporterebbe a un minuto)", () => {
    for (const p of [
      "app/[locale]/(site)/decks/community/[slug]/page.tsx",
      "app/[locale]/(site)/guides/community/[slug]/page.tsx",
      "app/[locale]/(site)/decks/tournament/[slug]/page.tsx",
      "components/guides/CommunityGuideView.tsx",
    ])
      assert.doesNotMatch(read(p), /from "@\/lib\/community\/(?:queries|guideQueries|deckSetQueries|trackerStatsQueries)"/, p);
  });
});
