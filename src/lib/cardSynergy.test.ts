/**
 * Test dei legami delle schede carta (`cardSynergy.ts`, Ondata 2 del piano SEO/GEO) con il runner integrato di Node:
 * `node --test src/lib/cardSynergy.test.ts`.
 * - Mazzi: `decksByCard`, `decksForLocale`, `companions` ("spesso nello stesso mazzo") e `cardDeckDays` su mazzi
 *   finti, così il conto non dipende da Supabase.
 * - Carte generate: la catena "generata da" e "genera" sul database carte vero (quello di `cards.ts`), perché il punto
 *   è proprio non ripetere gli errori del campo `related` di World of Origins su Garlic, Holy Water, Wooden Stake,
 *   Silver Bullet, Mama Bear e Pumpkin.
 * `cards.ts` e i moduli che importa sono scritti per Next (import senza estensione, JSON senza attributi): come in
 * `cardTitles.test.ts`, prima di caricarli il test registra un hook di risoluzione dei moduli di Node
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
const synergy: typeof import("./cardSynergy") = await import("./cardSynergy.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
const {
  MAX_DECKS,
  byRating,
  cardDeckDays,
  cardDeckSlugs,
  cardPageDeckDays,
  cardPageLastmod,
  cardRelations,
  companions,
  createdChain,
  creationChain,
  deckRoots,
  decksByCard,
  decksForLocale,
  earlierCreators,
  listedDecks,
  namedTokens,
} = synergy;
type DeckRef = import("./cardSynergy").DeckRef;
const { cards, getCard } = cardsModule;

const card = (slug: string) => {
  const c = getCard(slug);
  assert.ok(c, `carta assente dal database: ${slug}`);
  return c;
};
const names = (list: readonly { name: string }[]) => list.map((c) => c.name);
const levels = (chain: readonly { name: string }[][]) => chain.map(names);

/** Mazzo finto: Leggendaria, carte base, voto, date e lingue in cui la sua pagina è indicizzabile. */
function deck(slug: string, legendary: string, list: string[], opts: Partial<DeckRef> = {}): DeckRef {
  return {
    slug,
    name: slug,
    legendary,
    cards: list,
    archetype: "midrange",
    rating: { avg: 0, votes: 0 },
    created: "2026-09-20T10:00:00Z",
    updated: "2026-09-20T10:00:00Z",
    author: "player",
    badge: "community",
    locales: ["en", "it", "es"],
    ...opts,
  };
}

const decks: DeckRef[] = [
  deck("a", "dracula", ["koschei", "genie", "spellbook"], { rating: { avg: 5, votes: 1 }, updated: "2026-09-22T08:00:00Z" }),
  deck("b", "dracula", ["koschei", "genie", "baker"], { rating: { avg: 4.5, votes: 4 }, locales: ["it"], updated: "2026-09-24T21:30:00+02:00" }),
  deck("c", "merlin", ["spellbook", "genie"], { created: "2026-09-23T10:00:00Z" }),
  deck("d", "merlin", ["spellbook"], { created: "2026-09-24T10:00:00Z" }),
];

