/**
 * Test della carta del gioco condivisa da sito, app ed estensione Twitch (13/11/2026, src/game-card/):
 * `node --test src/game-card/model.test.ts`. Testo evidenziato come nel gioco, fascia dell'allineamento, niente HTML
 * dai testi, e la copia generata per l'estensione uguale ai file di qui.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { abilityNodes, gameCardTree, type GameCardInput, type GcNode } from "./model.ts";

const base: GameCardInput = { slug: "big-bad-wolf", name: "Big Bad Wolf", type: "unit", cost: 3, power: 3, health: 3, legendary: false, alignment: "evil", text: "", art: "/cards/art/big-bad-wolf.webp" };
const flat = (n: GcNode): GcNode[] => [n, ...(n.kids ?? []).flatMap(flat)];
const byCls = (t: GcNode, cls: string) => flat(t).filter((n) => (n.cls ?? "").split(" ").includes(cls));
const textOf = (n: GcNode): string => (n.text ?? "") + (n.kids ?? []).map(textOf).join("");

describe("testo dell'abilità", () => {
  test("parola chiave in grassetto con i due punti, danni in rosso, QUALSIASI in corsivo", () => {
    const [p] = abilityNodes("Alla rivelazione: Infliggi 4 danni a QUALSIASI personaggio.");
    const kids = p.kids ?? [];
    assert.deepEqual(kids.filter((k) => k.cls).map((k) => [k.cls, textOf(k)]), [
      ["omg-kw", "Alla rivelazione:"],
      ["omg-dmg", "4 danni"],
      ["omg-any", "QUALSIASI"],
    ]);
  });
  test("[6⚔️/6❤️] su una riga sola con le due icone", () => {
    const [p] = abilityNodes("Evoca Baloo [6⚔️/6❤️] in un altro luogo casuale.");
    const pair = (p.kids ?? []).find((k) => k.cls === "omg-nowrap")!;
    assert.equal(textOf(pair), "[6/6]");
    assert.equal(flat(pair).filter((n) => n.tag === "svg").length, 2);
  });
  test("una riga per ogni a capo e niente HTML dai testi", () => {
    const rows = abilityNodes("Trample\n<b>x</b>");
    assert.equal(rows.length, 2);
    assert.ok(flat(rows[1]).every((n) => n.tag !== "b" || n.cls), "il <b> del testo resta testo");
    assert.equal(textOf(rows[1]), "<b>x</b>");
  });
  test("parole chiave russe solo come parole intere", () => {
    const [p] = abilityNodes("Щитом и Щит");
    assert.deepEqual((p.kids ?? []).filter((k) => k.cls).map(textOf), ["Щитом", "Щит"]);
  });
});

describe("carta", () => {
  test("allineamento nella lingua del gioco; magie e neutrali con la riga a trattini", () => {
    assert.equal(textOf(byCls(gameCardTree(base, "it"), "omg-band")[0]), "Malvagio");
    assert.equal(textOf(byCls(gameCardTree({ ...base, alignment: "good" }, "de"), "omg-band")[0]), "Gut");
    assert.equal(byCls(gameCardTree({ ...base, alignment: "neutral" }, "en"), "omg-band").length, 0);
    const spell = gameCardTree({ ...base, type: "spell", power: null, health: null }, "en");
    assert.equal(byCls(spell, "omg-dash").length, 1);
    assert.equal(byCls(spell, "omg-stats").length, 0);
  });
  test("gemma con le ali solo per le Leggendarie, numeri della carta", () => {
    const leg = gameCardTree({ ...base, legendary: true }, "en");
    assert.ok(leg.cls?.includes("is-leg"));
    assert.equal(textOf(byCls(leg, "omg-gem-num")[0]), "3");
    assert.deepEqual(byCls(gameCardTree({ ...base, power: 5, health: 2 }, "en"), "omg-num").map(textOf), ["5", "2"]);
  });
});

describe("copia per l'estensione Twitch", () => {
  test("twitch-extension/game/ ha gli stessi CSS di src/game-card/ (tracker: npm run twitch-panels)", () => {
    const root = join(import.meta.dirname, "..", "..");
    for (const f of ["theme.css", "card.css"]) {
      const a = readFileSync(join(root, "src", "game-card", f), "utf8").replace(/\r\n/g, "\n");
      const b = readFileSync(join(root, "twitch-extension", "game", f), "utf8").replace(/\r\n/g, "\n");
      assert.equal(b, a, `${f} diverso: rilanciare npm run twitch-panels nella cartella tracker/`);
    }
  });
});
