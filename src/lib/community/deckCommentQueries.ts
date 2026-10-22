import type { Db } from "@/lib/supabase/public";
import type { DeckCommentRow } from "@/lib/supabase/database";
import type { Locale } from "@/lib/i18n";
import { userDoc } from "@/components/UserMarkdown";
import { commentErrorCode, type CommentError, type CommentTarget, type CommentView } from "./deckComments";

/**
 * Letture dei commenti ai mazzi (22/10/2026), solo lato server: la rotta /api/deck-comments e le azioni li leggono con la
 * sessione di chi guarda, così la policy decide (commenti dei mazzi pubblicati; i nascosti solo all'autore e allo staff).
 * Il testo esce già letto, con le carte collegate (`userDoc`, database carte solo sul server), senza titoletti.
 */

const COLUMNS =
  "id, deck_id, set_id, parent_id, author, body, status, created_at, edited_at, profile:profiles!deck_comments_author_fkey(username, display_name, avatar_url, badge)";
/** Il tetto del database è 1000 commenti per mazzo, più i posti dei commenti eliminati che hanno risposte. */
const MAX_ROWS = 1500;

export type CommentRow = DeckCommentRow & { profile: { username: string | null; display_name: string | null; avatar_url: string | null; badge: string | null } | null };

export type CommentsRead = { ok: true; rows: CommentRow[] } | { ok: false; error: CommentError };

/** I commenti di un mazzo che chi guarda può vedere, dal più vecchio. Prima della migrazione: `unavailable`. */
export async function readComments(client: Db, target: CommentTarget): Promise<CommentsRead> {
  const res = await client
    .from("deck_comments")
    .select(COLUMNS)
    .eq(target.kind === "deck" ? "deck_id" : "set_id", target.id)
    .order("created_at", { ascending: true })
    .limit(MAX_ROWS);
  if (res.error) {
    const error = commentErrorCode(res.error);
    if (error !== "unavailable") console.error("[comments] lettura:", res.error.code ?? "", res.error.message);
    return { ok: false, error };
  }
  return { ok: true, rows: (res.data ?? []) as unknown as CommentRow[] };
}

/** Un commento solo (dopo averlo scritto o modificato), se chi guarda lo vede. */
export async function readComment(client: Db, id: number): Promise<CommentRow | null> {
  const res = await client.from("deck_comments").select(COLUMNS).eq("id", id).maybeSingle();
  if (res.error) console.error("[comments] lettura di un commento:", res.error.code ?? "", res.error.message);
  return (res.data as unknown as CommentRow | null) ?? null;
}

/**
 * Il commento per il browser: testo letto con le carte collegate nella lingua della pagina; il testo grezzo solo a chi
 * l'ha scritto (per la modifica); un posto eliminato senza autore né testo.
 */
export function commentView(row: CommentRow, locale: Locale, viewerId: string | null): CommentView {
  const deleted = row.status === "deleted";
  return {
    id: row.id,
    parent: row.parent_id,
    status: row.status,
    created_at: row.created_at,
    edited_at: row.edited_at,
    author: deleted
      ? null
      : {
          id: row.author,
          username: row.profile?.username ?? null,
          display_name: row.profile?.display_name ?? null,
          avatar_url: row.profile?.avatar_url ?? null,
          badge: row.profile?.badge ?? null,
        },
    blocks: deleted ? [] : userDoc(row.body, locale, { headings: false }).blocks,
    ...(viewerId && row.author === viewerId && !deleted ? { body: row.body } : {}),
  };
}
