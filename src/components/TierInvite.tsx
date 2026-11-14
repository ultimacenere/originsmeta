import Link from "@/components/IntentLink";

/**
 * Invito a salvare la propria tier list, nella striscia della tier list della home (Ondata 3 del piano SEO/GEO, TOOL-01).
 * Dal 12/10/2026 solo la frase senza numeri (Pierluigi: il numero di chi ha contribuito "è un dato privato e non deve
 * interessare a nessuno"): prima il browser la sostituiva con il conteggio delle persone da /api/tier-list-counts, che
 * non c'è più. Componente server, senza stato. Dal 12/11/2026 una riga di testo con il suo link, senza icona né freccia.
 */
export function TierInvite({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <p className="mt-3 text-xs font-semibold text-chalk">
      {text}{" "}
      <Link href={href} className="link-mint whitespace-nowrap">
        {cta}
      </Link>
    </p>
  );
}
