/**
 * Test delle FAQ approvate (`faq.ts`) e della loro ricerca per l'assistente (`risposteApprovate` in
 * src/lib/faq/retrieve.ts), con il runner integrato di Node: `node --test src/lib/content/faq.test.ts`.
 * Nati con l'Ondata 3 del piano SEO/GEO (25/09/2026), quando le risposte sono passate da 6 a 15.
 *
 * `newsMeta.test.ts` controlla già che domande, guide e news collegate siano le stesse nelle tre lingue e che
 * esistano. Qui si controlla il resto: che ogni risposta porti alla sua pagina primaria, che i link alle sezioni
 * (`links`) vadano a pagine vere, e che i numeri che cambiano con una patch (le Leggendarie, le carte della Demo 2.0,
 * le carte create) siano quelli del database carte di oggi. Se una patch aggiunge una Leggendaria, il test fallisce
 * finché la risposta non la nomina. Poi la ricerca dell'assistente: ogni domanda approvata ritrova la sua risposta,
 * le domande come le fa la gente ("Is it on Android?", "¿El juego está en español?") trovano quella giusta e i
 * suggerimenti della pagina non tirano dentro risposte fuori tema né le loro guide in cima alle fonti.
 *
 * I moduli sono scritti per Next (import senza estensione, alias `@/`, JSON senza attributi): come in
 * cardTitles.test.ts, un hook di risoluzione dei moduli di Node (`module.registerHooks`, Node ≥ 22.15) aggiunge `.ts`
 * agli import relativi, risolve `@/` in `src/` e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const guidesModule: typeof import("./guides") = await import("./guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsModule: typeof import("../data/news") = await import("../data/news.ts");

const { faqs, suggerimenti } = faqModule;
const { cards, activeCards, cardsVerified } = cardsModule;
const { risposteApprovate, contestoPer } = retrieveModule;

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

describe("FAQPage: una domanda marcata una volta sola nel sito", () => {
  test("nessuna domanda di /faq è uguale a una domanda delle FAQ di una guida o di una news, nella stessa lingua", () => {
    // /faq è la pagina ponte: risponde in breve e rimanda alla pagina primaria, che ha le sue FAQ. La guida di Google
    // chiede di marcare una FAQ ripetuta una sola volta: qui le domande si scrivono in un altro modo.
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    for (const l of locales) {
      const altrove = new Map<string, string>();
      for (const g of guidesModule.getGuides(l)) for (const f of g.faq ?? []) altrove.set(norm(f.q), `guida ${g.slug}`);
      for (const n of newsModule.news) for (const f of n.faq?.[l] ?? []) altrove.set(norm(f.q), `news ${n.slug}`);
      for (const f of faqs[l]) assert.ok(!altrove.has(norm(f.q)), `[${l}] ${f.id}: "${f.q}" è già nelle FAQ della ${altrove.get(norm(f.q))}`);
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

describe("dati delle carte senza fonte dell'import (decisione di Pierluigi del 25/09/2026)", () => {
  const woo = /world\s*of\s*origins|worldoforigins/i;
  test("le FAQ non nominano World of Origins e non chiamano ufficiali gli ID delle carte", () => {
    for (const l of locales) {
      for (const f of faqs[l]) {
        assert.doesNotMatch(JSON.stringify(f), woo, `[${l}] ${f.id}`);
        assert.doesNotMatch(f.a, /official ID|ID ufficial|ID oficial/i, `[${l}] ${f.id}: ID "ufficiali"`);
      }
    }
  });
  test("where-cards e card-list dicono che le carte create e le rimosse non sono verificate nel gioco", () => {
    const notChecked: Record<Locale, RegExp> = { en: /not been checked in the game/, it: /non (?:sono state )?verificat[ei] nel gioco/, es: /sin comprobar en el juego|no se han comprobado en el juego/ };
    for (const l of locales) {
      assert.match(byId(l, "where-cards").a, notChecked[l], `[${l}] where-cards`);
      assert.match(byId(l, "card-list").a, notChecked[l], `[${l}] card-list`);
    }
  });
  test("public/llms.txt non nomina World of Origins", () => {
    assert.doesNotMatch(readFileSync(new URL("../../../public/llms.txt", import.meta.url), "utf8"), woo);
  });
});

describe("risposte approvate per l'assistente", () => {
  const ids = (q: string, l: Locale) => risposteApprovate(q, l).map((f) => f.id);
  const first = (q: string, l: Locale) => ids(q, l)[0];

  test("ogni domanda approvata ritrova per prima la sua risposta, nelle tre lingue", () => {
    for (const l of locales) {
      for (const f of faqs[l]) assert.equal(first(f.q, l), f.id, `[${l}] "${f.q}" → ${ids(f.q, l).join(", ") || "nessuna"}`);
    }
  });
  test("le domande come le fa la gente trovano la risposta giusta", () => {
    const cases: [string, Locale, string][] = [
      ["When is the release date?", "en", "release-date"],
      ["When does the full game release?", "en", "release-date"],
      ["Can I play it in Spanish?", "en", "languages"],
      ["What languages does the game support?", "en", "languages"],
      ["Can I play on my phone?", "en", "mobile"],
      ["Is it on Android?", "en", "mobile"],
      ["Is Origins TCG on Android?", "en", "mobile"],
      ["Is there an iOS app?", "en", "mobile"],
      ["Is Origins TCG available on mobile?", "en", "mobile"],
      ["Is this the same game as Riftbound?", "en", "riftbound"],
      ["Will I keep my demo progress?", "en", "demo-progress"],
      ["Do my unlocks carry over to the full game?", "en", "demo-progress"],
      ["When does ranked start?", "en", "ranked"],
      ["What are the Crimson Cup prizes?", "en", "crimson-cup"],
      ["How do I import a KGBLDC code?", "en", "deck-code"],
      ["Is there a list of all cards?", "en", "card-list"],
      ["Is Origins TCG pay to win?", "en", "free-to-compete"],
      ["In che lingua è il gioco?", "it", "languages"],
      ["Il gioco è in italiano?", "it", "languages"],
      ["Quando esce il gioco completo?", "it", "release-date"],
      ["Origins TCG è su Android?", "it", "mobile"],
      ["Si può giocare dal telefono?", "it", "mobile"],
      ["Come importo il codice di un mazzo?", "it", "deck-code"],
      ["Quando inizia la classificata?", "it", "ranked"],
      ["¿Origins TCG está en español?", "es", "languages"],
      ["¿El juego está en español?", "es", "languages"],
      ["¿En qué idioma está el juego?", "es", "languages"],
      ["¿Cuándo empieza la clasificatoria?", "es", "ranked"],
      ["¿Hay versión para Android?", "es", "mobile"],
      ["¿Se puede jugar en el teléfono?", "es", "mobile"],
      ["¿Cuál es la fecha de lanzamiento?", "es", "release-date"],
    ];
    for (const [q, l, id] of cases) assert.equal(first(q, l), id, `[${l}] "${q}" → ${ids(q, l).join(", ") || "nessuna"}`);
  });
  test("i suggerimenti della pagina non tirano dentro risposte fuori tema", () => {
    // per ogni lingua, nell'ordine di `suggerimenti`: Mulan, sinergie di Van Helsing, mazzo legale, patch del 21/09,
    // Leggendarie della Demo 2.0, abilità Alla rivelazione. Solo il mazzo legale e le Leggendarie hanno una risposta.
    const expected = [[], [], ["deck-rules"], [], ["legendaries"], []];
    for (const l of locales) {
      assert.equal(suggerimenti[l].length, expected.length, `[${l}] numero dei suggerimenti`);
      suggerimenti[l].forEach((q, i) => assert.deepEqual(ids(q, l), expected[i], `[${l}] "${q}"`));
    }
  });
  test("una domanda su una carta non tira dentro le FAQ, e al massimo ne entrano due", () => {
    assert.deepEqual(ids("What does Mulan do?", "en"), []);
    assert.deepEqual(ids("Che cosa fa Mulan?", "it"), []);
    assert.deepEqual(ids("Is Dracula good with the Queen of Hearts?", "en"), []);
    assert.deepEqual(ids("", "en"), []);
    assert.ok(ids("Crimson Cup Conquest rules, prizes and dates", "en").length <= 2);
    // una seconda risposta entra solo se è vicina quasi quanto la prima
    assert.deepEqual(ids("When does the Origins TCG Kickstarter start?", "en"), ["kickstarter"]);
  });
});

describe("contesto dell'assistente", () => {
  test("le guide delle risposte approvate vengono dopo carte e guide trovate", () => {
    const { fonti } = contestoPer("Which cards work well with Van Helsing?", "en");
    assert.equal(fonti[0]?.tipo, "card");
    assert.equal(fonti[0]?.slug, "van-helsing");
    // prima della correzione la parola "demo" tirava dentro le risposte sulle Leggendarie e sui progressi della demo,
    // e la guida explained diventava la prima fonte di una domanda sulla patch
    const patch = contestoPer("What changed in the demo patch of 21 September?", "en").fonti.slice(0, 3);
    assert.ok(!patch.some((f) => f.slug === "origins-tcg-explained"), JSON.stringify(patch));
  });
  test("una domanda sul gioco porta fra le fonti la guida della risposta approvata", () => {
    const { testo, fonti } = contestoPer("Is Origins TCG on Android?", "en");
    assert.match(testo, /RISPOSTE APPROVATE/);
    assert.ok(fonti.some((f) => f.tipo === "guide" && f.slug === "roadmap-and-dates"));
  });
});
