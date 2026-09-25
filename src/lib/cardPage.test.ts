/**
 * Test dei testi della scheda carta (`cardPage.ts`, Ondata 2 del piano SEO/GEO) con il runner integrato di Node:
 * `node --test src/lib/cardPage.test.ts`. Controlla la frase d'attacco e il riquadro "In breve" nelle tre lingue, su
 * esempi scritti a mano e su TUTTE le carte del database, più le etichette (stesse chiavi in inglese, italiano e
 * spagnolo), l'alt dell'illustrazione e le righe delle fonti.
 * Come in `cardTitles.test.ts`, i moduli del sito si caricano con un hook di risoluzione di Node
 * (`module.registerHooks`, Node ≥ 22.15) che aggiunge `.ts` agli import relativi e dichiara i JSON.
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
const pageModule: typeof import("./cardPage") = await import("./cardPage.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const synergy: typeof import("./cardSynergy") = await import("./cardSynergy.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
const {
  asOfLine,
  cardBrief,
  cardImageAlt,
  cardImageSize,
  cardLabels,
  cardLdTexts,
  cardLead,
  cardStatusLd,
  createdFromDemo,
  deckSentence,
  fill,
  fillParts,
  itDei,
  itNei,
  legendaryPowers,
  partsText,
} = pageModule;
type CardFacts = import("./cardPage").CardFacts;
type DeckCount = import("./cardPage").DeckCount;
type BriefCompanion = import("./cardPage").BriefCompanion;
const { cardRelations } = synergy;
const { cards, cardSource, getCard } = cardsModule;

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];

const card = (slug: string) => {
  const c = getCard(slug);
  assert.ok(c, `carta assente dal database: ${slug}`);
  return c;
};
const facts = (slug: string, decks?: DeckCount, companions?: BriefCompanion[]): CardFacts => ({ decks, companions, ...cardRelations(card(slug), cards) });
/** Una compagna di mazzo per "In breve": la carta vera e in quanti mazzi sta insieme. */
const mate = (slug: string, together: number): BriefCompanion => ({ card: card(slug), together });
const lead = (slug: string, locale: Locale, decks?: DeckCount) => partsText(cardLead(card(slug), facts(slug, decks), locale));

