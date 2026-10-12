import Link from "next/link";

/**
 * Invito a salvare la propria tier list, nella striscia della tier list della home (Ondata 3 del piano SEO/GEO, TOOL-01).
 * Dal 12/10/2026 solo la frase senza numeri (Pierluigi: il numero di chi ha contribuito "è un dato privato e non deve
 * interessare a nessuno"): prima il browser la sostituiva con il conteggio delle persone da /api/tier-list-counts, che
 * non c'è più. Componente server, senza stato.
 */
export function TierInvite({ text, cta, href }: { text: string; cta: string; href: string }) {
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
