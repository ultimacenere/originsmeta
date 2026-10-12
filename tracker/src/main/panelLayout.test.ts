/**
 * Test dei template dei pannelli (panelLayout.ts, 0.4.1): posizioni di partenza come nei disegni di Pierluigi, limiti
 * della larghezza, template salvati sconosciuti.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { clampWidth, defaultSpot, readTemplate, WIDTH_LIMITS } from "./panelLayout";
import { PANEL_TEMPLATES } from "../shared/types";

const FULL_HD = { x: 0, y: 0, width: 1920, height: 1080 };

describe("template dei pannelli", () => {
  test("fasce in alto: sul bordo alto, il mio mazzo a sinistra della mano dell'avversario, il suo a destra", () => {
    const me = defaultSpot("strips", "deck", FULL_HD);
    const opp = defaultSpot("strips", "opp", FULL_HD);
    assert.deepEqual(me, { x: 216, y: 0, width: 568 });
    assert.deepEqual(opp, { x: 1198, y: 0, width: 586 });
    // la mano coperta dell'avversario (dal 31,5% al 62% dei disegni) resta libera
    assert.ok(me.x + me.width < 1920 * 0.42 && opp.x > 1920 * 0.62);
  });

  test("colonne ai lati: il mio mazzo sul bordo sinistro, l'avversario sul bordo destro sopra il pannello del mana", () => {
    const me = defaultSpot("columns", "deck", FULL_HD);
    const opp = defaultSpot("columns", "opp", FULL_HD);
    assert.deepEqual(me, { x: 0, y: 171, width: 276 });
    assert.deepEqual(opp, { x: 1620, y: 311, width: 290 });
    assert.ok(opp.x + opp.width <= 1920);
  });

  test("secondo schermo: le posizioni partono dal suo angolo", () => {
    const right = { x: 1920, y: 0, width: 2560, height: 1440 };
    const me = defaultSpot("columns", "deck", right);
    assert.equal(me.x, 1920);
    assert.equal(me.y, Math.round(1440 * 0.158));
  });

  test("larghezza: mai fuori dai limiti del template, anche su schermi piccoli o enormi", () => {
    for (const t of PANEL_TEMPLATES) {
      assert.equal(clampWidth(t, 10), WIDTH_LIMITS[t].min);
      assert.equal(clampWidth(t, 99_999), WIDTH_LIMITS[t].max);
    }
    assert.equal(defaultSpot("strips", "deck", { x: 0, y: 0, width: 800, height: 600 }).width, WIDTH_LIMITS.strips.min);
  });

  test("template salvato sconosciuto o rotto: classico", () => {
    assert.equal(readTemplate("strips"), "strips");
    assert.equal(readTemplate("columns"), "columns");
    for (const bad of [undefined, null, "", "Strips", 3, {}]) assert.equal(readTemplate(bad), "classic");
  });
});
