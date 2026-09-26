import type { Locale } from "./i18n";
import type { InboxErrorCode } from "./community/messages";

/**
 * Etichette della casella messaggi utente ↔ staff (26/09/2026, pacchetto INBOX): sezione "Messaggi" di /account,
 * conversazione, area staff, menu dell'account, riquadro dei feedback, link dello staff su /u/<nome> e paragrafo
 * della privacy. Stanno qui e non nei dizionari, come `linkLabels.ts`: un modulo solo, nelle tre lingue insieme;
 * `en` è il tipo di riferimento. Il file importa solo tipi, quindi va bene anche nei componenti client.
 *
 * Le etichette piccole del menu dell'account, del riquadro dei feedback e del link dello staff su /u stanno in
 * `inboxNavLabels.ts`: finiscono nel bundle di ogni pagina, queste solo nelle pagine private e nei loro moduli.
 * Spagnolo neutro col tú (docs/spagnolo.md): "el staff", "bandeja de mensajes".
 */

/* ---------- pagine private, moduli, privacy ---------- */

const en = {
  meta: {
    threadTitle: "Conversation with the staff",
    threadDescription: "A private conversation between you and the OriginsMeta staff: only you and the staff can read it.",
    staffTitle: "Staff inbox",
    staffDescription: "Every conversation between users and the OriginsMeta staff. Only the staff can see this page.",
    listTitle: "Your conversations with the staff",
    listDescription: "All your private conversations with the OriginsMeta staff: only you and the staff can read them.",
  },
  section: {
    title: "Messages",
    intro:
      "Your conversations with the OriginsMeta staff: only you and the staff can read them. We don't send notifications outside the site: new replies show up here and next to your profile menu.",
    unreadOne: "1 conversation with a new reply.",
    unreadMany: "{n} conversations with new replies.",
    empty: "No messages yet. Write to us if you need help, have an idea or want to report a problem.",
    write: "Write to the staff",
    staffArea: "Staff inbox",
    unavailable: "Messages aren't available right now. Try again in a few minutes.",
    newBadge: "New reply",
    /** link da /account all'elenco completo, quando le conversazioni sono più di una pagina */
    older: "Older conversations",
    /** H1 di /account/messages */
    allTitle: "All your conversations",
  },
  /** chi ha aperto la conversazione, visto dall'utente */
  origin: { user: "Your message", staff: "From the staff", feedback: "Your feedback" },
  /** lo stesso, visto dallo staff */
  originStaff: { user: "From the user", staff: "Started by the staff", feedback: "Feedback" },
  status: { open: "Open", closed: "Closed" },
  thread: {
    back: "Back to your profile",
    backStaff: "Back to the staff inbox",
    you: "You",
    staff: "OriginsMeta staff",
    deletedUser: "Deleted account",
    /** {date} */
    started: "Started on {date}",
    closedNote: "The staff has closed this conversation. If you write again, it will reopen.",
    closedNoteStaff: "Closed conversation: a new message from either side reopens it.",
    replyLabel: "Your reply",
    replyPlaceholder: "Write your message…",
    send: "Send",
    sending: "Sending…",
    sent: "Message sent.",
    close: "Close conversation",
    reopen: "Reopen conversation",
    user: "User",
    publicProfile: "Public profile",
    /** {n} */
    olderHidden: "Only the latest {n} messages are shown.",
    staffNote: "In their inbox the user sees your replies signed “OriginsMeta staff”.",
    utcLabel: "UTC",
  },
  form: {
    subject: "Subject",
    subjectPlaceholder: "e.g. A problem with the deck builder",
    message: "Message",
    messagePlaceholder: "Tell us everything: the staff reads every message.",
    /** {max} */
    hint: "Plain text, up to {max} characters.",
    send: "Send to the staff",
    to: "Username",
    toPlaceholder: "e.g. coachcrono",
    toHint: "The name after the @ on the user's profile.",
    newToUser: "New message to a user",
    sendToUser: "Send message",
    /** {hour} messaggi l'ora, {day} conversazioni nuove al giorno */
    limits: "Up to {hour} messages an hour and {day} new conversations a day.",
  },
  staff: {
    kicker: "Staff",
    title: "Staff inbox",
    intro:
      "Every conversation between users and the staff: feedback sent while signed in, messages users write to us and the ones we start. Users read our replies in their inbox on the site, signed “OriginsMeta staff”.",
    filtersLabel: "Show",
    filters: { unread: "To read", open: "Open", closed: "Closed", all: "All" },
    empty: "No conversations here.",
    waiting: "Waiting for a reply",
    replied: "Replied",
    newer: "Newer",
    older: "Older",
    /** {n} */
    page: "Page {n}",
  },
  errors: {
    empty: "Write a message before sending it.",
    /** {max} */
    tooLong: "The message is too long: up to {max} characters.",
    emptySubject: "Add a subject.",
    /** {max} */
    subjectTooLong: "The subject is too long: up to {max} characters.",
    tooMany: "You've sent a lot of messages in the last hour: wait a little and try again.",
    tooManyThreads: "You've opened a lot of conversations today: reply in one you already have, or try again tomorrow.",
    userNotFound: "No user has this username.",
    badUsername: "Write the username as it appears after the @ (letters, numbers and hyphens).",
    self: "You can't write to yourself.",
    notFound: "This conversation doesn't exist or isn't yours.",
    notLoggedIn: "Sign in to send messages.",
    unavailable: "Messages aren't available right now. Try again in a few minutes.",
    db: "Something went wrong. Your text is still here: try again.",
  } satisfies Record<InboxErrorCode, string>,
  /** oggetto della conversazione che nasce da un feedback mandato con l'accesso fatto */
  feedbackSubject: "Your feedback",
  /** in coda al paragrafo #feedback della privacy, con il link al paragrafo #messages */
  privacyFeedback:
    "If you're signed in when you send feedback, it is linked to your account: the staff sees your username (in the Discord channel too) and we also save it in your inbox for as long as your account exists",
  privacyFeedbackLink: "see Messages",
  /** paragrafo della privacy (#messages) */
  privacy:
    "Messages: if you have an account, your profile has an inbox to write to the OriginsMeta staff and read our replies. We store your conversations on Supabase (servers in Ireland, EU), with the text, the date and who wrote each message; only you and the staff can read them, and they are never published. If you send feedback from the “Feedback” box while signed in, we also save it here as a conversation, so we can reply to you on the site. When you write to us, a notice with your username, the subject and the start of the message reaches a private channel of the staff's Discord server (Discord Inc., United States). We don't send you emails or notifications outside the site: new replies only show up in your profile. Messages are kept as long as your account exists and are deleted with it; to have a conversation deleted earlier, write to staff@originsmeta.com.",
};

