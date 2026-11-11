import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/page";
import { deckCards, readPublicEvent } from "@/lib/event/server";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { EVENT_LOCALE, eventPath } from "@/lib/event/links";
import { totalPacks } from "@/lib/event/config";
import { CopyButton } from "@/components/CopyButton";
import { EventLiveProvider } from "@/components/event/EventLive";
import { EventClockBanner } from "@/components/event/EventClock";
import { DeckFaces, PairingsList, StandingsTable, TalentSection } from "@/components/event/EventBoard";
import { EventRedeem } from "@/components/event/EventRedeem";

/*
  Pagina di un evento della community (10/11/2026): l'Attrix Showmatch dei creator italiani del 16/11/2026. Dalle note
  Granola "sito roadmap" del 10/11/2026: "Pagina unica (no click multipli), linkabile direttamente dal bot Twitch",
  talent con foto, bio e link (alcuni sfocati fino al reveal), mazzi con il codice da copiare e le facce dei giocatori
  assegnati, classifica svizzera, abbinamenti, countdown del giveaway e riscatto dei codici.
  Solo in italiano (l'evento è dei creator italiani): le altre lingue rimandano qui. ISR ogni 60 secondi (svelamento dei
  talent, mazzi); quello che cambia durante la diretta (orologio, ruota, risultati, dirette Twitch) il browser lo
  rilegge da /api/events/<slug> ogni 10 secondi. Link breve: originsmeta.com/showmatch (next.config.ts).
*/

export const revalidate = 60;
// generateStaticParams vuoto + dynamicParams (come le schede dei mazzi della community): senza, Next renderizzerebbe la
// pagina a ogni richiesta, e durante la diretta il pubblico la apre in tanti insieme. Le pagine nascono alla prima visita.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ locale: string; slug: string }>;

const startFmt = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale !== EVENT_LOCALE) return { robots: { index: false, follow: true } };
  const event = await readPublicEvent(slug, { twitch: false }).catch(() => null);
  if (!event) return { robots: { index: false, follow: true } };
  const packs = totalPacks(event.config.slots);
  const vars = { name: event.config.name, packs };
  return pageMeta(EVENT_LOCALE, `/events/${slug}`, fillEvent(L.meta.title, vars), fillEvent(packs ? L.meta.description : L.meta.descriptionNoPacks, vars), undefined, { languages: [EVENT_LOCALE] });
}

