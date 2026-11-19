import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { JsonLd, breadcrumbs, FREE_OFFER_CURRENCY, videoGameId } from "@/components/JsonLd";
import { koinGamesRef } from "@/lib/jsonld/entities";
import { DiscordButton } from "@/components/DiscordButton";
import { Avatar } from "@/components/AccountMenu";
import { ZonedTime } from "@/components/ZonedTime";
import { AnnouncementBoard } from "@/components/announcements/AnnouncementBoard";
import { authorHandle, authorName } from "@/lib/community/util";
import { HARVEST_BOWL, fixedTimes, type HarvestStageKey } from "@/lib/harvestBowl";
import { harvestPageData, type HarvestTournament } from "@/lib/harvestBowlData";
import { fillHarvest, harvestBowlLabels, type HarvestBowlLabels } from "@/lib/harvestBowlLabels";

/*
  Pagina dell'Harvest Bowl (19/11/2026, Pierluigi: "fai una pagina evento per il torneo come suggeriva il piano e mettiamoci
  una lavagna annunci per apix"; piano dell'analisi profonda del 19/11, cantiere B1 di sito.md e cantiere E). Spiega in una
  pagina sola le due qualificazioni e la giornata finale, con le ore fisse UTC/ET/CET e quella di chi guarda, formato,
  regole dei mazzi, premi, iscrizione, organizzatori e la bacheca degli annunci in evidenza, in 8 lingue.

  Regge il traffico del torneo: ISR ogni 120 secondi, letture anonime in una voce di `unstable_cache` per tutte le lingue
  (harvestBowlData.ts), rigenerata subito dopo ogni annuncio. Niente sessione: chi gioca apre la scheda del suo torneo dal
  tasto. La pubblicazione degli annunci per lo staff sta in /events/harvest-bowl/board (dinamica, noindex) e sulle schede.
  Questa cartella statica vince sulla rotta /events/[slug] degli eventi della community.
*/

export const revalidate = 120;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = harvestBowlLabels[locale];
  const data = await harvestPageData();
  const cover = data.tournaments.find((t) => t.coverUrl)?.coverUrl ?? undefined;
  return pageMeta(locale, HARVEST_BOWL.path, L.metaTitle, L.metaDescription, cover, {
    noindex: !HARVEST_BOWL.indexable,
    ...(cover ? { imageSize: { width: 1600, height: 900 }, imageAlt: L.title } : {}),
  });
}

function statusLabel(t: HarvestTournament, L: HarvestBowlLabels): string {
  if (t.status === "open") return t.registered >= t.size ? L.schedule.status.full : L.schedule.status.open;
  return L.schedule.status[t.status];
}

function StageCard({ stage, t, locale, L }: { stage: HarvestStageKey; t: HarvestTournament | undefined; locale: Parameters<typeof href>[0]; L: HarvestBowlLabels }) {
  const s = L.schedule.stages[stage];
  const iso = t?.startsAt ?? HARVEST_BOWL.stages.find((x) => x.key === stage)!.startsAt;
  const f = fixedTimes(iso);
  const n = (v: number) => v.toLocaleString(locale);
  return (
    <li className="card-night flex flex-col p-4">
      <p className="kicker text-mint">{s.day}</p>
      <h3 className="mt-1 font-display text-xl font-bold text-pale">{s.name}</h3>
      <p className="mt-2 font-mono text-sm text-gold">{fillHarvest(L.schedule.fixed, f)}</p>
      <p className="mt-1 min-h-[1.25rem] text-sm text-pale-muted">
        <span className="sr-only">{L.schedule.yourTime} </span>
        <ZonedTime iso={iso} locale={locale} />
      </p>
      <p className="mt-3 text-sm leading-relaxed text-chalk-muted">{s.text}</p>
      <div className="mt-auto pt-4">
        {t ? (
          <>
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`stat-pill text-[11px] font-semibold uppercase ${t.status === "open" && t.registered < t.size ? "bg-mint text-ink" : t.status === "open" || t.status === "running" ? "bg-gold text-ink" : "bg-night-2 text-pale"}`}>{statusLabel(t, L)}</span>
              {stage !== "final" || t.registered ? <span className="font-mono text-pale">{fillHarvest(L.schedule.seats, { n: n(t.registered), size: n(t.size) })}</span> : null}
              {t.waitlist ? <span className="font-mono text-pale-muted">{fillHarvest(L.schedule.waitlist, { n: n(t.waitlist) })}</span> : null}
            </p>
            <Link href={href(locale, `/tournaments/${t.slug}`)} prefetch={false} className={`btn ${t.status === "open" ? "btn-primary" : "btn-ghost"} mt-3 w-full justify-center text-sm`}>
              {t.status === "open" ? fillHarvest(t.registered >= t.size ? L.cta.waitlist : L.cta.signup, { name: s.name }) : L.schedule.open}
            </Link>
          </>
        ) : (
          <p className="stat-pill bg-night-2 text-[11px] font-semibold uppercase text-pale-muted">{L.schedule.notCreated}</p>
        )}
      </div>
    </li>
  );
}

