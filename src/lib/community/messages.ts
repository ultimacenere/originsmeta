/**
 * Casella messaggi utente ↔ staff (26/09/2026, richiesta di Pierluigi: "nella sezione profilo per ogni utente una
 * casella messaggi, così possiamo scrivere ai nostri utenti nel sito e possiamo rispondere a chi ci dà i feedback
 * direttamente da lì"). Schema e RPC in `supabase/creator-INBOX.sql`.
 *
 * Qui solo funzioni pure, senza import a runtime: le esegue `node --test` (messages.test.ts) e le usano sia il server
 * (Server Action, rotte, pagine) sia il browser (moduli, numero dei non letti). Le regole vere stanno nel database
 * (lunghezze, limite di frequenza, chi è dello staff): queste funzioni servono a dire di no prima, con un messaggio
 * chiaro, e a mostrare i dati.
 */

/** Lunghezza massima di un messaggio, in caratteri (come il vincolo `messages.body` del database). */
export const MESSAGE_MAX = 4000;
/** Lunghezza massima dell'oggetto di una conversazione (vincolo `conversations.subject`). */
export const SUBJECT_MAX = 120;
/** Anteprima dell'ultimo messaggio negli elenchi (colonna `last_preview`). */
export const PREVIEW_MAX = 160;
/** Limiti di frequenza del database (`inbox_rate_check`): li cita l'interfaccia, li applica il database. */
export const MESSAGES_PER_HOUR = 20;
export const CONVERSATIONS_PER_DAY = 10;
/** Quanta parte di un messaggio arriva nell'avviso Discord dello staff: mai il testo completo di un messaggio lungo. */
export const DISCORD_EXCERPT_MAX = 300;
/** Conversazioni per pagina nell'area staff e nella casella dell'utente. */
export const CONVERSATIONS_PAGE = 30;
/** Messaggi mostrati in una conversazione (gli ultimi). */
export const THREAD_MESSAGES_MAX = 300;

/** Chi ha aperto la conversazione: l'utente, lo staff o il riquadro dei feedback con l'accesso fatto. */
export type ConversationOrigin = "user" | "staff" | "feedback";
export type ConversationStatus = "open" | "closed";

/** Lunghezza in caratteri visibili (un'emoji conta uno), come i contatori dei moduli e `char_length` di Postgres. */
export const textLength = (s: string) => Array.from(s).length;

/**
 * Testo semplice, come `testoSemplice` di formGuard.ts (qui ricopiata: questo modulo non importa nulla): a capo
 * uniformi, niente caratteri di controllo né caratteri invisibili di direzione, niente tag HTML, niente spazi prima
 * di un a capo, al massimo una riga vuota di fila. Il resto resta com'è: il sito lo mostra sempre come testo.
 */
export function plainMessage(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Oggetto su una riga sola: stesso testo semplice, con ogni spazio o a capo ridotto a uno spazio. */
export function plainSubject(raw: string): string {
  return plainMessage(raw).replace(/\s+/g, " ").trim();
}

export type MessageCheck = { ok: true; body: string } | { ok: false; error: "empty" | "tooLong" };
export type SubjectCheck = { ok: true; subject: string } | { ok: false; error: "emptySubject" | "subjectTooLong" };

export function checkMessage(raw: unknown): MessageCheck {
  const body = typeof raw === "string" ? plainMessage(raw) : "";
  if (!body) return { ok: false, error: "empty" };
  if (textLength(body) > MESSAGE_MAX) return { ok: false, error: "tooLong" };
  return { ok: true, body };
}

export function checkSubject(raw: unknown): SubjectCheck {
  const subject = typeof raw === "string" ? plainSubject(raw) : "";
  if (!subject) return { ok: false, error: "emptySubject" };
  if (textLength(subject) > SUBJECT_MAX) return { ok: false, error: "subjectTooLong" };
  return { ok: true, subject };
}

/**
 * Nome utente scritto dallo staff in "Nuovo messaggio a un utente": senza @ e spazi, nella forma dei nomi utente
 * del sito (lettere, cifre e trattini, come li crea `handle_new_user`). null se non può essere un nome utente.
 */
export function cleanUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().replace(/^@+/, "").trim();
  return /^[a-z0-9][a-z0-9-]{0,59}$/i.test(u) ? u : null;
}

/**
 * Oggetto della conversazione che nasce da un feedback mandato con l'accesso fatto: l'etichetta nella lingua di chi
 * scrive e, se c'è, la pagina da cui scriveva (utile allo staff), entro la lunghezza massima dell'oggetto.
 */
export function feedbackSubject(label: string, page: string | null | undefined): string {
  const base = plainSubject(label) || "Feedback";
  const full = page ? `${base} · ${page}` : base;
  return textLength(full) <= SUBJECT_MAX ? full : Array.from(full).slice(0, SUBJECT_MAX - 1).join("") + "…";
}

/**
 * Estratto di un messaggio su una riga (avviso Discord dello staff, anteprime): gli spazi si riducono a uno e un
 * testo più lungo di `max` si taglia all'ultima parola intera, con l'ellissi. Il risultato non supera mai `max`.
 */
