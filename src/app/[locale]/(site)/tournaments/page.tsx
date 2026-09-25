import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { pastEvents, upcomingEvents } from "@/lib/data/events";
import { dayNumber, monthShort } from "@/lib/i18n";
import { EventCard } from "@/components/EventCard";
import { DiscordButton } from "@/components/DiscordButton";
import { contactEmail } from "@/components/Footer";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { siteUrl, href } from "@/lib/i18n";
import { listListedTournaments } from "@/lib/tournament/queries";
import { TournamentCard } from "@/components/TournamentCard";
import { TagSearch } from "@/components/TagSearch";

/** Gli eventi ufficiali sono statici; i tornei della community arrivano da Supabase: la pagina si rigenera al massimo ogni 5 minuti e dopo ogni Server Action. */
export const revalidate = 300;

/**
 * La Crimson Cup in events.ts. Finché è in calendario, description e prima riga della pagina la nominano (piano SEO
 * del 25/09/2026, "origins tcg tournament" porta qui); finito l'evento tornano quelle generiche da sole, alla prima
 * rigenerazione. Il titolo in SERP resta generico: per regole, posti e premi la pagina primaria è la news delle regole,
 * il cui slug sta nell'evento (`rules.news`), una fonte sola per il link in testa e per quello della scheda evento.
 */
const CRIMSON_CUP = "next-fest-tournament";
const cupAhead = () => upcomingEvents().some((e) => e.slug === CRIMSON_CUP);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tournaments", dict.events.metaTitle, cupAhead() ? dict.events.descriptionCup : dict.events.description);
}

export default async function EventsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const up = upcomingEvents();
  const past = pastEvents();
  // la Crimson Cup finché è in calendario: prima riga della pagina e description dei dati strutturati, come nei metadati
  const cup = up.find((e) => e.slug === CRIMSON_CUP);
  const community = await listListedTournaments();
  const groups = (["open", "running", "finished"] as const).map((s) => ({ status: s, list: community.filter((t) => t.status === s) })).filter((g) => g.list.length);
  const newHref = href(locale, "/tournaments/new");
  const steps = [x.howTo.step1, x.howTo.step2, x.howTo.step3, x.howTo.step4];
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

  // Lista per i dati strutturati: gli eventi statici del calendario (futuri e passati), ognuno con la sua
  // ancora sulla pagina. I tornei della community non ci vanno: arrivano da Supabase e cambiano da soli.
  const listed = [...up, ...past].map((e) => ({ name: e.title[locale], path: `${href(locale, "/tournaments")}#${e.slug}` }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.events.title, path: href(locale, "/tournaments") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/tournaments"),
            name: d.events.title,
            description: cup ? d.events.descriptionCup : d.events.description,
            items: listed,
            about: videoGameId,
          }),
        ]}
      />
      <JsonLd data={events} />
      {/* Gerarchia (UX-13, 21/09/2026): il primario in testa è "Organizza un torneo"; la segnalazione via email
          allo staff, che prima gli rubava il posto, è un link testuale in fondo agli eventi ufficiali. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
          <p className="kicker text-mint">{d.nav.events}</p>
          <h1 className="t-page mt-2">{d.events.title}</h1>
          {/* Risposta diretta finché la Crimson Cup è in calendario, con il link fisso alla news delle regole e il tasto
              per iscriversi sul Discord ufficiale (slug delle regole e indirizzo sono quelli dell'evento in events.ts).
              La scheda dell'evento più in basso linka lo stesso articolo con il testo breve ("Crimson Cup rules"):
              due ancore diverse verso la stessa pagina, tenute apposta (in testa la risposta, sotto la scheda). */}
          {cup ? (
            <>
              <p className="mt-4 max-w-2xl text-pale">{d.events.cupLead}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {cup.rules ? (
                  <Link href={href(locale, `/news/${cup.rules.news}`)} className="link-mint font-bold">
                    {d.events.cupRules} →
                  </Link>
                ) : null}
                {cup.signup ? (
                  <DiscordButton href={cup.signup.url} size="sm">
                    {d.events.cupSignup}
                  </DiscordButton>
                ) : null}
              </p>
            </>
          ) : null}
          <p className="mt-4 max-w-2xl text-chalk-muted">{d.events.lead}</p>
        </div>
        <Link href={newHref} className="btn btn-primary">
          {x.organizeCta}
        </Link>
      </div>

      {/* Calendario compatto: cubetti-data di tutti gli eventi futuri */}
      <section className="felt-panel mt-10 p-5">
        <h2 className="t-section">{d.events.calendarTitle}</h2>
        <ol className="mt-4 flex flex-wrap gap-4">
          {up.map((e, i) => (
            <li key={e.slug} className="flex items-center gap-3">
              <span className={`date-cube ${i === 0 ? "is-next" : ""}`}>
                <span className="text-lg">{dayNumber(e.start)}</span>
                <small>{monthShort(locale, e.start)}</small>
              </span>
              <span className="max-w-[220px]">
                <span className="t-item block text-sm">{e.title[locale]}</span>
                <span className="block text-xs text-chalk-muted">{e.where[locale]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Tournament Organizer: tornei creati dagli utenti e pubblicati sul calendario (solo Influencer/Pro/Staff) */}
      <section className="mt-12" id="community">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker text-mint">{x.kicker}</p>
            <h2 className="t-section mt-1">{x.sectionTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{x.sectionIntro}</p>
          </div>
          {groups.length ? (
            <Link href={newHref} className="btn btn-ink">
              {x.organizeCta}
            </Link>
          ) : null}
        </div>
        <div className="felt-panel mt-5 p-4">
          <TagSearch labels={{ title: x.findTitle, placeholder: x.tagPlaceholder, button: x.find, notFound: x.tagNotFound, inviteInvalid: x.inviteInvalid }} />
        </div>
        {groups.length ? (
          groups.map((g) => (
            <div key={g.status} className="mt-6">
              <h3 className="kicker text-pale-muted">{x.groups[g.status]}</h3>
              <ul className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {g.list.map((t) => (
                  <li key={t.id}>
                    <TournamentCard t={t} locale={locale} dict={d} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          /* Stato vuoto (UX-13): non più una riga grigia ma i quattro passi del torneo, che sono una sequenza vera */
          <div className="card-night mt-6 p-6 sm:p-8">
            <h3 className="font-display text-xl font-extrabold text-chalk">{x.howTo.title}</h3>
            <p className="mt-1 text-sm text-pale-muted">{x.none}</p>
            <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-lg border-2 border-sky bg-night-2/70 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint font-mono text-sm font-bold text-ink" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="text-sm text-pale">{s}</span>
                </li>
              ))}
            </ol>
            <Link href={newHref} className="btn btn-primary mt-6">
              {x.organizeCta}
            </Link>
          </div>
        )}
      </section>

      <h2 className="t-section mt-12">{d.common.upcoming}</h2>
      <ul className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {up.map((e) => (
          <li key={e.slug} id={e.slug}>
            <EventCard event={e} locale={locale} dict={d} />
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-chalk-muted">
        {d.events.submitLead}{" "}
        <a className="link-mint font-semibold" href={`mailto:${contactEmail}?subject=Evento%20Origins%20TCG`}>
          {d.events.submitCta} →
        </a>
      </p>

      <h2 className="t-section mt-14">{d.common.past}</h2>
      <ul className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* anche gli eventi passati hanno la loro ancora: l'ItemList dei dati strutturati la usa */}
        {past.map((e) => (
          <li key={e.slug} id={e.slug}>
            <EventCard event={e} locale={locale} dict={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}
