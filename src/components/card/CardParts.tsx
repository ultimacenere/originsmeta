import Link from "next/link";
import { Fragment } from "react";
import { href, type Locale } from "@/lib/i18n";
import type { Part } from "@/lib/cardPage";

/**
 * Una frase fatta di pezzi (`Part` di `cardPage.ts`) resa con i link: una carta porta alla sua scheda, una pagina al
 * suo percorso nella lingua della pagina. La carta della scheda stessa (`self`) resta testo in grassetto: un link alla
 * pagina in cui si è già non serve a nessuno.
 */
export function CardParts({ parts, locale, self }: { parts: readonly Part[]; locale: Locale; self?: string }) {
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <Fragment key={i}>{p}</Fragment>;
        if ("card" in p) {
          if (p.card === self) return <strong key={i} className="font-bold text-sky">{p.text}</strong>;
          return (
            <Link key={i} href={href(locale, `/cards/${p.card}`)} className="link-mint">
              {p.text}
            </Link>
          );
        }
        return (
          <Link key={i} href={href(locale, p.path)} className="link-mint">
            {p.text}
          </Link>
        );
      })}
    </>
  );
}
