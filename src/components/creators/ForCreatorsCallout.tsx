import Link from "next/link";
import type { ReactNode } from "react";
import type { ForCreatorsPlacement } from "@/lib/analytics";
import { FOR_CREATORS_PATH, forCreatorsTrack } from "@/lib/forCreators";
import { href, type Locale } from "@/lib/i18n";

/**
 * Riquadro che porta alla pagina per i creator, /for-creators (12/11/2026, riunione per l'Attrix Showmatch dell'11/11:
 * la pagina era "accessibile dal footer del sito, da spostare in posizione più visibile", e "se taggati creator, dovrebbe
 * apparire un tasto dedicato nell'interfaccia"). Una striscia: a sinistra il testo (con il titolo e la pastiglia del
 * ruolo quando ci sono), a destra il tasto, che sul telefono scende sotto. Due usi:
 * - in cima a /account, solo per chi ha un ruolo con vetrina (Creator, Autore, Pro, Staff): titolo, pastiglia del ruolo
 *   e "Apri gli strumenti" (`placement="account"`); la stessa pagina è una voce del menu dell'account (AccountMenu);
 * - in cima alla directory /creators, per tutti: una riga per chi fa dirette o video e il tasto che c'era già dal
 *   30/10/2026 (`placement="creators"`).
 * Componente server, senza stato: il clic lo misura `onDocumentClick` dagli attributi del link (evento
 * `for_creators_open` con il posto, catalogo in src/lib/analytics.ts). Testi in `entry` di forCreatorsLabels-<lingua>.ts.
 */
export function ForCreatorsCallout({
  locale,
  placement,
  text,
  cta,
  title,
  pill,
  className = "",
}: {
  locale: Locale;
  placement: ForCreatorsPlacement;
  text: string;
  cta: string;
  title?: string;
  /** la pastiglia del ruolo di chi guarda, accanto al titolo */
  pill?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-night flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6 ${className}`}>
      {/* basis: accanto al tasto finché c'è posto, sopra il tasto sul telefono (il testo non resta mai in una colonna stretta) */}
      <div className="min-w-0 flex-1 basis-64">
        {title ? (
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {pill}
            <span className="t-item">{title}</span>
          </p>
        ) : null}
        <p className={`max-w-2xl text-sm text-pale${title ? " mt-1.5" : ""}`}>{text}</p>
      </div>
      <Link href={href(locale, FOR_CREATORS_PATH)} prefetch={false} className="btn btn-primary text-sm" {...forCreatorsTrack(placement)}>
        {cta} →
      </Link>
    </div>
  );
}
