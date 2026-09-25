// Test della 404 degli indirizzi inesistenti dentro le lingue (`notFoundHtml.ts`), con il runner integrato di Node:
//   node --test "src/app/*/(site)/*/notFoundHtml.test.ts"
// Il percorso va scritto come glob, tra virgolette: per Node `[locale]` e `[...rest]` sono classi di caratteri, e
// con il percorso letterale non trova il file e non esegue nulla, senza errori. (Commenti di riga perché il glob
// contiene la sequenza che chiude un commento a blocco.)
// Lingua giusta, testo nell'HTML, un solo meta robots (noindex), nessun canonical né hreflang (RIV-02, TOOL-10).
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
