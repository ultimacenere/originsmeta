import { marked } from "marked";
import { linkCardNames } from "@/lib/cardlinks";
import { getCard } from "@/lib/data/cards";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { cardMentionHtml } from "./CardMentions";

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

/**
 * Ogni link a una scheda carta (quelli appena creati e quelli scritti a mano nel testo, tabelle delle patch notes
 * comprese) diventa una menzione con l'anteprima della carta al passaggio del mouse: illustrazione, costo,
 * statistiche e testo, come nei testi della community (note del 22/09/2026: "carte linkate negli articoli, il
 * mouseover deve mostrare la carta"). Su touch il pannello non c'è e il tocco porta alla scheda.
 *
 * Nelle liste le Leggendarie sono segnate con una stella scritta DOPO il nome ("Dorothy ★"): la stella passa
 * davanti, gialla (`.legendary-star`), con il nome dello stesso colore degli altri e un testo per i lettori di
 * schermo (regola del 22/09/2026). Le intestazioni restano come sono: niente pannelli dentro un titolo.
 * `idPrefix` distingue i pannelli (`aria-describedby`) se una pagina avesse più blocchi Markdown.
 */
function cardPreviews(html: string, locale: Locale, idPrefix: string): string {
  const legendaryLabel = getDictionary(locale).common.legendary;
  let n = 0;
  return html
    .split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)/)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(/<a href="\/(?:en|it)\/cards\/([a-z0-9-]+)">([^<]*)<\/a>(\s*★)?/g, (match, slug: string, text: string, star?: string) => {
        const card = getCard(slug);
        if (!card) return match;
        const mention = cardMentionHtml(card, text, locale, `${idPrefix}-cm-${++n}`);
        if (star && card.legendary) return `<span class="legendary-star" aria-hidden="true">★</span>${mention}<span class="sr-only"> (${legendaryLabel})</span>`;
        return `${mention}${star ?? ""}`;
      });
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

/**
 * Ogni tabella sta in un contenitore che scorre di lato: su telefono una tabella a quattro colonne può
 * essere più larga dello schermo, e senza contenitore allargherebbe tutta la pagina (regola responsive
 * del sito: la pagina non scorre mai di lato, le tabelle sì, dentro il proprio riquadro). Le anteprime delle
 * carte dentro una tabella le posiziona `CardMentionEdges` rispetto alla finestra, così il contenitore non le taglia.
 */
function wrapTables(html: string): string {
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>");
}

/**
 * `linkCards` = lingua della pagina: attiva i link ai nomi di carta con l'anteprima (news e guide). La pagina che lo
 * usa deve montare `CardMentionEdges` una volta, per tenere i pannelli dentro la finestra.
 */
export function Markdown({ source, className = "", linkCards, idPrefix = "md" }: { source: string; className?: string; linkCards?: string; idPrefix?: string }) {
  const locale = linkCards && isLocale(linkCards) ? linkCards : undefined;
  const src = linkCards ? linkCardsInMarkdown(source, linkCards) : source;
  let html = wrapTables(addHeadingIds(marked.parse(src, { async: false }) as string));
  if (locale) html = cardPreviews(html, locale, idPrefix);
  return <div className={`prose-night ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
