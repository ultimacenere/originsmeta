/**
 * Test dei fumetti dei creator (pacchetto FUMETTI, 29/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/comics.test.ts`.
 *
 * - Regole pure di comics.ts: percorsi dei file, misure delle tavole, lettura del modulo, impronte e traduzioni, dove si
 *   indicizza una pagina, elenchi leggeri, sitemap, voci delle news e ordine con le news del sito, errori del database.
 * - Messaggio Discord (comicDiscord.ts) ed etichette nelle tre lingue (comicLabels.ts, avvisi di followLabels.ts).
 * - Blocco "29/09/2026: FUMETTI" di supabase/schema.sql uguale al codice: ruoli, limiti, vincoli, tetti, codici d'errore,
 *   grant per colonna, policy, trigger dei file, cartella e tetto del bucket, file in uso, avvisi a chi segue.
 * - Collegamenti: proxy, privacy, /account, set-badge.
 *
 * Import senza estensione come negli altri test della community: un hook di risoluzione aggiunge `.ts`.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
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
const C: typeof import("./comics") = await import("./comics.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./badges") = await import("./badges.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const M: typeof import("./profileMedia") = await import("./profileMedia.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const D: typeof import("./comicDiscord") = await import("./comicDiscord.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const T: typeof import("./deckTranslation") = await import("./deckTranslation.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../comicLabels") = await import("../comicLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const F: typeof import("../followLabels") = await import("../followLabels.ts");
const S: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const sorted = (xs: readonly string[]) => [...xs].sort();
const quoted = (s: string) => [...s.matchAll(/'([a-z0-9_-]+)'/g)].map((m) => m[1]);

const OWNER = "0d0a3c9e-1234-4abc-9def-0123456789ab";
const OTHER = "11111111-2222-4333-8444-555555555555";
const file = (n: number) => `${OWNER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a8${n}.webp`;
const BASE = "https://obpnprlzxrlbvncpqlpq.supabase.co";
const LOCALES = ["en", "it", "es"] as const;

/** Un modulo finto: i campi come li manda il modulo del browser. */
const form = (fields: Record<string, unknown>) => ({ get: (k: string) => (k in fields ? fields[k] : null) });
const page = (n: number, text = "") => ({ path: file(n), width: 1080, height: 1920, text });
const SUMMARY = "Vega racconta la settimana di Origins TCG: le novità della demo, il Kickstarter e una partita da ricordare.";

describe("fumetti: file e tavole", () => {
  test("percorsi nella cartella dei fumetti del proprietario", () => {
    assert.ok(C.comicPathOk(file(1), OWNER));
    assert.ok(C.comicPathOk(file(1)), "senza proprietario basta una cartella valida");
    assert.ok(!C.comicPathOk(file(1), OTHER), "cartella di un altro");
    assert.ok(!C.comicPathOk(`${OWNER}/guide/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp`, OWNER));
    assert.ok(!C.comicPathOk(`${OWNER}/comic/../x.webp`, OWNER));
    assert.ok(!C.comicPathOk(`${OWNER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.svg`, OWNER));
    assert.ok(!C.comicPathOk(`${OWNER}/comic/${"a".repeat(170)}.webp`), "oltre i 200 caratteri");
    assert.equal(C.comicPath("vega-settimana-1-ab12"), "/news/comics/vega-settimana-1-ab12");
    assert.equal(C.comicImageUrl(file(1), BASE), `${BASE}/storage/v1/object/public/profile-media/${file(1)}`);
    assert.ok(M.MEDIA_KINDS.includes(C.COMIC_FOLDER as never));
  });

  test("misure delle tavole: intere, dentro 1080 × 1920, almeno 100", () => {
    assert.ok(C.pageSizeOk(1080, 1920));
    assert.ok(C.pageSizeOk(1080, 1350));
    assert.ok(C.pageSizeOk(100, 100));
    for (const [w, h] of [
      [1081, 1920],
      [1080, 1921],
      [99, 500],
      [500, 99],
      [1080.5, 1920],
      ["1080", 1920],
    ] as const) {
      assert.ok(!C.pageSizeOk(w, h), `${w}×${h}`);
    }
    assert.deepEqual(C.COMIC_PAGE_BOX, { width: 1080, height: 1920 });
  });

  test("tavole lette dal database: solo quelle giuste, al massimo 10", () => {
    const raw = [page(1, "Ciao"), { path: file(2), width: 1080, height: 3000, text: "" }, { path: `${OTHER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp`, width: 100, height: 100, text: "" }, null, "x", { path: file(3), width: 800, height: 600 }];
    assert.deepEqual(C.storedPages(raw, OWNER), [page(1, "Ciao"), { path: file(3), width: 800, height: 600, text: "" }]);
    assert.equal(C.storedPages(Array.from({ length: 12 }, (_, i) => page(i)), OWNER).length, 10);
    assert.deepEqual(C.storedPages("x", OWNER), []);
  });
});

