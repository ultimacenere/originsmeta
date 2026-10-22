import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { linkCardNames } from "@/lib/cardlinks";
import { parseMarkdown, type Block, type Inline, type MarkdownOptions } from "@/lib/userMarkdown";
import { mentionTarget } from "./CardMentions";
import { CardMentionEdges } from "./CardMentionEdges";
import { RichText } from "./RichText";

/**
 * Testi degli utenti con la formattazione (22/10/2026): guide dei mazzi, mazzi torneo, guide della community. Prende il
 * posto di `<p className="whitespace-pre-line"><CardMentions …/></p>`: legge il Markdown ammesso (`parseMarkdown`), poi
 * trasforma i nomi ufficiali delle carte in link con l'anteprima, come faceva `CardMentions` (stesso riconoscimento,
 * `linkCardNames`; i dati del pannello sulla prima menzione di ogni carta del testo), e lo disegna con `RichText`.
 * Solo lato server: il riconoscimento usa il database carte, che non deve finire nel bundle del browser.
 */
export function UserMarkdown({
  text,
  locale,
  dict,
  className,
  lang,
  headingLevel,
  headings,
}: {
  text: string;
  locale: Locale;
  dict?: Dictionary;
  className?: string;
  lang?: string;
  headingLevel?: 3 | 4 | 5;
  headings?: boolean;
}) {
  const { blocks, cards } = userDoc(text, locale, { headings }, dict);
  return (
    <>
      <RichText blocks={blocks} className={className} lang={lang} headingLevel={headingLevel} />
      {cards ? <CardMentionEdges /> : null}
    </>
  );
}

/** Il testo letto e con le carte collegate, pronto per `RichText` (anche nel browser: i commenti lo ricevono così). */
export function userDoc(text: string, locale: Locale, options: MarkdownOptions = {}, dict: Dictionary = getDictionary(locale)): { blocks: Block[]; cards: number } {
  const seen = new Set<string>();
  const linkInline = (nodes: readonly Inline[]): Inline[] =>
    nodes.flatMap((n): Inline[] => {
      if (n.t === "b" || n.t === "i" || n.t === "s") return [{ t: n.t, c: linkInline(n.c) }];
      if (n.t !== "text") return [n];
      return linkCardNames(n.v).map((seg): Inline => {
        if (typeof seg === "string") return { t: "text", v: seg };
        const card = mentionTarget(seg.slug, locale, dict);
        if (!card) return { t: "text", v: seg.text };
        const peek = seen.has(card.slug) ? undefined : card.peek();
        seen.add(card.slug);
        return { t: "card", v: seg.text, slug: card.slug, href: card.href, ...(peek ? { peek } : {}) };
      });
    });
  const linkBlock = (b: Block): Block => {
    if (b.t === "p" || b.t === "h") return { t: b.t, c: linkInline(b.c) };
    if (b.t === "ul") return { t: "ul", items: b.items.map(linkInline) };
    if (b.t === "ol") return { t: "ol", start: b.start, items: b.items.map(linkInline) };
    if (b.t === "quote") return { t: "quote", c: b.c.map(linkBlock) };
    return b;
  };
  const blocks = parseMarkdown(text, options).map(linkBlock);
  return { blocks, cards: seen.size };
}
