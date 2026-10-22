/**
 * Test dei tasti della barra di formattazione (`markdownEdit.ts`, 22/10/2026): `node --test src/lib/markdownEdit.test.ts`.
 * Ogni modifica, applicata al testo, deve dare quello che `parseMarkdown` legge come formattazione.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { linePrefixEdit, wrapEdit, type TextEdit } from "./markdownEdit.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { parseMarkdown } from "./userMarkdown.ts";

const apply = (v: string, e: TextEdit) => ({ value: v.slice(0, e.start) + e.text + v.slice(e.end) });
const run = (v: string, s: number, e: number, f: (v: string, s: number, e: number) => TextEdit) => {
  const edit = f(v, s, e);
  const value = apply(v, edit).value;
  return { value, selected: value.slice(edit.selStart, edit.selEnd) };
};

describe("grassetto, corsivo, barrato", () => {
  test("mette i segni attorno alla selezione, senza gli spazi ai bordi", () => {
    const r = run("usa Merlin subito", 3, 11, (v, s, e) => wrapEdit(v, s, e, "**", "testo"));
    assert.equal(r.value, "usa **Merlin** subito");
    assert.equal(r.selected, "Merlin");
    assert.deepEqual(parseMarkdown(r.value)[0], { t: "p", c: [{ t: "text", v: "usa " }, { t: "b", c: [{ t: "text", v: "Merlin" }] }, { t: "text", v: " subito" }] });
  });
  test("senza selezione scrive il segnaposto e lo seleziona", () => {
    const r = run("ciao ", 5, 5, (v, s, e) => wrapEdit(v, s, e, "~~", "testo"));
    assert.equal(r.value, "ciao ~~testo~~");
    assert.equal(r.selected, "testo");
  });
  test("un secondo clic toglie i segni (selezione dentro o comprendente)", () => {
    assert.equal(run("usa **Merlin** subito", 6, 12, (v, s, e) => wrapEdit(v, s, e, "**", "x")).value, "usa Merlin subito");
    assert.equal(run("usa *Merlin* subito", 4, 12, (v, s, e) => wrapEdit(v, s, e, "*", "x")).value, "usa Merlin subito");
  });
});

describe("righe", () => {
  test("elenco puntato su più righe, le vuote restano vuote", () => {
    const r = run("uno\n\ndue", 0, 8, (v, s, e) => linePrefixEdit(v, s, e, "ul"));
    assert.equal(r.value, "- uno\n\n- due");
  });
  test("elenco numerato al posto del puntato, e di nuovo via", () => {
    const once = run("- uno\n- due", 0, 11, (v, s, e) => linePrefixEdit(v, s, e, "ol")).value;
    assert.equal(once, "1. uno\n2. due");
    assert.equal(run(once, 0, once.length, (v, s, e) => linePrefixEdit(v, s, e, "ol")).value, "uno\ndue");
  });
  test("citazione e titoletto sulla riga del cursore", () => {
    assert.equal(run("a\nnota\nb", 3, 3, (v, s, e) => linePrefixEdit(v, s, e, "quote")).value, "a\n> nota\nb");
    assert.equal(run("Piano", 2, 2, (v, s, e) => linePrefixEdit(v, s, e, "h")).value, "### Piano");
  });
  test("riga vuota: segno e cursore pronto", () => {
    const edit = linePrefixEdit("testo\n", 6, 6, "ul");
    const value = apply("testo\n", edit).value;
    assert.equal(value, "testo\n- ");
    assert.equal(edit.selStart, value.length);
  });
  test("una selezione che finisce a inizio riga non tocca quella riga", () => {
    assert.equal(run("uno\ndue", 0, 4, (v, s, e) => linePrefixEdit(v, s, e, "ul")).value, "- uno\ndue");
  });
});
