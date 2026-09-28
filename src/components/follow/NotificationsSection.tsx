import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { authorName } from "@/lib/community/util";
import { NOTIFICATIONS_ANCHOR, goneUnreadIds, notificationHref } from "@/lib/community/notifications";
import { listNotifications, unreadNotificationCount, type NotificationItem } from "@/lib/community/notificationQueries";
import { fillFollowLabel, followLabels, type FollowLabels } from "@/lib/followLabels";
import { Avatar } from "@/components/AccountMenu";
import { InboxTime } from "@/components/inbox/InboxTime";
import { MarkAllRead, MarkGoneRead, NotificationLink } from "./NotificationControls";

/**
 * Sezione "Notifiche" di /account/messages (pacchetto SEGUI, 27/09/2026): gli avvisi dei profili seguiti (mazzo
 * pubblicato, diretta su Twitch, guida pubblicata), dal più recente, quelli da leggere in evidenza, "Segna tutte come
 * lette" e il link alla cosa notificata. Ancora #notifications: la busta dell'header porta qui quando le novità sono solo
 * avvisi. Server component con la sessione (pagina privata e dinamica). Prima della migrazione la sezione non compare;
 * con il database giù dice che le notifiche non sono disponibili.
 */
export async function NotificationsSection({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const L = followLabels[locale].notifications;
  const res = await listNotifications(supabase, userId);
  if (!res.ok && res.error === "unavailable") return null;
  const items = res.ok ? res.data.items : [];
  const unread = res.ok ? res.data.unread : 0;
  // mazzi e guide non più online: niente da aprire, si segnano come letti da soli (29/09/2026)
  const gone = goneUnreadIds(items);

  return (
    <section id={NOTIFICATIONS_ANCHOR} className="mt-12 scroll-mt-24">
      {gone.length ? <MarkGoneRead ids={gone} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{L.title}</h2>
        {unread > 0 ? <MarkAllRead label={L.markAll} pendingLabel={L.marking} errorLabel={L.error} /> : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>
      {unread > 0 ? <p className="mt-3 text-sm font-bold text-mint">{unread === 1 ? L.unreadOne : fillFollowLabel(L.unreadMany, { n: unread })}</p> : null}

      {!res.ok ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.unavailable}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.empty}</p>
          <p className="mt-3">
            <Link href={href(locale, "/creators")} className="btn btn-ink text-xs">
              {L.browse} →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationCard item={n} locale={locale} L={L} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm">
        <Link href={`${href(locale, "/account")}#following`} prefetch={false} className="link-mint font-bold">
          {L.manage} →
        </Link>
      </p>
    </section>
  );
}

/**
 * In cima a /account/messages, sotto il titolo: "3 notifiche nuove" con il link alla sezione, che sta in fondo alla
 * pagina dopo le conversazioni (così l'elenco delle conversazioni resta subito sotto il titolo della pagina). Niente se
 * non ci sono avvisi da leggere.
 */
export async function NotificationsJump({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const n = await unreadNotificationCount(supabase, userId);
  if (n < 1) return null;
  const L = followLabels[locale].notifications;
  return (
    <p className="mt-3 text-sm">
      <a href={`#${NOTIFICATIONS_ANCHOR}`} className="link-mint font-bold">
        {n === 1 ? L.jumpOne : fillFollowLabel(L.jumpMany, { n })} ↓
      </a>
    </p>
  );
}

/** Il testo di un avviso: chi ha fatto che cosa, con il nome del mazzo o il titolo della guida quando c'è. Solo testo semplice. */
function notificationText(n: NotificationItem, L: FollowLabels["notifications"]): string {
  const name = n.actor ? authorName(n.actor) : L.someone;
  if (n.kind === "live") return fillFollowLabel(L.live, { name });
  if (n.kind === "guide_published") return n.guideTitle ? fillFollowLabel(L.guidePublished, { name, guide: n.guideTitle }) : fillFollowLabel(L.guideGone, { name });
  return n.deckName ? fillFollowLabel(L.deckPublished, { name, deck: n.deckName }) : fillFollowLabel(L.deckGone, { name });
}

function NotificationCard({ item: n, locale, L }: { item: NotificationItem; locale: Locale; L: FollowLabels["notifications"] }) {
  const unread = !n.read_at;
  const name = n.actor ? authorName(n.actor) : L.someone;
  // un mazzo o una guida non più online non ha link (porterebbe a una pagina che non c'è)
  const gone = (n.kind === "deck_published" && !n.deckName) || (n.kind === "guide_published" && !n.guideTitle);
  const link = gone ? null : notificationHref(locale, n.target);
  const body = (
    <>
      <Avatar profile={n.actor} name={name} size={36} />
      <span className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          {unread ? <span className="stat-pill bg-mint text-[11px] font-semibold uppercase text-ink">{L.newBadge}</span> : null}
          <span className={`stat-pill text-[11px] font-semibold uppercase ${n.kind === "live" ? "bg-crimson-deep text-chalk" : "bg-sky text-ink"}`}>{L.kinds[n.kind]}</span>
        </span>
        <span className={`break-words leading-snug ${unread ? "font-bold text-pale" : "text-pale-muted"}`}>{notificationText(n, L)}</span>
        <span className="font-mono text-xs text-pale-muted">
          <InboxTime iso={n.created_at} locale={locale} utcLabel={L.utcLabel} />
        </span>
      </span>
    </>
  );
  const box = `card-night flex flex-wrap items-start gap-3 p-4 ${unread ? "border-mint" : ""}`;
  if (!link) return <div className={box}>{body}</div>;
  return (
    <NotificationLink id={n.id} href={link} kind={n.kind} unread={unread} className={`${box} card-night-hover`}>
      {body}
    </NotificationLink>
  );
}