describe("fumetti: modulo", () => {
  const ok = { lang: "es", title: "La semana de Vega", summary: SUMMARY, pages: JSON.stringify([page(1, "¡Hola!"), page(2)]), cover_path: file(9) };

  test("una pubblicazione completa passa, con testi puliti e tavole nell'ordine", () => {
    const r = C.readComicForm(form(ok), "publish", OWNER);
    assert.ok(r.ok);
    assert.equal(r.value.lang, "es");
    assert.equal(r.value.title, "La semana de Vega");
    assert.deepEqual(
      r.value.pages.map((p) => p.path),
      [file(1), file(2)],
    );
    assert.equal(r.value.pages[0].text, "¡Hola!");
    assert.equal(r.value.cover_path, file(9));
  });

  test("una bozza si salva anche a metà", () => {
    const r = C.readComicForm(form({ lang: "it", title: "B", summary: "", pages: "", cover_path: "" }), "draft", OWNER);
    assert.ok(r.ok);
    assert.deepEqual(r.value.pages, []);
    assert.equal(r.value.cover_path, null);
  });

  test("errori: lingua, titolo, presentazione, tavole, tavola, copertina", () => {
    const err = (f: Record<string, unknown>, intent: "draft" | "publish" = "publish") => {
      const r = C.readComicForm(form({ ...ok, ...f }), intent, OWNER);
      return r.ok ? null : r.error;
    };
    assert.deepEqual(err({ lang: "de" }), { code: "lang" });
    assert.deepEqual(err({ title: "ab" }), { code: "title" });
    assert.deepEqual(err({ summary: "Corta." }), { code: "summary" });
    assert.deepEqual(err({ pages: "[]" }), { code: "pages" });
    assert.deepEqual(err({ pages: "non json" }), { code: "pages" });
    assert.deepEqual(err({ pages: JSON.stringify(Array.from({ length: 11 }, (_, i) => page(i))) }), { code: "pages" });
    assert.deepEqual(err({ pages: JSON.stringify([page(1), page(1)]) }), { code: "page", index: 1 }, "stesso file due volte");
    assert.deepEqual(err({ pages: JSON.stringify([page(1), { ...page(2), path: `${OTHER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp` }]) }), { code: "page", index: 1 });
    assert.deepEqual(err({ pages: JSON.stringify([{ ...page(1), width: 2000 }]) }), { code: "page", index: 0 });
    assert.deepEqual(err({ cover_path: "" }), { code: "cover" }, "per pubblicare serve la copertina");
    assert.deepEqual(err({ cover_path: `${OTHER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp` }, "draft"), { code: "cover" });
    assert.equal(C.comicErrorField({ code: "page", index: 3 }), "page-3");
    assert.equal(C.comicErrorField({ code: "cover" }), "cover");
  });

  test("testo semplice anche nelle tavole: niente controlli né invisibili, righe vuote compattate", () => {
    const r = C.readComicForm(form({ ...ok, pages: JSON.stringify([page(1, "A:\u200b ciao\n\n\n\nB: ehi")]) }), "publish", OWNER);
    assert.ok(r.ok);
    assert.equal(r.value.pages[0].text, "A: ciao\n\nB: ehi");
  });
});

describe("fumetti: traduzioni e indicizzazione", () => {
  const comic = { lang: "es" as const, title: "La semana de Vega", summary: SUMMARY, pages: [page(1, "¡Hola!"), page(2), page(3, "Adiós")], translations: null as never };
  const hash = C.comicHash(comic);

  test("impronta: lingua, titolo, presentazione e testi delle tavole", () => {
    assert.equal(C.comicHash({ ...comic }), hash);
    assert.notEqual(C.comicHash({ ...comic, lang: "it" }), hash);
    assert.notEqual(C.comicHash({ ...comic, title: "Otra semana" }), hash, "il titolo si traduce: cambiarlo rende vecchie le traduzioni");
    assert.notEqual(C.comicHash({ ...comic, pages: [page(1, "¡Hola!"), page(2), page(3, "Adiós!")] }), hash);
    // le misure e i file non cambiano il testo
    assert.equal(C.comicHash({ ...comic, pages: comic.pages.map((p) => ({ ...p, path: file(7) })) }), hash);
  });

  test("al modello solo le tavole con un testo; la risposta torna al suo posto", () => {
    const doc = C.comicTranslationDoc(comic);
    assert.deepEqual(Object.keys(doc), ["title", "summary", "page_1", "page_3"]);
    const text = C.comicTextFromDoc({ title: " La settimana\ndi Vega ", summary: "Vega racconta la settimana.", page_1: "Ciao!", page_3: "Addio" }, comic);
    assert.deepEqual(text, { title: "La settimana di Vega", summary: "Vega racconta la settimana.", pages: ["Ciao!", "", "Addio"] });
    assert.equal(C.comicTextFromDoc({ title: "T", summary: "x" }, comic), null, "manca una tavola");
    assert.equal(C.comicTextFromDoc({ summary: "Vega racconta.", page_1: "Ciao!", page_3: "Addio" }, comic), null, "manca il titolo");
    assert.ok(C.COMIC_TRANSLATION_SYSTEM.includes(T.TRANSLATION_RULES), "stesse regole e stesso glossario delle guide");
    assert.match(C.COMIC_TRANSLATION_SYSTEM, /"title" is its title/);
    assert.doesNotMatch(C.COMIC_TRANSLATION_SYSTEM, /never translated/);
  });

  test("traduzione aggiornata solo con la stessa impronta; lingue da tradurre; testo da mostrare", () => {
    const it = { hash, at: "2026-09-29T10:00:00Z", comic: { title: "La settimana di Vega", summary: "Vega racconta.", pages: ["Ciao!", "", "Addio"] } };
    const withIt = { ...comic, translations: { it } };
    assert.ok(C.freshComicTranslation(withIt, "it"));
    assert.equal(C.freshComicTranslation({ ...withIt, summary: `${SUMMARY} Otra frase.` }, "it"), null, "testo cambiato");
    assert.deepEqual(C.missingComicLocales(withIt, LOCALES), ["en"]);
    assert.deepEqual(C.localizedComic(withIt, "it"), { text: it.comic, lang: "it", translated: true, edition: false, pages: comic.pages, cover_path: null });
    assert.deepEqual(C.localizedComic(withIt, "en"), { text: { title: "La semana de Vega", summary: SUMMARY, pages: ["¡Hola!", "", "Adiós"] }, lang: "es", translated: false, edition: false, pages: comic.pages, cover_path: null });
    assert.deepEqual(C.comicIndexing({ ...withIt, status: "published" }, LOCALES, "it"), { languages: ["it", "es"], noindex: false });
    assert.deepEqual(C.comicIndexing({ ...withIt, status: "published" }, LOCALES, "en"), { languages: ["it", "es"], noindex: true });
    assert.deepEqual(C.comicIndexing({ ...withIt, status: "draft" }, LOCALES, "es"), { languages: [], noindex: true });
    // una traduzione con un testo per tavola in meno, o senza titolo, non vale
    assert.equal(C.freshComicTranslation({ ...comic, translations: { it: { ...it, comic: { ...it.comic, pages: ["a"] } } } }, "it"), null);
    const { title: _drop, ...untitled } = it.comic;
    void _drop;
    assert.equal(C.freshComicTranslation({ ...comic, translations: { it: { ...it, comic: untitled as never } } }, "it"), null);
  });

  test("elenchi: lingue, presentazione e data dalle colonne leggere", () => {
    const item = {
      id: "1",
      slug: "semana-ab12",
      owner: OWNER,
      lang: "es" as const,
      title: "La semana",
      summary: SUMMARY,
      cover_path: file(9),
      status: "published" as const,
      text_hash: hash,
      tr: { it: { hash, at: "2026-09-29T12:00:00Z", summary: "Vega racconta.", title: "La settimana" }, en: { hash: "vecchia", at: "2026-09-29T11:00:00Z", summary: "Old.", title: "Old" } },
      created_at: "2026-09-29T09:00:00Z",
      updated_at: "2026-09-29T10:00:00Z",
      published_at: "2026-09-29T09:30:00Z",
      profile: { username: "vegakiles", display_name: "Vega", avatar_url: null, badge: "creator" },
    };
    assert.deepEqual(C.comicListLocales(item, LOCALES), ["it", "es"]);
    assert.deepEqual(C.comicListSummary(item, "it"), { text: "Vega racconta.", lang: "it" });
    assert.deepEqual(C.comicListSummary(item, "en"), { text: SUMMARY, lang: "es" }, "traduzione vecchia: l'originale");
    assert.deepEqual(C.comicListTitle(item, "it"), { text: "La settimana", lang: "it" });
    assert.deepEqual(C.comicListTitle(item, "en"), { text: "La semana", lang: "es" }, "traduzione vecchia: il titolo dell'autore");
    assert.deepEqual(C.comicListTitle({ ...item, tr: { it: { ...item.tr.it, title: "Due\nrighe" } } }, "it"), { text: "La semana", lang: "es" });
    assert.equal(C.comicListDate(item, "it"), "2026-09-29T12:00:00Z");
    assert.equal(C.comicListDate(item, "es"), "2026-09-29T10:00:00Z");
    const sm = C.sitemapComics([item, { ...item, slug: "bozza-cd34", status: "draft" as const, published_at: "2026-09-30T00:00:00Z" }], LOCALES);
    assert.deepEqual(sm.comics, [{ slug: "semana-ab12", locales: ["it", "es"], dates: { it: "2026-09-29T12:00:00Z", es: "2026-09-29T10:00:00Z" } }]);
    assert.equal(sm.latest, "2026-09-29T09:30:00Z", "le bozze non contano");
    const [card] = C.comicFeedCards([item], "it", BASE, (p) => p?.display_name ?? "?");
    assert.deepEqual(card, {
      slug: "semana-ab12",
      path: "/news/comics/semana-ab12",
      title: "La settimana",
      summary: "Vega racconta.",
      date: "2026-09-29T09:30:00Z",
      image: `${BASE}/storage/v1/object/public/profile-media/${file(9)}`,
      author: { name: "Vega", username: "vegakiles" },
    });
  });

  test("news e fumetti in un solo elenco: dal più recente, a pari giorno prima il fumetto", () => {
    const news = [{ date: "2026-09-29", slug: "a" }, { date: "2026-09-28", slug: "b" }, { date: "2026-09-25", slug: "c" }];
    const comic = (date: string, slug: string) => ({ slug, path: `/news/comics/${slug}`, title: slug, summary: "", date, image: null, author: { name: "Vega", username: "vegakiles" } });
    const feed = C.mergeFeed(news, [comic("2026-09-28T20:00:00Z", "f1"), comic("2026-09-30T08:00:00Z", "f2")]);
    assert.deepEqual(
      feed.map((e) => (e.kind === "news" ? e.item.slug : e.comic.slug)),
      ["f2", "a", "f1", "b", "c"],
    );
  });
});

