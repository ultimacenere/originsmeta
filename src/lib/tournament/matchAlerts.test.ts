/**
 * Test dell'avviso "la tua partita è pronta" (`matchAlerts.ts`, 07/11/2026): `npm test`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { notifyState, parseAlertPrefs, playChime, readyMatchId, shouldAlert, showNotification } from "./matchAlerts.ts";

const match = (over: object = {}) => ({ id: "m1", player_a: "a", player_b: "b", status: "pending", ...over });

describe("parseAlertPrefs", () => {
  test("spento se non c'è niente di valido", () => {
    for (const raw of [null, "", "{rotto", "null", "42", '{"notify":"sì"}']) assert.deepEqual(parseAlertPrefs(raw), { notify: false, sound: false });
  });

  test("legge le due scelte", () => {
    assert.deepEqual(parseAlertPrefs('{"notify":true,"sound":false}'), { notify: true, sound: false });
    assert.deepEqual(parseAlertPrefs('{"notify":false,"sound":true}'), { notify: false, sound: true });
  });
});

describe("readyMatchId", () => {
  test("pronta con due giocatori e referto aperto", () => {
    for (const status of ["pending", "reported", "disputed"]) assert.equal(readyMatchId(match({ status })), "m1");
  });

  test("non pronta senza avversario, a partita chiusa o senza partita", () => {
    assert.equal(readyMatchId(match({ player_b: null })), null);
    assert.equal(readyMatchId(match({ player_a: null })), null);
    assert.equal(readyMatchId(match({ status: "confirmed" })), null);
    assert.equal(readyMatchId(match({ status: "bye" })), null);
    assert.equal(readyMatchId(null), null);
  });
});

describe("shouldAlert", () => {
  test("una partita che diventa pronta", () => {
    assert.equal(shouldAlert("m2", false, null), true);
    assert.equal(shouldAlert("m2", false, "m1"), true);
  });

  test("mai due volte per la stessa partita", () => {
    assert.equal(shouldAlert("m2", false, "m2"), false);
  });

  test("niente se è già nella stanza o se non c'è una partita pronta", () => {
    assert.equal(shouldAlert("m2", true, null), false);
    assert.equal(shouldAlert(null, false, null), false);
  });
});

test("suono: senza un gesto sulla pagina resta muto, dopo il gesto parte", async () => {
  let tones = 0;
  let state = "suspended";
  const node = { connect: (next: unknown) => next, start() {}, stop() {}, frequency: {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
  class FakeAudio {
    currentTime = 0;
    destination = {};
    get state() {
      return state;
    }
    // come Chrome senza gesto: la promessa resta in sospeso
    resume = () => (state === "running" ? Promise.resolve() : new Promise(() => {}));
    createOscillator() {
      tones++;
      return node;
    }
    createGain() {
      return node;
    }
  }
  const g = globalThis as { AudioContext?: unknown };
  g.AudioContext = FakeAudio;
  try {
    await playChime();
    assert.equal(tones, 0);
    state = "running";
    await playChime();
    assert.equal(tones, 3);
  } finally {
    delete g.AudioContext;
  }
});

describe("notifiche", () => {
  const withNotification = (value: unknown, run: () => void) => {
    const g = globalThis as { Notification?: unknown };
    const old = g.Notification;
    g.Notification = value;
    try {
      run();
    } finally {
      if (old === undefined) delete g.Notification;
      else g.Notification = old;
    }
  };

  test("senza l'API del browser", () => {
    withNotification(undefined, () => {
      assert.equal(notifyState(), "unsupported");
      assert.equal(showNotification("x", {}), null);
    });
  });

  test("senza consenso non parte niente", () => {
    let made = 0;
    class Fake {
      static permission = "default";
      constructor() {
        made++;
      }
    }
    withNotification(Fake, () => {
      assert.equal(showNotification("x", {}), null);
      assert.equal(made, 0);
    });
  });

  test("il costruttore che lancia (Chrome su Android) non rompe la pagina", () => {
    class Fake {
      static permission = "granted";
      constructor() {
        throw new TypeError("Illegal constructor");
      }
    }
    withNotification(Fake, () => assert.equal(showNotification("x", {}), null));
  });

  test("col consenso parte e il clic arriva", () => {
    class Fake {
      static permission = "granted";
    }
    withNotification(Fake, () => {
      let clicked = false;
      const note = showNotification("x", {}, () => (clicked = true));
      assert.ok(note);
      (note.onclick as unknown as () => void)();
      assert.equal(clicked, true);
    });
  });
});
