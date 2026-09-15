"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";
import { useMounted } from "@/lib/useMounted";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4, caricato SOLO se l'utente ha scelto "Accetta tutto" nel banner cookie
 * (Consent Mode v2: pubblicità sempre negata, statistiche concesse). Le visualizzazioni di pagina
 * nelle navigazioni interne le rileva la "misurazione avanzata" dello stream (eventi history).
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const mounted = useMounted();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const onConsent = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      setGranted(value === "all");
      if (value !== "all") window.gtag?.("consent", "update", { analytics_storage: "denied" });
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const enabled = Boolean(id) && mounted && (granted || getConsent() === "all");
  if (!enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${id}', { anonymize_ip: true });
`}</Script>
    </>
  );
}
