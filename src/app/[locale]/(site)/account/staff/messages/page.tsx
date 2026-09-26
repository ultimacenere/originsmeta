import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { inboxLabels } from "@/lib/inboxLabels";
import { STAFF_FILTERS, cleanUsername, pageNumber, staffFilter, staffInboxPath, type StaffFilter } from "@/lib/community/messages";
import { listStaffConversations, viewerIsStaff } from "@/lib/community/inboxQueries";
import { privateInboxMeta } from "@/lib/community/inboxPage";
import { StaffConversationList } from "@/components/inbox/StaffConversationList";
import { NewConversationForm } from "@/components/inbox/InboxForms";
import { InboxUnavailable } from "@/components/inbox/InboxUnavailable";

/**
 * Area staff della casella messaggi (26/09/2026, pacchetto INBOX): tutte le conversazioni fra gli utenti e lo staff,
 * con i filtri Da leggere / Aperte / Chiuse / Tutte, e il modulo "Nuovo messaggio a un utente" (per nome utente; il
 * link "Scrivi a questo utente" delle pagine /u/<nome> lo apre con il nome già scritto, `?to=<nome>#new`).
 * Solo staff (admin o tag Staff): per gli altri iscritti 404; chi non ha fatto l'accesso va alla pagina di accesso.
 * Dinamica e noindex; fuori da sitemap e hreflang.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = inboxLabels[locale].meta;
  return privateInboxMeta(L.staffTitle, L.staffDescription);
}

/** Indirizzo di una pagina dell'elenco con il filtro scelto (il filtro di partenza, "open", non si scrive). */
function listHref(locale: Locale, filter: StaffFilter, page = 1): string {
  const q = new URLSearchParams();
  if (filter !== "open") q.set("filter", filter);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `${staffInboxPath(locale)}${s ? `?${s}` : ""}`;
}

export default async function StaffInboxPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await resolveLocale(params);
  const sp = await searchParams;
  const L = inboxLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account/staff/messages"))}`);
  const staff = await viewerIsStaff(supabase);
  // senza la migrazione o con il database giù non si sa chi è dello staff: avviso invece di un 404 (anche allo staff)
  if (!staff.ok) return <InboxUnavailable text={L.section.unavailable} />;
  if (!staff.data) notFound();

  const filter = staffFilter(sp.filter);
  const page = pageNumber(sp.page);
  const to = cleanUsername(Array.isArray(sp.to) ? sp.to[0] : sp.to) ?? "";
  const list = await listStaffConversations(supabase, user.id, filter, page);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={`${href(locale, "/account")}#messages`} prefetch={false} className="link-mint font-bold">
          ← {L.thread.back}
        </Link>
      </p>
      <p className="kicker mt-6 text-mint">{L.staff.kicker}</p>
      <h1 className="t-page mt-2">{L.staff.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{L.staff.intro}</p>

      <nav className="mt-8 flex flex-wrap items-center gap-2" aria-label={L.staff.filtersLabel}>
        <span className="text-sm text-pale-muted">{L.staff.filtersLabel}:</span>
        {STAFF_FILTERS.map((f) => (
          <Link
            key={f}
            href={listHref(locale, f)}
            prefetch={false}
            aria-current={f === filter ? "page" : undefined}
            className={`btn text-xs ${f === filter ? "btn-primary" : "btn-ink"}`}
          >
            {L.staff.filters[f]}
          </Link>
        ))}
      </nav>

      {!list.ok ? (
        <div className="card-night mt-6 p-6">
          <p className="text-pale-muted">{L.section.unavailable}</p>
        </div>
      ) : list.data.rows.length === 0 ? (
        <div className="card-night mt-6 p-6">
          <p className="text-pale-muted">{L.staff.empty}</p>
        </div>
      ) : (
        <StaffConversationList locale={locale} rows={list.data.rows} />
      )}

      {list.ok && (page > 1 || list.data.more) ? (
        <nav className="mt-6 flex flex-wrap items-center gap-3 text-sm" aria-label={L.staff.title}>
          {page > 1 ? (
            <Link href={listHref(locale, filter, page - 1)} prefetch={false} className="btn btn-ink text-xs">
              ← {L.staff.newer}
            </Link>
          ) : null}
          <span className="font-mono text-xs text-pale-muted">{L.staff.page.replace("{n}", String(page))}</span>
          {list.data.more ? (
            <Link href={listHref(locale, filter, page + 1)} prefetch={false} className="btn btn-ink text-xs">
              {L.staff.older} →
            </Link>
          ) : null}
        </nav>
      ) : null}

      {/* Nuovo messaggio a un utente: aperto quando arriva dal link "Scrivi a questo utente" di /u/<nome> */}
      <section id="new" className="mt-12 scroll-mt-24">
        <details className="card-night p-5" open={Boolean(to)}>
          <summary className="cursor-pointer font-display font-bold text-mint">{L.form.newToUser}</summary>
          <NewConversationForm mode="staff" locale={locale} defaultTo={to} labels={L.form} sending={L.thread.sending} errors={L.errors} />
        </details>
      </section>
    </div>
  );
}
