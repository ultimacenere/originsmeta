/**
 * Nome mostrato e nome utente scelti dall'iscritto (23/10/2026, Pierluigi: "diamo la possibilità che si possa cambiare
 * il nickname profilo all'interno del sito"). Fino a quel giorno li cambiava solo lo staff con scripts/set-username.mjs
 * (segnalazione di Fabio/EagleAxe93 del 06/10/2026: chi entra la prima volta con il link via email nasce con il nome
 * preso dalla parte prima della @, e l'accesso con Discord fatto dopo non lo cambia).
 *
 * Funzioni pure, senza dipendenze. Le regole sono le stesse della funzione `profile_set_names` del blocco
 * "23/10/2026: NOME UTENTE" di supabase/schema.sql, che decide davvero: `profileNames.test.ts` confronta espressioni,
 * elenchi e numeri con l'SQL. Il modulo di /account/profile le usa solo per dire subito che cosa non va.
 *
 * - Nome mostrato: da 2 a 40 caratteri, spazi in fila ridotti a uno, niente caratteri di controllo né invisibili; per
 *   chi non è dello staff niente parole dello staff e del gioco (`displayNameReserved`) e niente nomi uguali al nome
 *   utente di un Creator, Autore, Pro, Staff o admin (lo controlla solo il database). Si cambia quando si vuole, con 10 secondi fra due cambi.
 * - Nome utente: è l'indirizzo della pagina (/u/<nome>, /@<nome>). Da 3 a 39 caratteri fra minuscole, cifre e trattini,
 *   né all'inizio né alla fine un trattino, mai due di fila; mai `bot-<n>` (i bot di prova di seed-bots.mjs) né i nomi
 *   riservati; libero, cioè né di un altro profilo né un vecchio nome di un altro. Una volta ogni 30 giorni (lo staff
 *   no). Il vecchio nome resta dell'account: i link di prima portano alla pagina nuova con un 308 e nessun altro lo prende.
 */

/** Nome utente: la forma ammessa per un nome scelto dal sito (in SQL con `position('--' in u) = 0` per i trattini doppi). */
export const USERNAME_RE = "^[a-z0-9][a-z0-9-]{1,37}[a-z0-9]$";
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 39;
/** I nomi dei bot di prova (scripts/seed-bots.mjs, `isSeedBot` in achievements.ts): mai scelti da un iscritto. */
export const BOT_USERNAME_RE = "^bot-[0-9]+(-[0-9]+)?$";
/** Giorni fra due cambi del nome utente (lo staff non ha il limite). */
export const USERNAME_CHANGE_DAYS = 30;

/** Nomi utente riservati (uguali, per chi non è dello staff). */
export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "anonymous",
  "bot",
  "bots",
  "deleted",
  "everyone",
  "help",
  "here",
  "koin",
  "mod",
  "moderator",
  "mods",
  "null",
  "official",
  "origins",
  "owner",
  "root",
  "staff",
  "support",
  "system",
  "team",
  "undefined",
] as const;

/** Pezzi che un nome utente o un nome mostrato non possono contenere (per chi non è dello staff): il sito e il gioco. */
export const RESERVED_NAME_PARTS = ["originsmeta", "originstcg", "koingames"] as const;

/** Nome mostrato: limiti di lunghezza (caratteri, dopo la pulizia). */
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;
/** Secondi fra due cambi del nome mostrato. */
export const DISPLAY_NAME_MIN_INTERVAL_S = 10;

/**
 * Caratteri vietati nel nome mostrato: di controllo, invisibili e di direzione del testo (un nome che sembra vuoto o che
 * si legge al contrario), riempitivi coreani. Una classe sola, uguale in SQL: gli escape `\uXXXX` valgono anche in
 * Postgres (espressioni regolari avanzate).
 */
export const DISPLAY_NAME_BAD_CHARS = "[\\u0001-\\u001f\\u007f-\\u009f\\u00ad\\u034f\\u061c\\u115f\\u1160\\u17b4\\u17b5\\u180e\\u200b-\\u200f\\u2028-\\u202e\\u2060-\\u206f\\u3164\\ufeff\\uffa0]";

/**
 * Parole che il nome mostrato non può essere (normalizzato: minuscolo, solo lettere latine e cifre), per chi non è dello
 * staff: chi lo legge accanto a un mazzo non deve pensare che parli lo staff. Il ruolo Staff vero lo mostra la pastiglia.
 */
export const RESERVED_DISPLAY_WORDS = ["admin", "administrator", "koin", "mod", "moderator", "official", "origins", "staff", "support", "system", "team"] as const;
/** Pezzi che il nome mostrato normalizzato non può contenere (in più di `RESERVED_NAME_PARTS`). */
export const RESERVED_DISPLAY_PARTS = ["admin", "moderator", "staff"] as const;

const usernameRe = new RegExp(USERNAME_RE);
const botRe = new RegExp(BOT_USERNAME_RE);
const badCharsRe = new RegExp(DISPLAY_NAME_BAD_CHARS, "u");

/** Il nome utente scritto nel modulo: senza spazi né @ davanti, minuscolo. */
export function cleanUsername(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/^@+/, "")
    .trim()
    .toLowerCase();
}

