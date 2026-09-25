// Test della 404 degli indirizzi inesistenti dentro le lingue (`notFoundHtml.ts`), con il runner integrato di Node:
//   node --test "src/app/*/(site)/*/notFoundHtml.test.ts"
// Il percorso va scritto come glob, tra virgolette: per Node `[locale]` e `[...rest]` sono classi di caratteri, e
// con il percorso letterale non trova il file e non esegue nulla, senza errori. (Commenti di riga perché il glob
// contiene la sequenza che chiude un commento a blocco.)
// Lingua giusta, testo nell'HTML, un solo meta robots (noindex), nessun canonical né hreflang (RIV-02, TOOL-10).
// In fondo, i redirect di next.config.ts per le sezioni senza lingua, che a questa route non arrivano più.
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  NOT_FOUND_TITLE,
  escapeHtml,
  notFoundHtml,
  notFoundTitle,
  type NotFoundPage,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/deckrules.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./notFoundHtml.ts";

const es: NotFoundPage = {
  lang: "es",
  title: notFoundTitle("es"),
  description: "La página que buscas no está sobre la mesa.",
  blocks: [{ lang: "es", heading: "Esta carta no existe.", text: "La página que buscas no está sobre la mesa." }],
  actions: [
    { href: "/es", label: "Volver al inicio", primary: true },
    { href: "/es/cards", label: "Cartas" },
  ],
  nav: [{ href: "/es/news", label: "Noticias" }],
  disclaimer: "OriginsMeta no está afiliado a Koin Games.",
};

const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0;

describe("404 dentro le lingue", () => {
  test("titolo neutro, lo stesso per ogni tipo di pagina", () => {
    assert.equal(notFoundTitle("es"), "404 · Página no encontrada · OriginsMeta");
    assert.equal(notFoundTitle("it"), "404 · Pagina non trovata · OriginsMeta");
    assert.equal(notFoundTitle("en"), "404 · Page not found · OriginsMeta");
    assert.deepEqual(Object.keys(NOT_FOUND_TITLE).sort(), ["en", "es", "it"]);
  });
  test("lingua, H1 e testo sono nell'HTML, con i link alla home e alle carte", () => {
    const html = notFoundHtml(es);
    assert.match(html, /^<!DOCTYPE html><html lang="es">/);
    assert.match(html, /<title>404 · Página no encontrada · OriginsMeta<\/title>/);
    assert.match(html, /<h1>Esta carta no existe\.<\/h1><p>La página que buscas no está sobre la mesa\.<\/p>/);
    assert.match(html, /<a class="b p" href="\/es">Volver al inicio<\/a>/);
    assert.match(html, /<a class="b" href="\/es\/cards">Cartas<\/a>/);
    assert.match(html, /<nav><a href="\/es\/news">Noticias<\/a><\/nav>/);
    assert.match(html, /<footer>OriginsMeta no está afiliado a Koin Games\.<\/footer>/);
  });
  test("un solo meta robots (noindex), nessun canonical, hreflang o Open Graph", () => {
    const html = notFoundHtml(es);
    assert.equal(count(html, /<meta name="robots"/g), 1);
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.equal(count(html, /rel="canonical"|rel="alternate"|hreflang|og:/gi), 0);
  });
  test("più lingue: un solo H1, le altre col proprio lang", () => {
    const html = notFoundHtml({
      ...es,
      lang: "en",
      blocks: [
        { lang: "en", heading: "This card does not exist.", text: "Not on the table." },
        { lang: "it", heading: "Questa carta non esiste.", text: "Non è sul tavolo." },
      ],
    });
    assert.equal(count(html, /<h1/g), 1);
    assert.match(html, /<h1>This card does not exist\.<\/h1>/);
    assert.match(html, /<p class="h" lang="it">Questa carta non esiste\.<\/p><p lang="it">Non è sul tavolo\.<\/p>/);
  });
  test("il testo non può aprire tag né uscire dagli attributi", () => {
    assert.equal(escapeHtml(`<b a="1">'&'</b>`), "&lt;b a=&quot;1&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;");
    const html = notFoundHtml({ ...es, title: "<script>x</script>", actions: [{ href: '/es" onclick="x', label: "a" }] });
    assert.equal(count(html, /<script/g), 0);
    assert.match(html, /href="\/es&quot; onclick=&quot;x"/);
  });
});


