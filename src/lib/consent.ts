/**
 * Consenso cookie salvato nel browser. Senza consenso il sito usa solo cookie tecnici (sessione dell'account) e le
 * statistiche senza cookie di Vercel; con "Accetta tutto" parte anche Google Analytics 4 (GoogleAnalytics.tsx), e
 * gli eventi vanno a GA4 solo se `getConsent() === "all"` (src/lib/analytics.ts). Ritirare il consenso, anche da
 * un'altra scheda, spegne GA4 subito, cancella i cookie _ga e ricarica la pagina (alla pagina dopo, se si stava
 * scrivendo in un modulo).
 */
export const CONSENT_KEY = "originsmeta.consent.v1";
export const CONSENT_EVENT = "originsmeta:consent";
export const PREFERENCES_EVENT = "originsmeta:cookie-preferences";

export type Consent = "all" | "necessary";

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage non disponibile */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Riapre il banner (link "Preferenze cookie" nel footer). */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}
