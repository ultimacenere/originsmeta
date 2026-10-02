"use server";

import { after } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordWebhookPayload } from "@/lib/discordWebhook";
import { cut } from "./guideDiscord";
import { isUuid } from "./util";
import { checkComment, checkReportReason, commentErrorCode, commentPath, type CommentErrorCode } from "./comments";

/**
 * Commenti sui mazzi della community (02/10/2026): le scritture passano SOLO dalle funzioni deck_comment_* del database
 * (blocco COMMENTI di supabase/schema.sql), con la sessione di chi agisce. Il database decide chi può fare che cosa,
 * tetti di frequenza e avvisi; qui si controlla prima la forma (per un messaggio chiaro) e si avvisa lo staff su Discord
 * alla prima segnalazione di un commento. Nessuna pagina da rigenerare: i commenti si leggono nel browser.
 */

export type CommentResult = { ok?: true; id?: number; error?: CommentErrorCode };

const isId = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;

async function session() {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" as const };
  if (!user) return { error: "notLoggedIn" as const };
  return { supabase, user };
}

function failed(where: string, error: { message?: string; code?: string }): CommentResult {
  const code = commentErrorCode(error);
  if (code === "db") console.error(`[comments] ${where}:`, error.code ?? "", error.message);
  return { error: code };
}

/** Un commento (`parentId` nullo) o una risposta a un commento dello stesso mazzo. */
export async function addDeckComment(deckId: string, body: string, parentId: number | null): Promise<CommentResult> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  if (!isUuid(deckId) || (parentId !== null && !isId(parentId))) return { error: "notFound" };
  const check = checkComment(body);
  if (!check.ok) return { error: check.error };
  const { data, error } = await s.supabase.rpc("deck_comment_add", { p_deck: deckId, p_body: check.body, p_parent: parentId });
  if (error) return failed("commento", error);
  return { ok: true, id: Number(data) };
}

export async function editDeckComment(id: number, body: string): Promise<CommentResult> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  if (!isId(id)) return { error: "notFound" };
  const check = checkComment(body);
  if (!check.ok) return { error: check.error };
  const { error } = await s.supabase.rpc("deck_comment_edit", { p_id: id, p_body: check.body });
  return error ? failed("modifica", error) : { ok: true, id };
}

export async function deleteDeckComment(id: number): Promise<CommentResult> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  if (!isId(id)) return { error: "notFound" };
  const { error } = await s.supabase.rpc("deck_comment_delete", { p_id: id });
  return error ? failed("eliminazione", error) : { ok: true, id };
}

/** Lo staff nasconde un commento o lo rimette (il database controlla che chi chiama sia dello staff). */
export async function moderateDeckComment(id: number, hide: boolean): Promise<CommentResult> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  if (!isId(id) || typeof hide !== "boolean") return { error: "notFound" };
  const { error } = await s.supabase.rpc("deck_comment_moderate", { p_id: id, p_hide: hide });
  return error ? failed("moderazione", error) : { ok: true, id };
}

/**
 * Segnalazione di un commento (una per utente e per commento, mai il proprio, 10 al giorno: lo decide il database). Alla
 * prima segnalazione del commento nelle 24 ore avvisa il canale PRIVATO dello staff (DISCORD_FEEDBACK_WEBHOOK_URL, lo
 * stesso dei feedback e delle segnalazioni delle guide) con il link al commento, dove lo staff trova "Nascondi (staff)".
 */
export async function reportDeckComment(id: number, reason: string): Promise<CommentResult> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  if (!isId(id)) return { error: "notFound" };
  const clean = checkReportReason(reason);
  if (clean === null) return { error: "reasonTooLong" };
  const { data: first, error } = await s.supabase.rpc("deck_comment_report", { p_id: id, p_reason: clean });
  if (error) return failed("segnalazione", error);
  if (first === true) notifyStaff(s.supabase, s.user.id, id, clean);
  return { ok: true, id };
}

type Db = NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>;

/** Avviso allo staff dopo la risposta (after): testo del commento tagliato, nomi utente, motivo, link. */
function notifyStaff(supabase: Db, reporterId: string, id: number, reason: string): void {
  const url = discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL");
  if (!url) return;
  const job = async () => {
    try {
      const [{ data: row }, { data: me }] = await Promise.all([
        supabase
          .from("deck_comments")
          .select("id, body, deck:community_decks!deck_comments_deck_id_fkey(slug, name), author:profiles!deck_comments_user_id_fkey(username)")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("profiles").select("username").eq("id", reporterId).maybeSingle(),
      ]);
      const c = row as unknown as { body: string; deck: { slug: string; name: string } | null; author: { username: string | null } | null } | null;
      const path = c?.deck ? commentPath(c.deck.slug, id) : null;
      if (!c || !path) return;
      await sendDiscordWebhook(
        url,
        commentReportPayload({
          link: `https://originsmeta.com/it${path}`,
          deck: c.deck?.name ?? "?",
          body: c.body,
          author: c.author?.username ?? null,
          reporter: (me as { username: string | null } | null)?.username ?? null,
          reason,
        }),
        { timeoutMs: 3000 },
      );
    } catch (e) {
      console.error("[comments] avviso della segnalazione allo staff non riuscito:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}

function commentReportPayload(r: { link: string; deck: string; body: string; author: string | null; reporter: string | null; reason: string }): DiscordWebhookPayload {
  return {
    username: "OriginsMeta · segnalazioni",
    embeds: [
      {
        title: "Segnalazione di un commento a un mazzo",
        url: r.link,
        description: escapeDiscord(cut(r.body, 300)),
        color: 0xc81e7a,
        fields: [
          { name: "Mazzo", value: escapeDiscord(cut(r.deck, 200)) },
          { name: "Scritto da", value: r.author ? escapeDiscord(`@${cut(r.author, 80)}`) : "utente" },
          { name: "Segnalato da", value: r.reporter ? escapeDiscord(`@${cut(r.reporter, 80)}`) : "utente" },
          { name: "Motivo", value: r.reason ? escapeDiscord(cut(r.reason, 300)) : "—" },
          // lo staff, con l'accesso fatto, trova "Nascondi (staff)" ed "Elimina" sotto il commento
          { name: "Nascondi dal sito", value: r.link },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
