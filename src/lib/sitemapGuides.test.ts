/**
 * Test delle guide della community nelle sitemap (pacchetto GUIDE, 27/09/2026): `node --test src/lib/sitemapGuides.test.ts`.
 * Le guide stanno nella sezione "guides" accanto alle editoriali, solo nelle lingue in cui la pagina si indicizza (con
 * hreflang solo verso quelle), con la data di ogni versione e la copertina; /guides si sposta con le guide della community
 * che mostra (dal 29/09/2026 sono nel suo HTML, un elenco solo con le editoriali; dal 27 al 29/09 le caricava il browser e
 * la data non si spostava); l'elenco /guides/community c'è solo nelle lingue in cui ha almeno una guida.
 * Stesso hook di risoluzione dei moduli di sitemapEntries.test.ts (import senza estensione, JSON dichiarati).
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
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { getGuides }: typeof import("./content/guides") = await import("./content/guides.ts");

type Locale = "en" | "it" | "es" | "fr";
type Data = Parameters<typeof sitemapPages>[0];
const SITE = "https://originsmeta.com";
// dopo il 29/09/2026, ultimo cambio del modello delle pagine delle guide (PAGE_UPDATED): le date dei dati si vedono
// dopo il 07/10/2026 (nascita del francese, soglia di tutto il sito), così le date dei contenuti si vedono
const TODAY = "2026-10-13";
// Le guide editoriali si aggiornano a ogni patch o annuncio (`updated` in guides.ts): il test di /guides mette le date della
// community DOPO l'ultima editoriale, così è la community a spostare il lastmod e il test non scade al prossimo aggiornamento.
const addDays = (day: string, n: number) => new Date(Date.parse(day) + n * 86_400_000).toISOString().slice(0, 10);
const EDITORIAL_LATEST = (["en", "it", "es", "fr"] as Locale[]).flatMap((l) => getGuides(l).map((g) => g.updated)).sort().at(-1)!;

const community = {
  ...EMPTY_COMMUNITY,
  communityGuides: {
    guides: [
      { slug: "dorothy-combo-ab12", locales: ["es"] as Locale[], dates: { es: "2026-10-10T10:00:00+00:00" }, image: "/media/keyart-mulan.webp" },
      {
        slug: "mulligan-cd34",
        locales: ["en", "it", "es"] as Locale[],
        // la versione inglese è cambiata quando è arrivata la sua traduzione
        dates: { en: "2026-10-11T07:00:00.000Z", it: "2026-10-10T08:00:00+00:00", es: "2026-10-10T08:00:00+00:00" },
        image: "/media/keyart-king-arthur.webp",
      },
    ],
    hub: { en: "2026-10-11T07:00:00.000Z", it: "2026-10-10T08:00:00+00:00", es: "2026-10-11T09:00:00+00:00" },
    list: { en: "2026-10-11T07:00:00.000Z", it: "2026-10-10T08:00:00+00:00", es: "2026-10-11T09:00:00+00:00" },
  },
};

describe("guide della community nelle sitemap", () => {
  const pages = sitemapPages(community);

  test("la sezione delle guide legge i dati della community", () => {
    assert.ok(COMMUNITY_SECTIONS.includes("guides"));
  });

  test("ogni guida solo nelle sue lingue, con hreflang verso quelle, la data della sua versione e la copertina", () => {
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
    assert.equal(solo?.lastmod, "2026-10-10");
    assert.deepEqual(solo?.images, [`${SITE}/media/keyart-mulan.webp`]);
    const en = sectionEntries(pages, "guides", "en", TODAY).find((e) => e.url.endsWith("/en/guides/community/mulligan-cd34"));
    assert.equal(en?.lastmod, "2026-10-11", "la data della versione inglese");
    assert.equal(it[0].lastmod, "2026-10-10");
  });

  test("/guides si sposta con le guide della community che mostra nella lingua", () => {
    // dal 29/09/2026 le guide della community indicizzabili stanno nell'HTML di /guides (ISR), quindi ne spostano il lastmod.
    // Date dopo l'ultima guida editoriale (EDITORIAL_LATEST): l'italiano un giorno dopo, lo spagnolo due, "oggi" quattro.
    const itDay = addDays(EDITORIAL_LATEST, 1);
    const esDay = addDays(EDITORIAL_LATEST, 2);
    const today = addDays(EDITORIAL_LATEST, 4);
    const laterGuides = { ...community.communityGuides, hub: { en: `${esDay}T07:00:00.000Z`, it: `${itDay}T08:00:00+00:00`, es: `${esDay}T09:00:00+00:00` } };
    const later: Data = { ...community, communityGuides: laterGuides };
    const hub = (l: Locale, data: Data = later) => sectionEntries(sitemapPages(data), "pages", l, today).find((e) => e.url === `${SITE}/${l}/guides`)?.lastmod;
    assert.equal(hub("es"), esDay);
    assert.equal(hub("it"), itDay);
    // senza la guida spagnola di esDay la data resta quella del modello e delle editoriali, cioè prima
    assert.ok(hub("es", EMPTY_COMMUNITY)! < esDay, "senza guide della community la data del modello e delle editoriali");
    // una lingua senza guide della community da mostrare resta com'era
    const noIt: Data = { ...later, communityGuides: { ...laterGuides, hub: { es: `${esDay}T09:00:00+00:00` } } };
    for (const l of ["en", "it"] as const) assert.equal(hub(l, noIt), hub(l, EMPTY_COMMUNITY), l);
  });

  test("/guides/community solo nelle lingue in cui l'elenco ha almeno una guida, con la sua data", () => {
    const listOf = (l: Locale, data: Data) => sectionEntries(sitemapPages(data), "pages", l, TODAY).find((e) => e.url === `${SITE}/${l}/guides/community`);
    assert.equal(listOf("es", community)?.lastmod, "2026-10-11");
    const onlyEs: Data = { ...community, communityGuides: { ...community.communityGuides, list: { es: "2026-10-11T09:00:00+00:00" } } };
    assert.ok(listOf("es", onlyEs));
    assert.equal(listOf("it", onlyEs), undefined, "elenco vuoto in italiano: fuori dalla sitemap");
    assert.deepEqual(Object.keys(listOf("es", onlyEs)?.alternates ?? {}).sort(), ["es", "x-default"]);
    assert.equal(listOf("en", EMPTY_COMMUNITY), undefined);
  });

  test("senza guide della community le sitemap restano quelle di prima", () => {
    const withGuides = sitemapIndexEntries(pages, TODAY).map((i) => i.url);
    const without = sitemapIndexEntries(sitemapPages(EMPTY_COMMUNITY), TODAY).map((i) => i.url);
    assert.deepEqual(withGuides, without, "le guide editoriali tengono già in vita le sitemap delle guide in ogni lingua");
    assert.ok(!sectionEntries(sitemapPages(EMPTY_COMMUNITY), "guides", "es", TODAY).some((e) => e.url.includes("/guides/community/")));
    assert.ok(!sectionEntries(sitemapPages(EMPTY_COMMUNITY), "pages", "es", TODAY).some((e) => e.url.endsWith("/guides/community")));
  });
});
