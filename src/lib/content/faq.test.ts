/**
 * Test delle FAQ approvate (`faq.ts`) e della loro ricerca per l'assistente (`risposteApprovate` in
 * src/lib/faq/retrieve.ts), con il runner integrato di Node: `node --test src/lib/content/faq.test.ts`.
 * Nati con l'Ondata 3 del piano SEO/GEO (25/09/2026), quando le risposte sono passate da 6 a 15.
 *
 * `newsMeta.test.ts` controlla già che domande, guide e news collegate siano le stesse nelle tre lingue e che
 * esistano. Qui si controlla il resto: che ogni risposta porti alla sua pagina primaria, che i link alle sezioni
 * (`links`) vadano a pagine vere, e che i numeri che cambiano con una patch (le Leggendarie, le carte della Demo 2.0,
 * le carte create) siano quelli del database carte di oggi. Se una patch aggiunge una Leggendaria, il test fallisce
 * finché la risposta non la nomina.
 *
 * I moduli sono scritti per Next (import senza estensione, alias `@/`, JSON senza attributi): come in
 * cardTitles.test.ts, un hook di risoluzione dei moduli di Node (`module.registerHooks`, Node ≥ 22.15) aggiunge `.ts`
 * agli import relativi, risolve `@/` in `src/` e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const src = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    // alias del tsconfig: "@/lib/x" → src/lib/x
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), src).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(spec, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const faqModule: typeof import("./faq") = await import("./faq.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("../data/cards") = await import("../data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const retrieveModule: typeof import("../faq/retrieve") = await import("../faq/retrieve.ts");

const { faqs } = faqModule;
const { cards, activeCards, cardsVerified } = cardsModule;
const { risposteApprovate } = retrieveModule;

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const byId = (l: Locale, id: string) => {
  const f = faqs[l].find((x) => x.id === id);
  assert.ok(f, `[${l}] manca la risposta ${id}`);
  return f;
};

const legendaries = cards.filter((c) => c.status === "active" && c.legendary && c.type !== "token");
const created = cards.filter((c) => c.status === "active" && c.type === "token");

describe("FAQ approvate", () => {
  test("15 risposte, con id unici che fanno da ancora (/faq#id), nello stesso ordine in ogni lingua", () => {
    for (const l of locales) {
      const ids = faqs[l].map((f) => f.id);
      assert.equal(ids.length, 15, `[${l}] ${ids.length} risposte`);
      assert.equal(new Set(ids).size, ids.length, `[${l}] id ripetuti`);
      for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
      assert.deepEqual(ids, faqs.en.map((f) => f.id), `[${l}] ordine diverso dall'inglese`);
    }
  });
  test("domande vere e risposte in testo semplice", () => {
    for (const l of locales) {
      for (const f of faqs[l]) {
        assert.match(f.q, /\?$/, `[${l}] ${f.id}: la domanda non finisce con "?"`);
        if (l === "es") assert.match(f.q, /^¿/, `[es] ${f.id}: manca "¿"`);
        assert.ok(f.a.length >= 80, `[${l}] ${f.id}: risposta troppo corta`);
        // le risposte finiscono nell'HTML e nei dati strutturati come testo: niente Markdown né indirizzi
        assert.doesNotMatch(f.a, /\]\(|https?:\/\/|\*\*/, `[${l}] ${f.id}: Markdown o indirizzi nella risposta`);
      }
    }
  });
  test("ogni risposta porta alla sua pagina primaria: una guida, una news o una sezione del sito", () => {
    for (const l of locales) {
      for (const f of faqs[l]) assert.ok(f.guides?.length || f.news?.length || f.links?.length, `[${l}] ${f.id}: nessun link`);
    }
  });
  test("i link alle sezioni sono gli stessi in ogni lingua e portano a pagine che esistono", () => {
    const page = (path: string) => new URL(`../../app/[locale]/(site)${path}/page.tsx`, import.meta.url);
    for (const l of locales) {
      for (const f of faqs[l]) {
        assert.deepEqual(
          (f.links ?? []).map((x) => x.path),
          (byId("en", f.id).links ?? []).map((x) => x.path),
          `[${l}] ${f.id}: link diversi dall'inglese`,
        );
        assert.deepEqual(f.cards ?? [], byId("en", f.id).cards ?? [], `[${l}] ${f.id}: carte diverse dall'inglese`);
        for (const link of f.links ?? []) {
          assert.match(link.path, /^\/[a-z-]+(?:\/[a-z0-9-]+)*$/, `[${l}] ${f.id}: percorso senza lingua, "${link.path}"`);
          assert.ok(existsSync(page(link.path)), `[${l}] ${f.id}: la pagina ${link.path} non esiste`);
          assert.ok(link.label.trim(), `[${l}] ${f.id}: manca il testo del link a ${link.path}`);
        }
        for (const slug of f.cards ?? []) assert.ok(cardsModule.getCard(slug), `[${l}] ${f.id}: la carta ${slug} non esiste`);
      }
    }
  });
});

