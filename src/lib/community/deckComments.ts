import type { Block } from "../userMarkdown";

/**
 * Commenti ai mazzi della community e ai mazzi torneo (22/10/2026, Pierluigi: "possiamo fare in modo che i mazzi si
 * possano commentare"). Regole pure, uguali a quelle del database (blocco "22/10/2026: COMMENTI AI MAZZI" di
 * supabase/schema.sql; il test deckComments.test.ts le confronta): tetti, pulizia del testo, codici d'errore, chi può
 * fare che cosa, ordine dei commenti. Nessun import a runtime che non sia puro: `node --test`.
 *
 * Chi può fare che cosa (scelte di Pierluigi): scrive e risponde chi ha fatto l'accesso; modifica solo chi ha scritto;
 * elimina chi ha scritto, chi ha pubblicato il mazzo e lo staff; nasconde e rimette online solo lo staff; segnala chi ha
 * fatto l'accesso, mai un proprio commento. Risposte a un solo livello. Il testo ha la formattazione di userMarkdown.ts
 * senza titoletti. La pulizia del testo sta in deckCommentText.ts (usa le regole delle guide, che al browser non servono:
 * questo file lo carica anche la sezione dei commenti).
 */

export const COMMENT_LIMITS = {
  /** caratteri (punti di codice) del testo */
  max: 2000,
  /** righe del testo */
  maxLines: 40,
  /** secondi fra due commenti della stessa persona */
  minSeconds: 10,
  /** commenti l'ora e al giorno per persona (lo staff non ha tetti) */
  hourly: 20,
  daily: 100,
  /** commenti per mazzo */
  perTarget: 1000,
  /** motivo di una segnalazione e segnalazioni al giorno per persona */
  reasonMax: 500,
  reportsDaily: 10,
} as const;

/** Ancora della sezione dei commenti nella scheda (anche nel link degli avvisi). */
export const COMMENTS_ANCHOR = "comments";
/** Quanti commenti di primo livello si vedono prima di "Mostra altri commenti". */
export const COMMENTS_SHOWN = 20;

/** Su che cosa si commenta: un mazzo singolo o un mazzo torneo. */
export type CommentTarget = { kind: "deck" | "set"; id: string };
export type CommentStatus = "visible" | "hidden" | "deleted";

/** Chi ha scritto, come lo mostra la scheda (profilo pubblico). */
export type CommentAuthor = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; badge: string | null };

/**
 * Un commento come lo riceve il browser (rotta /api/deck-comments, azioni): testo già letto e con le carte collegate
 * (`blocks`), il testo grezzo per la modifica (solo per chi l'ha scritto), l'autore (null per un commento eliminato).
 */
export type CommentView = {
  id: number;
  parent: number | null;
  status: CommentStatus;
  created_at: string;
  edited_at: string | null;
  author: CommentAuthor | null;
  blocks: Block[];
  /** il testo scritto, solo per chi l'ha scritto (serve alla modifica) */
  body?: string;
};

export const COMMENT_ERRORS = [
  "notLoggedIn",
  "invalidBody",
  "tooLong",
  "unavailable",
  "targetUnavailable",
  "invalidParent",
  "tooFast",
  "rateHour",
  "rateDay",
  "targetFull",
  "notAllowed",
  "reportRate",
  "invalidReason",
  "db",
] as const;
export type CommentError = (typeof COMMENT_ERRORS)[number];

/** Il messaggio del database (raise exception delle funzioni deck_comment_*) → codice per le etichette. */
const DB_ERRORS: Record<string, CommentError> = {
  not_logged_in: "notLoggedIn",
  invalid_target: "targetUnavailable",
  invalid_body: "invalidBody",
  target_unavailable: "targetUnavailable",
  invalid_parent: "invalidParent",
  too_fast: "tooFast",
  rate_hour: "rateHour",
  rate_day: "rateDay",
  target_full: "targetFull",
  not_allowed: "notAllowed",
  report_rate: "reportRate",
  invalid_reason: "invalidReason",
};

/**
 * Errore di Supabase → codice. Funzione o tabella che non c'è (migrazione non ancora fatta: PGRST202, PGRST205, 42P01,
 * 42883) = `unavailable`, così la scheda dice che i commenti non sono ancora attivi.
 */
export function commentErrorCode(error: { message?: string; code?: string } | null | undefined): CommentError {
  if (!error) return "db";
  const code = error.code ?? "";
  if (code === "PGRST202" || code === "PGRST205" || code === "42P01" || code === "42883") return "unavailable";
  const msg = error.message ?? "";
  for (const [key, value] of Object.entries(DB_ERRORS)) if (new RegExp(`\\b${key}\\b`).test(msg)) return value;
  return "db";
}

/** Che cosa può fare chi guarda su un commento. `viewer` null = nessun accesso. */
export function commentPermissions(
  c: Pick<CommentView, "status" | "parent"> & { authorId: string | null },
  viewer: { id: string; staff: boolean } | null,
  ownerId: string,
): { reply: boolean; edit: boolean; remove: boolean; hide: boolean; unhide: boolean; report: boolean } {
  const mine = Boolean(viewer && c.authorId === viewer.id);
  const staff = Boolean(viewer?.staff);
  const live = c.status === "visible";
  return {
    reply: Boolean(viewer) && live && c.parent === null,
    edit: mine && live,
    remove: c.status !== "deleted" && (mine || staff || Boolean(viewer && viewer.id === ownerId)),
    hide: staff && live,
    unhide: staff && c.status === "hidden",
    report: Boolean(viewer) && !mine && live,
  };
}

/**
 * I commenti in fili: quelli di primo livello dal più recente, sotto ognuno le risposte dalla più vecchia (si leggono
 * come una conversazione). Un posto eliminato senza più risposte non si mostra; le risposte a un commento che chi
 * guarda non vede (nascosto) non si mostrano.
 */
export function threadComments<T extends { id: number; parent: number | null; created_at: string; status: CommentStatus }>(rows: readonly T[]): { comment: T; replies: T[] }[] {
  const byParent = new Map<number, T[]>();
  for (const r of rows) {
    if (r.parent === null) continue;
    const list = byParent.get(r.parent) ?? [];
    list.push(r);
    byParent.set(r.parent, list);
  }
  const asc = (a: T, b: T) => a.created_at.localeCompare(b.created_at) || a.id - b.id;
  return rows
    .filter((r) => r.parent === null)
    .map((comment) => ({ comment, replies: (byParent.get(comment.id) ?? []).slice().sort(asc) }))
    .filter((t) => t.comment.status !== "deleted" || t.replies.length > 0)
    .sort((a, b) => asc(b.comment, a.comment));
}

/** Quanti commenti si vedono (i posti eliminati non contano). */
export function visibleCount(rows: readonly { status: CommentStatus }[]): number {
  return rows.filter((r) => r.status !== "deleted").length;
}

/** Il bersaglio da una query (`?deck=<uuid>` o `?set=<uuid>`): null se manca o non è un uuid. */
export function commentTargetFrom(params: { get(name: string): string | null }): CommentTarget | null {
  const deck = params.get("deck");
  const set = params.get("set");
  if (deck && !set && UUID.test(deck)) return { kind: "deck", id: deck };
  if (set && !deck && UUID.test(set)) return { kind: "set", id: set };
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Il percorso della scheda di un bersaglio, con l'ancora dei commenti: per gli avvisi allo staff. */
export function commentTargetPath(kind: CommentTarget["kind"], slug: string): string {
  return `${kind === "deck" ? "/decks/community/" : "/decks/tournament/"}${slug}#${COMMENTS_ANCHOR}`;
}
