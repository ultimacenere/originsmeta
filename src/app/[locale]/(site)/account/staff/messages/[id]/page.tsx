import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { inboxLabels } from "@/lib/inboxLabels";
import { isUuid } from "@/lib/community/util";
import { userThreadPath } from "@/lib/community/messages";
import { getConversation, listMessages, viewerIsStaff } from "@/lib/community/inboxQueries";
import { privateInboxMeta } from "@/lib/community/inboxPage";
import { ConversationView } from "@/components/inbox/ConversationView";
import { InboxUnavailable } from "@/components/inbox/InboxUnavailable";

/**
 * Una conversazione vista dallo staff (26/09/2026, pacchetto INBOX): chi è l'utente, tutte le risposte con il nome di
 * chi dello staff le ha scritte, risposta, chiusura e riapertura. È la pagina a cui porta il link dell'avviso Discord.
 * Solo staff (admin o tag Staff): chi ha fatto l'accesso e non è dello staff riceve un 404; chi non ha fatto l'accesso
 * va alla pagina di accesso e poi torna qui (è il caso dello staff che apre il link da Discord su un altro dispositivo).
 * Senza la migrazione o con il database giù: "messaggi non disponibili", non un 404.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = inboxLabels[locale].meta;
  return privateInboxMeta(L.staffTitle, L.staffDescription);
}

export default async function StaffConversationPage({ params }: { params: Params }) {
  const { locale } = await resolveLocale(params);
  const { id } = await params;
  const L = inboxLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, `/account/staff/messages/${isUuid(id) ? id : ""}`))}`);
  if (!isUuid(id)) notFound();
  const staff = await viewerIsStaff(supabase);
  if (!staff.ok) return <InboxUnavailable text={L.section.unavailable} />;
  if (!staff.data) notFound();

  const conv = await getConversation(supabase, id);
  if (!conv.ok) return <InboxUnavailable text={L.section.unavailable} />;
  if (!conv.data) notFound();
  // la propria conversazione (un membro dello staff che ha scritto allo staff) si legge dalla propria casella
  if (conv.data.user_id === user.id) redirect(userThreadPath(locale, id));
  const thread = await listMessages(supabase, id, true);
  if (!thread.ok) return <InboxUnavailable text={L.section.unavailable} />;
  return <ConversationView locale={locale} view="staff" viewerId={user.id} conversation={conv.data} messages={thread.data.messages} truncated={thread.data.truncated} />;
}