/** Il nome mostrato scritto nel modulo: forma composta (NFC), senza spazi ai lati, spazi in fila ridotti a uno. */
export function cleanDisplayName(raw: unknown): string {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Lunghezza in caratteri (punti di codice, come `char_length` di Postgres). */
export function charLength(s: string): number {
  return [...s].length;
}

/** La forma del nome utente (senza i nomi riservati né la disponibilità). */
export function usernameShapeOk(u: string): boolean {
  return usernameRe.test(u) && !u.includes("--");
}

/** Nome utente riservato: un bot di prova, un nome dell'elenco o un nome che contiene il sito o il gioco (trattini a parte). */
export function usernameReserved(u: string): boolean {
  const joined = u.replace(/-/g, "");
  return botRe.test(u) || (RESERVED_USERNAMES as readonly string[]).includes(u) || RESERVED_NAME_PARTS.some((p) => joined.includes(p));
}

/** Il nome mostrato per i controlli delle parole riservate: compatibile (NFKC), minuscolo, solo a-z e cifre. */
export function displayNameKey(n: string): string {
  return n.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** La forma del nome mostrato (già pulito con `cleanDisplayName`). */
export function displayNameShapeOk(n: string): boolean {
  const len = charLength(n);
  return len >= DISPLAY_NAME_MIN && len <= DISPLAY_NAME_MAX && n === n.trim() && !/\s{2,}/u.test(n) && !badCharsRe.test(n);
}

/** Nome mostrato con una parola dello staff o del gioco. */
export function displayNameReserved(n: string): boolean {
  const key = displayNameKey(n);
  return (
    (RESERVED_DISPLAY_WORDS as readonly string[]).includes(key) ||
    RESERVED_DISPLAY_PARTS.some((p) => key.includes(p)) ||
    RESERVED_NAME_PARTS.some((p) => key.includes(p))
  );
}

export type UsernameCheck = "ok" | "invalid" | "reserved";
export type DisplayNameCheck = "ok" | "invalid" | "reserved";

/** Controllo del nome utente prima di mandarlo al database (che ripete tutto e guarda anche se è libero). */
export function checkUsername(u: string, staff = false): UsernameCheck {
  if (!usernameShapeOk(u)) return "invalid";
  if (!staff && usernameReserved(u)) return "reserved";
  return "ok";
}

/** Controllo del nome mostrato prima di mandarlo al database. */
export function checkDisplayName(n: string, staff = false): DisplayNameCheck {
  if (!displayNameShapeOk(n)) return "invalid";
  if (!staff && displayNameReserved(n)) return "reserved";
  return "ok";
}

/** Da quando si può cambiare di nuovo il nome utente: null se si può già (o non è mai stato cambiato dal sito). */
export function nextUsernameChange(changedAt: string | null | undefined, now = Date.now()): Date | null {
  if (!changedAt) return null;
  const at = Date.parse(changedAt);
  if (!Number.isFinite(at)) return null;
  const next = at + USERNAME_CHANGE_DAYS * 24 * 60 * 60 * 1000;
  return next > now ? new Date(next) : null;
}

/** Esito di un campo dalla funzione del database. */
export type DisplayNameStatus = "same" | "ok" | "invalid" | "reserved" | "lookalike" | "too_fast";
export type UsernameStatus = "same" | "ok" | "invalid" | "reserved" | "taken" | "too_soon";

/** La risposta di `profile_set_names` (jsonb), ricontrollata: un valore che non si conosce diventa un errore. */
export type SetNamesResult =
  | { ok: true; changed: boolean; display: DisplayNameStatus; username: UsernameStatus; nextChange: string | null }
  | { ok: false; error: "not_logged_in" | "no_profile" | "bad_response" }
  | { ok: false; error: null; display: DisplayNameStatus; username: UsernameStatus; nextChange: string | null };

const DISPLAY_STATUSES: readonly DisplayNameStatus[] = ["same", "ok", "invalid", "reserved", "lookalike", "too_fast"];
const USERNAME_STATUSES: readonly UsernameStatus[] = ["same", "ok", "invalid", "reserved", "taken", "too_soon"];

export function parseSetNamesResult(raw: unknown): SetNamesResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "bad_response" };
  const r = raw as Record<string, unknown>;
  if (r.error === "not_logged_in" || r.error === "no_profile") return { ok: false, error: r.error };
  const display = DISPLAY_STATUSES.find((s) => s === r.display);
  const username = USERNAME_STATUSES.find((s) => s === r.username);
  if (!display || !username || typeof r.ok !== "boolean") return { ok: false, error: "bad_response" };
  const nextChange = typeof r.next_change === "string" && Number.isFinite(Date.parse(r.next_change)) ? r.next_change : null;
  if (r.ok) return { ok: true, changed: r.changed === true, display, username, nextChange };
  return { ok: false, error: null, display, username, nextChange };
}

/**
 * La funzione o le colonne del blocco NOME UTENTE non ci sono ancora (codice online prima della migrazione):
 * PostgREST risponde PGRST202 per una funzione che non conosce, Postgres 42883 (funzione), 42703 (colonna), 42P01 (tabella).
 */
export function namesMigrationMissing(error: { code?: string | null } | null | undefined): boolean {
  return ["PGRST202", "42883", "42703", "42P01"].includes(error?.code ?? "");
}
