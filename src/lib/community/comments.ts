import { hasVisibleText, plainMessage, textLength } from "./messages";

/**
 * Commenti sui mazzi della community (02/10/2026). Pierluigi: "dovremmo dare la possibilità oltre a votare il deck, anche
 * di poter commentare"; scelte del 02/10/2026: risposte a un livello, chi ha scritto modifica o cancella, lo staff nasconde
 * o cancella (più "Segnala" con avviso allo staff su Discord), avvisi nella busta all'autore del mazzo e a chi riceve una
 * risposta.
 *
 * Qui solo funzioni pure (l'unico import, messages.ts, è puro anche lui): le esegue `node --test`
 * (comments.test.ts, che confronta anche i numeri con il blocco COMMENTI di supabase/schema.sql) e le usano la Server
 * Action (commentActions.ts) e la sezione della scheda del mazzo (src/components/comments/DeckComments.tsx). Le regole vere
 * le applica il database (funzioni deck_comment_*): queste servono a dire di no prima, con un messaggio chiaro.
 *
 * I commenti si leggono nel browser (la scheda del mazzo resta ISR, e un commento appena scritto si vede subito); non
 * sono nell'HTML e non si indicizzano.
 */

/** Lunghezza massima di un commento dopo la pulizia, in caratteri visibili (vincolo `deck_comments_body_check`). */
export const COMMENT_MAX = 1000;
/** Tetto al testo grezzo prima della pulizia (`deck_comment_text`): quattro volte il massimo, come i messaggi. */
export const RAW_COMMENT_MAX = COMMENT_MAX * 4;
/** Motivo facoltativo di una segnalazione, una riga. */
export const REPORT_REASON_MAX = 300;
export const RAW_REPORT_REASON_MAX = REPORT_REASON_MAX * 4;
/** Frequenza (lo staff no): secondi fra due commenti, commenti l'ora e al giorno, segnalazioni al giorno. */
export const COMMENT_GAP_SECONDS = 10;
export const COMMENTS_PER_HOUR = 20;
export const COMMENTS_PER_DAY = 100;
export const COMMENT_REPORTS_PER_DAY = 10;
/** Commenti (non risposte) caricati alla volta, dal più recente; "Mostra altri commenti" carica i successivi. */
export const COMMENTS_PAGE = 20;
/** Ancora della sezione nella scheda del mazzo (link sotto il voto e avvisi della busta). */
export const COMMENTS_ANCHOR = "comments";
/** Ancora di un commento. */
export const commentAnchor = (id: number) => `comment-${id}`;

export type CommentStatus = "visible" | "hidden" | "deleted";

/** Chi ha scritto: le colonne pubbliche del profilo che servono alla sezione. */
export type CommentAuthor = { username: string | null; display_name: string | null; avatar_url: string | null; avatar_path?: string | null; badge: string | null };

/** Una riga di `deck_comments` come la legge il sito, con il profilo di chi l'ha scritta. */
export type CommentRow = {
  id: number;
  deck_id: string;
  user_id: string;
  parent_id: number | null;
  body: string;
  status: CommentStatus;
  created_at: string;
  edited_at: string | null;
  author: CommentAuthor | null;
};

export type CommentThread = CommentRow & { replies: CommentRow[] };

export type CommentCheck = { ok: true; body: string } | { ok: false; error: "empty" | "tooLong" };

/** Il testo di un commento come lo salverà il database (stessa pulizia dei messaggi): vuoto o troppo lungo = no. */
export function checkComment(raw: unknown): CommentCheck {
  if (typeof raw === "string" && raw.length > RAW_COMMENT_MAX) return { ok: false, error: "tooLong" };
  const body = typeof raw === "string" ? plainMessage(raw) : "";
  if (!body || !hasVisibleText(body)) return { ok: false, error: "empty" };
  if (textLength(body) > COMMENT_MAX) return { ok: false, error: "tooLong" };
  return { ok: true, body };
}

/** Il motivo di una segnalazione su una riga sola (facoltativo): null se troppo lungo. */
export function checkReportReason(raw: unknown): string | null {
  if (typeof raw !== "string") return "";
  if (raw.length > RAW_REPORT_REASON_MAX) return null;
  const s = plainMessage(raw).replace(/\s+/g, " ").trim();
  return textLength(s) > REPORT_REASON_MAX ? null : s;
}

