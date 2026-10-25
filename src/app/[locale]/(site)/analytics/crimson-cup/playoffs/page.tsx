import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import {
  aliveRanked,
  compact,
  lbMatchesIn,
  lbTopFourRound,
  matchesIn,
  openMatches,
  stretchRounds,
  topFourDecided,
  waitingIn,
  wbMatchesIn,
  type PoPlayer,
  type Side,
} from "@/lib/crimsonPlayoffs";
import { crimsonPlayoffsLabels, fillPo, poRoundLabel } from "@/lib/crimsonPlayoffsLabels";
import { CRIMSON_PLAYOFFS_URL, loadPlayoffs, readPlayoffCreators } from "@/lib/crimsonPlayoffsSource";
import { CRIMSON_RESULT_URL, crimsonFinals } from "@/lib/data/crimsonCup";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { PageNotes } from "@/components/PageNotes";
import { SectionHead } from "@/components/analytics/parts";
import { LocalTime } from "@/components/LocalTime";
import { ClockTime } from "@/components/crimson/ClockTime";
import { PlayoffsExplorer } from "@/components/crimson/PlayoffsExplorer";
import { PlayerName, PlayoffMatchCard, PlayoffTbdCard, type PoMarkText, type PoNames, type PoOm, type PoTuple } from "@/components/crimson/PlayoffMatch";

/*
  Il tabellone dei playoff della Crimson Cup (25/10/2026). Pierluigi, sul visualizzatore di Tourney Bot: "tabellone delle
  semifinali, possiamo riportarlo sul sito fatto meglio". Tourney Bot mostra 500 partite in quindici colonne da scorrere;
  qui, dall'alto: lo stato (in corso, quando è stato letto), i quattro delle finali del 25 ottobre, chi è ancora in corsa
  e dove, le partite aperte, gli ultimi turni dei due tabelloni e infine tutto il tabellone da sfogliare o da cercare per
  giocatore. Accanto ai nomi il segno OriginsMeta per creator, autori, pro e staff del sito con lo stesso account Discord.

  Dati: la risposta pubblica di Tourney Bot (crimsonPlayoffsSource.ts), riletta al massimo una volta al minuto (ISR 60 s).
  Regole: mai il numero di iscritti o di giocatori (come /analytics/crimson-cup), nessun abbinamento indovinato.
  Indicizzabile in tutte le lingue, in sitemap. Stili `.po-*` in fondo a globals.css.
*/
export const revalidate = 60;

const PAGE = "/analytics/crimson-cup/playoffs";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = crimsonPlayoffsLabels[locale];
  return pageMeta(locale, PAGE, L.meta.title, L.meta.description, "/media/news-crimson-cup.webp", { imageAlt: L.h1 });
}

/** Come `fillPo`, ma i segnaposto possono essere nodi (orari, nomi). */
const fillNode = (s: string, v: Record<string, ReactNode>): ReactNode[] =>
  s.split(/(\{\w+\})/).map((part, i) => {
    const k = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={i}>{k && k in v ? v[k] : part}</Fragment>;
  });