describe("numeri che cambiano con una patch", () => {
  test("le Leggendarie: tutte e sole quelle in gioco, con il loro numero, e la sola magia", () => {
    assert.deepEqual([...(byId("en", "legendaries").cards ?? [])].sort(), legendaries.map((c) => c.slug).sort());
    const others = cards.filter((c) => c.legendary && !legendaries.includes(c));
    const spells = legendaries.filter((c) => c.type === "spell");
    const onlySpell: Record<Locale, (name: string) => string> = {
      en: (n) => `${n} is the only spell`,
      it: (n) => `${n} è l'unica magia`,
      es: (n) => `${n} es el único hechizo`,
    };
    for (const l of locales) {
      const a = byId(l, "legendaries").a;
      assert.match(a, new RegExp(`\\b${legendaries.length}\\b`), `[${l}] il numero delle Leggendarie non è ${legendaries.length}`);
      for (const c of legendaries) assert.ok(a.includes(c.name), `[${l}] la risposta non nomina ${c.name}`);
      for (const c of others) assert.ok(!a.includes(c.name), `[${l}] la risposta nomina ${c.name}, che non è in gioco`);
      assert.equal(spells.length, 1, "la risposta dice che fra le Leggendarie c'è una sola magia");
      assert.ok(a.includes(onlySpell[l](spells[0].name)), `[${l}] la magia fra le Leggendarie è ${spells[0].name}`);
    }
  });
  test("l'elenco delle carte: le carte della Demo 2.0 e quelle create sono quelle del database", () => {
    for (const l of locales) {
      const a = byId(l, "card-list").a;
      assert.match(a, new RegExp(`\\b${activeCards.length}\\b`), `[${l}] non dice ${activeCards.length} carte`);
      assert.match(a, new RegExp(`\\b${created.length}\\b`), `[${l}] non dice ${created.length} carte create`);
      assert.match(byId(l, "where-cards").a, new RegExp(`\\b${cardsVerified.count}\\b`), `[${l}] where-cards: carte verificate`);
    }
  });
});

describe("risposte approvate per l'assistente", () => {
  const first = (q: string, l: Locale) => risposteApprovate(q, l)[0]?.id;
  test("una domanda sul gioco trova la sua risposta, nelle tre lingue", () => {
    assert.equal(first("Is Origins TCG available on mobile or Android?", "en"), "mobile");
    assert.equal(first("What languages does the game support?", "en"), "languages");
    assert.equal(first("Is this the same game as Riftbound?", "en"), "riftbound");
    assert.equal(first("Will I keep my demo progress?", "en"), "demo-progress");
    assert.equal(first("In che lingua è il gioco?", "it"), "languages");
    assert.equal(first("Quando esce il gioco completo?", "it"), "release-date");
    assert.equal(first("Come importo il codice di un mazzo?", "it"), "deck-code");
    assert.equal(first("¿En qué idioma está el juego?", "es"), "languages");
    assert.equal(first("¿Cuándo empieza la clasificatoria?", "es"), "ranked");
  });
  test("una domanda su una carta non tira dentro le FAQ, e al massimo ne entrano due", () => {
    assert.deepEqual(risposteApprovate("What does Mulan do?", "en"), []);
    assert.deepEqual(risposteApprovate("Che cosa fa Mulan?", "it"), []);
    assert.deepEqual(risposteApprovate("", "en"), []);
    assert.ok(risposteApprovate("Crimson Cup Conquest rules, prizes and dates", "en").length <= 2);
  });
});
