/**
 * Test delle funzioni sulle modifiche di bilanciamento di `linkLabels.ts` (etichetta, dettaglio e attacco del blocco
 * della patch nelle news) con il runner integrato di Node: `node --test src/lib/linkLabels.test.ts`.
 * Usa lo storico vero (`card-history.ts`, che importa solo tipi): la 0.6.1 ha 1 carta cambiata (Huntsman) e 7 carte
 * negli scambi dei mazzi preimpostati del playtest (modifiche di tipo "deck"), che non sono rework.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { changeDetail, changeLabel, linkLabels, patchIntro } from "./linkLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { cardHistory } from "./data/card-history.ts";
import type { Change } from "./data/cards";

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const common = { buff: "Buff", nerf: "Nerf", rework: "Rework" };

/** Le modifiche di una patch come le dà `patchChanges` (carta e modifica), prese dallo storico. */
function itemsOf(patch: string): { card: { slug: string }; change: Change }[] {
  return Object.entries(cardHistory as Record<string, Change[]>).flatMap(([slug, history]) => history.filter((ch) => ch.patch === patch).map((change) => ({ card: { slug }, change })));
}

describe("changeLabel", () => {
  test("gli scambi nei mazzi hanno la loro etichetta nelle tre lingue, gli altri quella del dizionario", () => {
    assert.equal(changeLabel("deck", "en", common), "Deck change");
    assert.equal(changeLabel("deck", "it", common), "Cambio di mazzo");
    assert.equal(changeLabel("deck", "es", common), "Cambio de mazo");
    for (const locale of locales) {
      assert.equal(changeLabel("rework", locale, common), "Rework");
      assert.equal(changeLabel("buff", locale, common), "Buff");
      assert.equal(changeLabel("nerf", locale, common), "Nerf");
    }
  });
});

describe("changeDetail", () => {
  test("scambio nel mazzo: niente dettaglio, solo la nota (mai \"abilità\")", () => {
    for (const { change } of itemsOf("0.6.1").filter((m) => m.change.kind === "deck")) assert.equal(changeDetail(change), "none");
  });
  test("statistiche, allineamento, testo", () => {
    assert.equal(changeDetail({ kind: "rework", from: { mana: 4 }, to: { mana: 6 } }), "stats");
    assert.equal(changeDetail({ kind: "rework", alignment: { from: "neutral", to: "evil" } }), "alignment");
    assert.equal(changeDetail({ kind: "buff" }), "text");
  });
});

describe("patchIntro", () => {
  test("0.6.1: 1 carta cambiata e 7 negli scambi dei mazzi, contate a parte, nelle tre lingue", () => {
    const items = itemsOf("0.6.1");
    assert.equal(items.length, 8);
    assert.equal(
      patchIntro(items, "en"),
      "1 card changes in this patch. 7 cards are involved in the swaps in the playtest's preset decks. Each name opens the card page with its full balance history.",
    );
    assert.equal(
      patchIntro(items, "it"),
      "In questa patch cambia 1 carta. 7 carte sono coinvolte negli scambi dei mazzi preimpostati del playtest. Ogni nome apre la scheda della carta con tutto il suo storico dei bilanciamenti.",
    );
    assert.equal(
      patchIntro(items, "es"),
      "En este parche cambia 1 carta. 7 cartas participan en los intercambios de los mazos predefinidos del playtest. Cada nombre abre la página de la carta con todo su historial de cambios de equilibrio.",
    );
  });
  test("senza scambi resta la sola frase delle carte cambiate; una carta con due modifiche conta una volta", () => {
    const card = { slug: "x" };
    const items = [
      { card, change: { kind: "nerf" as const } },
      { card, change: { kind: "rework" as const } },
    ];
    assert.equal(patchIntro(items, "it"), `${linkLabels.it.patch.introOne} ${linkLabels.it.patch.linksOne}`);
    const many = itemsOf("demo-0921");
    assert.ok(many.length > 1);
    assert.doesNotMatch(patchIntro(many, "en"), /swaps/);
  });
  test("solo scambi: niente frase sulle carte cambiate", () => {
    const items = [{ card: { slug: "a" }, change: { kind: "deck" as const } }];
    for (const locale of locales) assert.equal(patchIntro(items, locale), `${linkLabels[locale].patch.swapsOne} ${linkLabels[locale].patch.linksOne}`);
  });
});