export default async function EventPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== EVENT_LOCALE) redirect(eventPath(slug));
  const event = await readPublicEvent(slug);
  if (!event) notFound();
  const { config } = event;
  const decks = await Promise.all(config.decks.map(async (d) => ({ deck: d, cards: await deckCards(d) })));
  const packs = totalPacks(config.slots);
  const start = config.startsAt ? Date.parse(config.startsAt) : NaN;
  const channelOf = (ch: string) => (ch ? ch : "canale da svelare");
  const nav = [
    { id: "giocatori", label: L.nav.talent },
    { id: "mazzi", label: L.nav.decks },
    { id: "classifica", label: L.nav.standings },
    { id: "abbinamenti", label: L.nav.pairings },
    { id: "giveaway", label: L.nav.giveaway },
    { id: "codice", label: L.nav.redeem },
  ];

  return (
    <EventLiveProvider slug={slug} initial={event}>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-12">
        <header className="space-y-4">
          <p className="kicker text-mint">{L.hero.kicker}</p>
          <h1 className="t-page text-sky">{config.name}</h1>
          {config.tagline ? <p className="max-w-3xl whitespace-pre-line text-lg text-pale">{config.tagline}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {packs ? <span className="stat-pill bg-gold font-bold text-ink">{fillEvent(L.hero.packs, { packs })}</span> : null}
            {!Number.isNaN(start) ? (
              <span className="stat-pill bg-night-3 text-pale">
                {L.hero.starts}: {startFmt.format(start)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#codice" className="btn btn-primary">
              {L.hero.redeemCta}
            </a>
            <a href="#giveaway" className="btn btn-ink">
              {L.hero.howCta}
            </a>
          </div>
        </header>

        <EventClockBanner />

        <nav aria-label={config.name} className="flex flex-wrap gap-2">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-full border-2 border-sky px-3 py-1 text-sm font-bold text-sky hover:bg-sky/10">
              {n.label}
            </a>
          ))}
        </nav>

        <section id="giocatori" className="scroll-mt-24" aria-labelledby="ev-talent">
          <h2 id="ev-talent" className="t-section text-sky">
            {L.talent.title}
          </h2>
          <div className="mt-4">
            <TalentSection />
          </div>
        </section>

        <section id="mazzi" className="scroll-mt-24" aria-labelledby="ev-decks">
          <h2 id="ev-decks" className="t-section text-sky">
            {L.decks.title}
          </h2>
          <p className="mt-2 text-pale">{L.decks.intro}</p>
          {decks.length ? (
            // strisce sottili, due per riga da 1024 px: nome, giocatori, "Copia codice" e "Lista" (deck builder in una nuova scheda)
            <ul className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
              {decks.map(({ deck, cards }) => (
                <li key={deck.id} className="flex min-w-0 items-center gap-3 rounded-xl border-2 border-sky bg-night px-3 py-2" title={deck.note}>
                  <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full border border-chalk/40" style={{ background: deck.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-extrabold text-sky">{deck.name}</span>
                    <DeckFaces deck={deck.id} />
                  </span>
                  <CopyButton
                    text={deck.code}
                    label={L.decks.copy}
                    copied={L.decks.copied}
                    ariaLabel={fillEvent(L.decks.copyAria, { deck: deck.name })}
                    className="btn btn-primary shrink-0 text-xs"
                    event={{ name: "game_code_copy", params: { placement: "event_page" } }}
                  />
                  {cards.om ? (
                    <a
                      href={`/it/deck-builder#${cards.om}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={fillEvent(L.decks.listAria, { deck: deck.name })}
                      className="btn btn-ink shrink-0 text-xs"
                      data-om-event="deck_open_builder"
                      data-om-placement="event_page"
                    >
                      {L.decks.list}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-pale">{L.decks.empty}</p>
          )}
        </section>

        <section id="classifica" className="scroll-mt-24" aria-labelledby="ev-standings">
          <h2 id="ev-standings" className="t-section text-sky">
            {L.standings.title}
          </h2>
          <p className="mt-2 text-sm text-pale-muted">{L.standings.intro}</p>
          <div className="mt-4">
            <StandingsTable />
          </div>
        </section>

        <section id="abbinamenti" className="scroll-mt-24" aria-labelledby="ev-pairings">
          <h2 id="ev-pairings" className="t-section text-sky">
            {L.pairings.title}
          </h2>
          <div className="mt-4">
            <PairingsList />
          </div>
        </section>

        <section id="giveaway" className="scroll-mt-24" aria-labelledby="ev-giveaway">
          <h2 id="ev-giveaway" className="t-section text-sky">
            {L.giveaway.title}
          </h2>
          <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-6 text-pale marker:font-bold marker:text-mint">
            {L.giveaway.steps.map((s) => (
              <li key={s}>{fillEvent(s, { keyword: config.keyword })}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-pale-muted">{L.giveaway.onePerPerson}</p>
          {config.slots.length ? (
            <div className="mt-5">
              <h3 className="t-item text-chalk">{L.giveaway.schedule}</h3>
              <p className="text-sm text-pale-muted">{fillEvent(L.giveaway.total, { packs, slots: config.slots.length })}</p>
              <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {config.slots.map((s, i) => (
                  <li key={i} className="rounded-lg border-2 border-night-3 bg-night/60 px-3 py-2 text-sm text-pale">
                    <span className="mr-2 font-mono text-pale-muted">{i + 1}.</span>
                    {fillEvent(L.giveaway.slot, { channel: channelOf(s.channel), packs: s.packs === 1 ? L.clock.packsOne : fillEvent(L.clock.packs, { n: s.packs }), minutes: s.minutes })}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>

        <EventRedeem slug={slug} />

        <p className="text-sm text-pale-muted">{L.footer}</p>
      </div>
    </EventLiveProvider>
  );
}