// Indirizzi senza lingua con una sezione vera (/cards/merlin, /news/<slug>, /faq): non arrivano alla route
// `[...rest]` perché next.config.ts li porta alla stessa pagina nella lingua del browser, con le regole della radice.
// Qui si controllano l'elenco delle sezioni contro le cartelle di (site) e i redirect con il matcher VERO di Next, con
// le stesse funzioni e opzioni del suo server (`buildCustomRoute` in server/lib/router-utils/filesystem.js, il giro dei
// redirect in resolve-routes.js), non con un'espressione regolare scritta a mano: una regex nostra aveva ripetuto
// l'errore di `:path*`, che mandava anche le immagini delle carte (/cards/aladdin.webp) a /en/cards/aladdin.webp.
// I redirect vengono prima dei file di `public`, quindi nessun file di `public` deve farne scattare uno.
type Has = { type: string; key?: string; value?: string };
type Redirect = { source: string; destination: string; permanent: boolean; has?: Has[]; missing?: Has[] };
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const nextConfig: { redirects: () => Promise<Redirect[]> } = (await import("../../../../../next.config.ts")).default;
const redirects = await nextConfig.redirects();

// Moduli CommonJS di Next, caricati con require: qui i tipi sono solo quelli che servono al test.
const nodeRequire = createRequire(import.meta.url);
type Params = Record<string, string | string[]>;
type Query = Record<string, string>;
const { getPathMatch } = nodeRequire("next/dist/shared/lib/router/utils/path-match.js") as {
  getPathMatch: (path: string, options: { strict: boolean; removeUnnamedParams: boolean; regexModifier: (re: string) => string }) => (pathname: string) => Params | false;
};
const { matchHas, prepareDestination } = nodeRequire("next/dist/shared/lib/router/utils/prepare-destination.js") as {
  matchHas: (req: { headers: Record<string, string> }, query: Query, has?: Has[], missing?: Has[]) => Params | false;
  prepareDestination: (args: { appendParamsToQuery: boolean; destination: string; params: Params; query: Query }) => { parsedDestination: { pathname: string } };
};
const { modifyRouteRegex } = nodeRequire("next/dist/lib/redirect-status.js") as { modifyRouteRegex: (regex: string, restrictedPaths?: string[]) => string };
const { checkCustomRoutes } = nodeRequire("next/dist/lib/load-custom-routes.js") as { checkCustomRoutes: (routes: Redirect[], type: "redirect") => void };

const rules = redirects.map((r) => ({
  ...r,
  match: getPathMatch(r.source, { strict: true, removeUnnamedParams: true, regexModifier: (re) => modifyRouteRegex(re, ["/_next"]) }),
}));

/** Il percorso di destinazione del primo redirect che scatta, come in resolve-routes.js, o null se non ne scatta nessuno. */
function redirectOf(pathname: string, language = "en-US,en;q=0.9", query: Query = {}): string | null {
  const req = { headers: { host: "localhost:3000", "accept-language": language } };
  for (const r of rules) {
    const params = r.match(pathname);
    if (!params) continue;
    const hasParams = r.has || r.missing ? matchHas(req, query, r.has, r.missing) : {};
    if (!hasParams) continue;
    return prepareDestination({ appendParamsToQuery: false, destination: r.destination, params: { ...params, ...hasParams }, query }).parsedDestination.pathname;
  }
  return null;
}

/** Tutti i file di `public`, come percorsi del sito (/cards/aladdin.webp, /cards/sm/…, /media/…, /llms.txt). */
function publicFiles(dir = new URL("../../../../../public/", import.meta.url), base = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? publicFiles(new URL(`${e.name}/`, dir), `${base}/${e.name}`) : [`${base}/${e.name}`],
  );
}

const languages = ["it-IT,it;q=0.9,en;q=0.8", "es-MX,es;q=0.9", "ca-ES,ca;q=0.9", "en-GB,en;q=0.9", "de-DE,de;q=0.9"];

