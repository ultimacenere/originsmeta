/**
 * Test della qualità delle pagine della community (`deckQuality.ts`: soglia dei mazzi, robots e hreflang, righe della
 * sitemap, indicatore del modulo, profili, altri mazzi, autore editoriale), della distinzione fra "nessun risultato" ed
 * "errore" nelle letture (`rowsOrThrow` e `rowOrThrow` di `queries.ts`) e dei dati strutturati di mazzi e profili
 * (`src/lib/jsonld/deck.ts`), con il runner integrato di Node: `node --test src/lib/community/deckQuality.test.ts`.
 *
 * I moduli sono scritti per Next (import senza estensione, alias `@/`): prima di caricarli il test registra un piccolo
 * hook di risoluzione dei moduli di Node (`module.registerHooks`, Node ≥ 22.15, come cardTitles.test.ts), che traduce
 * `@/` nella cartella src e aggiunge `.ts` agli import senza estensione. `@/components/JsonLd` è un file .tsx, che Node
 * non esegue: il test lo sostituisce con i soli `@id` che jsonld/deck.ts ne legge (più `breadcrumbs`), con lo stesso
 * `siteUrl`. Nessuna chiamata a Supabase: di queries.ts si provano solo le funzioni pure.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
/** indirizzo del sito per il finto JsonLd.tsx, letto da i18n.ts prima di caricare jsonld/deck.ts */
let stubSite = "";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "@/components/JsonLd") {
      // `breadcrumbs` serve a src/lib/jsonld/card.ts (pacchetto CARDS), se jsonld/deck.ts ne importerà `cardEntityId`
      const code = `export const organizationId = ${JSON.stringify(`${stubSite}/#organization`)}; export const videoGameId = ${JSON.stringify(`${stubSite}/#origins-tcg`)}; export function breadcrumbs() { return {}; }`;
      return { url: `data:text/javascript,${encodeURIComponent(code)}`, shortCircuit: true };
    }
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
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const i18n: typeof import("../i18n") = await import("../i18n.ts");
stubSite = i18n.siteUrl;
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const ld: typeof import("../jsonld/deck") = await import("../jsonld/deck.ts");

type Lang = "en" | "it" | "es";
const all: Lang[] = ["en", "it", "es"];
/** Un testo di `n` parole, tutte diverse da quelle vere ma contate allo stesso modo. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `parola${i}`).join(" ");
const guide = (lang: Lang, summary: string, more: Record<string, string> = {}) => ({ lang, summary, ...more }) as never;

/*
 * Guide realistiche vicine alla soglia, contate a mano parola per parola (i numeri attesi NON vengono dalla funzione).
 * Mettono alla prova ogni regola di `countWords`: quattro elisioni (sull', l'abilità, l'avversario, dell'ultimo), una
 * barra fra parole (aggro/tempo), un trattino (mid-range), numeri che non contano (4/5, 1-2), punteggiatura spagnola e
 * accenti. Se una regola cambia, il conto esatto cambia e il test lo dice; con le elisioni non separate IT_78 scende a
 * 74 e cambia lato della soglia.
 */
const IT_73 =
  "Il piano è semplice: nei primi turni si riempie lo spazio centrale con carte economiche, poi la Leggendaria spinge sull'avversario. Contro i mazzi Control e mid-range conviene tenere due carte in mano, perché l'abilità Alla rivelazione arriva al turno 4/5. Se l'avversario pesca bene si passa al piano B: difendere due spazi su tre contro aggro/tempo e chiudere con i buff dell'ultimo turno. Mulligan: tenere solo carte da 1-2 mana.";
const IT_78 = `${IT_73} Si vince al sesto turno.`;
const EN_44 =
  "Aggro deck: drop cheap units early, then buff them with Robin Hood's ability. Don't overextend into board wipes. Keep 1-2 cost cards in the opening hand; mulligan anything above 3 mana. Works well in ladder, struggles against Control decks with removal. It's fun!";
