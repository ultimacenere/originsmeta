import type { Metadata } from "next";
import "../globals.css";
import { siteFontVariables } from "@/fonts";
import { OverlayRefresh } from "@/components/stream/OverlayRefresh";
import { OVERLAY_REFRESH_SECONDS } from "@/lib/stream";

/**
 * Layout radice dell'overlay per OBS (pacchetto STREAM, 26/09/2026): /overlay/deck/<slug> e /overlay/deck?u=<nome>, e dal
 * 04/10/2026 /overlay/deck-set/<slug> (Mazzi torneo).
 * Sta fuori da [locale] perché deve essere nudo: niente header, footer, banner dei cookie, pulsante dei feedback,
 * analytics né dati strutturati, e sfondo trasparente (la sorgente browser di OBS lo sovrappone al gioco). Il sito non
 * ha un layout in src/app, quindi questo è un secondo layout radice, come [locale]/layout.tsx: passare da uno all'altro
 * ricarica la pagina, e qui non ci sono link interni.
 *
 * Mai indicizzato: robots noindex qui e X-Robots-Tag da next.config.ts (anche Content-Security-Policy
 * `frame-ancestors *`, così l'overlay si può anche incorporare in un iframe: la pagina non ha azioni). Stessi font e
 * colori del sito; nessun materiale Koin come interfaccia (le carte sono contenuto, intere e con i crediti), e la
 * dicitura "non affiliato a Koin Games" in ogni overlay e messaggio (`DeckOverlay`). `lang="en"` sull'html vale per
 * il titolo della scheda, che è in inglese: la lingua del contenuto (?lang=) la dichiara il <main>, che la sovrascrive
 * (il layout non legge i parametri dell'indirizzo).
 */
export const metadata: Metadata = {
  title: "OriginsMeta · overlay",
  robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={siteFontVariables} style={{ background: "transparent" }}>
      {/* lo sfondo del sito (feltro con gli aloni) è sul body in globals.css: qui si toglie, anche l'immagine */}
      <body style={{ background: "transparent", margin: 0, overflow: "hidden" }}>
        {children}
        <OverlayRefresh seconds={OVERLAY_REFRESH_SECONDS} />
      </body>
    </html>
  );
}
