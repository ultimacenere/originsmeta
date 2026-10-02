import type { Dictionary } from "./i18n";

/**
 * Etichette del pannello di accesso (`src/components/LoginPanel.tsx`), che compare in quattro punti:
 * /login, /tournaments/new, /decks/publish e la modifica di un mazzo. Stanno qui, e non nel componente,
 * per lo stesso motivo di `builderLabels.ts`: un file "use client" non va importato dai server component,
 * e così una nuova etichetta si aggiunge in un posto solo.
 *
 * Qui sta anche la classificazione degli errori di accesso (`authErrorKind`), usata sia dal ritorno
 * `/auth/callback` (server) sia dal pannello (browser): il file non importa nulla a runtime, quindi va bene per entrambi.
 */
export type LoginLabels = {
  discord: string;
  redirecting: string;
  or: string;
  email: string;
  emailPlaceholder: string;
  magicLink: string;
  sending: string;
  /** contiene {email} */
  sentTo: string;
  resend: string;
  /** contiene {s} (secondi) */
  resendIn: string;
  error: string;
  errorExpired: string;
  errorOtherBrowser: string;
  errorDiscordCancelled: string;
  providerError: string;
  rateLimited: string;
  captchaError: string;
  captchaWaiting: string;
  captchaBroken: string;
  captchaRequired: string;
  disabled: string;
  backHint: string;
  /** apre il campo del codice quando non è già aperto (chi torna alla pagina con il codice in mano) */
  codeToggle: string;
  codeLabel: string;
  /** sotto il campo: dove si trova il codice e perché usarlo */
  codeHint: string;
  codeSubmit: string;
  codeChecking: string;
  codeFormat: string;
  codeNeedsEmail: string;
  codeInvalid: string;
  codeTooMany: string;
};

export function loginLabels(dict: Dictionary): LoginLabels {
  const a = dict.auth;
  return {
    discord: a.discord,
    redirecting: a.redirecting,
    or: a.or,
    email: a.email,
    emailPlaceholder: a.emailPlaceholder,
    magicLink: a.magicLink,
    sending: a.sending,
    sentTo: a.sentTo,
    resend: a.resend,
    resendIn: a.resendIn,
    error: a.error,
    errorExpired: a.errorExpired,
    errorOtherBrowser: a.errorOtherBrowser,
    errorDiscordCancelled: a.errorDiscordCancelled,
    providerError: a.providerError,
    rateLimited: a.rateLimited,
    captchaError: a.captchaError,
    captchaWaiting: a.captchaWaiting,
    captchaBroken: a.captchaBroken,
    captchaRequired: a.captchaRequired,
    disabled: a.disabled,
    backHint: a.backHint,
    codeToggle: a.codeToggle,
    codeLabel: a.codeLabel,
    codeHint: a.codeHint,
    codeSubmit: a.codeSubmit,
    codeChecking: a.codeChecking,
    codeFormat: a.codeFormat,
    codeNeedsEmail: a.codeNeedsEmail,
    codeInvalid: a.codeInvalid,
    codeTooMany: a.codeTooMany,
  };
}

/**
 * Tipi di errore che la pagina di accesso sa spiegare (rilievo UX-12 del 21/09/2026: prima una sola riga generica).
 * - expired: link via email scaduto o già usato (vale una volta sola);
 * - otherBrowser: link aperto in un browser diverso da quello che l'ha chiesto (il flusso PKCE di Supabase tiene
 *   la chiave di verifica in un cookie del browser di partenza: capita spesso con "chiesto dal PC, aperto dal telefono");
 * - discordCancelled: accesso annullato sulla pagina di Discord;
 * - discord: Discord non disponibile (provider spento o in errore);
 * - generic: tutto il resto.
 */
export type AuthErrorKind = "expired" | "otherBrowser" | "discordCancelled" | "discord" | "generic";

const kinds: readonly string[] = ["expired", "otherBrowser", "discordCancelled", "discord", "generic"];

