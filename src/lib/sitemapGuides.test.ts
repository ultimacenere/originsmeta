/**
 * Test delle guide della community nelle sitemap (pacchetto GUIDE, 27/09/2026): `node --test src/lib/sitemapGuides.test.ts`.
 * Le guide stanno nella sezione "guides" accanto alle editoriali, solo nelle lingue in cui la pagina si indicizza (con
 * hreflang solo verso quelle), e la loro data sposta il lastmod di /guides. Stesso hook di risoluzione dei moduli di
 * sitemapEntries.test.ts (import senza estensione, JSON dichiarati).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

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
const mod: typeof import("./sitemapEntries") = await import("./sitemapEntries.ts");
const { COMMUNITY_SECTIONS, EMPTY_COMMUNITY, sectionEntries, sitemapIndexEntries, sitemapPages } = mod;

type Locale = "en" | "it" | "es";
const SITE = "https://originsmeta.com";
const TODAY = "2026-09-30";

const community = {
  ...EMPTY_COMMUNITY,
  communityGuides: {
    guides: [
      { slug: "dorothy-combo-ab12", updated_at: "2026-09-28T10:00:00+00:00", locales: ["es"] as Locale[] },
      { slug: "mulligan-cd34", updated_at: "2026-09-27T08:00:00+00:00", locales: ["en", "it", "es"] as Locale[] },
    ],
    latest: "2026-09-29T09:00:00+00:00",
  },
};

describe("guide della community nelle sitemap", () => {
  const pages = sitemapPages(community);

  test("la sezione delle guide legge i dati della community", () => {
    assert.ok(COMMUNITY_SECTIONS.includes("guides"));
  });

  test("ogni guida solo nelle sue lingue, con hreflang verso quelle", () => {
    const es = sectionEntries(pages, "guides", "es", TODAY).filter((e) => e.url.includes("/guides/community/"));
    const it = sectionEntries(pages, "guides", "it", TODAY).filter((e) => e.url.includes("/guides/community/"));
    assert.deepEqual(es.map((e) => e.url).sort(), [`${SITE}/es/guides/community/dorothy-combo-ab12`, `${SITE}/es/guides/community/mulligan-cd34`]);
    assert.deepEqual(
      it.map((e) => e.url),
      [`${SITE}/it/guides/community/mulligan-cd34`],
    );
    const solo = es.find((e) => e.url.endsWith("dorothy-combo-ab12"));
    assert.deepEqual(Object.keys(solo?.alternates ?? {}).sort(), ["es", "x-default"]);
    assert.equal(solo?.alternates?.["x-default"], `${SITE}/es/guides/community/dorothy-combo-ab12`);
    assert.equal(solo?.lastmod, "2026-09-28");
  });

  test("/guides si sposta con l'ultima guida della community", () => {
    const hub = sectionEntries(pages, "pages", "en", TODAY).find((e) => e.url === `${SITE}/en/guides`);
    assert.equal(hub?.lastmod, "2026-09-29");
    const before = sectionEntries(sitemapPages(EMPTY_COMMUNITY), "pages", "en", TODAY).find((e) => e.url === `${SITE}/en/guides`);
    assert.ok((before?.lastmod ?? "") <= "2026-09-29");
  });

  test("senza guide della community le sitemap restano quelle di prima", () => {
    const withGuides = sitemapIndexEntries(pages, TODAY).map((i) => i.url);
    const without = sitemapIndexEntries(sitemapPages(EMPTY_COMMUNITY), TODAY).map((i) => i.url);
    assert.deepEqual(withGuides, without, "le guide editoriali tengono già in vita le sitemap delle guide in ogni lingua");
    assert.ok(!sectionEntries(sitemapPages(EMPTY_COMMUNITY), "guides", "es", TODAY).some((e) => e.url.includes("/guides/community/")));
  });
});
