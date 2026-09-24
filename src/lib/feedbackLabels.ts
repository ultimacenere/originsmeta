import type { Dictionary } from "./i18n";

/**
 * Pop-up dei feedback (richiesta di Pierluigi e Davdas del 22/09/2026, note della demo): nei primi giorni dopo il
 * lancio chi arriva sul sito è motivato e i suoi commenti valgono oro, quindi un pannello chiede "che cosa ti
 * piace, che cosa manca, che cosa non funziona?" e il messaggio arriva in un canale Discord privato dello staff
 * (webhook, vedi `src/app/api/feedback/route.ts`). Va spento dopo il rodaggio.
 *
 * Le etichette stanno qui, e non nel componente, per lo stesso motivo di `loginLabels.ts`: un file "use client"
 * non va importato dai server component. Qui stanno anche le costanti condivise dal widget (browser) e dalla
 * rotta (server): il file importa solo un tipo, quindi non trascina i dizionari nel bundle del browser.
 */

/**
 * INTERRUTTORE: il widget compare e la rotta accetta messaggi finché NEXT_PUBLIC_FEEDBACK non vale "off".
 * Acceso di default (così Pierluigi lo vede nella demo); per spegnerlo dopo il rodaggio: Vercel → Settings →
 * Environment Variables → NEXT_PUBLIC_FEEDBACK=off, poi un nuovo deploy (le variabili NEXT_PUBLIC_ entrano nel
 * codice al momento della build, quindi senza deploy non cambia nulla).
 */
export const feedbackEnabled = (process.env.NEXT_PUBLIC_FEEDBACK ?? "").trim().toLowerCase() !== "off";

/** Lunghezza del messaggio, in caratteri (le emoji contano uno). */
export const FEEDBACK_MIN = 10;
export const FEEDBACK_MAX = 1000;
/**
 * Nome o nickname facoltativo (24/09/2026, Pierluigi: il primo feedback era anonimo, "per capire chi lo ha fatto").
 * Stessa misura della firma di "Mandaci la tua guida" (`GUIDE_NAME_MAX`).
 */
export const FEEDBACK_NAME_MAX = 60;
/** Lunghezza massima di un indirizzo email (RFC 5321). */
export const FEEDBACK_EMAIL_MAX = 254;
/**
 * Controllo di forma volutamente largo: serve a scartare gli errori di battitura, non a certificare l'indirizzo.
 * Niente apice inverso: nel messaggio Discord l'email sta in un blocco di codice, così lo staff la copia esatta.
 */
export const FEEDBACK_EMAIL_RE = /^[^\s@<>()[\]\\,;:"`]+@[^\s@<>()[\]\\,;:"`]+\.[^\s@<>()[\]\\,;:"`.]{2,}$/;

/**
 * L'alternativa quando l'invio non è possibile: l'email dello staff. Il Discord del footer è il server ufficiale di
 * Koin Games, non il posto per i commenti su un sito fan non affiliato (revisione del 22/09/2026).
 */
export const FEEDBACK_STAFF_EMAIL = "staff@originsmeta.com";

/**
 * Codici d'errore della rotta (in italiano come quelli di `/api/ask`):
 * corto/lungo = lunghezza del messaggio, email = indirizzo non valido, troppe = limite per indirizzo IP,
 * captcha = controllo anti-bot fallito, disattivato = interruttore spento o webhook non configurato,
 * richiesta = corpo non leggibile, invio = Discord non ha accettato il messaggio.
 */
export type FeedbackApiError = "corto" | "lungo" | "email" | "troppe" | "captcha" | "disattivato" | "richiesta" | "invio";

export type FeedbackLabels = {
  /** testo del bottone fisso in basso a destra */
  button: string;
  kicker: string;
  title: string;
  intro: string;
  /** la domanda è anche l'etichetta visibile del campo di testo */
  question: string;
  messagePlaceholder: string;
  /** contiene {min} e {max} */
  lengthHint: string;
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHint: string;
  pageNote: string;
  privacyLink: string;
  send: string;
  sending: string;
  close: string;
  thanksTitle: string;
  thanksText: string;
  thanksEmail: string;
  another: string;
  alternatives: string;
  keepText: string;
  errors: {
    /** contiene {min} */
    corto: string;
    /** contiene {max} */
    lungo: string;
    email: string;
    troppe: string;
    captcha: string;
    /** il controllo anti-bot non ha ancora dato il token */
    attesa: string;
    /** il controllo anti-bot non si carica (blocco del browser o della rete) */
    bloccato: string;
    disattivato: string;
    generico: string;
  };
};

export function feedbackLabels(dict: Dictionary): FeedbackLabels {
  const f = dict.feedback;
  return {
    button: f.button,
    kicker: f.kicker,
    title: f.title,
    intro: f.intro,
    question: f.question,
    messagePlaceholder: f.messagePlaceholder,
    lengthHint: f.lengthHint,
    nameLabel: f.nameLabel,
    namePlaceholder: f.namePlaceholder,
    nameHint: f.nameHint,
    emailLabel: f.emailLabel,
    emailPlaceholder: f.emailPlaceholder,
    emailHint: f.emailHint,
    pageNote: f.pageNote,
    privacyLink: f.privacyLink,
    send: f.send,
    sending: f.sending,
    close: f.close,
    thanksTitle: f.thanksTitle,
    thanksText: f.thanksText,
    thanksEmail: f.thanksEmail,
    another: f.another,
    alternatives: f.alternatives,
    keepText: f.keepText,
    errors: {
      corto: f.errors.corto,
      lungo: f.errors.lungo,
      email: f.errors.email,
      troppe: f.errors.troppe,
      captcha: f.errors.captcha,
      attesa: f.errors.attesa,
      bloccato: f.errors.bloccato,
      disattivato: f.errors.disattivato,
      generico: f.errors.generico,
    },
  };
}
