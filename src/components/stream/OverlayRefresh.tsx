"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Aggiorna l'overlay per OBS senza ricaricare la pagina (pacchetto STREAM, 26/09/2026): ogni `seconds` il server
 * rilegge il mazzo e React sostituisce solo quello che è cambiato, quindi in diretta non c'è il lampo di un
 * ricaricamento. Sta nel layout dell'overlay: continua a girare anche quando la pagina mostra un messaggio (mazzo non
 * ancora pubblicato, database irraggiungibile) e il mazzo compare da solo appena c'è. Con la scheda nascosta (OBS
 * con "spegni la sorgente quando non è visibile") non fa nulla.
 */
export function OverlayRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