describe("decksByCard", () => {
  test("una Leggendaria: i mazzi che guida; una carta base: i mazzi che la contengono", () => {
    assert.deepEqual(
      decksByCard(decks, "dracula").map((d) => d.slug),
      ["b", "a"],
    );
    assert.deepEqual(
      decksByCard(decks, "spellbook").map((d) => d.slug),
      ["a", "d", "c"],
    );
    assert.deepEqual(decksByCard(decks, "nessuna"), []);
  });

  test("con più carte, i mazzi che ne hanno almeno una (le carte create guardano la carta che le genera)", () => {
    assert.deepEqual(
      decksByCard(decks, ["baker", "merlin"]).map((d) => d.slug),
      ["b", "d", "c"],
    );
  });

  test("ordine: prima i mazzi votati, dal voto pesato sul numero di voti, poi i più recenti", () => {
    // 4,5 con 4 voti vale più di 5 con un voto solo (weightedRating), e i mazzi senza voti vanno in fondo, dal più nuovo
    assert.deepEqual(
      [...decks].sort(byRating).map((d) => d.slug),
      ["b", "a", "d", "c"],
    );
  });

  test("nella lingua della pagina si linkano solo i mazzi indicizzabili, e si dice quanti restano fuori", () => {
    const withDracula = decksByCard(decks, "dracula");
    assert.deepEqual(decksForLocale(withDracula, "en"), { shown: [decks[0]], others: 1 });
    assert.deepEqual(
      decksForLocale(withDracula, "it").shown.map((d) => d.slug),
      ["b", "a"],
    );
    // una regola più stretta (per esempio le guide troppo corte) si passa da fuori
    assert.deepEqual(decksForLocale(withDracula, "it", (d) => d.slug !== "a"), { shown: [decks[1]], others: 1 });
  });

  test("un mazzo con la guida sotto la soglia di DECKS non ha lingue indicizzabili e resta fra gli altri", async () => {
    // come in decksByCard.ts: le lingue del DeckRef vengono da indexableLocales (integrazione dell'Ondata 2)
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const quality: typeof import("./community/deckQuality") = await import("./community/deckQuality.ts");
    const words = (n: number) => Array.from({ length: n }, (_, i) => `parola${i}`).join(" ");
    const guide = (n: number) => ({ lang: "it", summary: words(n) }) as never;
    const all = ["en", "it", "es"] as const;
    const thin = quality.indexableLocales({ guide: guide(quality.GUIDE_MIN_WORDS - 1) }, all);
    const full = quality.indexableLocales({ guide: guide(quality.GUIDE_MIN_WORDS) }, all);
    assert.deepEqual(thin, []);
    assert.deepEqual(full, ["it"]);
    const list = [deck("sottile", "dracula", ["genie"], { locales: thin }), deck("completo", "dracula", ["genie"], { locales: full })];
    assert.deepEqual(decksForLocale(list, "it"), { shown: [list[1]], others: 1 });
    assert.deepEqual(decksForLocale(list, "en"), { shown: [], others: 2 });
  });
});

describe("companions", () => {
  test("le carte presenti insieme in almeno 2 mazzi, Leggendaria compresa, dalla più frequente", () => {
    assert.deepEqual(companions(decks, "dracula"), [
      { slug: "genie", together: 2 },
      { slug: "koschei", together: 2 },
    ]);
    assert.deepEqual(companions(decks, "spellbook"), [
      { slug: "genie", together: 2 },
      { slug: "merlin", together: 2 },
    ]);
  });

  test("con un mazzo solo non c'è co-presenza; la soglia si può alzare", () => {
    assert.deepEqual(companions(decks, "baker"), []);
    assert.deepEqual(companions(decks, "spellbook", 3), []);
    assert.deepEqual(companions(decks, "genie"), [
      { slug: "dracula", together: 2 },
      { slug: "koschei", together: 2 },
      { slug: "spellbook", together: 2 },
    ]);
    assert.deepEqual(companions(decks, "genie", 3), []);
  });

  test("una carta non è mai compagna di sé stessa", () => {
    for (const c of ["dracula", "merlin", "spellbook", "genie"]) assert.ok(!companions(decks, c, 1).some((x) => x.slug === c), c);
  });
});