describe("frase d'attacco: esempi", () => {
  test("una Leggendaria della demo, con il conto dei mazzi", () => {
    const decks = { n: 1, total: 16 };
    assert.equal(
      lead("merlin", "en", decks),
      "Merlin is a Legendary unit in Origins TCG, the digital card game by Koin Games. It costs 5 mana, has 5 Power and 5 Health, and is Neutral. It is in Demo 2.0 (checked in the game on September 22, 2026). It leads 1 of the 16 decks published on OriginsMeta.",
    );
    assert.equal(
      lead("merlin", "it", decks),
      "Merlin è un'unità Leggendaria di Origins TCG, il gioco di carte digitale di Koin Games. Costa 5 mana, ha 5 di Potenza e 5 di Salute ed è Neutral. È nella Demo 2.0 (verificata nel gioco il 22 settembre 2026). Guida 1 dei 16 mazzi pubblicati su OriginsMeta.",
    );
    assert.equal(
      lead("merlin", "es", decks),
      "Merlin es una unidad Legendaria de Origins TCG, el juego de cartas digital de Koin Games. Cuesta 5 de maná, tiene 5 de Poder y 5 de Salud y es Neutral. Está en la Demo 2.0 (verificada en el juego el 22 de septiembre de 2026). Lidera 1 de los 16 mazos publicados en OriginsMeta.",
    );
  });

  test("senza la lettura dei mazzi la frase non dice niente sui mazzi (mai \"nessun mazzo\" per un errore)", () => {
    for (const l of locales) assert.doesNotMatch(lead("merlin", l), /OriginsMeta/, l);
  });

  test("una magia: niente Potenza e Salute; in spagnolo \"hechizo\" è maschile", () => {
    const decks = { n: 0, total: 16 };
    assert.equal(
      lead("spellbook", "es", decks),
      "Spellbook es un hechizo de Origins TCG, el juego de cartas digital de Koin Games. Cuesta 3 de maná y es Neutral. Está en la Demo 2.0 (verificado en el juego el 22 de septiembre de 2026). Ninguno de los 16 mazos publicados en OriginsMeta lo usa todavía.",
    );
    assert.match(lead("spellbook", "it", decks), /^Spellbook è una magia di Origins TCG.*Costa 3 mana ed è Neutral\..*Nessuno dei 16 mazzi pubblicati su OriginsMeta la usa ancora\.$/);
  });

  test("una carta creata: non si aggiunge nel deck builder e chi la genera, con la catena dai testi", () => {
    assert.equal(
      lead("garlic", "en"),
      "Garlic is a created card in Origins TCG, the digital card game by Koin Games: it cannot be added to a deck in the deck builder, and during a match it is created by Van Helsing's Tools, which is in turn created by Van Helsing. It costs 1 mana and is Neutral.",
    );
    assert.equal(
      lead("garlic", "it"),
      "Garlic è una carta generata di Origins TCG, il gioco di carte digitale di Koin Games: non si può mettere nel mazzo con il deck builder, in partita la genera Van Helsing's Tools, a sua volta generata da Van Helsing. Costa 1 mana ed è Neutral.",
    );
    assert.equal(
      lead("garlic", "es"),
      "Garlic es una carta creada de Origins TCG, el juego de cartas digital de Koin Games: no se puede añadir a un mazo en el deck builder, durante la partida la crea Van Helsing's Tools, a su vez creada por Van Helsing. Cuesta 1 de maná y es Neutral.",
    );
    // i nomi delle carte della catena sono link alle loro schede
    const parts = cardLead(card("garlic"), facts("garlic"), "it");
    assert.deepEqual(
      parts.filter((p) => typeof p !== "string").map((p) => ("card" in p ? p.card : "")),
      ["garlic", "van-helsings-tools", "van-helsing"],
    );
  });

  test("Pumpkin finisce nel mazzo dell'avversario: la frase non dice mai che una carta creata non va nel mazzo", () => {
    // old-macdonald: "shuffle three Pumpkins into your opponent's deck". Si dice solo che il deck builder non la accetta.
    assert.equal(
      lead("pumpkin", "en"),
      "Pumpkin is a created card in Origins TCG, the digital card game by Koin Games: it cannot be added to a deck in the deck builder, and during a match it is created by Old MacDonald. It costs 0 mana and is Neutral.",
    );
    for (const c of cards.filter((x) => x.type === "token"))
      for (const l of locales) {
        const text = partsText(cardLead(c, facts(c.slug), l)) + cardBrief(c, facts(c.slug), l).map((i) => partsText(i.a)).join(" ");
        assert.doesNotMatch(text, /never goes in a deck|non si mette nel mazzo|nunca va en el mazo/, `${l} ${c.slug}`);
      }
  });

  test("una carta creata che nessun testo nomina: dice solo questo, senza legami presi dai dati importati", () => {
    assert.match(lead("reflection", "en"), /deck builder\. No card text says which card creates it\. It costs/);
    assert.match(lead("reflection", "it"), /deck builder\. Nessun testo di carta dice quale carta la genera\. Costa/);
    assert.match(lead("reflection", "es"), /deck builder\. Ningún texto de carta dice qué carta la crea\. Cuesta/);
    for (const l of locales) assert.doesNotMatch(lead("reflection", l), /Mulan/, l);
  });

  test("più carte la generano: verbo al plurale", () => {
    assert.match(lead("broomstick", "it"), /in partita la generano Animate Object e Sorcerer's Apprentice\./);
    assert.match(lead("broomstick", "es"), /durante la partida la crean Animate Object y Sorcerer's Apprentice\./);
  });

  test("una carta rimossa: la prima cosa è che non è nella Demo 2.0 e non entra nel deck builder", () => {
    assert.equal(
      lead("baker", "en"),
      "Baker is not in Demo 2.0, so it cannot be added in the deck builder. It was a unit in earlier builds of Origins TCG, the digital card game by Koin Games. Last known stats: it cost 3 mana, had 2 Power and 1 Health, and was Evil.",
    );
    assert.equal(
      lead("baker", "it"),
      "Baker non è nella Demo 2.0, quindi non si può aggiungere nel deck builder. Era un'unità delle build precedenti di Origins TCG, il gioco di carte digitale di Koin Games. Ultime statistiche note: costava 3 mana, aveva 2 di Potenza e 1 di Salute ed era Evil.",
    );
    assert.equal(
      lead("baker", "es"),
      "Baker no está en la Demo 2.0, así que no se puede añadir en el deck builder. Era una unidad de las builds anteriores de Origins TCG, el juego de cartas digital de Koin Games. Últimas estadísticas conocidas: costaba 3 de maná, tenía 2 de Poder y 1 de Salud y era Evil.",
    );
  });

  test("il vecchio nome chiude la frase: è anche una ricerca", () => {
    assert.match(lead("boots", "en"), /In earlier builds it was called Puss in Boots\.$/);
    assert.match(lead("boots", "it"), /Nelle build precedenti si chiamava Puss in Boots\.$/);
    assert.match(lead("boots", "es"), /En builds anteriores se llamaba Puss in Boots\.$/);
  });
});

describe("frase d'attacco: tutte le carte", () => {
  test("gioco e casa sempre dentro, niente buchi, ogni tipo con il suo modello", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const l of locales) {
        const playable = c.status === "active" && c.type !== "token";
        const text = partsText(cardLead(c, { decks: playable ? { n: 2, total: 16 } : undefined, ...cardRelations(c, cards) }, l));
        const problems = [
          !text.startsWith(c.name) && "nome in testa",
          !text.includes("Origins TCG") && "Origins TCG",
          !text.includes("Koin Games") && "Koin Games",
          /undefined|NaN|\?|\{|\}| {2}|\s[.,;]/.test(text) && "buchi",
          // "verificata nel gioco" solo sulle carte della collezione della demo (CARDS-09)
          !playable && /checked in the game|verificat|verificad/.test(text) && "verificata",
          playable && !/checked in the game|verificat|verificad/.test(text) && "stato",
          c.status === "removed" && !/is not in Demo 2\.0|non è nella Demo 2\.0|no está en la Demo 2\.0/.test(text.slice(c.name.length, c.name.length + 30)) && "prima riga",
          c.type === "token" &&
            c.status === "active" &&
            !/cannot be added to a deck in the deck builder|non si può mettere nel mazzo con il deck builder|no se puede añadir a un mazo en el deck builder/.test(text) &&
            "deck builder",
        ].filter(Boolean);
        if (problems.length) bad.push(`${l} ${c.slug}: ${problems.join(", ")} — ${text}`);
      }
    assert.deepEqual(bad, []);
  });
});

