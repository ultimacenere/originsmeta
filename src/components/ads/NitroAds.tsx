"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GLOBAL_PLACEMENTS, NITRO_SITE_ID, adsAllowedPath, adsEnabled } from "@/lib/ads/nitro";
import { createAd, loadNitroScript, refreshCcpaLinks, removeAd, setNitroCmpLanguage, syncGaConsentFromNitro } from "@/lib/ads/nitroClient";

/** Altezza dell'anchor in fondo allo schermo: la leggono il piede della pagina e i tasti fissi (globals.css, FeedbackWidget…). */
const ANCHOR_VAR = "--ad-anchor-h";

/** Gli spazi di tutte le pagine già chiesti a Nitro in questa scheda: niente richieste doppie (React in sviluppo esegue gli effetti due volte). */
const requested = new Set<string>();

/** Quanto dell'elemento si vede davvero nello schermo (un anchor che scivola via conta 0). */
function visibleHeight(el: HTMLElement | null): number {
  if (!el || !el.isConnected) return 0;
  const r = el.getBoundingClientRect();
  return Math.max(0, Math.round(Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)));
}

/**
 * Gli annunci di Nitro su tutto il sito (14/11/2026), nel layout della lingua: carica lo script una volta per scheda,
 * crea gli spazi di tutte le pagine (anchor, colonna, video) solo sulle pagine che li ammettono e li toglie dalle altre,
 * riporta la scelta su Google Analytics fatta nella finestra di Nitro, rimette il link della CCPA dopo ogni cambio di
 * pagina e scrive l'altezza dell'anchor in `--ad-anchor-h`. Si monta solo con gli annunci accesi (`adsEnabled`).
 */
export function NitroAds() {
  const pathname = usePathname();
  const allowed = adsAllowedPath(pathname);

  // La finestra del consenso nella lingua della pagina (cookie ncmp-lang, 26/11/2026), prima dello script e a ogni cambio
  const locale = pathname.split("/")[1] ?? "";
  useEffect(() => {
    if (adsEnabled()) setNitroCmpLanguage(locale);
  }, [locale]);

  useEffect(() => {
    if (!adsEnabled() || !NITRO_SITE_ID) return;
    loadNitroScript(NITRO_SITE_ID);
    return syncGaConsentFromNitro();
  }, []);

  useEffect(() => {
    if (!adsEnabled()) return;
    if (allowed) {
      for (const p of GLOBAL_PLACEMENTS) {
        if (requested.has(p.id) || document.getElementById(p.id)) continue;
        requested.add(p.id);
        createAd(p.id, p.options);
      }
    } else {
      for (const p of GLOBAL_PLACEMENTS) {
        removeAd(p.id);
        requested.delete(p.id);
      }
      document.documentElement.style.removeProperty(ANCHOR_VAR);
    }
  }, [allowed]);

  useEffect(() => {
    if (adsEnabled()) refreshCcpaLinks();
  }, [pathname]);

  useEffect(() => {
    if (!adsEnabled()) return;
    const root = document.documentElement;
    let observer: ResizeObserver | null = null;
    let observed: string | null = null;
    const measure = (id: string) => {
      const h = visibleHeight(document.getElementById(id));
      if (h > 0) root.style.setProperty(ANCHOR_VAR, `${h}px`);
      else root.style.removeProperty(ANCHOR_VAR);
    };
    // nitroAds.anchorVisibility: l'anchor compare o sparisce (anche quando lo si chiude); detail.id = id dello spazio
    const onVisibility = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      requestAnimationFrame(() => measure(id));
      const el = document.getElementById(id);
      if (el && observed !== id && typeof ResizeObserver !== "undefined") {
        observer?.disconnect();
        observer = new ResizeObserver(() => measure(id));
        observer.observe(el);
        observed = id;
      }
    };
    document.addEventListener("nitroAds.anchorVisibility", onVisibility);
    return () => {
      document.removeEventListener("nitroAds.anchorVisibility", onVisibility);
      observer?.disconnect();
      root.style.removeProperty(ANCHOR_VAR);
    };
  }, []);

  return null;
}
