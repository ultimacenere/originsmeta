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
