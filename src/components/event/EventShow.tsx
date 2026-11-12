import type { CSSProperties, ReactNode } from "react";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { totalPacks } from "@/lib/event/config";
import { startHasTime } from "@/lib/event/clock";
import { isHidden, type EventDeck } from "@/lib/event/types";
import type { DeckCards, PublicEventView } from "@/lib/event/server";
import { LOOK_KICKERS, inkOn, splitEventName, type EventLook, type EventSectionId } from "@/lib/event/looks";
import { getCard } from "@/lib/data/cards";
import { CopyButton } from "@/components/CopyButton";
import { EventLiveProvider } from "./EventLive";
import { EventClockBanner } from "./EventClock";
import { DeckFaces, DrawNote, HeroCast, PairingsList, StandingsTable, TalentSection } from "./EventBoard";
import { EventRedeem } from "./EventRedeem";
import "./event-show.css";
import "./event-look-a.css";
import "./event-look-b.css";
import "./event-look-c.css";

/*
  La pagina di un evento con una grafica sua (prove dell'11/11/2026, Pierluigi: "riusciamo a dargli un taglio e una
  grafica più accattivante? rendiamola più bella e divertente, fai qualche tentativo"). Stessi dati e stesse sezioni
  della pagina di oggi; cambia la testata (una per taglio: locandina, ruota, arcade) e la pelle delle sezioni, tutta nei
  fogli di stile event-look-<a|b|c>.css appesi alle classi `ev-*`. Solo palette e font del sito, niente materiale Koin;
  le decorazioni sono nascoste ai lettori di schermo e con "riduci animazioni" tutto resta fermo (regola del sito).
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

function Section({ id, labelId, n, look, title, intro, children }: { id: EventSectionId; labelId: string; n: string; look: EventLook; title: string; intro?: string; children: ReactNode }) {
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
          <p className="ev-head-k">{LOOK_KICKERS[look][id]}</p>
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

/** Taglio A: due nastri che scorrono in fondo alla testata (decorazione: le stesse parole stanno già nella pagina). */
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

const WHEEL_FALLBACK = ["#3fc4e8", "#ff3d9a", "#f2d23c", "#31e3bd", "#c4b0ff", "#ffb454", "#c81e7a", "#1a9ec4"];