describe("fumetti: versioni disegnate in altre lingue (30/09/2026)", () => {
  const it = { title: "Settimana uno", summary: SUMMARY, pages: [page(4, "Ciao!"), page(5)], cover_path: file(6) };
  const es = { title: "Semana uno", summary: SUMMARY, pages: [page(7, "¡Hola!")], cover_path: null };
  const comic = { lang: "en" as const, title: "Week one", summary: SUMMARY, pages: [page(1, "Hi!"), page(2)], cover_path: file(3), translations: null, editions: { it, es } };

  test("dal database: solo le altre lingue, file del proprietario, anche a metà", () => {
    const raw = { it, es: { ...es, cover_path: `${OTHER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp` }, en: it, de: it, xx: "no" };
    const stored = C.storedEditions(raw, OWNER, "en");
    assert.deepEqual(Object.keys(stored).sort(), ["es", "it"], "mai la lingua del fumetto, mai lingue che non ci sono");
    assert.equal(stored.es?.cover_path, null, "copertina di un'altra cartella: niente");
    assert.deepEqual(C.storedEditions({ it: { title: 3, pages: "x" } }, OWNER, "en"), { it: { title: "", summary: "", pages: [], cover_path: null } });
    assert.deepEqual(C.storedEditions(null, OWNER, "en"), {});
    assert.deepEqual(C.storedEditions([it], OWNER, "en"), {});
  });

  test("tutti i file del fumetto, senza doppioni", () => {
    assert.deepEqual(C.comicFiles({ owner: OWNER, ...comic }).sort(), [file(1), file(2), file(3), file(4), file(5), file(6), file(7)].sort());
    assert.deepEqual(C.comicFiles({ owner: OWNER, pages: [page(1)], cover_path: file(1), editions: { it: { ...it, pages: [page(1)], cover_path: `${OTHER}/comic/x.webp` } } }), [file(1)]);
  });

  test("la pagina in una lingua con la versione disegnata: tavole, testi e copertina suoi, niente traduzione", () => {
    const itView = C.localizedComic(comic, "it");
    assert.deepEqual(itView, { text: { title: "Settimana uno", summary: SUMMARY, pages: ["Ciao!", ""] }, lang: "it", translated: false, edition: true, pages: it.pages, cover_path: file(6) });
    assert.equal(C.localizedComic(comic, "es").cover_path, file(3), "senza copertina sua vale quella del fumetto");
    assert.equal(C.localizedComic(comic, "en").edition, false);
    assert.deepEqual(C.localizedComic(comic, "en").pages, comic.pages);
    // una versione a metà (una bozza) non si mostra
    const half = { ...comic, editions: { it: { ...it, summary: "" }, es: { ...es, pages: [] } } };
    assert.equal(C.comicEdition(half, "it"), null);
    assert.equal(C.comicEdition(half, "es"), null);
    assert.equal(C.localizedComic(half, "it").edition, false);
    assert.equal(C.comicEdition({ ...comic, lang: "it" }, "it"), null, "mai nella lingua dei testi");
  });

  test("indicizzazione e traduzioni: le lingue con la versione disegnata si indicizzano e non si traducono", () => {
    assert.deepEqual(C.comicIndexing({ ...comic, status: "published" }, LOCALES, "es"), { languages: ["en", "it", "es"], noindex: false });
    assert.deepEqual(C.missingComicLocales(comic, LOCALES), []);
    assert.deepEqual(C.missingComicLocales({ ...comic, editions: { it } }, LOCALES), ["es"]);
    assert.deepEqual(C.comicIndexing({ ...comic, editions: { it }, status: "published" }, LOCALES, "es"), { languages: ["en", "it"], noindex: true });
  });

  test("modulo: versioni lette, controllate e con l'errore giusto", () => {
    const base = { lang: "en", title: "Week one", summary: SUMMARY, pages: JSON.stringify([page(1, "Hi!")]), cover_path: file(3) };
    const withEd = (editions: unknown, intent: "draft" | "publish" = "publish") => C.readComicForm(form({ ...base, editions: JSON.stringify(editions) }), intent, OWNER);
    const r = withEd({ it: { title: " Settimana\nuno ", summary: SUMMARY, pages: [page(4, "Ciao!")], cover_path: "" } });
    assert.ok(r.ok);
    assert.deepEqual(r.value.editions, { it: { title: "Settimana uno", summary: SUMMARY, pages: [page(4, "Ciao!")], cover_path: null } });
    const none = C.readComicForm(form(base), "publish", OWNER);
    assert.ok(none.ok);
    assert.deepEqual(none.value.editions, {}, "senza il campo: nessuna versione");
    const err = (editions: unknown, intent: "draft" | "publish" = "publish") => {
      const x = withEd(editions, intent);
      return x.ok ? null : x.error;
    };
    assert.deepEqual(err({ en: it }), { code: "editions" }, "la lingua del fumetto");
    assert.deepEqual(err({ de: it }), { code: "editions" });
    assert.deepEqual(err([it]), { code: "editions" });
    assert.deepEqual(C.readComicForm(form({ ...base, editions: "{rotto" }), "publish", OWNER), { ok: false, error: { code: "editions" } });
    assert.deepEqual(err({ it: { ...it, title: "ab" } }), { code: "edition_title", edition: "it" });
    assert.deepEqual(err({ es: { ...es, summary: "Corta." } }), { code: "edition_summary", edition: "es" });
    assert.deepEqual(err({ it: { ...it, pages: [] } }), { code: "edition_pages", edition: "it" });
    assert.deepEqual(err({ it: { ...it, pages: [page(4), { ...page(5), width: 5000 }] } }), { code: "edition_page", edition: "it", index: 1 });
    assert.deepEqual(err({ it: { ...it, cover_path: `${OTHER}/comic/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp` } }), { code: "edition_cover", edition: "it" });
    // una bozza si salva anche con una versione appena aggiunta, vuota
    assert.equal(err({ it: { title: "", summary: "", pages: [], cover_path: null } }, "draft"), null);
    assert.equal(C.comicErrorField({ code: "edition_page", edition: "it", index: 2 }), "ed-it-page-2");
    assert.equal(C.comicErrorField({ code: "edition_title", edition: "es" }), "ed-es-title");
    assert.equal(C.comicErrorField({ code: "edition_pages", edition: "es" }), "ed-es-pages");
    assert.equal(C.comicErrorField({ code: "editions" }), "editions");
    assert.equal(C.comicErrorCode({ code: "23514", message: 'violates check constraint "community_comics_editions_check"' }), "editions");
  });

  test("elenchi: titolo, presentazione, copertina, lingue e data della versione disegnata", () => {
    const item = {
      id: "1",
      slug: "week-one-ab12",
      owner: OWNER,
      lang: "en" as const,
      title: "Week one",
      summary: SUMMARY,
      cover_path: file(3),
      status: "published" as const,
      text_hash: "h",
      tr: { es: { hash: "h", at: "2026-09-30T12:00:00Z", summary: "Traducción automática.", title: "Semana (automática)" } },
      ed: { it: { title: "Settimana uno", summary: SUMMARY, cover_path: file(6), page: file(4) }, es: { title: "Semana uno", summary: SUMMARY, cover_path: null, page: file(7) } },
      created_at: "2026-09-29T09:00:00Z",
      updated_at: "2026-09-30T10:00:00Z",
      published_at: "2026-09-29T09:30:00Z",
      profile: { username: "vegakiles", display_name: "Vega", avatar_url: null, badge: "creator" },
    };
    assert.deepEqual(C.comicListLocales(item, LOCALES), ["en", "it", "es"]);
    assert.deepEqual(C.comicListTitle(item, "it"), { text: "Settimana uno", lang: "it" });
    assert.deepEqual(C.comicListTitle(item, "es"), { text: "Semana uno", lang: "es" }, "la versione disegnata vince sulla traduzione");
    assert.deepEqual(C.comicListSummary(item, "es"), { text: SUMMARY, lang: "es" });
    assert.equal(C.comicListCover(item, "it"), file(6));
    assert.equal(C.comicListCover(item, "es"), file(3), "senza copertina sua quella del fumetto");
    assert.equal(C.comicListDate(item, "es"), "2026-09-30T10:00:00Z", "la data della versione disegnata è l'ultima modifica");
    const [card] = C.comicFeedCards([item], "it", BASE, (p) => p?.display_name ?? "?");
    assert.equal(card.title, "Settimana uno");
    assert.equal(card.titleLang, undefined);
    assert.equal(card.image, `${BASE}/storage/v1/object/public/profile-media/${file(6)}`);
    // senza prima tavola (una versione a metà) conta la traduzione, o l'originale
    const half = { ...item, ed: { es: { ...item.ed.es, page: null } } };
    assert.deepEqual(C.comicListTitle(half, "es"), { text: "Semana (automática)", lang: "es" });
    assert.deepEqual(C.comicListTitle(half, "it"), { text: "Week one", lang: "en" });
    assert.deepEqual(C.sitemapComics([item], LOCALES).comics[0].locales, ["en", "it", "es"]);
  });
});

