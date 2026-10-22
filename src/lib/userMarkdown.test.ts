/**
 * Test della formattazione dei testi degli utenti (`userMarkdown.ts`, 22/10/2026) con il runner integrato di Node:
 * `node --test src/lib/userMarkdown.test.ts`. Come per gli altri test, l'import ha l'estensione `.ts`.
 *
 * Controlla i segni ammessi, che il resto resti testo (HTML, link, immagini, segni spaiati, snake_case, "2 * 3"), che i
 * testi scritti prima del 22/10/2026 (a capo, elenchi con "- " e "•") si leggano come prima, che i commenti non abbiano
 * titoletti e che `stripMarkdown` tolga i segni senza perdere parole.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { blocksText, inlineText, parseInline, parseMarkdown, stripMarkdown, type Block, type Inline } from "./userMarkdown.ts";

const text = (v: string): Inline => ({ t: "text", v });

describe("segni dentro la riga", () => {
  test("grassetto, corsivo, barrato e codice", () => {
    assert.deepEqual(parseInline("Usa **Merlin** subito"), [text("Usa "), { t: "b", c: [text("Merlin")] }, text(" subito")]);
    assert.deepEqual(parseInline("__forte__ e _piano_"), [{ t: "b", c: [text("forte")] }, text(" e "), { t: "i", c: [text("piano")] }]);
    assert.deepEqual(parseInline("*corsivo*"), [{ t: "i", c: [text("corsivo")] }]);
    assert.deepEqual(parseInline("~~vecchio~~ nuovo"), [{ t: "s", c: [text("vecchio")] }, text(" nuovo")]);
    assert.deepEqual(parseInline("codice `KGBLDC**x**`"), [text("codice "), { t: "code", v: "KGBLDC**x**" }]);
    assert.deepEqual(parseInline("***tutti e due***"), [{ t: "b", c: [{ t: "i", c: [text("tutti e due")] }] }]);
  });
  test("annidati", () => {
    assert.deepEqual(parseInline("*a **b** c*"), [{ t: "i", c: [text("a "), { t: "b", c: [text("b")] }, text(" c")] }]);
    assert.deepEqual(parseInline("**a *b* c**"), [{ t: "b", c: [text("a "), { t: "i", c: [text("b")] }, text(" c")] }]);
  });
  test("quello che non è formattazione resta testo", () => {
    for (const s of ["2 * 3 * 4", "**non chiuso", "snake_case_name", "x2*", "~singolo~", "** spazi **", "a*", "_"]) {
      assert.equal(inlineText(parseInline(s)), s, s);
      assert.ok(parseInline(s).every((n) => n.t === "text"), s);
    }
  });
  test("HTML, link e immagini restano testo", () => {
    for (const s of ['<b>ciao</b> <script>alert(1)</script>', "[link](https://esempio.com)", "![img](x.png)", "<img src=x onerror=alert(1)>"]) {
      assert.deepEqual(parseInline(s), [text(s)], s);
    }
  });
  test("la barra rovesciata scrive il segno", () => {
    assert.deepEqual(parseInline("\\*non corsivo\\*"), [text("*non corsivo*")]);
  });
  test("a capo dentro il paragrafo", () => {
    assert.deepEqual(parseInline("riga uno\nriga **due**"), [text("riga uno"), { t: "br" }, text("riga "), { t: "b", c: [text("due")] }]);
  });
});

describe("blocchi", () => {
  test("paragrafi, titoletti, elenchi, citazioni e linee", () => {
    const blocks = parseMarkdown("## Piano\nGioca lento.\n\n- uno\n- **due**\n\n1. primo\n2) secondo\n\n> citazione\n> seconda riga\n\n---\nfine");
    assert.deepEqual(blocks, [
      { t: "h", c: [text("Piano")] },
      { t: "p", c: [text("Gioca lento.")] },
      { t: "ul", items: [[text("uno")], [{ t: "b", c: [text("due")] }]] },
      { t: "ol", start: 1, items: [[text("primo")], [text("secondo")]] },
      { t: "quote", c: [{ t: "p", c: [text("citazione"), { t: "br" }, text("seconda riga")] }] },
      { t: "hr" },
      { t: "p", c: [text("fine")] },
    ] satisfies Block[]);
  });
  test("i testi di prima si leggono come prima: a capo, elenchi con • e righe rientrate", () => {
    assert.deepEqual(parseMarkdown("Mulligan:\n• Robin Hood\n• Merlin\n  anche al secondo turno\nPoi spingi."), [
      { t: "p", c: [text("Mulligan:")] },
      { t: "ul", items: [[text("Robin Hood")], [text("Merlin"), { t: "br" }, text("anche al secondo turno")]] },
      { t: "p", c: [text("Poi spingi.")] },
    ] satisfies Block[]);
    assert.deepEqual(parseMarkdown("-2 mana a turno 3\n2024. anno"), [{ t: "p", c: [text("-2 mana a turno 3"), { t: "br" }, text("2024. anno")] }]);
  });
  test("elenco numerato che parte da un numero diverso da 1", () => {
    assert.deepEqual(parseMarkdown("3. terzo\n4. quarto"), [{ t: "ol", start: 3, items: [[text("terzo")], [text("quarto")]] }]);
  });
  test("i commenti non hanno titoletti", () => {
    assert.deepEqual(parseMarkdown("# GRANDE", { headings: false }), [{ t: "p", c: [text("# GRANDE")] }]);
    assert.deepEqual(parseMarkdown("#hashtag"), [{ t: "p", c: [text("#hashtag")] }]);
  });
  test("citazioni annidate fino a due livelli", () => {
    assert.deepEqual(parseMarkdown("> > dentro"), [{ t: "quote", c: [{ t: "quote", c: [{ t: "p", c: [text("dentro")] }] }] }]);
    assert.deepEqual(parseMarkdown("> > > troppo"), [{ t: "quote", c: [{ t: "quote", c: [{ t: "p", c: [text("> troppo")] }] }] }]);
  });
  test("righe Windows e righe vuote in più", () => {
    assert.deepEqual(parseMarkdown("a\r\n\r\n\r\nb"), [{ t: "p", c: [text("a")] }, { t: "p", c: [text("b")] }]);
    assert.deepEqual(parseMarkdown(""), []);
  });
  test("testo lungo e cattivo: niente tempi lunghi", () => {
    const evil = " _a_b".repeat(800) + "*a **b".repeat(300);
    const t0 = Date.now();
    parseMarkdown(evil);
    assert.ok(Date.now() - t0 < 1500, `${Date.now() - t0} ms`);
  });
});

describe("testo senza segni", () => {
  test("stripMarkdown toglie i segni e tiene le parole", () => {
    assert.equal(stripMarkdown("Usa **Merlin** e ~~Robin~~ *subito*"), "Usa Merlin e Robin subito");
    assert.equal(stripMarkdown("## Piano\n- uno\n- due\n\n> nota"), "Piano\n\nuno\ndue\n\nnota");
    assert.equal(stripMarkdown("prezzo 2 * 3"), "prezzo 2 * 3");
  });
  test("blocksText salta le linee", () => {
    assert.equal(blocksText([{ t: "p", c: [text("a")] }, { t: "hr" }, { t: "p", c: [text("b")] }]), "a\n\nb");
  });
});
