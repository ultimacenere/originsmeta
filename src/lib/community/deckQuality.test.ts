/**
 * Test della qualità delle pagine della community (`deckQuality.ts`: soglia dei mazzi, profili, altri mazzi, autore
 * editoriale) e della distinzione fra "nessun risultato" ed "errore" nelle letture (`rowsOrThrow` e `rowOrThrow` di
 * `queries.ts`), con il runner integrato di Node: `node --test src/lib/community/deckQuality.test.ts`.
 *
 * I due moduli sono scritti per Next (import senza estensione, alias `@/`): prima di caricarli il test registra un
 * piccolo hook di risoluzione dei moduli di Node (`module.registerHooks`, Node ≥ 22.15, come cardTitles.test.ts), che
 * traduce `@/` nella cartella src e aggiunge `.ts` agli import senza estensione. Nessuna chiamata a Supabase: di
 * queries.ts si provano solo le due funzioni pure.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

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
const q: typeof import("./deckQuality") = await import("./deckQuality.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const tr: typeof import("./deckTranslation") = await import("./deckTranslation.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const queries: typeof import("./queries") = await import("./queries.ts");

type Lang = "en" | "it" | "es";
const all: Lang[] = ["en", "it", "es"];
/** Un testo di `n` parole, tutte diverse da quelle vere ma contate allo stesso modo. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `parola${i}`).join(" ");
const guide = (lang: Lang, summary: string, more: Record<string, string> = {}) => ({ lang, summary, ...more }) as never;

describe("countWords", () => {
  test("inglese, italiano e spagnolo: parole vere, anche con accenti, elisioni e punteggiatura spagnola", () => {
    assert.equal(q.countWords("Play Merlin early, then hold your spells."), 7);
    // "l'abilità" e "dell'avversario" sono due parole ciascuna
    assert.equal(q.countWords("Gioca l'abilità dell'avversario più tardi."), 7);
    assert.equal(q.countWords("¿Cuándo juegas a Merlin? ¡Pronto, con maná!"), 7);
    assert.equal(q.countWords("Gioca l’abilità"), 3, "anche l'apostrofo tipografico separa");
  });

  test("numeri, statistiche, emoji e segni di elenco non sono parole", () => {
    assert.equal(q.countWords("- 3/2\n• +2⚔️/+2❤️\n1. 5 ⭐"), 0);
    assert.equal(q.countWords("- Buff\n- Nerf"), 2);
  });

  test("barre e spazi di ogni tipo separano, il trattino no", () => {
    assert.equal(q.countWords("Swarm/Aggro"), 2);
    assert.equal(q.countWords("mid-range Trick-or-Treat"), 2);
    assert.equal(q.countWords("uno due\tre\n\nquattro"), 4);
    assert.equal(q.countWords("   "), 0);
  });
});

describe("soglia dei mazzi", () => {
  test("si contano riassunto e sezioni, non la lingua", () => {
    assert.equal(q.guideWordCount({ guide: guide("it", words(10), { strengths: words(5), notes: words(3), weaknesses: "  " }) }), 18);
  });

  test(`sotto ${"GUIDE_MIN_WORDS"} parole il mazzo non si indicizza, da lì in su sì`, () => {
    const min = q.GUIDE_MIN_WORDS;
    assert.ok(min >= 60 && min <= 80, "la soglia resta intorno alle 80 parole del piano");
    assert.equal(q.deckIndexable({ guide: guide("it", words(min - 1)) }), false);
    assert.equal(q.deckIndexable({ guide: guide("it", words(min)) }), true);
    assert.equal(q.deckIndexable({ guide: guide("it", words(min - 10), { strengths: words(10) }) }), true, "le sezioni contano");
  });

  test("i casi dei rilievi: le guide sottili (11–56 parole) stanno sotto, i piani di gioco da 78 parole sopra", () => {
    for (const n of [11, 14, 21, 27, 40, 56]) assert.equal(q.deckIndexable({ guide: guide("it", words(n)) }), false, `${n} parole`);
    for (const n of [78, 81, 93, 144, 238]) assert.equal(q.deckIndexable({ guide: guide("it", words(n)) }), true, `${n} parole`);
  });

  test("lingue indicizzabili: nessuna sotto soglia, altrimenti originale più traduzioni aggiornate", () => {
    const thin = { guide: guide("it", words(20)) };
    assert.deepEqual(q.indexableLocales(thin, all), []);
    const full = { guide: guide("it", words(120)) };
    assert.deepEqual(q.indexableLocales(full, all), ["it"]);
    const g = guide("it", words(120));
    const translated = { guide: g, translations: { en: { hash: tr.guideHash(g), at: "2026-09-25", guide: { summary: "x" } } } };
    assert.deepEqual(q.indexableLocales(translated, all), ["en", "it"]);
    // Una traduzione di un mazzo sottile non lo rende indicizzabile: le traduzioni hanno la stessa lunghezza
    const thinG = guide("it", words(20));
    const thinTranslated = { guide: thinG, translations: { en: { hash: tr.guideHash(thinG), at: "2026-09-25", guide: { summary: words(200) } } } };
    assert.deepEqual(q.indexableLocales(thinTranslated, all), []);
  });
});

describe("profili pubblici", () => {
  test("si indicizza con almeno un mazzo pubblicato o una tier list", () => {
    assert.equal(q.profileIndexable({ decks: 0, tierLists: 0 }), false);
    assert.equal(q.profileIndexable({ decks: 1, tierLists: 0 }), true);
    assert.equal(q.profileIndexable({ decks: 0, tierLists: 1 }), true);
  });

  const names = ["a", "albeo_o", "luigidavdasragoni", "Un nome utente davvero molto lungo per davvero", "x".repeat(60)];
  const legendaryPool = ["Three Not So Little Pigs", "Legion of the Dead", "Queen of Hearts", "Van Helsing", "Robin Hood", "King Arthur", "Dorothy", "Merlin"];

  test("title: contiene Origins TCG e sta entro 60 caratteri, in ogni lingua e con ogni nome", () => {
    for (const locale of all)
      for (const name of names)
        for (const [decks, tierLists] of [
          [0, 0],
          [1, 0],
          [3, 0],
          [0, 2],
          [4, 1],
        ]) {
          const t = q.profileTitle({ name, decks, tierLists }, locale);
          assert.ok(t.length <= q.PROFILE_TITLE_MAX, `${locale} ${t} (${t.length})`);
          assert.match(t, /Origins TCG/);
        }
  });

  test("title: dice che cosa c'è nel profilo", () => {
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 4, tierLists: 1 }, "en"), "albeo_o: Origins TCG decks and tier lists");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 4, tierLists: 0 }, "it"), "albeo_o: mazzi di Origins TCG");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 1, tierLists: 0 }, "es"), "albeo_o: mazo de Origins TCG");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 0, tierLists: 2 }, "es"), "albeo_o: tier lists de Origins TCG");
  });

  test("description: fra 120 e 158 caratteri quando il profilo si indicizza, in ogni lingua e combinazione", () => {
    for (const locale of all)
      for (const name of names)
        for (let decks = 0; decks <= 6; decks++)
          for (const tierLists of [0, 1, 2]) {
            const facts = {
              name,
              decks,
              legendaries: legendaryPool.slice(0, decks),
              tierLists,
              tierKinds: (["legendaries", "cards"] as const).slice(0, tierLists),
            };
            const text = q.profileDescription(facts, locale);
            assert.ok(text.length <= q.PROFILE_DESC_MAX, `${locale} troppo lunga (${text.length}): ${text}`);
            if (q.profileIndexable(facts)) assert.ok(text.length >= q.PROFILE_DESC_MIN, `${locale} troppo corta (${text.length}): ${text}`);
            assert.match(text, /Origins TCG/);
          }
  });

  test("description: la frase sulle tier list solo se il profilo ne ha, le Leggendarie dai mazzi", () => {
    const base = { name: "albeo_o", decks: 4, legendaries: ["Dorothy", "Merlin", "Dracula", "Robin Hood"], tierKinds: [] as ("legendaries" | "cards")[] };
    const without = q.profileDescription({ ...base, tierLists: 0 }, "en");
    assert.match(without, /Dorothy, Merlin, Dracula and Robin Hood/);
    assert.doesNotMatch(without, /tier list/);
    assert.match(q.profileDescription({ ...base, tierLists: 1, tierKinds: ["cards"] }, "it"), /più la sua tier list/);
    assert.match(q.profileDescription({ ...base, tierLists: 2, tierKinds: ["cards", "legendaries"] }, "es"), /y sus 2 tier lists/);
    assert.match(q.profileDescription({ ...base, decks: 0, legendaries: [], tierLists: 1, tierKinds: ["legendaries"] }, "en"), /\(Legendaries\)/);
  });
});

describe("altri mazzi", () => {
  const deck = (slug: string, legendary: string | null, day: number) => ({ slug, legendary, created_at: `2026-09-${String(day).padStart(2, "0")}T12:00:00Z` });
  const pool = [deck("m1", "merlin", 10), deck("m2", "merlin", 12), deck("d1", "dracula", 20), deck("d2", "dracula", 21), deck("x1", null, 22), deck("m3", "merlin", 15)];

  test("prima la stessa Leggendaria (dal più recente), poi i più recenti; mai il mazzo stesso", () => {
    const r = q.relatedDecks(pool[0], pool, 4);
    assert.deepEqual(
      r.sameLegendary.map((d) => d.slug),
      ["m3", "m2"],
    );
    assert.deepEqual(
      r.recent.map((d) => d.slug),
      ["x1", "d2"],
    );
    assert.ok(![...r.sameLegendary, ...r.recent].some((d) => d.slug === "m1"));
  });

  test("senza Leggendaria: solo i più recenti", () => {
    const r = q.relatedDecks(deck("x1", null, 22), pool, 3);
    assert.deepEqual(r.sameLegendary, []);
    assert.deepEqual(
      r.recent.map((d) => d.slug),
      ["d2", "d1", "m3"],
    );
  });

  test("deterministico: l'ordine delle righe non cambia il risultato", () => {
    const a = q.relatedDecks(pool[2], pool);
    const b = q.relatedDecks(pool[2], [...pool].reverse());
    assert.deepEqual(a, b);
  });

  test("una Leggendaria con più mazzi del limite: ogni mazzo del gruppo riceve link dagli altri", () => {
    const group = Array.from({ length: 20 }, (_, i) => deck(`g${i}`, "merlin", i + 1));
    const inlinks = new Map(group.map((d) => [d.slug, 0]));
    for (const d of group) {
      const r = q.relatedDecks(d, group, 8);
      assert.equal(r.sameLegendary.length, 8);
      assert.equal(r.recent.length, 0);
      assert.ok(!r.sameLegendary.some((x) => x.slug === d.slug));
      assert.equal(new Set(r.sameLegendary.map((x) => x.slug)).size, 8, "nessun doppione");
      for (const x of r.sameLegendary) inlinks.set(x.slug, (inlinks.get(x.slug) ?? 0) + 1);
    }
    for (const [slug, n] of inlinks) assert.equal(n, 8, `${slug} riceve ${n} link`);
  });
});

describe("autore editoriale", () => {
  const authors = [
    { slug: "pierluigi-cella" },
    { slug: "davdas", communityDecks: [{ slug: "healing-healsing-9411" }, { slug: "dorothy-combo-7503" }] },
  ];

  test("basta uno dei mazzi dell'account nell'elenco dichiarato", () => {
    assert.equal(q.editorialAuthor(authors, ["nuovo-mazzo-1234", "dorothy-combo-7503"])?.slug, "davdas");
  });

  test("nessun mazzo dichiarato, nessun autore", () => {
    assert.equal(q.editorialAuthor(authors, ["qoh-f876"], "biofa8801"), undefined);
    assert.equal(q.editorialAuthor(authors, []), undefined);
  });

  test("il nome utente, se authors.ts un giorno lo dichiara, basta da solo", () => {
    const withUser = [...authors, { slug: "nuovo", communityUsername: "nuovo_autore" }];
    assert.equal(q.editorialAuthor(withUser, [], "nuovo_autore")?.slug, "nuovo");
    assert.equal(q.editorialAuthor(withUser, [], null), undefined);
  });
});

describe("letture: nessun risultato non è un errore", () => {
  const fail = { data: null, error: { code: "PGRST000", message: "fetch failed" } };

  test("un errore si lancia, così l'ISR tiene la pagina di prima", () => {
    assert.throws(() => queries.rowsOrThrow("listPublishedDecks", fail), (e: Error) => e instanceof queries.CommunityReadError && /listPublishedDecks: fetch failed/.test(e.message));
    assert.throws(() => queries.rowOrThrow("getCommunityDeck", fail), queries.CommunityReadError);
  });

  test("una lettura riuscita senza righe è una lista vuota o null", () => {
    assert.deepEqual(queries.rowsOrThrow("x", { data: [], error: null }), []);
    assert.deepEqual(queries.rowsOrThrow("x", { data: null, error: null }), []);
    assert.equal(queries.rowOrThrow("x", { data: null, error: null }), null);
  });

  test("le righe passano come sono", () => {
    assert.deepEqual(queries.rowsOrThrow<{ slug: string }>("x", { data: [{ slug: "a" }], error: null }), [{ slug: "a" }]);
    assert.deepEqual(queries.rowOrThrow<{ slug: string }>("x", { data: { slug: "a" }, error: null }), { slug: "a" });
  });
});