describe("fumetti: errori del database", () => {
  test("tetti e regole dei trigger, vincoli, tabella mancante, policy", () => {
    assert.equal(C.comicErrorCode({ message: "comic_hidden_recent" }), "comic_hidden_recent");
    assert.equal(C.comicErrorCode({ message: "comic_hidden" }), "comic_hidden");
    assert.equal(C.comicErrorCode({ message: "comic_daily_limit" }), "comic_daily_limit");
    assert.equal(C.comicErrorCode({ code: "23514", message: "comic_file" }), "comic_file");
    assert.equal(C.comicErrorCode({ code: "23514", message: 'new row for relation "community_comics" violates check constraint "community_comics_cover_required"' }), "cover");
    assert.equal(C.comicErrorCode({ code: "23514", message: 'violates check constraint "community_comics_pages_check"' }), "pages");
    assert.equal(C.comicErrorCode({ code: "PGRST205", message: "Could not find the table 'public.community_comics' in the schema cache" }), "unavailable");
    assert.equal(C.comicErrorCode({ code: "42501", message: "new row violates row-level security policy" }), "forbidden");
    assert.equal(C.comicErrorCode({ code: "23505", message: "duplicate key" }), "duplicate");
    assert.equal(C.comicErrorCode(null), "db");
  });
});

