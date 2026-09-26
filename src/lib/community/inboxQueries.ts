import type { Db } from "@/lib/supabase/public";
import type { ConversationRow, MessageRow } from "@/lib/supabase/database";
import type { Profile } from "./types";
import { CONVERSATIONS_PAGE, THREAD_MESSAGES_MAX, inboxErrorCode, parseInboxStatus, type InboxErrorCode, type InboxStatus, type StaffFilter } from "./messages";

/**
 * Letture della casella messaggi (26/09/2026, supabase/schema.sql, blocco INBOX), solo lato server e sempre con la sessione
 * di chi guarda (`currentUser()`): le policy RLS fanno vedere all'utente le sue conversazioni e allo staff tutte.
 * Le pagine che le usano sono private e dinamiche (/account, /account/messages/<id>, /account/staff/messages).
 *
 * Nessuna lancia: un errore (per esempio la migrazione non ancora applicata) torna come `{ error }`, e la pagina
 * mostra "messaggi non disponibili" invece di rompersi. Qui non c'è ISR da proteggere.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: InboxErrorCode };

/** Colonne di una conversazione negli elenchi e nella pagina. */
const CONVERSATION_COLUMNS =
  "id, user_id, subject, origin, status, created_at, updated_at, last_message_at, last_from_staff, last_preview, unread_by_user, unread_by_staff";

export type ConversationSummary = Pick<
  ConversationRow,
  "id" | "user_id" | "subject" | "origin" | "status" | "created_at" | "updated_at" | "last_message_at" | "last_from_staff" | "last_preview" | "unread_by_user" | "unread_by_staff"
>;

/** Profilo dell'utente della conversazione, per lo staff. */
export type InboxProfile = Profile & { id?: string };
export type StaffConversation = ConversationSummary & { user: InboxProfile | null };
export type ThreadMessage = MessageRow & { author: InboxProfile | null };

function fail<T>(what: string, error: { message?: string; code?: string } | null): Result<T> {
  console.error(`[inbox] ${what}:`, error?.code ?? "", error?.message ?? "");
  return { ok: false, error: inboxErrorCode(error) };
}

/** Numero dei non letti e ruolo di chi guarda (RPC `inbox_status`). */
export async function readInboxStatus(client: Db): Promise<Result<InboxStatus>> {
  const { data, error } = await client.rpc("inbox_status");
  if (error) return fail("inbox_status", error);
  return { ok: true, data: parseInboxStatus(data) ?? { unread: 0, staff: false, staffUnread: 0 } };
}

/**
 * Chi guarda è dello staff (admin o tag Staff)? Un errore torna come errore: senza la migrazione (`unavailable`) o con
 * il database giù le pagine dello staff dicono "messaggi non disponibili" invece di un 404 anche allo staff.
 */
export async function viewerIsStaff(client: Db): Promise<Result<boolean>> {
  const { data, error } = await client.rpc("is_staff");
  if (error) return fail("is_staff", error);
  return { ok: true, data: data === true };
}

/**
 * Le conversazioni dell'utente, dall'ultima con movimento, a pagine da CONVERSATIONS_PAGE (`more` = c'è un'altra
 * pagina). Il filtro su user_id è esplicito: lo staff vede per policy tutte le conversazioni, e nella sua casella
 * personale devono comparire solo le sue.
 */
