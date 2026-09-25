"use client";

import { useEffect } from "react";
import { tracciaQuandoPronto } from "@/lib/analytics";

/**
 * Manda a GA4 l'evento `sign_up` quando qualcuno completa la PRIMA iscrizione.
 *
 * Il ritorno dall'accesso passa da `/auth/callback` (lato server), che riconosce l'utente appena creato e
 * aggiunge `?signup=discord|email` all'indirizzo di destinazione. Qui lo leggiamo, mandiamo l'evento e
 * ripuliamo l'indirizzo, così un aggiornamento della pagina non lo conta due volte e il parametro non resta
 * appiccicato ai link condivisi. Sta nel layout, quindi funziona qualunque sia la pagina di ritorno.
 */
export function SignupTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const via = url.searchParams.get("signup");
    if (via !== "discord" && via !== "email") return;
    tracciaQuandoPronto("sign_up", { method: via });
    url.searchParams.delete("signup");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  return null;
}
