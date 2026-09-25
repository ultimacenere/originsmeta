"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";
import { useMounted } from "@/lib/useMounted";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  applyStaffSwitch,
  clearUnsavedInput,
  consumeAuthSignal,
  deleteGaCookies,
  gaAllowed,
  hasUnsavedInput,
  isInternalTraffic,
  noteUnsavedInput,
  onDocumentClick,
  startGoogleAnalytics,
  stopGoogleAnalytics,
  storageAffectsGa,
  vercelBeforeSend,
  type SessionUser,
} from "@/lib/analytics";

/**
 * L'utente della sessione Supabase di questo browser, per verificare il segnale ?om_auth= (`consumeAuthSignal`). Si
 * chiama solo quando il segnale c'è, cioè una volta per accesso: `getUser()` chiede l'utente a Supabase, con il suo
 * `last_sign_in_at` aggiornato. Il client è lo stesso che l'header carica già per il menu dell'account.
 */
async function sessionUser(): Promise<SessionUser | null> {
  const sb = supabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

/**
 * Google Analytics 4, caricato SOLO se l'utente ha scelto "Accetta tutto" nel banner cookie (Consent Mode v2:
 * pubblicità sempre negata, statistiche concesse) e se il browser non è dello staff. Le visualizzazioni di pagina
 * nelle navigazioni interne le rileva la "misurazione avanzata" dello stream (eventi history).
 *
 * È anche il posto dei pezzi della misura che servono su ogni pagina (Ondata 2, MIS; eventi e regole in
 * src/lib/analytics.ts), perché il componente sta nel layout della lingua e resta montato fra una pagina e l'altra:
 * - il flag del traffico interno dello staff (?staff=<codice>|off);
 * - l'ascoltatore dei clic (link verso Steam e Discord, link della home, attributi data-om-*), che parte anche senza
 *   consenso: i clic vanno sempre a Vercel, senza cookie, e a GA4 solo con il consenso;
 * - l'evento di accesso o iscrizione all'arrivo da /auth/callback (?om_auth=…), solo se la sessione del browser ha
 *   un accesso appena avvenuto (`sessionUser` qui sotto);
 * - il ritiro del consenso (MIS-08), da questa scheda o da un'altra (evento `storage`): se GA4 girava, GA4 spento,
 *   consenso negato, cookie _ga cancellati e pagina ricaricata, perché gtag.js non si può scaricare. Il ricaricamento
 *   farebbe perdere il testo scritto nei moduli che non tengono una bozza nel browser (guida da mandare, torneo,
 *   feedback, modifica di un mazzo, domanda alla FAQ), quindi se nella pagina si è scritto in un modulo aspetta il
 *   prossimo cambio di pagina: intanto GA4 è già spento da `ga-disable-<ID>`.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const [granted, setGranted] = useState(false);
  /* ritiro del consenso con un modulo compilato: ricaricamento rimandato al prossimo cambio di pagina */
  const reloadPending = useRef(false);

  // Una volta per scheda: cookie _ga rimasti senza consenso (per esempio da un ritiro fatto prima di questa versione,
  // che non li cancellava), ascoltatore dei clic e dei moduli compilati.
  useEffect(() => {
    if (!gaAllowed()) deleteGaCookies();
    const opts = { capture: true, passive: true } as const;
    document.addEventListener("click", onDocumentClick, opts);
    document.addEventListener("auxclick", onDocumentClick, opts);
    document.addEventListener("input", noteUnsavedInput, opts);
    return () => {
      document.removeEventListener("click", onDocumentClick, opts);
      document.removeEventListener("auxclick", onDocumentClick, opts);
      document.removeEventListener("input", noteUnsavedInput, opts);
    };
  }, []);

  useEffect(() => {
    const withdraw = () => {
      if (!stopGoogleAnalytics(id)) return;
      if (hasUnsavedInput()) reloadPending.current = true;
      else window.location.reload();
    };
    // scelta fatta nel banner di questa scheda
    const onConsent = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      setGranted(value === "all");
      if (value === "all") reloadPending.current = false;
      else withdraw();
    };
    // scelta fatta in un'altra scheda del sito (o flag dello staff acceso lì): l'evento del banner arriva solo nella sua
    // scheda, `storage` a tutte le altre
    const onStorage = (e: StorageEvent) => {
      if (!storageAffectsGa(e.key)) return;
      setGranted(getConsent() === "all");
      if (gaAllowed()) reloadPending.current = false;
      else withdraw();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("storage", onStorage);
    };
  }, [id]);

  // Cambio di pagina: i moduli di prima non ci sono più; un ricaricamento rimandato parte adesso.
  useEffect(() => {
    clearUnsavedInput();
    if (reloadPending.current) window.location.reload();
  }, [pathname]);

  const enabled = Boolean(id) && mounted && (granted || getConsent() === "all") && !isInternalTraffic();

  useEffect(() => {
    if (enabled) startGoogleAnalytics(id);
  }, [enabled, id]);

  // Quando `mounted` diventa true, cioè dopo il primo giro di effetti: a quel punto Next ha già preso in carico
  // history.replaceState (lo fa in un effetto dell'AppRouter, che parte dopo quelli dei figli), quindi togliere
  // ?staff= e ?om_auth= dall'indirizzo aggiorna anche il suo router. Dopo l'avvio di GA4 (gli effetti partono
  // nell'ordine in cui sono scritti), così l'evento di accesso arriva anche lì.
  useEffect(() => {
    if (!mounted) return;
    void applyStaffSwitch();
    void consumeAuthSignal(sessionUser);
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
