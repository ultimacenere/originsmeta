import Link from "next/link";
import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { inboxLabels } from "@/lib/inboxLabels";
import { THREAD_MESSAGES_MAX, authorKind, fillInbox, lastSeen, staffInboxPath, withSafeAvatar } from "@/lib/community/messages";
import type { InboxProfile, StaffConversation, ThreadMessage } from "@/lib/community/inboxQueries";
import { setConversationStatus } from "@/lib/community/inboxActions";
import { Avatar } from "@/components/AccountMenu";
import { InboxTime } from "./InboxTime";
import { ReplyForm } from "./InboxForms";
import { MarkRead } from "./MarkRead";

/**
 * Una conversazione della casella messaggi (26/09/2026, pacchetto INBOX), in due viste:
 * - `user` (/account/messages/<id>): l'utente con lo staff, che firma sempre "Staff di OriginsMeta";
 * - `staff` (/account/staff/messages/<id>): lo staff vede chi è l'utente (avatar, nome, tag, profilo pubblico), il nome
 *   di chi dello staff ha scritto ogni risposta, e può chiudere o riaprire la conversazione.
 * I messaggi sono testo semplice: React li scrive come testo, con gli a capo (whitespace-pre-wrap), mai come HTML.
 */

type Props = {
  locale: Locale;
  view: "user" | "staff";
  viewerId: string;
  conversation: StaffConversation;
  messages: ThreadMessage[];
  truncated: boolean;
};

const nameOf = (p: InboxProfile | null | undefined) => (p?.display_name || p?.username || "").trim();

export function ConversationView({ locale, view, viewerId, conversation: c, messages, truncated }: Props) {
  const L = inboxLabels[locale];
  const d = getDictionary(locale);
  const staffView = view === "staff";
  const userName = nameOf(c.user) || L.thread.deletedUser;
  const closed = c.status === "closed";
  const origin = staffView ? L.originStaff[c.origin] : L.origin[c.origin];
  const badge = c.user?.badge && c.user.badge !== "community" ? c.user.badge : null;
  const unread = staffView ? c.unread_by_staff : c.unread_by_user;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={staffView ? staffInboxPath(locale) : `${href(locale, "/account")}#messages`} prefetch={false} className="link-mint font-bold">
          ← {staffView ? L.thread.backStaff : L.thread.back}
        </Link>
      </p>
      <p className="kicker mt-6 text-mint">{staffView ? L.staff.kicker : L.section.title}</p>
      <h1 className="t-page mt-2 break-words">{c.subject}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-2">
        <span className="stat-pill bg-sky text-[11px] font-semibold uppercase text-ink">{origin}</span>
        <span className={`stat-pill text-[11px] font-semibold uppercase ${closed ? "bg-night-3 text-pale" : "bg-mint text-ink"}`}>{L.status[c.status]}</span>
        <span className="font-mono text-xs text-pale-muted">{fillInbox(L.thread.started, { date: formatDate(locale, c.created_at.slice(0, 10)) })}</span>
      </p>

      {staffView ? (
        <section className="card-night mt-6 flex flex-wrap items-center gap-4 p-5" aria-label={L.thread.user}>
          {/* foto solo da Discord (safeAvatarUrl): un indirizzo qualsiasi direbbe a chi scrive l'IP dello staff */}
          <Avatar profile={withSafeAvatar(c.user)} name={userName} size={48} />
          <div className="min-w-0 flex-1 basis-48">
            <p className="kicker text-pale-muted">{L.thread.user}</p>
            <p className="t-item break-words">{userName}</p>
            {c.user?.username ? <p className="break-all font-mono text-xs text-pale-muted">@{c.user.username}</p> : null}
            {badge ? (
              <p className="mt-2">
                <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community}`}>{d.community.badges[badge as keyof typeof d.community.badges] ?? badge}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {c.user?.username ? (
              <Link href={href(locale, `/u/${c.user.username}`)} className="btn btn-ink text-xs">
                {L.thread.publicProfile}
              </Link>
            ) : null}
            <form action={setConversationStatus}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="status" value={closed ? "open" : "closed"} />
              <button type="submit" className="btn btn-ink cursor-pointer text-xs">
                {closed ? L.thread.reopen : L.thread.close}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {closed ? <p className="mt-6 text-sm font-bold text-pale">{staffView ? L.thread.closedNoteStaff : L.thread.closedNote}</p> : null}
      {truncated ? <p className="mt-6 text-xs text-pale-muted">{fillInbox(L.thread.olderHidden, { n: THREAD_MESSAGES_MAX })}</p> : null}

      <ol className="card-night mt-6 flex flex-col gap-3 p-4 sm:p-5" aria-label={L.section.title}>
        {messages.map((m) => {
          const kind = authorKind(m, viewerId, view);
          // a destra i messaggi della propria parte: dell'utente nella sua vista, dello staff nella vista dello staff
          const ours = staffView ? m.from_staff : !m.from_staff;
          const who =
            kind === "you"
              ? L.thread.you
              : kind === "staff"
                ? staffView
                  ? `${nameOf(m.author) || L.thread.staff} · ${d.community.badges.staff}`
                  : L.thread.staff
                : userName;
          return (
            <li key={m.id} className={`max-w-[92%] rounded-xl border-2 px-4 py-3 sm:max-w-[80%] ${ours ? "self-end border-mint bg-night-2" : "self-start border-sky bg-night-2"}`}>
              <p className="font-mono text-[11px] text-pale-muted">
                <span className="font-bold text-pale">{who}</span> · <InboxTime iso={m.created_at} locale={locale} utcLabel={L.thread.utcLabel} />
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-pale">{m.body}</p>
            </li>
          );
        })}
      </ol>

      <ReplyForm id={c.id} locale={locale} view={view} labels={L.thread} hint={L.form.hint} errors={L.errors} />
      {staffView ? <p className="mt-3 text-xs text-pale-muted">{L.thread.staffNote}</p> : null}
      <MarkRead id={c.id} seen={lastSeen(messages)} unread={unread} view={view} />
    </div>
  );
}