export function excerpt(text: string, max = DISCORD_EXCERPT_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(flat);
  if (chars.length <= max) return flat;
  const cut = chars.slice(0, max - 1).join("");
  const space = cut.lastIndexOf(" ");
  const head = space > (max - 1) * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.!?…–—-]+$/, "")}…`;
}

/**
 * Codici d'errore mostrati dall'interfaccia. Le RPC del database rispondono con `raise exception '<codice>'`
 * (supabase/creator-INBOX.sql): `inboxErrorCode` li traduce. `unavailable` = tabelle o funzioni che non esistono
 * ancora (migrazione non applicata) o community spenta; `db` = ogni altro errore.
 */
export type InboxErrorCode =
  | "empty"
  | "tooLong"
  | "emptySubject"
  | "subjectTooLong"
  | "tooMany"
  | "tooManyThreads"
  | "userNotFound"
  | "badUsername"
  | "self"
  | "notFound"
  | "notLoggedIn"
  | "unavailable"
  | "db";

const RPC_ERRORS: Record<string, InboxErrorCode> = {
  empty_message: "empty",
  message_too_long: "tooLong",
  empty_subject: "emptySubject",
  subject_too_long: "subjectTooLong",
  too_many_messages: "tooMany",
  too_many_conversations: "tooManyThreads",
  user_not_found: "userNotFound",
  self: "self",
  not_found: "notFound",
  forbidden: "notFound",
  bad_status: "db",
  not_logged_in: "notLoggedIn",
};

/**
 * Codice d'errore dell'interfaccia da un errore di Supabase. Postgres: 42883 funzione inesistente, 42P01 tabella
 * inesistente, 42703 colonna inesistente; PostgREST: PGRST202 funzione non trovata, PGRST205 tabella non trovata.
 */
export function inboxErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): InboxErrorCode {
  if (!error) return "db";
  const code = error.code ?? "";
  if (["42883", "42P01", "42703", "PGRST202", "PGRST205"].includes(code)) return "unavailable";
  const msg = (error.message ?? "").trim();
  return Object.hasOwn(RPC_ERRORS, msg) ? RPC_ERRORS[msg] : "db";
}

/** Stato della casella per il menu dell'account (rotta /api/inbox/status). */
export type InboxStatus = { unread: number; staff: boolean; staffUnread: number };

const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : 0);

/**
 * Stato letto dal JSON: quello della RPC `inbox_status` (`staff_unread`) o quello della rotta (`staffUnread`).
 * Numeri negativi o strani valgono zero; senza un oggetto, null.
 */
export function parseInboxStatus(json: unknown): InboxStatus | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const staff = o.staff === true;
  return { unread: count(o.unread), staff, staffUnread: staff ? count(o.staffUnread ?? o.staff_unread) : 0 };
}

/** Numero da mostrare accanto all'avatar: le proprie conversazioni da leggere più, per lo staff, quelle degli utenti. */
export function badgeCount(status: InboxStatus | null | undefined): number {
  if (!status) return 0;
  return status.unread + (status.staff ? status.staffUnread : 0);
}

/** Testo del pallino: niente sotto 1, "9+" oltre 9 (il numero intero resta nell'etichetta per i lettori di schermo). */
export function badgeText(n: number): string {
  if (!Number.isFinite(n) || n < 1) return "";
  return n > 9 ? "9+" : String(Math.floor(n));
}

/** Filtri dell'area staff: da leggere, aperte (il valore di partenza), chiuse, tutte. */
export const STAFF_FILTERS = ["unread", "open", "closed", "all"] as const;
export type StaffFilter = (typeof STAFF_FILTERS)[number];

export function staffFilter(raw: unknown): StaffFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (STAFF_FILTERS as readonly unknown[]).includes(v) ? (v as StaffFilter) : "open";
}

/** Numero di pagina da `?page=`: intero da 1 in su, 1 per tutto il resto (anche numeri enormi). */
export function pageNumber(raw: unknown): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof v === "string" && /^\d{1,4}$/.test(v) ? Number(v) : 1;
  return n >= 1 ? n : 1;
}

/** Chi ha scritto un messaggio, dal punto di vista di chi guarda la conversazione. */
export type AuthorKind = "you" | "staff" | "user";

export function authorKind(message: { from_staff: boolean; author_id: string | null }, viewerId: string, view: "user" | "staff"): AuthorKind {
  if (message.author_id && message.author_id === viewerId) return "you";
  if (view === "user") return message.from_staff ? "staff" : "you";
  return message.from_staff ? "staff" : "user";
}

/**
 * Data dell'ultimo messaggio mostrato nella pagina: la conversazione si segna come letta fino a lì (`inbox_mark_read`),
 * così un messaggio arrivato dopo resta da leggere. Le date di Supabase arrivano in ISO 8601 con i microsecondi e si
 * confrontano come istanti, non come stringhe.
 */
export function lastSeen(messages: readonly { created_at: string }[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const m of messages) {
    const ms = Date.parse(m.created_at);
    if (Number.isFinite(ms) && ms >= bestMs) {
      best = m.created_at;
      bestMs = ms;
    }
  }
  return best;
}

/** Indirizzi delle due viste di una conversazione: quella dell'utente (in /account) e quella dello staff. */
export const userThreadPath = (locale: string, id: string) => `/${locale}/account/messages/${id}`;
export const staffThreadPath = (locale: string, id: string) => `/${locale}/account/staff/messages/${id}`;
export const staffInboxPath = (locale: string) => `/${locale}/account/staff/messages`;

/** Riempie i segnaposto {nome} di un'etichetta. */
export function fillInbox(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : all));
}