describe("sezioni senza lingua", () => {
  const sectionRules = redirects.filter((r) => r.source.startsWith("/:section("));
  const sections = /^\/:section\(([^)]+)\)/.exec(sectionRules[0]?.source ?? "")?.[1].split("|") ?? [];

  test("l'elenco delle sezioni è quello delle cartelle di (site), senza `[...rest]`", () => {
    const dirs = readdirSync(new URL("..", import.meta.url), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("["))
      .map((e) => e.name);
    assert.deepEqual([...sections].sort(), dirs.sort());
  });
  test("redirect temporanei, sezione sola e con il percorso: italiano, spagnolo (anche ca, gl, eu), poi inglese", () => {
    assert.deepEqual(
      sectionRules.map((r) => [r.destination, r.has?.[0]?.value ?? null, r.permanent]),
      [
        ["/it/:section", "^it.*", false],
        ["/it/:section/:path", "^it.*", false],
        ["/es/:section", "^(?:es|ca|gl|eu).*", false],
        ["/es/:section/:path", "^(?:es|ca|gl|eu).*", false],
        ["/en/:section", null, false],
        ["/en/:section/:path", null, false],
      ],
    );
    // Stesse lingue della radice
    const root = (locale: string) => redirects.find((r) => r.source === "/" && r.destination === `/${locale}`)?.has?.[0]?.value;
    assert.equal(root("it"), "^it.*");
    assert.equal(root("es"), "^(?:es|ca|gl|eu).*");
  });
  test("Next accetta le regole (la sua verifica all'avvio, che su una regola sbagliata chiude il processo)", () => {
    checkCustomRoutes(redirects, "redirect");
  });
  test("nessun file di `public` fa scattare un redirect: illustrazioni, miniature e copertine delle carte restano dove sono", () => {
    const files = publicFiles();
    for (const f of ["/cards/aladdin.webp", "/cards/sm/aladdin.webp", "/llms.txt"]) assert.ok(files.includes(f), f);
    assert.ok(files.some((f) => f.startsWith("/cards/cover/")) && files.some((f) => f.startsWith("/cards/art/")));
    const moved = files.flatMap((f) => languages.map((l) => [f, l, redirectOf(f, l)] as const)).filter(([, , to]) => to !== null);
    assert.deepEqual(moved, []);
  });
  test("una sezione va nella lingua del browser, con tutto il percorso", () => {
    const cases: [string, string, string][] = [
      ["/cards", languages[0], "/it/cards"],
      ["/cards/merlin", languages[0], "/it/cards/merlin"],
      ["/cards/merlin", languages[2], "/es/cards/merlin"],
      ["/cards/merlin", languages[3], "/en/cards/merlin"],
      ["/cards/merlin", languages[4], "/en/cards/merlin"],
      ["/news/demo-patch-notes-0921", languages[1], "/es/news/demo-patch-notes-0921"],
      ["/guides/is-origins-tcg-pay-to-win", "gl", "/es/guides/is-origins-tcg-pay-to-win"],
      ["/faq", languages[0], "/it/faq"],
      ["/tier-list/community", languages[3], "/en/tier-list/community"],
      ["/u/pierluigi", languages[0], "/it/u/pierluigi"],
      ["/tournaments/crimson-cup-om-abcd/deck", languages[3], "/en/tournaments/crimson-cup-om-abcd/deck"],
    ];
    for (const [path, language, to] of cases) {
      assert.equal(redirectOf(path, language), to, `${path} (${language})`);
      // niente giri: la destinazione non scatta più
      assert.equal(redirectOf(to, language), null, to);
    }
  });
  test("non tocca le lingue, le altre rotte, i percorsi con un punto né la radice con i parametri di spam", () => {
    for (const path of ["/en/cards", "/it/cards/merlin", "/es", "/t/OM-ABCD", "/api/calendar", "/auth/callback", "/xx/foo", "/cardsx", "/sitemap.xml", "/news/a.b"])
      for (const language of languages) assert.equal(redirectOf(path, language), null, `${path} (${language})`);
    assert.equal(redirectOf("/", languages[0]), "/it");
    assert.equal(redirectOf("/", languages[4]), "/en");
    assert.equal(redirectOf("/", languages[0], { r: "x", channel: "y" }), null);
    assert.equal(redirectOf("/fr/cards/merlin"), "/en/cards/merlin");
  });
});
