"use client";

import { useEffect, useState } from "react";
import { KickstarterButton } from "./KickstarterButton";

/**
 * Barra fissa in basso della landing /kickstarter, solo sotto i 640 px (26/10/2026): il tasto verso la campagna resta a
 * portata di pollice. Compare solo quando il tasto della prima schermata (`watchId`) è uscito dallo schermo, così non ce
 * ne sono due insieme, e porta con sé la dichiarazione breve del link referral. Mentre si vede, `scroll-padding-bottom`
 * tiene sopra la barra l'elemento che riceve il focus da tastiera (WCAG 2.2, criterio 2.4.11).
 */
export function KickstarterSticky({ watchId, label, note }: { watchId: string; label: string; note: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);
  useEffect(() => {
    if (!show) return;
    const root = document.documentElement;
    const before = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = "120px";
    return () => {
      root.style.scrollPaddingBottom = before;
    };
  }, [show]);
  if (!show) return null;
  return (
    <div className="ks-sticky sm:hidden">
      <KickstarterButton placement="landing_sticky" className="w-full">
        {label}
      </KickstarterButton>
      <p className="mt-1 text-center text-[11px] leading-tight text-pale-muted">{note}</p>
    </div>
  );
}
