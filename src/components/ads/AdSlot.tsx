"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { IN_CONTENT_OPTIONS, IN_CONTENT_SLOTS, adsAllowedPath, adsEnabled, type InContentSlot } from "@/lib/ads/nitro";
import { createAd } from "@/lib/ads/nitroClient";

/**
 * Uno spazio pubblicitario nel testo (Nitro, 14/11/2026): la scritta "Pubblicità" sopra e l'altezza già riservata, così
 * la pagina non salta quando l'annuncio arriva. C'è solo con gli annunci accesi e sulle pagine che li ammettono; quando
 * si cambia pagina React toglie il contenitore e Nitro libera lo spazio da solo. Va messo sotto la prima schermata.
 */
export function AdSlot({ slot, label, className = "" }: { slot: InContentSlot; label: string; className?: string }) {
  const pathname = usePathname();
  const on = adsEnabled() && adsAllowedPath(pathname);
  const id = IN_CONTENT_SLOTS[slot];
  // una richiesta per contenitore: React in sviluppo esegue gli effetti due volte, il ref resta lo stesso
  const requested = useRef(false);

  useEffect(() => {
    if (!on || requested.current) return;
    requested.current = true;
    createAd(id, IN_CONTENT_OPTIONS);
  }, [on, id]);

  if (!on) return null;
  return (
    <aside aria-label={label} className={`ad-slot ${className}`}>
      <p className="ad-slot-label">{label}</p>
      <div id={id} className="ad-slot-box" />
    </aside>
  );
}
