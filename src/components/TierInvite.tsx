"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tierInviteText, type InviteWords } from "@/lib/tierstats";

/**
 * Invito a salvare la propria tier list, nella striscia della tier list della home (Ondata 3 del piano SEO/GEO, TOOL-01).
 * La home è statica: nell'HTML c'è la frase senza numeri (`fallback`), e il browser la sostituisce con quella con il
 * conteggio vero ("2 persone delle 5 che servono…") appena arriva /api/tier-list-counts, lo stesso schema della striscia
 * del calendario con /api/calendar. Senza JavaScript o con un errore resta la frase statica, che è comunque vera.
 */
export function TierInvite({ words, fallback, cta, href, url = "/api/tier-list-counts" }: { words: InviteWords; fallback: string; cta: string; href: string; url?: string }) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((n: { legendaries?: unknown; cards?: unknown; people?: unknown } | null) => {
        if (!alive || !n) return;
        const { legendaries, cards, people } = n;
        if (typeof legendaries === "number" && typeof cards === "number" && typeof people === "number") setText(tierInviteText(words, { legendaries, cards, people }));
      })
      .catch(() => {
        /* resta la frase statica */
      });
    return () => {
      alive = false;
    };
  }, [url, words]);

  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-chalk">
      <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0 fill-none stroke-mint stroke-[1.6]" aria-hidden="true">
        <circle cx="6" cy="5" r="2.25" />
        <path d="M1.75 13.5c.4-2.4 2.1-3.75 4.25-3.75s3.85 1.35 4.25 3.75" strokeLinecap="round" />
        <path d="M10.75 3.25a2.25 2.25 0 0 1 0 4.25M12.25 9.9c1.1.55 1.8 1.75 2 3.6" strokeLinecap="round" />
      </svg>
      <span>
        {text}{" "}
        <Link href={href} className="whitespace-nowrap text-mint hover:underline">
          {cta} →
        </Link>
      </span>
    </p>
  );
}
