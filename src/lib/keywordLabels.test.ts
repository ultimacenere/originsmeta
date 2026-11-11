/**
 * Test delle etichette dei tag delle carte (`keywordLabels.ts`) con il runner integrato di Node:
 * `node --test src/lib/keywordLabels.test.ts`. Come per gli altri test, l'import ha l'estensione `.ts`.
 * Controlla che ogni tag del database carte abbia la traduzione e che il glossario del traduttore dei mazzi dica le
 * stesse parole delle etichette.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  keywordLabel,
  keywordLabels,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./keywordLabels.ts";
import {
  GAME_KEYWORDS,
  TRANSLATION_SYSTEM,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./community/deckTranslation.ts";
import {
  cardLore,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./data/card-lore.ts";

type Label = { it: string; es: string; fr: string; pt: string; de: string; ru: string; "zh-cn": string; game?: true };
const labels = keywordLabels as Record<string, Label>;
const woo = JSON.parse(readFileSync(new URL("./data/woo-cards.json", import.meta.url), "utf8")) as { cards: { name: string; keywords?: string[] }[] };

describe("keywordLabel", () => {
  test("in inglese resta il tag", () => {
    assert.equal(keywordLabel("On Reveal", "en"), "On Reveal");
    assert.equal(keywordLabel("Summon", "en"), "Summon");
  });
  test("in italiano e spagnolo le parole chiave del gioco hanno il nome ufficiale", () => {
    assert.equal(keywordLabel("On Reveal", "it"), "Alla rivelazione");
    assert.equal(keywordLabel("On Reveal", "es"), "Al revelar");
    assert.equal(keywordLabel("Trample", "it"), "Travolgere");
    assert.equal(keywordLabel("Trample", "es"), "Arrollar");
  });
  test("in francese i nomi del gioco letti l'08/10/2026", () => {
    assert.equal(keywordLabel("On Reveal", "fr"), "À la révélation");
    assert.equal(keywordLabel("Trample", "fr"), "Piétinement");
    assert.equal(keywordLabel("Summon", "fr"), "Invoquez");
  });
  test("in portoghese i nomi del gioco letti il 20/10/2026", () => {
    assert.equal(keywordLabel("On Reveal", "pt"), "Ao revelar");
    assert.equal(keywordLabel("Trample", "pt"), "Atropelar");
    assert.equal(keywordLabel("Snipe", "pt"), "Tiro certeiro");
    assert.equal(keywordLabel("Summon", "pt"), "Invoca");
  });
  test("in tedesco il glossario provvisorio del 20/10/2026 (docs/tedesco.md)", () => {
    assert.equal(keywordLabel("On Reveal", "de"), "Beim Aufdecken");
    assert.equal(keywordLabel("Trample", "de"), "Überrennen");
    assert.equal(keywordLabel("Snipe", "de"), "Präzisionsschuss");
    assert.equal(keywordLabel("Summon", "de"), "Beschwöre");
  });
  test("in russo i nomi del gioco letti il 20/10/2026 (docs/russo.md)", () => {
    assert.equal(keywordLabel("On Reveal", "ru"), "При раскрытии");
    assert.equal(keywordLabel("Trample", "ru"), "Пробивной удар");
    assert.equal(keywordLabel("Move", "ru"), "Перемещение");
    assert.equal(keywordLabel("Stun", "ru"), "Оглушение");
    assert.equal(keywordLabel("Snipe", "ru"), "Меткий выстрел");
    assert.equal(keywordLabel("Summon", "ru"), "Призывает");
  });
  test("in cinese i nomi del gioco, letti l'11/11/2026 (docs/cinese.md)", () => {
    assert.equal(keywordLabel("On Reveal", "zh-cn"), "展示时");
    assert.equal(keywordLabel("Defender", "zh-cn"), "守护者");
    assert.equal(keywordLabel("Double Attack", "zh-cn"), "双重攻击");
    assert.equal(keywordLabel("Trample", "zh-cn"), "践踏");
    assert.equal(keywordLabel("Move", "zh-cn"), "移动");
    assert.equal(keywordLabel("Snipe", "zh-cn"), "狙击");
    assert.equal(keywordLabel("Summon", "zh-cn"), "召唤");
  });
  test("le categorie di World of Origins hanno il verbo delle carte", () => {
    assert.equal(keywordLabel("Summon", "it"), "Evoca");
    assert.equal(keywordLabel("Draw", "es"), "Roba");
  });
  test("un tag sconosciuto resta com'è", () => {
    assert.equal(keywordLabel("Qualcosa di nuovo", "it"), "Qualcosa di nuovo");
  });
});

describe("copertura", () => {
  test("ogni tag del database carte ha l'etichetta italiana, spagnola, francese, portoghese, tedesca, russa e cinese", () => {
    const tags = new Set<string>();
    for (const c of woo.cards) for (const k of c.keywords ?? []) tags.add(k);
    for (const lore of Object.values(cardLore as Record<string, { keywords?: string[] }>)) for (const k of lore.keywords ?? []) tags.add(k);
    const missing = [...tags].filter((t) => !labels[t]?.it?.trim() || !labels[t]?.es?.trim() || !labels[t]?.fr?.trim() || !labels[t]?.pt?.trim() || !labels[t]?.de?.trim() || !labels[t]?.ru?.trim() || !labels[t]?.["zh-cn"]?.trim());
    assert.deepEqual(missing, [], `tag senza etichetta: ${missing.join(", ")}`);
  });
});

describe("glossario del traduttore dei mazzi", () => {
  test("le parole chiave del gioco sono le stesse delle etichette", () => {
    // Le colonne del prompt decidono quante lingue confrontare: il cinese entra nel confronto quando GAME_KEYWORDS
    // (deckTranslation.ts) ha la sua colonna.
    const columns = (GAME_KEYWORDS as readonly (readonly string[])[])[0].length;
    const fromLabels = Object.entries(labels)
      .filter(([, l]) => l.game)
      .map(([en, l]) => [en, l.it, l.es, l.fr, l.pt, l.de, l.ru, l["zh-cn"]].slice(0, columns).join(" = "))
      .sort();
    const fromPrompt = (GAME_KEYWORDS as readonly (readonly string[])[]).map((row) => row.join(" = ")).sort();
    assert.deepEqual(fromPrompt, fromLabels);
  });
  test("il prompt contiene ogni riga del glossario", () => {
    for (const row of GAME_KEYWORDS as readonly (readonly string[])[]) assert.ok((TRANSLATION_SYSTEM as string).includes(row.join(" = ")), row.join(" = "));
  });
});
