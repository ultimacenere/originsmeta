/**
 * Test dell'avvio automatico (startup.ts, 16/10/2026): con il gioco di default, gioco riconosciuto da `tasklist`. Dalla
 * 0.4.9 (22/10/2026) solo "con il gioco" o "mai": il vecchio "Con Windows" diventa "con il gioco".
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { gameRunning, initialStartMode, loginItemFix, readStartMode, START_MODES, startArgs, WAIT_GAME_ARG } from "./startup";

const EXE = "C:\\Users\\x\\OriginsMeta Tracker\\OriginsMeta Tracker.exe";

describe("avvio automatico", () => {
  test("argomenti: la voce di avvio aspetta sempre il gioco, nascosta", () => {
    assert.deepEqual(startArgs(), ["--hidden", WAIT_GAME_ARG]);
  });

  test("scelte: solo con il gioco o mai, niente avvio con Windows", () => {
    assert.deepEqual([...START_MODES], ["game", "off"]);
  });

  test("primo avvio: con il gioco di default, anche chi aveva Avvia con Windows; chi l'aveva disattivato resta spento", () => {
    assert.equal(initialStartMode([]), "game");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden"], enabled: true }]), "game");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden"] }]), "game");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden"], enabled: false }]), "off");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden", WAIT_GAME_ARG] }]), "game");
  });

  test("scelta salvata: la vecchia \"windows\" vale con il gioco", () => {
    assert.equal(readStartMode("game"), "game");
    assert.equal(readStartMode("windows"), "game");
    assert.equal(readStartMode("off"), "off");
    assert.equal(readStartMode("on"), null);
    assert.equal(readStartMode(undefined), null);
  });

  test("la voce del vecchio Con Windows si riscrive, con lo stato di Gestione attività", () => {
    assert.deepEqual(loginItemFix([{ path: EXE, args: ["--hidden"], enabled: true }], "game"), { enabled: true });
    assert.deepEqual(loginItemFix([{ path: EXE, args: ["--hidden"] }], "game"), { enabled: true });
    assert.deepEqual(loginItemFix([{ path: EXE, args: ["--hidden"], enabled: false }], "game"), { enabled: false });
    // già con il gioco, nessuna voce o avvio spento: niente da riscrivere
    assert.equal(loginItemFix([{ path: EXE, args: ["--hidden", WAIT_GAME_ARG], enabled: true }], "game"), null);
    assert.equal(loginItemFix([], "game"), null);
    assert.equal(loginItemFix([{ path: EXE, args: ["--hidden"], enabled: true }], "off"), null);
  });

  test("gioco aperto secondo tasklist", () => {
    const base = '"System Idle Process","0","Services","0","8 K"\r\n"UnityCrashHandler64.exe","9","Console","1","5.000 K"\r\n';
    assert.equal(gameRunning(base), false);
    // il gioco completo, uscito il 27/10/2026 (cartella di Steam "Origins TCG")
    assert.equal(gameRunning(base + '"OriginsTCG.exe","16848","Console","1","1.200.000 K"\r\n'), true);
    assert.equal(gameRunning('"OriginsTCGPlaytest.exe","1","Console","1","1 K"'), true);
    // la demo non c'è più: non fa partire l'app
    assert.equal(gameRunning(base + '"OriginsTCGDemo.exe","16848","Console","1","1.200.000 K"\r\n'), false);
    assert.equal(gameRunning('"OriginsMeta Tracker.exe","2","Console","1","1 K"'), false);
    assert.equal(gameRunning(""), false);
  });
});
