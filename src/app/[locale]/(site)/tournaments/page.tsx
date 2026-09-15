import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { pastEvents, upcomingEvents } from "@/lib/data/events";
import { dayNumber, monthShort } from "@/lib/i18n";
import { EventCard } from "@/components/EventCard";
import { contactEmail } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl, href } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tournaments", dict.events.title, dict.events.intro);
}

export default async function EventsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const up = upcomingEvents();
  const past = pastEvents();
  const events = up.map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title[locale],
    description: e.text[locale],
    startDate: e.start,
    endDate: e.end ?? e.start,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: e.signup?.url ?? e.source ?? `${siteUrl}${href(locale, "/tournaments")}` },
    organizer: { "@type": "Organization", name: e.official ? "Koin Games" : "Community", url: e.official ? "https://origins-tcg.com/" : `${siteUrl}${href(locale, "/tournaments")}` },
    url: `${siteUrl}${href(locale, "/tournaments")}#${e.slug}`,
    image: `${siteUrl}/media/og.jpg`,
    isAccessibleForFree: true,
  }));
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd data={events} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-mint">{d.nav.events}</p>
          <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.events.title}</h1>
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
                <span className="block font-display text-sm font-bold text-sky">{e.title[locale]}</span>
                <span className="block text-xs text-chalk-muted">{e.where[locale]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <h2 className="mt-12 text-2xl font-extrabold text-sky">{d.common.upcoming}</h2>
      <ul className="mt-5 grid gap-5 md:grid-cols-2">
        {up.map((e) => (
          <li key={e.slug} id={e.slug}>
            <EventCard event={e} locale={locale} dict={d} />
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-extrabold text-sky">{d.common.past}</h2>
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
