import type { Metadata } from "next";
import "../globals.css";
import { siteFontVariables } from "@/fonts";
import "./broadcast.css";

/**
 * Layout radice di Broadcasting OM (prototipo del 16/10/2026): /broadcast (la regia) e /broadcast/live (l'overlay per
 * OBS). Fuori da [locale] come /overlay: niente header, footer, banner dei cookie, feedback né analytics, e fondo
 * trasparente (la regia si dà il suo fondo da sola). Mai indicizzato: robots noindex qui, X-Robots-Tag da next.config.ts
 * e /broadcast chiuso in robots.txt. Stessi font e colori del sito, nessun materiale Koin come interfaccia.
 */
export const metadata: Metadata = {
  title: "Broadcasting OM",
  robots: { index: false, follow: false },
};

export default function BroadcastLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={siteFontVariables} style={{ background: "transparent" }}>
      <body className="bc-body">{children}</body>
    </html>
  );
}
