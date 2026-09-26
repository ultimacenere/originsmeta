import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { inboxLabels } from "@/lib/inboxLabels";
import { staffThreadPath } from "@/lib/community/messages";
import type { StaffConversation } from "@/lib/community/inboxQueries";
import { Avatar } from "@/components/AccountMenu";
import { InboxTime } from "./InboxTime";

/**
 * Elenco delle conversazioni nell'area staff (26/09/2026, pacchetto INBOX): chi è l'utente, oggetto, inizio dell'ultimo
 * messaggio, da leggere / aspetta una risposta / risposto, origine e stato. Ogni riga apre la conversazione.
 */
export function StaffConversationList({ locale, rows }: { locale: Locale; rows: StaffConversation[] }) {
  const L = inboxLabels[locale];
  return (
    <ul className="mt-6 grid grid-cols-1 gap-3">
      {rows.map((c) => {
        const name = (c.user?.display_name || c.user?.username || "").trim() || L.thread.deletedUser;
        return (
          <li key={c.id}>
            <Link href={staffThreadPath(locale, c.id)} prefetch={false} className="card-night card-night-hover flex gap-4 p-4">
              <Avatar profile={c.user} name={name} size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-center gap-2">
                  {c.unread_by_staff ? <span className="stat-pill bg-mint text-[11px] font-semibold uppercase text-ink">{L.staff.filters.unread}</span> : null}
                  <span className="stat-pill bg-sky text-[11px] font-semibold uppercase text-ink">{L.originStaff[c.origin]}</span>
                  <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{L.status[c.status]}</span>
                  {c.status === "open" ? (
                    <span className={`text-xs font-bold ${c.last_from_staff ? "text-pale-muted" : "text-mint"}`}>{c.last_from_staff ? L.staff.replied : L.staff.waiting}</span>
                  ) : null}
                </span>
                <span className="t-item break-words leading-tight">{c.subject}</span>
                <span className="break-all font-mono text-xs text-pale-muted">
                  {name}
                  {c.user?.username ? ` · @${c.user.username}` : ""}
                </span>
                {c.last_preview ? (
                  <span className="line-clamp-2 break-words text-sm text-pale-muted">
                    <span className="font-bold text-pale">{c.last_from_staff ? L.thread.staff : name}:</span> {c.last_preview}
                  </span>
                ) : null}
                <span className="font-mono text-xs text-pale-muted">
                  <InboxTime iso={c.last_message_at} locale={locale} utcLabel={L.thread.utcLabel} />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
