"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * La × chiude la barra finché non si ricarica la pagina (nessuna memoria nel browser, niente da dichiarare
 * nell'informativa), in cima al sito e sotto lo slider della home insieme: le due barre sono istanze diverse, quindi
 * lo stato sta qui, nel modulo, e non nel componente.
 */
let closedForPage = false;
const closeListeners = new Set<() => void>();
const subscribeClosed = (onChange: () => void) => {
  closeListeners.add(onChange);
  return () => {
    closeListeners.delete(onChange);
  };
};
const getClosed = () => closedForPage;
const getServerClosed = () => false;
const closeBar = () => {
  closedForPage = true;
  closeListeners.forEach((f) => f());
};

/**
 * Barra col gradiente magenta-viola durante il Kickstarter della Alpha Edition (26/10/2026, src/lib/kickstarter.ts):
 * una riga verso la landing /kickstarter, che spiega e ha il tasto con il link referral. Non c'è sulla landing stessa.
 * `placement="site"` (layout della lingua, sopravvive alla navigazione): in cima a ogni pagina tranne la home
 * (`homeHref`), dove dal 27/10/2026 sta sotto lo slider (Pierluigi: "il banner dell'alfa deve essere messo sotto lo
 * slider"), con `placement="home"` dalla pagina stessa. Layout e home la montano solo finché `kickstarterPromoActive` dice sì.
 */
export function KickstarterBar({
  landingHref,
  homeHref,
  text,
  cta,
  closeLabel,
  placement = "site",
}: {
  landingHref: string;
  homeHref?: string;
  text: string;
  cta: string;
  closeLabel: string;
  placement?: "site" | "home";
}) {
  const pathname = usePathname();
  const closed = useSyncExternalStore(subscribeClosed, getClosed, getServerClosed);
  if (closed || pathname?.endsWith("/kickstarter")) return null;
  if (placement === "site" && homeHref && pathname === homeHref) return null;
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
            data-om-placement={placement === "home" ? "home_bar" : "site_bar"}
          >
            {cta} →
          </Link>
        </p>
        <button
          type="button"
          onClick={closeBar}
          aria-label={closeLabel}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg leading-none hover:bg-ink/10"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