/** Taglio B: la ruota dei mazzi come disegno (la ruota vera la girano i caster dalla regia). Uno spicchio per mazzo. */
function WheelArt({ decks }: { decks: EventDeck[] }) {
  const wedges = decks.length >= 2 ? decks.map((d) => ({ color: d.color, name: d.name })) : WHEEL_FALLBACK.map((color) => ({ color, name: "" }));
  const n = wedges.length;
  const C = 200;
  const R = 166;
  const at = (deg: number, r: number): [number, number] => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [Math.round((C + r * Math.cos(a)) * 100) / 100, Math.round((C + r * Math.sin(a)) * 100) / 100];
  };
  const bulbs = 24;
  return (
    <div className="ev-wheel" aria-hidden>
      <svg viewBox="0 0 400 400" className="ev-wheel-disc">
        <circle cx={C} cy={C} r={197} fill="#16102a" />
        <circle cx={C} cy={C} r={191} fill="none" stroke="#f2d23c" strokeWidth={3} />
        {wedges.map((w, i) => {
          const [x0, y0] = at((360 / n) * i, R);
          const [x1, y1] = at((360 / n) * (i + 1), R);
          const mid = (360 / n) * (i + 0.5);
          const [tx, ty] = at(mid, R * 0.62);
          return (
            <g key={i}>
              <path d={`M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={w.color} stroke="#16102a" strokeWidth={4} strokeLinejoin="round" />
              {w.name && n <= 12 ? (
                <text x={tx} y={ty} fill={inkOn(w.color)} fontSize={13} fontWeight={700} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid > 180 ? mid + 90 : mid - 90} ${tx} ${ty})`} style={{ fontFamily: "var(--font-manrope), sans-serif" }}>
                  {w.name.length > 15 ? `${w.name.slice(0, 14)}…` : w.name}
                </text>
              ) : null}
            </g>
          );
        })}
        {Array.from({ length: bulbs }, (_, i) => {
          const [x, y] = at((360 / bulbs) * i, 181);
          return <circle key={i} className="ev-bulb" cx={x} cy={y} r={5} fill={i % 2 ? "#31e3bd" : "#f2d23c"} />;
        })}
        <circle cx={C} cy={C} r={34} fill="#16102a" stroke="#3fc4e8" strokeWidth={5} />
        <path d="M200 178l6.5 14.5 15.8 1.6-11.8 10.6 3.4 15.5L200 212.6l-13.9 7.6 3.4-15.5-11.8-10.6 15.8-1.6z" fill="#f2d23c" />
      </svg>
      <svg viewBox="0 0 400 400" className="ev-wheel-pin">
        <path d="M176 4h48l-24 50z" fill="#ff3d9a" stroke="#16102a" strokeWidth={5} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const CONFETTI: { x: number; y: number; s: number; r: number; c: string; k: "dot" | "sq" | "tri" | "ring" }[] = [
  { x: 3, y: 12, s: 14, r: 0, c: "gold", k: "dot" },
  { x: 9, y: 78, s: 16, r: 24, c: "pink", k: "sq" },
  { x: 16, y: 4, s: 18, r: -12, c: "mint", k: "tri" },
  { x: 27, y: 88, s: 20, r: 0, c: "sky", k: "ring" },
  { x: 38, y: 6, s: 12, r: 40, c: "violet", k: "sq" },
  { x: 47, y: 92, s: 14, r: 0, c: "gold", k: "dot" },
  { x: 52, y: 10, s: 22, r: 0, c: "pink", k: "ring" },
  { x: 58, y: 70, s: 16, r: 18, c: "mint", k: "tri" },
  { x: 71, y: 3, s: 14, r: -20, c: "orange", k: "sq" },
  { x: 82, y: 90, s: 18, r: 30, c: "gold", k: "tri" },
  { x: 91, y: 8, s: 12, r: 0, c: "sky", k: "dot" },
  { x: 96, y: 64, s: 16, r: 12, c: "violet", k: "sq" },
];

export function EventShow({ slug, event, decks, look }: { slug: string; event: PublicEventView; decks: DeckView[]; look: EventLook }) {
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
  const k = LOOK_KICKERS[look];

  return (
    <EventLiveProvider slug={slug} initial={event}>
      <div className={`ev ev--${look}`}>
        <div className="ev-wrap ev-top">
          <EventClockBanner slot="top" units />
        </div>
        <header className="ev-hero">
          {look === "b" ? (
            <div className="ev-confetti" aria-hidden>
              {CONFETTI.map((c, i) => (
                <i key={i} className={`ev-conf ev-conf--${c.k}`} style={{ left: `${c.x}%`, top: `${c.y}%`, "--s": `${c.s}px`, "--r": `${c.r}deg`, "--c": `var(--ev-${c.c})`, "--d": `${(i % 5) * -1.3}s` } as CSSProperties} />
              ))}
            </div>
          ) : null}
          {look === "c" ? <div className="ev-grid" aria-hidden /> : null}
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
            {look === "b" ? <WheelArt decks={config.decks} /> : null}
          </div>
          {look === "a" ? (
            <>
              <Tape items={tape} n={1} />
              <Tape items={[...tape].reverse()} n={2} />
            </>
          ) : null}
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

          <Section id="giocatori" labelId="ev-talent" n="01" look={look} title={L.talent.title}>
            <TalentSection />
          </Section>

          <Section id="mazzi" labelId="ev-decks" n="02" look={look} title={L.decks.title} intro={L.decks.intro}>
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

          <Section id="classifica" labelId="ev-standings" n="03" look={look} title={L.standings.title} intro={L.standings.intro}>
            <StandingsTable />
          </Section>

          <Section id="abbinamenti" labelId="ev-pairings" n="04" look={look} title={L.pairings.title}>
            <PairingsList />
          </Section>

          <Section id="giveaway" labelId="ev-giveaway" n="05" look={look} title={L.giveaway.title}>
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
