import type { CSSProperties, ReactNode } from "react";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { totalPacks } from "@/lib/event/config";
import { startHasTime } from "@/lib/event/clock";
import { isHidden, type EventDeck } from "@/lib/event/types";
import type { DeckCards, PublicEventView } from "@/lib/event/server";
import { SECTION_KICKERS, inkOn, splitEventName, type EventSectionId } from "@/lib/event/looks";
import { getCard } from "@/lib/data/cards";
import { CopyButton } from "@/components/CopyButton";
import { EventLiveProvider } from "./EventLive";
import { EventClockBanner } from "./EventClock";
import { DeckFaces, DrawNote, HeroCast, PairingsList, StandingsTable, TalentSection } from "./EventBoard";
import { EventRedeem } from "./EventRedeem";
import "./event-show.css";
import "./event-look-a.css";

/*
  La pagina pubblica di un evento, con la grafica "Locandina": manifesto da serata di gala, titolo enorme col
  gradiente, bollo con la data, muro delle facce, due nastri che scorrono. Scelta da Pierluigi il 14/11/2026 fra tre
  prove dell'11/11 ("per la pagina pubblica importa la grafica locandina"). Struttura in event-show.css, pelle in
  event-look-a.css (classi ev-* sotto .ev--a, le stesse di regia e pannello del mod). Solo palette e font del sito,
  niente materiale Koin; le decorazioni sono nascoste ai lettori di schermo e con "riduci animazioni" tutto resta fermo.
*/

type DeckView = { deck: EventDeck; cards: DeckCards };

const TZ = "Europe/Rome";
const dayFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", timeZone: TZ });
const monthFmt = new Intl.DateTimeFormat("it-IT", { month: "short", timeZone: TZ });
const monthLongFmt = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

/** Icone nostre delle sezioni (tratto semplice, nessun materiale del gioco). */
const ICONS: Record<EventSectionId, ReactNode> = {
  giocatori: icon(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.2" cy="9" r="2.4" />
      <path d="M17 13.6c2.4.3 4 2 4 4.4" />
    </>,
  ),
  mazzi: icon(
    <>
      <rect x="4" y="6.5" width="9.5" height="13.5" rx="2" transform="rotate(-9 8.75 13.25)" />
      <rect x="10.5" y="4" width="9.5" height="13.5" rx="2" transform="rotate(9 15.25 10.75)" />
    </>,
  ),
  classifica: icon(
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5.2c0 2 1.2 3.4 3 3.6M16 6h2.8c0 2-1.2 3.4-3 3.6M12 13v4M8.5 20h7M10 17h4" />
    </>,
  ),
  abbinamenti: icon(<path d="M13.5 2.5 5 13h6l-1.5 8.5L18.5 11h-6l1-8.5z" />),
  giveaway: icon(
    <>
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M3 7h18v3H3zM12 7v13" />
      <path d="M12 7c-1.2-3.4-5.4-3.6-5.2-1 .1 1.2 2.2 1 5.2 1zM12 7c1.2-3.4 5.4-3.6 5.2-1-.1 1.2-2.2 1-5.2 1z" />
    </>,
  ),
  codice: icon(
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <path d="M14.5 6.5v1.6M14.5 11.2v1.6M14.5 15.9v1.6" />
    </>,
  ),
};

function Section({ id, labelId, n, title, intro, children }: { id: EventSectionId; labelId: string; n: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="ev-sec" aria-labelledby={labelId}>
      <div className="ev-head">
        <span className="ev-head-n" aria-hidden>
          {n}
        </span>
        <span className="ev-head-ic" aria-hidden>
          {ICONS[id]}
        </span>
        <div className="ev-head-t">
          <p className="ev-head-k">{SECTION_KICKERS[id]}</p>
          <h2 id={labelId} className="ev-h2">
            {title}
          </h2>
        </div>
      </div>
      {intro ? <p className="ev-intro">{intro}</p> : null}
      {children}
    </section>
  );
}

