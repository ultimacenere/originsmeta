import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { inboxLabels } from "@/lib/inboxLabels";
import { fillInbox, staffInboxPath, userInboxPath, userThreadPath } from "@/lib/community/messages";
import { listUserConversations, readInboxStatus, type ConversationSummary, type Result } from "@/lib/community/inboxQueries";
import { InboxTime } from "./InboxTime";
import { NewConversationForm } from "./InboxForms";

/**
 * Sezione "Messaggi" di /account (26/09/2026, pacchetto INBOX): le conversazioni dell'utente con lo staff, dalla più
 * recente, con quelle che hanno una risposta nuova in evidenza, e il modulo "Scrivi allo staff". Allo staff mostra
 * anche il tasto per l'area staff con il numero delle conversazioni degli utenti da leggere.
 *
 * Qui c'è la prima pagina dell'elenco; le più vecchie stanno in /account/messages (`?page=`). Il numero delle
 * conversazioni con risposte nuove viene da `inbox_status`, come il pallino del menu: conta tutte le conversazioni,
 * non solo quelle della prima pagina.
 *
 * Server component con la sessione dell'utente (/account è dinamica). Se le tabelle non ci sono ancora (migrazione non
 * applicata) o il database non risponde, la sezione lo dice e il resto del profilo resta com'è.
 */
export async function InboxSection({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const [list, status] = await Promise.all([listUserConversations(supabase, userId), readInboxStatus(supabase)]);
  return (
    <InboxSectionView
      locale={locale}
      list={list}
      unread={status.ok ? status.data.unread : null}
      staffUnread={status.ok && status.data.staff ? status.data.staffUnread : null}
    />
  );
}

type ListResult = Result<{ rows: ConversationSummary[]; more: boolean }>;

/**
 * La sezione dai dati già letti. `unread` = conversazioni con risposte nuove (null se non si sa: allora si contano
 * quelle mostrate); `staffUnread` null = chi guarda non è dello staff.
 */
export function InboxSectionView({ locale, list, unread, staffUnread }: { locale: Locale; list: ListResult; unread: number | null; staffUnread: number | null }) {
  const L = inboxLabels[locale];
  const rows = list.ok ? list.data.rows : [];
  const unreadCount = unread ?? rows.filter((c) => c.unread_by_user).length;

  return (
    <section id="messages" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{L.section.title}</h2>
        {staffUnread !== null ? (
          <Link href={staffInboxPath(locale)} prefetch={false} className="btn btn-ink text-xs">
            {L.section.staffArea}
            {staffUnread ? ` (${staffUnread})` : ""} →
          </Link>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.section.intro}</p>

      {!list.ok ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.section.unavailable}</p>
        </div>
      ) : (
        <>
          <UnreadLine locale={locale} n={unreadCount} />
          {rows.length === 0 ? (
            <div className="card-night mt-4 p-6">
              <p className="text-pale-muted">{L.section.empty}</p>
            </div>
          ) : (
            <UserConversationList locale={locale} rows={rows} />
          )}
          {list.data.more ? (
            <p className="mt-4 text-sm">
              <Link href={userInboxPath(locale, 2)} prefetch={false} className="btn btn-ink text-xs">
                {L.section.older} →
              </Link>
            </p>
          ) : null}
          {/* "Scrivi allo staff": aperto da subito quando la casella è vuota */}
          <details className="card-night mt-4 p-5" open={rows.length === 0}>
            <summary className="cursor-pointer font-display font-bold text-mint">{L.section.write}</summary>
            <NewConversationForm mode="user" locale={locale} labels={L.form} sending={L.thread.sending} errors={L.errors} />
          </details>
        </>
      )}
    </section>
  );
}

/** "N conversazioni con risposte nuove", in menta; niente se sono zero. */
export function UnreadLine({ locale, n }: { locale: Locale; n: number }) {
  const L = inboxLabels[locale];
  if (n < 1) return null;
  return <p className="mt-3 text-sm font-bold text-mint">{n === 1 ? L.section.unreadOne : fillInbox(L.section.unreadMany, { n })}</p>;
}

/** Elenco delle conversazioni dell'utente: stato, origine, oggetto, inizio dell'ultimo messaggio, ora. */
export function UserConversationList({ locale, rows }: { locale: Locale; rows: ConversationSummary[] }) {
  const L = inboxLabels[locale];
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3">
      {rows.map((c) => (
        <li key={c.id}>
          <Link href={userThreadPath(locale, c.id)} prefetch={false} className="card-night card-night-hover flex flex-col gap-1.5 p-4">
            <span className="flex flex-wrap items-center gap-2">
              {c.unread_by_user ? <span className="stat-pill bg-mint text-[11px] font-semibold uppercase text-ink">{L.section.newBadge}</span> : null}
              <span className="stat-pill bg-sky text-[11px] font-semibold uppercase text-ink">{L.origin[c.origin]}</span>
              {c.status === "closed" ? <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{L.status.closed}</span> : null}
            </span>
            <span className="t-item break-words leading-tight">{c.subject}</span>
            {c.last_preview ? (
              <span className="line-clamp-2 break-words text-sm text-pale-muted">
                <span className="font-bold text-pale">{c.last_from_staff ? L.thread.staff : L.thread.you}:</span> {c.last_preview}
              </span>
            ) : null}
            <span className="font-mono text-xs text-pale-muted">
              <InboxTime iso={c.last_message_at} locale={locale} utcLabel={L.thread.utcLabel} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