export default async function HarvestBowlPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = harvestBowlLabels[locale];
  const data = await harvestPageData();
  const path = href(locale, HARVEST_BOWL.path);
  const pageUrl = `${siteUrl}${path}`;
  const byStage = (k: HarvestStageKey) => data.tournaments.find((t) => t.stage === k);
  const cover = data.tournaments.find((t) => t.coverUrl)?.coverUrl ?? null;
  const qualifiers = (["q1", "q2"] as const).map((k) => ({ k, t: byStage(k) }));
  const organizer = data.tournaments.find((t) => t.organizer)?.organizer ?? null;
  const judges = [...new Map(data.tournaments.flatMap((t) => t.judges).map((p) => [p.username ?? authorName(p), p])).values()];
  const eventTournaments = data.tournaments.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));

  // Event con le tre tappe come subEvent (nome, inizio, pagina del torneo quando c'è): GEO e risultati arricchiti
  const sub = HARVEST_BOWL.stages.map((s) => {
    const t = byStage(s.key);
    return {
      "@type": "Event",
      name: `Harvest Bowl · ${L.schedule.stages[s.key].name}`,
      startDate: t?.startsAt ?? s.startsAt,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url: t ? `${siteUrl}${href(locale, `/tournaments/${t.slug}`)}` : pageUrl },
      ...(t ? { url: `${siteUrl}${href(locale, `/tournaments/${t.slug}`)}` } : {}),
    };
  });
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    name: "Harvest Bowl 2026",
    alternateName: "Origins TCG Harvest Bowl",
    description: L.lead,
    startDate: HARVEST_BOWL.stages[0].startsAt,
    endDate: HARVEST_BOWL.endsAt,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: pageUrl },
    url: pageUrl,
    image: cover ?? `${siteUrl}${HARVEST_BOWL.image}`,
    organizer: koinGamesRef,
    about: { "@id": videoGameId },
    isAccessibleForFree: true,
    inLanguage: locale,
    ...(qualifiers[0].t ? { offers: { "@type": "Offer", price: "0", priceCurrency: FREE_OFFER_CURRENCY, url: `${siteUrl}${href(locale, `/tournaments/${qualifiers[0].t.slug}`)}`, availability: "https://schema.org/InStock" } } : {}),
    subEvent: sub,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.events.title, path: href(locale, "/tournaments") },
            { name: L.title, path },
          ]),
          ld,
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-pale-muted">
        <Link href={href(locale, "/tournaments")} className="hover:text-mint">
          {d.events.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{L.title}</span>
      </nav>

      {/* In testa: la risposta (che cos'è, quando, dove), i fatti in pillole, i tasti per iscriversi e le regole ufficiali */}
      <header className="mt-4 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="kicker text-mint">{L.kicker}</p>
          <h1 className="t-page mt-2">{L.title}</h1>
          <p className="mt-4 max-w-2xl text-pale">{L.lead}</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {[L.facts.dates, L.facts.where, L.facts.seats, L.facts.entry].map((f) => (
              <li key={f} className="stat-pill bg-night-2 text-pale">
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {qualifiers.map(({ k, t }) =>
              t && t.status !== "finished" ? (
                <Link key={k} href={href(locale, `/tournaments/${t.slug}`)} prefetch={false} className={`btn ${t.status === "open" ? "btn-primary" : "btn-ghost"} text-sm`}>
                  {t.status === "open" ? fillHarvest(t.registered >= t.size ? L.cta.waitlist : L.cta.signup, { name: L.schedule.stages[k].name }) : `${L.schedule.stages[k].name} · ${L.schedule.open}`}
                </Link>
              ) : null,
            )}
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a href={HARVEST_BOWL.rulebook} target="_blank" rel="noopener noreferrer" className="link-mint font-bold">
              {L.cta.rulebook} ↗
            </a>
            <a href={HARVEST_BOWL.faq} target="_blank" rel="noopener noreferrer" className="link-mint font-bold">
              {L.cta.faq} ↗
            </a>
            <DiscordButton href={HARVEST_BOWL.discord} size="sm">
              {L.cta.discord}
            </DiscordButton>
          </p>
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={L.title} width={1600} height={900} fetchPriority="high" decoding="async" className="aspect-video w-full rounded-xl border border-sky object-cover" />
        ) : null}
      </header>

      {/* La bacheca subito dopo la testa: è quello che i giocatori vengono a leggere nei giorni del torneo */}
      <div className="mt-8">
        <AnnouncementBoard
          locale={locale}
          result={data.announcements}
          tournaments={eventTournaments}
          staff={null}
          showFor={eventTournaments.length > 1}
          manageHref={href(locale, `${HARVEST_BOWL.path}/board`)}
        />
      </div>

      <section className="mt-8" aria-labelledby="schedule">
        <h2 id="schedule" className="t-section">
          {L.schedule.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.schedule.intro}</p>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {HARVEST_BOWL.stages.map((s) => (
            <StageCard key={s.key} stage={s.key} t={byStage(s.key)} locale={locale} L={L} />
          ))}
        </ol>
        {data.ok && data.tournaments.length ? <p className="mt-2 text-xs text-pale-muted">{L.schedule.live}</p> : null}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="felt-panel p-5" aria-labelledby="format">
          <h2 id="format" className="t-section">
            {L.format.title}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-pale">
            {L.format.items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-pale-muted">{L.format.note}</p>
        </section>

        <section className="felt-panel p-5" aria-labelledby="decks">
          <h2 id="decks" className="t-section">
            {L.decks.title}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-pale">
            {L.decks.items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-chalk-muted">{L.decks.patch}</p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href={href(locale, "/news/balance-patch-1117-sherwood-forest")} className="link-mint font-bold">
              {L.decks.patchLink} →
            </Link>
            <Link href={href(locale, "/deck-builder")} className="link-mint font-bold">
              {L.decks.builder} →
            </Link>
          </p>
        </section>

        <section className="felt-panel p-5" aria-labelledby="prizes">
          <h2 id="prizes" className="t-section">
            {L.prizes.title}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-pale">
            {L.prizes.items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-pale-muted">{L.prizes.note}</p>
        </section>

        <section className="felt-panel p-5" aria-labelledby="signup">
          <h2 id="signup" className="t-section">
            {L.signup.title}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-pale">
            {L.signup.steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-pale-muted">{L.signup.note}</p>
        </section>
      </div>

      <section className="felt-panel mt-6 p-5" aria-labelledby="organizers">
        <h2 id="organizers" className="t-section">
          {L.organizers.title}
        </h2>
        <p className="mt-3 text-sm text-pale">{L.organizers.koin}</p>
        {organizer || judges.length ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {organizer ? (
              <div>
                <dt className="kicker text-pale-muted">{L.organizers.organizer}</dt>
                <dd className="mt-2">
                  <PersonLink p={organizer} locale={locale} />
                </dd>
              </div>
            ) : null}
            {judges.length ? (
              <div>
                <dt className="kicker text-pale-muted">{L.organizers.judges}</dt>
                <dd className="mt-2 flex flex-wrap gap-3">
                  {judges.map((p) => (
                    <PersonLink key={p.username ?? authorName(p)} p={p} locale={locale} />
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <p className="mt-4 text-xs text-pale-muted">{L.organizers.platform}</p>
      </section>

      <section className="mt-6" aria-labelledby="questions">
        <h2 id="questions" className="t-section">
          {L.faq.title}
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {L.faq.items.map((x) => (
            <div key={x.q} className="card-night p-4">
              <h3 className="font-display text-base font-bold text-pale">{x.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-chalk-muted">{x.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-pale-muted">
        {L.source}{" "}
        <a href={HARVEST_BOWL.steamPost} target="_blank" rel="noopener noreferrer" className="link-mint">
          {L.sourceLink} ↗
        </a>
      </p>
    </div>
  );
}

function PersonLink({ p, locale }: { p: { username: string | null; display_name: string | null; avatar_url: string | null; badge?: string | null }; locale: Parameters<typeof href>[0] }) {
  const name = authorName(p);
  const handle = authorHandle(p);
  const body = (
    <>
      <Avatar profile={p} name={name} size={28} />
      <span className="text-sm font-bold text-pale">{name}</span>
    </>
  );
  return handle ? (
    <Link href={href(locale, `/u/${handle}`)} prefetch={false} className="inline-flex items-center gap-2 hover:text-mint">
      {body}
    </Link>
  ) : (
    <span className="inline-flex items-center gap-2">{body}</span>
  );
}
