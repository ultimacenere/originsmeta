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
import { InboxSectionView, UnreadLine, UserConversationList } from "@/components/inbox/InboxSection";
import { InboxUnavailable } from "@/components/inbox/InboxUnavailable";
import { NotificationsJump, NotificationsSection } from "@/components/follow/NotificationsSection";

/**
 * La casella messaggi dell'utente con lo staff (26/09/2026, pacchetto INBOX). Dal 27/09/2026 vive tutta qui, dove
 * porta la busta dell'header, e non più dentro /account: la prima pagina ha l'elenco, il tasto dell'area staff e il
 * modulo "Scrivi allo staff"; le conversazioni più vecchie stanno nelle pagine successive, da 30. Pagina privata,
 * dinamica, noindex; fuori da sitemap e hreflang. Chi non ha fatto l'accesso va alla pagina di accesso e poi torna qui.
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
        <Link href={href(locale, "/account")} prefetch={false} className="link-mint font-bold">
          ← {L.thread.back}
        </Link>
      </p>
      {page === 1 ? (
        <div className="mt-6">
          <InboxSectionView
            locale={locale}
            list={list}
            unread={status.ok ? status.data.unread : null}
            staffUnread={status.ok && status.data.staff ? status.data.staffUnread : null}
            afterIntro={<NotificationsJump locale={locale} supabase={supabase} userId={user.id} />}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
      {/* Notifiche dei profili seguiti (pacchetto SEGUI, 27/09/2026), solo sulla prima pagina; ancora #notifications */}
      {page === 1 ? <NotificationsSection locale={locale} supabase={supabase} userId={user.id} /> : null}
    </div>
  );
}
