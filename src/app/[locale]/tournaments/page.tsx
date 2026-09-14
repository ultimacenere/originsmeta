import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { pastEvents, upcomingEvents } from "@/lib/data/events";
import { EventCard } from "@/components/EventCard";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tournaments", dict.tournaments.title, dict.tournaments.intro);
}

export default async function TournamentsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const up = upcomingEvents();
  const past = pastEvents();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-mint">{d.nav.tournaments}</p>
          <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.tournaments.title}</h1>
          <p className="mt-4 max-w-2xl text-chalk-muted">{d.tournaments.intro}</p>
        </div>
        <a className="btn btn-gold" href={`mailto:${contactEmail}?subject=Evento%20Origins%20TCG`}>
          {d.tournaments.submitCta}
        </a>
      </div>

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
