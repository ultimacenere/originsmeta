import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { inboxLabels } from "@/lib/inboxLabels";
import { isUuid } from "@/lib/community/util";
import { staffThreadPath } from "@/lib/community/messages";
import { getConversation, listMessages, viewerIsStaff } from "@/lib/community/inboxQueries";
import { privateInboxMeta } from "@/lib/community/inboxPage";
import { ConversationView } from "@/components/inbox/ConversationView";

/**
 * Una conversazione dell'utente con lo staff (26/09/2026, pacchetto INBOX): pagina privata, dinamica, noindex. La
 * vede solo l'utente della conversazione (policy RLS più il controllo qui sotto); chi è dello staff e apre la
 * conversazione di un altro va alla vista dello staff. Tutti gli altri: 404, senza dire se la conversazione esiste.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = inboxLabels[locale].meta;
  return privateInboxMeta(L.threadTitle, L.threadDescription);
}

export default async function ConversationPage({ params }: { params: Params }) {
  const { locale } = await resolveLocale(params);
  const { id } = await params;
  const L = inboxLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.section.unavailable}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, `/account/messages/${isUuid(id) ? id : ""}`))}`);
  if (!isUuid(id)) notFound();

  const conv = await getConversation(supabase, id);
  if (!conv.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.section.unavailable}</p>
      </div>
    );
  }
  if (!conv.data) notFound();
  if (conv.data.user_id !== user.id) {
    // la policy la mostra a chi è dello staff: la sua vista è quella dell'area staff
    if (await viewerIsStaff(supabase)) redirect(staffThreadPath(locale, id));
    notFound();
  }
  const thread = await listMessages(supabase, id);
  if (!thread.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.section.unavailable}</p>
      </div>
    );
  }
  return <ConversationView locale={locale} view="user" viewerId={user.id} conversation={conv.data} messages={thread.data.messages} truncated={thread.data.truncated} />;
}
