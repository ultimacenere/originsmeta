"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import type { Db } from "@/lib/supabase/public";
import { isUuid } from "./util";
import { checkMessage, checkSubject, cleanUsername, inboxErrorCode, staffThreadPath, userThreadPath, type InboxErrorCode } from "./messages";
import { notifyStaff, staffNoticeEnabled } from "./inboxNotify";

/**
 * Server Action della casella messaggi utente ↔ staff (26/09/2026, pacchetto INBOX, supabase/schema.sql, blocco INBOX).
 *
 * Tutte le scritture passano dalle RPC security definer del database, con la sessione di chi scrive: è il database
 * che decide se la conversazione è sua o se è dello staff, se il messaggio è "dello staff" (from_staff), e che tiene
 * il limite di frequenza. Qui si controlla prima il testo (per dire di no con un messaggio chiaro) e si avvisa lo staff
 * su Discord quando scrive un utente (`notifyStaff`, mai il contrario).
 *
 * Esito per i moduli (useActionState): `error` = codice di `InboxErrorCode`; `href` = dove andare dopo una
 * conversazione nuova; `sent` = istante dell'invio riuscito (cambia a ogni invio, così il modulo si svuota ogni volta).
 */
export type InboxActionState = { error?: InboxErrorCode; href?: string; sent?: number };

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Nome utente e nome mostrato di chi scrive, per l'avviso Discord (letti solo se l'avviso parte davvero). */
async function authorFor(client: Db, userId: string) {
  const { data } = await client.from("profiles").select("username, display_name").eq("id", userId).maybeSingle();
  const p = data as { username: string | null; display_name: string | null } | null;
  return { username: p?.username ?? null, displayName: p?.display_name ?? null };
}

/** "Scrivi allo staff": un utente apre una conversazione nuova. Porta alla conversazione appena creata. */
export async function startConversation(_prev: InboxActionState, formData: FormData): Promise<InboxActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(formData);
  const subject = checkSubject(formData.get("subject"));
  if (!subject.ok) return { error: subject.error };
  const message = checkMessage(formData.get("body"));
  if (!message.ok) return { error: message.error };
  const { data, error } = await supabase.rpc("inbox_start", { topic: subject.subject, content: message.body, via_feedback: false });
  if (error || typeof data !== "string") return { error: inboxErrorCode(error) };
  if (staffNoticeEnabled()) {
    const author = await authorFor(supabase, user.id);
    notifyStaff({ conversationId: data, ...author, subject: subject.subject, body: message.body, isNew: true });
  }
  return { href: userThreadPath(locale, data), sent: Date.now() };
}

/**
 * "Nuovo messaggio a un utente" dall'area staff: lo staff scrive per primo, al nome utente indicato. La RPC controlla
 * che chi scrive sia dello staff. Porta alla conversazione nell'area staff.
 */
export async function staffStartConversation(_prev: InboxActionState, formData: FormData): Promise<InboxActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(formData);
  const username = cleanUsername(formData.get("to"));
  if (!username) return { error: "badUsername" };
  const subject = checkSubject(formData.get("subject"));
  if (!subject.ok) return { error: subject.error };
  const message = checkMessage(formData.get("body"));
  if (!message.ok) return { error: message.error };
  const { data, error } = await supabase.rpc("inbox_staff_start", { uname: username, topic: subject.subject, content: message.body });
  if (error || typeof data !== "string") return { error: inboxErrorCode(error) };
  return { href: staffThreadPath(locale, data), sent: Date.now() };
}

/**
 * Risposta in una conversazione, dall'utente o dallo staff: lo decide il database. Se ha scritto l'utente, avviso allo
 * staff su Discord. `refresh()` ridisegna la pagina con il messaggio nuovo.
 */
export async function replyToConversation(_prev: InboxActionState, formData: FormData): Promise<InboxActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "unavailable" };
  if (!user) return { error: "notLoggedIn" };
  const id = formData.get("id");
  if (!isUuid(id)) return { error: "notFound" };
  const message = checkMessage(formData.get("body"));
  if (!message.ok) return { error: message.error };
  const { data: fromStaff, error } = await supabase.rpc("inbox_send", { cid: id, content: message.body });
  if (error) return { error: inboxErrorCode(error) };
  if (fromStaff === false && staffNoticeEnabled()) {
    const [{ data: conv }, author] = await Promise.all([supabase.from("conversations").select("subject").eq("id", id).maybeSingle(), authorFor(supabase, user.id)]);
    notifyStaff({ conversationId: id, ...author, subject: (conv as { subject: string } | null)?.subject ?? "", body: message.body, isNew: false });
  }
  refresh();
  return { sent: Date.now() };
}

/** Chiude o riapre una conversazione (solo staff: lo controlla la RPC). Torna alla conversazione nell'area staff. */
export async function setConversationStatus(formData: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(formData);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = formData.get("id");
  if (!isUuid(id)) redirect(`/${locale}/account`);
  const status = formData.get("status") === "closed" ? "closed" : "open";
  const { error } = await supabase.rpc("inbox_set_status", { cid: id, new_status: status });
  if (error) console.error("[inbox] inbox_set_status:", error.code ?? "", error.message);
  redirect(staffThreadPath(locale, id));
}

