/**
 * Test di panelVisibility.ts (16/10/2026): i pannelli che "scompaiono" tornano da soli, senza togliere e rimettere la
 * spunta.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { layerAction } from "./panelVisibility";

const shown = { visible: true, minimized: false, focused: false, busy: false };

describe("finestre sopra il gioco", () => {
  test("minimizzata ma per Electron ancora visibile: si rimostra", () => {
    assert.equal(layerAction(true, { ...shown, minimized: true }), "show");
  });

  test("nascosta e voluta: si mostra", () => {
    assert.equal(layerAction(true, { ...shown, visible: false }), "show");
  });

  test("visibile: si riporta in primo piano, perché il gioco può averla coperta", () => {
    assert.equal(layerAction(true, shown), "raise");
  });

  test("mai mentre il giocatore la usa o la allarga", () => {
    assert.equal(layerAction(true, { ...shown, focused: true }), null);
    assert.equal(layerAction(true, { ...shown, busy: true }), null);
  });

  test("fuori partita con l'opzione accesa: si nasconde, anche minimizzata", () => {
    assert.equal(layerAction(false, shown), "hide");
    assert.equal(layerAction(false, { ...shown, minimized: true }), "hide");
    assert.equal(layerAction(false, { ...shown, visible: false }), null);
  });
});