const ES_36 =
  "¿Cuándo jugar a Merlin? Pronto: el mazo busca llenar el espacio central con hechizos baratos y robar cartas. Contra mazos agresivos hay que guardar la habilidad Al revelar para el turno 5. ¡No te olvides del maná!";

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
    assert.equal(q.countWords("uno due\tre\n\nquattro"), 4);
    assert.equal(q.countWords("   "), 0);
  });

  test("guide realistiche: il conto esatto, contato a mano", () => {
    assert.equal(q.countWords(IT_73), 73);
    assert.equal(q.countWords(IT_78), 78);
    assert.equal(q.countWords(EN_44), 44);
    assert.equal(q.countWords(ES_36), 36);
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

  test("le guide realistiche: 78 parole sopra, 73 sotto, 73 più una sezione di 5 sopra; le guide corte sotto", () => {
    assert.equal(q.deckIndexable({ guide: guide("it", IT_78) }), true);
    assert.equal(q.deckIndexable({ guide: guide("it", IT_73) }), false);
    assert.equal(q.guideWordCount({ guide: guide("it", IT_73, { strengths: "Tanta pressione nei primi turni." }) }), 78);
    assert.equal(q.deckIndexable({ guide: guide("it", IT_73, { strengths: "Tanta pressione nei primi turni." }) }), true);
    assert.equal(q.deckIndexable({ guide: guide("en", EN_44) }), false);
    assert.equal(q.deckIndexable({ guide: guide("es", ES_36) }), false);
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

describe("robots e hreflang della scheda", () => {
  const g = guide("it", IT_78);
  const translated = { guide: g, translations: { en: { hash: tr.guideHash(g), at: "2026-09-25", guide: { summary: "x" } } } };

  test("mazzo sopra soglia: hreflang verso le lingue lette, noindex solo dove la guida non c'è", () => {
    assert.deepEqual(q.deckIndexing(translated, all, "it"), { languages: ["en", "it"], noindex: false, hreflang: true });
    assert.deepEqual(q.deckIndexing(translated, all, "es"), { languages: ["en", "it"], noindex: true, hreflang: true });
  });

  test("mazzo sotto soglia: noindex in ogni lingua e niente hreflang", () => {
    for (const locale of all) assert.deepEqual(q.deckIndexing({ guide: guide("it", IT_73) }, all, locale), { languages: [], noindex: true, hreflang: false });
  });

  test("dropHreflang toglie le lingue e tiene canonical e robots", () => {
    const meta = {
      title: "x",
      robots: { index: false, follow: true },
      alternates: { canonical: "https://originsmeta.com/it/decks/community/a", languages: { en: "…/en/…", it: "…/it/…", "x-default": "…/en/…" } },
    };
    const out = q.dropHreflang(meta);
    assert.deepEqual(out.alternates, { canonical: "https://originsmeta.com/it/decks/community/a" });
    assert.deepEqual(out.robots, { index: false, follow: true });
    assert.equal(out.title, "x");
    assert.ok("languages" in meta.alternates, "l'oggetto di partenza non cambia");
  });
});

describe("righe della sitemap", () => {
  const g = guide("it", IT_78);
  const rows = [
    { slug: "vero", updated_at: "2026-09-22T10:00:00Z", guide: g, translations: { en: { hash: tr.guideHash(g), at: "2026-09-22", guide: { summary: "x" } } } },
    { slug: "sottile-recente", updated_at: "2026-09-25T09:00:00Z", guide: guide("en", EN_44) },
    { slug: "senza-traduzioni", updated_at: "2026-09-23T10:00:00Z", guide: guide("es", words(90)) },
  ];

  test("solo i mazzi sopra soglia, mai con un elenco di lingue vuoto", () => {
    const { decks } = q.sitemapDecks(rows, all);
    assert.deepEqual(
      decks.map((d) => [d.slug, d.locales]),
      [
        ["vero", ["en", "it"]],
        ["senza-traduzioni", ["es"]],
      ],
    );
    assert.ok(decks.every((d) => d.locales.length > 0));
  });

  test("la data più recente conta anche i mazzi sotto soglia (lastmod di /decks e delle tier list)", () => {
    assert.equal(q.sitemapDecks(rows, all).latest, "2026-09-25T09:00:00Z");
    assert.deepEqual(q.sitemapDecks([], all), { decks: [] });
  });
});

describe("indicatore del modulo di pubblicazione", () => {
  test("conta il piano di gioco e le sezioni, come la soglia", () => {
    const values: Record<string, unknown> = { summary: IT_73, strengths: "Tanta pressione nei primi turni.", name: "Nome del mazzo con tante parole", video: "https://youtu.be/x" };
    assert.equal(
      q.guideFormWords((k) => values[k]),
      78,
    );
    assert.equal(
      q.guideFormWords(() => null),
      0,
    );
  });

  test("la frase dice le parole scritte e la soglia, nelle tre lingue", () => {
    for (const locale of all) {
      const below = q.guideMeter(44, locale);
      assert.equal(below.ok, false);
      assert.match(below.text, new RegExp(`^44 .*${q.GUIDE_MIN_WORDS}`));
      assert.doesNotMatch(below.text, /\{/);
      const ok = q.guideMeter(q.GUIDE_MIN_WORDS, locale);
      assert.equal(ok.ok, true);
      assert.match(ok.text, /Google/);
    }
  });
});

describe("etichette con segnaposto", () => {
  test("i $ del testo degli utenti restano come sono", () => {
    assert.equal(q.fillLabel("Altri mazzi con {legendary}", { legendary: "Cash$&Co" }), "Altri mazzi con Cash$&Co");
    assert.equal(q.fillLabel("{name}: Origins TCG", { name: "x$'y$`z$$" }), "x$'y$`z$$: Origins TCG");
    assert.equal(q.fillLabel("{a} e {b}", { a: "1" }), "1 e {b}", "un segnaposto senza valore resta");
  });
});

describe("profili pubblici", () => {
  test("si indicizza con almeno un mazzo pubblicato o una tier list", () => {
    assert.equal(q.profileIndexable({ decks: 0, tierLists: 0 }), false);
    assert.equal(q.profileIndexable({ decks: 1, tierLists: 0 }), true);
    assert.equal(q.profileIndexable({ decks: 0, tierLists: 1 }), true);
  });

  const names = ["a", "albeo_o", "luigidavdasragoni", "Un nome utente davvero molto lungo per davvero", "x".repeat(60), "Cash$&Co", "x$'y"];
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
          assert.doesNotMatch(t, /\{name\}/);
        }
  });

  test("title: dice che cosa c'è nel profilo; senza mazzi è un profilo della community", () => {
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 4, tierLists: 1 }, "en"), "albeo_o: Origins TCG decks and tier lists");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 4, tierLists: 0 }, "it"), "albeo_o: mazzi di Origins TCG");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 1, tierLists: 0 }, "es"), "albeo_o: mazo de Origins TCG");
    // le sole tier list non mettono "tier list" nel title: la query è di /tier-list e /tier-list/community
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 0, tierLists: 2 }, "es"), "albeo_o: perfil de la comunidad de Origins TCG");
    assert.equal(q.profileTitle({ name: "albeo_o", decks: 0, tierLists: 1 }, "it"), "albeo_o: profilo della community di Origins TCG");
  });

  test("title e description con i $ nel nome: il nome resta com'è", () => {
    assert.equal(q.profileTitle({ name: "Cash$&Co", decks: 2, tierLists: 0 }, "en"), "Cash$&Co: Origins TCG decks");
    assert.equal(q.profileTitle({ name: "x$'y", decks: 0, tierLists: 0 }, "it"), "x$'y: profilo della community di Origins TCG");
    assert.match(q.profileDescription({ name: "Cash$&Co", decks: 1, legendaries: ["Merlin"], tierLists: 0, tierKinds: [] }, "es"), /de Cash\$&Co \(Merlin\)/);
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

  test("description spagnola con le sole tier list: singolare e plurale concordano", () => {
    const one = q.profileDescription({ name: "newuser", decks: 0, legendaries: [], tierLists: 1, tierKinds: ["cards"] }, "es");
    assert.match(one, /^La tier list .*, lista para abrir/);
    const two = q.profileDescription({ name: "newuser", decks: 0, legendaries: [], tierLists: 2, tierKinds: ["cards", "legendaries"] }, "es");
    assert.match(two, /^Las 2 tier lists .*, listas para abrir/);
  });
});

