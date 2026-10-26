"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra verde in cima a ogni pagina durante il Kickstarter della Alpha Edition (26/10/2026, src/lib/kickstarter.ts):
 * una riga verso la landing /kickstarter, che spiega e ha il tasto con il link referral. Non c'è sulla landing stessa.
 * Si chiude con la ×: come l'header, la barra sta nel layout della lingua e sopravvive alla navigazione, quindi resta
 * chiusa finché non si ricarica la pagina (nessuna memoria nel browser, niente da dichiarare nell'informativa).
 * Il layout la monta solo finché `kickstarterPromoActive` dice sì.
 */
export function KickstarterBar({ landingHref, text, cta, closeLabel }: { landingHref: string; text: string; cta: string; closeLabel: string }) {
  const pathname = usePathname();
  const [closed, setClosed] = useState(false);
  if (closed || pathname?.endsWith("/kickstarter")) return null;
  return (
    <div className="ks-bar">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6">
        <p className="min-w-0 flex-1 text-center font-semibold leading-snug">
          <span>{text}</span>{" "}
          <Link
            href={landingHref}
            prefetch={false}
            className="whitespace-nowrap font-extrabold underline underline-offset-2"
            data-om-event="kickstarter_landing_open"
            data-om-placement="site_bar"
          >
            {cta} →
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label={closeLabel}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg leading-none hover:bg-ink/10"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
