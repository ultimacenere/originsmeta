/**
 * Test dei title e delle description delle schede carta, dei mazzi e delle guide ai mazzi (`cardTitles.ts`) con il
 * runner integrato di Node: `node --test src/lib/cardTitles.test.ts`. Come per gli altri test, gli import hanno
 * l'estensione `.ts`.
 *
 * Gira su TUTTE le carte del database, nelle tre lingue, e usa il codice vero del sito: il database di `cards.ts`
 * (con l'unione di woo-cards.json, card-lore.ts, card-history.ts e le patch uscite dopo l'import), `pageTitle` di
 * `page.ts` e le guide di `guides.ts`. Quei moduli sono scritti per Next (import senza estensione, JSON senza
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
const { pageTitle } = pageModule;

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
    assert.equal(cardTitle(card("garlic"), "it"), "Garlic: carta creata di Origins TCG");
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
        const d = cardDescription(c, locale, cards);
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
        const d = cardDescription(c, locale, cards);
        if (danglers.test(d)) bad.push(`${locale} ${c.slug}: ${d}`);
      }
    assert.deepEqual(bad, []);
  });

  test("il testo della carta, quando ci sta intero, c'è anche se l'attacco arriva già a 120", () => {
    const d = cardDescription(card("hansel-and-gretel"), "en", cards);
    assert.ok(d.includes(card("hansel-and-gretel").ability?.en.split(/[.\n]/)[0] ?? "?"), d);
  });

  test("frase dai dati: tipo, allineamento, costo e statistiche", () => {
    assert.match(cardDescription(card("merlin"), "en", cards), /^Merlin, Neutral Legendary unit in Origins TCG by Koin Games: \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "it", cards), /^Merlin, unità Leggendaria Neutral di Origins TCG \(Koin Games\): \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "es", cards), /^Merlin, unidad Legendaria Neutral de Origins TCG \(Koin Games\): \d+ de maná, \d+\/\d+\. /);
    assert.match(cardDescription(card("legion-of-the-dead"), "es", cards), /^Legion of the Dead, hechizo Legendario /);
  });

  test("le carte create dicono chi le crea solo se un testo lo dice; le rimosse che non sono nella demo", () => {
    assert.match(cardDescription(card("garlic"), "en", cards), /card created by Van Helsing's Tools in Origins TCG/);
    assert.match(cardDescription(card("garlic"), "it", cards), /creata da Van Helsing's Tools/);
    assert.match(cardDescription(card("silver-bullet"), "es", cards), /creada por Van Helsing's Tools/);
    // Reflection: World of Origins la collega a Mulan, ma nessun testo di carta dice chi la crea
    for (const locale of locales) {
      const d = cardDescription(card("reflection"), locale, cards);
      assert.doesNotMatch(d, /created by|creata da|creada por/, d);
    }
    assert.match(cardDescription(card("alice"), "en", cards), /not in the demo/);
    assert.match(cardDescription(card("alice"), "it", cards), /non nella demo/);
    assert.match(cardDescription(card("alice"), "es", cards), /fuera de la demo/);
  });

  test("il nome precedente resta nella description", () => {
    const renamed = cards.find((c) => c.formerName);
    assert.ok(renamed);
    for (const locale of locales) assert.ok(cardDescription(renamed, locale, cards).includes(renamed.formerName ?? ""), locale);
  });
});

describe("deckTitle", () => {
  test("Leggendaria in testa, nelle tre lingue", () => {
    assert.equal(deckTitle("Spellcast", "Merlin", "en"), "Merlin deck: Spellcast");
    assert.equal(deckTitle("Spellcast", "Merlin", "it"), "Mazzo di Merlin: Spellcast");
    assert.equal(deckTitle("Spellcast", "Merlin", "es"), "Mazo de Merlin: Spellcast");
    assert.equal(pageTitle(deckTitle("Healing Healsing", "Van Helsing", "en")), "Van Helsing deck: Healing Healsing · Origins TCG");
  });
  test("un nome uguale alla Leggendaria o che la contiene non la ripete; senza Leggendaria resta il nome", () => {
    assert.equal(deckTitle("merlin", "Merlin", "en"), "Merlin deck");
    assert.equal(deckTitle("Dorothy Combo", "Dorothy", "en"), "Dorothy Combo deck");
    assert.equal(deckTitle("Dorothy Combo", "Dorothy", "it"), "Mazzo Dorothy Combo");
    assert.equal(deckTitle("Dracula SUPER FUN", "Dracula", "es"), "Mazo Dracula SUPER FUN");
    assert.equal(deckTitle("Merlinator", "Merlin", "en"), "Merlin deck: Merlinator");
    assert.equal(deckTitle("Buff", undefined, "it"), "Buff");
  });
  test("se il modello lungo non ci sta, prima la forma compatta con i due nomi interi", () => {
    for (const locale of locales) {
      assert.equal(deckTitle("The Trick-or-Treat Legion", "Legion of the Dead", locale), "Legion of the Dead: The Trick-or-Treat Legion");
      assert.equal(deckTitle("3 Pigs Mid Range", "Three Not So Little Pigs", locale), "Three Not So Little Pigs: 3 Pigs Mid Range");
    }
    assert.equal(deckTitle("Value Board", "Three Not So Little Pigs", "it"), "Mazzo di Three Not So Little Pigs: Value Board");
  });
  test("poi il nome accorciato a parola intera: la Leggendaria e la prima parola del nome restano", () => {
    const t = deckTitle("3 Pigs Mid Range with extra bacon and a lot of words", "Three Not So Little Pigs", "it");
    assert.ok(t.startsWith("Three Not So Little Pigs: 3 Pigs"), t);
    assert.ok(t.endsWith("…"), t);
    assert.ok(t.length <= DECK_TITLE_MAX, t);
    assert.equal(deckTitle("The Trick-or-Treat Legion of Halloween", "Legion of the Dead", "en"), "Legion of the Dead: The Trick-or-Treat Legion…");
    // Senza parole vuote in fondo, e con il taglio anche sul trattino
    assert.equal(deckTitle("Zombie rush for the Crimson Cup finals", "Legion of the Dead", "it"), "Legion of the Dead: Zombie rush…");
    assert.equal(deckTitle("Trick-or-Treat-Halloween-Legion-Zombies", "Three Not So Little Pigs", "es"), "Three Not So Little Pigs: Trick-or-Treat…");
  });
  test("due mazzi diversi della stessa Leggendaria non hanno lo stesso title", () => {
    const names = ["Spellcast", "The Trick-or-Treat Legion", "Trick or Treat Zombies", "Legion of the Dead", "3 Pigs Mid Range", "Value Board", "Zombie rush for the Crimson Cup finals"];
    for (const l of ["Merlin", "Legion of the Dead", "Three Not So Little Pigs"])
      for (const locale of locales) {
        const titles = names.map((n) => deckTitle(n, l, locale));
        assert.equal(new Set(titles).size, titles.length, `${locale} ${l}: ${titles.join(" | ")}`);
      }
  });
  test("qualunque nome: title finale entro 60 caratteri, mai vuoto", () => {
    const names = ["A", "Spellcast", "The Trick-or-Treat Legion", "x".repeat(80), `${"word ".repeat(30)}end`, "Dracula SUPER FUN", "Just f***in em", "Move/Combo/Tempo/Value/Aggro/Control"];
    const legendaries = [undefined, "Merlin", "Dracula", "Three Not So Little Pigs", "Legion of the Dead", "A custom Legendary with a very very long name typed by hand"];
    for (const n of names)
      for (const l of legendaries)
        for (const locale of locales) {
          const t = deckTitle(n, l, locale);
          assert.ok(t.length > 0 && t.length <= DECK_TITLE_MAX, `${locale} "${t}"`);
          assert.ok(pageTitle(t).length <= 60, `${locale} "${pageTitle(t)}"`);
        }
  });
});

describe("guide ai mazzi", () => {
  // Le guide che trattano un mazzo della community: la prima carta dei tag è la sua Leggendaria.
  const deckGuides = (locale: Locale) => guidesModule.getGuides(locale).filter((g) => g.tags?.communityDecks?.length);
  test("metaTitle con la Leggendaria, title finale entro 60 caratteri, diverso da quello della scheda del mazzo", () => {
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
        assert.notEqual(deckTitle(deck.name, legendary.name, locale), meta, `${locale} ${g.slug}`);
      }
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
