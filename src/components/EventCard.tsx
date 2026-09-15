import { formatDateShort, formatDate, type Dictionary, type Locale } from "@/lib/i18n";
import type { Event } from "@/lib/data/events";

export function EventCard({ event, locale, dict, compact = false }: { event: Event; locale: Locale; dict: Dictionary; compact?: boolean }) {
  const range = event.end
    ? `${formatDateShort(locale, event.start)} – ${formatDateShort(locale, event.end)} ${event.end.slice(0, 4)}`
    : formatDate(locale, event.start);
  return (
    <article className="card-ivory flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-sm tabular text-crimson-deep">{range}</p>
        <span className={`stat-pill text-[11px] font-semibold uppercase ${event.official ? "bg-ink text-ivory" : "bg-ivory-3 text-ink"}`}>
          {event.official ? dict.events.officialBadge : dict.events.communityBadge}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-extrabold leading-tight text-ink">{event.title[locale]}</h3>
      <p className="mt-1 text-sm text-ink-muted">{event.where[locale]}</p>
      <p className="mt-3 text-sm text-ink">{event.text[locale]}</p>
      {!compact && event.format ? (
        <p className="mt-3 text-sm">
          <span className="kicker text-ink-muted">{dict.common.format}</span>
          <br />
          {event.format[locale]}
        </p>
      ) : null}
      {!compact && event.prizes ? (
        <p className="mt-3 text-sm">
          <span className="kicker text-ink-muted">{dict.common.prize}</span>
          <br />
          {event.prizes[locale]}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {event.signup ? (
          <a className="btn btn-ink text-xs" href={event.signup.url} rel="noopener">
            {event.signup.label[locale]}
          </a>
        ) : null}
        {event.source ? (
          <a className="btn border border-ink/30 text-ink text-xs hover:text-crimson-deep" href={event.source} rel="noopener">
            {dict.common.source}
          </a>
        ) : null}
      </div>
    </article>
  );
}
