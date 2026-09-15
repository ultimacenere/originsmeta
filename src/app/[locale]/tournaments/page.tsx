import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { pastEvents, upcomingEvents } from "@/lib/data/events";
import { dayNumber, monthShort } from "@/lib/i18n";
import { EventCard } from "@/components/EventCard";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tournaments", dict.events.title, dict.events.intro);
}

export default async function EventsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const up = upcomingEvents();
  const past = pastEvents();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-mint">{d.nav.events}</p>
          <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.events.title}</h1>
          <p className="mt-4 max-w-2xl text-chalk-muted">{d.events.intro}</p>
        </div>
        <a className="btn btn-mint" href={`mailto:${contactEmail}?subject=Evento%20Origins%20TCG`}>
          {d.events.submitCta}
        </a>
      </div>

      {/* Calendario compatto: cubetti-data di tutti gli eventi futuri */}
      <section className="felt-panel mt-10 p-5">
        <h2 className="kicker text-chalk-muted">{d.events.calendarTitle}</h2>
        <ol className="mt-3 flex flex-wrap gap-4">
          {up.map((e, i) => (
            <li key={e.slug} className="flex items-center gap-3">
              <span className={`date-cube ${i === 0 ? "is-next" : ""}`}>
                <span className="text-lg">{dayNumber(e.start)}</span>
                <small>{monthShort(locale, e.start)}</small>
              </span>
              <span className="max-w-[220px]">
                <span className="block font-display text-sm font-bold text-chalk">{e.title[locale]}</span>
                <span className="block text-xs text-chalk-muted">{e.where[locale]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <h2 className="mt-12 text-2xl font-extrabold text-chalk">{d.common.upcoming}</h2>
      <ul className="mt-5 grid gap-5 md:grid-cols-2">
        {up.map((e) => (
          <li key={e.slug}>
            <EventCard event={e} locale={locale} dict={d} />
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-extrabold text-chalk">{d.common.past}</h2>
      <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {past.map((e) => (
          <li key={e.slug}>
            <EventCard event={e} locale={locale} dict={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}
