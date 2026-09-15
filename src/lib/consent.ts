/**
 * Consenso cookie salvato nel browser. Oggi il sito usa solo cookie tecnici (sessione dell'account) e
 * statistiche senza cookie, quindi il banner è informativo; la scelta serve per eventuali strumenti futuri
 * (es. GA4), che vanno caricati solo se `getConsent() === "all"`.
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
