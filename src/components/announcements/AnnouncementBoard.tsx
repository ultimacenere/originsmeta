import Link from "@/components/IntentLink";
import type { Locale } from "@/lib/i18n";
import { UserMarkdown } from "@/components/UserMarkdown";
import { Avatar } from "@/components/AccountMenu";
import { InboxTime } from "@/components/inbox/InboxTime";
import { authorName } from "@/lib/community/util";
import { ANNOUNCEMENTS_ANCHOR } from "@/lib/tournament/announcements";
import type { AnnouncementsResult } from "@/lib/tournament/announcementQueries";
import { announcementLabels, fillAnnouncement } from "@/lib/tournament/announcementLabels";
import { AnnouncementComposer, AnnouncementItemControls, type AnnouncementTarget } from "./AnnouncementControls";

/**
 * La bacheca degli annunci (19/11/2026): sulla scheda di un torneo (sessione di chi guarda, dinamica), sulla pagina
 * dell'evento (anonima, ISR) e sulla pagina della bacheca per lo staff. Gli annunci in evidenza prima, poi dal più recente;
 * il testo con il Markdown ridotto del sito (niente link nel testo: il link, https, ha il suo tasto).
 *
 * `staff`: i tornei di cui chi guarda è staff (organizzatore, arbitro, admin): il modulo per pubblicare e, sugli annunci
 * rivolti solo a quei tornei, modifica ed eliminazione. Prima della migrazione la bacheca non compare per chi gioca e lo
 * staff legge che non è ancora attiva.
 */
export function AnnouncementBoard({
  locale,
  result,
  tournaments,
  staff,
  showFor = false,
  manageHref,
  composerOpen = false,
  hideWhenEmpty = false,
  headingLevel = 2,
}: {
  locale: Locale;
  result: AnnouncementsResult;
  /** i tornei che possono comparire negli annunci (per i nomi in "Per") */
  tournaments: { id: string; slug: string; name: string }[];
  staff: AnnouncementTarget[] | null;
  showFor?: boolean;
  manageHref?: string;
  composerOpen?: boolean;
  hideWhenEmpty?: boolean;
  headingLevel?: 2 | 3;
}) {
  const L = announcementLabels[locale];
  const isStaff = Boolean(staff && staff.length);
  if (!result.ok && !isStaff) return null;
  const items = result.ok ? result.items : [];
  if (hideWhenEmpty && items.length === 0 && !isStaff) return null;
  const staffIds = new Set((staff ?? []).map((t) => t.id));
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={ANNOUNCEMENTS_ANCHOR} className="felt-panel scroll-mt-24 p-5" aria-labelledby={`${ANNOUNCEMENTS_ANCHOR}-title`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <H id={`${ANNOUNCEMENTS_ANCHOR}-title`} className="t-section">
          {L.title}
        </H>
        {manageHref && !isStaff ? (
          <Link href={manageHref} prefetch={false} className="text-xs text-pale-muted underline decoration-dotted underline-offset-4 hover:text-mint">
            {L.manage}
          </Link>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>
      {/* sulla pagina della bacheca il modulo sta in cima, aperto */}
      {isStaff && staff && composerOpen ? <AnnouncementComposer locale={locale} L={L.compose} errors={L.errors} targets={staff} open /> : null}
      {!result.ok ? (
        <p className="mt-4 text-sm text-pale-muted" role="status">
          {result.error === "unavailable" ? L.unavailable : L.loadError}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-pale-muted">{L.empty}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((a) => {
            const name = a.authorProfile ? authorName(a.authorProfile) : L.someone;
            // nell'ordine dei tornei passati (quello del calendario), non in quello dell'array nel database
            const targets = tournaments.filter((t) => a.tournament_ids.includes(t.id));
            const canEdit = isStaff && a.tournament_ids.length > 0 && a.tournament_ids.every((id) => staffIds.has(id));
            return (
              <li key={a.id} id={`announcement-${a.id}`} className={`card-night p-4 ${a.pinned ? "border-gold" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned ? <span className="stat-pill bg-gold text-[11px] font-semibold uppercase text-ink">{L.pinned}</span> : null}
                  <h3 className="min-w-0 break-words font-display text-lg font-bold leading-snug text-pale">{a.title}</h3>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-pale-muted">
                  <Avatar profile={a.authorProfile} name={name} size={20} />
                  <span>{fillAnnouncement(L.by, { name })}</span>
                  <span aria-hidden="true">·</span>
                  <InboxTime iso={a.created_at} locale={locale} utcLabel={L.utcLabel} className="font-mono" />
                  {a.edited_at ? <span>({L.edited})</span> : null}
                </p>
                {a.body ? <UserMarkdown text={a.body} locale={locale} headings={false} className="mt-3 text-sm leading-relaxed text-pale" /> : null}
                {a.link_url ? (
                  <p className="mt-3">
                    <a href={a.link_url} target="_blank" rel="noopener noreferrer nofollow ugc" className="link-mint break-all text-sm font-bold">
                      {L.openLink} ↗
                    </a>
                  </p>
                ) : null}
                {showFor && targets.length ? (
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-pale-muted">
                    <span>{L.forLabel}</span>
                    {targets.map((t) => (
                      <span key={t.id} className="stat-pill bg-night-2 text-[11px] text-pale">
                        {t.name}
                      </span>
                    ))}
                  </p>
                ) : null}
                {canEdit ? (
                  <AnnouncementItemControls
                    locale={locale}
                    L={L.compose}
                    errors={L.errors}
                    item={{ id: a.id, title: a.title, body: a.body, link_url: a.link_url, pinned: a.pinned }}
                    slugs={targets.map((t) => t.slug)}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {isStaff && staff && !composerOpen ? <AnnouncementComposer locale={locale} L={L.compose} errors={L.errors} targets={staff} /> : null}
    </section>
  );
}

export { fillAnnouncement };
