/**
 * Formattazione dei testi scritti dagli utenti (22/10/2026, Pierluigi: "possiamo inserire il grassetto e altri
 * markdown?"; scelta: "ovunque scrivono gli utenti", cioè guide dei mazzi singoli, mazzi torneo, guide della community e
 * commenti). Fino ad allora erano testo semplice mostrato con `whitespace-pre-line`.
 *
 * Un sottoinsieme piccolo del Markdown, letto qui e mai dato a `marked` (che passa l'HTML così com'è: va bene per news e
 * guide della redazione, non per i testi degli utenti):
 *   **grassetto** (anche __così__), *corsivo* (anche _così_), ~~barrato~~, `codice`, \* per scrivere il segno;
 *   righe che iniziano con "- ", "* ", "+ ", "• " o "– " → elenco puntato; "1. " o "1) " → elenco numerato;
 *   "> " → citazione; "# ", "## " o "### " → titoletto (uno solo, in `headings`: i commenti non li hanno);
 *   una riga di soli "---", "***" o "___" → linea di separazione.
 * Niente link, immagini né HTML: i caratteri restano testo (< e > compresi) e React li scrive escapati. I nomi delle
 * carte diventano link più avanti, sul server (`UserMarkdown.tsx`), solo nei nodi di testo. Gli a capo dentro un
 * paragrafo restano a capo, come con `whitespace-pre-line`: i testi scritti prima del 22/10/2026 si leggono come prima
 * (i loro "- " e "1. " diventano elenchi veri).
 *
 * Il risultato è un albero di dati semplici (JSON), lo stesso sul server e nel browser: le guide lo disegnano nel
 * componente server, i commenti lo ricevono dalla rotta /api/deck-comments già con le carte collegate e lo disegna
 * `RichText` nel browser. Funzioni pure, nessun import: `node --test src/lib/userMarkdown.test.ts`.
 */

/** Pezzo di una riga: testo, a capo, grassetto, corsivo, barrato, codice, nome di carta (aggiunto dal server). */
export type Inline =
  | { t: "text"; v: string }
  | { t: "br" }
  | { t: "b" | "i" | "s"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "card"; v: string; slug: string; href: string; peek?: string };

/** Blocco: paragrafo, titoletto, elenco puntato o numerato, citazione, linea di separazione. */
export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "h"; c: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; start: number; items: Inline[][] }
  | { t: "quote"; c: Block[] }
  | { t: "hr" };

/** `headings: false` (commenti): le righe con # restano testo. */
export type MarkdownOptions = { headings?: boolean };

/** Annidamento massimo di grassetto/corsivo/barrato e di citazioni: oltre, i segni restano testo. */
const MAX_INLINE_DEPTH = 4;
const MAX_QUOTE_DEPTH = 2;

const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const BULLET = /^ {0,3}[-*+•–][ \t]+(\S.*)$/;
const ORDERED = /^ {0,3}(\d{1,3})[.)][ \t]+(\S.*)$/;
const HEADING = /^ {0,3}#{1,3}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const QUOTE = /^ {0,3}>[ \t]?(.*)$/;
/** Riga di continuazione di una voce di elenco: rientrata di almeno due spazi. */
const CONTINUATION = /^ {2,}(\S.*)$/;
/** Caratteri che una barra rovesciata rende testo. */
const ESCAPABLE = "\\`*_~#>-+.!()[]•–";

const isSpace = (ch: string | undefined): boolean => ch === undefined || /\s/u.test(ch);
const isWord = (ch: string | undefined): boolean => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);

/** Testo del Markdown → blocchi. Righe Windows o vecchie Mac diventano "\n". */
export function parseMarkdown(text: string, options: MarkdownOptions = {}): Block[] {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  return parseBlocks(lines, options, 0);
}

function parseBlocks(lines: string[], options: MarkdownOptions, depth: number): Block[] {
  const out: Block[] = [];
  let i = 0;
  const startsBlock = (line: string): boolean =>
    RULE.test(line) || BULLET.test(line) || ORDERED.test(line) || (depth < MAX_QUOTE_DEPTH && QUOTE.test(line)) || (options.headings !== false && HEADING.test(line));
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (RULE.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }
    if (options.headings !== false && HEADING.test(line)) {
      const m = HEADING.exec(line)!;
      if (m[1].trim()) out.push({ t: "h", c: parseInline(m[1].trim()) });
      i++;
      continue;
    }
    if (depth < MAX_QUOTE_DEPTH && QUOTE.test(line)) {
      const inner: string[] = [];
      for (let m = QUOTE.exec(lines[i]); m; m = i < lines.length ? QUOTE.exec(lines[i]) : null) {
        inner.push(m[1]);
        i++;
      }
      const c = parseBlocks(inner, options, depth + 1);
      if (c.length) out.push({ t: "quote", c });
      continue;
    }
    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    if (bullet || ordered) {
      const kind = bullet ? BULLET : ORDERED;
      const items: string[] = [];
      while (i < lines.length) {
        const m = kind.exec(lines[i]);
        if (m) {
          items.push(bullet ? m[1] : m[2]);
          i++;
          continue;
        }
        const cont = CONTINUATION.exec(lines[i]);
        // una riga rientrata che non è un'altra voce resta nella voce di prima, a capo
        if (cont && !startsBlock(lines[i])) {
          items[items.length - 1] += `\n${cont[1]}`;
          i++;
          continue;
        }
        break;
      }
      const parsed = items.map((x) => parseInline(x.trim()));
      out.push(bullet ? { t: "ul", items: parsed } : { t: "ol", start: Number(ordered![1]), items: parsed });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && (para.length === 0 || !startsBlock(lines[i]))) {
      para.push(lines[i].trim());
      i++;
    }
    out.push({ t: "p", c: parseInline(para.join("\n")) });
  }
  return out;
}