export async function listUserConversations(client: Db, userId: string, page = 1): Promise<Result<{ rows: ConversationSummary[]; more: boolean }>> {
  const from = (Math.max(1, page) - 1) * CONVERSATIONS_PAGE;
  const { data, error } = await client
    .from("conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .range(from, from + CONVERSATIONS_PAGE);
  if (error) return fail("conversations (utente)", error);
  const rows = (data ?? []) as ConversationSummary[];
  return { ok: true, data: { rows: rows.slice(0, CONVERSATIONS_PAGE), more: rows.length > CONVERSATIONS_PAGE } };
}

/** Una conversazione con il profilo del suo utente; null se non c'è o chi guarda non la può vedere (RLS). */
export async function getConversation(client: Db, id: string): Promise<Result<StaffConversation | null>> {
  const { data, error } = await client
    .from("conversations")
    .select(`${CONVERSATION_COLUMNS}, user:profiles!conversations_user_id_fkey(id, username, display_name, avatar_url, badge)`)
    .eq("id", id)
    .maybeSingle();
  if (error) return fail("conversation", error);
  return { ok: true, data: (data as StaffConversation | null) ?? null };
}

/**
 * Gli ultimi messaggi di una conversazione, in ordine di invio. `withAuthors` (vista dello staff) aggiunge chi ha scritto
 * (`author_id` e il profilo); nella vista dell'utente non serve, perché lì lo staff firma sempre "Staff di OriginsMeta",
 * e l'utente non ha nemmeno la colonna `author_id` (grant per colonna in supabase/schema.sql, blocco INBOX): lì
 * `author_id` resta null e `authorKind` distingue le due parti con `from_staff`.
 * Gli autori li dà solo la RPC `inbox_message_authors` (security definer, righe solo allo staff); i profili sono
 * pubblici e si leggono in una query sola.
 */
export async function listMessages(client: Db, conversationId: string, withAuthors = false): Promise<Result<{ messages: ThreadMessage[]; truncated: boolean }>> {
  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, from_staff, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(THREAD_MESSAGES_MAX + 1);
  if (error) return fail("messages", error);
  const authorOf = new Map<number, string>();
  const profiles = new Map<string, InboxProfile>();
  if (withAuthors) {
    const authors = await client.rpc("inbox_message_authors", { cid: conversationId });
    if (authors.error) return fail("inbox_message_authors", authors.error);
    for (const a of authors.data ?? []) authorOf.set(Number(a.message_id), a.author_id);
    const ids = [...new Set(authorOf.values())];
    if (ids.length) {
      const res = await client.from("profiles").select("id, username, display_name, avatar_url, badge").in("id", ids);
      if (res.error) return fail("profiles (autori dei messaggi)", res.error);
      for (const p of (res.data ?? []) as (InboxProfile & { id: string })[]) profiles.set(p.id, p);
    }
  }
  const rows: ThreadMessage[] = ((data ?? []) as Omit<MessageRow, "author_id">[]).map((m) => {
    const author_id = authorOf.get(Number(m.id)) ?? null;
    return { ...m, author_id, author: author_id ? (profiles.get(author_id) ?? null) : null };
  });
  return { ok: true, data: { messages: rows.slice(0, THREAD_MESSAGES_MAX).reverse(), truncated: rows.length > THREAD_MESSAGES_MAX } };
}

/**
 * Casella dello staff: tutte le conversazioni (la policy le mostra solo allo staff), dalla più recente, con il filtro
 * scelto; non quelle in cui chi guarda è l'utente (le sue stanno nella sua casella, come nel conteggio di
 * `inbox_status`). `more` = c'è almeno un'altra pagina.
 */
export async function listStaffConversations(client: Db, viewerId: string, filter: StaffFilter, page: number): Promise<Result<{ rows: StaffConversation[]; more: boolean }>> {
  let query = client
    .from("conversations")
    .select(`${CONVERSATION_COLUMNS}, user:profiles!conversations_user_id_fkey(id, username, display_name, avatar_url, badge)`)
    .neq("user_id", viewerId);
  if (filter === "unread") query = query.eq("unread_by_staff", true);
  else if (filter === "open" || filter === "closed") query = query.eq("status", filter);
  const from = (page - 1) * CONVERSATIONS_PAGE;
  const { data, error } = await query.order("last_message_at", { ascending: false }).range(from, from + CONVERSATIONS_PAGE);
  if (error) return fail("conversations (staff)", error);
  const rows = (data ?? []) as StaffConversation[];
  return { ok: true, data: { rows: rows.slice(0, CONVERSATIONS_PAGE), more: rows.length > CONVERSATIONS_PAGE } };
}
