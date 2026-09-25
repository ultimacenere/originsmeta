"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";
import { useMounted } from "@/lib/useMounted";
import {
  applyStaffSwitch,
  consumeAuthSignal,
  deleteGaCookies,
  gaAllowed,
  isInternalTraffic,
  onDocumentClick,
  startGoogleAnalytics,
  stopGoogleAnalytics,
  vercelBeforeSend,
} from "@/lib/analytics";

/**
 * Google Analytics 4, caricato SOLO se l'utente ha scelto "Accetta tutto" nel banner cookie (Consent Mode v2:
 * pubblicità sempre negata, statistiche concesse) e se il browser non è dello staff. Le visualizzazioni di pagina
 * nelle navigazioni interne le rileva la "misurazione avanzata" dello stream (eventi history).
 *
 * È anche il posto dei pezzi della misura che servono su ogni pagina (Ondata 2, MIS; eventi e regole in
 * src/lib/analytics.ts), perché il componente sta nel layout della lingua e resta montato fra una pagina e l'altra:
 * - il flag del traffico interno dello staff (?staff=on|off);
 * - l'ascoltatore dei clic (link verso Steam e Discord, attributi data-om-*), che parte anche senza consenso: i clic
 *   vanno sempre a Vercel, senza cookie, e a GA4 solo con il consenso;
 * - l'evento di accesso o iscrizione all'arrivo da /auth/callback (?om_auth=…);
 * - il ritiro del consenso (MIS-08): se GA4 girava, consenso negato, GA4 spento, cookie _ga cancellati e pagina
 *   ricaricata, perché gtag.js non si può scaricare e con il solo consenso negato manderebbe ancora ping senza cookie.
 *   Il deck builder, la tier list e la bozza della guida di un mazzo si salvano nel browser: il ricaricamento non li perde.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const mounted = useMounted();
  const [granted, setGranted] = useState(false);

  // Una volta per scheda: flag dello staff dall'indirizzo, cookie _ga rimasti senza consenso (per esempio da un ritiro
  // fatto prima di questa versione, che non li cancellava) e ascoltatore dei clic.
  useEffect(() => {
    applyStaffSwitch();
    if (!gaAllowed()) deleteGaCookies();
    const opts = { capture: true, passive: true } as const;
    document.addEventListener("click", onDocumentClick, opts);
    document.addEventListener("auxclick", onDocumentClick, opts);
    return () => {
      document.removeEventListener("click", onDocumentClick, opts);
      document.removeEventListener("auxclick", onDocumentClick, opts);
    };
  }, []);

  useEffect(() => {
    const onConsent = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      setGranted(value === "all");
      if (value !== "all" && stopGoogleAnalytics(id)) window.location.reload();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [id]);

  const enabled = Boolean(id) && mounted && (granted || getConsent() === "all") && !isInternalTraffic();

  useEffect(() => {
    if (enabled) startGoogleAnalytics(id);
  }, [enabled, id]);

  // Dopo l'avvio di GA4 (gli effetti partono nell'ordine in cui sono scritti), così l'evento arriva anche lì.
  useEffect(() => {
    if (mounted) consumeAuthSignal();
  }, [mounted]);

  if (!enabled) return null;
  // Il comando `config` lo dà startGoogleAnalytics: qui si carica solo la libreria, che legge la coda di dataLayer.
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />;
}

/**
 * Vercel Web Analytics con il filtro del traffico interno (`vercelBeforeSend`: niente pagine viste né eventi dal browser
 * dello staff, niente parametri della misura negli indirizzi). Va nel layout della lingua al posto di `<Analytics />`:
 * il layout è un componente server e non può passare la funzione da sé.
 */
export function VercelAnalytics() {
  return <Analytics beforeSend={vercelBeforeSend} />;
}