describe("date della scheda con i mazzi", () => {
  test("i giorni di modifica dei soli mazzi con la carta, senza orario", () => {
    assert.deepEqual(cardDeckDays(decks, "dracula").sort(), ["2026-09-22", "2026-09-24"]);
    assert.deepEqual(cardDeckDays(decks, "nessuna"), []);
  });

  test("i giorni della scheda sono quelli dei mazzi che elenca in quella lingua; nessuno per create, rimosse e lettura fallita", () => {
    // il mazzo b è indicizzabile solo in italiano: la scheda inglese di Dracula non lo elenca, e il suo giorno non conta
    assert.deepEqual(cardPageDeckDays(card("dracula"), "en", decks), ["2026-09-22"]);
    assert.deepEqual(cardPageDeckDays(card("dracula"), "it", decks).sort(), ["2026-09-22", "2026-09-24"]);
    assert.deepEqual(cardPageDeckDays(card("dracula"), "en", null), []);
    assert.deepEqual(cardPageDeckDays(card("garlic"), "en", [deck("vh", "van-helsing", ["genie"], { updated: "2026-09-29T10:00:00Z" })]), []);
    assert.deepEqual(cardPageDeckDays(card("baker"), "it", decks), []);
  });

  test("elenco della scheda: indicizzabili nella lingua, al massimo MAX_DECKS, e gli altri contati", () => {
    const many = Array.from({ length: MAX_DECKS + 3 }, (_, i) => deck(`m${i}`, "merlin", ["genie"], { created: `2026-09-${String(10 + i).padStart(2, "0")}T10:00:00Z` }));
    const withIt = [...many, deck("only-it", "merlin", ["genie"], { locales: ["it"] })];
    const en = listedDecks(withIt, "genie", "en");
    assert.equal(en.listed.length, MAX_DECKS);
    assert.equal(en.others, 4);
    // dal più recente, come la tier list
    assert.equal(en.listed[0].slug, `m${MAX_DECKS + 2}`);
    assert.equal(listedDecks(decks, "dracula", "en").others, 1);
    // le date guardano solo i mazzi elencati: 12 giorni, non 16
    assert.equal(cardPageDeckDays(card("genie"), "en", withIt).length, MAX_DECKS);
  });

  test("le carte i cui mazzi conta la scheda: sé stessa, chi la genera per le carte create, nessuna per le rimosse", () => {
    assert.deepEqual(cardDeckSlugs(card("merlin"), cards), ["merlin"]);
    assert.deepEqual(cardDeckSlugs(card("garlic"), cards), ["van-helsing"]);
    assert.deepEqual(cardDeckSlugs(card("reflection"), cards), []);
    assert.deepEqual(cardDeckSlugs(card("baker"), cards), []);
  });

  test("il giorno più recente fra la scheda e i suoi mazzi, mai nel futuro né prima della lingua", () => {
    assert.equal(cardPageLastmod("2026-09-25", "en", ["2026-09-27"], "2026-09-30"), "2026-09-27");
    assert.equal(cardPageLastmod("2026-09-25", "en", ["2026-10-02"], "2026-09-30"), "2026-09-30");
    assert.equal(cardPageLastmod("2026-09-25", "it", [], "2026-09-30"), "2026-09-25");
    // lo spagnolo nasce il 25/09/2026: un mazzo di prima non sposta la data della scheda spagnola
    assert.equal(cardPageLastmod("2026-09-25", "es", ["2026-09-20"], "2026-09-30"), "2026-09-25");
  });
});

describe("carte generate: chi le genera", () => {
  test("la catena viene dai testi, non dal campo `related` di World of Origins", () => {
    // related dice Van Helsing, ma nel testo le gioca Van Helsing's Tools, che Van Helsing mette in mano
    for (const slug of ["garlic", "holy-water", "wooden-stake", "silver-bullet"]) assert.deepEqual(levels(creationChain(card(slug), cards)), [["Van Helsing's Tools"], ["Van Helsing"]], slug);
    // related dice Baby Bear, ma Mama Bear la aggiunge Papa Bear, che viene da Baby Bear
    assert.deepEqual(levels(creationChain(card("mama-bear"), cards)), [["Papa Bear"], ["Baby Bear"]]);
    assert.deepEqual(levels(creationChain(card("van-helsings-tools"), cards)), [["Van Helsing"]]);
  });

  test("fra più fonti, quelle nella demo; le altre si dicono a parte", () => {
    // related dà solo due carte rimosse; nel testo le zucche le mescola anche Old MacDonald, nella demo
    assert.deepEqual(levels(creationChain(card("pumpkin"), cards)), [["Old MacDonald"]]);
    assert.deepEqual(names(earlierCreators(card("pumpkin"), cards)).sort(), ["Headless Horseman", "Pumpkin Patch"]);
    assert.deepEqual(levels(creationChain(card("zombie"), cards)), [["Legion of the Dead"]]);
    assert.deepEqual(names(earlierCreators(card("zombie"), cards)), ["Necromancer"]);
  });

  test("nessun testo le nomina: niente catena (e dal 25/09/2026 nessun legame preso dal campo `related` dell'import)", () => {
    for (const slug of ["reflection", "off-with-your-head", "little-pig"]) {
      assert.deepEqual(creationChain(card(slug), cards), [], slug);
      assert.deepEqual(cardRelations(card(slug), cards), { createdBy: [], createdByEarlier: [], creates: [] }, slug);
    }
  });

  test("le carte non create non hanno catena; le carte create senza catena sono solo quelle che nessun testo nomina", () => {
    const orphans: string[] = [];
    for (const c of cards) {
      if (c.type !== "token") {
        assert.deepEqual(creationChain(c, cards), [], c.slug);
        continue;
      }
      if (!cardRelations(c, cards).createdBy.length) orphans.push(c.slug);
    }
    // Una carta creata nuova senza chi la genera va guardata: la sua scheda dirà "nessun testo di carta dice quale carta
    // la genera" e "non si può dire con certezza" se è nella demo.
    assert.deepEqual(orphans.sort(), ["little-pig", "off-with-your-head", "reflection"]);
  });

  test("le carte da cui passano i mazzi di una carta creata sono quelle della demo che si mettono nel mazzo", () => {
    assert.deepEqual(names(deckRoots(creationChain(card("garlic"), cards))), ["Van Helsing"]);
    assert.deepEqual(names(deckRoots(creationChain(card("mama-bear"), cards))), ["Baby Bear"]);
    assert.deepEqual(names(deckRoots(creationChain(card("broomstick"), cards))).sort(), ["Animate Object", "Sorcerer's Apprentice"]);
    assert.deepEqual(deckRoots(creationChain(card("reflection"), cards)), []);
  });
});

