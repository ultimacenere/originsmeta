"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/IntentLink";
import { useMounted } from "@/lib/useMounted";
import { PREFERENCES_EVENT, getConsent, openCookiePreferences, setConsent, type Consent } from "@/lib/consent";
import { NITRO_GA_CONSENT_ID, adsEnabled } from "@/lib/ads/nitro";
import { watchNitroCmp } from "@/lib/ads/nitroClient";

export type CookieLabels = { title: string; text: string; accept: string; necessary: string; privacy: string; manage: string };

/**
 * Banner cookie in basso: compare finché l'utente non sceglie; si riapre da "Preferenze cookie" nel footer.
 * È un dialog (non modale): alla comparsa riceve il focus, così chi naviga da tastiera o con un lettore di schermo
 * lo incontra subito invece che in fondo alla pagina; dopo la scelta il focus torna dov'era (per esempio sul link
 * del footer che l'ha riaperto). I due tasti hanno lo stesso peso visivo, come chiede il Garante: rifiutare deve
 * essere facile quanto accettare.
 */
export function CookieBanner({ labels, privacyHref }: { labels: CookieLabels; privacyHref: string }) {
  const mounted = useMounted();
  const [decided, setDecided] = useState<Consent | null>(null);
  const [reopened, setReopened] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Con gli annunci di Nitro (14/11/2026): dove vale il GDPR la loro finestra chiede anche il consenso per Google
  // Analytics (consenso personalizzato `ga`, NITRO_GA_CONSENT_ID), quindi il nostro banner non compare; altrove, o se lo
  // script di Nitro non arriva (ad blocker), resta il nostro. `null` = si aspetta lo script (al massimo 3,5 secondi).
  const [nitroCmp, setNitroCmp] = useState<boolean | null>(adsEnabled() ? null : false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, []);

  useEffect(() => {
    if (!adsEnabled()) return;
    return watchNitroCmp((active) => setNitroCmp(active && NITRO_GA_CONSENT_ID !== null));
  }, []);

  const stored = mounted ? getConsent() : null;
  const visible = mounted && nitroCmp === false && (reopened || (!stored && !decided));

  // Alla comparsa: ricorda l'elemento attivo e porta il focus sul banner.
  useEffect(() => {
    if (!visible) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    dialogRef.current?.focus({ preventScroll: true });
  }, [visible]);

  if (!visible) return null;

  const decide = (v: Consent) => {
    setConsent(v);
    setDecided(v);
    setReopened(false);
    const back = returnFocusRef.current;
    returnFocusRef.current = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-50 p-3 outline-none sm:p-4"
      // sopra l'anchor pubblicitario di Nitro quando c'è (--ad-anchor-h, NitroAds.tsx); senza annunci vale 0
      style={{ bottom: "var(--ad-anchor-h, 0px)" }}
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
    >
      <div className="card-night mx-auto flex max-w-4xl flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0 flex-1 basis-72">
          <p id="cookie-title" className="kicker text-pale-muted">
            {labels.title}
          </p>
          <p id="cookie-text" className="mt-1 text-sm text-pale">
            {labels.text}{" "}
            <Link href={privacyHref} className="link-mint underline underline-offset-2">
              {labels.privacy}
            </Link>
          </p>
        </div>
        {/* Stesso bottone per le due scelte (stesso colore, misura e peso); testi e ordine invariati. */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => decide("necessary")} className="btn btn-primary cursor-pointer text-xs">
            {labels.necessary}
          </button>
          <button type="button" onClick={() => decide("all")} className="btn btn-primary cursor-pointer text-xs">
            {labels.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Link nel footer che riapre il banner. */
export function CookiePreferencesButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      {label}
    </button>
  );
}
