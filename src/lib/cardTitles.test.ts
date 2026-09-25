/**
 * Test dei title e delle description delle schede carta, dei mazzi e delle guide ai mazzi (`cardTitles.ts`), e delle
 * date delle schede carta (`cardDates.ts`, le stesse della sitemap e del `dateModified`), con il
 * runner integrato di Node: `node --test src/lib/cardTitles.test.ts`. Come per gli altri test, gli import hanno
 * l'estensione `.ts`.
 *
 * Gira su TUTTE le carte del database, nelle tre lingue, e usa il codice vero del sito: il database di `cards.ts`
 * (con l'unione di woo-cards.json, card-lore.ts, card-history.ts e le patch uscite dopo l'import), `pageTitle` di
 * `page.ts`, le guide di `guides.ts` e le date di `cardDates.ts`. Quei moduli sono scritti per Next (import senza estensione, JSON senza
 * attributi, `next/navigation`), quindi prima di caricarli il test registra un piccolo hook di risoluzione dei moduli
 * di Node (`module.registerHooks`, Node ≥ 22.15): aggiunge `.ts` agli import relativi senza estensione, dichiara i
 * JSON e sostituisce `next/navigation`, di cui `page.ts` usa solo `notFound` (che qui non serve). Così, se cambiano
 * l'unione delle carte o `pageTitle`, il test lo vede.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  CARD_DESC_MAX,
  CARD_DESC_MIN,
  CARD_TITLE_MAX,
  DECK_TITLE_MAX,
  cardDescription,
  cardTitle,
  creatorsOf,
  deckLead,
  deckShortTail,
  deckTitle,
  textOutdated,
  type TextSource,
  type TitleCard,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./cardTitles.ts";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/navigation") return { url: "data:text/javascript,export function notFound(){throw new Error('notFound')}", shortCircuit: true };
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
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const pageModule: typeof import("./page") = await import("./page.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const guidesModule: typeof import("./content/guides") = await import("./content/guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const datesModule: typeof import("./cardDates") = await import("./cardDates.ts");
const { pageTitle } = pageModule;
const { cardDates, cardLastmod, cardTextSource: src, localizedTextsRead } = datesModule;

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const cards: readonly TitleCard[] = cardsModule.cards;

const card = (slug: string): TitleCard => {
  const c = cardsModule.getCard(slug);
  assert.ok(c, `carta assente dal database: ${slug}`);
  return c;
};

describe("database", () => {
  test("le carte ci sono tutte, di ogni tipo", () => {
    assert.ok(cards.length >= 200, `solo ${cards.length} carte`);
    assert.ok(cards.some((c) => c.legendary && c.status === "active"));
    assert.ok(cards.some((c) => !c.legendary && c.status === "active" && c.type !== "token"));
    assert.ok(cards.some((c) => c.type === "token"));
    assert.ok(cards.some((c) => c.status === "removed"));
  });
});

describe("cardTitle", () => {
  test("un modello per tipo, nelle tre lingue", () => {
    assert.equal(cardTitle(card("merlin"), "en"), "Merlin: Origins TCG Legendary card");
    assert.equal(cardTitle(card("merlin"), "it"), "Merlin: carta Leggendaria di Origins TCG");
    assert.equal(cardTitle(card("merlin"), "es"), "Merlin: carta Legendaria de Origins TCG");
    assert.equal(cardTitle(card("aladdin"), "en"), "Aladdin: Origins TCG card");
    assert.equal(cardTitle(card("aladdin"), "it"), "Aladdin: carta di Origins TCG");
    assert.equal(cardTitle(card("aladdin"), "es"), "Aladdin: carta de Origins TCG");
    assert.equal(cardTitle(card("garlic"), "en"), "Garlic: Origins TCG created card");
    assert.equal(cardTitle(card("garlic"), "it"), "Garlic: carta generata di Origins TCG");
    assert.equal(cardTitle(card("garlic"), "es"), "Garlic: carta creada de Origins TCG");
    assert.equal(cardTitle(card("baker"), "en"), "Baker: Origins TCG card, not in the demo");
    assert.equal(cardTitle(card("baker"), "it"), "Baker: carta di Origins TCG non nella demo");
    assert.equal(cardTitle(card("baker"), "es"), "Baker: carta de Origins TCG fuera de la demo");
    assert.equal(cardTitle(card("alice"), "en"), "Alice: Origins TCG Legendary, not in the demo");
    assert.equal(cardTitle(card("alice"), "it"), "Alice: Leggendaria di Origins TCG non nella demo");
    assert.equal(cardTitle(card("alice"), "es"), "Alice: Legendaria de Origins TCG fuera de la demo");
  });

  test("ogni carta, in ogni lingua: nome in testa, Origins TCG dentro, title finale entro 60 caratteri", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const locale of locales) {
        const title = cardTitle(c, locale);
        if (title.length > CARD_TITLE_MAX || !title.includes("Origins TCG") || !title.startsWith(`${c.name}: `) || pageTitle(title).length > 60) bad.push(`${locale} ${title} (${title.length})`);
      }
    assert.deepEqual(bad, []);
  });

  test("le tre lingue hanno tre title diversi, e in ogni lingua i title non si ripetono", () => {
    for (const c of cards) assert.equal(new Set(locales.map((l) => cardTitle(c, l))).size, 3, c.slug);
    for (const locale of locales) {
      const titles = cards.map((c) => cardTitle(c, locale));
      assert.equal(new Set(titles).size, titles.length, locale);
    }
  });
});

describe("creatorsOf", () => {
  const names = (slug: string) => creatorsOf(card(slug), cards).map((c) => c.name);
  test("dal testo della carta che la nomina, non dal campo `related` (che a volte salta un passaggio)", () => {
    assert.deepEqual(names("garlic"), ["Van Helsing's Tools"]);
    assert.deepEqual(names("mama-bear"), ["Papa Bear"]);
    assert.deepEqual(names("van-helsings-tools"), ["Van Helsing"]);
  });
  test("anche dal testo italiano o spagnolo: Silver Bullet in inglese è scritta \"Silver Bolt\"", () => {
    assert.deepEqual(names("silver-bullet"), ["Van Helsing's Tools"]);
  });
  test("al plurale, e fra più fonti solo quelle nella demo", () => {
    assert.deepEqual(names("pumpkin"), ["Old MacDonald"]);
    assert.deepEqual(names("zombie"), ["Legion of the Dead"]);
  });
  test("un nome dentro un nome più lungo non conta", () => {
    for (const c of creatorsOf(card("little-pig"), cards)) assert.notEqual(c.slug, "three-not-so-little-pigs");
  });
  test("se nessun testo la nomina, nessuno: le sole carte create senza chi le crea sono queste", () => {
    // Se il database cambia e questo elenco con lui, va ricontrollato a mano che cosa dicono i testi.
    const orphans = cards.filter((c) => c.type === "token" && !creatorsOf(c, cards).length).map((c) => c.slug);
    assert.deepEqual(orphans.sort(), ["little-pig", "off-with-your-head", "reflection"]);
    for (const c of cards) if (c.type !== "token") assert.equal(creatorsOf(c, cards).length, 0, c.slug);
  });
});

/** Parole vuote che non devono restare prima dei puntini (un campione per lingua). */
const danglers = /\s(?:a|an|the|of|to|your|il|la|di|del|della|nella|e|el|los|las|de|en|y|que)…$/i;

