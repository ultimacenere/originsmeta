import Link from "next/link";
import { createElement, type ReactNode } from "react";
import type { Block, Inline } from "@/lib/userMarkdown";

/**
 * Disegna i blocchi di `parseMarkdown` (src/lib/userMarkdown.ts, 22/10/2026): testi degli utenti con grassetto, corsivo,
 * barrato, codice, elenchi, citazioni e titoletti. Solo elementi React e testo, mai `dangerouslySetInnerHTML`: quello
 * che l'utente scrive resta testo escapato da React. Senza stato e senza import del server, quindi va bene nei componenti
 * server (guide dei mazzi, mazzi torneo, guide della community, con `UserMarkdown`) e nel browser (commenti, che
 * arrivano già con le carte collegate dalla rotta /api/deck-comments).
 *
 * I nomi delle carte (`card`) hanno lo stesso markup di `CardMentions`: link alla scheda e, sulla prima menzione,
 * i dati dell'anteprima in `data-peek` per `CardMentionEdges`. Stili `.ugc-text` in globals.css.
 * `headingLevel`: il livello dei titoletti dell'utente, uno sotto il titolo della sezione che li contiene (h4 nelle
 * sezioni delle guide dei mazzi, h3 nelle sezioni delle guide della community).
 */
export function RichText({
  blocks,
  className = "",
  lang,
  headingLevel = 4,
}: {
  blocks: readonly Block[];
  className?: string;
  lang?: string;
  headingLevel?: 3 | 4 | 5;
}) {
  return (
    <div className={`ugc-text ${className}`} lang={lang}>
      {blocks.map((b, i) => renderBlock(b, i, headingLevel))}
    </div>
  );
}

function renderBlock(b: Block, key: number, level: number): ReactNode {
  switch (b.t) {
    case "p":
      return <p key={key}>{renderInline(b.c)}</p>;
    case "h":
      return createElement(`h${level}`, { key, className: "ugc-heading" }, renderInline(b.c));
    case "ul":
      return (
        <ul key={key}>
          {b.items.map((it, k) => (
            <li key={k}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} start={b.start === 1 ? undefined : b.start}>
          {b.items.map((it, k) => (
            <li key={k}>{renderInline(it)}</li>
          ))}
        </ol>
      );
    case "quote":
      return <blockquote key={key}>{b.c.map((x, k) => renderBlock(x, k, level))}</blockquote>;
    case "hr":
      return <hr key={key} />;
  }
}

const CARD_HREF = /^\/[a-z]{2}\/cards\/[a-z0-9-]{1,80}$/;

function renderInline(nodes: readonly Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "br":
        return <br key={i} />;
      case "b":
        return <strong key={i}>{renderInline(n.c)}</strong>;
      case "i":
        return <em key={i}>{renderInline(n.c)}</em>;
      case "s":
        return <s key={i}>{renderInline(n.c)}</s>;
      case "code":
        return <code key={i}>{n.v}</code>;
      case "card":
        // l'indirizzo lo scrive il server (scheda della carta nella lingua della pagina): un altro resta testo
        if (!CARD_HREF.test(n.href)) return n.v;
        return (
          <span key={i} className="card-mention" data-peek={n.peek}>
            <Link href={n.href} className="card-mention-link" prefetch={false}>
              {n.v}
            </Link>
          </span>
        );
    }
  });
}
