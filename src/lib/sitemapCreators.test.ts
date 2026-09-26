/**
 * Sitemap e profilo pubblico (pacchetto CREATOR, 26/09/2026): `node --test src/lib/sitemapCreators.test.ts`.
 * La directory /creators entra nella sitemap delle pagine solo da tre creator in su, in tutte le lingue; il lastmod di
 * /u/<nome> segue anche la modifica di bio, canali e lingue. Stesso hook di risoluzione di sitemapEntries.test.ts
 * (i moduli di dati sono scritti per Next: import senza estensione, JSON senza attributi).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
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
const { sectionEntries, sitemapPages } = mod;

const TODAY = "2026-09-30";
const SITE = "https://originsmeta.com";
const base = {
  decks: [],
  tournaments: [],
  profiles: [{ username: "coachcrono", updated_at: "2026-09-20T12:00:00+00:00" }],
  tierLists: { byUser: [] as [string, string][] },
};

describe("sitemap del profilo pubblico e della directory dei creator", () => {
  test("/creators in sitemap solo da tre creator in su, in tutte le lingue", () => {
    const few = sitemapPages({ ...base, showcase: { creators: 2, byUser: [] } });
    assert.ok(!few.some((p) => p.path === "/creators"));
    const none = sitemapPages(base);
    assert.ok(!none.some((p) => p.path === "/creators"), "senza dati del profilo pubblico (migrazione non applicata) niente directory");
    const many = sitemapPages({ ...base, showcase: { creators: 4, latest: "2026-09-27T08:00:00+00:00", byUser: [] } });
    for (const locale of ["en", "it", "es"] as const) {
      const entry = sectionEntries(many, "pages", locale, TODAY).find((e) => e.url === `${SITE}/${locale}/creators`);
      assert.ok(entry, `manca /${locale}/creators`);
      assert.equal(entry.lastmod, "2026-09-27");
      assert.equal(Object.keys(entry.alternates ?? {}).length, 4, "hreflang delle tre lingue più x-default");
    }
  });
  test("il lastmod di /u/<nome> segue la modifica del profilo, mai nel futuro", () => {
    const edited = sitemapPages({ ...base, showcase: { creators: 1, byUser: [["coachcrono", "2026-09-28T09:00:00+00:00"]] } });
    const u = sectionEntries(edited, "community", "it", TODAY).find((e) => e.url.endsWith("/it/u/coachcrono"));
    assert.equal(u?.lastmod, "2026-09-28");
    const future = sitemapPages({ ...base, showcase: { creators: 1, byUser: [["coachcrono", "2026-10-05T09:00:00+00:00"]] } });
    assert.equal(sectionEntries(future, "community", "it", TODAY).find((e) => e.url.endsWith("/it/u/coachcrono"))?.lastmod, TODAY);
  });
});
