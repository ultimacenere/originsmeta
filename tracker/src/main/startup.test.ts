/**
 * Test dell'avvio automatico (startup.ts, 16/10/2026): con il gioco di default, chi aveva "Avvia con Windows" lo tiene,
 * gioco riconosciuto da `tasklist`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { gameRunning, initialStartMode, readStartMode, startArgs, WAIT_GAME_ARG } from "./startup";

const EXE = "C:\\Users\\x\\OriginsMeta Tracker\\OriginsMeta Tracker.exe";

describe("avvio automatico", () => {
  test("argomenti: con il gioco aspetta il gioco, con Windows parte subito nella barra", () => {
    assert.deepEqual(startArgs("game"), ["--hidden", WAIT_GAME_ARG]);
    assert.deepEqual(startArgs("windows"), ["--hidden"]);
  });

  test("primo avvio: con il gioco di default, chi aveva Avvia con Windows lo tiene, chi l'aveva disattivato resta spento", () => {
    assert.equal(initialStartMode([]), "game");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden"], enabled: true }]), "windows");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden"], enabled: false }]), "off");
    assert.equal(initialStartMode([{ path: EXE, args: ["--hidden", WAIT_GAME_ARG] }]), "game");
  });

  test("scelta salvata: solo i tre valori", () => {
    assert.equal(readStartMode("game"), "game");
    assert.equal(readStartMode("off"), "off");
    assert.equal(readStartMode("on"), null);
    assert.equal(readStartMode(undefined), null);
  });

  test("gioco aperto secondo tasklist", () => {
    const base = '"System Idle Process","0","Services","0","8 K"\r\n"UnityCrashHandler64.exe","9","Console","1","5.000 K"\r\n';
    assert.equal(gameRunning(base), false);
    assert.equal(gameRunning(base + '"OriginsTCGDemo.exe","16848","Console","1","1.200.000 K"\r\n'), true);
    assert.equal(gameRunning('"OriginsTCG.exe","1","Console","1","1 K"'), true);
    assert.equal(gameRunning('"OriginsMeta Tracker.exe","2","Console","1","1 K"'), false);
    assert.equal(gameRunning(""), false);
  });
});