describe("deckSentence", () => {
  const merlin = card("merlin");
  const spellbook = card("spellbook");
  test("i casi limite: nessun mazzo, un mazzo solo", () => {
    assert.equal(deckSentence(merlin, { n: 0, total: 0 }, "it"), "Su OriginsMeta non ci sono ancora mazzi pubblicati.");
    assert.equal(deckSentence(merlin, { n: 1, total: 1 }, "en"), "It leads the only deck published on OriginsMeta.");
    assert.equal(deckSentence(spellbook, { n: 0, total: 1 }, "es"), "El único mazo publicado en OriginsMeta no lo usa.");
    assert.equal(deckSentence(spellbook, { n: 1, total: 1 }, "it"), "È nell'unico mazzo pubblicato su OriginsMeta.");
  });
  test("l'articolo italiano davanti ai numeri: dei 16, degli 11, degli 8", () => {
    assert.equal(itDei(16), "dei");
    assert.equal(itDei(11), "degli");
    assert.equal(itDei(8), "degli");
    assert.equal(itDei(80), "degli");
    assert.equal(itDei(110), "dei");
    assert.equal(itDei(11000), "degli");
    assert.equal(deckSentence(spellbook, { n: 3, total: 11 }, "it"), "È in 3 degli 11 mazzi pubblicati su OriginsMeta.");
  });
});

