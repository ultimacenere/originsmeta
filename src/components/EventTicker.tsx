import Link from "next/link";
import { dayNumber, href, monthShort, type Dictionary, type Locale } from "@/lib/i18n";
import { upcomingEvents } from "@/lib/data/events";

/** Striscia scorrevole con i prossimi eventi: cubetto-data + nome; il prossimo evento è evidenziato in giallo. */
export function EventTicker({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const events = upcomingEvents();
  if (events.length === 0) return null;
  const items = events.map((e, i) => ({ e, isNext: i === 0 }));
  // duplicato per lo scorrimento continuo
  const loop = [...items, ...items];
  return (
    <div className="ticker" aria-label={dict.common.calendar}>
      <div className="ticker-track">
        {loop.map(({ e, isNext }, i) => (
          <Link
            key={`${e.slug}-${i}`}
            href={href(locale, "/tournaments")}
            aria-hidden={i >= items.length ? true : undefined}
            tabIndex={i >= items.length ? -1 : undefined}
            className="flex shrink-0 items-center gap-3 rounded-xl px-2 py-1 hover:bg-felt-soft"
          >
            <span className={`date-cube ${isNext ? "is-next" : ""}`}>
              <span className="text-lg">{dayNumber(e.start)}</span>
              <small>{monthShort(locale, e.start)}</small>
            </span>
            <span className="min-w-0">
              <span className={`block font-display text-sm font-bold ${isNext ? "text-gold" : "text-chalk"}`}>{e.title[locale]}</span>
              <span className="block font-mono text-[11px] uppercase tracking-wider text-chalk-muted">
                {isNext ? `${dict.common.next} · ` : ""}
                {e.where[locale]}
              </span>
            </span>
            <span className="ml-3 h-6 w-px bg-felt-line" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
