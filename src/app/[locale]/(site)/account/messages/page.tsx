import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { inboxLabels } from "@/lib/inboxLabels";
import { pageNumber, userInboxPath } from "@/lib/community/messages";
import { listUserConversations, readInboxStatus } from "@/lib/community/inboxQueries";
import { privateInboxMeta } from "@/lib/community/inboxPage";
import { UnreadLine, UserConversationList } from "@/components/inbox/InboxSection";
import { InboxUnavailable } from "@/components/inbox/InboxUnavailable";

/**
 * Tutte le conversazioni dell'utente con lo staff, a pagine da 30 (26/09/2026, pacchetto INBOX): /account mostra solo
 * la prima pagina e da lì porta qui per le più vecchie. Pagina privata, dinamica, noindex; fuori da sitemap e hreflang.
 * Chi non ha fatto l'accesso va alla pagina di accesso e poi torna qui.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = inboxLabels[locale].meta;
  return privateInboxMeta(L.listTitle, L.listDescription);
}

export default async function UserInboxPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await resolveLocale(params);
  const sp = await searchParams;
  const L = inboxLabels[locale];
  const page = pageNumber(sp.page);
  const { supabase, user } = await currentUser();
  if (!supabase) return <InboxUnavailable text={L.section.unavailable} />;
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(userInboxPath(locale, page))}`);

  const [list, status] = await Promise.all([listUserConversations(supabase, user.id, page), readInboxStatus(supabase)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={`${href(locale, "/account")}#messages`} prefetch={false} className="link-mint font-bold">
          ← {L.thread.back}
        </Link>
      </p>
      <p className="kicker mt-6 text-mint">{L.section.title}</p>
      <h1 className="t-page mt-2">{L.section.allTitle}</h1>

      {!list.ok ? (
        <div className="card-night mt-6 p-6">
          <p className="text-pale-muted">{L.section.unavailable}</p>
        </div>
      ) : (
        <>
          <UnreadLine locale={locale} n={status.ok ? status.data.unread : 0} />
          {list.data.rows.length === 0 ? (
            <div className="card-night mt-4 p-6">
              <p className="text-pale-muted">{page > 1 ? L.staff.empty : L.section.empty}</p>
            </div>
          ) : (
            <UserConversationList locale={locale} rows={list.data.rows} />
          )}
          {page > 1 || list.data.more ? (
            <nav className="mt-6 flex flex-wrap items-center gap-3 text-sm" aria-label={L.section.allTitle}>
              {page > 1 ? (
                <Link href={userInboxPath(locale, page - 1)} prefetch={false} className="btn btn-ink text-xs">
                  ← {L.staff.newer}
                </Link>
              ) : null}
              <span className="font-mono text-xs text-pale-muted">{L.staff.page.replace("{n}", String(page))}</span>
              {list.data.more ? (
                <Link href={userInboxPath(locale, page + 1)} prefetch={false} className="btn btn-ink text-xs">
                  {L.staff.older} →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
