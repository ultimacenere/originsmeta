import { cleanPlain, plainTextOk } from "./guides";
import { COMMENT_LIMITS } from "./deckComments";

/**
 * Pulizia e controllo del testo dei commenti ai mazzi (22/10/2026), con le regole del testo semplice delle guide
 * (`cleanPlain`, `plainTextOk`), uguali a `deck_comment_body_ok` del database. Solo per le azioni del server e i test:
 * la sezione dei commenti nel browser non ne ha bisogno (il database ricontrolla comunque).
 */

/** Testo di un commento pulito come lo accetta il database. */
export function cleanCommentBody(raw: unknown): string {
  return cleanPlain(raw, COMMENT_LIMITS.max, true);
}

/** Il testo rispetta `deck_comment_body_ok`: da 1 a 2000 caratteri, al massimo 40 righe, testo semplice valido. */
export function commentBodyOk(t: string): boolean {
  return plainTextOk(t, 1, COMMENT_LIMITS.max, true) && t.split("\n").length <= COMMENT_LIMITS.maxLines;
}

/** Il motivo di una segnalazione (facoltativo), pulito. */
export function cleanReportReason(raw: unknown): string {
  return cleanPlain(raw, COMMENT_LIMITS.reasonMax, true);
}
