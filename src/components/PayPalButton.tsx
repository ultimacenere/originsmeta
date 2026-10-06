import type { ReactNode } from "react";
import { newTabProps } from "./SteamButton";

/**
 * Il tasto Donate di PayPal di OriginsMeta (link dato da Pierluigi il 06/10/2026: "fai un pulsante paypal 'dona ora'
 * nelle varie lingue, cliccano lì e finiscono nella pagina di PayPal per fare la donazione"). È un tasto "hosted": nome
 * della voce, valuta e opzioni stanno nel conto PayPal, il sito porta solo alla sua pagina.
 */
export const PAYPAL_DONATE_URL = "https://www.paypal.com/donate/?hosted_button_id=7XBBBC9E46CKW";

export const isPayPalUrl = (url?: string | null): boolean => /(^|\.)paypal\.com\//i.test(url ?? "");

/**
 * Tasto che porta alla pagina di donazione di PayPal, con l'aspetto del tasto PayPal (giallo #FFC439 e marchio in blu,
 * classi .btn-paypal in globals.css): nell'header dopo il selettore lingua e nel menu del telefono. Si apre in una nuova
 * scheda come i tasti Steam e Discord (`newTabProps`), così OriginsMeta resta aperto quando si torna da PayPal.
 * `label` è il nome del link per i lettori di schermo ("Dona ora con PayPal"); scritta "PayPal" e monogramma sono
 * decorativi. Il clic lo conta `onDocumentClick` con l'evento `donate_click` (attributi data-om-*), `placement` dice da dove.
 *
 * Nell'header (`placement="header"`) la riga è piena e il tasto cambia con la larghezza (misure del 06/10/2026, in
 * spagnolo e inglese i testi del menu e di "Acceder/Search" sono più lunghi che in italiano):
 * - 640–1023 px: solo "Dona ora" (con il marchio a 768 px sbordava di 27–30 px);
 * - 1024–1279 px: "Dona ora" e il marchio "PayPal";
 * - 1280–1535 px (menu completo, ricerca e account nella stessa riga): un tondo giallo da 32 px con il monogramma
 *   "PP", come il loghino Discord accanto (anche il solo testo sbordava di 47–62 px);
 * - da 1536 px: tasto intero.
 */
export function PayPalButton({
  children,
  label,
  placement,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  label: string;
  placement: "header" | "menu";
  size?: "md" | "sm";
  className?: string;
}) {
  const header = placement === "header";
  const cls = ["btn-paypal", size === "sm" ? "btn-paypal-sm" : "", header ? "btn-paypal-collapse" : "", className].filter(Boolean).join(" ");
  return (
    <a href={PAYPAL_DONATE_URL} {...newTabProps} aria-label={label} title={label} className={cls} data-om-event="donate_click" data-om-placement={placement} data-om-cta="button">
      <span className={header ? "xl:hidden 2xl:inline" : undefined}>{children}</span>
      {/* il marchio: "Pay" blu scuro e "Pal" azzurro, in corsivo grassetto come il logotipo */}
      <span className={`btn-paypal-mark${header ? " hidden lg:inline xl:hidden 2xl:inline" : ""}`} aria-hidden="true">
        <span className="btn-paypal-pay">Pay</span>
        <span className="btn-paypal-pal">Pal</span>
      </span>
      {/* il monogramma: due P in corsivo grassetto, la seconda azzurra e un po' spostata, come il simbolo PayPal */}
      {header ? (
        <span className="btn-paypal-pp hidden xl:inline-flex 2xl:hidden" aria-hidden="true">
          <span className="btn-paypal-pay">P</span>
          <span className="btn-paypal-pal">P</span>
        </span>
      ) : null}
    </a>
  );
}