export default async function CrimsonPlayoffsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = crimsonPlayoffsLabels[locale];
  const read = await loadPlayoffs();
  const crumbs = (
    <JsonLd
      data={[
        breadcrumbs([
          { name: "OriginsMeta", path: href(locale) },
          { name: d.nav.analytics, path: href(locale, "/analytics") },
          { name: d.nav.crimsonCup, path: href(locale, "/analytics/crimson-cup") },
          { name: L.h1, path: href(locale, PAGE) },
        ]),
      ]}
    />
  );
  const head = (extra?: ReactNode) => (
    <header className="an-wrap an-head">
      <p className="kicker text-mint">
        <Link href={href(locale, "/analytics/crimson-cup")} className="hover:underline">
          {L.kicker}
        </Link>
      </p>
      <h1 className="t-page mt-2">{L.h1}</h1>
      {extra}
      <div className="an-head-actions">
        <Link href={href(locale, "/analytics/crimson-cup")} prefetch={false} className="btn btn-ghost text-xs">
          ← {L.back}
        </Link>
        <a href={CRIMSON_PLAYOFFS_URL} rel="noopener" target="_blank" className="link-mint text-sm font-bold">
          {L.source} ↗
        </a>
        <a href="#how-to-read" className="link-mint text-sm font-bold">
          {L.howTo}
        </a>
      </div>
    </header>
  );

  if (!read) {
    return (
      <div className="an-page">
        {crumbs}
        {head()}
      </div>
    );
  }

  const p = read.data;
  const creators = read.live ? await readPlayoffCreators(p) : new Map<number, { username: string }>();
  const c = compact(p);
  const tuples = new Map<number, PoTuple>(c.matches.map((m) => [m[0], m]));
  const names: PoNames = Object.fromEntries(p.players.map((pl) => [pl.seat, pl.name]));
  const om: PoOm = Object.fromEntries([...creators].map(([seat, v]) => [seat, v.username]));
  const mark: PoMarkText = { label: L.om.label, title: L.om.title, userBase: `${href(locale, "/u")}/` };
  const name = (seat: number) => <PlayerName seat={seat} names={names} om={om} mark={mark} />;
  const roundText = (side: Side, round: number) => poRoundLabel(L, side, round, p.wbRounds, p.lbRounds);

  const decided = topFourDecided(p);
  // il campione (25/10/2026): su Tourney Bot la gran finale è rimasta senza punteggio, il vincitore lo dicono l'annuncio di
  // Koin Games e il post ufficiale (crimsonFinals di data/crimsonCup.ts); si mostra solo se è uno dei giocatori del tabellone
  const seatOf = (username: string) => p.players.find((pl) => pl.name.toLowerCase() === username.toLowerCase())?.seat;
  const champ = crimsonFinals.finalists.find((f) => f.place === 1);
  const runnerUp = crimsonFinals.finalists.find((f) => f.place === 2);
  const championSeat = champ ? seatOf(champ.username) : undefined;
  const finished = championSeat !== undefined;
  const topRound = lbTopFourRound(p.wbRounds);
  const finalists = [...p.finalists.winners, ...p.finalists.losers];
  const alive = aliveRanked(p);
  const open = openMatches(p);
  const stretch = stretchRounds(p);
  const bySeat = new Map(p.players.map((pl) => [pl.seat, pl]));

  const where = (pl: PoPlayer) => {
    if (pl.open !== undefined) {
      const m = p.matches.find((x) => x.id === pl.open);
      if (m) return fillNode(L.alive.playing, { name: name(m.a === pl.seat ? m.b! : m.a!) });
    }
    return pl.next ? fillPo(L.alive.waiting, { round: roundText(pl.next.side, pl.next.round) }) : null;
  };

  /** Una colonna del tabellone: le partite note, chi aspetta l'avversario, i posti ancora da definire. */
  const column = (side: Side, round: number) => {
    const known = matchesIn(p, side, round).sort((x, y) => x.id - y.id);
    const expected = side === "winners" ? wbMatchesIn(p.size, round) : lbMatchesIn(p.size, round);
    const waiting = waitingIn(p, side, round);
    // chi aspetta occupa già metà di una partita: i posti vuoti sono le partite che nessuno occupa ancora
    const missing = Math.max(0, expected - known.length - waiting.length);
    return (
      <section key={`${side}-${round}`} className="po-col" aria-label={roundText(side, round)}>
        <h4 className="po-col-head">{roundText(side, round)}</h4>
        <ol className={side === "winners" ? "is-tree" : ""}>
          {known.map((m) => (
            <PlayoffMatchCard key={m.id} m={tuples.get(m.id)!} names={names} om={om} mark={mark} tbd={L.stretch.tbd} />
          ))}
          {waiting.length ? (
            <li className="po-waiting">
              <span className="kicker an-muted">{L.stretch.waiting}</span>
              <ul>
                {waiting.map((pl) => (
                  <li key={pl.seat}>{name(pl.seat)}</li>
                ))}
              </ul>
            </li>
          ) : null}
          {Array.from({ length: missing }, (_, i) => (
            <PlayoffTbdCard key={`tbd-${i}`} text={L.stretch.tbd} />
          ))}
        </ol>
      </section>
    );
  };

  const slot = (seat: number | undefined, from: string, key: string) => {
    const pl = seat !== undefined ? bySeat.get(seat) : undefined;
    return (
      <li key={key} className={`po-slot${pl ? " is-in" : ""}`}>
        <span className="po-slot-from">{from}</span>
        {pl ? (
          <>
            <span className="po-slot-name">{name(pl.seat)}</span>
            <span className="po-slot-meta">
              <span className="font-mono">
                {pl.wins}–{pl.losses}
              </span>
              <b>{L.finals.sure}</b>
            </span>
          </>
        ) : (
          <span className="po-slot-name an-muted">{L.finals.tbd}</span>
        )}
      </li>
    );
  };

  return (
    <div className="an-page po-page">
      {crumbs}
      {head(
        <div className="po-status">
          <span className={`po-pill${decided || finished ? " is-decided" : ""}`}>
            {decided || finished ? null : <span className="live-dot" aria-hidden="true" />}
            {finished ? L.status.finished : decided ? L.status.decided : L.status.live}
          </span>
          <ul className="po-facts">
            {p.startTime ? <li>{fillNode(L.facts.started, { date: <LocalTime iso={p.startTime} locale={locale} utcLabel={d.tournaments.utc} /> })}</li> : null}
            <li>{fillPo(L.facts.format, { n: p.bestOf })}</li>
            <li>{L.facts.finals}</li>
          </ul>
          {read.at ? (
            <p className="po-read">{fillNode(read.live ? L.facts.read : L.facts.snapshot, { time: <ClockTime iso={read.at} locale={locale} utcLabel={d.tournaments.utc} /> })}</p>
          ) : null}
        </div>,
      )}

      <section className="an-band an-band--stage is-top mt-6" aria-labelledby="po-h-finals">
        <div className="an-wrap">
          <SectionHead num={1} kicker={L.finals.kicker} title={L.finals.title} id="po-h-finals" />
          <p className="po-lead">{fillPo(L.finals.lead, { round: topRound })}</p>
          {finished && champ ? (
            <div className="po-champion">
              <span className="kicker text-gold">{L.champion.kicker}</span>
              <p className="po-champion-title">{fillNode(L.champion.title, { name: name(championSeat!) })}</p>
              <p className="po-lead">{fillPo(L.champion.text, { runnerUp: runnerUp?.name ?? "?" })}</p>
              <p className="po-champion-links">
                <Link href={`${href(locale, "/analytics/crimson-cup")}#finals`} prefetch={false} className="link-mint font-bold">
                  {L.champion.finals} →
                </Link>
                <a href={CRIMSON_RESULT_URL} rel="noopener" target="_blank" className="link-mint font-bold">
                  {L.champion.post} ↗
                </a>
              </p>
            </div>
          ) : null}
          <ol className="po-slots">
            {slot(p.finalists.winners[0], L.finals.fromWinners, "w0")}
            {slot(p.finalists.winners[1], L.finals.fromWinners, "w1")}
            {slot(p.finalists.losers[0], fillPo(L.finals.fromLosers, { round: topRound }), "l0")}
            {slot(p.finalists.losers[1], fillPo(L.finals.fromLosers, { round: topRound }), "l1")}
          </ol>

          {!decided && alive.length ? (
            <div className="mt-10">
              <h3 className="t-item text-sky">{L.alive.title}</h3>
              <ul className="po-alive">
                {alive
                  .filter((pl) => !finalists.includes(pl.seat))
                  .map((pl) => (
                    <li key={pl.seat} className={pl.losses === 0 ? "is-unbeaten" : ""}>
                      <span className="po-alive-name">{name(pl.seat)}</span>
                      <span className="po-alive-rec font-mono" title={fillPo(L.explorer.record, { w: pl.wins, l: pl.losses })}>
                        {pl.wins}–{pl.losses}
                      </span>
                      <span className="po-alive-where">{where(pl)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="an-band" aria-labelledby="po-h-open">
        <div className="an-wrap">
          <SectionHead num={2} kicker={L.open.kicker} title={L.open.title} id="po-h-open" />
          <p className="po-lead">{L.open.lead}</p>
          {open.length ? (
            <ul className="po-grid mt-5">
              {open.map((m) => (
                <PlayoffMatchCard key={m.id} m={tuples.get(m.id)!} names={names} om={om} mark={mark} label={roundText(m.side, m.round)} tbd={L.stretch.tbd} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 an-muted">{L.open.none}</p>
          )}
        </div>
      </section>

      <section className="an-band an-band--deep" aria-labelledby="po-h-stretch">
        <div className="an-wrap">
          <SectionHead num={3} kicker={L.stretch.kicker} title={L.stretch.winnersTitle} id="po-h-stretch" />
          <p className="po-scroll-hint" aria-hidden="true">
            {L.stretch.scroll}
          </p>
          <div className="po-scroller">
            <div className="po-tree">{stretch.winners.map((r) => column("winners", r))}</div>
          </div>
          <h3 className="an-h2 mt-12">{L.stretch.losersTitle}</h3>
          <p className="po-scroll-hint" aria-hidden="true">
            {L.stretch.scroll}
          </p>
          <div className="po-scroller">
            <div className="po-tree">
              {stretch.losers.map((r) => column("losers", r))}
              {p.matches.some((m) => m.side === "grand") ? column("grand", 1) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="an-band" aria-labelledby="po-h-all">
        <div className="an-wrap">
          <SectionHead num={4} kicker={L.explorer.kicker} title={L.explorer.title} id="po-h-all" />
          <div className="mt-6">
            <PlayoffsExplorer
              labels={L}
              players={c.players}
              matches={c.matches}
              om={om}
              mark={mark}
              wbRounds={p.wbRounds}
              lbRounds={p.lbRounds}
              finalists={finalists}
              initialSide={open.some((m) => m.side === "losers") ? 1 : 0}
            />
          </div>
        </div>
      </section>

      <div className="an-wrap an-closing">
        <PageNotes>
          <section id="how-to-read" className="an-notes scroll-mt-36" aria-labelledby="po-h-notes">
            <h2 id="po-h-notes">{L.notes.title}</h2>
            <p>{fillPo(L.notes.format, { n: p.bestOf })}</p>
            <p className="mt-3">{fillPo(L.notes.finals, { round: topRound })}</p>
            <p className="mt-3">{L.notes.waiting}</p>
            <p className="mt-3">
              {L.notes.source}{" "}
              <a href={CRIMSON_PLAYOFFS_URL} rel="noopener" target="_blank" className="link-mint font-bold">
                {L.notes.link} ↗
              </a>
            </p>
            <p className="mt-3">{L.notes.om}</p>
          </section>
        </PageNotes>
      </div>
    </div>
  );
}
