/**
 * Test dei title e delle description delle schede carta e dei mazzi (`cardTitles.ts`) con il runner integrato di Node:
 * `node --test src/lib/cardTitles.test.ts`. Come per gli altri test, gli import hanno l'estensione `.ts`.
 *
 * Gira su TUTTE le carte del database, nelle tre lingue. `cards.ts` non si importa in Node (importa un JSON senza
 * attributi e moduli senza estensione), quindi le carte si ricompongono qui dalle stesse tre sorgenti e nello stesso
 * modo: `woo-cards.json`, `card-lore.ts` (testo ufficiale e origine) e `card-history.ts` (le patch uscite dopo
 * l'import si applicano sopra, come fa `cards.ts`; l'ordine delle patch si legge da `cards.ts`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CARD_DESC_MAX,
  CARD_DESC_MIN,
  CARD_TITLE_MAX,
  DECK_TITLE_MAX,
  cardDescription,
  cardTitle,
  creatorsOf,
  deckLead,
  deckTitle,
  type TitleCard,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./cardTitles.ts";
import {
  cardLore,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./data/card-lore.ts";
import {
  cardHistory,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./data/card-history.ts";

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];

type WooCard = {
  slug: string;
  name: string;
  formerName?: string;
  type: "unit" | "spell" | "token";
  legendary: boolean;
  status: "active" | "removed";
  mana?: number;
  power?: number;
  health?: number;
  alignment?: "good" | "evil" | "neutral";
  ability?: string;
  related?: string[];
};
type Lore = { en?: string; it?: string; es?: string; origin?: { en: string; it: string; es: string } };
type Change = { patch: string; to?: { mana?: number; power?: number; health?: number }; alignment?: { to: "good" | "evil" | "neutral" } };

const woo = JSON.parse(readFileSync(new URL("./data/woo-cards.json", import.meta.url), "utf8")) as { patch: string; cards: WooCard[] };
const cardsSource = readFileSync(new URL("./data/cards.ts", import.meta.url), "utf8");
const patchOrder = JSON.parse(`[${/export const patchOrder = \[([^\]]*)\]/.exec(cardsSource)?.[1] ?? ""}]`) as string[];
const importedIndex = patchOrder.indexOf(woo.patch.replace(/^.*:v/, ""));
const lore = cardLore as Record<string, Lore>;
const history = cardHistory as Record<string, Change[]>;

const cards: TitleCard[] = woo.cards.map((w) => {
  const l = lore[w.slug];
  const card: TitleCard = { slug: w.slug, name: w.name, type: w.type, status: w.status };
  if (w.formerName) card.formerName = w.formerName;
  if (w.legendary) card.legendary = true;
  if (w.mana !== undefined) card.mana = w.mana;
  if (w.power !== undefined) card.power = w.power;
  if (w.health !== undefined) card.health = w.health;
  if (w.alignment) card.alignment = w.alignment;
  for (const ch of history[w.slug] ?? []) {
    if (!(importedIndex >= 0 && patchOrder.indexOf(ch.patch) > importedIndex)) continue;
    if (ch.to?.mana !== undefined) card.mana = ch.to.mana;
    if (ch.to?.power !== undefined) card.power = ch.to.power;
    if (ch.to?.health !== undefined) card.health = ch.to.health;
    if (ch.alignment) card.alignment = ch.alignment.to;
  }
  const en = l?.en ?? w.ability;
  if (en) card.ability = { en, it: l?.it ?? en, es: l?.es ?? en };
  if (l?.origin) card.origin = l.origin;
  if (w.related?.length) card.related = w.related;
  return card;
});
const bySlug = new Map(cards.map((c) => [c.slug, c]));
const card = (slug: string): TitleCard => {
  const c = bySlug.get(slug);
  assert.ok(c, `carta assente dal database: ${slug}`);
  return c;
};

/** Replica di `pageTitle` (src/lib/page.ts), che importa Next e non si carica in Node: serve ai title dei mazzi. */
function pageTitle(title: string): string {
  const withKeyword = /origins tcg|originsmeta/i.test(title) ? title : `${title} · Origins TCG`;
  if (/originsmeta/i.test(withKeyword)) return withKeyword;
  const withBrand = `${withKeyword} · OriginsMeta`;
  return withBrand.length <= 60 ? withBrand : withKeyword;
}

