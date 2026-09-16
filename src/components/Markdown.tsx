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

export function Markdown({ source, className = "", linkCards }: { source: string; className?: string; linkCards?: string }) {
  const src = linkCards ? linkCardsInMarkdown(source, linkCards) : source;
  const html = marked.parse(src, { async: false }) as string;
  return <div className={`prose-night ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
