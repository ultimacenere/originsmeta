/**
 * CAPTCHA Cloudflare Turnstile sul modulo di accesso (richiesta di Pierluigi del 20/09/2026, punto 18 della KB).
 *
 * Perché: dal 17/09/2026 dei bot chiedevano link di accesso a raffica (54 account finti in due giorni, nessuno
 * con un accesso), facendo partire email non richieste dal nostro SMTP. La verifica del token NON la facciamo
 * noi: la fa Supabase Auth, che confronta il token con la chiave segreta configurata nella sua dashboard
 * (Authentication → Attack protection). Nel sito serve solo il widget e il token da allegare a `signInWithOtp`.
 *
 * La chiave del sito è pubblica per definizione (sta nell'HTML) e si imposta con NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * su Vercel. Senza quella variabile il widget non viene mostrato e l'accesso funziona esattamente come prima:
 * così il codice può stare online prima che il CAPTCHA venga acceso su Supabase, senza rischiare di bloccare
 * chi vuole entrare. Ordine di attivazione: prima la chiave qui, poi il CAPTCHA nella dashboard Supabase.
 *
 * Chiavi di prova di Cloudflare (utili in locale): 1x00000000000000000000AA passa sempre,
 * 2x00000000000000000000AB fallisce sempre.
 */
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const turnstileEnabled = turnstileSiteKey.length > 0;

/** Indirizzo dello script ufficiale, in modalità "render esplicito" (il widget lo montiamo noi in React). */
export const turnstileScript = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Marcatore richiesto dalla procedura Turnstile Spin di Cloudflare: serve solo alle loro statistiche. */
export const turnstileAction = "turnstile-spin-v1";

/** Riconosce l'errore che Supabase restituisce quando il token manca, è scaduto o non è valido. */
export function isCaptchaError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  return /captcha/i.test(`${error.message ?? ""} ${error.code ?? ""}`);
}
