import type { Locale } from "./i18n";

/**
 * Etichette piccole della casella messaggi (26/09/2026, pacchetto INBOX) per i componenti che stanno su ogni pagina:
 * numero dei non letti e voci del menu dell'account (header), nota del riquadro dei feedback, link "Scrivi a questo
 * utente" dello staff su /u/<nome>. In un file a parte da `inboxLabels.ts` perché finiscono nel bundle di tutte le
 * pagine: qui solo poche righe nelle tre lingue. `en` è il tipo di riferimento; il file importa solo un tipo.
 */

const navEn = {
  messages: "Messages",
  staffInbox: "Staff inbox",
  unreadOne: "1 unread conversation",
  /** {n} = conversazioni con messaggi da leggere */
  unreadMany: "{n} unread conversations",
  /** link visibile solo allo staff sulla pagina pubblica di un iscritto */
  writeToUser: "Write to this user",
  /** riquadro dei feedback, sotto il modulo, a chi ha fatto l'accesso (solo se la casella risponde) */
  feedbackNote: "You're signed in: your feedback will be linked to your account and we'll reply in your inbox on OriginsMeta.",
  /** riquadro dei feedback, dopo l'invio, se il messaggio è stato salvato anche nella casella */
  feedbackSaved: "We also saved it in your inbox: you'll find our reply there.",
  /** riquadro dei feedback, dopo l'invio, se la nota prometteva la casella ma il salvataggio non è riuscito */
  feedbackNotSaved: "This time we couldn't save it in your inbox: if you'd like a reply, write to the staff from there.",
  openInbox: "Open your inbox",
};

export type InboxNavLabels = typeof navEn;

export const inboxNavLabels: Record<Locale, InboxNavLabels> = {
  en: navEn,
  it: {
    messages: "Messaggi",
    staffInbox: "Messaggi dello staff",
    unreadOne: "1 conversazione da leggere",
    unreadMany: "{n} conversazioni da leggere",
    writeToUser: "Scrivi a questo utente",
    feedbackNote: "Hai fatto l'accesso: il feedback sarà collegato al tuo account e ti risponderemo nella tua casella messaggi su OriginsMeta.",
    feedbackSaved: "L'abbiamo salvato anche nella tua casella messaggi: la nostra risposta arriverà lì.",
    feedbackNotSaved: "Questa volta non siamo riusciti a salvarlo nella tua casella messaggi: se vuoi una risposta, scrivi allo staff da lì.",
    openInbox: "Apri la casella messaggi",
  },
  es: {
    messages: "Mensajes",
    staffInbox: "Mensajes del staff",
    unreadOne: "1 conversación sin leer",
    unreadMany: "{n} conversaciones sin leer",
    writeToUser: "Escribir a este usuario",
    feedbackNote: "Has iniciado sesión: tu comentario quedará vinculado a tu cuenta y te responderemos en tu bandeja de mensajes de OriginsMeta.",
    feedbackSaved: "También lo guardamos en tu bandeja de mensajes: allí encontrarás nuestra respuesta.",
    feedbackNotSaved: "Esta vez no pudimos guardarlo en tu bandeja de mensajes: si quieres una respuesta, escribe al staff desde allí.",
    openInbox: "Abrir la bandeja de mensajes",
  },
};

/**
 * Etichette del menu per una lingua scritta come stringa (l'header passa `locale: string`). Senza importare `isLocale`
 * da i18n.ts, che porterebbe nel bundle del browser tutti i dizionari: basta guardare le chiavi di questo oggetto.
 */
export function navLabelsFor(locale: string): InboxNavLabels {
  return Object.hasOwn(inboxNavLabels, locale) ? inboxNavLabels[locale as Locale] : navEn;
}
