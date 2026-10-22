/**
 * Le modifiche dei tasti della barra di formattazione (`MarkdownToolbar`, 22/10/2026) sul testo di una casella: funzioni
 * pure, provate in src/lib/markdownEdit.test.ts. Ognuna dice quale tratto del testo sostituire, con che cosa e che cosa
 * selezionare dopo; a scrivere nella casella ci pensa il componente (così la modifica si annulla con Ctrl+Z).
 * I segni sono quelli che legge src/lib/userMarkdown.ts.
 */

export type TextEdit = { start: number; end: number; text: string; selStart: number; selEnd: number };

/**
 * Grassetto, corsivo, barrato: mette `mark` attorno alla selezione (senza gli spazi ai bordi, che il segno non
 * ammetterebbe), o lo toglie se c'è già; senza selezione scrive `placeholder` fra i segni e lo seleziona.
 */
export function wrapEdit(value: string, selStart: number, selEnd: number, mark: string, placeholder: string): TextEdit {
  let s = Math.min(selStart, selEnd);
  let e = Math.max(selStart, selEnd);
  while (s < e && /\s/.test(value[s])) s++;
  while (e > s && /\s/.test(value[e - 1])) e--;
  const m = mark.length;
  const sel = value.slice(s, e);
  // già fra i segni (appena fuori dalla selezione): si tolgono
  if (s >= m && value.slice(s - m, s) === mark && value.slice(e, e + m) === mark) {
    return { start: s - m, end: e + m, text: sel, selStart: s - m, selEnd: e - m };
  }
  // la selezione comprende i segni: si tolgono
  if (sel.length >= 2 * m + 1 && sel.startsWith(mark) && sel.endsWith(mark)) {
    const inner = sel.slice(m, sel.length - m);
    return { start: s, end: e, text: inner, selStart: s, selEnd: s + inner.length };
  }
  if (!sel) return { start: s, end: s, text: `${mark}${placeholder}${mark}`, selStart: s + m, selEnd: s + m + placeholder.length };
  return { start: s, end: e, text: `${mark}${sel}${mark}`, selStart: s + m, selEnd: e + m };
}

export type LineKind = "ul" | "ol" | "quote" | "h";

const PREFIX: Record<LineKind, RegExp> = {
  ul: /^[-*+•–][ \t]+/,
  ol: /^\d{1,3}[.)][ \t]+/,
  quote: /^>[ \t]?/,
  h: /^#{1,3}[ \t]+/,
};
/** Un elenco prende il posto dell'altro: da puntato a numerato e viceversa. */
const LIST = /^(?:[-*+•–]|\d{1,3}[.)])[ \t]+/;

/**
 * Elenco puntato o numerato, citazione, titoletto: il segno in testa a ogni riga toccata dalla selezione (le righe
 * vuote restano vuote); se tutte le righe lo hanno già, si toglie. Le righe restano selezionate.
 */
export function linePrefixEdit(value: string, selStart: number, selEnd: number, kind: LineKind): TextEdit {
  const s = Math.min(selStart, selEnd);
  let e = Math.max(selStart, selEnd);
  // una selezione che finisce all'inizio di una riga non tocca quella riga
  if (e > s && value[e - 1] === "\n") e--;
  const start = value.lastIndexOf("\n", s - 1) + 1;
  const nl = value.indexOf("\n", e);
  const end = nl < 0 ? value.length : nl;
  const lines = value.slice(start, end).split("\n");
  const full = lines.filter((l) => l.trim());
  const remove = full.length > 0 && full.every((l) => PREFIX[kind].test(l));
  let n = 0;
  const out = lines.map((l) => {
    if (remove) return l.replace(PREFIX[kind], "");
    if (!l.trim() && lines.length > 1) return l;
    const bare = kind === "ul" || kind === "ol" ? l.replace(LIST, "") : l.replace(PREFIX[kind], "");
    n++;
    const mark = kind === "ul" ? "- " : kind === "ol" ? `${n}. ` : kind === "quote" ? "> " : "### ";
    return `${mark}${bare}`;
  });
  const text = out.join("\n");
  // una riga sola e vuota: il cursore dopo il segno, pronto per scrivere
  if (lines.length === 1 && !lines[0].trim() && !remove) return { start, end, text, selStart: start + text.length, selEnd: start + text.length };
  return { start, end, text, selStart: start, selEnd: start + text.length };
}