/** Due nastri che scorrono in fondo alla testata (decorazione: le stesse parole stanno già nella pagina). */
function Tape({ items, n }: { items: string[]; n: 1 | 2 }) {
  const run = Array.from({ length: 5 }, () => items).flat();
  return (
    <div className={`ev-tape ev-tape--${n}`} aria-hidden>
      <div className="ev-tape-run">
        {[0, 1].map((half) => (
          <span key={half} className="ev-tape-half">
            {run.map((t, i) => (
              <span key={i}>
                {t}
                <i>✦</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EventShow({ slug, event, decks }: { slug: string; event: PublicEventView; decks: DeckView[] }) {
  const { config } = event;
  const packs = totalPacks(config.slots);
  const [first, last] = splitEventName(config.name);
  const start = config.startsAt ? Date.parse(config.startsAt) : NaN;
  const date = Number.isNaN(start) ? null : { day: dayFmt.format(start), month: monthFmt.format(start).replace(".", ""), monthLong: monthLongFmt.format(start), time: startHasTime(config.startsAt) ? timeFmt.format(start) : null };
  const players = config.talent.filter((t) => t.role === "player").length;
  const stats: { n: number; label: string }[] = [];
  if (players) stats.push({ n: players, label: players === 1 ? L.hero.playersOne : L.hero.players });
  if (config.decks.length) stats.push({ n: config.decks.length, label: config.decks.length === 1 ? L.hero.decksOne : L.hero.decks });
  if (packs) stats.push({ n: packs, label: packs === 1 ? L.hero.packsStatOne : L.hero.packsStat });
  const tape = [config.name, date ? `${date.day} ${date.monthLong}` : null, L.hero.liveOn, ...stats.map((s) => `${s.n} ${s.label}`)].filter((t): t is string => Boolean(t));
  const channelName = (ch: string) => {
    if (!ch) return L.giveaway.channelSoon;
    const t = config.talent.find((x) => !isHidden(x) && x.twitch === ch);
    return t && !isHidden(t) ? t.name : ch;
  };
  const nav: { id: EventSectionId; label: string }[] = [
    { id: "giocatori", label: L.nav.talent },
    { id: "mazzi", label: L.nav.decks },
    { id: "classifica", label: L.nav.standings },
    { id: "abbinamenti", label: L.nav.pairings },
    { id: "giveaway", label: L.nav.giveaway },
    { id: "codice", label: L.nav.redeem },
  ];
  const k = SECTION_KICKERS;

  return (
    <EventLiveProvider slug={slug} initial={event}>
      <div className="ev ev--a">
        <div className="ev-wrap ev-top">
          <EventClockBanner slot="top" units />
        </div>
        <header className="ev-hero">
          <div className="ev-wrap ev-hero-in">
            <p className="ev-kicker">
              <i aria-hidden />
              <span>{L.hero.kicker}</span>
              <span className="ev-kicker-live">{L.hero.liveOn}</span>
            </p>
            <div className="ev-title-row">
              <h1 className="ev-title" style={{ "--ev-len": Math.max(first.length, Math.ceil(last.length * 0.45), 5), "--ev-len-flat": Math.max(first.length, last.length, 5) } as CSSProperties}>
                <span className="ev-title-1">{first}</span>
                {last ? (
                  <>
                    {" "}
                    <span className="ev-title-2">{last}</span>
                  </>
                ) : null}
              </h1>
              {date ? (
                <p className="ev-date">
                  <span className="ev-date-in">
                    <b>{date.day}</b> <span>{date.month}</span>
                    {date.time ? (
                      <>
                        {" "}
                        <small>{fillEvent(L.hero.at, { time: date.time })}</small>
                      </>
                    ) : null}
                  </span>
                </p>
              ) : null}
            </div>
            {config.tagline ? <p className="ev-tagline">{config.tagline}</p> : null}
            {stats.length ? (
              <ul className="ev-stats">
                {stats.map((s) => (
                  <li key={s.label} className="ev-stat">
                    <b>{s.n}</b> {s.label}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="ev-cta">
              <a href="#codice" className="btn btn-primary">
                {L.hero.redeemCta}
              </a>
              <a href="#giveaway" className="btn btn-ink">
                {L.hero.howCta}
              </a>
            </div>
            <HeroCast label={L.hero.cast} />
          </div>
          <Tape items={tape} n={1} />
          <Tape items={[...tape].reverse()} n={2} />
        </header>

        <div className="ev-wrap ev-main">
          <div className="ev-lead">
            <EventClockBanner slot="body" units />
            <nav aria-label={config.name} className="ev-nav">
              {nav.map((n) => (
                <a key={n.id} href={`#${n.id}`}>
                  {n.label}
                </a>
              ))}
            </nav>
          </div>

          <Section id="giocatori" labelId="ev-talent" n="01" title={L.talent.title}>
            <TalentSection />
          </Section>

          <Section id="mazzi" labelId="ev-decks" n="02" title={L.decks.title} intro={L.decks.intro}>
            <DrawNote />
            {decks.length ? (
              <ul className="ev-decks">
                {decks.map(({ deck, cards }) => {
                  const legend = cards.legendary ? getCard(cards.legendary) : undefined;
                  return (
                    <li key={deck.id} className="ev-deck" title={deck.note} style={{ "--deck": deck.color, "--deck-ink": inkOn(deck.color) } as CSSProperties}>
                      <span aria-hidden className="ev-deck-dot" />
                      <span className="ev-deck-body">
                        <span className="ev-deck-name">{deck.name}</span>
                        <span className="ev-deck-sub">
                          {legend ? (
                            <span className="ev-deck-leg">
                              <span className="legendary-star" aria-hidden>
                                ★
                              </span>
                              {legend.name}
                            </span>
                          ) : null}
                          <DeckFaces deck={deck.id} />
                        </span>
                      </span>
                      <CopyButton
                        text={deck.code}
                        label={L.decks.copy}
                        copied={L.decks.copied}
                        ariaLabel={fillEvent(L.decks.copyAria, { deck: deck.name })}
                        className="btn btn-primary"
                        event={{ name: "game_code_copy", params: { placement: "event_page" } }}
                      />
                      {cards.om ? (
                        <a
                          href={`/it/deck-builder#${cards.om}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={fillEvent(L.decks.listAria, { deck: deck.name })}
                          className="btn btn-ink"
                          data-om-event="deck_open_builder"
                          data-om-placement="event_page"
                        >
                          {L.decks.list}
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="ev-empty">{L.decks.empty}</p>
            )}
          </Section>

          <Section id="classifica" labelId="ev-standings" n="03" title={L.standings.title} intro={L.standings.intro}>
            <StandingsTable />
          </Section>

          <Section id="abbinamenti" labelId="ev-pairings" n="04" title={L.pairings.title}>
            <PairingsList />
          </Section>

          <Section id="giveaway" labelId="ev-giveaway" n="05" title={L.giveaway.title}>
            <ol className="ev-steps">
              {L.giveaway.steps.map((s) => (
                <li key={s} className="ev-step">
                  {fillEvent(s, { keyword: config.keyword })}
                </li>
              ))}
            </ol>
            <p className="ev-note">{config.maxWinsPerViewer > 1 ? L.giveaway.manyPerPerson : L.giveaway.onePerPerson}</p>
            {config.slots.length ? (
              <div className="ev-schedule">
                <h3 className="ev-h3">{L.giveaway.schedule}</h3>
                <p className="ev-note">{fillEvent(L.giveaway.total, { packs, slots: config.slots.length })}</p>
                <ol className="ev-slots">
                  {config.slots.map((s, i) => (
                    <li key={i} className="ev-slot">
                      <span className="ev-slot-ch">{channelName(s.channel)}</span>
                      <span className="ev-slot-packs">{s.packs === 1 ? L.clock.packsOne : fillEvent(L.clock.packs, { n: s.packs })}</span>
                      <span className="ev-slot-min">{fillEvent(L.giveaway.minutes, { n: s.minutes })}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </Section>

          <EventRedeem slug={slug} kicker={k.codice} />

          <p className="ev-foot">{L.footer}</p>
        </div>
      </div>
    </EventLiveProvider>
  );
}