/** Una riga (o un paragrafo con gli a capo) → pezzi; gli a capo diventano `br`. */
export function parseInline(s: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "\\" && i + 1 < s.length && ESCAPABLE.includes(s[i + 1])) {
      buf += s[i + 1];
      i += 2;
      continue;
    }
    if (ch === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > i + 1 && !s.slice(i + 1, end).includes("\n")) {
        flush();
        out.push({ t: "code", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (depth < MAX_INLINE_DEPTH && (ch === "*" || ch === "_" || ch === "~")) {
      const span = emphasisAt(s, i);
      if (span) {
        flush();
        const inner = parseInline(s.slice(span.from, span.to), depth + 1);
        if (span.kind === "bi") out.push({ t: "b", c: [{ t: "i", c: inner }] });
        else out.push({ t: span.kind, c: inner });
        i = span.next;
        continue;
      }
      // segno senza chiusura: resta testo, tutta la fila insieme (così "**" spaiato non apre un corsivo dopo)
      let j = i;
      while (j < s.length && s[j] === ch) j++;
      buf += s.slice(i, j);
      i = j;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return splitBreaks(out);
}

type Span = { kind: "b" | "i" | "s" | "bi"; from: number; to: number; next: number };

/** Prova ad aprire grassetto, corsivo o barrato in `i`: la chiusura valida più vicina, con dentro almeno un carattere. */
function emphasisAt(s: string, i: number): Span | null {
  const ch = s[i];
  let run = 0;
  while (s[i + run] === ch) run++;
  const tries: { d: string; kind: Span["kind"] }[] =
    ch === "~" ? (run >= 2 ? [{ d: "~~", kind: "s" }] : []) : [
      ...(run >= 3 ? [{ d: ch.repeat(3), kind: "bi" as const }] : []),
      ...(run >= 2 ? [{ d: ch.repeat(2), kind: "b" as const }] : []),
      { d: ch, kind: "i" as const },
    ];
  for (const { d, kind } of tries) {
    const open = i + d.length;
    // apertura: subito dopo un carattere che non è uno spazio; "_" non dentro una parola (snake_case resta testo)
    if (isSpace(s[open])) continue;
    if (ch === "_" && isWord(s[i - 1])) continue;
    // un corsivo con un solo segno non si apre davanti a un'altra fila dello stesso segno (quella la prova `run`)
    if (d.length < run && kind === "i") continue;
    let j = s.indexOf(d, open + 1);
    while (j >= 0) {
      let closeRun = 0;
      while (s[j + closeRun] === ch) closeRun++;
      const before = s[j - 1];
      const after = s[j + d.length];
      const ok =
        !isSpace(before) &&
        // la chiusura di un segno singolo non sta dentro una fila doppia (quella è un grassetto interno)
        (d.length > 1 || closeRun === 1 || (closeRun >= 3 && kind === "i")) &&
        !(ch === "_" && isWord(after));
      if (ok) return { kind, from: open, to: j, next: j + d.length };
      j = s.indexOf(d, j + Math.max(1, closeRun));
    }
  }
  return null;
}

/** Gli a capo dentro i testi diventano nodi `br`; testi vicini si uniscono, i vuoti spariscono. */
function splitBreaks(nodes: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes) {
    if (n.t !== "text") {
      out.push(n);
      continue;
    }
    n.v.split("\n").forEach((part, k) => {
      if (k > 0) out.push({ t: "br" });
      if (!part) return;
      const last = out[out.length - 1];
      if (last?.t === "text") last.v += part;
      else out.push({ t: "text", v: part });
    });
  }
  return out;
}

/** Il testo dei pezzi, senza segni: a capo per `br`. */
export function inlineText(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.t === "br") return "\n";
      return "c" in n ? inlineText(n.c) : n.v;
    })
    .join("");
}

/** Il testo dei blocchi, senza segni: una riga per voce di elenco, blocchi separati da una riga vuota. */
export function blocksText(blocks: readonly Block[]): string {
  return blocks
    .map((b) => {
      if (b.t === "hr") return "";
      if (b.t === "quote") return blocksText(b.c);
      if (b.t === "ul" || b.t === "ol") return b.items.map((it) => inlineText(it)).join("\n");
      return inlineText(b.c);
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Il testo come si legge, senza i segni del Markdown: per le description delle pagine, i riassunti negli elenchi, gli
 * annunci e le anteprime. "Usa **Merlin** subito" → "Usa Merlin subito".
 */
export function stripMarkdown(text: string, options: MarkdownOptions = {}): string {
  return blocksText(parseMarkdown(text, options));
}