describe("fumetti: annuncio su Discord", () => {
  const c = { slug: "semana-ab12", title: "La **semana**", lang: "es" as const, author: "Vega @everyone", summary: "Una _semana_ intensa.", image: `${BASE}/storage/v1/object/public/profile-media/${file(9)}` };

  test("titolo, link nelle tre lingue, autore e copertina del bucket", () => {
    const p = D.comicPayload(c);
    const e = p.embeds?.[0];
    assert.ok(e);
    assert.match(p.content ?? "", /Nuovo fumetto · New comic · Nuevo cómic/);
    assert.equal(e.url?.split("?")[0], "https://originsmeta.com/es/news/comics/semana-ab12");
    for (const l of LOCALES) assert.ok(e.description?.includes(`https://originsmeta.com/${l}/news/comics/semana-ab12?`), l);
    assert.ok(e.description?.includes("Cómic de Vega"));
    assert.ok(!e.description?.includes("_semana_"), "il Markdown dei testi dell'utente si annulla");
    assert.equal(e.image?.url, c.image);
  });

  test("nessuna immagine fuori dalla cartella dei fumetti del nostro bucket", () => {
    for (const image of ["https://evil.example/x.webp", `${BASE}/storage/v1/object/public/profile-media/${OWNER}/avatar/7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp`, null]) {
      assert.equal(D.comicPayload({ ...c, image }).embeds?.[0]?.image, undefined, String(image));
    }
  });
});

describe("fumetti: etichette", () => {
  const paths = (o: unknown, prefix = ""): string[] => (o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k)) : [prefix]);
  const at = (o: unknown, p: string) => p.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown>)[k], o);
  const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  test("stesse chiavi e stessi segnaposto nelle tre lingue", () => {
    const en = L.comicLabels.en;
    for (const locale of ["it", "es"] as const) {
      const other = L.comicLabels[locale];
      assert.deepEqual(sorted(paths(other)), sorted(paths(en)), locale);
      for (const p of paths(en)) assert.deepEqual(holes(String(at(other, p))), holes(String(at(en, p))), `${locale}: ${p}`);
    }
  });

  test("un messaggio per ogni errore del modulo e del database, e i tetti detti sono quelli veri", () => {
    const codes = ["lang", "title", "summary", "pages", "page", "cover", "editions", "edition_title", "edition_summary", "edition_pages", "edition_page", "edition_cover", "notLoggedIn", "forbidden", "disabled", "unavailable", "comic_daily_limit", "comic_limit", "comic_rate", "comic_hidden", "comic_hidden_recent", "comic_status", "comic_file", "comic_translation", "comic_reserved_fields", "duplicate", "db", "tooFast"];
    for (const locale of LOCALES) for (const c of codes) assert.ok((L.comicLabels[locale].errors as Record<string, string>)[c], `${locale}: ${c}`);
    assert.match(L.comicLabels.it.errors.comic_daily_limit, new RegExp(`\\b${C.COMIC_DAILY_PUBLISH_LIMIT}\\b`));
    assert.match(L.comicLabels.en.errors.comic_limit, new RegExp(`\\b${C.COMIC_MAX_PER_OWNER}\\b`));
    assert.match(L.comicLabels.es.errors.comic_rate, new RegExp(`\\b${C.COMIC_DAILY_NEW_LIMIT}\\b`));
    for (const locale of LOCALES) assert.match(L.comicLabels[locale].editor.pagesHint, /\{w\}.*\{h\}.*\{max\}/);
    for (const locale of LOCALES) assert.match(L.comicLabels[locale].editor.coverHint, /\{minw\}.*\{minh\}.*\{w\}.*\{h\}/);
  });

  test("gli avvisi a chi segue conoscono i fumetti nelle tre lingue", () => {
    for (const locale of LOCALES) {
      const n = F.followLabels[locale].notifications;
      assert.ok(n.kinds.comic_published, locale);
      assert.match(n.comicPublished, /\{name\}.*\{comic\}/);
      assert.match(n.comicGone, /\{name\}/);
    }
  });
});