describe("In breve", () => {
  test("Merlin: demo e patch con il link alla news; senza carte in comune fra due mazzi, niente terza domanda", () => {
    const items = cardBrief(card("merlin"), facts("merlin", { n: 1, total: 16 }), "en");
    assert.deepEqual(
      items.map((i) => i.q),
      ["Is Merlin in the Origins TCG demo?", "Has a patch changed Merlin?"],
    );
    // una patch sola: la si dice direttamente, senza "in 1 patch. The latest is…"
    assert.equal(partsText(items[1].a), "Yes: patch 0.6.3 (August 27, 2026) changed its Power from 3 to 5.");
    assert.equal(partsText(cardBrief(card("merlin"), facts("merlin"), "it")[1].a), "Sì: la patch 0.6.3 del 27 agosto 2026 ha cambiato la Potenza da 3 a 5.");
    assert.equal(partsText(cardBrief(card("merlin"), facts("merlin"), "es")[1].a), "Sí: el parche 0.6.3 del 27 de agosto de 2026 cambió su Poder de 3 a 5.");
    assert.ok(items[1].a.some((p) => typeof p !== "string" && "path" in p && p.path === "/news/patch-0-6-3"));
  });

  test("il conto dei mazzi sta nella frase d'attacco e non si ripete: la terza domanda sono le carte più spesso insieme", () => {
    const mates = [mate("genie", 2), mate("koschei", 2), mate("captain-ahab", 2), mate("spellbook", 1)];
    // Merlin non genera carte (Dracula sì: per lui la terza domanda è "quali carte genera")
    const en = cardBrief(card("merlin"), facts("merlin", { n: 2, total: 16 }, mates), "en");
    assert.equal(en[2].q, "Which cards are often in the same deck as Merlin?");
    assert.equal(partsText(en[2].a), "The cards found most often in the 2 decks it leads: Captain Ahab (in 2 of 2), Genie (in 2 of 2) and Koschei (in 2 of 2).");
    for (const l of locales) {
      const all = cardBrief(card("merlin"), facts("merlin", { n: 2, total: 16 }, mates), l).map((i) => partsText(i.a)).join(" ");
      assert.doesNotMatch(all, /OriginsMeta/, `${l}: il conto dei mazzi pubblicati è già nella frase d'attacco`);
    }
    // l'articolo italiano davanti a 8 e 11: "negli 8 mazzi che guida"; carta base: "nei suoi 8"
    assert.match(partsText(cardBrief(card("merlin"), facts("merlin", { n: 8, total: 16 }, mates), "it")[2].a), /^Le carte più presenti negli 8 mazzi che guida: Captain Ahab \(in 2 su 8\)/);
    assert.match(partsText(cardBrief(card("genie"), facts("genie", { n: 8, total: 16 }, [mate("dracula", 3)]), "it")[2].a), /^Le carte più presenti nei suoi 8 mazzi pubblicati: Dracula \(in 3 su 8\)\.$/);
    assert.match(partsText(cardBrief(card("genie"), facts("genie", { n: 3, total: 16 }, [mate("dracula", 3)]), "es")[2].a), /^Las cartas más presentes en sus 3 mazos publicados: Dracula \(en 3 de 3\)\.$/);
    assert.equal(itNei(8), "negli");
    assert.equal(itNei(16), "nei");
  });

  test("carte create: la prima risposta dice lo stato senza ripetere chi la genera; senza una carta della demo che la generi, non si può dire", () => {
    const garlic = cardBrief(card("garlic"), facts("garlic"), "en");
    assert.equal(partsText(garlic[0].a), "Yes, as a created card: it cannot be added to a deck in the deck builder, but it comes into a match from a card in Demo 2.0.");
    assert.equal(partsText(cardBrief(card("garlic"), facts("garlic"), "it")[0].a), "Sì, come carta generata: non si può mettere nel mazzo con il deck builder, ma in partita arriva da una carta della Demo 2.0.");
    for (const slug of ["reflection", "little-pig", "off-with-your-head"]) {
      assert.equal(createdFromDemo(facts(slug)), false, slug);
      // mai un "sì" senza una base verificabile, e nessuna fonte nominata (dal 25/09/2026)
      assert.match(partsText(cardBrief(card(slug), facts(slug), "en")[0].a), /^We cannot say for sure: no card text in Demo 2\.0 creates it, and created cards are not in the game's collection\. /, slug);
      assert.match(partsText(cardBrief(card(slug), facts(slug), "it")[0].a), /^Non si può dire con certezza: nessun testo delle carte della Demo 2\.0 la genera, /, slug);
      assert.match(partsText(cardBrief(card(slug), facts(slug), "es")[0].a), /^No se puede decir con certeza: ningún texto de las cartas de la Demo 2\.0 la crea, /, slug);
      assert.equal(partsText(cardBrief(card(slug), facts(slug), "en")[2].a), "No card text says so.", slug);
    }
    for (const c of cards.filter((x) => x.type === "token"))
      for (const l of locales) for (const g of facts(c.slug).createdBy.flat()) assert.ok(!partsText(cardBrief(c, facts(c.slug), l)[0].a).includes(g.name), `${l} ${c.slug}: ${g.name}`);
  });

  test("carte rimosse che generavano: al passato", () => {
    const en = cardBrief(card("headless-horseman"), facts("headless-horseman"), "en");
    assert.equal(en[2].q, "Which cards did Headless Horseman create?");
    assert.equal(partsText(en[2].a), "Headless Horseman created Pumpkin (from the card texts).");
    assert.equal(partsText(cardBrief(card("necromancer"), facts("necromancer"), "it")[2].a), "Necromancer generava Zombie (dai testi delle carte).");
    assert.equal(partsText(cardBrief(card("pumpkin-patch"), facts("pumpkin-patch"), "es")[2].a), "Pumpkin Patch creaba Pumpkin (según los textos de las cartas).");
  });

  test("le carte create dicono chi le genera, anche nelle build precedenti", () => {
    const it = cardBrief(card("pumpkin"), facts("pumpkin"), "it");
    assert.equal(it[2].q, "Quale carta genera Pumpkin?");
    assert.equal(partsText(it[2].a), "La genera Old MacDonald (dai testi delle carte). Nelle build precedenti la generavano anche Headless Horseman e Pumpkin Patch.");
  });

  test("le carte che generano: la catena in avanti", () => {
    const es = cardBrief(card("van-helsing"), facts("van-helsing", { n: 2, total: 16 }), "es");
    assert.equal(partsText(es[2].a), "Van Helsing crea Van Helsing's Tools, que a su vez crea Garlic, Holy Water, Silver Bullet y Wooden Stake (según los textos de las cartas).");
  });

  test("un cambio di allineamento e un cambio del solo testo", () => {
    assert.match(partsText(cardBrief(card("itsy-bitsy-spider"), facts("itsy-bitsy-spider"), "it")[1].a), /ha cambiato l'allineamento da Neutral a Evil\.$/);
    assert.match(partsText(cardBrief(card("silver-bullet"), facts("silver-bullet"), "en")[1].a), /^Yes, in 2 patches\..*which changed its text\.$/);
  });

  test("ogni carta, ogni lingua: 2 o 3 domande, risposte senza buchi, le rimosse dicono di no alla demo", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const l of locales) {
        const playable = c.status === "active" && c.type !== "token";
        const items = cardBrief(c, { decks: playable ? { n: 0, total: 16 } : undefined, ...cardRelations(c, cards) }, l);
        if (items.length < 2 || items.length > 3) bad.push(`${l} ${c.slug}: ${items.length} domande`);
        for (const it of items) if (/undefined|NaN|\{|\}| {2}/.test(it.q + partsText(it.a))) bad.push(`${l} ${c.slug}: ${it.q} ${partsText(it.a)}`);
        if (c.status === "removed" && !/^(No|No:)/.test(partsText(items[0].a))) bad.push(`${l} ${c.slug}: demo`);
      }
    assert.deepEqual(bad, []);
  });
});

