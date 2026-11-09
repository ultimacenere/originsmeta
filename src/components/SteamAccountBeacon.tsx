"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import type { SteamLinkOutcome } from "@/lib/steam/link";

/**
 * Nella sezione #steam di /account (09/11/2026), dentro il suo <Suspense>:
 * - con l'ancora #steam nell'indirizzo (tasto del popup "collega Steam", ritorno da Steam) porta la sezione nello schermo
 *   quando arriva: con lo scheletro della pagina e il <Suspense> il salto del browser o di Next può cadere a vuoto;
 * - con l'esito di un collegamento o di uno scollegamento (`?steam=`) manda l'evento steam_link una volta sola e toglie
 *   `?steam=` dall'indirizzo, così un ricaricamento non lo riconta (la nota resta fino al prossimo cambio di pagina).
 */
export function SteamAccountBeacon({ outcome }: { outcome: SteamLinkOutcome | null }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (window.location.hash === "#steam") document.getElementById("steam")?.scrollIntoView({ block: "start" });
    if (!outcome) return;
    trackEvent("steam_link", { outcome });
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("steam")) return;
      url.searchParams.delete("steam");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* indirizzo non modificabile: resta com'è */
    }
  }, [outcome]);
  return null;
}