describe("database", () => {
  test("le carte ci sono tutte, di ogni tipo", () => {
    assert.ok(cards.length >= 200, `solo ${cards.length} carte`);
    assert.ok(cards.some((c) => c.legendary && c.status === "active"));
    assert.ok(cards.some((c) => !c.legendary && c.status === "active" && c.type !== "token"));
    assert.ok(cards.some((c) => c.type === "token"));
    assert.ok(cards.some((c) => c.status === "removed"));
    assert.ok(patchOrder.length >= 4, "ordine delle patch non letto da cards.ts");
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

  test("ogni carta, in ogni lingua: nome in testa, Origins TCG dentro, entro 60 caratteri", () => {
    // Un title che contiene "Origins TCG" `pageTitle` lo lascia com'è (aggiunge " · OriginsMeta" solo entro i 60):
    // se sta nei 60 da solo, sta nei 60 anche il title finale.
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
  test("dal testo della carta che la nomina, anche quando `related` salta un passaggio", () => {
    assert.deepEqual(names("garlic"), ["Van Helsing's Tools"]);
    assert.deepEqual(names("mama-bear"), ["Papa Bear"]);
    assert.deepEqual(names("van-helsings-tools"), ["Van Helsing"]);
  });
  test("al plurale, e fra più fonti solo quelle nella demo", () => {
    assert.deepEqual(names("pumpkin"), ["Old MacDonald"]);
    assert.deepEqual(names("zombie"), ["Legion of the Dead"]);
  });
  test("un nome dentro un nome più lungo non conta", () => {
    for (const c of creatorsOf(card("little-pig"), cards)) assert.notEqual(c.slug, "not-so-little-pig");
  });
  test("senza testo che la nomini, vale `related`", () => {
    assert.ok(creatorsOf(card("silver-bullet"), cards).length > 0);
  });
  test("ogni carta creata ha chi la crea; le altre carte no", () => {
    for (const c of cards) {
      const found = creatorsOf(c, cards);
      if (c.type === "token") assert.ok(found.length > 0, c.slug);
      else assert.equal(found.length, 0, c.slug);
    }
  });
});

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

  test("frase dai dati: tipo, allineamento, costo e statistiche", () => {
    assert.match(cardDescription(card("merlin"), "en", cards), /^Merlin, Neutral Legendary unit in Origins TCG by Koin Games: \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "it", cards), /^Merlin, unità Leggendaria Neutral di Origins TCG \(Koin Games\): \d+ mana, \d+\/\d+\. /);
    assert.match(cardDescription(card("merlin"), "es", cards), /^Merlin, unidad Legendaria Neutral de Origins TCG \(Koin Games\): \d+ de maná, \d+\/\d+\. /);
    assert.match(cardDescription(card("legion-of-the-dead"), "es", cards), /^Legion of the Dead, hechizo Legendario /);
  });

  test("le carte create dicono chi le crea, le rimosse che non sono nella demo", () => {
    assert.match(cardDescription(card("garlic"), "en", cards), /card created by Van Helsing's Tools in Origins TCG/);
    assert.match(cardDescription(card("garlic"), "it", cards), /creata da Van Helsing's Tools/);
    assert.match(cardDescription(card("garlic"), "es", cards), /creada por Van Helsing's Tools/);
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
  test("un mazzo che si chiama come la Leggendaria non la ripete; senza Leggendaria resta il nome", () => {
    assert.equal(deckTitle("merlin", "Merlin", "en"), "Merlin deck");
    assert.equal(deckTitle("Buff", undefined, "it"), "Buff");
  });
  test("il nome lungo si accorcia a parola intera, la Leggendaria resta", () => {
    const t = deckTitle("3 Pigs Mid Range with extra bacon and a lot of words", "Three Not So Little Pigs", "it");
    assert.ok(t.startsWith("Mazzo di Three Not So Little Pigs: "), t);
    assert.ok(t.endsWith("…"), t);
    assert.ok(t.length <= DECK_TITLE_MAX, t);
    assert.equal(deckTitle("The Trick-or-Treat Legion", "Legion of the Dead", "en"), "Legion of the Dead deck: The Trick-or-Treat…");
  });
  test("mai un nome spezzato a metà parola: se non ci sta abbastanza, resta la Leggendaria", () => {
    assert.equal(deckTitle("The Trick-or-Treat Legion", "Legion of the Dead", "it"), "Mazzo di Legion of the Dead");
    assert.equal(deckTitle("The Trick-or-Treat Legion", "Legion of the Dead", "es"), "Mazo de Legion of the Dead");
  });
  test("qualunque nome: title finale entro 60 caratteri", () => {
    const names = ["A", "Spellcast", "The Trick-or-Treat Legion", "x".repeat(80), `${"word ".repeat(30)}end`, "Dracula SUPER FUN", "Just f***in em"];
    const legendaries = [undefined, "Merlin", "Three Not So Little Pigs", "Legion of the Dead", "A custom Legendary with a very very long name typed by hand"];
    for (const n of names)
      for (const l of legendaries)
        for (const locale of locales) {
          const t = deckTitle(n, l, locale);
          assert.ok(t.length > 0 && t.length <= DECK_TITLE_MAX, `${locale} "${t}"`);
          assert.ok(pageTitle(t).length <= 60, `${locale} "${pageTitle(t)}"`);
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
});
