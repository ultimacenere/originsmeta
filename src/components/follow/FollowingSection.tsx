import Link from "next/link";
import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { FOLLOW_MAX } from "@/lib/community/follows";
import { listFollowing } from "@/lib/community/followQueries";
import { fillFollowLabel, followLabels } from "@/lib/followLabels";
import { Avatar } from "@/components/AccountMenu";
import { UnfollowButton } from "./UnfollowButton";

/**
 * Sezione "Chi segui" di /account (pacchetto SEGUI, 27/09/2026): i profili seguiti, dal più recente, con il ruolo, il
 * link alla pagina /u e "Smetti di seguire". Ancora #following (la sezione "Notifiche" ci porta con "Gestisci chi
 * segui"). Server component con la sessione dell'utente (/account è dinamica); prima della migrazione, o con il
 * database giù, la sezione lo dice e il resto del profilo resta com'è.
 */
export async function FollowingSection({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const L = followLabels[locale].account;
  const badges = getDictionary(locale).community.badges;
  const res = await listFollowing(supabase, userId);
  const list = res.ok ? res.data : [];

  return (
    <section id="following" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{L.title}</h2>
        <Link href={href(locale, "/creators")} className="btn btn-ink text-xs">
          {L.browse} →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>

      {!res.ok ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.unavailable}</p>
        </div>
      ) : list.length === 0 ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.empty}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 font-mono text-xs text-pale-muted">
            {list.length === 1 ? L.countOne : fillFollowLabel(L.countMany, { n: list.length, max: FOLLOW_MAX })}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {list.map((p) => {
              const name = authorName(p);
              const role = shownBadge(p.badge);
              return (
                <li key={p.id} className="card-night flex flex-wrap items-center gap-3 p-4">
                  <Avatar profile={p} name={name} size={40} />
                  <div className="min-w-0 flex-1 basis-40">
                    {p.username ? (
                      <Link href={href(locale, `/u/${p.username}`)} className="t-item block truncate leading-tight hover:text-mint">
                        {name}
                      </Link>
                    ) : (
                      <p className="t-item truncate leading-tight">{name}</p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-pale-muted">
                      {role ? <span className={`${badgePill} ${badgeStyle[role]}`}>{badges[role]}</span> : null}
                      <span>{fillFollowLabel(L.since, { date: formatDate(locale, p.since.slice(0, 10)) })}</span>
                    </p>
                  </div>
                  <UnfollowButton
                    profileId={p.id}
                    label={L.unfollow}
                    ariaLabel={fillFollowLabel(L.unfollowAria, { name })}
                    pendingLabel={L.unfollowing}
                    errorLabel={followLabels[locale].notifications.error}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
