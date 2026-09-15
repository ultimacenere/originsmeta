"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMounted } from "@/lib/useMounted";
import { PREFERENCES_EVENT, getConsent, openCookiePreferences, setConsent, type Consent } from "@/lib/consent";

export type CookieLabels = { title: string; text: string; accept: string; necessary: string; privacy: string; manage: string };

/** Banner cookie in basso: compare finché l'utente non sceglie; si riapre da "Preferenze cookie" nel footer. */
export function CookieBanner({ labels, privacyHref }: { labels: CookieLabels; privacyHref: string }) {
  const mounted = useMounted();
  const [decided, setDecided] = useState<Consent | null>(null);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, []);

  const stored = mounted ? getConsent() : null;
  const visible = mounted && (reopened || (!stored && !decided));
  if (!visible) return null;

  const decide = (v: Consent) => {
    setConsent(v);
    setDecided(v);
    setReopened(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4" role="dialog" aria-labelledby="cookie-title" aria-live="polite">
      <div className="card-night mx-auto flex max-w-4xl flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0 flex-1 basis-72">
          <p id="cookie-title" className="kicker text-pale-muted">
            {labels.title}
          </p>
          <p className="mt-1 text-sm text-pale">
            {labels.text}{" "}
            <Link href={privacyHref} className="underline underline-offset-2 hover:text-crimson">
              {labels.privacy}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => decide("necessary")} className="btn border border-sky text-xs text-pale">
            {labels.necessary}
          </button>
          <button type="button" onClick={() => decide("all")} className="btn btn-mint text-xs">
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