describe("etichette e fonti", () => {
  /** Tutte le chiavi, anche annidate, di un oggetto di etichette. */
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();

  test("le tre lingue hanno le stesse etichette, tutte scritte, con gli stessi segnaposto", () => {
    const en = keys(cardLabels.en);
    for (const l of locales) assert.deepEqual(keys(cardLabels[l]), en, l);
    const flat = (o: object): Record<string, string> =>
      Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? Object.entries(flat(v as object)).map(([kk, vv]) => [`${k}.${kk}`, vv]) : [[k, String(v)]])));
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((h) => h !== "dei").sort();
    const base = flat(cardLabels.en);
    for (const l of locales) {
      const labels = flat(cardLabels[l]);
      for (const [k, v] of Object.entries(labels)) {
        assert.ok(v.trim(), `${l} ${k} vuota`);
        assert.deepEqual(holes(v), holes(base[k]), `${l} ${k}`);
      }
    }
  });

  test("testo inglese del gioco e traduzione nostra: le etichette chieste dal piano", () => {
    assert.equal(cardLabels.it.textEnglish, "Testo inglese del gioco");
    assert.equal(cardLabels.es.textEnglish, "Texto en inglés del juego");
    assert.equal(cardLabels.it.textOurs, "Traduzione di OriginsMeta (glossario del gioco)");
    assert.equal(cardLabels.es.textOurs, "Traducción de OriginsMeta (glosario del juego)");
    // carte create e rimosse: il testo non è verificabile nel gioco, e l'etichetta dice solo questo (dal 25/09/2026 non
    // nomina più da dove viene), come la pagina inglese
    assert.equal(cardLabels.it.textEnglishWoo, "Testo inglese (non verificato nel gioco)");
    assert.equal(cardLabels.es.textEnglishWoo, "Texto en inglés (no verificado en el juego)");
    assert.equal(cardLabels.en.textWoo, "Card text (not checked in the game)");
  });

  test("\"Spesso nello stesso mazzo\": davanti a \"suoi\" l'articolo è sempre \"dei\", davanti al numero cambia", () => {
    for (const n of [2, 8, 11, 16]) assert.equal(fill(cardLabels.it.togetherIntro, { name: "Genie", min: 2, n }), `Carte presenti insieme a Genie in almeno 2 dei suoi ${n} mazzi pubblicati.`);
    assert.equal(fill(cardLabels.it.togetherIntroLed, { name: "Dracula", min: 2, n: 8, dei: itDei(8) }), "Carte presenti in almeno 2 degli 8 mazzi guidati da Dracula.");
  });

  test("misure della carta ufficiale da card-art.json, non dal file (la scheda è ISR)", () => {
    assert.deepEqual(cardImageSize({ key: "C00001_MB", image: "/cards/tuck.webp" }), { width: 480, height: 690 });
    assert.equal(cardImageSize({ key: "C00001_MB" }), undefined);
    assert.equal(cardImageSize({ key: "NESSUNA", image: "/cards/x.webp" }), undefined);
    for (const c of cards) if (c.image) assert.ok(cardImageSize(c)?.height, c.slug);
  });

  test("testi nel JSON-LD: solo del gioco, con la loro lingua, uguali su tutte le pagine", () => {
    const merlin = cardLdTexts(card("merlin"), false);
    assert.deepEqual(
      merlin.map((t) => t.lang),
      ["en", "it", "es"],
    );
    assert.ok(merlin.every((t) => !/\n| {2}/.test(t.text)));
    // carte create e rimosse: il solo inglese, mai la nostra traduzione
    for (const slug of ["garlic", "baker"]) assert.deepEqual(cardLdTexts(card(slug), false).map((t) => t.lang), card(slug).ability ? ["en"] : [], slug);
    assert.deepEqual(cardLdTexts(card("merlin"), true), []);
  });

  test("stato nei dati strutturati: uguale in ogni lingua; le carte create senza catena dalla demo non si dicono nella demo", () => {
    assert.equal(cardStatusLd(card("merlin"), facts("merlin")), "In Demo 2.0");
    assert.equal(cardStatusLd(card("garlic"), facts("garlic")), "Created card in Demo 2.0");
    assert.equal(cardStatusLd(card("reflection"), facts("reflection")), "Created card, not verified in Demo 2.0");
    assert.equal(cardStatusLd(card("baker"), facts("baker")), "Not in Demo 2.0 (earlier builds)");
  });

  test("alt della carta ufficiale: nome, tipo, gioco, illustratore e © Koin Games", () => {
    const merlin = card("merlin");
    const illus = merlin.credit?.illus;
    assert.ok(illus);
    assert.equal(cardImageAlt(merlin, "en"), `Merlin, Legendary unit: official Origins TCG card, art by ${illus}, © Koin Games`);
    assert.equal(cardImageAlt(merlin, "it"), `Merlin, unità Leggendaria: carta ufficiale di Origins TCG, illustrazione di ${illus}, © Koin Games`);
    assert.equal(cardImageAlt(card("legion-of-the-dead"), "es").split(":")[0], "Legion of the Dead, hechizo Legendario");
    for (const c of cards) for (const l of locales) assert.match(cardImageAlt(c, l), /Origins TCG.*© Koin Games$/, `${l} ${c.slug}`);
  });

  test("riga sotto le statistiche: le carte create e rimosse non si dicono verificate nel gioco, e nessuna fonte è nominata", () => {
    assert.equal(asOfLine(card("merlin"), "it", cardSource), undefined);
    const notChecked: Record<Locale, RegExp> = { en: /not been checked in the game|cannot be checked in the game/, it: /non sono stati verificati nel gioco|non si può verificare nel gioco/, es: /no se han verificado en el juego|no se puede verificar en el juego/ };
    for (const l of locales) {
      for (const slug of ["garlic", "baker"]) {
        const line = asOfLine(card(slug), l, cardSource) ?? "";
        assert.match(line, notChecked[l], `${l} ${slug}`);
        assert.doesNotMatch(line, /World of Origins|worldoforigins|database|base de datos|import/i, `${l} ${slug}`);
      }
      // le carte rimosse: gli ultimi dati noti, con la patch dei dati importati
      assert.match(asOfLine(card("baker"), l, cardSource) ?? "", /0\.6\.3/, l);
    }
    assert.match(asOfLine(card("baker"), "en", cardSource) ?? "", /^Not in Demo 2\.0/);
  });

  test("le patch si nominano con patchLabel, mai con l'id (anche quando l'import arriverà alla demo-0921)", () => {
    const later = { patch: "demo-0921" };
    for (const l of locales) {
      const text = asOfLine(card("baker"), l, later) ?? "";
      assert.match(text, /Demo · 21/, l);
      assert.doesNotMatch(text, /demo-0921/, l);
    }
    // una patch che il sito non conosce resta com'è
    assert.match(asOfLine(card("baker"), "en", { patch: "0.7.0" }) ?? "", /as of patch 0\.7\.0/);
  });

  test("fillParts: i segnaposto diventano pezzi, anche elenchi di carte", () => {
    const parts = fillParts("Build a deck with {roots} for {name}.", { roots: [{ card: "a", text: "A" }, " or ", { card: "b", text: "B" }], name: "X" });
    assert.equal(partsText(parts), "Build a deck with A or B for X.");
    assert.equal(parts.filter((p) => typeof p !== "string").length, 2);
  });

  test("potere leggendario: vuoto finché non è letto nel gioco (SCHEDE-13), e solo per Leggendarie", () => {
    for (const [slug, text] of Object.entries(legendaryPowers)) {
      assert.ok(card(slug).legendary, slug);
      for (const l of locales) assert.ok(text?.[l]?.trim(), `${slug} ${l}`);
    }
  });
});