describe("database: blocco FUMETTI di supabase/schema.sql", () => {
  const MARKER = "-- ===== 29/09/2026: FUMETTI =====";
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  const stmts = S.sqlStatements(block);
  const fullStmts = S.sqlStatements(schema);
  const one = (re: RegExp) => {
    const found = stmts.filter((s) => re.test(s));
    assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
    return found[0];
  };
  const last = (re: RegExp) => fullStmts.filter((s) => re.test(s)).at(-1) ?? "";
  const LIM = C.COMIC_LIMITS;

  test("il blocco c'è, dopo IMMAGINI, e si può applicare senza toccare public.profiles", () => {
    assert.ok(at > 0, "manca il blocco");
    assert.ok(at > schema.indexOf("-- ===== 29/09/2026: IMMAGINI ====="));
    assert.deepEqual(S.schemaProblems(schema), []);
    assert.deepEqual(S.singleDollarLines(block), []);
    assert.deepEqual(S.overLongRepetitions(block), []);
    assert.deepEqual(
      stmts.filter((s) => /^(grant|revoke)\b/.test(s) && /\bpublic\.profiles\b/.test(s)),
      [],
    );
  });

  test("chi pubblica: can_publish_comics = canPublishComics (Creator, Staff, admin)", () => {
    const fn = one(/^create or replace function public\.can_publish_comics\(/);
    assert.match(fn, /security definer set search_path = public, pg_temp/);
    const m = /p\.role = 'admin' or p\.badge in \(([^)]*)\)/.exec(fn);
    assert.ok(m, fn);
    assert.deepEqual(sorted(quoted(m[1])), sorted(B.COMIC_BADGES));
    for (const badge of [...B.BADGES, "influencer", null]) {
      for (const role of ["user", "admin", null]) {
        assert.equal(B.canPublishComics(badge, role), role === "admin" || (badge !== null && quoted(m[1]).includes(badge)), `${badge}/${role}`);
      }
    }
    assert.ok(stmts.includes("revoke all on function public.can_publish_comics(uuid) from public, anon"));
  });

  test("tavole: limiti, cartella e misure uguali al codice", () => {
    const fn = one(/^create or replace function public\.community_comic_pages_ok\(/);
    assert.ok(fn.includes(`jsonb_array_length(p) > ${LIM.pagesMax}`));
    assert.ok(fn.includes(`not between ${C.COMIC_PAGE_MIN.width} and ${C.COMIC_PAGE_BOX.width}`));
    assert.ok(fn.includes(`not between ${C.COMIC_PAGE_MIN.height} and ${C.COMIC_PAGE_BOX.height}`));
    assert.ok(fn.includes(`community_guide_text_ok(x ->> 'text', 0, ${LIM.pageTextMax}, true)`));
    // dal testo del file (sqlStatements scrive in minuscolo): la stessa espressione del codice
    assert.ok(block.includes(`(x ->> 'path') !~ ('^' || owner::text || '/${C.COMIC_FOLDER}/${M.MEDIA_FILE_RE}$')`));
    assert.ok(block.includes(`cover_path ~ ('^' || owner::text || '/${C.COMIC_FOLDER}/${M.MEDIA_FILE_RE}$')`));
    assert.ok(fn.includes("count(distinct e.x ->> 'path')"), "mai due volte lo stesso file");
  });

  test("traduzioni: massimi uguali al codice", () => {
    const fn = one(/^create or replace function public\.community_comic_translation_ok\(/);
    assert.ok(fn.includes(`community_guide_text_ok(t -> 'comic' ->> 'title', 1, ${C.COMIC_TRANSLATION_LIMITS.titleMax}, false)`), "il titolo si traduce");
    assert.ok(fn.includes("((t -> 'comic') - 'title' - 'summary' - 'pages') <> '{}'::jsonb"));
    assert.ok(fn.includes(`community_guide_text_ok(t -> 'comic' ->> 'summary', 1, ${C.COMIC_TRANSLATION_LIMITS.summaryMax}, true)`));
    assert.ok(fn.includes(`community_guide_text_ok(x #>> '{}', 0, ${C.COMIC_TRANSLATION_LIMITS.pageTextMax}, true)`));
    assert.ok(fn.includes("jsonb_array_length(t -> 'comic' -> 'pages') <> n"));
  });

  test("vincoli del testo, della copertina e degli stati", () => {
    assert.ok(one(/add constraint community_comics_title_check/).includes(`community_guide_text_ok(title, case when status = 'draft' then 1 else ${LIM.titleMin} end, ${LIM.titleMax}, false)`));
    assert.ok(one(/add constraint community_comics_summary_check/).includes(`community_guide_text_ok(summary, case when status = 'draft' then 0 else ${LIM.summaryMin} end, ${LIM.summaryMax}, true)`));
    assert.ok(one(/add constraint community_comics_pages_check/).includes("community_comic_pages_ok(pages, owner, status <> 'draft')"));
    assert.ok(one(/add constraint community_comics_cover_required/).includes("status = 'draft' or cover_path is not null"));
    assert.deepEqual(quoted(/check \(lang in \(([^)]*)\)\)/.exec(one(/add constraint community_comics_lang_check/))![1]), [...C.COMIC_LANGS]);
    assert.deepEqual(quoted(/check \(status in \(([^)]*)\)\)/.exec(one(/add constraint community_comics_status_check/))![1]), ["draft", "published", "hidden"]);
  });

  test("trigger: tetti del codice e un messaggio per ogni codice d'errore", () => {
    const fn = one(/^create or replace function public\.guard_community_comic\(/);
    assert.ok(fn.includes(`if n >= ${C.COMIC_MAX_PER_OWNER} then raise exception 'comic_limit'`));
    assert.ok(fn.includes(`if n >= ${C.COMIC_DAILY_NEW_LIMIT} then raise exception 'comic_rate'`));
    assert.ok(fn.includes(`if n >= ${C.COMIC_DAILY_PUBLISH_LIMIT} then raise exception 'comic_daily_limit'`));
    assert.ok(fn.includes(`interval '${C.COMIC_HIDE_COOLDOWN_HOURS === 24 ? "1 day" : `${C.COMIC_HIDE_COOLDOWN_HOURS} hours`}'`));
    const raised = [...block.matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1]).filter((c) => c.startsWith("comic_"));
    assert.ok(raised.length > 0);
    for (const code of new Set(raised)) {
      assert.equal(C.comicErrorCode({ message: code }), code, code);
      assert.ok(L.comicLabels.it.errors[code as "comic_file"], `messaggio per ${code}`);
    }
    assert.ok(stmts.includes("create trigger community_comics_guard before insert or update on public.community_comics for each row execute function public.guard_community_comic()"));
  });

  test("file: il trigger vuole tavole e copertina nuove nel bucket, con il peso del codice", () => {
    const fn = one(/^create or replace function public\.guard_community_comic_files\(/);
    assert.doesNotMatch(fn, /security definer/, "con i privilegi di chi salva");
    assert.equal((fn.match(new RegExp(`profile_media_ok\\((p|new\\.cover_path), ${C.COMIC_FILE_MAX_BYTES}\\)`, "g")) ?? []).length, 2);
    assert.ok(stmts.includes("create trigger community_comics_files before insert or update of pages, cover_path on public.community_comics for each row execute function public.guard_community_comic_files()"));
  });

  test("RLS e grant per colonna", () => {
    assert.match(one(/^create policy "community comics: published are public"/), /for select to anon, authenticated using \(status = 'published'\)$/);
    assert.match(one(/^create policy "community comics: roles insert own"/), /with check \(owner = \(select auth\.uid\(\)\) and public\.can_publish_comics\(\(select auth\.uid\(\)\)\)\)/);
    assert.match(one(/^create policy "community comics: owners and staff update"/), /with check \(public\.can_publish_comics\(\(select auth\.uid\(\)\)\) and \(owner = \(select auth\.uid\(\)\) or \(select public\.is_staff\(\)\)\)\)/);
    assert.ok(stmts.includes("alter table public.community_comics enable row level security"));
    const cols = (kind: string) => /\(([^)]*)\)/.exec(one(new RegExp(`^grant ${kind} \\(`)))![1].split(",").map((c) => c.trim());
    for (const reserved of ["id", "owner", "slug", "created_at", "updated_at", "published_at"]) assert.ok(!cols("update").includes(reserved), `update ${reserved}`);
    for (const reserved of ["id", "created_at", "updated_at", "published_at", "translations"]) assert.ok(!cols("insert").includes(reserved), `insert ${reserved}`);
    assert.ok(cols("update").includes("translations"), "le traduzioni le scrive il sito con la sessione del proprietario");
    assert.ok(!stmts.some((s) => /^grant (all|insert|update) on public\.community_comics/.test(s)), "niente scrittura sull'intera tabella");
  });

  test("bucket: cartella dei fumetti con il suo tetto, fuori da quello della vetrina; file in uso", () => {
    const upload = last(/create policy "profile media upload"/);
    const comic = /\(storage\.foldername\(name\)\)\[2\] = 'comic' and public\.profile_media_count_in\('comic'\) < (\d+) and exists \(select 1 from public\.profiles p where p\.id = auth\.uid\(\) and \(p\.badge in \(([^)]*)\) or p\.role = 'admin'\)\)/.exec(upload);
    assert.ok(comic, upload.slice(0, 400));
    assert.equal(Number(comic[1]), C.COMIC_FILES_MAX);
    assert.deepEqual(sorted(quoted(comic[2])), sorted(B.COMIC_BADGES));
    assert.ok(upload.includes("(storage.foldername(name))[2] <> 'comic' and public.profile_media_count() <"), "il tetto della vetrina vale fuori dai fumetti");
    const count = last(/^create or replace function public\.profile_media_count\(\)/);
    assert.ok(count.includes("(storage.foldername(o.name))[2] is distinct from 'comic'"));
    const inUse = last(/^create or replace function public\.profile_media_in_use\(/);
    assert.ok(inUse.includes("c.cover_path = p or c.pages @> jsonb_build_array(jsonb_build_object('path', p))"));
    for (const t of ["pr.avatar_path = p", "g.cover_path = p", "d.art_path = p"]) assert.ok(inUse.includes(t), t);
  });

  test("avvisi: notify_followers conosce i fumetti (/news/comics/<slug>)", () => {
    const fn = last(/^create or replace function public\.notify_followers\(/);
    // dal 04/10/2026 l'ultima definizione sta nel blocco MAZZI TORNEO, che aggiunge deck_set_published e tiene i fumetti
    const later = schema.indexOf("-- ===== 04/10/2026: MAZZI TORNEO =====");
    assert.ok(stmts.some((s) => s === fn) || (later > 0 && fn.includes("deck_set_published") && schema.slice(later).includes("create or replace function public.notify_followers(")), "l'ultima definizione è in questo blocco o in quello dei mazzi torneo");
    assert.ok(fn.includes("p_kind not in ('deck_published', 'guide_published', 'comic_published'"));
    assert.ok(fn.includes("'^/news/comics/[a-z0-9]+(-[a-z0-9]+)*$'"));
    assert.ok(fn.includes("into v_owner using substr(v_target, 14)"), "'/news/comics/' sono 13 caratteri");
    assert.equal("/news/comics/".length, 13);
  });
});

describe("database: blocco FUMETTI IN PIÙ LINGUE di supabase/schema.sql (30/09/2026)", () => {
  const MARKER = "-- ===== 30/09/2026: FUMETTI IN PIÙ LINGUE =====";
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  const stmts = S.sqlStatements(block);
  const fullStmts = S.sqlStatements(schema);
  const one = (re: RegExp) => {
    const found = stmts.filter((s) => re.test(s));
    assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
    return found[0];
  };
  const last = (re: RegExp) => fullStmts.filter((s) => re.test(s)).at(-1) ?? "";
  const LIM = C.COMIC_LIMITS;

  test("il blocco c'è, dopo FUMETTI, e non tocca public.profiles", () => {
    assert.ok(at > schema.indexOf("-- ===== 29/09/2026: FUMETTI ====="), "manca il blocco, o viene prima di FUMETTI");
    assert.deepEqual(S.singleDollarLines(block), []);
    assert.deepEqual(S.overLongRepetitions(block), []);
    assert.deepEqual(
      stmts.filter((s) => /^(grant|revoke)\b/.test(s) && /\bpublic\.profiles\b/.test(s)),
      [],
    );
    assert.ok(stmts.includes("alter table public.community_comics add column if not exists editions jsonb not null default '{}'::jsonb"));
    assert.ok(stmts.includes("alter table public.community_comics add column if not exists former_slugs text[] not null default '{}'"));
  });

  test("versioni: lingue, limiti, cartella e tavole uguali al codice", () => {
    const fn = one(/^create or replace function public\.community_comic_editions_ok\(/);
    assert.deepEqual(quoted(/when k not in \(([^)]*)\) or k = lang then true/.exec(fn)![1]), [...C.COMIC_LANGS]);
    assert.ok(fn.includes("(v - 'title' - 'summary' - 'pages' - 'cover_path') <> '{}'::jsonb"));
    assert.ok(fn.includes(`community_guide_text_ok(v ->> 'title', case when complete then ${LIM.titleMin} else 0 end, ${LIM.titleMax}, false)`));
    assert.ok(fn.includes(`community_guide_text_ok(v ->> 'summary', case when complete then ${LIM.summaryMin} else 0 end, ${LIM.summaryMax}, true)`));
    assert.ok(fn.includes("community_comic_pages_ok(v -> 'pages', owner, complete)"), "tavole con le regole dell'originale");
    assert.ok(block.includes(`(v ->> 'cover_path') !~ ('^' || owner::text || '/${C.COMIC_FOLDER}/${M.MEDIA_FILE_RE}$')`));
    assert.ok(one(/add constraint community_comics_editions_check/).includes("community_comic_editions_ok(editions, owner, lang, status <> 'draft')"));
  });

  test("indirizzi di prima: la regola degli slug, nessuna grant", () => {
    const fn = one(/^create or replace function public\.community_comic_slugs_ok\(/);
    const slugRule = /check \((char_length\(slug\) between 3 and 60 and slug ~ '[^']+')\)/.exec(fullStmts.find((s) => s.includes("add constraint community_comics_slug_check")) ?? "");
    assert.ok(slugRule, "manca community_comics_slug_check");
    assert.ok(fn.includes("char_length(slug) not between 3 and 60 or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'"));
    assert.ok(slugRule[1].includes("'^[a-z0-9]+(-[a-z0-9]+)*$'"), "la stessa espressione dello slug");
    assert.ok(one(/add constraint community_comics_former_slugs_check/).includes("community_comic_slugs_ok(former_slugs)"));
    assert.ok(!fullStmts.some((s) => /^grant (insert|update) \([^)]*former_slugs/.test(s)), "former_slugs li scrive solo lo script");
  });

  test("file: il trigger (ultima definizione) guarda anche le versioni, con il peso del codice", () => {
    const fn = last(/^create or replace function public\.guard_community_comic_files\(/);
    assert.ok(stmts.includes(fn), "l'ultima definizione è in questo blocco");
    assert.doesNotMatch(fn, /security definer/, "con i privilegi di chi salva");
    assert.ok(fn.includes("public.community_comic_files(new.pages, new.cover_path, new.editions)"));
    assert.ok(fn.includes("public.community_comic_files(old.pages, old.cover_path, old.editions)"));
    assert.ok(fn.includes(`profile_media_ok(p, ${C.COMIC_FILE_MAX_BYTES})`));
    const trigger = "create trigger community_comics_files before insert or update of pages, cover_path, editions on public.community_comics for each row execute function public.guard_community_comic_files()";
    assert.equal(fullStmts.filter((s) => /^create trigger community_comics_files /.test(s)).at(-1), trigger);
    const files = one(/^create or replace function public\.community_comic_files\(/);
    for (const part of ["a.x ->> 'path'", "select cover", "e.v ->> 'cover_path'", "b.y ->> 'path'", "array_agg(distinct f)"]) assert.ok(files.includes(part), part);
  });

  test("file in uso (ultima definizione): anche tavole e copertine delle versioni", () => {
    const inUse = last(/^create or replace function public\.profile_media_in_use\(/);
    assert.ok(stmts.includes(inUse), "l'ultima definizione è in questo blocco");
    assert.ok(inUse.includes("p = any(public.community_comic_files('[]'::jsonb, null, c.editions))"));
    for (const t of ["pr.avatar_path = p", "g.cover_path = p", "d.art_path = p", "c.cover_path = p or c.pages @> jsonb_build_array(jsonb_build_object('path', p))"]) assert.ok(inUse.includes(t), t);
  });

  test("grant per colonna: editions si scrive, dopo la revoke del blocco FUMETTI", () => {
    const grantAt = fullStmts.lastIndexOf("grant update (editions) on public.community_comics to authenticated");
    assert.ok(grantAt > fullStmts.lastIndexOf("revoke all on public.community_comics from anon, authenticated"), "la revoke la cancellerebbe");
    assert.ok(fullStmts.includes("grant insert (editions) on public.community_comics to authenticated"));
  });
});

describe("fumetti: script per unire i fumetti di più lingue (scripts/merge-comics.mjs)", () => {
  const script = read("../../../scripts/merge-comics.mjs");

  test("prova senza scrivere se non con --apply, in una transazione, con le regole del database", () => {
    assert.match(script, /const apply = process\.argv\.includes\("--apply"\)/);
    assert.match(script, /await db\.query\("begin"\)/);
    assert.match(script, /await db\.query\(apply && ok \? "commit" : "rollback"\)/);
    assert.match(script, /for update/, "le righe si bloccano prima di leggerle");
    // stesso proprietario, lingue diverse, e la versione nelle stesse chiavi del codice
    assert.match(script, /owner !== main\.owner/);
    assert.match(script, /editions\[o\.lang\] = \{ title: o\.title, summary: o\.summary, pages: o\.pages, cover_path: o\.cover_path \}/);
    assert.match(script, /former_slugs/);
    assert.match(script, /comic_published/);
  });
});

describe("fumetti: collegamenti", () => {
  test("proxy, privacy, /account e set-badge", () => {
    const proxy = read("../../proxy.ts");
    assert.ok(proxy.includes('"/:locale(en|it|es|fr)/news/comics/new"'));
    assert.ok(proxy.includes('"/:locale(en|it|es|fr)/news/comics/:slug/edit"'));
    const privacy = read("../../app/[locale]/(site)/privacy/page.tsx");
    assert.match(privacy, /id="community-comics"/);
    assert.match(privacy, /comicLabels\[locale\]\.privacy/);
    assert.match(read("../../app/[locale]/(site)/account/page.tsx"), /<AccountComics /);
    const badge = read("../../../scripts/set-badge.mjs");
    assert.match(badge, /const COMICS = \["creator", "staff"\];/);
    assert.deepEqual(sorted(["creator", "staff"]), sorted(B.COMIC_BADGES));
    assert.match(badge, /update public\.community_comics set status = 'draft'/);
  });
});