/** Codici di Supabase Auth (vedi @supabase/auth-js, error-codes) raggruppati per messaggio. */
const expiredCodes = new Set(["otp_expired", "access_denied", "flow_state_expired", "flow_state_not_found"]);
const otherBrowserCodes = new Set(["pkce_code_verifier_not_found", "bad_code_verifier"]);
const providerCodes = new Set(["provider_disabled", "oauth_provider_not_supported", "server_error", "temporarily_unavailable"]);

function emailKind(code: string): AuthErrorKind | null {
  if (expiredCodes.has(code)) return "expired";
  if (otherBrowserCodes.has(code)) return "otherBrowser";
  return null;
}

/**
 * Traduce l'errore restituito da Supabase (`error` e `error_code` dell'indirizzo di ritorno, oppure il `code`
 * dell'eccezione) nel tipo di messaggio da mostrare. `via` è il metodo scelto nel pannello ("discord" o "email"),
 * aggiunto da noi all'indirizzo di ritorno: un "access_denied" vuol dire "annullato" su Discord e "link scaduto"
 * per l'email. Un tipo già classificato (il ritorno lo passa alla pagina di accesso) resta com'è.
 * Restituisce null se non c'è nessun errore.
 */
export function authErrorKind(error: string | null | undefined, code?: string | null, via?: string | null): AuthErrorKind | null {
  if (error && kinds.includes(error)) return error as AuthErrorKind;
  const e = (error ?? "").trim().toLowerCase();
  const c = (code ?? "").trim().toLowerCase();
  if (!e && !c) return null;
  if (via === "discord") {
    if (e === "access_denied" || c === "access_denied") return "discordCancelled";
    if (providerCodes.has(c) || providerCodes.has(e)) return "discord";
    return "generic";
  }
  return (c ? emailKind(c) : null) ?? (e ? emailKind(e) : null) ?? "generic";
}

/**
 * Codice dell'email (dal 02/10/2026): la stessa email del link porta anche un codice (`{{ .Token }}` nei modelli Magic Link e
 * Confirm signup di Supabase), che si scrive nel pannello e si verifica con `verifyOtp({ email, token, type: "email" })`.
 * A differenza del link non dipende dal browser che ha chiesto l'accesso (il flusso PKCE): funziona con la posta letta
 * sul telefono, nel browser interno dell'app di Gmail, in una finestra anonima e nell'app installata.
 * Supabase lo manda di 6 cifre; la lunghezza si cambia in Authentication → Email (da 6 a 10), quindi qui valgono tutte.
 */
export const OTP_MIN_DIGITS = 6;
export const OTP_MAX_DIGITS = 10;

/**
 * Il codice come l'ha scritto o incollato l'utente, ridotto alle sole cifre (spazi, trattini, "Il tuo codice è …" via).
 * null se le cifre non hanno una lunghezza possibile. Il testo si taglia prima di pulirlo: niente regex su incollati enormi.
 */
export function cleanOtp(raw: string): string | null {
  const digits = raw.slice(0, 80).replace(/\D/g, "");
  return digits.length >= OTP_MIN_DIGITS && digits.length <= OTP_MAX_DIGITS ? digits : null;
}

/**
 * Esito di una verifica del codice fallita: "invalid" quando Supabase dice scaduto o sbagliato (per lui sono lo stesso
 * errore, `otp_expired` con stato 403; il codice muore anche quando il link della stessa email è già stato aperto),
 * "tooMany" con troppi tentativi (429), "generic" per il resto (rete, servizio).
 */
export type OtpErrorKind = "invalid" | "tooMany" | "generic";

export function otpErrorKind(error: { status?: number; code?: string } | null | undefined): OtpErrorKind {
  if (!error) return "generic";
  if (error.status === 429 || error.code === "over_request_rate_limit") return "tooMany";
  if (error.code === "otp_expired" || (error.status === 403 && !error.code)) return "invalid";
  return "generic";
}