/**
 * Segna come letta una conversazione fino all'ultimo messaggio mostrato (`seen`, data ISO): la chiama la pagina della
 * conversazione appena si apre nel browser (`MarkRead`). `changed` = c'era qualcosa da leggere.
 */
export async function markConversationRead(id: string, seen: string | null): Promise<{ changed: boolean }> {
  const { supabase, user } = await currentUser();
  if (!supabase || !user || !isUuid(id)) return { changed: false };
  const at = typeof seen === "string" && seen.length <= 40 && Number.isFinite(Date.parse(seen)) ? seen : null;
  const { data, error } = await supabase.rpc("inbox_mark_read", { cid: id, seen: at });
  if (error) {
    console.error("[inbox] inbox_mark_read:", error.code ?? "", error.message);
    return { changed: false };
  }
  return { changed: data === true };
}

/** Al massimo tante conversazioni segnate a ogni ingresso nella casella (di solito sono una o due). */
const SEEN_MAX_CONVERSATIONS = 100;
/** Al massimo tanti avvisi a chiamata: il tetto di `notifications_mark_read`. */
const SEEN_MAX_NOTIFICATIONS = 200;

/**
 * Entrare nella casella spegne la busta (22/10/2026, Pierluigi: "che io legga o non legga i messaggi, quelle notifiche
 * da quel momento in poi devono sparire e segnare come letti i messaggi e notifiche varie, non esiste che uscendo in
 * home ad esempio, io riveda ancora le notifiche"; scelta: per lo staff anche i messaggi degli utenti allo staff, che
 * arrivano comunque anche sul canale Discord privato). La chiama il browser appena si apre /account/messages o l'area
 * staff (`MarkInboxSeen`), mai il disegno della pagina sul server (prefetch, anteprime). Segna come letti, fino a `seen`
 * (quando la pagina è stata disegnata: quello che arriva dopo resta da leggere), tutto quello che la busta conta: le
 * proprie conversazioni con messaggi dello staff da leggere, i propri avvisi e, per chi è dello staff, le conversazioni
 * degli altri con messaggi da leggere. Con le RPC di sempre (`inbox_mark_read`, `notifications_mark_read`): nessuna
 * migrazione. `messages` = conversazioni segnate, `notifications` = avvisi segnati.
 */
export async function markInboxSeen(seen: string): Promise<{ messages: number; notifications: number }> {
  const none = { messages: 0, notifications: 0 };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return none;
  const parsed = typeof seen === "string" && seen.length <= 40 ? Date.parse(seen) : NaN;
  const at = new Date(Number.isFinite(parsed) ? Math.min(parsed, Date.now()) : Date.now()).toISOString();
  const [own, staff, notes] = await Promise.all([
    supabase.from("conversations").select("id").eq("user_id", user.id).eq("unread_by_user", true).limit(SEEN_MAX_CONVERSATIONS),
    supabase.rpc("is_staff"),
    supabase.from("notifications").select("id").eq("user_id", user.id).is("read_at", null).lte("created_at", at).limit(SEEN_MAX_NOTIFICATIONS),
  ]);
  // la casella dello staff è condivisa: la lettura dello staff vale per tutto lo staff, come aprire una conversazione
  const others =
    staff.data === true
      ? await supabase.from("conversations").select("id").eq("unread_by_staff", true).neq("user_id", user.id).limit(SEEN_MAX_CONVERSATIONS)
      : null;
  for (const [what, res] of [["conversazioni", own], ["avvisi", notes], ["conversazioni dello staff", others]] as const) {
    // prima della migrazione di un pacchetto (avvisi) la tabella manca: niente da segnare, niente da dire
    if (res?.error && res.error.code !== "PGRST205" && res.error.code !== "42P01") console.error(`[inbox] da segnare (${what}):`, res.error.code ?? "", res.error.message);
  }
  const conversations = [...(own.data ?? []), ...(others?.data ?? [])].map((r) => (r as { id: string }).id);
  const marked = await Promise.all(
    conversations.map(async (cid) => {
      const { data, error } = await supabase.rpc("inbox_mark_read", { cid, seen: at });
      if (error) console.error("[inbox] inbox_mark_read:", error.code ?? "", error.message);
      return data === true;
    }),
  );
  const noteIds = (notes.data ?? []).map((r) => Number((r as { id: number }).id));
  let notifications = 0;
  if (noteIds.length) {
    const { data, error } = await supabase.rpc("notifications_mark_read", { p_ids: noteIds });
    if (error) console.error("[inbox] notifications_mark_read:", error.code ?? "", error.message);
    else notifications = Number(data ?? 0);
  }
  return { messages: marked.filter(Boolean).length, notifications };
}