describe("carte generate: che cosa genera una carta", () => {
  test("in avanti, passaggio per passaggio", () => {
    assert.deepEqual(levels(createdChain(card("van-helsing"), cards)).map((l) => [...l].sort()), [["Van Helsing's Tools"], ["Garlic", "Holy Water", "Silver Bullet", "Wooden Stake"]]);
    assert.deepEqual(levels(createdChain(card("baby-bear"), cards)), [["Papa Bear"], ["Mama Bear"]]);
    assert.deepEqual(levels(createdChain(card("jekyll"), cards)), [["Hyde"]]);
  });

  test("anche dalle carte fuori dalla demo, che le carte create non contano fra chi le genera", () => {
    assert.deepEqual(names(namedTokens(card("headless-horseman"), cards)), ["Pumpkin"]);
    assert.deepEqual(names(namedTokens(card("necromancer"), cards)), ["Zombie"]);
  });

  test("un nome dentro un nome più lungo non conta: Three Not So Little Pigs genera Not So Little Pig, non Little Pig", () => {
    assert.deepEqual(names(namedTokens(card("three-not-so-little-pigs"), cards)), ["Not So Little Pig"]);
  });

  test("Hyde nomina Jekyll, ma Jekyll non è una carta creata: Hyde non genera niente", () => {
    assert.deepEqual(createdChain(card("hyde"), cards), []);
  });

  test("la catena in avanti è il rovescio di quella a ritroso", () => {
    for (const c of cards) for (const t of createdChain(c, cards)[0] ?? []) assert.ok(namedTokens(c, cards).includes(t), `${c.slug} → ${t.slug}`);
    for (const t of cards.filter((c) => c.type === "token")) for (const c of creationChain(t, cards)[0] ?? []) assert.ok(namedTokens(c, cards).includes(t), `${t.slug} ← ${c.slug}`);
  });
});

describe("legami solo dai testi (dal 25/09/2026)", () => {
  test("niente \"carte collegate\": i legami sono solo chi genera e che cosa genera", () => {
    // Merlin ↔ Merlin's Prophecy: nessun testo di carta spiega il legame, che veniva solo dal campo `related` dei dati
    // importati; senza la fonte nominata il legame non ha base e la scheda non lo mostra più
    assert.deepEqual(cardRelations(card("merlin"), cards), { createdBy: [], createdByEarlier: [], creates: [] });
    assert.deepEqual(cardRelations(card("merlins-prophecy"), cards), { createdBy: [], createdByEarlier: [], creates: [] });
    for (const c of cards) assert.deepEqual(Object.keys(cardRelations(c, cards)).sort(), ["createdBy", "createdByEarlier", "creates"], c.slug);
    // e le carte non portano più il campo `related`
    for (const c of cards) assert.equal("related" in c, false, c.slug);
  });
});
