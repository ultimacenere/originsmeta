import { marked } from "marked";
import { linkCardNames } from "@/lib/cardlinks";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Nomi ufficiali delle carte nel Markdown delle guide → link alla scheda carta (richiesta di Pierluigi, 16/09/2026:
 * nelle sezioni "punti di forza / punti deboli" delle guide ai mazzi i nomi non erano cliccabili). Si lavora sul
 * sorgente Markdown prima della conversione, saltando i pezzi da non toccare: blocchi e frammenti di codice,
 * link e immagini già presenti, intestazioni. Il riconoscimento è lo stesso della scheda mazzo (`linkCardNames`).
 */
function linkCardsInMarkdown(source: string, locale: string): string {
  const parts = source.split(/(```[\s\S]*?```|`[^`\n]*`|!?\[[^\]\n]*\]\([^)\n]*\)|^#{1,6} [^\n]*$)/m);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // parte catturata: resta com'è
      return linkCardNames(part)
        .map((seg) => (typeof seg === "string" ? seg : `[${seg.text}](/${locale}/cards/${seg.slug})`))
        .join("");
    })
    .join("");
}

/** Ancora leggibile dal testo di un titolo: minuscole, senza accenti né tag, trattini al posto degli spazi. */
function slugify(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z0-9#]+;/gi, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Dà un `id` ai titoli h2 e h3, così ogni sezione si può linkare (sommario "In breve" delle news, link
 * da altre pagine, "salta a" nei risultati di Google). Un titolo che finisce con `{#ancora}` usa quella
 * ancora, stabile anche se il titolo cambia; gli altri ricevono lo slug del testo. Ancore ripetute: -2, -3…
 */
function addHeadingIds(html: string): string {
  const used = new Map<string, number>();
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const explicit = inner.match(/\s*\{#([a-z0-9-]+)\}\s*$/);
    const content = explicit ? inner.slice(0, explicit.index).trimEnd() : inner;
    let id = explicit ? explicit[1] : slugify(content);
    if (!id) return `<h${level}>${content}</h${level}>`;
    const seen = used.get(id) ?? 0;
    used.set(id, seen + 1);
    if (seen) id = `${id}-${seen + 1}`;
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
}

export function Markdown({ source, className = "", linkCards }: { source: string; className?: string; linkCards?: string }) {
  const src = linkCards ? linkCardsInMarkdown(source, linkCards) : source;
  const html = addHeadingIds(marked.parse(src, { async: false }) as string);
  return <div className={`prose-night ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
