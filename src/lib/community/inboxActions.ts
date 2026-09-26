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