describe("altri mazzi", () => {
  const FULL = guide("it", words(q.GUIDE_MIN_WORDS + 5));
  const THIN = guide("it", words(10));
  const deck = (slug: string, legendary: string | null, day: number, g: never = FULL) => ({
    slug,
    legendary,
    created_at: `2026-09-${String(day).padStart(2, "0")}T12:00:00Z`,
    guide: g,
  });
  const pool = [deck("m1", "merlin", 10), deck("m2", "merlin", 12), deck("d1", "dracula", 20), deck("d2", "dracula", 21), deck("x1", null, 22), deck("m3", "merlin", 15)];

  test("prima la stessa Leggendaria (dal più recente), poi gli altri; mai il mazzo stesso", () => {
    const r = q.relatedDecks(pool[0], pool, 4);
    assert.deepEqual(
      r.sameLegendary.map((d) => d.slug),
      ["m3", "m2"],
    );
    assert.equal(r.others.length, 2);
    assert.ok(r.others.every((d) => d.legendary !== "merlin"));
    assert.ok(![...r.sameLegendary, ...r.others].some((d) => d.slug === "m1"));
  });

  test("senza Leggendaria: solo altri mazzi, i vicini in ordine di pubblicazione", () => {
    const r = q.relatedDecks(deck("x1", null, 22), pool, 3);
    assert.deepEqual(r.sameLegendary, []);
    // x1 è l'ultimo: il successivo nel cerchio è il primo (m1), il precedente d2, poi m2
    assert.deepEqual(
      r.others.map((d) => d.slug),
      ["d2", "m2", "m1"],
    );
  });

  test("deterministico: l'ordine delle righe non cambia il risultato", () => {
    for (const current of pool) assert.deepEqual(q.relatedDecks(current, pool, 3), q.relatedDecks(current, [...pool].reverse(), 3));
  });

  test("prima i mazzi che si indicizzano, in ogni blocco; i sottili solo se mancano", () => {
    const mixed = [deck("a", "merlin", 1), deck("b", "merlin", 2, THIN), deck("c", "merlin", 3), deck("z", "dracula", 24, THIN), deck("y", "dracula", 23)];
    const r = q.relatedDecks(mixed[0], mixed, 3);
    assert.deepEqual(
      r.sameLegendary.map((d) => d.slug),
      ["c", "b"],
    );
    assert.deepEqual(
      r.others.map((d) => d.slug),
      ["y"],
      "il sottile z non entra: basta y",
    );
  });

  test("una Leggendaria con più mazzi del limite: ogni mazzo del gruppo riceve link dagli altri", () => {
    const group = Array.from({ length: 20 }, (_, i) => deck(`g${i}`, "merlin", i + 1));
    const inlinks = new Map(group.map((d) => [d.slug, 0]));
    for (const d of group) {
      const r = q.relatedDecks(d, group, 8);
      assert.equal(r.sameLegendary.length, 8);
      assert.equal(r.others.length, 0);
      assert.ok(!r.sameLegendary.some((x) => x.slug === d.slug));
      assert.equal(new Set(r.sameLegendary.map((x) => x.slug)).size, 8, "nessun doppione");
      for (const x of r.sameLegendary) inlinks.set(x.slug, (inlinks.get(x.slug) ?? 0) + 1);
    }
    for (const [slug, n] of inlinks) assert.equal(n, 8, `${slug} riceve ${n} link`);
  });

  test("Leggendarie tutte diverse: ogni mazzo indicizzabile riceve almeno limit−1 link, nessun sottile prima di un indicizzabile", () => {
    // 15 mazzi indicizzabili e 7 sottili sparsi, uno per Leggendaria, pubblicati uno al giorno (come i mazzi di oggi)
    const thinAt = new Set([1, 5, 9, 13, 16, 18, 20]);
    const decks = Array.from({ length: 22 }, (_, i) => deck(`k${String(i).padStart(2, "0")}`, `leggendaria-${i}`, i + 1, thinAt.has(i) ? THIN : FULL));
    const limit = 8;
    const inlinks = new Map(decks.map((d) => [d.slug, 0]));
    for (const d of decks) {
      const r = q.relatedDecks(d, decks, limit);
      assert.equal(r.sameLegendary.length, 0);
      assert.equal(r.others.length, limit);
      const firstThin = r.others.findIndex((x) => !q.deckIndexable(x));
      if (firstThin >= 0) assert.ok(r.others.slice(firstThin).every((x) => !q.deckIndexable(x)), `${d.slug}: un sottile prima di un indicizzabile`);
      for (const x of r.others) inlinks.set(x.slug, (inlinks.get(x.slug) ?? 0) + 1);
    }
    for (const d of decks.filter((x) => q.deckIndexable(x))) assert.ok((inlinks.get(d.slug) ?? 0) >= limit - 1, `${d.slug} riceve ${inlinks.get(d.slug)} link`);
  });

  test("un mazzo nuovo non toglie link ai vecchi: i più vecchi restano collegati", () => {
    const decks = Array.from({ length: 12 }, (_, i) => deck(`o${String(i).padStart(2, "0")}`, `l${i}`, i + 1));
    const count = (list: typeof decks) => {
      const m = new Map(list.map((d) => [d.slug, 0]));
      for (const d of list) for (const x of q.relatedDecks(d, list, 4).others) m.set(x.slug, (m.get(x.slug) ?? 0) + 1);
      return m;
    };
    const before = count(decks);
    const after = count([...decks, deck("nuovo", "l99", 28)]);
    for (const d of decks) assert.ok((after.get(d.slug) ?? 0) >= (before.get(d.slug) ?? 0), `${d.slug}: ${before.get(d.slug)} → ${after.get(d.slug)}`);
    assert.equal(after.get("o00"), 4, "anche il più vecchio riceve i suoi quattro link");
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

  test("il nome utente di authors.ts (`username`, pacchetto LD) basta da solo", () => {
    const withUser = [...authors, { slug: "nuovo", username: "nuovo_autore" }];
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

describe("dati strutturati di mazzi e profili", () => {
  const site = i18n.siteUrl;
  const pageUrl = `${site}/it/decks/community/healing-healsing-9411`;

  test("iscritto: una sola Person per le tre lingue, con l'url del profilo nella lingua della pagina", () => {
    const it = ld.communityPerson({ locale: "it", username: "albeo-o", name: "albeo_o" });
    const es = ld.communityPerson({ locale: "es", username: "albeo-o", name: "albeo_o" });
    assert.equal(it["@id"], `${site}/#user-albeo-o`);
    assert.equal(es["@id"], it["@id"]);
    assert.equal(it.url, `${site}/it/u/albeo-o`);
    assert.equal(es.url, `${site}/es/u/albeo-o`);
    assert.equal("sameAs" in it, false);
    assert.deepEqual(ld.communityPerson({ locale: "en", username: null, name: "senza nome" }), { "@type": "Person", name: "senza nome" });
  });

  test("autore editoriale: la Person della pagina autore (stesso @id di personId del pacchetto LD), niente sameAs interno", () => {
    const p = ld.communityPerson({ locale: "en", username: "luigidavdasragoni", name: "luigidavdasragoni", editorial: { slug: "davdas", name: "Luigi “Davdas” Ragoni" } });
    assert.equal(p["@id"], `${site}/#person-davdas`);
    assert.equal(p.name, "Luigi “Davdas” Ragoni");
    assert.equal(p.url, `${site}/en/authors/davdas`);
    assert.equal("sameAs" in p, false);
  });

  test("Article del mazzo: headline, autore, carte con l'@id delle schede, nessun AggregateRating", () => {
    const author = ld.communityPerson({ locale: "it", username: "luigidavdasragoni", name: "luigidavdasragoni", editorial: { slug: "davdas", name: "Luigi “Davdas” Ragoni" } });
    const a = ld.deckArticle({
      locale: "it",
      pageUrl,
      headline: "Healing Healsing, mazzo di Van Helsing · OriginsMeta",
      description: "…",
      published: "2026-09-15T15:30:00Z",
      modified: "2026-09-22T10:00:00Z",
      image: `${site}/cards/cover/van-helsing.webp`,
      author,
      legendary: { slug: "van-helsing", key: "C00075_MC", name: "Van Helsing" },
      cards: [
        { slug: "mulan", key: "C00010_MC", name: "Mulan" },
        { slug: "carta-senza-id", name: "Carta senza ID" },
      ],
    });
    assert.equal(a["@id"], `${pageUrl}#article`);
    assert.equal(a.headline, "Healing Healsing, mazzo di Van Helsing · OriginsMeta");
    assert.equal((a.author as { "@id": string })["@id"], `${site}/#person-davdas`);
    assert.equal("aggregateRating" in a, false);
    assert.deepEqual(a.isPartOf, { "@id": `${site}/it/decks#collection` });
    const about = a.about as { "@id": string; url?: string }[];
    assert.equal(about[0]["@id"], `${site}/#origins-tcg`);
    assert.equal(about[1]["@id"], `${site}/#card-C00075_MC`);
    assert.equal(about[1].url, `${site}/it/cards/van-helsing`);
    assert.deepEqual(
      (a.mentions as { "@id": string }[]).map((m) => m["@id"]),
      [`${site}/#card-C00010_MC`, `${site}/#card-carta-senza-id`],
    );
  });

  test("ProfilePage: @id #page e, come mainEntity, la stessa Person della firma dei mazzi con il numero di mazzi", () => {
    const person = ld.communityPerson({ locale: "es", username: "albeo-o", name: "albeo_o", extra: { identifier: "albeo-o" } });
    const p = ld.communityProfilePage({ locale: "es", pageUrl: `${site}/es/u/albeo-o`, name: "albeo_o", person, created: "2026-09-20T10:00:00Z", decks: 4 });
    assert.equal(p["@id"], `${site}/es/u/albeo-o#page`);
    assert.equal(p.dateCreated, "2026-09-20T10:00:00Z");
    const main = p.mainEntity as Record<string, unknown>;
    assert.equal(main["@id"], `${site}/#user-albeo-o`);
    assert.equal(main.identifier, "albeo-o");
    assert.deepEqual(main.agentInteractionStatistic, { "@type": "InteractionCounter", interactionType: "https://schema.org/WriteAction", userInteractionCount: 4 });
  });
});
