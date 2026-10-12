/**
 * Test dei template dei pannelli (panelLayout.ts, 0.4.1): posizioni di partenza come nei disegni di Pierluigi, limiti
 * della larghezza, template salvati sconosciuti.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { clampWidth, DEFAULT_CUSTOM, defaultSpot, panelShape, readCustom, readTemplate, WIDTH_LIMITS } from "./panelLayout";
import { PANEL_TEMPLATES } from "../shared/types";

const FULL_HD = { x: 0, y: 0, width: 1920, height: 1080 };

describe("template dei pannelli", () => {
  test("fasce: il mio mazzo in basso a sinistra (cresce verso l'alto), l'avversario in alto a destra fino al bordo", () => {
    const me = defaultSpot("strips", "deck", FULL_HD);
    const opp = defaultSpot("strips", "opp", FULL_HD);
    assert.deepEqual(me, { x: 0, y: 1080, width: 603, fromBottom: true });
    assert.deepEqual(opp, { x: 1291, y: 0, width: 629, fromBottom: false });
    assert.equal(opp.x + opp.width, 1920);
    // la mia mano (dal 31,5% della larghezza) resta libera
    assert.ok(me.x + me.width <= 1920 * 0.315);
  });

  test("colonne ai lati: il mio mazzo sul bordo sinistro, l'avversario sul bordo destro sopra il pannello del mana", () => {
    const me = defaultSpot("columns", "deck", FULL_HD);
    const opp = defaultSpot("columns", "opp", FULL_HD);
    assert.deepEqual(me, { x: 0, y: 171, width: 276, fromBottom: false });
    assert.deepEqual(opp, { x: 1620, y: 311, width: 290, fromBottom: false });
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
      for (const k of ["deck", "opp"] as const) {
        assert.equal(clampWidth(t, k, 10), WIDTH_LIMITS[panelShape(t, k)].min);
        assert.equal(clampWidth(t, k, 99_999), WIDTH_LIMITS[panelShape(t, k)].max);
      }
    }
    assert.equal(defaultSpot("strips", "deck", { x: 0, y: 0, width: 800, height: 600 }).width, WIDTH_LIMITS.strips.min);
  });

  test("template salvato sconosciuto o rotto: classico", () => {
    assert.equal(readTemplate("strips"), "strips");
    assert.equal(readTemplate("columns"), "columns");
    assert.equal(readTemplate("custom"), "custom");
    for (const bad of [undefined, null, "", "Strips", 3, {}]) assert.equal(readTemplate(bad), "classic");
  });

  test("classico (13/10/2026): il mio mazzo come nelle Colonne, l'avversario come nelle Fasce", () => {
    assert.equal(panelShape("classic", "deck"), "columns");
    assert.equal(panelShape("classic", "opp"), "strips");
    // posizioni dallo screenshot di Pierluigi del 13/10: il mio mazzo sul bordo sinistro a un terzo dell'altezza,
    // l'avversario in alto a destra fino al bordo
    assert.deepEqual(defaultSpot("classic", "deck", FULL_HD), { x: 0, y: 342, width: 272, fromBottom: false });
    assert.deepEqual(defaultSpot("classic", "opp", FULL_HD), { x: 1299, y: 0, width: 621, fromBottom: false });
    assert.equal(panelShape("strips", "deck"), "strips");
  });

  test("personalizzato: parte dove partono le colonne", () => {
    assert.deepEqual(defaultSpot("custom", "deck", FULL_HD), defaultSpot("columns", "deck", FULL_HD));
    assert.deepEqual(defaultSpot("custom", "opp", FULL_HD), defaultSpot("columns", "opp", FULL_HD));
  });

  test("opzioni del personalizzato: valori sbagliati o mancanti tornano quelli di partenza, numeri nei limiti", () => {
    assert.deepEqual(readCustom(undefined), DEFAULT_CUSTOM);
    assert.deepEqual(readCustom("rotto"), DEFAULT_CUSTOM);
    const c = readCustom({ orientation: "diagonal", cards: "names", perRow: 40, opacity: -5, hideOut: "sì", me: { life: false }, opp: null });
    assert.equal(c.orientation, DEFAULT_CUSTOM.orientation);
    assert.equal(c.cards, "names");
    assert.equal(c.perRow, 13);
    assert.equal(c.opacity, 0);
    assert.equal(c.hideOut, DEFAULT_CUSTOM.hideOut);
    assert.deepEqual(c.me, { ...DEFAULT_CUSTOM.me, life: false });
    assert.deepEqual(c.opp, DEFAULT_CUSTOM.opp);
    assert.equal(readCustom({ perRow: 2.6 }).perRow, 3);
    assert.equal(readCustom({ perRow: Number.NaN }).perRow, DEFAULT_CUSTOM.perRow);
  });

  test("opzioni del personalizzato: un cambio parziale tocca solo il suo campo", () => {
    const now = readCustom({ cards: "names", perRow: 13, opacity: 40, opp: { mana: false } });
    const next = readCustom({ opacity: 70 }, now);
    assert.deepEqual(next, { ...now, opacity: 70 });
    assert.deepEqual(readCustom({ me: { deckLeft: false } }, now).me, { ...now.me, deckLeft: false });
    assert.equal(readCustom({ me: { deckLeft: false } }, now).opp.mana, false);
  });
});
