import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { OverlayRefresh } from "@/components/stream/OverlayRefresh";
import { OVERLAY_REFRESH_SECONDS } from "@/lib/stream";

/**
 * Layout radice dell'overlay per OBS (pacchetto STREAM, 26/09/2026): /overlay/deck/<slug> e /overlay/deck?u=<nome>.
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
const unbounded = Unbounded({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-unbounded", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-manrope", display: "swap" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jet", display: "swap" });

export const metadata: Metadata = {
  title: "OriginsMeta · overlay",
  robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${manrope.variable} ${jet.variable}`} style={{ background: "transparent" }}>
      {/* lo sfondo del sito (feltro con gli aloni) è sul body in globals.css: qui si toglie, anche l'immagine */}
      <body style={{ background: "transparent", margin: 0, overflow: "hidden" }}>
        {children}
        <OverlayRefresh seconds={OVERLAY_REFRESH_SECONDS} />
      </body>
    </html>
  );
}