/**
 * Dal 25/09/2026, per decisione di Pierluigi, il sito non nomina e non linka World of Origins, il database della
 * community da cui `npm run import:woo` importa i dati delle carte: l'import resta uno strumento interno. Questo test
 * fallisce se il nome o il dominio ricompaiono nei testi pubblici scritti nel codice: etichette della scheda carta,
 * etichette di /about e dei dati strutturati del sito, dizionari, news, etichette dei tag; e se `cardSource` torna a
 * portare nome o indirizzo della fonte, che le pagine potrebbero mostrare.
 */
describe("World of Origins non si nomina nei testi pubblici", () => {
  const woo = /world\s*of\s*origins|worldoforigins/i;

  test("etichette, dizionari, news e tag", async () => {
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const entity: typeof import("./entityLabels") = await import("./entityLabels.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const dictEn: typeof import("./dictionaries/en") = await import("./dictionaries/en.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const dictIt: typeof import("./dictionaries/it") = await import("./dictionaries/it.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const dictEs: typeof import("./dictionaries/es") = await import("./dictionaries/es.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const newsModule: typeof import("./data/news") = await import("./data/news.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const keywords: typeof import("./keywordLabels") = await import("./keywordLabels.ts");
    const sources: Record<string, unknown> = {
      cardLabels,
      entityLabels: entity.entityLabels,
      "dictionaries/en": dictEn.en,
      "dictionaries/it": dictIt.it,
      "dictionaries/es": dictEs.es,
      news: newsModule.news,
      keywordLabels: keywords.keywordLabels,
    };
    for (const [name, value] of Object.entries(sources)) assert.doesNotMatch(JSON.stringify(value), woo, name);
    for (const l of locales) assert.doesNotMatch(entity.aboutDisclaimer(l) + entity.aboutChecks(l, { date: "D", count: 1, textsDate: "T" }).join(" "), woo, l);
  });

  test("le frasi della scheda di ogni carta, in ogni lingua", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const l of locales) {
        const f = facts(c.slug, c.status === "active" && c.type !== "token" ? { n: 1, total: 16 } : undefined);
        const text = [partsText(cardLead(c, f, l)), ...cardBrief(c, f, l).map((i) => i.q + partsText(i.a)), asOfLine(c, l, cardSource) ?? "", cardStatusLd(c, f)].join(" ");
        if (woo.test(text)) bad.push(`${l} ${c.slug}`);
      }
    assert.deepEqual(bad, []);
  });

  test("cardSource porta solo patch e data dell'import, niente nome né indirizzo della fonte", () => {
    assert.deepEqual(Object.keys(cardSource).sort(), ["fetched", "patch"]);
  });
});
