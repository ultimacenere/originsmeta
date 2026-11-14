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
import { abilityNodes, gameCardRenderTree, gameCardTipsTree, gameCardTree, keywordIcon, renderShape, renderUrl, type GameCardInput, type GcNode } from "./model.ts";

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
    assert.deepEqual(flat(pair).filter((n) => n.tag === "i").map((n) => n.cls), ["omg-ico omg-ico--atk", "omg-ico omg-ico--hp"]);
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

describe("icone del gioco (asset di Koin del 13/11/2026)", () => {
  test("davanti alle parole chiave che hanno un'icona, in ogni lingua, anche nel russo declinato", () => {
    assert.equal(keywordIcon("Travolgere"), "trample");
    assert.equal(keywordIcon("Tocco letale:"), "deathtouch");
    assert.equal(keywordIcon("Stunned"), "stun");
    assert.equal(keywordIcon("Пробивным ударом"), "trample");
    assert.equal(keywordIcon("Щитом"), "shield");
    assert.equal(keywordIcon("Alla rivelazione:"), null);
    const [p] = abilityNodes("Travolgere. Alla morte: Infliggi 2 danni.");
    const kws = (p.kids ?? []).filter((k) => (k.cls ?? "").split(" ").includes("omg-kw"));
    assert.deepEqual(kws.map((k) => (k.kids ?? []).filter((n) => n.tag === "i").map((n) => n.cls)), [["omg-kwi omg-kwi--trample"], []]);
    assert.equal(kws[0].cls, "omg-kw omg-nowrap", "l'icona non resta sola a fine riga");
  });
  test("anche nel titolo del riquadro delle parole chiave", () => {
    const tips = gameCardTipsTree({ ...base, text: "Trample" }, "en")!;
    assert.equal(byCls(tips, "omg-kwi--trample").length, 1);
  });
  test("ogni icona usata ha il suo file e la sua classe in theme.css", () => {
    const root = join(import.meta.dirname, "..", "..");
    const theme = readFileSync(join(root, "src", "game-card", "theme.css"), "utf8");
    for (const m of theme.matchAll(/url\("(icons\/[^"]+)"\)/g)) readFileSync(join(root, "src", "game-card", m[1]));
    for (const ico of ["move", "deathtouch", "defender", "double-attack", "first-strike", "rebirth", "shield", "snipe", "stun", "trample"])
      assert.ok(theme.includes(`.omg-kwi--${ico} {`), ico);
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
    for (const f of ["theme.css", "card.css", ...["kw-trample.png", "stat-power.png"].map((i) => "icons/" + i)]) {
      const a = readFileSync(join(root, "src", "game-card", f), "utf8").replace(/\r\n/g, "\n");
      const b = readFileSync(join(root, "twitch-extension", "game", f), "utf8").replace(/\r\n/g, "\n");
      assert.equal(b, a, `${f} diverso: rilanciare npm run twitch-panels nella cartella tracker/`);
    }
  });
});

describe("carta render + testo (14/11/2026)", () => {
  test("indirizzo del render: variante base senza variante, mai con chiavi strane", () => {
    assert.equal(renderUrl("C00032_MB"), "https://cdn.origins-tcg.com/images/C00032_MB_V00000.webp");
    assert.equal(renderUrl("C00147_MB_V00050"), "https://cdn.origins-tcg.com/images/C00147_MB_V00050.webp");
    assert.equal(renderUrl("../x"), null);
    assert.equal(renderUrl(undefined), null);
  });
  test("forma per la maschera e niente render senza chiave", () => {
    assert.equal(renderShape({ ...base, type: "spell" }), "spell");
    assert.equal(renderShape({ ...base, legendary: true }), "legendary");
    assert.equal(gameCardRenderTree(base, "en"), null);
    const t = gameCardRenderTree({ ...base, key: "C00021_MB" }, "it")!;
    assert.ok(t.cls?.includes("omg-rcard--unit"));
    assert.equal(byCls(t, "omg-card").length, 1, "la carta disegnata di riserva");
  });
  test("il riquadro accanto ha prima il testo dell'abilità, poi le parole chiave", () => {
    const tips = gameCardTipsTree({ ...base, text: "Trample\nOn Death: Deal 2 damage." }, "en", { ability: true, keywords: true })!;
    const blocks = tips.kids ?? [];
    assert.equal(blocks[0].cls, "omg-tip omg-tip--ability");
    assert.equal(blocks.length, 3);
    assert.equal(gameCardTipsTree({ ...base, text: "" }, "en", { ability: true, keywords: true }), null);
  });
  test("le tre maschere esistono e il CSS le usa", () => {
    const root = join(import.meta.dirname, "..", "..");
    const theme = readFileSync(join(root, "src", "game-card", "theme.css"), "utf8");
    for (const s of ["unit", "spell", "legendary"]) assert.ok(theme.includes(`.omg-rcard--${s} .omg-render`), s);
  });
});