describe("cardDescription", () => {
  test("ogni carta, in ogni lingua: 120–158 caratteri, nome in testa, Origins TCG e Koin Games dentro", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const locale of locales) {
        const d = cardDescription(c, locale, cards, src);
        const tails = (d.match(/OriginsMeta/g) ?? []).length;
        if (d.length < CARD_DESC_MIN || d.length > CARD_DESC_MAX || !d.startsWith(c.name) || !d.includes("Origins TCG") || !d.includes("Koin Games") || /\s{2}/.test(d) || tails > 1)
          bad.push(`${locale} ${c.slug} (${d.length}): ${d}`);
      }
    assert.deepEqual(bad, []);
  });

  test("un testo tagliato non finisce con una parola vuota", () => {
    const bad: string[] = [];
    for (const c of cards)
      for (const locale of locales) {
        const d = cardDescription(c, locale, cards, src);
        if (danglers.test(d)) bad.push(`${locale} ${c.slug}: ${d}`);
      }
    assert.deepEqual(bad, []);
  });

  test("il testo della carta, quando ci sta intero, c'è anche se l'attacco arriva già a 120", () => {
    const d = cardDescription(card("hansel-and-gretel"), "en", cards, src);
    assert.ok(d.includes(card("hansel-and-gretel").ability?.en.split(/[.\n]/)[0] ?? "?"), d);
  });

  test("frase dai dati: tipo, allineamento, costo e statistiche", () => {
    assert.match(cardDescription(card("merlin"), "en", cards, src), /^Merlin, Neutral Legendary unit in Origins TCG by Koin Games: \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "it", cards, src), /^Merlin, unità Leggendaria Neutral di Origins TCG \(Koin Games\): \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "es", cards, src), /^Merlin, unidad Legendaria Neutral de Origins TCG \(Koin Games\): \d+ de maná, \d+\/\d+\. /);
    assert.match(cardDescription(card("legion-of-the-dead"), "es", cards, src), /^Legion of the Dead, hechizo Legendario /);
  });

  test("le carte create dicono chi le crea solo se un testo lo dice; le rimosse che non sono nella demo", () => {
    assert.match(cardDescription(card("garlic"), "en", cards, src), /card created by Van Helsing's Tools in Origins TCG/);
    assert.match(cardDescription(card("garlic"), "it", cards, src), /generata da Van Helsing's Tools/);
    assert.match(cardDescription(card("silver-bullet"), "es", cards, src), /creada por Van Helsing's Tools/);
    // Reflection: World of Origins la collega a Mulan, ma nessun testo di carta dice chi la crea
    for (const locale of locales) {
      const d = cardDescription(card("reflection"), locale, cards, src);
      assert.doesNotMatch(d, /created by|generata da|creada por/, d);
    }
    assert.match(cardDescription(card("alice"), "en", cards, src), /not in the demo/);
    assert.match(cardDescription(card("alice"), "it", cards, src), /non nella demo/);
    assert.match(cardDescription(card("alice"), "es", cards, src), /fuera de la demo/);
  });

  test("il nome precedente resta nella description", () => {
    const renamed = cards.find((c) => c.formerName);
    assert.ok(renamed);
    for (const locale of locales) assert.ok(cardDescription(renamed, locale, cards, src).includes(renamed.formerName ?? ""), locale);
  });

  test("un testo superato da una patch non si cita: Silver Bullet (danno da 3 a 1, poi anche le barriere)", () => {
    for (const locale of locales) {
      const d = cardDescription(card("silver-bullet"), locale, cards, src);
      assert.doesNotMatch(d, /\b3 (?:damage|danni|de daño)\b/, d);
      // restano gli altri pezzi: chi la crea e le statistiche
      assert.match(d, /Van Helsing's Tools/, d);
      assert.match(d, /^Silver Bullet, .*: 1 (?:de )?(?:mana|maná)\./, d);
    }
  });
});

describe("textOutdated", () => {
  test("oggi solo due carte create hanno il testo superato da una patch successiva all'import", () => {
    // Se l'elenco cambia, va ricontrollato a mano il testo delle carte nuove (e magari corretto in card-lore.ts).
    assert.deepEqual(cards.filter((c) => textOutdated(c, src)).map((c) => c.slug).sort(), ["silver-bullet", "wooden-stake"]);
  });
  test("le carte della collezione lette nel gioco dopo la patch citano il testo: Don Quixote", () => {
    // Don Quixote prende Difensore con la patch della demo del 21/09, ma il testo è quello letto nel gioco il 22/09
    assert.equal(textOutdated(card("don-quixote"), src), false);
    assert.match(cardDescription(card("don-quixote"), "en", cards, src), /Defender/);
  });
  test("conta la fonte del testo: la verifica sul gioco per la collezione, l'import per carte create e rimosse", () => {
    // Patch finte con gli id veri: importata la 0.6.2, verifica sul gioco fra la 0.6.2 e la 0.6.3
    const source: TextSource = { order: ["0.6.1", "0.6.2", "0.6.3"], dates: { "0.6.1": "2026-01-01", "0.6.2": "2026-02-01", "0.6.3": "2026-03-01" }, imported: "0.6.2", verified: "2026-02-15" };
    type History = TitleCard["history"];
    const note = { en: "", it: "", es: "" };
    const text = (patch: "0.6.2" | "0.6.3", kind: "buff" | "deck" = "buff"): History => [{ patch, kind, note }];
    const unit = (history: History) => ({ status: "active" as const, type: "unit" as const, history });
    const token = (history: History) => ({ status: "active" as const, type: "token" as const, history });
    assert.equal(textOutdated(unit(text("0.6.3")), source), true);
    assert.equal(textOutdated(unit(text("0.6.2")), source), false);
    assert.equal(textOutdated(token(text("0.6.3")), source), true);
    assert.equal(textOutdated(token(text("0.6.2")), source), false);
    assert.equal(textOutdated({ ...token(text("0.6.3")), status: "removed" }, source), true);
    // statistiche, allineamento e scambi nei mazzi non toccano il testo
    assert.equal(textOutdated(unit([{ patch: "0.6.3", kind: "nerf", from: { mana: 2 }, to: { mana: 3 }, note }]), source), false);
    assert.equal(textOutdated(unit([{ patch: "0.6.3", kind: "rework", alignment: { from: "good", to: "evil" }, note }]), source), false);
    assert.equal(textOutdated(token(text("0.6.3", "deck")), source), false);
    // una patch importata che non conosciamo: vincono i dati importati
    assert.equal(textOutdated(token(text("0.6.3")), { ...source, imported: "0.9.9" }), false);
  });
});

describe("cardDates", () => {
  test("i testi italiani e spagnoli letti nel gioco il 25/09 contano solo sulle schede in quelle lingue", () => {
    // Baker: carta rimossa senza patch, guide né fasce; cambia solo il suo testo italiano e spagnolo
    const baker = cardsModule.getCard("baker");
    assert.ok(baker);
    assert.equal(datesLatest(cardDates(baker, "it")), localizedTextsRead.it);
    assert.equal(datesLatest(cardDates(baker, "es")), localizedTextsRead.es);
    assert.equal(datesLatest(cardDates(baker, "en")), undefined);
  });
  test("scheda e sitemap danno lo stesso giorno: le guide lette una volta o passate dalla sitemap", () => {
    for (const c of cardsModule.cards)
      for (const locale of locales) assert.equal(cardLastmod(c, locale, "2026-12-31"), cardLastmod(c, locale, "2026-12-31", guidesModule.getGuides(locale)), `${locale} ${c.slug}`);
  });
});

/** Il giorno più recente di un elenco di date, come `latestDay` di lastmod.ts (qui basta il confronto fra stringhe). */
function datesLatest(dates: readonly (string | undefined)[]): string | undefined {
  return dates.filter((d): d is string => Boolean(d)).sort().at(-1);
}

describe("deckTitle", () => {
  test("nome del mazzo in testa, poi la Leggendaria, nelle tre lingue (mappa delle query, C34)", () => {
    assert.equal(deckTitle("Spellcast", "Merlin", "en"), "Spellcast, Merlin deck");
    assert.equal(deckTitle("Spellcast", "Merlin", "it"), "Spellcast, mazzo di Merlin");
    assert.equal(deckTitle("Spellcast", "Merlin", "es"), "Spellcast, mazo de Merlin");
    assert.equal(pageTitle(deckTitle("Healing Healsing", "Van Helsing", "en")), "Healing Healsing, Van Helsing deck · Origins TCG");
    assert.equal(pageTitle(deckTitle("Healing Healsing", "Van Helsing", "it")), "Healing Healsing, mazzo di Van Helsing · Origins TCG");
    assert.equal(pageTitle(deckTitle("Healing Healsing", "Van Helsing", "es")), "Healing Healsing, mazo de Van Helsing · Origins TCG");
  });
  test("un nome uguale alla Leggendaria o che la contiene non la ripete; senza Leggendaria resta il nome", () => {
    assert.equal(deckTitle("merlin", "Merlin", "en"), "Merlin deck");
    assert.equal(deckTitle("merlin", "Merlin", "it"), "Mazzo di Merlin");
    assert.equal(deckTitle("", "Merlin", "es"), "Mazo de Merlin");
    assert.equal(deckTitle("Dorothy Combo", "Dorothy", "en"), "Dorothy Combo deck");
    assert.equal(deckTitle("Dorothy Combo", "Dorothy", "it"), "Dorothy Combo, mazzo di Origins TCG");
    assert.equal(deckTitle("Dracula SUPER FUN", "Dracula", "es"), "Dracula SUPER FUN, mazo de Origins TCG");
    assert.equal(pageTitle(deckTitle("Dorothy Combo", "Dorothy", "it")), "Dorothy Combo, mazzo di Origins TCG · OriginsMeta");
    assert.equal(deckTitle("Merlinator", "Merlin", "en"), "Merlinator, Merlin deck");
    assert.equal(deckTitle("Buff", undefined, "it"), "Buff");
  });
  test("se il modello con la Leggendaria non ci sta, resta il solo nome", () => {
    for (const locale of locales) {
      assert.equal(deckTitle("The Trick-or-Treat Legion", "Legion of the Dead", locale), "The Trick-or-Treat Legion");
      assert.equal(deckTitle("3 Pigs Mid Range", "Three Not So Little Pigs", locale), "3 Pigs Mid Range");
    }
    assert.equal(deckTitle("Value Board", "Three Not So Little Pigs", "it"), "Value Board, mazzo di Three Not So Little Pigs");
    assert.equal(deckTitle("Zombie rush for the Crimson Cup finals", "Legion of the Dead", "en"), "Zombie rush for the Crimson Cup finals");
  });
  test("poi il nome accorciato a parola intera, senza parole vuote in fondo, anche sul trattino", () => {
    const t = deckTitle("3 Pigs Mid Range with extra bacon and a lot of words to read", "Three Not So Little Pigs", "it");
    assert.ok(t.startsWith("3 Pigs Mid Range with extra bacon"), t);
    assert.ok(t.endsWith("…") && !/ (?:and|a|of)…$/.test(t), t);
    assert.ok(t.length <= DECK_TITLE_MAX, t);
    assert.equal(deckTitle("The Trick-or-Treat Legion of Halloween and friends", "Legion of the Dead", "en"), "The Trick-or-Treat Legion of Halloween…");
    assert.equal(deckTitle("Trick-or-Treat-Halloween-Legion-Zombies-and-Pumpkins", "Three Not So Little Pigs", "es"), "Trick-or-Treat-Halloween-Legion-Zombies…");
  });
  test("con il modello lungo le tre lingue hanno tre title diversi", () => {
    for (const [name, legendary] of [["Spellcast", "Merlin"], ["Healing Healsing", "Van Helsing"], ["Dorothy Combo", "Dorothy"], ["Value Board", "Three Not So Little Pigs"]] as const) {
      const titles = locales.map((l) => deckTitle(name, legendary, l));
      assert.equal(new Set(titles).size, 3, titles.join(" | "));
    }
  });
  test("due mazzi diversi della stessa Leggendaria non hanno lo stesso title", () => {
    const names = ["Spellcast", "The Trick-or-Treat Legion", "Trick or Treat Zombies", "Legion of the Dead", "3 Pigs Mid Range", "Value Board", "Zombie rush for the Crimson Cup finals"];
    for (const l of ["Merlin", "Legion of the Dead", "Three Not So Little Pigs"])
      for (const locale of locales) {
        const titles = names.map((n) => deckTitle(n, l, locale));
        assert.equal(new Set(titles).size, titles.length, `${locale} ${l}: ${titles.join(" | ")}`);
      }
  });
  test("qualunque nome: title finale entro 60 caratteri, mai vuoto, e senza \"Origins TCG\" entro 46", () => {
    const names = ["A", "Spellcast", "The Trick-or-Treat Legion", "x".repeat(80), `${"word ".repeat(30)}end`, "Dracula SUPER FUN", "Just f***in em", "Move/Combo/Tempo/Value/Aggro/Control", "Dracula and the very long list of words that follows"];
    const legendaries = [undefined, "Merlin", "Dracula", "Three Not So Little Pigs", "Legion of the Dead", "A custom Legendary with a very very long name typed by hand"];
    for (const n of names)
      for (const l of legendaries)
        for (const locale of locales) {
          const t = deckTitle(n, l, locale);
          assert.ok(t.length > 0 && (t.includes("Origins TCG") || t.length <= DECK_TITLE_MAX), `${locale} "${t}"`);
          assert.ok(pageTitle(t).length <= 60, `${locale} "${pageTitle(t)}"`);
        }
  });
});

describe("guide ai mazzi e schede dei mazzi", () => {
  // Le guide che trattano un mazzo della community: la prima carta dei tag è la sua Leggendaria.
  const deckGuides = (locale: Locale) => guidesModule.getGuides(locale).filter((g) => g.tags?.communityDecks?.length);
  test("metaTitle della guida con la Leggendaria, title finale entro 60 caratteri, diverso da quello della scheda del mazzo", () => {
    // Non si controllano le parole della guida (le scrive guides.ts), solo che guida e scheda non si contendano il title
    for (const locale of locales) {
      const guides = deckGuides(locale);
      assert.ok(guides.length >= 6, locale);
      for (const g of guides) {
        const legendary = card(g.tags?.cards?.[0] ?? "");
        assert.ok(legendary.legendary, `${g.slug}: la prima carta dei tag non è una Leggendaria`);
        const meta = g.metaTitle ?? g.title;
        assert.ok(meta.includes(legendary.name), `${locale} ${g.slug}: ${meta}`);
        assert.ok(pageTitle(meta).length <= 60, `${locale} ${pageTitle(meta)} (${pageTitle(meta).length})`);
        const deck = g.tags?.communityDecks?.[0];
        assert.ok(deck);
        assert.notEqual(pageTitle(deckTitle(deck.name, legendary.name, locale)), pageTitle(meta), `${locale} ${g.slug}`);
      }
    }
  });
  test("i mazzi delle guide: nome in testa, nessun title ripetuto fra mazzi diversi", () => {
    for (const locale of locales) {
      const decks = new Map<string, { name: string; legendary: string }>();
      for (const g of deckGuides(locale)) {
        const legendary = card(g.tags?.cards?.[0] ?? "").name;
        // le guide di confronto citano più mazzi: la Leggendaria dei tag vale solo per il primo
        const deck = g.tags?.communityDecks?.[0];
        if (deck && !decks.has(deck.slug)) decks.set(deck.slug, { name: deck.name, legendary });
      }
      assert.ok(decks.size >= 5, locale);
      const titles = [...decks.values()].map(({ name, legendary }) => deckTitle(name, legendary, locale));
      for (const [i, { name }] of [...decks.values()].entries()) assert.ok(titles[i].startsWith(name), `${locale} ${titles[i]}`);
      assert.equal(new Set(titles).size, titles.length, `${locale}: ${titles.join(" | ")}`);
    }
  });
});

describe("deckLead", () => {
  test("Leggendaria, Origins TCG, autore e archetipo corto", () => {
    assert.equal(deckLead({ name: "Buff", legendary: "Robin Hood", author: "albeo", archetype: "Swarm / go wide" }, "en"), "Robin Hood deck for Origins TCG: Buff by albeo, Swarm archetype.");
    assert.equal(deckLead({ name: "Buff", legendary: "Robin Hood", author: "albeo", archetype: "Swarm / vai largo" }, "it"), "Mazzo di Robin Hood per Origins TCG: Buff di albeo, archetipo Swarm.");
    assert.equal(deckLead({ name: "Buff", legendary: "Robin Hood", author: "albeo", archetype: "Swarm / ir a lo ancho" }, "es"), "Mazo de Robin Hood para Origins TCG: Buff de albeo, arquetipo Swarm.");
    assert.equal(deckLead({ name: "Buff", author: "albeo", archetype: "Aggro" }, "en"), "Origins TCG deck: Buff by albeo, Aggro archetype.");
  });
  test("la coda corta c'è nelle tre lingue e dice OriginsMeta", () => {
    for (const locale of locales) assert.match(deckShortTail[locale], /OriginsMeta\.$/);
  });
});