export type InboxLabels = typeof en;

export const inboxLabels: Record<Locale, InboxLabels> = {
  en,
  it: {
    meta: {
      threadTitle: "Conversazione con lo staff",
      threadDescription: "Una conversazione privata tra te e lo staff di OriginsMeta: la potete leggere solo tu e lo staff.",
      staffTitle: "Messaggi dello staff",
      staffDescription: "Tutte le conversazioni tra gli utenti e lo staff di OriginsMeta. Questa pagina la vede solo lo staff.",
      listTitle: "Le tue conversazioni con lo staff",
      listDescription: "Tutte le tue conversazioni private con lo staff di OriginsMeta: le potete leggere solo tu e lo staff.",
    },
    section: {
      title: "Messaggi",
      intro:
        "Le tue conversazioni con lo staff di OriginsMeta: le potete leggere solo tu e lo staff. Non mandiamo avvisi fuori dal sito: le risposte nuove compaiono qui e accanto al menu del tuo profilo.",
      unreadOne: "1 conversazione con una risposta nuova.",
      unreadMany: "{n} conversazioni con risposte nuove.",
      empty: "Ancora nessun messaggio. Scrivici se ti serve aiuto, se hai un'idea o se vuoi segnalarci un problema.",
      write: "Scrivi allo staff",
      staffArea: "Messaggi dello staff",
      unavailable: "I messaggi non sono disponibili in questo momento. Riprova tra qualche minuto.",
      newBadge: "Risposta nuova",
      older: "Conversazioni meno recenti",
      allTitle: "Tutte le tue conversazioni",
    },
    origin: { user: "Il tuo messaggio", staff: "Dallo staff", feedback: "Il tuo feedback" },
    originStaff: { user: "Dall'utente", staff: "Aperta dallo staff", feedback: "Feedback" },
    status: { open: "Aperta", closed: "Chiusa" },
    thread: {
      back: "Torna al tuo profilo",
      backStaff: "Torna ai messaggi dello staff",
      you: "Tu",
      staff: "Staff di OriginsMeta",
      deletedUser: "Account eliminato",
      started: "Iniziata il {date}",
      closedNote: "Lo staff ha chiuso questa conversazione. Se scrivi di nuovo, si riapre.",
      closedNoteStaff: "Conversazione chiusa: un messaggio nuovo, da una parte o dall'altra, la riapre.",
      replyLabel: "La tua risposta",
      replyPlaceholder: "Scrivi il tuo messaggio…",
      send: "Invia",
      sending: "Invio in corso…",
      sent: "Messaggio inviato.",
      close: "Chiudi la conversazione",
      reopen: "Riapri la conversazione",
      user: "Utente",
      publicProfile: "Profilo pubblico",
      olderHidden: "Sono mostrati solo gli ultimi {n} messaggi.",
      staffNote: "Nella sua casella l'utente vede le tue risposte firmate “Staff di OriginsMeta”.",
      utcLabel: "UTC",
    },
    form: {
      subject: "Oggetto",
      subjectPlaceholder: "es. Un problema con il deck builder",
      message: "Messaggio",
      messagePlaceholder: "Raccontaci tutto: lo staff legge ogni messaggio.",
      hint: "Testo semplice, fino a {max} caratteri.",
      send: "Invia allo staff",
      to: "Nome utente",
      toPlaceholder: "es. coachcrono",
      toHint: "Il nome dopo la @ nel profilo dell'utente.",
      newToUser: "Nuovo messaggio a un utente",
      sendToUser: "Invia il messaggio",
      limits: "Fino a {hour} messaggi l'ora e {day} conversazioni nuove al giorno.",
    },
    staff: {
      kicker: "Staff",
      title: "Messaggi dello staff",
      intro:
        "Tutte le conversazioni tra gli utenti e lo staff: i feedback mandati con l'accesso fatto, i messaggi che gli utenti ci scrivono e quelli che iniziamo noi. Gli utenti leggono le nostre risposte nella loro casella sul sito, firmate “Staff di OriginsMeta”.",
      filtersLabel: "Mostra",
      filters: { unread: "Da leggere", open: "Aperte", closed: "Chiuse", all: "Tutte" },
      empty: "Nessuna conversazione qui.",
      waiting: "Aspetta una risposta",
      replied: "Risposto",
      newer: "Più recenti",
      older: "Meno recenti",
      page: "Pagina {n}",
    },
    errors: {
      empty: "Scrivi un messaggio prima di inviarlo.",
      tooLong: "Il messaggio è troppo lungo: al massimo {max} caratteri.",
      emptySubject: "Aggiungi un oggetto.",
      subjectTooLong: "L'oggetto è troppo lungo: al massimo {max} caratteri.",
      tooMany: "Hai mandato molti messaggi nell'ultima ora: aspetta un po' e riprova.",
      tooManyThreads: "Oggi hai aperto molte conversazioni: rispondi in una che hai già, oppure riprova domani.",
      userNotFound: "Nessun utente ha questo nome utente.",
      badUsername: "Scrivi il nome utente come compare dopo la @ (lettere, cifre e trattini).",
      self: "Non puoi scrivere a te stesso.",
      notFound: "Questa conversazione non esiste o non è tua.",
      notLoggedIn: "Accedi per mandare messaggi.",
      unavailable: "I messaggi non sono disponibili in questo momento. Riprova tra qualche minuto.",
      db: "Qualcosa è andato storto. Il tuo testo è ancora qui: riprova.",
    },
    feedbackSubject: "Il tuo feedback",
    privacyFeedback:
      "Se hai fatto l'accesso quando mandi un feedback, il messaggio è collegato al tuo account: lo staff vede il tuo nome utente (anche nel canale Discord) e lo salviamo anche nella tua casella messaggi finché esiste il tuo account",
    privacyFeedbackLink: "vedi Messaggi",
    privacy:
      "Messaggi: se hai un account, nel tuo profilo c'è una casella messaggi per scrivere allo staff di OriginsMeta e leggere le nostre risposte. Conserviamo le tue conversazioni su Supabase (server in Irlanda, UE), con il testo, la data e chi ha scritto ogni messaggio; le potete leggere solo tu e lo staff e non vengono mai pubblicate. Se mandi un feedback dal riquadro “Dicci la tua” dopo aver fatto l'accesso, lo salviamo anche qui come conversazione, così possiamo risponderti sul sito. Quando ci scrivi, un avviso con il tuo nome utente, l'oggetto e l'inizio del messaggio arriva in un canale privato del server Discord dello staff (Discord Inc., Stati Uniti). Non ti mandiamo email né notifiche fuori dal sito: le risposte nuove compaiono solo nel tuo profilo. I messaggi restano finché esiste il tuo account e si cancellano con lui; per far cancellare prima una conversazione scrivi a staff@originsmeta.com.",
  },
  es: {
    meta: {
      threadTitle: "Conversación con el staff",
      threadDescription: "Una conversación privada entre tú y el staff de OriginsMeta: solo pueden leerla tú y el staff.",
      staffTitle: "Mensajes del staff",
      staffDescription: "Todas las conversaciones entre los usuarios y el staff de OriginsMeta. Solo el staff ve esta página.",
      listTitle: "Tus conversaciones con el staff",
      listDescription: "Todas tus conversaciones privadas con el staff de OriginsMeta: solo pueden leerlas tú y el staff.",
    },
    section: {
      title: "Mensajes",
      intro:
        "Tus conversaciones con el staff de OriginsMeta: solo pueden leerlas tú y el staff. No enviamos avisos fuera del sitio: las respuestas nuevas aparecen aquí y junto al menú de tu perfil.",
      unreadOne: "1 conversación con una respuesta nueva.",
      unreadMany: "{n} conversaciones con respuestas nuevas.",
      empty: "Todavía no hay mensajes. Escríbenos si necesitas ayuda, si tienes una idea o si quieres avisarnos de un problema.",
      write: "Escribir al staff",
      staffArea: "Mensajes del staff",
      unavailable: "Los mensajes no están disponibles en este momento. Inténtalo de nuevo en unos minutos.",
      newBadge: "Respuesta nueva",
      older: "Conversaciones más antiguas",
      allTitle: "Todas tus conversaciones",
    },
    origin: { user: "Tu mensaje", staff: "Del staff", feedback: "Tu comentario" },
    originStaff: { user: "Del usuario", staff: "Iniciada por el staff", feedback: "Comentario" },
    status: { open: "Abierta", closed: "Cerrada" },
    thread: {
      back: "Volver a tu perfil",
      backStaff: "Volver a los mensajes del staff",
      you: "Tú",
      staff: "Staff de OriginsMeta",
      deletedUser: "Cuenta eliminada",
      started: "Iniciada el {date}",
      closedNote: "El staff cerró esta conversación. Si vuelves a escribir, se reabre.",
      closedNoteStaff: "Conversación cerrada: un mensaje nuevo, de cualquiera de las dos partes, la reabre.",
      replyLabel: "Tu respuesta",
      replyPlaceholder: "Escribe tu mensaje…",
      send: "Enviar",
      sending: "Enviando…",
      sent: "Mensaje enviado.",
      close: "Cerrar la conversación",
      reopen: "Reabrir la conversación",
      user: "Usuario",
      publicProfile: "Perfil público",
      olderHidden: "Solo se muestran los últimos {n} mensajes.",
      staffNote: "En su bandeja, el usuario ve tus respuestas firmadas “Staff de OriginsMeta”.",
      utcLabel: "UTC",
    },
    form: {
      subject: "Asunto",
      subjectPlaceholder: "p. ej., Un problema con el Deck builder",
      message: "Mensaje",
      messagePlaceholder: "Cuéntanoslo todo: el staff lee todos los mensajes.",
      hint: "Texto sin formato, hasta {max} caracteres.",
      send: "Enviar al staff",
      to: "Nombre de usuario",
      toPlaceholder: "p. ej., coachcrono",
      toHint: "El nombre que aparece después de la @ en el perfil del usuario.",
      newToUser: "Nuevo mensaje a un usuario",
      sendToUser: "Enviar el mensaje",
      limits: "Hasta {hour} mensajes por hora y {day} conversaciones nuevas al día.",
    },
    staff: {
      kicker: "Staff",
      title: "Mensajes del staff",
      intro:
        "Todas las conversaciones entre los usuarios y el staff: los comentarios enviados con la sesión iniciada, los mensajes que nos escriben los usuarios y los que empezamos nosotros. Los usuarios leen nuestras respuestas en su bandeja del sitio, firmadas “Staff de OriginsMeta”.",
      filtersLabel: "Mostrar",
      filters: { unread: "Sin leer", open: "Abiertas", closed: "Cerradas", all: "Todas" },
      empty: "No hay conversaciones aquí.",
      waiting: "Espera una respuesta",
      replied: "Respondida",
      newer: "Más recientes",
      older: "Más antiguas",
      page: "Página {n}",
    },
    errors: {
      empty: "Escribe un mensaje antes de enviarlo.",
      tooLong: "El mensaje es demasiado largo: como máximo {max} caracteres.",
      emptySubject: "Añade un asunto.",
      subjectTooLong: "El asunto es demasiado largo: como máximo {max} caracteres.",
      tooMany: "Enviaste muchos mensajes en la última hora: espera un poco y vuelve a intentarlo.",
      tooManyThreads: "Hoy abriste muchas conversaciones: responde en una que ya tengas o vuelve a intentarlo mañana.",
      userNotFound: "Ningún usuario tiene este nombre de usuario.",
      badUsername: "Escribe el nombre de usuario tal como aparece después de la @ (letras, números y guiones).",
      self: "No puedes escribirte a ti mismo.",
      notFound: "Esta conversación no existe o no es tuya.",
      notLoggedIn: "Inicia sesión para enviar mensajes.",
      unavailable: "Los mensajes no están disponibles en este momento. Inténtalo de nuevo en unos minutos.",
      db: "Algo salió mal. Tu texto sigue aquí: vuelve a intentarlo.",
    },
    feedbackSubject: "Tu comentario",
    privacyFeedback:
      "Si has iniciado sesión cuando envías un comentario, queda vinculado a tu cuenta: el staff ve tu nombre de usuario (también en el canal de Discord) y además lo guardamos en tu bandeja de mensajes mientras exista tu cuenta",
    privacyFeedbackLink: "consulta Mensajes",
    privacy:
      "Mensajes: si tienes una cuenta, tu perfil tiene una bandeja de mensajes para escribir al staff de OriginsMeta y leer nuestras respuestas. Guardamos tus conversaciones en Supabase (servidores en Irlanda, UE), con el texto, la fecha y quién escribió cada mensaje; solo pueden leerlas tú y el staff, y nunca se publican. Si envías un comentario desde el recuadro “Tu opinión” con la sesión iniciada, también lo guardamos aquí como conversación, para poder responderte en el sitio. Cuando nos escribes, un aviso con tu nombre de usuario, el asunto y el comienzo del mensaje llega a un canal privado del servidor de Discord del staff (Discord Inc., Estados Unidos). No te enviamos correos electrónicos ni notificaciones fuera del sitio: las respuestas nuevas solo aparecen en tu perfil. Los mensajes se conservan mientras exista tu cuenta y se eliminan con ella; para que eliminemos antes una conversación, escribe a staff@originsmeta.com.",
  },
};