/** Caratteri ancora disponibili nel modulo (negativo = troppi). */
export const commentRemaining = (text: string) => COMMENT_MAX - textLength(text);

const STATUSES: readonly string[] = ["visible", "hidden", "deleted"];

/** Una riga letta da Supabase ha la forma attesa? (Quelle sbagliate si scartano.) */
export function isCommentRow(v: unknown): v is CommentRow {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "number" &&
    typeof r.deck_id === "string" &&
    typeof r.user_id === "string" &&
    (r.parent_id === null || typeof r.parent_id === "number") &&
    typeof r.body === "string" &&
    typeof r.status === "string" &&
    STATUSES.includes(r.status) &&
    typeof r.created_at === "string"
  );
}

/**
 * I commenti di un mazzo in conversazioni: i commenti nell'ordine in cui arrivano (la lettura li dà dal più recente), le
 * risposte sotto il loro commento dalla più vecchia (si leggono come una conversazione). Le risposte il cui commento non
 * è fra quelli letti (nascosto dallo staff, di un'altra pagina) non si mostrano; un commento eliminato senza più risposte
 * nemmeno.
 */
export function buildThreads(top: readonly CommentRow[], replies: readonly CommentRow[]): CommentThread[] {
  const byParent = new Map<number, CommentRow[]>();
  for (const r of replies) {
    if (r.parent_id === null) continue;
    const list = byParent.get(r.parent_id) ?? [];
    list.push(r);
    byParent.set(r.parent_id, list);
  }
  const seen = new Set<number>();
  const out: CommentThread[] = [];
  for (const c of top) {
    if (c.parent_id !== null || seen.has(c.id)) continue;
    seen.add(c.id);
    const list = (byParent.get(c.id) ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
    if (c.status === "deleted" && !list.length) continue;
    out.push({ ...c, replies: list });
  }
  return out;
}

/** Il nome da mostrare per chi ha scritto: nome scelto, poi nome utente, poi il ripiego (account cancellato a metà lettura). */
export function commentAuthorName(a: CommentAuthor | null, fallback: string): string {
  return a?.display_name?.trim() || a?.username?.trim() || fallback;
}

/* ---------- errori ---------- */

export type CommentErrorCode =
  | "notLoggedIn"
  | "empty"
  | "tooLong"
  | "tooFast"
  | "rate"
  | "notFound"
  | "badParent"
  | "forbidden"
  | "hidden"
  | "ownComment"
  | "duplicate"
  | "reportRate"
  | "reasonTooLong"
  | "unavailable"
  | "db";

const RAISED: Record<string, CommentErrorCode> = {
  not_logged_in: "notLoggedIn",
  comment_empty: "empty",
  comment_too_long: "tooLong",
  comment_too_fast: "tooFast",
  comment_rate: "rate",
  not_found: "notFound",
  bad_parent: "badParent",
  forbidden: "forbidden",
  comment_hidden: "hidden",
  own_comment: "ownComment",
  duplicate: "duplicate",
  report_rate: "reportRate",
  reason_too_long: "reasonTooLong",
};

/** Dall'errore di Supabase al codice del sito; tabella o funzione mancante (migrazione non applicata) → `unavailable`. */
export function commentErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): CommentErrorCode {
  if (!error) return "db";
  const code = error.code ?? "";
  if (["42P01", "42883", "42703", "PGRST200", "PGRST202", "PGRST205"].includes(code)) return "unavailable";
  const msg = (error.message ?? "").trim();
  return Object.hasOwn(RAISED, msg) ? RAISED[msg] : "db";
}

/** Il percorso della scheda di un mazzo con l'ancora di un commento, per l'avviso allo staff. null con uno slug strano. */
export function commentPath(slug: string, id: number): string | null {
  return /^[a-z0-9-]{1,80}$/.test(slug) && Number.isSafeInteger(id) && id > 0 ? `/decks/community/${slug}#${commentAnchor(id)}` : null;
}
