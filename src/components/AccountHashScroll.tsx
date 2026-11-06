"use client";

import { useEffect } from "react";

/**
 * Porta alla sezione dell'ancora nelle pagine dell'account (06/11/2026). Queste pagine arrivano dopo lo scheletro di
 * loading.tsx e alcune sezioni dentro un <Suspense>, quindi aprendo un link diretto (/account/twitch#stream-tools,
 * /account#comics) il browser non trovava l'ancora e la pagina restava in cima. Riprova per poco, finché la sezione c'è e
 * quelle sopra hanno preso il loro posto; si ferma appena chi guarda scorre da solo. Una tendina si apre.
 */
export function AccountHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => timers.forEach(clearTimeout);
    const go = () => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView();
    };
    for (const wait of [0, 250, 700, 1500]) timers.push(setTimeout(go, wait));
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, []);
  return null;
}
