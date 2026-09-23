import type { Dictionary } from "./i18n";
import { FEEDBACK_EMAIL_MAX, FEEDBACK_EMAIL_RE, FEEDBACK_STAFF_EMAIL } from "./feedbackLabels";

/**
 * "Mandaci la tua guida" (diretta Twitch del 23/09/2026: "permettere agli utenti di inviare deck e guide
 * direttamente"; Pierluigi: "modulo nel canale staff"). Il modulo sta in /guides/submit
 * (`src/components/GuideSubmitForm.tsx`, tasto in /guides), la rotta in `src/app/api/guide-submission/route.ts`,
 * e la guida arriva nel canale Discord privato dello staff, lo stesso dei feedback (DISCORD_FEEDBACK_WEBHOOK_URL),
 * con il testo completo in un file allegato. Nessun database.
 *
 * Qui stanno le costanti condivise dal modulo (browser) e dalla rotta (server): come `feedbackLabels.ts`, il
 * file importa solo un tipo e delle costanti, quindi non trascina i dizionari nel bundle del browser.
 * A differenza del pop-up dei feedback il modulo NON dipende da NEXT_PUBLIC_FEEDBACK: resta acceso dopo il rodaggio.
 */

export const GUIDE_TITLE_MIN = 5;
export const GUIDE_TITLE_MAX = 120;
/** Testo della guida. Il minimo vale solo senza link: se la guida vive altrove bastano due righe, o niente. */
export const GUIDE_TEXT_MIN = 300;
export const GUIDE_TEXT_MAX = 20_000;
/** Firma con cui pubblicare la guida. */
export const GUIDE_NAME_MIN = 2;
export const GUIDE_NAME_MAX = 60;
export const GUIDE_LINK_MAX = 300;
export const GUIDE_EMAIL_MAX = FEEDBACK_EMAIL_MAX;
export const GUIDE_EMAIL_RE = FEEDBACK_EMAIL_RE;
/**
 * Nome utente Discord: da 2 a 32 caratteri senza spazi, @, # o due punti (le regole di Discord), con la @
 * davanti facoltativa e il vecchio "#1234" ammesso. Niente apice inverso: nel messaggio sta in un blocco di codice.
 */
export const GUIDE_DISCORD_RE = /^@?[^\s@#:`]{2,32}(?:#\d{4})?$/u;
/** Nome utente Discord: 32 caratteri più la @ e il vecchio "#1234". */
export const GUIDE_DISCORD_MAX = 38;
/** Codice del gioco (KGBLDC…) o link del deck builder: caratteri da URL, niente spazi né apici inversi. */
export const GUIDE_CODE_MAX = 300;
export const GUIDE_CODE_RE = /^[\w+/=.:#?&%~-]{4,300}$/; // 300 = GUIDE_CODE_MAX
/** L'alternativa quando il modulo è spento o il CAPTCHA non si carica. */
export const GUIDE_STAFF_EMAIL = FEEDBACK_STAFF_EMAIL;

/**
 * Link della guida: solo http e https, senza credenziali. Restituisce l'indirizzo normalizzato, oppure null.
 * Il tetto vale anche dopo la normalizzazione (accenti e simboli diventano %XX): nel messaggio Discord un campo
 * ha al massimo 1024 caratteri.
 */
export function guideLink(raw: string): string | null {
  const v = raw.trim();
  if (!v || v.length > GUIDE_LINK_MAX) return null;
  try {
    const u = new URL(v);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || u.username || u.password) return null;
    // l'apice inverso chiuderebbe il blocco di codice del messaggio Discord
    const out = u.toString().replace(/`/g, "%60");
    return out.length <= GUIDE_LINK_MAX * 2 ? out : null;
  } catch {
    return null;
  }
}

/**
 * Codici d'errore della rotta (in italiano come quelli di `/api/feedback`): uno per campo (titolo, corto/lungo
 * per il testo, link, codice, firma, email, discord, consenso), poi troppe = limite per indirizzo IP, captcha =
 * controllo anti-bot fallito, disattivato = webhook non configurato, richiesta = corpo non leggibile, invio =
 * Discord non ha accettato il messaggio.
 */
export type GuideApiError =
  | "titolo"
  | "corto"
  | "lungo"
  | "link"
  | "codice"
  | "firma"
  | "email"
  | "discord"
  | "consenso"
  | "troppe"
  | "captcha"
  | "disattivato"
  | "richiesta"
  | "invio";

/** Etichette del modulo: `guideSubmit.form` dei dizionari, passato così com'è al componente. */
export type GuideSubmitLabels = Dictionary["guideSubmit"]["form"];
