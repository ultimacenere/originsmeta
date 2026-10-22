"use server";

import { after } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { isLocale, type Locale } from "@/lib/i18n";
import { discordWebhookUrl, sendDiscordWebhook } from "@/lib/discordWebhook";
import { codePoints } from "./guides";
import { authorName } from "./util";
import { COMMENT_LIMITS, commentErrorCode, type CommentError, type CommentTarget, type CommentView } from "./deckComments";
import { cleanCommentBody, cleanReportReason, commentBodyOk } from "./deckCommentText";
import { commentView, readComment } from "./deckCommentQueries";
import { commentReportPayload } from "./deckCommentDiscord";

/**
 * Azioni dei commenti ai mazzi (22/10/2026): scrivere, rispondere, modificare, eliminare, nascondere (staff), segnalare.
 * Il sito pulisce e controlla il testo prima di chiamare il database, ma a decidere sono le funzioni deck_comment_* del
 * blocco COMMENTI AI MAZZI di supabase/schema.sql (chi può, tetti, avvisi). I commenti non stanno nell'HTML delle schede
 * (li legge il browser da /api/deck-comments), quindi niente pagine da rigenerare.
 */

export type CommentActionResult =
  | { ok: true; comment?: CommentView; removed?: "emptied" | "deleted" | "gone"; reported?: boolean }
  | { ok: false; error: CommentError };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validTarget = (t: unknown): t is CommentTarget =>
  Boolean(t && typeof t === "object" && ((t as CommentTarget).kind === "deck" || (t as CommentTarget).kind === "set") && UUID.test(String((t as CommentTarget).id)));
const validId = (id: unknown): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0;
const pageLocale = (raw: unknown): Locale => (typeof raw === "string" && isLocale(raw) ? raw : "en");

/** Il testo pulito e controllato, o il motivo per cui non va. */
function checkedBody(raw: unknown): { body: string } | { error: CommentError } {
  const body = cleanCommentBody(raw);
  if (!body) return { error: "invalidBody" };
  if (codePoints(body) > COMMENT_LIMITS.max || body.split("\n").length > COMMENT_LIMITS.maxLines) return { error: "tooLong" };
  return commentBodyOk(body) ? { body } : { error: "invalidBody" };
}

/** Un commento nuovo, o una risposta (`parent`). Restituisce il commento pronto da mostrare. */
export async function addDeckComment(target: CommentTarget, parent: number | null, raw: string, locale: string): Promise<CommentActionResult> {
  if (!validTarget(target) || (parent !== null && !validId(parent))) return { ok: false, error: "targetUnavailable" };
  const checked = checkedBody(raw);
  if ("error" in checked) return { ok: false, error: checked.error };
  const { supabase, user } = await currentUser();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!user) return { ok: false, error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("deck_comment_add", {
    p_deck: target.kind === "deck" ? target.id : null,
    p_set: target.kind === "set" ? target.id : null,
    p_parent: parent,
    p_body: checked.body,
  });
  if (error) {
    const code = commentErrorCode(error);
    if (code === "db") console.error("[comments] nuovo commento:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  const row = await readComment(supabase, Number(data));
  return { ok: true, comment: row ? commentView(row, pageLocale(locale), user.id) : undefined };
}

/** Modifica il testo di un proprio commento. */
export async function editDeckComment(id: number, raw: string, locale: string): Promise<CommentActionResult> {
  if (!validId(id)) return { ok: false, error: "notAllowed" };
  const checked = checkedBody(raw);
  if ("error" in checked) return { ok: false, error: checked.error };
  const { supabase, user } = await currentUser();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!user) return { ok: false, error: "notLoggedIn" };
  const { error } = await supabase.rpc("deck_comment_edit", { p_id: id, p_body: checked.body });
  if (error) {
    const code = commentErrorCode(error);
    if (code === "db") console.error("[comments] modifica:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  const row = await readComment(supabase, id);
  return { ok: true, comment: row ? commentView(row, pageLocale(locale), user.id) : undefined };
}

/** Elimina un commento: chi l'ha scritto, chi ha pubblicato il mazzo, lo staff (lo decide il database). */
export async function deleteDeckComment(id: number): Promise<CommentActionResult> {
  if (!validId(id)) return { ok: false, error: "notAllowed" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!user) return { ok: false, error: "notLoggedIn" };
  const { data, error } = await supabase.rpc("deck_comment_delete", { p_id: id });
  if (error) {
    const code = commentErrorCode(error);
    if (code === "db") console.error("[comments] eliminazione:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  return { ok: true, removed: data === "emptied" || data === "gone" ? data : "deleted" };
}

/** Nasconde o rimette online un commento (solo lo staff). */
export async function hideDeckComment(id: number, hidden: boolean, locale: string): Promise<CommentActionResult> {
  if (!validId(id) || typeof hidden !== "boolean") return { ok: false, error: "notAllowed" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!user) return { ok: false, error: "notLoggedIn" };
  const { error } = await supabase.rpc("deck_comment_hide", { p_id: id, p_hidden: hidden });
  if (error) {
    const code = commentErrorCode(error);
    if (code === "db") console.error("[comments] nascondi:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  const row = await readComment(supabase, id);
  return { ok: true, comment: row ? commentView(row, pageLocale(locale), user.id) : undefined };
}

/**
 * Segnala un commento (motivo facoltativo). Alla prima segnalazione di quel commento lo staff riceve un avviso nel suo
 * canale Discord privato, se il webhook c'è, con il link alla scheda: lì trova "Nascondi" ed "Elimina".
 */
export async function reportDeckComment(id: number, rawReason: string): Promise<CommentActionResult> {
  if (!validId(id)) return { ok: false, error: "notAllowed" };
  const reason = cleanReportReason(rawReason);
  if (codePoints(reason) > COMMENT_LIMITS.reasonMax) return { ok: false, error: "invalidReason" };
  const { supabase, user } = await currentUser();
  if (!supabase) return { ok: false, error: "unavailable" };
  if (!user) return { ok: false, error: "notLoggedIn" };
  const { data: first, error } = await supabase.rpc("deck_comment_report", { p_id: id, p_reason: reason });
  if (error) {
    const code = commentErrorCode(error);
    if (code === "db") console.error("[comments] segnalazione:", error.code ?? "", error.message);
    return { ok: false, error: code };
  }
  const url = first === true ? discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL") : null;
  if (url) {
    // le letture con la sessione di chi segnala, prima di rispondere; dopo la risposta parte solo il messaggio
    const [row, me] = await Promise.all([readComment(supabase, id), supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()]);
    const deck = !row
      ? null
      : row.deck_id
        ? (await supabase.from("community_decks").select("slug, name").eq("id", row.deck_id).maybeSingle()).data
        : (await supabase.from("community_deck_sets").select("slug, name").eq("id", row.set_id ?? "").maybeSingle()).data;
    if (row && deck) {
      const payload = commentReportPayload({
        kind: row.deck_id ? "deck" : "set",
        slug: deck.slug,
        deckName: deck.name,
        author: authorName(row.profile),
        reporter: (me.data as { username: string | null } | null)?.username ?? null,
        reason,
        body: row.body,
      });
      after(() => sendDiscordWebhook(url, payload, { timeoutMs: 3000 }).then(() => undefined));
    }
  }
  return { ok: true, reported: true };
}
